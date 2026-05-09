// middleware/errorHandler.js — Gestion centralisée des erreurs
const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERREUR:`, err.message);
  console.error(err.stack);

  // Erreur de validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: err.errors
    });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }

  // Erreur JWT expiré
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expiré, veuillez vous reconnecter'
    });
  }

  // Erreur PostgreSQL — contrainte unique
  if (err.code === '23505') {
    const detail = err.detail || '';
    let message = 'Cette valeur existe déjà';
    if (detail.includes('email')) message = 'Cet email est déjà utilisé';
    if (detail.includes('matricule')) message = 'Ce matricule est déjà utilisé';
    return res.status(400).json({ success: false, message });
  }

  // Erreur PostgreSQL — clé étrangère
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Référence invalide dans les données'
    });
  }

  // Erreur Multer — fichier trop grand
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Fichier trop volumineux (max 10MB)'
    });
  }

  // Erreur Multer — type de fichier
  if (err.message === 'Type de fichier non autorisé') {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // Erreur générique
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Une erreur interne est survenue'
  });
};

module.exports = errorHandler;