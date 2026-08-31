const { pool } = require('../../../../lib/db');
const { estaAutenticado } = require('../../../../lib/auth');

export default async function handler(req, res) {
  if (!estaAutenticado(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { id } = req.query;

  const { rows: alumnoRows } = await pool.query('SELECT id, nombre, email, creado_en FROM alumnos WHERE id = $1', [id]);
  const alumno = alumnoRows[0];
  if (!alumno) {
    return res.status(404).json({ error: 'Alumno no encontrado' });
  }

  const { rows: examenes } = await pool.query(
    `SELECT e.id, e.iniciado_en, e.finalizado_en,
            count(er.id) AS total,
            count(er.id) FILTER (WHERE o.es_correcta) AS correctas
     FROM examenes e
     JOIN examen_reactivos er ON er.examen_id = e.id
     LEFT JOIN opciones o ON o.id = er.opcion_respondida_id
     WHERE e.alumno_id = $1 AND e.estado = 'finalizado'
     GROUP BY e.id
     ORDER BY e.finalizado_en DESC`,
    [id]
  );

  const { rows: filasMateria } = await pool.query(
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
     ORDER BY e.id, c.nombre`,
    [id]
  );

  const categoriasPorExamen = {};
  for (const f of filasMateria) {
    if (!categoriasPorExamen[f.examen_id]) categoriasPorExamen[f.examen_id] = [];
    categoriasPorExamen[f.examen_id].push({
      categoria: f.categoria_padre ? `${f.categoria_padre} › ${f.categoria}` : f.categoria,
      total: parseInt(f.total, 10),
      correctas: parseInt(f.correctas, 10),
      porcentaje: Math.round((parseInt(f.correctas, 10) / parseInt(f.total, 10)) * 100),
    });
  }

  const historial = examenes.map((e) => ({
    examenId: e.id,
    iniciadoEn: e.iniciado_en,
    finalizadoEn: e.finalizado_en,
    total: parseInt(e.total, 10),
    correctas: parseInt(e.correctas, 10),
    porcentaje: Math.round((parseInt(e.correctas, 10) / parseInt(e.total, 10)) * 100),
    porCategoria: categoriasPorExamen[e.id] || [],
  }));

  return res.status(200).json({ alumno, historial });
}
