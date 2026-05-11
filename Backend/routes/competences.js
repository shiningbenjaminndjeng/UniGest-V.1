// routes/competences.js — Fiches de compétences étudiants
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/competences/filiere/:filiere_id — Toutes les compétences d'une filière
router.get('/filiere/:filiere_id', auth, async (req, res) => {
  try {
    const { filiere_id } = req.params;
    const { search, type } = req.query;

    let query = `
      SELECT c.*, u.nom, u.prenom, u.rang, u.niveau_id, n.code as niveau_code,
             COALESCE(
               json_agg(DISTINCT jsonb_build_object(
                 'id', ci.id, 'type', ci.type, 'libelle', ci.libelle, 'niveau_maitrise', ci.niveau_maitrise
               )) FILTER (WHERE ci.id IS NOT NULL), '[]'
             ) as items
      FROM competences c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN niveaux n ON u.niveau_id = n.id
      LEFT JOIN competence_items ci ON c.id = ci.id
      WHERE u.filiere_id = $1 AND u.actif = TRUE AND u.rang != 'professeur'
    `;
    const params = [filiere_id];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (
        u.nom ILIKE $${params.length} OR u.prenom ILIKE $${params.length} OR 
        c.titre ILIKE $${params.length} OR c.bio ILIKE $${params.length} OR
        EXISTS (SELECT 1 FROM competence_items ci2 WHERE ci2.competence_id = c.id AND ci2.libelle ILIKE $${params.length})
      )`;
    }

    query += ' GROUP BY c.id, u.nom, u.prenom, u.rang, u.niveau_id, n.code ORDER BY c.note_moyenne DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, competences: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/competences/user/:user_id — Fiche d'un utilisateur
router.get('/user/:user_id', auth, async (req, res) => {
  try {
    const { user_id } = req.params;

    const compResult = await pool.query(
      `SELECT c.*, u.nom, u.prenom, u.rang, u.email, u.niveau_id,
              n.code as niveau_code, f.nom as filiere_nom
       FROM competences c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN niveaux n ON u.niveau_id = n.id
       LEFT JOIN filieres f ON u.filiere_id = f.id
       WHERE c.user_id = $1`,
      [user_id]
    );

    if (compResult.rows.length === 0) {
      return res.json({ success: true, competence: null });
    }

    const comp = compResult.rows[0];

    // Récupérer les items
    const itemsResult = await pool.query(
      'SELECT * FROM competence_items WHERE competence_id = $1 ORDER BY type, libelle',
      [comp.id]
    );

    // Récupérer les fichiers
    const fichiersResult = await pool.query(
      'SELECT * FROM competence_fichiers WHERE competence_id = $1 ORDER BY created_at DESC',
      [comp.id]
    );

    // Récupérer les ratings avec commentaires
    const ratingsResult = await pool.query(
      `SELECT cr.*, u.nom as voter_nom, u.prenom as voter_prenom
       FROM competence_ratings cr
       JOIN users u ON cr.voter_id = u.id
       WHERE cr.competence_id = $1
       ORDER BY cr.created_at DESC`,
      [comp.id]
    );

    // Vote de l'utilisateur actuel
    const myVote = ratingsResult.rows.find(r => r.voter_id === req.user.id);

    res.json({
      success: true,
      competence: {
        ...comp,
        items: itemsResult.rows,
        fichiers: fichiersResult.rows,
        ratings: ratingsResult.rows,
        mon_vote: myVote?.note || null
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/competences/me — Ma fiche
router.get('/me', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.* FROM competences c WHERE c.user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, competence: null });
    }

    const comp = result.rows[0];

    const [items, fichiers, ratings] = await Promise.all([
      pool.query('SELECT * FROM competence_items WHERE competence_id = $1 ORDER BY type', [comp.id]),
      pool.query('SELECT * FROM competence_fichiers WHERE competence_id = $1', [comp.id]),
      pool.query('SELECT COUNT(*) as total, AVG(note)::DECIMAL(3,2) as moyenne FROM competence_ratings WHERE competence_id = $1', [comp.id])
    ]);

    res.json({
      success: true,
      competence: {
        ...comp,
        items: items.rows,
        fichiers: fichiers.rows,
        nb_votes: parseInt(ratings.rows[0].total),
        note_moyenne: parseFloat(ratings.rows[0].moyenne) || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/competences — Créer/mettre à jour ma fiche
router.post('/', auth, upload.single('banniere'), async (req, res) => {
  try {
    const { titre, bio, telephone, email_contact, linkedin, github, portfolio, disponible } = req.body;
    const user = req.user;

    const banniere_url = req.file ? `/uploads/photos/${req.file.filename}` : null;

    // Vérifier si une fiche existe déjà
    const existing = await pool.query('SELECT id FROM competences WHERE user_id = $1', [user.id]);

    let comp;
    if (existing.rows.length > 0) {
      // Mettre à jour
      const updateQuery = banniere_url
        ? `UPDATE competences SET titre=$1, bio=$2, telephone=$3, email_contact=$4, linkedin=$5, github=$6, portfolio=$7, disponible=$8, banniere_url=$9, updated_at=NOW() WHERE user_id=$10 RETURNING *`
        : `UPDATE competences SET titre=$1, bio=$2, telephone=$3, email_contact=$4, linkedin=$5, github=$6, portfolio=$7, disponible=$8, updated_at=NOW() WHERE user_id=$9 RETURNING *`;

      const params = banniere_url
        ? [titre, bio, telephone, email_contact, linkedin, github, portfolio, disponible === 'true', banniere_url, user.id]
        : [titre, bio, telephone, email_contact, linkedin, github, portfolio, disponible === 'true', user.id];

      comp = await pool.query(updateQuery, params);
    } else {
      // Créer
      comp = await pool.query(
        `INSERT INTO competences (user_id, titre, bio, telephone, email_contact, linkedin, github, portfolio, disponible, banniere_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [user.id, titre, bio, telephone, email_contact, linkedin, github, portfolio, disponible === 'true', banniere_url]
      );
    }

    res.json({ success: true, competence: comp.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/competences/items — Ajouter une compétence
router.post('/items', auth, async (req, res) => {
  try {
    const { type, libelle, niveau_maitrise } = req.body;

    // S'assurer que la fiche existe
    const comp = await pool.query('SELECT id FROM competences WHERE user_id = $1', [req.user.id]);
    if (comp.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Créez d\'abord votre fiche de compétences' });
    }

    const result = await pool.query(
      `INSERT INTO competence_items (competence_id, type, libelle, niveau_maitrise)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [comp.rows[0].id, type, libelle, niveau_maitrise || 'intermediaire']
    );

    res.status(201).json({ success: true, item: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/competences/items/:id
router.delete('/items/:id', auth, async (req, res) => {
  try {
    const comp = await pool.query('SELECT id FROM competences WHERE user_id = $1', [req.user.id]);
    if (comp.rows.length === 0) return res.status(403).json({ success: false, message: 'Non autorisé' });

    await pool.query(
      'DELETE FROM competence_items WHERE id = $1 AND competence_id = $2',
      [req.params.id, comp.rows[0].id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/competences/fichiers — Upload un fichier
router.post('/fichiers', auth, upload.single('fichier'), async (req, res) => {
  try {
    const { titre } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: 'Fichier requis' });

    const comp = await pool.query('SELECT id FROM competences WHERE user_id = $1', [req.user.id]);
    if (comp.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Créez d\'abord votre fiche' });
    }

    const result = await pool.query(
      `INSERT INTO competence_fichiers (competence_id, titre, fichier_url, fichier_type, fichier_nom)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [comp.rows[0].id, titre, `/uploads/notes/${req.file.filename}`, req.file.mimetype, req.file.originalname]
    );

    res.status(201).json({ success: true, fichier: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/competences/fichiers/:id
router.delete('/fichiers/:id', auth, async (req, res) => {
  try {
    const comp = await pool.query('SELECT id FROM competences WHERE user_id = $1', [req.user.id]);
    if (comp.rows.length === 0) return res.status(403).json({ success: false, message: 'Non autorisé' });

    await pool.query(
      'DELETE FROM competence_fichiers WHERE id = $1 AND competence_id = $2',
      [req.params.id, comp.rows[0].id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/competences/:user_id/rate — Voter pour une fiche
router.post('/:user_id/rate', auth, async (req, res) => {
  try {
    const { user_id } = req.params;
    const { note, commentaire } = req.body;
    const voter = req.user;

    if (parseInt(user_id) === voter.id) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas vous noter vous-même' });
    }

    const comp = await pool.query('SELECT id FROM competences WHERE user_id = $1', [user_id]);
    if (comp.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Fiche introuvable' });
    }

    const compId = comp.rows[0].id;

    // Upsert le vote
    await pool.query(
      `INSERT INTO competence_ratings (competence_id, voter_id, note, commentaire)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (competence_id, voter_id) DO UPDATE SET note=$3, commentaire=$4`,
      [compId, voter.id, note, commentaire]
    );

    // Recalculer la moyenne
    const avg = await pool.query(
      'SELECT AVG(note)::DECIMAL(3,2) as moy, COUNT(*) as nb FROM competence_ratings WHERE competence_id = $1',
      [compId]
    );

    await pool.query(
      'UPDATE competences SET note_moyenne=$1, nb_votes=$2 WHERE id=$3',
      [avg.rows[0].moy, avg.rows[0].nb, compId]
    );

    res.json({ success: true, note_moyenne: parseFloat(avg.rows[0].moy), nb_votes: parseInt(avg.rows[0].nb) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;