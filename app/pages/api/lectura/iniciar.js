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

  const { rows: diag } = await pool.query(
    `SELECT count(*) FROM examenes WHERE alumno_id = $1 AND estado = 'finalizado'`,
    [sesion.alumnoId]
  );
  if (parseInt(diag[0].count, 10) === 0) {
    return res.status(403).json({ error: 'Debes terminar tu examen de diagnóstico antes de presentar la lectura.' });
  }

  // Si ya tiene un intento, se retoma (no se crea otro): la lectura queda
  // fija desde que se inició, aunque el admin cambie la activa después.
  const { rows: existente } = await pool.query(
    'SELECT id FROM lecturas_velocidad_intentos WHERE alumno_id = $1 ORDER BY id DESC LIMIT 1',
    [sesion.alumnoId]
  );
  if (existente[0]) {
    return res.status(200).json({ intentoId: existente[0].id, retomado: true });
  }

  const { rows: activaRows } = await pool.query('SELECT id FROM lecturas_velocidad WHERE activa = TRUE LIMIT 1');
  if (!activaRows[0]) {
    return res.status(400).json({ error: 'No hay ninguna lectura activa configurada. Contacta al administrador.' });
  }

  const { rows } = await pool.query(
    `INSERT INTO lecturas_velocidad_intentos (alumno_id, lectura_velocidad_id, estado)
     VALUES ($1, $2, 'leyendo') RETURNING id`,
    [sesion.alumnoId, activaRows[0].id]
  );

  return res.status(201).json({ intentoId: rows[0].id, retomado: false });
}
