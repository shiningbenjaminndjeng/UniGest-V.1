// routes/cours_documents.js — Documents de cours liés aux UE
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/cours-documents/ue/:ue_id — Documents d'une UE
router.get('/ue/:ue_id', auth, async (req, res) => {
  try {
    const { ue_id } = req.params;
    const result = await pool.query(
      `SELECT cd.*, u.nom as auteur_nom, u.prenom as auteur_prenom, u.rang as auteur_rang
       FROM cours_documents cd
       JOIN users u ON cd.created_by = u.id
       WHERE cd.ue_id = $1
       ORDER BY cd.created_at DESC`,
      [ue_id]
    );
    res.json({ success: true, documents: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/cours-documents/filiere/:filiere_id/niveau/:niveau_id — Tous les documents d'un niveau
router.get('/filiere/:filiere_id/niveau/:niveau_id', auth, async (req, res) => {
  try {
    const { filiere_id, niveau_id } = req.params;
    const result = await pool.query(
      `SELECT cd.*, u.nom as auteur_nom, u.prenom as auteur_prenom, u.rang as auteur_rang,
              ue.nom as ue_nom, ue.code as ue_code
       FROM cours_documents cd
       JOIN users u ON cd.created_by = u.id
       JOIN unites_enseignement ue ON cd.ue_id = ue.id
       WHERE cd.filiere_id = $1 AND cd.niveau_id = $2
       ORDER BY cd.created_at DESC`,
      [filiere_id, niveau_id]
    );
    res.json({ success: true, documents: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/cours-documents — Ajouter un document (tout le monde peut)
router.post('/', auth, upload.single('fichier'), async (req, res) => {
  try {
    const { titre, description, ue_id } = req.body;
    const user = req.user;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Fichier requis' });
    }

    // Récupérer les infos de l'UE
    const ueResult = await pool.query('SELECT * FROM unites_enseignement WHERE id = $1', [ue_id]);
    if (ueResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'UE introuvable' });
    }
    const ue = ueResult.rows[0];

    const fichier_url = `/uploads/notes/${req.file.filename}`;
    const fichier_type = req.file.mimetype;
    const fichier_nom = req.file.originalname;
    const taille = req.file.size;

    const result = await pool.query(
      `INSERT INTO cours_documents (titre, description, fichier_url, fichier_type, fichier_nom, taille, ue_id, filiere_id, niveau_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [titre, description, fichier_url, fichier_type, fichier_nom, taille, ue_id, ue.filiere_id, ue.niveau_id, user.id]
    );

    // Notification socket
    const io = req.app.get('io');
    io.to(`filiere_${ue.filiere_id}_niveau_${ue.niveau_id}`).emit('nouveau_document', {
      message: `📄 Nouveau document: ${titre} (${ue.code})`,
      document: result.rows[0],
      type: 'document'
    });

    res.status(201).json({ success: true, document: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/cours-documents/:id — Supprimer (créateur ou délégué/prof)
router.delete('/:id', auth, async (req, res) => {
  try {
    const doc = await pool.query('SELECT * FROM cours_documents WHERE id = $1', [req.params.id]);
    if (!doc.rows[0]) return res.status(404).json({ success: false, message: 'Document introuvable' });

    const d = doc.rows[0];
    const user = req.user;

    // Autoriser: créateur, délégué de la filière, ou professeur
    if (d.created_by !== user.id && user.rang === 'etudiant') {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    await pool.query('DELETE FROM cours_documents WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Document supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;