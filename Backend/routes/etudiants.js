// routes/etudiants.js — Gestion des utilisateurs par filière/niveau
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/etudiants/filiere/:filiere_id/niveau/:niveau_id
// Liste des étudiants et délégués d'un niveau
router.get('/filiere/:filiere_id/niveau/:niveau_id', auth, async (req, res) => {
  try {
    const { filiere_id, niveau_id } = req.params;
    const user = req.user;

    // Accès limité pour étudiants d'autres filières
    const autreFiliere = user.rang !== 'professeur' && parseInt(filiere_id) !== user.filiere_id;

    let query, params;
    if (autreFiliere) {
      // Lecture seule: seulement nom et prénom
      query = `
        SELECT id, nom, prenom, rang, matricule
        FROM users
        WHERE filiere_id = $1 AND niveau_id = $2 AND rang != 'professeur' AND actif = TRUE
        ORDER BY rang DESC, nom
      `;
      params = [filiere_id, niveau_id];
    } else {
      // Accès complet à sa propre filière
      query = `
        SELECT u.id, u.nom, u.prenom, u.rang, u.matricule, 
               u.date_naissance, u.lieu_naissance, u.email,
               n.code as niveau_code
        FROM users u
        LEFT JOIN niveaux n ON u.niveau_id = n.id
        WHERE u.filiere_id = $1 AND u.niveau_id = $2 
        AND u.rang != 'professeur' AND u.actif = TRUE
        ORDER BY u.rang DESC, u.nom
      `;
      params = [filiere_id, niveau_id];
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      etudiants: result.rows,
      total: result.rows.length,
      lecture_seule: autreFiliere
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/etudiants/filiere/:filiere_id/niveau/:niveau_id/professeurs
// Liste des professeurs qui enseignent dans ce niveau
router.get('/filiere/:filiere_id/niveau/:niveau_id/professeurs', auth, async (req, res) => {
  try {
    const { filiere_id, niveau_id } = req.params;

    const result = await pool.query(
      `SELECT DISTINCT u.id, u.nom, u.prenom, u.email,
              COUNT(DISTINCT p.ue_id) as nb_ues
       FROM users u
       JOIN professeur_ue p ON u.id = p.professeur_id
       JOIN unites_enseignement ue ON p.ue_id = ue.id
       WHERE ue.filiere_id = $1 AND ue.niveau_id = $2 AND u.actif = TRUE
       GROUP BY u.id
       ORDER BY u.nom`,
      [filiere_id, niveau_id]
    );

    res.json({ success: true, professeurs: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;