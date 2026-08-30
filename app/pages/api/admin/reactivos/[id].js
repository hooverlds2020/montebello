const { pool } = require('../../../../lib/db');
const { estaAutenticado } = require('../../../../lib/auth');

export default async function handler(req, res) {
  if (!estaAutenticado(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { id } = req.query;

  if (req.method === 'PUT') {
    const { pregunta, imagen_url, opciones } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (pregunta !== undefined) {
        await client.query(
          'UPDATE reactivos SET pregunta = $1, imagen_url = $2 WHERE id = $3',
          [pregunta, imagen_url || null, id]
        );
      }

      if (Array.isArray(opciones)) {
        // Reemplaza todas las opciones del reactivo (más simple y confiable que editar una por una)
        await client.query('DELETE FROM opciones WHERE reactivo_id = $1', [id]);
        for (const o of opciones) {
          await client.query(
            'INSERT INTO opciones (reactivo_id, texto, es_correcta, imagen_url) VALUES ($1, $2, $3, $4)',
            [id, o.texto, !!o.es_correcta, o.imagen_url || null]
          );
        }
      }

      await client.query('COMMIT');
      return res.status(200).json({ ok: true });
    } catch (e) {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: e.message });
    } finally {
      client.release();
    }
  }

  if (req.method === 'DELETE') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM opciones WHERE reactivo_id = $1', [id]);
      await client.query('DELETE FROM reactivos WHERE id = $1', [id]);
      await client.query('COMMIT');
      return res.status(200).json({ ok: true });
    } catch (e) {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: e.message });
    } finally {
      client.release();
    }
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} not allowed`);
}
