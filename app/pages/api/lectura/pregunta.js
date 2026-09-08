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

  const { intentoId } = req.query;

  const { rows: intentoRows } = await pool.query(
    'SELECT id, lectura_velocidad_id, estado FROM lecturas_velocidad_intentos WHERE id = $1 AND alumno_id = $2',
    [intentoId, sesion.alumnoId]
  );
  const intento = intentoRows[0];
  if (!intento) {
    return res.status(404).json({ error: 'Intento no encontrado' });
  }

  const { rows: preguntas } = await pool.query(
    `SELECT p.id, p.pregunta,
            r.opcion_id AS opcion_respondida_id
     FROM lecturas_velocidad_preguntas p
     LEFT JOIN lecturas_velocidad_respuestas r ON r.pregunta_id = p.id AND r.intento_id = $1
     WHERE p.lectura_velocidad_id = $2
     ORDER BY (r.opcion_id IS NOT NULL) ASC, RANDOM()
     LIMIT 1`,
    [intentoId, intento.lectura_velocidad_id]
  );

  const objetivo = preguntas[0];
  if (!objetivo) {
    return res.status(200).json({ terminado: true });
  }

  const { rows: opciones } = await pool.query(
    'SELECT id, texto FROM lecturas_velocidad_opciones WHERE pregunta_id = $1',
    [objetivo.id]
  );

  return res.status(200).json({
    terminado: false,
    preguntaId: objetivo.id,
    pregunta: objetivo.pregunta,
    opciones: barajar(opciones),
    opcionSeleccionadaId: objetivo.opcion_respondida_id || null,
  });
}
