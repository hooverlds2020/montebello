const { pool } = require('../../../lib/db');

export default async function handler(req, res) {
  const { rows } = await pool.query('SELECT umbral_aprobacion FROM configuracion ORDER BY id LIMIT 1');
  const umbral = rows[0]?.umbral_aprobacion ?? 60;
  return res.status(200).json({ umbralAprobacion: umbral });
}
