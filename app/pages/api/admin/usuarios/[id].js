const { pool } = require('../../../../lib/db');
const { estaAutenticado, getAdminDesdeRequest } = require('../../../../lib/auth');

export default async function handler(req, res) {
  if (!estaAutenticado(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { id } = req.query;

  if (req.method === 'DELETE') {
    const sesion = getAdminDesdeRequest(req);
    if (sesion.adminId && parseInt(id, 10) === sesion.adminId) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta mientras tienes sesión activa' });
    }

    const { rows: total } = await pool.query('SELECT count(*) FROM administradores');
    if (parseInt(total[0].count, 10) <= 1) {
      return res.status(409).json({ error: 'Debe quedar al menos un administrador registrado' });
    }

    await pool.query('DELETE FROM administradores WHERE id = $1', [id]);
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['DELETE']);
  res.status(405).end();
}
