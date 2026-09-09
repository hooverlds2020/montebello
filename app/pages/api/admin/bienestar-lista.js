const { pool } = require('../../../lib/db');
const { estaAutenticado } = require('../../../lib/auth');

// Lista básica (nombre, fecha) — NO incluye puntajes ni niveles. Cualquier
// admin del panel puede ver QUIÉN ya contestó, pero el resultado en sí
// requiere la clave especial (ver /api/bienestar/resultado.js).
export default async function handler(req, res) {
  if (!estaAutenticado(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { rows } = await pool.query(
    `SELECT t.alumno_id, a.nombre, a.email, t.creado_en
     FROM tmms_respuestas t
     JOIN alumnos a ON a.id = t.alumno_id
     ORDER BY t.creado_en DESC`
  );

  return res.status(200).json(rows);
}
