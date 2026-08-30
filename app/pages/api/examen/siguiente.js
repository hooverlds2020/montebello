const { pool } = require('../../../lib/db');
const { getAlumnoDesdeRequest } = require('../../../lib/auth-alumno');

function barajar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default async function handler(req, res) {
  const sesion = getAlumnoDesdeRequest(req);
  if (!sesion) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const { examenId } = req.query;

  // Verifica que el examen sea del alumno logueado (no de otro)
  const { rows: examenRows } = await pool.query(
    `SELECT id, estado, tiempo_limite_minutos, iniciado_en FROM examenes WHERE id = $1 AND alumno_id = $2`,
    [examenId, sesion.alumnoId]
  );
  const examen = examenRows[0];
  if (!examen) {
    return res.status(404).json({ error: 'Examen no encontrado' });
  }

  const { rows: totalRows } = await pool.query(
    `SELECT count(*) FROM examen_reactivos WHERE examen_id = $1`,
    [examenId]
  );
  const total = parseInt(totalRows[0].count, 10);

  const { rows: respondidasRows } = await pool.query(
    `SELECT count(*) FROM examen_reactivos WHERE examen_id = $1 AND opcion_respondida_id IS NOT NULL`,
    [examenId]
  );
  const respondidas = parseInt(respondidasRows[0].count, 10);

  if (examen.estado === 'finalizado' || respondidas >= total) {
    return res.status(200).json({ terminado: true, total, respondidas });
  }

  const { rows: siguienteRows } = await pool.query(
    `SELECT er.id AS examen_reactivo_id, r.id AS reactivo_id, r.pregunta, r.imagen_url, c.nombre AS categoria
     FROM examen_reactivos er
     JOIN reactivos r ON r.id = er.reactivo_id
     JOIN categorias c ON c.id = r.categoria_id
     WHERE er.examen_id = $1 AND er.opcion_respondida_id IS NULL
     ORDER BY er.orden ASC
     LIMIT 1`,
    [examenId]
  );
  const siguiente = siguienteRows[0];
  if (!siguiente) {
    return res.status(200).json({ terminado: true, total, respondidas });
  }

  const { rows: opciones } = await pool.query(
    `SELECT id, texto, imagen_url FROM opciones WHERE reactivo_id = $1`,
    [siguiente.reactivo_id]
  );

  return res.status(200).json({
    terminado: false,
    total,
    respondidas,
    numero: respondidas + 1,
    examenReactivoId: siguiente.examen_reactivo_id,
    pregunta: siguiente.pregunta,
    imagenUrl: siguiente.imagen_url,
    categoria: siguiente.categoria,
    opciones: barajar(opciones), // orden aleatorio para que no sea igual entre alumnos
    tiempoLimiteMinutos: examen.tiempo_limite_minutos,
    iniciadoEn: examen.iniciado_en,
  });
}
