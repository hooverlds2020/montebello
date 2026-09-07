const { pool } = require('../../../lib/db');
const { getAlumnoDesdeRequest } = require('../../../lib/auth-alumno');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const sesion = getAlumnoDesdeRequest(req);
  if (!sesion) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const { intentoId, preguntaId, opcionId } = req.body;

  const { rows } = await pool.query(
    'SELECT id FROM lecturas_velocidad_intentos WHERE id = $1 AND alumno_id = $2',
    [intentoId, sesion.alumnoId]
  );
  if (!rows[0]) {
    return res.status(404).json({ error: 'Intento no encontrado' });
  }

  await pool.query(
    `INSERT INTO lecturas_velocidad_respuestas (intento_id, pregunta_id, opcion_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (intento_id, pregunta_id) DO UPDATE SET opcion_id = $3`,
    [intentoId, preguntaId, opcionId]
  );

  return res.status(200).json({ ok: true });
}
