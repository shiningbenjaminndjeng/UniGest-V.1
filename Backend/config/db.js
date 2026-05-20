const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // obligatoire sur Render
      }
    : {
        host:     process.env.DB_HOST     || 'localhost',
        port:     process.env.DB_PORT     || 5432,
        database: process.env.DB_NAME     || 'univ_gestion',
        user:     process.env.DB_USER     || 'postgres',
        password: String(process.env.DB_PASSWORD || ''),
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
);

pool.connect((err, client, release) => {
  if (err) console.error('❌ Erreur DB:', err.stack);
  else { console.log('✅ Base de données connectée !'); release(); }
});

module.exports = pool;
