const { pool } = require('../../../lib/db');
const { estaAutenticado } = require('../../../lib/auth');

export default async function handler(req, res) {
  if (!estaAutenticado(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (req.method === 'GET') {
    const { rows } = await pool.query(
      'SELECT id, umbral_aprobacion, tiempo_limite_minutos, intentos_permitidos, instrucciones FROM configuracion ORDER BY id LIMIT 1'
    );
    return res.status(200).json(
      rows[0] || { umbral_aprobacion: 60, tiempo_limite_minutos: 120, intentos_permitidos: 0, instrucciones: null }
    );
  }

  if (req.method === 'PUT') {
    const { umbralAprobacion, tiempoLimiteMinutos, intentosPermitidos, instrucciones } = req.body;
    const { rows } = await pool.query('SELECT id FROM configuracion ORDER BY id LIMIT 1');
    const filaId = rows[0]?.id;

    async function asegurarFila() {
      if (filaId) return filaId;
      const { rows: nueva } = await pool.query('INSERT INTO configuracion DEFAULT VALUES RETURNING id');
      return nueva[0].id;
    }

    if (umbralAprobacion !== undefined) {
      const n = parseInt(umbralAprobacion, 10);
      if (isNaN(n) || n < 0 || n > 100) {
        return res.status(400).json({ error: 'El umbral debe ser un número entre 0 y 100' });
      }
      const id = await asegurarFila();
      await pool.query('UPDATE configuracion SET umbral_aprobacion = $1 WHERE id = $2', [n, id]);
    }

    if (tiempoLimiteMinutos !== undefined) {
      const t = parseInt(tiempoLimiteMinutos, 10);
      if (isNaN(t) || t < 1 || t > 600) {
        return res.status(400).json({ error: 'El tiempo debe ser un número entre 1 y 600 minutos' });
      }
      const id = await asegurarFila();
      await pool.query('UPDATE configuracion SET tiempo_limite_minutos = $1 WHERE id = $2', [t, id]);
    }

    if (intentosPermitidos !== undefined) {
      const i = parseInt(intentosPermitidos, 10);
      if (isNaN(i) || i < 0 || i > 20) {
        return res.status(400).json({ error: 'Los intentos permitidos deben ser un número entre 0 (ilimitados) y 20' });
      }
      const id = await asegurarFila();
      await pool.query('UPDATE configuracion SET intentos_permitidos = $1 WHERE id = $2', [i, id]);
    }

    if (instrucciones !== undefined) {
      const id = await asegurarFila();
      await pool.query('UPDATE configuracion SET instrucciones = $1 WHERE id = $2', [instrucciones || null, id]);
    }

    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  res.status(405).end();
}
