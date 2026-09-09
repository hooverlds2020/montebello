const { pool } = require('../../../lib/db');
const { getPsicologiaDesdeRequest } = require('../../../lib/auth-psicologia');

export default async function handler(req, res) {
  const sesion = getPsicologiaDesdeRequest(req);
  if (!sesion) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  const { rows } = await pool.query('SELECT nombre, email FROM usuarios_psicologia WHERE id = $1', [sesion.usuarioId]);
  if (!rows[0]) {
    return res.status(401).json({ error: 'Usuario no encontrado' });
  }
  return res.status(200).json(rows[0]);
}
