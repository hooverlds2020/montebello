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

  const { intentoId } = req.body;

  const { rows } = await pool.query(
    `SELECT id, iniciado_en, estado FROM lecturas_velocidad_intentos WHERE id = $1 AND alumno_id = $2`,
    [intentoId, sesion.alumnoId]
  );
  const intento = rows[0];
  if (!intento) {
    return res.status(404).json({ error: 'Intento no encontrado' });
  }
  if (intento.estado !== 'leyendo') {
    // Idempotente: si ya se marcó, no recalcula de nuevo el tiempo.
    return res.status(200).json({ ok: true, yaEstaba: true });
  }

  // El tiempo se calcula con el reloj del SERVIDOR (iniciado_en guardado al
  // crear el intento vs. ahora), no con el reloj del celular del alumno —
  // así no se puede manipular el resultado.
  await pool.query(
    `UPDATE lecturas_velocidad_intentos
     SET estado = 'preguntas',
         texto_terminado_en = NOW(),
         tiempo_segundos = EXTRACT(EPOCH FROM (NOW() - iniciado_en))::INTEGER
     WHERE id = $1`,
    [intentoId]
  );

  return res.status(200).json({ ok: true });
}
