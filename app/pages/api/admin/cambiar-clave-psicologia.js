const { pool } = require('../../../lib/db');
const { estaAutenticado } = require('../../../lib/auth');

// Cambiar la clave requiere CONOCER LA ACTUAL (como cambiar tu propia
// contraseña) — así un admin del panel sin la clave no puede resetearla
// para verse resultados de Bienestar que no le corresponden. Solo quien ya
// tiene la clave (la psicóloga/orientadora, o quien ella se la comparta)
// puede actualizarla, sin depender de entrar al servidor.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  if (!estaAutenticado(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { claveActual, claveNueva } = req.body;
  if (!claveNueva || claveNueva.trim().length < 6) {
    return res.status(400).json({ error: 'La nueva clave debe tener al menos 6 caracteres.' });
  }

  const { rows: configRows } = await pool.query('SELECT id, clave_psicologia FROM configuracion ORDER BY id LIMIT 1');
  const config = configRows[0];
  if (!config) {
    return res.status(500).json({ error: 'No se encontró la configuración del sistema.' });
  }

  const claveEfectivaActual = config.clave_psicologia || process.env.CLAVE_PSICOLOGIA;

  // Primera vez que se configura (nunca hubo clave): se permite establecerla
  // sin pedir la "actual", porque no existe ninguna todavía.
  if (claveEfectivaActual && claveActual !== claveEfectivaActual) {
    return res.status(403).json({ error: 'La clave actual no es correcta.' });
  }

  await pool.query('UPDATE configuracion SET clave_psicologia = $1 WHERE id = $2', [claveNueva.trim(), config.id]);
  return res.status(200).json({ ok: true });
}
