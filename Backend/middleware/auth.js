// middleware/auth.js — Vérification JWT + rôles
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// ✅ MIDDLEWARE MANQUANT — vérification du token JWT
const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token manquant' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query(
      `SELECT u.*, f.nom as filiere_nom, n.code as niveau_code,
              a.libelle as annee_libelle, a.date_fin
       FROM users u
       LEFT JOIN filieres f ON u.filiere_id = f.id
       LEFT JOIN niveaux n ON u.niveau_id = n.id
       LEFT JOIN annees_scolaires a ON u.annee_scolaire_id = a.id
       WHERE u.id = $1 AND u.actif = TRUE`,
      [decoded.userId]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Utilisateur introuvable' });
    }
    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalide ou expiré' });
  }
};

const checkRang = (rangsAutorises) => (req, res, next) => {
  if (!rangsAutorises.includes(req.user.rang)) {
    return res.status(403).json({
      success: false,
      message: `Accès refusé. Action réservée aux: ${rangsAutorises.join(', ')}`
    });
  }
  next();
};

const checkPerimetre = async (req, res, next) => {
  const user = req.user;
  const filiere_id = parseInt(req.params.filiere_id || req.body.filiere_id || req.query.filiere_id);
  const niveau_id  = parseInt(req.params.niveau_id  || req.body.niveau_id  || req.query.niveau_id);

  if (user.rang === 'professeur') return next();

  if (filiere_id && filiere_id !== user.filiere_id) {
    return res.status(403).json({ success: false, message: "Accès à une autre filière refusé" });
  }
  if (niveau_id && niveau_id !== user.niveau_id) {
    return res.status(403).json({ success: false, message: "Accès à un autre niveau refusé" });
  }
  next();
};

const checkLimiteDelegues = async (req, res, next) => {
  if (req.body.rang === 'delegue') {
    const { filiere_id, niveau_id } = req.body;
    const result = await pool.query(
      `SELECT COUNT(*) as nb FROM users
       WHERE rang = 'delegue' AND filiere_id = $1 AND niveau_id = $2
       AND annee_scolaire_id = (SELECT id FROM annees_scolaires WHERE active = TRUE)`,
      [filiere_id, niveau_id]
    );
    if (parseInt(result.rows[0].nb) >= 5) {
      return res.status(400).json({ success: false, message: 'Limite atteinte: 5 délégués max par filière/niveau' });
    }
  }
  next();
};

module.exports = auth; // export par défaut = middleware JWT
module.exports.checkRang = checkRang;
module.exports.checkPerimetre = checkPerimetre;
module.exports.checkLimiteDelegues = checkLimiteDelegues;