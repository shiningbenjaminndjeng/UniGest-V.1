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
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Rendre io accessible dans les routes
app.set('io', io);

// ============================================
// MIDDLEWARES GLOBAUX
// ============================================
app.use(cors({
  origin: function(origin, callback) {
    // Autoriser les requêtes sans origin (Postman, mobile)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:5173',
    ].filter(Boolean); // enlever les undefined
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS bloqué pour:', origin);
      callback(null, true); // temporairement tout autoriser pour déboguer
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Gérer les requêtes OPTIONS (preflight)
app.options('/*splat', cors());
// ============================================
// ROUTES API
// ============================================
app.use('/api/auth',             require('./routes/auth'));
app.use('/api/facultes',         require('./routes/facultes'));
app.use('/api/filieres',         require('./routes/filieres'));
app.use('/api/etudiants',        require('./routes/etudiants'));
app.use('/api/ues',              require('./routes/ues'));
app.use('/api/evenements',       require('./routes/evenements'));
app.use('/api/notes',            require('./routes/notes'));
app.use('/api/discussions',      require('./routes/discussions'));
app.use('/api/annees',           require('./routes/annees'));
app.use('/api/niveaux',          require('./routes/niveaux'));
app.use('/api/cours-documents',  require('./routes/cours_documents'));
app.use('/api/competences',      require('./routes/competences'));
app.use('/api/messagerie',       require('./routes/messagerie'));

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Serveur opérationnel',
    timestamp: new Date().toISOString()
  });
});

const errorHandler = require('./middleware/errorHandler');

// ⚠️ Le 404 doit être AVANT errorHandler mais APRÈS toutes les routes
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route non trouvée' });
});

app.use(errorHandler);

// ============================================
// SOCKET.IO — Gestion des connexions temps réel
// ============================================
io.on('connection', (socket) => {
  console.log(`🔌 Utilisateur connecté: ${socket.id}`);

  // Rejoindre une room (filière + niveau)
  socket.on('join_room', ({ filiere_id, niveau_id }) => {
    const room = `filiere_${filiere_id}_niveau_${niveau_id}`;
    socket.join(room);
  });

  // Rejoindre room personnelle (pour messages privés)
  socket.on('join_user_room', ({ user_id }) => {
    socket.join(`user_${user_id}`);
  });

  // Rejoindre toutes les filières d'un prof
  socket.on('join_prof_rooms', (filieres) => {
    filieres.forEach(f => {
      socket.join(`filiere_${f.filiere_id}_niveau_${f.niveau_id}`);
    });
  });

  // Typing indicator pour messagerie
  socket.on('typing', ({ to_user_id, from_name }) => {
    io.to(`user_${to_user_id}`).emit('user_typing', { from_name });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Utilisateur déconnecté: ${socket.id}`);
  });
});

// ============================================
// CRON JOB — Suppression des comptes expirés
// Vérifie chaque jour à minuit
// ============================================
const pool = require('./config/db');

async function supprimerComptesExpires() {
  try {
    // Trouver les users dont l'année scolaire est terminée depuis plus de 30 jours
    const result = await pool.query(
      `SELECT u.id, u.nom, u.prenom, u.email FROM users u
       JOIN annees_scolaires a ON u.annee_scolaire_id = a.id
       WHERE u.rang != 'professeur'
         AND a.active = FALSE
         AND a.date_fin < NOW() - INTERVAL '30 days'
         AND u.actif = TRUE`
    );

    if (result.rows.length > 0) {
      console.log(`🗑️  Suppression de ${result.rows.length} compte(s) expirés...`);
      
      for (const user of result.rows) {
        // Désactiver d'abord (soft delete)
        await pool.query(
          'UPDATE users SET actif = FALSE WHERE id = $1',
          [user.id]
        );
        console.log(`  ✓ Compte désactivé: ${user.prenom} ${user.nom} (${user.email})`);
      }
    }

    // Supprimer complètement les comptes désactivés depuis plus de 60 jours
    const deleted = await pool.query(
      `DELETE FROM users 
       WHERE actif = FALSE 
         AND annee_scolaire_id IN (
           SELECT id FROM annees_scolaires 
           WHERE active = FALSE AND date_fin < NOW() - INTERVAL '60 days'
         )
         AND rang != 'professeur'
       RETURNING nom, prenom, email`
    );

    if (deleted.rows.length > 0) {
      console.log(`🗑️  ${deleted.rows.length} compte(s) définitivement supprimés`);
    }
  } catch (err) {
    console.error('Erreur cron suppression comptes:', err);
  }
}

// Lancer le cron toutes les 24h
setInterval(supprimerComptesExpires, 24 * 60 * 60 * 1000);
// Aussi au démarrage (avec délai de 5 sec)
setTimeout(supprimerComptesExpires, 5000);

// ============================================
// DÉMARRAGE SERVEUR
// ============================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📂 API disponible sur http://localhost:${PORT}/api`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = { app, io };
