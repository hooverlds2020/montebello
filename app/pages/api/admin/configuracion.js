const { pool } = require('../../../lib/db');
const { estaAutenticado } = require('../../../lib/auth');

export default async function handler(req, res) {
  if (!estaAutenticado(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (req.method === 'GET') {
    const { rows } = await pool.query('SELECT id, umbral_aprobacion, tiempo_limite_minutos FROM configuracion ORDER BY id LIMIT 1');
    return res.status(200).json(rows[0] || { umbral_aprobacion: 60, tiempo_limite_minutos: 120 });
  }

  if (req.method === 'PUT') {
    const { umbralAprobacion, tiempoLimiteMinutos } = req.body;
    const { rows } = await pool.query('SELECT id FROM configuracion ORDER BY id LIMIT 1');

    if (umbralAprobacion !== undefined) {
      const n = parseInt(umbralAprobacion, 10);
      if (isNaN(n) || n < 0 || n > 100) {
        return res.status(400).json({ error: 'El umbral debe ser un número entre 0 y 100' });
      }
      if (rows[0]) {
        await pool.query('UPDATE configuracion SET umbral_aprobacion = $1 WHERE id = $2', [n, rows[0].id]);
      } else {
        await pool.query('INSERT INTO configuracion (umbral_aprobacion) VALUES ($1)', [n]);
      }
    }

    if (tiempoLimiteMinutos !== undefined) {
      const t = parseInt(tiempoLimiteMinutos, 10);
      if (isNaN(t) || t < 1 || t > 600) {
        return res.status(400).json({ error: 'El tiempo debe ser un número entre 1 y 600 minutos' });
      }
      const { rows: rows2 } = await pool.query('SELECT id FROM configuracion ORDER BY id LIMIT 1');
      if (rows2[0]) {
        await pool.query('UPDATE configuracion SET tiempo_limite_minutos = $1 WHERE id = $2', [t, rows2[0].id]);
      } else {
        await pool.query('INSERT INTO configuracion (tiempo_limite_minutos) VALUES ($1)', [t]);
      }
    }

    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  res.status(405).end();
}
