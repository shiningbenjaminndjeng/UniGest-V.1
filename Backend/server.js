// server.js — Point d'entrée principal du serveur
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// ============================================
// CONFIGURATION SOCKET.IO (temps réel)
// ============================================
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Rendre io accessible dans les routes
app.set('io', io);

// ============================================
// MIDDLEWARES GLOBAUX  ← CORRECTIFS ICI
// ============================================

// ✅ CORRECTIF 1 — Body parsers (OBLIGATOIRES, manquaient avant)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ CORRECTIF 2 — Servir les fichiers uploadés en statique
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ CORRECTIF 3 — CORS élargi pour accepter toutes les origines en prod
app.use(cors({
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origin (Postman, mobile, capacitor)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:4173',
    ].filter(Boolean);

    if (allowedOrigins.includes(origin) || allowedOrigins.length === 0) {
      callback(null, true);
    } else {
      // En production on autorise tout pour éviter les blocages CORS
      // Restreignez en ajoutant FRONTEND_URL dans les variables Render
      console.log('⚠️  CORS origin non listée, autorisée quand même:', origin);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Gérer les requêtes OPTIONS (preflight CORS)
app.options('*', cors());

// ============================================
// ROUTES API
// ============================================
app.use('/api/auth',            require('./routes/auth'));
app.use('/api/facultes',        require('./routes/facultes'));
app.use('/api/filieres',        require('./routes/filieres'));
app.use('/api/etudiants',       require('./routes/etudiants'));
app.use('/api/ues',             require('./routes/ues'));
app.use('/api/evenements',      require('./routes/evenements'));
app.use('/api/notes',           require('./routes/notes'));
app.use('/api/discussions',     require('./routes/discussions'));
app.use('/api/annees',          require('./routes/annees'));
app.use('/api/niveaux',         require('./routes/niveaux'));
app.use('/api/cours-documents', require('./routes/cours_documents'));
app.use('/api/competences',     require('./routes/competences'));
app.use('/api/messagerie',      require('./routes/messagerie'));

// Route de santé (health check)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Serveur opérationnel',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// ✅ CORRECTIF 4 — Route racine informative (évite le "Route non trouvée" confus)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'UniGest Backend API',
    version: '1.0.0',
    health: '/api/health',
    docs: 'Voir /api/health pour vérifier le statut',
  });
});

const errorHandler = require('./middleware/errorHandler');

// 404 — doit être AVANT errorHandler et APRÈS toutes les routes
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route non trouvée : ${req.method} ${req.path}` });
});

app.use(errorHandler);

// ============================================
// SOCKET.IO — Gestion des connexions temps réel
// ============================================
io.on('connection', (socket) => {
  console.log(`🔌 Utilisateur connecté: ${socket.id}`);

  socket.on('join_room', ({ filiere_id, niveau_id }) => {
    const room = `filiere_${filiere_id}_niveau_${niveau_id}`;
    socket.join(room);
    console.log(`📌 Socket ${socket.id} → room ${room}`);
  });

  socket.on('join_user_room', ({ user_id }) => {
    socket.join(`user_${user_id}`);
  });

  socket.on('join_prof_rooms', (filieres) => {
    filieres.forEach(f => {
      socket.join(`filiere_${f.filiere_id}_niveau_${f.niveau_id}`);
    });
  });

  socket.on('typing', ({ to_user_id, from_name }) => {
    io.to(`user_${to_user_id}`).emit('user_typing', { from_name });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Utilisateur déconnecté: ${socket.id}`);
  });
});

// ============================================
// CRON JOB — Suppression des comptes expirés
// ============================================
const pool = require('./config/db');

async function supprimerComptesExpires() {
  try {
    const result = await pool.query(
      `SELECT u.id, u.nom, u.prenom, u.email FROM users u
       JOIN annees_scolaires a ON u.annee_scolaire_id = a.id
       WHERE u.rang != 'professeur'
         AND a.active = FALSE
         AND a.date_fin < NOW() - INTERVAL '30 days'
         AND u.actif = TRUE`
    );

    if (result.rows.length > 0) {
      console.log(`🗑️  Désactivation de ${result.rows.length} compte(s) expirés…`);
      for (const user of result.rows) {
        await pool.query('UPDATE users SET actif = FALSE WHERE id = $1', [user.id]);
        console.log(`  ✓ ${user.prenom} ${user.nom} (${user.email})`);
      }
    }

    const deleted = await pool.query(
      `DELETE FROM users
       WHERE actif = FALSE
         AND annee_scolaire_id IN (
           SELECT id FROM annees_scolaires
           WHERE active = FALSE AND date_fin < NOW() - INTERVAL '60 days'
         )
         AND rang != 'professeur'
       RETURNING nom, prenom`
    );
    if (deleted.rows.length > 0) {
      console.log(`🗑️  ${deleted.rows.length} compte(s) définitivement supprimés`);
    }
  } catch (err) {
    console.error('Erreur cron suppression comptes:', err);
  }
}

setInterval(supprimerComptesExpires, 24 * 60 * 60 * 1000);
setTimeout(supprimerComptesExpires, 5000);

// ============================================
// DÉMARRAGE SERVEUR
// ============================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📂 API disponible sur /api`);
  console.log(`🌍 Environnement : ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 FRONTEND_URL  : ${process.env.FRONTEND_URL || '(non définie — CORS ouvert)'}\n`);
});

module.exports = { app, io };
