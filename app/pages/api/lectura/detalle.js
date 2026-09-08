const { pool } = require('../../../lib/db');
const { getAlumnoDesdeRequest } = require('../../../lib/auth-alumno');

// Detalle pregunta por pregunta de un intento ya finalizado: qué opción
// eligió el alumno, cuál era la correcta, y si acertó o no. Valida que el
// intento pertenezca al alumno de la sesión actual (nadie puede ver el
// detalle de otro alumno cambiando el intentoId en la URL).
export default async function handler(req, res) {
  const sesion = getAlumnoDesdeRequest(req);
  if (!sesion) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const { intentoId } = req.query;

  const { rows: intentoRows } = await pool.query(
    'SELECT id, lectura_velocidad_id FROM lecturas_velocidad_intentos WHERE id = $1 AND alumno_id = $2',
    [intentoId, sesion.alumnoId]
  );
  const intento = intentoRows[0];
  if (!intento) {
    return res.status(404).json({ error: 'Intento no encontrado' });
  }

  const { rows: preguntas } = await pool.query(
    `SELECT p.id, p.pregunta, r.opcion_id AS opcion_elegida_id
     FROM lecturas_velocidad_preguntas p
     LEFT JOIN lecturas_velocidad_respuestas r ON r.pregunta_id = p.id AND r.intento_id = $1
     WHERE p.lectura_velocidad_id = $2
     ORDER BY p.orden, p.id`,
    [intentoId, intento.lectura_velocidad_id]
  );

  const { rows: opciones } = await pool.query(
    `SELECT o.id, o.pregunta_id, o.texto, o.es_correcta
     FROM lecturas_velocidad_opciones o
     JOIN lecturas_velocidad_preguntas p ON p.id = o.pregunta_id
     WHERE p.lectura_velocidad_id = $1`,
    [intento.lectura_velocidad_id]
  );

  const detalle = preguntas.map((p) => {
    const opcionesDeEsta = opciones.filter((o) => o.pregunta_id === p.id);
    const correcta = opcionesDeEsta.find((o) => o.es_correcta);
    const elegida = opcionesDeEsta.find((o) => o.id === p.opcion_elegida_id);
    return {
      pregunta: p.pregunta,
      opcionElegida: elegida ? elegida.texto : null,
      opcionCorrecta: correcta ? correcta.texto : null,
      acerto: !!(elegida && correcta && elegida.id === correcta.id),
    };
  });

  return res.status(200).json({ detalle });
}
