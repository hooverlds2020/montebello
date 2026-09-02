const { pool } = require('../../../lib/db');
const { estaAutenticado } = require('../../../lib/auth');

export default async function handler(req, res) {
  if (!estaAutenticado(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  // Último intento finalizado de cada alumno (uno por alumno)
  const { rows: ultimosIntentos } = await pool.query(
    `SELECT DISTINCT ON (e.alumno_id)
            e.id AS examen_id, e.alumno_id, e.finalizado_en,
            a.nombre, a.email,
            count(er.id) AS total,
            count(er.id) FILTER (WHERE o.es_correcta) AS correctas
     FROM examenes e
     JOIN alumnos a ON a.id = e.alumno_id
     JOIN examen_reactivos er ON er.examen_id = e.id
     LEFT JOIN opciones o ON o.id = er.opcion_respondida_id
     WHERE e.estado = 'finalizado'
     GROUP BY e.id, e.alumno_id, e.finalizado_en, a.nombre, a.email
     ORDER BY e.alumno_id, e.finalizado_en DESC`
  );

  const { rows: conteoIntentos } = await pool.query(
    `SELECT alumno_id, count(*) AS intentos
     FROM examenes WHERE estado = 'finalizado'
     GROUP BY alumno_id`
  );
  const intentosPorAlumno = Object.fromEntries(conteoIntentos.map((r) => [r.alumno_id, parseInt(r.intentos, 10)]));

  const alumnos = ultimosIntentos.map((r) => ({
    alumnoId: r.alumno_id,
    nombre: r.nombre,
    email: r.email,
    examenId: r.examen_id,
    finalizadoEn: r.finalizado_en,
    total: parseInt(r.total, 10),
    correctas: parseInt(r.correctas, 10),
    porcentaje: Math.round((parseInt(r.correctas, 10) / parseInt(r.total, 10)) * 100),
    intentos: intentosPorAlumno[r.alumno_id] || 1,
  })).sort((a, b) => new Date(b.finalizadoEn) - new Date(a.finalizadoEn));

  const promedioGeneral = alumnos.length > 0
    ? Math.round(alumnos.reduce((acc, a) => acc + a.porcentaje, 0) / alumnos.length)
    : null;

  const examenIds = alumnos.map((a) => a.examenId);
  let promedioPorMateria = [];
  if (examenIds.length > 0) {
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
       WHERE er.examen_id = ANY($1)
       GROUP BY c.nombre, padre.nombre
       ORDER BY MIN(er.orden)`,
      [examenIds]
    );
    promedioPorMateria = filasMateria.map((f) => ({
      categoria: f.categoria_padre ? `${f.categoria_padre} › ${f.categoria}` : f.categoria,
      total: parseInt(f.total, 10),
      correctas: parseInt(f.correctas, 10),
      incorrectas: parseInt(f.incorrectas, 10),
      sinContestar: parseInt(f.sin_contestar, 10),
      porcentaje: Math.round((parseInt(f.correctas, 10) / parseInt(f.total, 10)) * 100),
    }));
  }

  return res.status(200).json({
    totalAlumnosEvaluados: alumnos.length,
    promedioGeneral,
    promedioPorMateria,
    alumnos,
  });
}
