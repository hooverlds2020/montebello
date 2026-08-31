const { pool } = require('../../../lib/db');
const { getAlumnoDesdeRequest } = require('../../../lib/auth-alumno');

export default async function handler(req, res) {
  const sesion = getAlumnoDesdeRequest(req);
  if (!sesion) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const { rows } = await pool.query(
    `SELECT e.id, e.iniciado_en, e.finalizado_en,
            count(er.id) AS total,
            count(er.id) FILTER (WHERE o.es_correcta) AS correctas
     FROM examenes e
     JOIN examen_reactivos er ON er.examen_id = e.id
     LEFT JOIN opciones o ON o.id = er.opcion_respondida_id
     WHERE e.alumno_id = $1 AND e.estado = 'finalizado'
     GROUP BY e.id
     ORDER BY e.finalizado_en DESC`,
    [sesion.alumnoId]
  );

  const historial = rows.map((r) => ({
    examenId: r.id,
    iniciadoEn: r.iniciado_en,
    finalizadoEn: r.finalizado_en,
    total: parseInt(r.total, 10),
    correctas: parseInt(r.correctas, 10),
    porcentaje: Math.round((parseInt(r.correctas, 10) / parseInt(r.total, 10)) * 100),
  }));

  return res.status(200).json(historial);
}
