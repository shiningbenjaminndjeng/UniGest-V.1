// routes/evenements.js — Gestion des événements
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { checkRang } = require('../middleware/checkRole');
const upload = require('../middleware/upload');

// GET /api/evenements/filiere/:filiere_id/niveau/:niveau_id
router.get('/filiere/:filiere_id/niveau/:niveau_id', auth, async (req, res) => {
  try {
    const { filiere_id, niveau_id } = req.params;
    const result = await pool.query(
      `SELECT e.*, u.nom as auteur_nom, u.prenom as auteur_prenom
       FROM evenements e
       JOIN users u ON e.created_by = u.id
       WHERE e.filiere_id = $1 AND e.niveau_id = $2
       ORDER BY e.created_at DESC`,
      [filiere_id, niveau_id]
    );
    res.json({ success: true, evenements: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/evenements — Créer un événement (délégué)
router.post('/', auth, checkRang(['delegue']), upload.single('media'), async (req, res) => {
  try {
    const { titre, description, type, filiere_id, niveau_id, date_evenement } = req.body;
    const user = req.user;

    if (parseInt(filiere_id) !== user.filiere_id || parseInt(niveau_id) !== user.niveau_id) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const media_url = req.file ? `/uploads/evenements/${req.file.filename}` : null;
    const media_type = req.file ? (req.file.mimetype.startsWith('image') ? 'image' : 
                                   req.file.mimetype.startsWith('video') ? 'video' : 'document') : null;

    const result = await pool.query(
      `INSERT INTO evenements (titre, description, type, media_url, media_type, filiere_id, niveau_id, date_evenement, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [titre, description, type, media_url, media_type, filiere_id, niveau_id, date_evenement, user.id]
    );

    // Notification temps réel
    const io = req.app.get('io');
    io.to(`filiere_${filiere_id}_niveau_${niveau_id}`).emit('nouvel_evenement', {
      message: `Nouvel événement: ${titre}`,
      evenement: result.rows[0]
    });

    res.status(201).json({ success: true, evenement: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/evenements/:id — Supprimer (délégué)
router.delete('/:id', auth, checkRang(['delegue']), async (req, res) => {
  try {
    const ev = await pool.query('SELECT * FROM evenements WHERE id = $1', [req.params.id]);
    if (!ev.rows[0] || ev.rows[0].filiere_id !== req.user.filiere_id) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }
    await pool.query('DELETE FROM evenements WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Événement supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;