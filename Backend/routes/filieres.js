// routes/filieres.js — Accès aux données d'une filière par niveau
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { checkPerimetre } = require('../middleware/checkRole');

// GET /api/filieres/:filiere_id/niveaux — Niveaux disponibles dans une filière
router.get('/:filiere_id/niveaux', auth, async (req, res) => {
  try {
    const { filiere_id } = req.params;
    const user = req.user;

    // Si étudiant/délégué: seulement son niveau
    if (user.rang !== 'professeur') {
      if (parseInt(filiere_id) !== user.filiere_id) {
        // Accès lecture seule sur autres filières
        const result = await pool.query(
          `SELECT n.*, COUNT(DISTINCT u.id) as nb_etudiants
           FROM niveaux n
           LEFT JOIN users u ON u.niveau_id = n.id AND u.filiere_id = $1 AND u.actif = TRUE
           GROUP BY n.id ORDER BY n.ordre`,
          [filiere_id]
        );
        return res.json({ success: true, niveaux: result.rows, lecture_seule: true });
      }
      // Sa propre filière, son niveau seulement
      const result = await pool.query(
        `SELECT n.*, COUNT(DISTINCT u.id) as nb_etudiants
         FROM niveaux n
         LEFT JOIN users u ON u.niveau_id = n.id AND u.filiere_id = $1 AND u.actif = TRUE
         WHERE n.id = $2
         GROUP BY n.id`,
        [filiere_id, user.niveau_id]
      );
      return res.json({ success: true, niveaux: result.rows });
    }

    // Professeur: tous les niveaux
    const result = await pool.query(
      `SELECT n.*, COUNT(DISTINCT u.id) as nb_etudiants
       FROM niveaux n
       LEFT JOIN users u ON u.niveau_id = n.id AND u.filiere_id = $1 AND u.actif = TRUE
       GROUP BY n.id ORDER BY n.ordre`,
      [filiere_id]
    );
    res.json({ success: true, niveaux: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/filieres/:filiere_id/niveau/:niveau_id/stats
// Statistiques globales du niveau
router.get('/:filiere_id/niveau/:niveau_id/stats', auth, async (req, res) => {
  try {
    const { filiere_id, niveau_id } = req.params;

    const [etudiants, delegues, profs, ues] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) as nb FROM users 
         WHERE filiere_id=$1 AND niveau_id=$2 AND rang='etudiant' AND actif=TRUE`,
        [filiere_id, niveau_id]
      ),
      pool.query(
        `SELECT COUNT(*) as nb FROM users 
         WHERE filiere_id=$1 AND niveau_id=$2 AND rang='delegue' AND actif=TRUE`,
        [filiere_id, niveau_id]
      ),
      pool.query(
        `SELECT COUNT(DISTINCT p.professeur_id) as nb 
         FROM professeur_ue p
         JOIN unites_enseignement ue ON p.ue_id = ue.id
         WHERE ue.filiere_id=$1 AND ue.niveau_id=$2`,
        [filiere_id, niveau_id]
      ),
      pool.query(
        `SELECT COUNT(*) as nb FROM unites_enseignement 
         WHERE filiere_id=$1 AND niveau_id=$2`,
        [filiere_id, niveau_id]
      )
    ]);

    res.json({
      success: true,
      stats: {
        nb_etudiants: parseInt(etudiants.rows[0].nb),
        nb_delegues: parseInt(delegues.rows[0].nb),
        nb_professeurs: parseInt(profs.rows[0].nb),
        nb_ues: parseInt(ues.rows[0].nb)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;