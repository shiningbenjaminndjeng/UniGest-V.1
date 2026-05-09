// middleware/checkRole.js — Vérification des rôles et périmètre d'accès

/**
 * Vérifier que l'utilisateur a le bon rang
 * @param {string[]} rangsAutorises - ['etudiant', 'delegue', 'professeur']
 */
const checkRang = (rangsAutorises) => {
  return (req, res, next) => {
    if (!rangsAutorises.includes(req.user.rang)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé. Action réservée aux: ${rangsAutorises.join(', ')}`
      });
    }
    next();
  };
};

/**
 * Vérifier que l'étudiant/délégué accède uniquement à sa filière+niveau
 * Le professeur peut accéder à toutes ses filières
 */
const checkPerimetre = async (req, res, next) => {
  const user = req.user;
  const filiere_id = parseInt(req.params.filiere_id || req.body.filiere_id || req.query.filiere_id);
  const niveau_id = parseInt(req.params.niveau_id || req.body.niveau_id || req.query.niveau_id);

  // Le professeur a accès à ses propres filières (vérification dans le controller)
  if (user.rang === 'professeur') {
    return next();
  }

  // Étudiant et délégué: uniquement leur filière + niveau
  if (filiere_id && filiere_id !== user.filiere_id) {
    return res.status(403).json({
      success: false,
      message: 'Vous ne pouvez pas accéder aux données d\'une autre filière'
    });
  }

  if (niveau_id && niveau_id !== user.niveau_id) {
    return res.status(403).json({
      success: false,
      message: 'Vous ne pouvez pas accéder aux données d\'un autre niveau'
    });
  }

  next();
};

/**
 * Vérifier la limite de 5 délégués par filière+niveau
 */
const checkLimiteDelegues = async (req, res, next) => {
  const pool = require('../config/db');
  const { filiere_id, niveau_id } = req.body;

  if (req.body.rang === 'delegue') {
    const result = await pool.query(
      `SELECT COUNT(*) as nb FROM users 
       WHERE rang = 'delegue' 
       AND filiere_id = $1 
       AND niveau_id = $2
       AND annee_scolaire_id = (SELECT id FROM annees_scolaires WHERE active = TRUE)`,
      [filiere_id, niveau_id]
    );

    if (parseInt(result.rows[0].nb) >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Limite atteinte: 5 délégués maximum par filière et niveau'
      });
    }
  }

  next();
};

module.exports = { checkRang, checkPerimetre, checkLimiteDelegues };