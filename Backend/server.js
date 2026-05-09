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
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir les fichiers uploadés
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// ROUTES API
// ============================================
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/facultes',    require('./routes/facultes'));
app.use('/api/filieres',    require('./routes/filieres'));
app.use('/api/etudiants',   require('./routes/etudiants'));
app.use('/api/ues',         require('./routes/ues'));
app.use('/api/evenements',  require('./routes/evenements'));
app.use('/api/notes',       require('./routes/notes'));
app.use('/api/discussions', require('./routes/discussions'));
app.use('/api/annees',      require('./routes/annees'));
app.use('/api/niveaux',     require('./routes/niveaux'));

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Serveur opérationnel',
    timestamp: new Date().toISOString()
  });
});

const errorHandler = require('./middleware/errorHandler');

// ============================================
// GESTION ERREURS GLOBALES
// ============================================
app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route non trouvée' });
});

// ============================================
// SOCKET.IO — Gestion des connexions temps réel
// ============================================
io.on('connection', (socket) => {
  console.log(`🔌 Utilisateur connecté: ${socket.id}`);

  // Rejoindre une room (filière + niveau)
  socket.on('join_room', ({ filiere_id, niveau_id }) => {
    const room = `filiere_${filiere_id}_niveau_${niveau_id}`;
    socket.join(room);
    console.log(`📚 Socket ${socket.id} rejoint la room: ${room}`);
  });

  // Rejoindre toutes les filières d'un prof
  socket.on('join_prof_rooms', (filieres) => {
    filieres.forEach(f => {
      socket.join(`filiere_${f.filiere_id}_niveau_${f.niveau_id}`);
    });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Utilisateur déconnecté: ${socket.id}`);
  });
});

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