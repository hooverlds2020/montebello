const { pool } = require('../../../../lib/db');
const { estaAutenticado } = require('../../../../lib/auth');

function contarPalabras(texto) {
  const limpio = texto.trim();
  if (!limpio) return 0;
  return limpio.split(/\s+/).length;
}

export default async function handler(req, res) {
  if (!estaAutenticado(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { id } = req.query;

  if (req.method === 'PUT') {
    const { titulo, texto, activa } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (titulo !== undefined) {
        await client.query('UPDATE lecturas_velocidad SET titulo = $1 WHERE id = $2', [titulo.trim(), id]);
      }
      if (texto !== undefined) {
        await client.query(
          'UPDATE lecturas_velocidad SET texto = $1, total_palabras = $2 WHERE id = $3',
          [texto, contarPalabras(texto), id]
        );
      }
      if (activa !== undefined) {
        // Solo una lectura puede estar activa a la vez: si se activa esta,
        // se desactivan todas las demás en la misma transacción.
        if (activa) {
          await client.query('UPDATE lecturas_velocidad SET activa = FALSE WHERE id != $1', [id]);
        }
        await client.query('UPDATE lecturas_velocidad SET activa = $1 WHERE id = $2', [activa, id]);
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
    const { rows } = await pool.query(
      'SELECT count(*) FROM lecturas_velocidad_intentos WHERE lectura_velocidad_id = $1',
      [id]
    );
    if (parseInt(rows[0].count, 10) > 0) {
      return res.status(409).json({ error: 'Esta lectura ya tiene intentos de alumnos registrados, no se puede eliminar.' });
    }
    await pool.query('DELETE FROM lecturas_velocidad WHERE id = $1', [id]);
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} not allowed`);
}
