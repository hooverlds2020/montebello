const { pool } = require('../../../lib/db');
const { estaAutenticado } = require('../../../lib/auth');

export default async function handler(req, res) {
  if (!estaAutenticado(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (req.method === 'GET') {
    const { rows } = await pool.query('SELECT * FROM categorias ORDER BY id');
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const { nombre } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre de la categoría es obligatorio' });
    }
    try {
      const { rows } = await pool.query(
        'INSERT INTO categorias (nombre) VALUES ($1) RETURNING *',
        [nombre.trim()]
      );
      return res.status(201).json(rows[0]);
    } catch (e) {
      if (e.code === '23505') {
        return res.status(409).json({ error: 'Ya existe una categoría con ese nombre' });
      }
      return res.status(500).json({ error: e.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} not allowed`);
}
