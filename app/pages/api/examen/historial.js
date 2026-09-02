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

  // Desglose por materia de cada examen, para mostrarlo directo en la lista
  // (incluye el nombre de la materia padre cuando la categoría es una subcategoría, ej. "Español › Comprensión lectora")
  const { rows: filasCategoria } = await pool.query(
    `SELECT e.id AS examen_id, c.nombre AS categoria, padre.nombre AS categoria_padre,
            count(er.id) AS total,
            count(er.id) FILTER (WHERE o.es_correcta) AS correctas
     FROM examenes e
     JOIN examen_reactivos er ON er.examen_id = e.id
     JOIN reactivos r ON r.id = er.reactivo_id
     JOIN categorias c ON c.id = r.categoria_id
     LEFT JOIN categorias padre ON padre.id = c.categoria_padre_id
     LEFT JOIN opciones o ON o.id = er.opcion_respondida_id
     WHERE e.alumno_id = $1 AND e.estado = 'finalizado'
     GROUP BY e.id, c.nombre, padre.nombre
     ORDER BY e.id, MIN(er.orden)`,
    [sesion.alumnoId]
  );

  const categoriasPorExamen = {};
  for (const f of filasCategoria) {
    if (!categoriasPorExamen[f.examen_id]) categoriasPorExamen[f.examen_id] = [];
    categoriasPorExamen[f.examen_id].push({
      categoria: f.categoria_padre ? `${f.categoria_padre} › ${f.categoria}` : f.categoria,
      total: parseInt(f.total, 10),
      correctas: parseInt(f.correctas, 10),
      porcentaje: Math.round((parseInt(f.correctas, 10) / parseInt(f.total, 10)) * 100),
    });
  }

  const historial = rows.map((r) => ({
    examenId: r.id,
    iniciadoEn: r.iniciado_en,
    finalizadoEn: r.finalizado_en,
    total: parseInt(r.total, 10),
    correctas: parseInt(r.correctas, 10),
    porcentaje: Math.round((parseInt(r.correctas, 10) / parseInt(r.total, 10)) * 100),
    porCategoria: categoriasPorExamen[r.id] || [],
  }));

  return res.status(200).json(historial);
}
