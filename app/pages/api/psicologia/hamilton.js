const { pool } = require('../../../lib/db');
const { getPsicologiaDesdeRequest } = require('../../../lib/auth-psicologia');

function calcularNivel(total) {
  if (total <= 5) return 'No ansiedad';
  if (total <= 14) return 'Ansiedad menor';
  return 'Ansiedad mayor';
}

export default async function handler(req, res) {
  const sesion = getPsicologiaDesdeRequest(req);
  if (!sesion) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString().split(',')[0].trim();

  if (req.method === 'GET') {
    const { alumnoId } = req.query;
    const { rows } = await pool.query(
      `SELECT h.*, u.nombre AS capturado_por
       FROM hamilton_evaluaciones h
       LEFT JOIN usuarios_psicologia u ON u.id = h.usuario_psicologia_id
       WHERE h.alumno_id = $1
       ORDER BY h.creado_en DESC`,
      [alumnoId]
    );
    await pool.query(
      'INSERT INTO accesos_hamilton (usuario_psicologia_id, alumno_id, accion, ip) VALUES ($1, $2, $3, $4)',
      [sesion.usuarioId, alumnoId, 'consulta', ip || null]
    );
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const { alumnoId, items } = req.body; // items: array de 14 numeros (0-4)
    if (!Array.isArray(items) || items.length !== 14 || items.some((v) => ![0, 1, 2, 3, 4].includes(v))) {
      return res.status(400).json({ error: 'Debes calificar los 14 ítems (0 a 4).' });
    }

    const psiquica = [1, 2, 3, 4, 5, 6, 14].reduce((sum, i) => sum + items[i - 1], 0);
    const somatica = [7, 8, 9, 10, 11, 12, 13].reduce((sum, i) => sum + items[i - 1], 0);
    const total = items.reduce((a, b) => a + b, 0);
    const nivel = calcularNivel(total);

    const columnas = items.map((_, i) => `item_${i + 1}`).join(', ');
    const marcadores = items.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `INSERT INTO hamilton_evaluaciones
         (alumno_id, usuario_psicologia_id, ${columnas}, ansiedad_psiquica, ansiedad_somatica, puntuacion_total, nivel)
       VALUES ($${items.length + 1}, $${items.length + 2}, ${marcadores}, $${items.length + 3}, $${items.length + 4}, $${items.length + 5}, $${items.length + 6})
       RETURNING id`,
      [...items, alumnoId, sesion.usuarioId, psiquica, somatica, total, nivel]
    );

    await pool.query(
      'INSERT INTO accesos_hamilton (usuario_psicologia_id, alumno_id, accion, ip) VALUES ($1, $2, $3, $4)',
      [sesion.usuarioId, alumnoId, 'captura', ip || null]
    );

    return res.status(201).json({ ok: true, id: rows[0].id });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end();
}
