const { pool } = require('../../../../lib/db');
const { estaAutenticado } = require('../../../../lib/auth');

export default async function handler(req, res) {
  if (!estaAutenticado(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { id } = req.query;

  if (req.method === 'PUT') {
    const { titulo, subtitulo, texto_html, imagen_url } = req.body;
    await pool.query(
      'UPDATE lecturas SET titulo = $1, subtitulo = $2, texto = $3, imagen_url = $4 WHERE id = $5',
      [titulo || null, subtitulo || null, texto_html, imagen_url || null, id]
    );
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    // No se borra si hay reactivos que dependen de esta lectura
    const { rows } = await pool.query('SELECT count(*) FROM reactivos WHERE lectura_id = $1', [id]);
    if (parseInt(rows[0].count, 10) > 0) {
      return res.status(409).json({ error: 'Hay preguntas asociadas a esta lectura, no se puede borrar' });
    }
    await pool.query('DELETE FROM lecturas WHERE id = $1', [id]);
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} not allowed`);
}
