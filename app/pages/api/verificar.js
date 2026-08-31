const { pool } = require('../../../lib/db');

// Endpoint público (sin login) para verificar la autenticidad de un resultado
// impreso — solo expone datos mínimos, no respuestas ni datos sensibles.
export default async function handler(req, res) {
  const { examenId } = req.query;

  const { rows } = await pool.query(
    `SELECT e.id, e.finalizado_en, a.nombre,
            count(er.id) AS total,
            count(er.id) FILTER (WHERE o.es_correcta) AS correctas
     FROM examenes e
     JOIN alumnos a ON a.id = e.alumno_id
     JOIN examen_reactivos er ON er.examen_id = e.id
     LEFT JOIN opciones o ON o.id = er.opcion_respondida_id
     WHERE e.id = $1 AND e.estado = 'finalizado'
     GROUP BY e.id, e.finalizado_en, a.nombre`,
    [examenId]
  );

  const examen = rows[0];
  if (!examen) {
    return res.status(404).json({ valido: false, error: 'Folio no encontrado o examen no finalizado' });
  }

  const porcentaje = Math.round((parseInt(examen.correctas, 10) / parseInt(examen.total, 10)) * 100);

  return res.status(200).json({
    valido: true,
    folio: examen.id,
    nombre: examen.nombre,
    fecha: examen.finalizado_en,
    porcentaje,
  });
}
