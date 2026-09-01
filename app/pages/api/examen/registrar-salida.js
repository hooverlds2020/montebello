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

  const { examenId } = req.body;

  // Solo cuenta si el examen es del alumno logueado y sigue en progreso —
  // no tiene caso registrar salidas de un examen ya finalizado.
  const { rows } = await pool.query(
    `UPDATE examenes SET salidas_pantalla = salidas_pantalla + 1
     WHERE id = $1 AND alumno_id = $2 AND estado = 'en_progreso'
     RETURNING salidas_pantalla`,
    [examenId, sesion.alumnoId]
  );

  return res.status(200).json({ ok: true, salidasPantalla: rows[0]?.salidas_pantalla ?? null });
}
