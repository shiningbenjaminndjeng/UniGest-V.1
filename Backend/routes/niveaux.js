// routes/niveaux.js — Liste des niveaux scolaires
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/niveaux — Tous les niveaux (utilisé à l'inscription)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM niveaux ORDER BY ordre'
    );
    res.json({ success: true, niveaux: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;