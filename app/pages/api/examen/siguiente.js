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
    `SELECT er.id AS examen_reactivo_id, er.opciones_orden, r.id AS reactivo_id, r.pregunta, r.imagen_url, r.lectura_id,
            c.nombre AS categoria,
            l.titulo AS lectura_titulo, l.subtitulo AS lectura_subtitulo,
            l.texto AS lectura_texto, l.imagen_url AS lectura_imagen_url
     FROM examen_reactivos er
     JOIN reactivos r ON r.id = er.reactivo_id
     JOIN categorias c ON c.id = r.categoria_id
     LEFT JOIN lecturas l ON l.id = r.lectura_id
     WHERE er.examen_id = $1 AND er.opcion_respondida_id IS NULL
     ORDER BY er.orden ASC
     LIMIT 1`,
    [examenId]
  );
  const siguiente = siguienteRows[0];
  if (!siguiente) {
    return res.status(200).json({ terminado: true, total, respondidas });
  }

  const { rows: opcionesDb } = await pool.query(
    `SELECT id, texto, imagen_url FROM opciones WHERE reactivo_id = $1`,
    [siguiente.reactivo_id]
  );

  // El orden de las opciones se decide UNA sola vez por alumno/pregunta y se
  // guarda, para que no cambie si el alumno refresca o pierde conexión a
  // medio responder (si no, la letra a/b/c se movería de lugar bajo sus pies).
  let opciones;
  if (siguiente.opciones_orden) {
    let ordenIds = [];
    try {
      ordenIds = JSON.parse(siguiente.opciones_orden);
    } catch (e) {
      ordenIds = [];
    }
    const porId = new Map(opcionesDb.map((o) => [o.id, o]));
    opciones = ordenIds.map((id) => porId.get(id)).filter(Boolean);
    // Por si se agregó/borró una opción después de haber guardado el orden
    // (caso raro, edición del admin a medio examen): agregamos al final las
    // que falten y descartamos las que ya no existan.
    for (const o of opcionesDb) {
      if (!opciones.includes(o)) opciones.push(o);
    }
  } else {
    opciones = barajar(opcionesDb);
    await pool.query(`UPDATE examen_reactivos SET opciones_orden = $1 WHERE id = $2`, [
      JSON.stringify(opciones.map((o) => o.id)),
      siguiente.examen_reactivo_id,
    ]);
  }

  return res.status(200).json({
    terminado: false,
    total,
    respondidas,
    numero: respondidas + 1,
    examenReactivoId: siguiente.examen_reactivo_id,
    pregunta: siguiente.pregunta,
    imagenUrl: siguiente.imagen_url,
    categoria: siguiente.categoria,
    lectura: siguiente.lectura_id
      ? {
          id: siguiente.lectura_id,
          titulo: siguiente.lectura_titulo,
          subtitulo: siguiente.lectura_subtitulo,
          texto: siguiente.lectura_texto,
          imagenUrl: siguiente.lectura_imagen_url,
        }
      : null,
    opciones,
    tiempoLimiteMinutos: examen.tiempo_limite_minutos,
    iniciadoEn: examen.iniciado_en,
  });
}
