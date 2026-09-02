const { pool } = require('../../../lib/db');
const { getAlumnoDesdeRequest } = require('../../../lib/auth-alumno');

export default async function handler(req, res) {
  const sesion = getAlumnoDesdeRequest(req);
  if (!sesion) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const { examenId } = req.query;

  const { rows: examenRows } = await pool.query(
    `SELECT id, estado FROM examenes WHERE id = $1 AND alumno_id = $2`,
    [examenId, sesion.alumnoId]
  );
  const examen = examenRows[0];
  if (!examen) {
    return res.status(404).json({ error: 'Examen no encontrado' });
  }

  if (req.method === 'POST') {
    // Finaliza el examen (idempotente: si ya estaba finalizado, no hace nada)
    await pool.query(
      `UPDATE examenes SET estado = 'finalizado', finalizado_en = NOW() WHERE id = $1 AND estado != 'finalizado'`,
      [examenId]
    );
  }

  const { rows: porCategoria } = await pool.query(
    `SELECT c.nombre AS categoria,
            count(*) AS total,
            count(*) FILTER (WHERE o.es_correcta) AS correctas,
            count(*) FILTER (WHERE er.opcion_respondida_id IS NOT NULL AND NOT o.es_correcta) AS incorrectas,
            count(*) FILTER (WHERE er.opcion_respondida_id IS NULL) AS sin_contestar
     FROM examen_reactivos er
     JOIN reactivos r ON r.id = er.reactivo_id
     JOIN categorias c ON c.id = r.categoria_id
     LEFT JOIN opciones o ON o.id = er.opcion_respondida_id
     WHERE er.examen_id = $1
     GROUP BY c.nombre
     ORDER BY MIN(er.orden)`,
    [examenId]
  );

  const resultado = porCategoria.map((r) => ({
    categoria: r.categoria,
    total: parseInt(r.total, 10),
    correctas: parseInt(r.correctas, 10),
    incorrectas: parseInt(r.incorrectas, 10),
    sinContestar: parseInt(r.sin_contestar, 10),
    porcentaje: Math.round((parseInt(r.correctas, 10) / parseInt(r.total, 10)) * 100),
  }));

  const totalGeneral = resultado.reduce((acc, r) => acc + r.total, 0);
  const correctasGeneral = resultado.reduce((acc, r) => acc + r.correctas, 0);
  const incorrectasGeneral = resultado.reduce((acc, r) => acc + r.incorrectas, 0);
  const sinContestarGeneral = resultado.reduce((acc, r) => acc + r.sinContestar, 0);
  const porcentajeGeneral = totalGeneral > 0 ? Math.round((correctasGeneral / totalGeneral) * 100) : 0;

  return res.status(200).json({
    examenId: examen.id,
    porCategoria: resultado,
    general: {
      total: totalGeneral,
      correctas: correctasGeneral,
      incorrectas: incorrectasGeneral,
      sinContestar: sinContestarGeneral,
      porcentaje: porcentajeGeneral,
    },
  });
}
