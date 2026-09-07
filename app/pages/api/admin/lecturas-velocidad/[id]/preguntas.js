const { pool } = require('../../../../../lib/db');
const { estaAutenticado } = require('../../../../../lib/auth');

export default async function handler(req, res) {
  if (!estaAutenticado(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { id } = req.query; // id de la lectura

  if (req.method === 'GET') {
    const { rows: preguntas } = await pool.query(
      'SELECT * FROM lecturas_velocidad_preguntas WHERE lectura_velocidad_id = $1 ORDER BY orden, id',
      [id]
    );
    const { rows: opciones } = await pool.query(
      `SELECT o.* FROM lecturas_velocidad_opciones o
       JOIN lecturas_velocidad_preguntas p ON p.id = o.pregunta_id
       WHERE p.lectura_velocidad_id = $1 ORDER BY o.id`,
      [id]
    );
    const preguntasConOpciones = preguntas.map((p) => ({
      ...p,
      opciones: opciones.filter((o) => o.pregunta_id === p.id),
    }));
    return res.status(200).json(preguntasConOpciones);
  }

  if (req.method === 'POST') {
    // Espera: { pregunta: string, opciones: [{ texto, es_correcta }, ...] }
    const { pregunta, opciones, orden } = req.body;
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
      const { rows } = await client.query(
        'INSERT INTO lecturas_velocidad_preguntas (lectura_velocidad_id, pregunta, orden) VALUES ($1, $2, $3) RETURNING *',
        [id, pregunta.trim(), orden || 0]
      );
      const preguntaId = rows[0].id;
      for (const o of opciones) {
        await client.query(
          'INSERT INTO lecturas_velocidad_opciones (pregunta_id, texto, es_correcta) VALUES ($1, $2, $3)',
          [preguntaId, o.texto.trim(), !!o.es_correcta]
        );
      }
      await client.query('COMMIT');
      return res.status(201).json(rows[0]);
    } catch (e) {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: e.message });
    } finally {
      client.release();
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} not allowed`);
}
