// routes/facultes.js — Gestion des facultés et filières
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/facultes — Liste de toutes les facultés
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM facultes ORDER BY nom'
    );
    res.json({ success: true, facultes: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/facultes/:id/filieres — Filières d'une faculté
router.get('/:id/filieres', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT f.*, 
              COUNT(DISTINCT u.id) FILTER (WHERE u.actif = TRUE) as nb_etudiants
       FROM filieres f
       LEFT JOIN users u ON f.id = u.filiere_id AND u.rang != 'professeur'
       WHERE f.faculte_id = $1
       GROUP BY f.id
       ORDER BY f.nom`,
      [req.params.id]
    );
    res.json({ success: true, filieres: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;