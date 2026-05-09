// routes/notes.js — Gestion des notes/résultats
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { checkRang } = require('../middleware/checkRole');
const upload = require('../middleware/upload');

// GET /api/notes/filiere/:filiere_id/niveau/:niveau_id
router.get('/filiere/:filiere_id/niveau/:niveau_id', auth, async (req, res) => {
  try {
    const { filiere_id, niveau_id } = req.params;
    const result = await pool.query(
      `SELECT n.*, u.nom as auteur_nom, u.prenom as auteur_prenom, u.rang as auteur_rang,
              ue.nom as ue_nom
       FROM notes n
       JOIN users u ON n.created_by = u.id
       LEFT JOIN unites_enseignement ue ON n.ue_id = ue.id
       WHERE n.filiere_id = $1 AND n.niveau_id = $2
       ORDER BY n.created_at DESC`,
      [filiere_id, niveau_id]
    );
    res.json({ success: true, notes: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/notes — Ajouter notes (professeur ou délégué)
router.post('/', auth, checkRang(['professeur', 'delegue']), upload.single('fichier'), async (req, res) => {
  try {
    const { titre, description, type, contenu, filiere_id, niveau_id, ue_id } = req.body;
    const user = req.user;

    // Délégué: uniquement sa filière/niveau
    if (user.rang === 'delegue') {
      if (parseInt(filiere_id) !== user.filiere_id || parseInt(niveau_id) !== user.niveau_id) {
        return res.status(403).json({ success: false, message: 'Non autorisé' });
      }
    }

    let finalContenu = contenu;
    if (req.file) {
      finalContenu = `/uploads/notes/${req.file.filename}`;
    }

    const result = await pool.query(
      `INSERT INTO notes (titre, description, type, contenu, filiere_id, niveau_id, ue_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [titre, description, type, finalContenu, filiere_id, niveau_id, ue_id || null, user.id]
    );

    res.status(201).json({ success: true, note: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/notes/:id — Supprimer
router.delete('/:id', auth, checkRang(['professeur', 'delegue']), async (req, res) => {
  try {
    const note = await pool.query('SELECT * FROM notes WHERE id = $1', [req.params.id]);
    if (!note.rows[0]) return res.status(404).json({ success: false, message: 'Note introuvable' });

    // Seulement le créateur peut supprimer
    if (note.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Vous ne pouvez supprimer que vos propres notes' });
    }

    await pool.query('DELETE FROM notes WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Note supprimée' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;