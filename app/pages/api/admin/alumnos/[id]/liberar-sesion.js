const { pool } = require('../../../../../lib/db');
const { estaAutenticado } = require('../../../../../lib/auth');

export default async function handler(req, res) {
  if (!estaAutenticado(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const { id } = req.query;
  const { rows } = await pool.query(
    'UPDATE alumnos SET sesion_token = NULL, sesion_expira = NULL WHERE id = $1 RETURNING id',
    [id]
  );
  if (!rows[0]) {
    return res.status(404).json({ error: 'Alumno no encontrado' });
  }
  return res.status(200).json({ ok: true });
}
