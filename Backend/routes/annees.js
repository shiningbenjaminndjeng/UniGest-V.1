// routes/annees.js — Années scolaires
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/annees — Liste des années scolaires
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM annees_scolaires ORDER BY date_debut DESC');
    res.json({ success: true, annees: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/annees/active — Année scolaire active
router.get('/active', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM annees_scolaires WHERE active = TRUE LIMIT 1'
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Aucune année scolaire active' });
    }
    res.json({ success: true, annee: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;