// routes/discussions.js — Messages et discussions (délégués)
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { checkRang } = require('../middleware/checkRole');
const upload = require('../middleware/upload');

// GET /api/discussions/filiere/:filiere_id/niveau/:niveau_id
router.get('/filiere/:filiere_id/niveau/:niveau_id', auth, async (req, res) => {
  try {
    const { filiere_id, niveau_id } = req.params;
    const result = await pool.query(
      `SELECT d.*, u.nom, u.prenom, u.rang
       FROM discussions d
       JOIN users u ON d.created_by = u.id
       WHERE d.filiere_id = $1 AND d.niveau_id = $2
       ORDER BY d.created_at DESC
       LIMIT 50`,
      [filiere_id, niveau_id]
    );
    res.json({ success: true, discussions: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/discussions — Envoyer un message (délégué)
router.post('/', auth, checkRang(['delegue']), upload.single('audio'), async (req, res) => {
  try {
    const { contenu, type, filiere_id, niveau_id } = req.body;
    const user = req.user;

    if (parseInt(filiere_id) !== user.filiere_id || parseInt(niveau_id) !== user.niveau_id) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const media_url = req.file ? `/uploads/discussions/${req.file.filename}` : null;

    const result = await pool.query(
      `INSERT INTO discussions (contenu, type, media_url, filiere_id, niveau_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [contenu, type || 'texte', media_url, filiere_id, niveau_id, user.id]
    );

    const discussion = result.rows[0];

    // Notification temps réel
    const io = req.app.get('io');
    io.to(`filiere_${filiere_id}_niveau_${niveau_id}`).emit('nouvelle_discussion', {
      message: `Nouvelle consigne du délégué`,
      discussion: {
        ...discussion,
        nom: user.nom,
        prenom: user.prenom,
        rang: user.rang
      }
    });

    res.status(201).json({ success: true, discussion });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/discussions/:id
router.delete('/:id', auth, checkRang(['delegue']), async (req, res) => {
  try {
    const disc = await pool.query('SELECT * FROM discussions WHERE id = $1', [req.params.id]);
    if (!disc.rows[0] || disc.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }
    await pool.query('DELETE FROM discussions WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Discussion supprimée' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;