// routes/messagerie.js — Messagerie privée entre utilisateurs
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/messagerie/conversations — Liste des conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT DISTINCT ON (other_user_id)
         CASE WHEN m.expediteur_id = $1 THEN m.destinataire_id ELSE m.expediteur_id END as other_user_id,
         u.nom, u.prenom, u.rang, u.niveau_id, n.code as niveau_code, f.nom as filiere_nom,
         m.contenu as dernier_message,
         m.created_at as derniere_activite,
         m.lu,
         m.expediteur_id,
         (SELECT COUNT(*) FROM messages_prives mp2 
          WHERE mp2.destinataire_id = $1 AND mp2.expediteur_id = u.id AND mp2.lu = FALSE) as nb_non_lus
       FROM messages_prives m
       JOIN users u ON (CASE WHEN m.expediteur_id = $1 THEN m.destinataire_id ELSE m.expediteur_id END) = u.id
       LEFT JOIN niveaux n ON u.niveau_id = n.id
       LEFT JOIN filieres f ON u.filiere_id = f.id
       WHERE m.expediteur_id = $1 OR m.destinataire_id = $1
       ORDER BY other_user_id, m.created_at DESC`,
      [userId]
    );

    // Trier par dernière activité
    const convs = result.rows.sort((a, b) => new Date(b.derniere_activite) - new Date(a.derniere_activite));
    res.json({ success: true, conversations: convs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/messagerie/:user_id — Messages avec un utilisateur
router.get('/:user_id', auth, async (req, res) => {
  try {
    const { user_id } = req.params;
    const me = req.user.id;

    const result = await pool.query(
      `SELECT m.*, 
              u_exp.nom as exp_nom, u_exp.prenom as exp_prenom,
              u_dest.nom as dest_nom, u_dest.prenom as dest_prenom
       FROM messages_prives m
       JOIN users u_exp ON m.expediteur_id = u_exp.id
       JOIN users u_dest ON m.destinataire_id = u_dest.id
       WHERE (m.expediteur_id = $1 AND m.destinataire_id = $2)
          OR (m.expediteur_id = $2 AND m.destinataire_id = $1)
       ORDER BY m.created_at ASC
       LIMIT 100`,
      [me, user_id]
    );

    // Marquer comme lus
    await pool.query(
      `UPDATE messages_prives SET lu = TRUE, lu_at = NOW()
       WHERE destinataire_id = $1 AND expediteur_id = $2 AND lu = FALSE`,
      [me, user_id]
    );

    // Infos de l'autre utilisateur
    const otherUser = await pool.query(
      `SELECT u.id, u.nom, u.prenom, u.rang, n.code as niveau_code, f.nom as filiere_nom
       FROM users u
       LEFT JOIN niveaux n ON u.niveau_id = n.id
       LEFT JOIN filieres f ON u.filiere_id = f.id
       WHERE u.id = $1`,
      [user_id]
    );

    res.json({ 
      success: true, 
      messages: result.rows,
      interlocuteur: otherUser.rows[0] || null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/messagerie/:user_id — Envoyer un message
router.post('/:user_id', auth, async (req, res) => {
  try {
    const { user_id } = req.params;
    const { contenu } = req.body;
    const me = req.user;

    if (!contenu?.trim()) {
      return res.status(400).json({ success: false, message: 'Message vide' });
    }

    // Vérifier que le destinataire existe
    const dest = await pool.query('SELECT id, nom, prenom FROM users WHERE id = $1 AND actif = TRUE', [user_id]);
    if (dest.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    const result = await pool.query(
      `INSERT INTO messages_prives (expediteur_id, destinataire_id, contenu)
       VALUES ($1,$2,$3) RETURNING *`,
      [me.id, user_id, contenu.trim()]
    );

    const message = result.rows[0];

    // Notification socket au destinataire
    const io = req.app.get('io');
    io.to(`user_${user_id}`).emit('nouveau_message_prive', {
      message: `💌 ${me.prenom} ${me.nom}: ${contenu.substring(0, 50)}`,
      from: { id: me.id, nom: me.nom, prenom: me.prenom },
      msg: message,
      type: 'message_prive'
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/messagerie/non-lus/count — Compteur de messages non lus
router.get('/non-lus/count', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as total FROM messages_prives WHERE destinataire_id = $1 AND lu = FALSE',
      [req.user.id]
    );
    res.json({ success: true, total: parseInt(result.rows[0].total) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/messagerie/users/search?q= — Rechercher des utilisateurs pour démarrer une conv
router.get('/users/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ success: true, users: [] });

    const result = await pool.query(
      `SELECT u.id, u.nom, u.prenom, u.rang, n.code as niveau_code, f.nom as filiere_nom
       FROM users u
       LEFT JOIN niveaux n ON u.niveau_id = n.id
       LEFT JOIN filieres f ON u.filiere_id = f.id
       WHERE u.id != $1 AND u.actif = TRUE
         AND (u.nom ILIKE $2 OR u.prenom ILIKE $2 OR CONCAT(u.prenom, ' ', u.nom) ILIKE $2)
       LIMIT 10`,
      [req.user.id, `%${q}%`]
    );

    res.json({ success: true, users: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;