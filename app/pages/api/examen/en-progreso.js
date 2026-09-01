const { pool } = require('../../../lib/db');
const { getAlumnoDesdeRequest } = require('../../../lib/auth-alumno');

export default async function handler(req, res) {
  const sesion = getAlumnoDesdeRequest(req);
  if (!sesion) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const { rows } = await pool.query(
    `SELECT e.id,
            count(er.id) AS total,
            count(er.id) FILTER (WHERE er.opcion_respondida_id IS NOT NULL) AS respondidas
     FROM examenes e
     LEFT JOIN examen_reactivos er ON er.examen_id = e.id
     WHERE e.alumno_id = $1 AND e.estado = 'en_progreso'
     GROUP BY e.id
     ORDER BY e.id DESC
     LIMIT 1`,
    [sesion.alumnoId]
  );

  const en = rows[0];
  if (!en) {
    return res.status(200).json({ examenId: null });
  }

  return res.status(200).json({
    examenId: en.id,
    total: parseInt(en.total, 10),
    respondidas: parseInt(en.respondidas, 10),
  });
}
