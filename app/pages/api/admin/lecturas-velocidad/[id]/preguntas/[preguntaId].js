const { pool } = require('../../../../../../lib/db');
const { estaAutenticado } = require('../../../../../../lib/auth');

export default async function handler(req, res) {
  if (!estaAutenticado(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { preguntaId } = req.query;

  if (req.method === 'DELETE') {
    await pool.query('DELETE FROM lecturas_velocidad_preguntas WHERE id = $1', [preguntaId]);
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['DELETE']);
  res.status(405).end(`Method ${req.method} not allowed`);
}
