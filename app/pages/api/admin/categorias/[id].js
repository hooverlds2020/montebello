const { pool } = require('../../../../lib/db');
const { estaAutenticado } = require('../../../../lib/auth');

export default async function handler(req, res) {
  if (!estaAutenticado(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { id } = req.query;

  if (req.method === 'PUT') {
    const { nombre, activa, cantidad_examen } = req.body;
    try {
      if (nombre !== undefined) {
        await pool.query('UPDATE categorias SET nombre = $1 WHERE id = $2', [nombre.trim(), id]);
      }
      if (activa !== undefined) {
        await pool.query('UPDATE categorias SET activa = $1 WHERE id = $2', [activa, id]);
      }
      if (cantidad_examen !== undefined) {
        await pool.query('UPDATE categorias SET cantidad_examen = $1 WHERE id = $2', [cantidad_examen, id]);
      }
      return res.status(200).json({ ok: true });
    } catch (e) {
      if (e.code === '23505') {
        return res.status(409).json({ error: 'Ya existe una materia con ese nombre' });
      }
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'DELETE') {
    const { rows } = await pool.query('SELECT count(*) FROM reactivos WHERE categoria_id = $1', [id]);
    if (parseInt(rows[0].count, 10) > 0) {
      return res.status(409).json({ error: 'Esta materia tiene preguntas cargadas, no se puede eliminar. Puedes deshabilitarla en su lugar.' });
    }
    await pool.query('DELETE FROM categorias WHERE id = $1', [id]);
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} not allowed`);
}
