const { pool } = require('../../../../../../lib/db');
const { estaAutenticado } = require('../../../../../../lib/auth');

export default async function handler(req, res) {
  if (!estaAutenticado(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { preguntaId } = req.query;

  if (req.method === 'PUT') {
    // Espera: { pregunta: string, opciones: [{ id?, texto, es_correcta }, ...] }
    const { pregunta, opciones } = req.body;
    if (!pregunta || !pregunta.trim()) {
      return res.status(400).json({ error: 'La pregunta no puede estar vacía' });
    }
    if (!Array.isArray(opciones) || opciones.length < 2) {
      return res.status(400).json({ error: 'Se necesitan al menos 2 opciones' });
    }
    if (!opciones.some((o) => o.es_correcta)) {
      return res.status(400).json({ error: 'Debes marcar cuál opción es la correcta' });
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE lecturas_velocidad_preguntas SET pregunta = $1 WHERE id = $2', [pregunta.trim(), preguntaId]);
      // Simplifica el manejo de opciones: borra las anteriores y crea las nuevas
      // (más simple y seguro que tratar de calzar cuáles cambiaron).
      await client.query('DELETE FROM lecturas_velocidad_opciones WHERE pregunta_id = $1', [preguntaId]);
      for (const o of opciones) {
        await client.query(
          'INSERT INTO lecturas_velocidad_opciones (pregunta_id, texto, es_correcta) VALUES ($1, $2, $3)',
          [preguntaId, o.texto.trim(), !!o.es_correcta]
        );
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
    await pool.query('DELETE FROM lecturas_velocidad_preguntas WHERE id = $1', [preguntaId]);
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} not allowed`);
}
