const { pool } = require('../../../lib/db');
const { estaAutenticado } = require('../../../lib/auth');

// Acceso de doble candado: primero hay que estar logueado como admin del
// panel (estaAutenticado), Y ADEMÁS conocer la clave especial de psicología
// (CLAVE_PSICOLOGIA en variables de entorno) — un admin operativo normal
// que no tenga esa clave no puede ver este resultado aunque tenga acceso al
// panel. Cada consulta exitosa queda registrada en accesos_psicologia.
export default async function handler(req, res) {
  if (!estaAutenticado(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { alumnoId, clave } = req.query;

  if (!process.env.CLAVE_PSICOLOGIA) {
    return res.status(500).json({ error: 'CLAVE_PSICOLOGIA no está configurada en el servidor. Contacta al desarrollador.' });
  }
  if (clave !== process.env.CLAVE_PSICOLOGIA) {
    return res.status(403).json({ error: 'Clave incorrecta' });
  }

  const { rows } = await pool.query(
    `SELECT * FROM tmms_respuestas WHERE alumno_id = $1 ORDER BY id DESC LIMIT 1`,
    [alumnoId]
  );
  if (!rows[0]) {
    return res.status(404).json({ error: 'Este alumno no ha presentado Bienestar todavía.' });
  }

  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString().split(',')[0].trim();
  await pool.query('INSERT INTO accesos_psicologia (alumno_id, ip) VALUES ($1, $2)', [alumnoId, ip || null]);

  const r = rows[0];
  return res.status(200).json({
    percepcion: r.percepcion,
    comprension: r.comprension,
    regulacion: r.regulacion,
    nivelPercepcion: r.nivel_percepcion,
    nivelComprension: r.nivel_comprension,
    nivelRegulacion: r.nivel_regulacion,
    fecha: r.creado_en,
  });
}
