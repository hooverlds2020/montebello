const { pool } = require('../../../lib/db');
const { estaAutenticado } = require('../../../lib/auth');

export default async function handler(req, res) {
  if (!estaAutenticado(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (req.method === 'GET') {
    const { rows } = await pool.query('SELECT * FROM lecturas ORDER BY id DESC');
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const { titulo, subtitulo, texto_html, imagen_url } = req.body;
    if (!texto_html || !texto_html.trim()) {
      return res.status(400).json({ error: 'El texto de la lectura no puede estar vacío' });
    }
    const { rows } = await pool.query(
      'INSERT INTO lecturas (titulo, subtitulo, texto, imagen_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [titulo || null, subtitulo || null, texto_html, imagen_url || null]
    );
    return res.status(201).json(rows[0]);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} not allowed`);
}
