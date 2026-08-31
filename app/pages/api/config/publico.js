const { pool } = require('../../../lib/db');

export default async function handler(req, res) {
  const { rows } = await pool.query(
    'SELECT umbral_aprobacion, tiempo_limite_minutos, intentos_permitidos FROM configuracion ORDER BY id LIMIT 1'
  );
  return res.status(200).json({
    umbralAprobacion: rows[0]?.umbral_aprobacion ?? 60,
    tiempoLimiteMinutos: rows[0]?.tiempo_limite_minutos ?? 120,
    intentosPermitidos: rows[0]?.intentos_permitidos ?? 0,
  });
}
