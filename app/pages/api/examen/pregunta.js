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

const SELECT_PREGUNTA = `
  SELECT er.id AS examen_reactivo_id, er.opciones_orden, er.opcion_respondida_id,
         r.id AS reactivo_id, r.pregunta, r.imagen_url, r.lectura_id,
         c.nombre AS categoria,
         l.titulo AS lectura_titulo, l.subtitulo AS lectura_subtitulo,
         l.texto AS lectura_texto, l.imagen_url AS lectura_imagen_url
  FROM examen_reactivos er
  JOIN reactivos r ON r.id = er.reactivo_id
  JOIN categorias c ON c.id = r.categoria_id
  LEFT JOIN lecturas l ON l.id = r.lectura_id
`;

export default async function handler(req, res) {
  const sesion = getAlumnoDesdeRequest(req);
  if (!sesion) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const { examenId, examenReactivoId } = req.query;

  // Verifica que el examen sea del alumno logueado (no de otro)
  const { rows: examenRows } = await pool.query(
    `SELECT id, estado, tiempo_limite_minutos, iniciado_en FROM examenes WHERE id = $1 AND alumno_id = $2`,
    [examenId, sesion.alumnoId]
  );
  const examen = examenRows[0];
  if (!examen) {
    return res.status(404).json({ error: 'Examen no encontrado' });
  }

  let objetivo;
  if (examenReactivoId) {
    // El alumno pidió una pregunta específica (clic en el mapa de preguntas,
    // o "Siguiente" apuntando a una posición concreta).
    const { rows } = await pool.query(
      `${SELECT_PREGUNTA} WHERE er.id = $1 AND er.examen_id = $2`,
      [examenReactivoId, examenId]
    );
    objetivo = rows[0];
    if (!objetivo) {
      return res.status(404).json({ error: 'Esa pregunta no pertenece a este examen' });
    }
  } else {
    // Sin especificar: la primera sin responder; si ya están todas
    // respondidas, cae de vuelta en la primera del examen (por si el alumno
    // recarga la página después de haber terminado de contestar todo, sin
    // haber presionado aún "Finalizar examen").
    const { rows } = await pool.query(
      `${SELECT_PREGUNTA} WHERE er.examen_id = $1
       ORDER BY (er.opcion_respondida_id IS NOT NULL) ASC, er.orden ASC
       LIMIT 1`,
      [examenId]
    );
    objetivo = rows[0];
  }

  if (!objetivo) {
    // Solo pasa si el examen no tiene ninguna pregunta asociada (caso raro)
    return res.status(200).json({ terminado: true });
  }

  const { rows: opcionesDb } = await pool.query(
    `SELECT id, texto, imagen_url FROM opciones WHERE reactivo_id = $1`,
    [objetivo.reactivo_id]
  );

  // El orden de las opciones se decide UNA sola vez por alumno/pregunta y se
  // guarda, para que no cambie si el alumno refresca, pierde conexión, o
  // navega hacia otra pregunta y regresa (si no, la letra a/b/c se movería
  // de lugar bajo sus pies).
  let opciones;
  if (objetivo.opciones_orden) {
    let ordenIds = [];
    try {
      ordenIds = JSON.parse(objetivo.opciones_orden);
    } catch (e) {
      ordenIds = [];
    }
    const porId = new Map(opcionesDb.map((o) => [o.id, o]));
    opciones = ordenIds.map((id) => porId.get(id)).filter(Boolean);
    for (const o of opcionesDb) {
      if (!opciones.includes(o)) opciones.push(o);
    }
  } else {
    opciones = barajar(opcionesDb);
    await pool.query(`UPDATE examen_reactivos SET opciones_orden = $1 WHERE id = $2`, [
      JSON.stringify(opciones.map((o) => o.id)),
      objetivo.examen_reactivo_id,
    ]);
  }

  return res.status(200).json({
    terminado: false,
    examenReactivoId: objetivo.examen_reactivo_id,
    pregunta: objetivo.pregunta,
    imagenUrl: objetivo.imagen_url,
    categoria: objetivo.categoria,
    lectura: objetivo.lectura_id
      ? {
          id: objetivo.lectura_id,
          titulo: objetivo.lectura_titulo,
          subtitulo: objetivo.lectura_subtitulo,
          texto: objetivo.lectura_texto,
          imagenUrl: objetivo.lectura_imagen_url,
        }
      : null,
    opciones,
    // Si el alumno ya había respondido esta pregunta antes (porque regresó a
    // revisarla desde el mapa), se le preselecciona su respuesta anterior.
    opcionSeleccionadaId: objetivo.opcion_respondida_id || null,
    tiempoLimiteMinutos: examen.tiempo_limite_minutos,
    iniciadoEn: examen.iniciado_en,
  });
}
