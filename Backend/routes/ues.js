// routes/ues.js — Unités d'Enseignement + consultation des inscrits
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { checkRang } = require('../middleware/checkRole');

// GET /api/ues/filiere/:filiere_id/niveau/:niveau_id
router.get('/filiere/:filiere_id/niveau/:niveau_id', auth, async (req, res) => {
  try {
    const { filiere_id, niveau_id } = req.params;

    const result = await pool.query(
      `SELECT ue.*,
              json_agg(DISTINCT jsonb_build_object(
                'id', u.id, 'nom', u.nom, 'prenom', u.prenom
              )) FILTER (WHERE u.id IS NOT NULL) as professeurs,
              COUNT(DISTINCT eu.etudiant_id) as nb_inscrits
       FROM unites_enseignement ue
       LEFT JOIN professeur_ue pu ON ue.id = pu.ue_id
       LEFT JOIN users u ON pu.professeur_id = u.id
       LEFT JOIN etudiant_ue eu ON ue.id = eu.ue_id
       WHERE ue.filiere_id = $1 AND ue.niveau_id = $2
       GROUP BY ue.id
       ORDER BY ue.semestre, ue.nom`,
      [filiere_id, niveau_id]
    );

    let inscriptions = [];
    if (req.user.rang !== 'professeur') {
      const inscResult = await pool.query(
        `SELECT ue_id FROM etudiant_ue WHERE etudiant_id = $1`,
        [req.user.id]
      );
      inscriptions = inscResult.rows.map(r => r.ue_id);
    }

    const ues = result.rows.map(ue => ({
      ...ue,
      est_inscrit: inscriptions.includes(ue.id)
    }));

    res.json({
      success: true,
      ues,
      semestre1: ues.filter(u => u.semestre === 1),
      semestre2: ues.filter(u => u.semestre === 2)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/ues/:id/etudiants — Étudiants inscrits à une UE
router.get('/:id/etudiants', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const ueResult = await pool.query('SELECT * FROM unites_enseignement WHERE id = $1', [id]);
    if (ueResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'UE introuvable' });
    }
    const ue = ueResult.rows[0];

    const user = req.user;
    if (user.rang !== 'professeur') {
      if (ue.filiere_id !== user.filiere_id || ue.niveau_id !== user.niveau_id) {
        return res.status(403).json({ success: false, message: 'Accès non autorisé' });
      }
    }

    const result = await pool.query(
      `SELECT u.id, u.nom, u.prenom, u.rang, u.matricule, u.email,
              u.date_naissance, u.lieu_naissance,
              n.code as niveau_code, f.nom as filiere_nom,
              eu.date_inscription
       FROM etudiant_ue eu
       JOIN users u ON eu.etudiant_id = u.id
       LEFT JOIN niveaux n ON u.niveau_id = n.id
       LEFT JOIN filieres f ON u.filiere_id = f.id
       WHERE eu.ue_id = $1 AND u.actif = TRUE
       ORDER BY u.rang DESC, u.nom, u.prenom`,
      [id]
    );

    res.json({
      success: true,
      etudiants: result.rows,
      total: result.rows.length,
      ue: {
        id: ue.id, nom: ue.nom, code: ue.code,
        credits: ue.credits, semestre: ue.semestre
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/ues
router.post('/', auth, checkRang(['delegue']), async (req, res) => {
  try {
    const { code, nom, description, credits, semestre, filiere_id, niveau_id } = req.body;
    const user = req.user;

    if (parseInt(filiere_id) !== user.filiere_id || parseInt(niveau_id) !== user.niveau_id) {
      return res.status(403).json({ success: false, message: 'Action non autorisée dans cette filière' });
    }

    const result = await pool.query(
      `INSERT INTO unites_enseignement (code, nom, description, credits, semestre, filiere_id, niveau_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [code, nom, description, credits || 3, semestre, filiere_id, niveau_id, user.id]
    );

    res.status(201).json({ success: true, message: 'UE créée avec succès', ue: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/ues/:id
router.delete('/:id', auth, checkRang(['delegue']), async (req, res) => {
  try {
    const ue = await pool.query('SELECT * FROM unites_enseignement WHERE id = $1', [req.params.id]);
    if (ue.rows.length === 0) return res.status(404).json({ success: false, message: 'UE introuvable' });

    const ueData = ue.rows[0];
    if (ueData.filiere_id !== req.user.filiere_id || ueData.niveau_id !== req.user.niveau_id) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    await pool.query('DELETE FROM unites_enseignement WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'UE supprimée' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/ues/:id/inscrire
router.post('/:id/inscrire', auth, checkRang(['etudiant', 'delegue']), async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO etudiant_ue (etudiant_id, ue_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, req.params.id]
    );
    res.json({ success: true, message: 'Inscrit avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/ues/:id/desinscrire
router.delete('/:id/desinscrire', auth, checkRang(['etudiant', 'delegue']), async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM etudiant_ue WHERE etudiant_id = $1 AND ue_id = $2',
      [req.user.id, req.params.id]
    );
    res.json({ success: true, message: 'Désinscription réussie' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/ues/:id/assigner-prof
router.post('/:id/assigner-prof', auth, checkRang(['professeur']), async (req, res) => {
  try {
    const ue = await pool.query('SELECT * FROM unites_enseignement WHERE id = $1', [req.params.id]);
    if (ue.rows.length === 0) return res.status(404).json({ success: false, message: 'UE introuvable' });

    await pool.query(
      `INSERT INTO professeur_ue (professeur_id, ue_id, filiere_id)
       VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [req.user.id, req.params.id, ue.rows[0].filiere_id]
    );
    res.json({ success: true, message: 'Assigné à l\'UE avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;