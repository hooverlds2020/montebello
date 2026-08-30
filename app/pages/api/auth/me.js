const { pool } = require('../../../lib/db');
const { getAlumnoDesdeRequest } = require('../../../lib/auth-alumno');

export default async function handler(req, res) {
  const sesion = getAlumnoDesdeRequest(req);
  if (!sesion) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  const { rows } = await pool.query('SELECT id, nombre, email FROM alumnos WHERE id = $1', [sesion.alumnoId]);
  if (!rows[0]) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  return res.status(200).json(rows[0]);
}
