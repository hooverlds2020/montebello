const { pool } = require('../../../lib/db');
const { getPsicologiaDesdeRequest } = require('../../../lib/auth-psicologia');

export default async function handler(req, res) {
  const sesion = getPsicologiaDesdeRequest(req);
  if (!sesion) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const q = (req.query.q || '').trim();
  if (!q) {
    return res.status(200).json([]);
  }

  const { rows } = await pool.query(
    `SELECT a.id, a.nombre, a.email,
            (SELECT count(*) FROM hamilton_evaluaciones h WHERE h.alumno_id = a.id) AS num_evaluaciones
     FROM alumnos a
     WHERE a.nombre ILIKE $1 OR a.email ILIKE $1
     ORDER BY a.nombre
     LIMIT 20`,
    [`%${q}%`]
  );
  return res.status(200).json(rows);
}
