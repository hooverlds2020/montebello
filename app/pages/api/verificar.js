const { pool } = require('../../lib/db');

// Endpoint público (sin login) para verificar la autenticidad de un resultado
// impreso — solo expone datos mínimos (nombre, folio, fecha, calificación por
// materia y final), nunca respuestas, preguntas ni datos sensibles del alumno.
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

  const { rows: filasMateria } = await pool.query(
    `SELECT c.nombre AS categoria, padre.nombre AS categoria_padre,
            count(er.id) AS total,
            count(er.id) FILTER (WHERE o.es_correcta) AS correctas,
            count(er.id) FILTER (WHERE er.opcion_respondida_id IS NOT NULL AND NOT o.es_correcta) AS incorrectas,
            count(er.id) FILTER (WHERE er.opcion_respondida_id IS NULL) AS sin_contestar
     FROM examen_reactivos er
     JOIN reactivos r ON r.id = er.reactivo_id
     JOIN categorias c ON c.id = r.categoria_id
     LEFT JOIN categorias padre ON padre.id = c.categoria_padre_id
     LEFT JOIN opciones o ON o.id = er.opcion_respondida_id
     WHERE er.examen_id = $1
     GROUP BY c.nombre, padre.nombre
     ORDER BY MIN(er.orden)`,
    [examenId]
  );

  const porCategoria = filasMateria.map((f) => ({
    categoria: f.categoria_padre ? `${f.categoria_padre} › ${f.categoria}` : f.categoria,
    total: parseInt(f.total, 10),
    correctas: parseInt(f.correctas, 10),
    incorrectas: parseInt(f.incorrectas, 10),
    sinContestar: parseInt(f.sin_contestar, 10),
    porcentaje: Math.round((parseInt(f.correctas, 10) / parseInt(f.total, 10)) * 100),
  }));

  const porcentaje = Math.round((parseInt(examen.correctas, 10) / parseInt(examen.total, 10)) * 100);

  return res.status(200).json({
    valido: true,
    folio: examen.id,
    nombre: examen.nombre,
    fecha: examen.finalizado_en,
    total: parseInt(examen.total, 10),
    correctas: parseInt(examen.correctas, 10),
    porcentaje,
    porCategoria,
  });
}
