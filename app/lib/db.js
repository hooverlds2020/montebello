const { Pool } = require('pg');

// Reutiliza la misma conexión entre requests (patrón estándar en Next.js + serverless)
const globalForPg = global;

const pool =
  globalForPg._pgPool ||
  new Pool({
    host: process.env.PGHOST || 'montebello-db',
    port: process.env.PGPORT || 5432,
    database: process.env.PGDATABASE || 'montebello_diagnostico',
    user: process.env.PGUSER || 'montebello',
    password: process.env.PGPASSWORD || 'CAMBIA_ESTA_CLAVE',
  });

if (!globalForPg._pgPool) {
  globalForPg._pgPool = pool;
}

module.exports = { pool };
