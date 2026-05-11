// routes/discussions.js — Messages et discussions avec gestion des permissions
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
       LIMIT 100`,
      [filiere_id, niveau_id]
    );

    // Récupérer les permissions
    const permResult = await pool.query(
      `SELECT ouvert_a_tous FROM discussion_permissions 
       WHERE filiere_id = $1 AND niveau_id = $2`,
      [filiere_id, niveau_id]
    );
    const ouvert_a_tous = permResult.rows[0]?.ouvert_a_tous ?? false;

    res.json({ success: true, discussions: result.rows, ouvert_a_tous });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/discussions/permissions/:filiere_id/:niveau_id
router.get('/permissions/:filiere_id/:niveau_id', auth, async (req, res) => {
  try {
    const { filiere_id, niveau_id } = req.params;
    const result = await pool.query(
      `SELECT ouvert_a_tous FROM discussion_permissions 
       WHERE filiere_id = $1 AND niveau_id = $2`,
      [filiere_id, niveau_id]
    );
    res.json({ success: true, ouvert_a_tous: result.rows[0]?.ouvert_a_tous ?? false });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/discussions/permissions — Délégué toggle les permissions
router.put('/permissions', auth, checkRang(['delegue']), async (req, res) => {
  try {
    const { filiere_id, niveau_id, ouvert_a_tous } = req.body;
    const user = req.user;

    if (parseInt(filiere_id) !== user.filiere_id || parseInt(niveau_id) !== user.niveau_id) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    await pool.query(
      `INSERT INTO discussion_permissions (filiere_id, niveau_id, ouvert_a_tous, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (filiere_id, niveau_id) DO UPDATE 
       SET ouvert_a_tous = $3, updated_by = $4, updated_at = NOW()`,
      [filiere_id, niveau_id, ouvert_a_tous, user.id]
    );

    // Notifier via socket
    const io = req.app.get('io');
    io.to(`filiere_${filiere_id}_niveau_${niveau_id}`).emit('permission_changed', {
      ouvert_a_tous,
      message: ouvert_a_tous 
        ? '💬 La discussion est maintenant ouverte à tous' 
        : '🔒 La discussion est maintenant réservée aux délégués'
    });

    res.json({ success: true, ouvert_a_tous });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/discussions — Envoyer un message
router.post('/', auth, upload.single('audio'), async (req, res) => {
  try {
    const { contenu, type, filiere_id, niveau_id } = req.body;
    const user = req.user;

    // Vérifier appartenance
    if (parseInt(filiere_id) !== user.filiere_id || parseInt(niveau_id) !== user.niveau_id) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    // Vérifier permissions si étudiant simple
    if (user.rang === 'etudiant') {
      const permResult = await pool.query(
        `SELECT ouvert_a_tous FROM discussion_permissions 
         WHERE filiere_id = $1 AND niveau_id = $2`,
        [filiere_id, niveau_id]
      );
      const ouvert = permResult.rows[0]?.ouvert_a_tous ?? false;
      if (!ouvert) {
        return res.status(403).json({ 
          success: false, 
          message: 'La discussion est actuellement réservée aux délégués' 
        });
      }
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
      message: `💬 ${user.prenom} ${user.nom}: ${contenu?.substring(0, 50) || 'Message vocal'}`,
      discussion: {
        ...discussion,
        nom: user.nom,
        prenom: user.prenom,
        rang: user.rang
      },
      type: 'discussion',
      source: 'discussion'
    });

    res.status(201).json({ success: true, discussion: { ...discussion, nom: user.nom, prenom: user.prenom, rang: user.rang } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/discussions/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const disc = await pool.query('SELECT * FROM discussions WHERE id = $1', [req.params.id]);
    if (!disc.rows[0]) return res.status(404).json({ success: false, message: 'Message introuvable' });

    const d = disc.rows[0];
    const user = req.user;

    // Créateur ou délégué de la filière
    if (d.created_by !== user.id && user.rang !== 'delegue' && user.rang !== 'professeur') {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    await pool.query('DELETE FROM discussions WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Message supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;