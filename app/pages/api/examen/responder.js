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

  const { examenReactivoId, opcionId } = req.body;
  if (!examenReactivoId || !opcionId) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  // Verifica que ese examen_reactivo pertenezca a un examen del alumno logueado
  const { rows } = await pool.query(
    `SELECT er.id, e.alumno_id, e.estado
     FROM examen_reactivos er
     JOIN examenes e ON e.id = er.examen_id
     WHERE er.id = $1`,
    [examenReactivoId]
  );
  const registro = rows[0];
  if (!registro || registro.alumno_id !== sesion.alumnoId) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  if (registro.estado === 'finalizado') {
    return res.status(409).json({ error: 'Este examen ya fue finalizado' });
  }

  await pool.query(
    `UPDATE examen_reactivos SET opcion_respondida_id = $1, respondido_en = NOW() WHERE id = $2`,
    [opcionId, examenReactivoId]
  );

  return res.status(200).json({ ok: true });
}
