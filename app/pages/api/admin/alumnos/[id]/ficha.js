const { pool } = require('../../../../../lib/db');
const { estaAutenticado } = require('../../../../../lib/auth');

export default async function handler(req, res) {
  if (!estaAutenticado(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).end();
  }

  const { id } = req.query;
  const { ficha_registro } = req.body;

  const { rows } = await pool.query(
    'UPDATE alumnos SET ficha_registro = $1 WHERE id = $2 RETURNING id',
    [ficha_registro ? JSON.stringify(ficha_registro) : null, id]
  );
  if (!rows[0]) {
    return res.status(404).json({ error: 'Alumno no encontrado' });
  }

  return res.status(200).json({ ok: true });
}
