// middleware/upload.js — Gestion des uploads de fichiers
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Créer les dossiers si non existants
const createFolders = () => {
  const folders = [
    'uploads/notes',
    'uploads/evenements',
    'uploads/discussions',
    'uploads/photos'
  ];
  folders.forEach(folder => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  });
};
createFolders();

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Utiliser req.originalUrl (chemin complet) pour une détection fiable
    const url = (req.originalUrl || req.baseUrl || '').toLowerCase();
    let folder = 'photos'; // défaut
    if (url.includes('cours-documents') || url.includes('cours_documents') || url.includes('notes')) {
      folder = 'notes';
    } else if (url.includes('evenements')) {
      folder = 'evenements';
    } else if (url.includes('discussions')) {
      folder = 'discussions';
    }
    const dest = path.join(__dirname, '..', 'uploads', folder);
    // Créer le dossier s'il n'existe pas encore
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // ✅ Toujours conserver l'extension d'origine
    const ext = path.extname(file.originalname) || '';
    cb(null, `${uuidv4()}${ext}`);
  },
});

// Filtres de types de fichiers
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm',
    'video/mp4', 'video/webm'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024 // 10MB
  }
});

module.exports = upload;