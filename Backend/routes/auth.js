// routes/auth.js — Inscription et Connexion
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { checkLimiteDelegues } = require('../middleware/checkRole');
const auth = require('../middleware/auth');

// ============================================
// POST /api/auth/register — Inscription
// ============================================
router.post('/register', checkLimiteDelegues, async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      nom, prenom, email, password,
      date_naissance, lieu_naissance,
      rang, matricule, niveau_id, filiere_id,
      annee_scolaire_id
    } = req.body;

    // Validations de base
    if (!nom || !prenom || !email || !password || !rang || !filiere_id) {
      return res.status(400).json({ success: false, message: 'Champs obligatoires manquants' });
    }

    if (!['etudiant', 'delegue', 'professeur'].includes(rang)) {
      return res.status(400).json({ success: false, message: 'Rang invalide' });
    }

    // Étudiant/délégué doit avoir un niveau et un matricule
    if (rang !== 'professeur' && (!niveau_id || !matricule)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Niveau et matricule obligatoires pour étudiant/délégué' 
      });
    }

    // Vérifier email existant
    const emailCheck = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email déjà utilisé' });
    }

    // Vérifier matricule unique (si pas professeur)
    if (matricule) {
      const matriculeCheck = await client.query('SELECT id FROM users WHERE matricule = $1', [matricule]);
      if (matriculeCheck.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Matricule déjà utilisé' });
      }
    }

    // Récupérer l'année scolaire active
    const anneeResult = await client.query(
      'SELECT id FROM annees_scolaires WHERE active = TRUE LIMIT 1'
    );
    if (anneeResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucune année scolaire active' });
    }
    const anneeId = annee_scolaire_id || anneeResult.rows[0].id;

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 12);

    // Insérer l'utilisateur
    const insertResult = await client.query(
      `INSERT INTO users 
       (nom, prenom, email, password_hash, date_naissance, lieu_naissance, 
        rang, matricule, niveau_id, filiere_id, annee_scolaire_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id, nom, prenom, email, rang, matricule, niveau_id, filiere_id`,
      [nom, prenom, email, passwordHash, date_naissance, lieu_naissance,
       rang, matricule || null, rang !== 'professeur' ? niveau_id : null, 
       filiere_id, anneeId]
    );

    const newUser = insertResult.rows[0];

    // Si c'est un professeur, associer à la filière pour toutes les UE
    // (le prof sera lié aux UE qu'il choisit d'enseigner)

    // Générer le JWT
    const token = jwt.sign(
      { userId: newUser.id, rang: newUser.rang },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Inscription réussie !',
      token,
      user: {
        id: newUser.id,
        nom: newUser.nom,
        prenom: newUser.prenom,
        email: newUser.email,
        rang: newUser.rang,
        matricule: newUser.matricule,
        filiere_id: newUser.filiere_id,
        niveau_id: newUser.niveau_id
      }
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'inscription' });
  } finally {
    client.release();
  }
});

// ============================================
// POST /api/auth/login — Connexion
// ============================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    }

    // Chercher l'utilisateur
    const result = await pool.query(
      `SELECT u.*, f.nom as filiere_nom, f.faculte_id,
              fac.nom as faculte_nom, fac.code as faculte_code,
              n.code as niveau_code, n.libelle as niveau_libelle,
              a.libelle as annee_libelle, a.date_fin, a.active as annee_active
       FROM users u
       LEFT JOIN filieres f ON u.filiere_id = f.id
       LEFT JOIN facultes fac ON f.faculte_id = fac.id
       LEFT JOIN niveaux n ON u.niveau_id = n.id
       LEFT JOIN annees_scolaires a ON u.annee_scolaire_id = a.id
       WHERE u.email = $1 AND u.actif = TRUE`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    const user = result.rows[0];

    // Vérifier le mot de passe
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    // Vérifier l'année scolaire
    if (user.date_fin && new Date() > new Date(user.date_fin)) {
      return res.status(401).json({
        success: false,
        message: 'Votre année scolaire est terminée. Veuillez vous réenregistrer.',
        code: 'ANNEE_TERMINEE'
      });
    }

    // Générer le token
    const token = jwt.sign(
      { userId: user.id, rang: user.rang },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        rang: user.rang,
        matricule: user.matricule,
        filiere_id: user.filiere_id,
        filiere_nom: user.filiere_nom,
        faculte_id: user.faculte_id,
        faculte_nom: user.faculte_nom,
        faculte_code: user.faculte_code,
        niveau_id: user.niveau_id,
        niveau_code: user.niveau_code,
        niveau_libelle: user.niveau_libelle,
        annee_libelle: user.annee_libelle
      }
    });

  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================
// GET /api/auth/me — Profil utilisateur connecté
// ============================================
router.get('/me', auth, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// ============================================
// PUT /api/auth/change-password — Changer mdp
// ============================================
router.put('/change-password', auth, async (req, res) => {
  try {
    const { ancien_password, nouveau_password } = req.body;
    const user = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    
    const isValid = await bcrypt.compare(ancien_password, user.rows[0].password_hash);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Ancien mot de passe incorrect' });
    }

    const newHash = await bcrypt.hash(nouveau_password, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);

    res.json({ success: true, message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;