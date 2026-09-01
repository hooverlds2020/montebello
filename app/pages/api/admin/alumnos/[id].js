const { pool } = require('../../../../lib/db');
const { estaAutenticado } = require('../../../../lib/auth');

export default async function handler(req, res) {
  if (!estaAutenticado(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { id } = req.query;

  if (req.method === 'DELETE') {
    const { rows: existe } = await pool.query('SELECT id FROM alumnos WHERE id = $1', [id]);
    if (!existe[0]) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Siempre se borra primero el historial de examenes (examen_reactivos
      // depende de examenes por llave foránea).
      const { rows: examenesDelAlumno } = await client.query('SELECT id FROM examenes WHERE alumno_id = $1', [id]);
      const idsExamenes = examenesDelAlumno.map((e) => e.id);
      if (idsExamenes.length > 0) {
        await client.query('DELETE FROM examen_reactivos WHERE examen_id = ANY($1)', [idsExamenes]);
        await client.query('DELETE FROM examenes WHERE id = ANY($1)', [idsExamenes]);
      }

      // ?soloHistorial=1 : deja la cuenta del alumno intacta, solo borra sus
      // intentos de examen (para "empezar de cero" sin perder el registro).
      if (req.query.soloHistorial) {
        await client.query('COMMIT');
        return res.status(200).json({ ok: true, soloHistorial: true });
      }

      // Sin ese parámetro: borra la cuenta completa del alumno.
      await client.query('DELETE FROM password_resets WHERE alumno_id = $1', [id]);
      await client.query('DELETE FROM alumnos WHERE id = $1', [id]);
      await client.query('COMMIT');
      return res.status(200).json({ ok: true, soloHistorial: false });
    } catch (e) {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: e.message });
    } finally {
      client.release();
    }
  }

  const { rows: alumnoRows } = await pool.query('SELECT id, nombre, email, telefono, preparatoria_procedencia, creado_en FROM alumnos WHERE id = $1', [id]);
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
