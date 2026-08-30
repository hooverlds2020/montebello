const { pool } = require('../../../lib/db');
const { estaAutenticado } = require('../../../lib/auth');

export default async function handler(req, res) {
  if (!estaAutenticado(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (req.method === 'GET') {
    const { categoria_id } = req.query;
    const params = [];
    let where = '';
    if (categoria_id) {
      where = 'WHERE r.categoria_id = $1';
      params.push(categoria_id);
    }
    const { rows } = await pool.query(
      `SELECT r.id, r.pregunta, r.imagen_url, r.categoria_id, r.lectura_id,
              c.nombre AS categoria, l.titulo AS lectura_titulo, l.activa AS lectura_activa,
              COALESCE(json_agg(json_build_object(
                'id', o.id, 'texto', o.texto, 'es_correcta', o.es_correcta, 'imagen_url', o.imagen_url
              ) ORDER BY o.id) FILTER (WHERE o.id IS NOT NULL), '[]') AS opciones
       FROM reactivos r
       JOIN categorias c ON c.id = r.categoria_id
       LEFT JOIN lecturas l ON l.id = r.lectura_id
       LEFT JOIN opciones o ON o.reactivo_id = r.id
       ${where}
       GROUP BY r.id, c.nombre, l.titulo, l.activa
       ORDER BY r.id`,
      params
    );
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const { categoria_id, pregunta, imagen_url, lectura_id, opciones } = req.body;

    if (!categoria_id || !pregunta || !pregunta.trim()) {
      return res.status(400).json({ error: 'categoria_id y pregunta son obligatorios' });
    }
    if (!Array.isArray(opciones) || opciones.length < 2) {
      return res.status(400).json({ error: 'Se requieren al menos 2 opciones' });
    }
    if (!opciones.some((o) => o.es_correcta)) {
      return res.status(400).json({ error: 'Debe marcar una opción como correcta' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        'INSERT INTO reactivos (categoria_id, pregunta, imagen_url, lectura_id) VALUES ($1, $2, $3, $4) RETURNING id',
        [categoria_id, pregunta.trim(), imagen_url || null, lectura_id || null]
      );
      const reactivoId = rows[0].id;

      for (const o of opciones) {
        await client.query(
          'INSERT INTO opciones (reactivo_id, texto, es_correcta, imagen_url) VALUES ($1, $2, $3, $4)',
          [reactivoId, o.texto, !!o.es_correcta, o.imagen_url || null]
        );
      }

      await client.query('COMMIT');
      return res.status(201).json({ id: reactivoId });
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
