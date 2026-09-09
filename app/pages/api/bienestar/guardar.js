const { pool } = require('../../../lib/db');
const { getAlumnoDesdeRequest } = require('../../../lib/auth-alumno');

// Puntos de corte oficiales del instrumento TMMS-24 (distintos por género).
// Devuelve el nivel según el puntaje y el factor (percepción/comprensión/regulación).
function nivelPercepcion(puntaje, genero) {
  if (genero === 'M') {
    if (puntaje < 22) return 'Debe mejorar su percepción: presta poca atención';
    if (puntaje <= 32) return 'Adecuada percepción';
    return 'Debe mejorar su percepción: presta demasiada atención';
  }
  // Femenino (u otro/no especificado se trata igual que el corte de mujeres
  // del instrumento original, que es el que documenta el PDF)
  if (puntaje < 25) return 'Debe mejorar su percepción: presta poca atención';
  if (puntaje <= 35) return 'Adecuada percepción';
  return 'Debe mejorar su percepción: presta demasiada atención';
}

function nivelComprension(puntaje, genero) {
  if (genero === 'M') {
    if (puntaje < 26) return 'Debe mejorar su comprensión';
    if (puntaje <= 35) return 'Adecuada comprensión';
    return 'Excelente comprensión';
  }
  if (puntaje < 24) return 'Debe mejorar su comprensión';
  if (puntaje <= 34) return 'Adecuada comprensión';
  return 'Excelente comprensión';
}

function nivelRegulacion(puntaje, genero) {
  if (genero === 'M') {
    if (puntaje < 24) return 'Debe mejorar su regulación';
    if (puntaje <= 35) return 'Adecuada regulación';
    return 'Excelente regulación';
  }
  if (puntaje < 24) return 'Debe mejorar su regulación';
  if (puntaje <= 34) return 'Adecuada regulación';
  return 'Excelente regulación';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const sesion = getAlumnoDesdeRequest(req);
  if (!sesion) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const { genero, respuestas } = req.body; // respuestas: array de 24 números (1-5)
  if (!['M', 'F'].includes(genero)) {
    return res.status(400).json({ error: 'Falta indicar género (necesario para calcular el resultado)' });
  }
  if (!Array.isArray(respuestas) || respuestas.length !== 24 || respuestas.some((r) => ![1, 2, 3, 4, 5].includes(r))) {
    return res.status(400).json({ error: 'Debes responder las 24 afirmaciones' });
  }

  // Evita duplicados: si ya existe una respuesta de este alumno, no crea otra.
  const { rows: existente } = await pool.query('SELECT id FROM tmms_respuestas WHERE alumno_id = $1', [sesion.alumnoId]);
  if (existente[0]) {
    return res.status(409).json({ error: 'Ya se registró esta actividad anteriormente.' });
  }

  const suma = (desde, hasta) => respuestas.slice(desde - 1, hasta).reduce((a, b) => a + b, 0);
  const percepcion = suma(1, 8);
  const comprension = suma(9, 16);
  const regulacion = suma(17, 24);

  await pool.query('UPDATE alumnos SET genero = $1 WHERE id = $2', [genero, sesion.alumnoId]);

  const columnas = respuestas.map((_, i) => `item_${i + 1}`).join(', ');
  const marcadores = respuestas.map((_, i) => `$${i + 1}`).join(', ');
  await pool.query(
    `INSERT INTO tmms_respuestas
       (alumno_id, ${columnas}, percepcion, comprension, regulacion, nivel_percepcion, nivel_comprension, nivel_regulacion, sesion_finalizacion)
     VALUES ($${respuestas.length + 1}, ${marcadores}, $${respuestas.length + 2}, $${respuestas.length + 3}, $${respuestas.length + 4}, $${respuestas.length + 5}, $${respuestas.length + 6}, $${respuestas.length + 7}, $${respuestas.length + 8})`,
    [
      ...respuestas,
      sesion.alumnoId,
      percepcion,
      comprension,
      regulacion,
      nivelPercepcion(percepcion, genero),
      nivelComprension(comprension, genero),
      nivelRegulacion(regulacion, genero),
      sesion.sesionId,
    ]
  );

  // Respuesta al alumno: SIN números ni niveles, solo confirmación neutra.
  return res.status(201).json({ ok: true });
}
