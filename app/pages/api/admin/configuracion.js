const { pool } = require('../../../lib/db');
const { estaAutenticado } = require('../../../lib/auth');

export default async function handler(req, res) {
  if (!estaAutenticado(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (req.method === 'GET') {
    const { rows } = await pool.query('SELECT id, umbral_aprobacion FROM configuracion ORDER BY id LIMIT 1');
    return res.status(200).json(rows[0] || { umbral_aprobacion: 60 });
  }

  if (req.method === 'PUT') {
    const { umbralAprobacion } = req.body;
    const n = parseInt(umbralAprobacion, 10);
    if (isNaN(n) || n < 0 || n > 100) {
      return res.status(400).json({ error: 'El umbral debe ser un número entre 0 y 100' });
    }
    const { rows } = await pool.query('SELECT id FROM configuracion ORDER BY id LIMIT 1');
    if (rows[0]) {
      await pool.query('UPDATE configuracion SET umbral_aprobacion = $1 WHERE id = $2', [n, rows[0].id]);
    } else {
      await pool.query('INSERT INTO configuracion (umbral_aprobacion) VALUES ($1)', [n]);
    }
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  res.status(405).end();
}
