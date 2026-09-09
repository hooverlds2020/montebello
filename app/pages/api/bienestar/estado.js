const { pool } = require('../../../lib/db');
const { getAlumnoDesdeRequest } = require('../../../lib/auth-alumno');

// Prerrequisito actual: haber terminado la Lectura de velocidad, EN UNA
// SESIÓN ANTERIOR (no en la misma en que la terminó). Cuando el módulo de
// Vocacional tenga contenido real y quede integrado en la secuencia, el
// prerrequisito de Bienestar debe cambiar a "Vocacional finalizado" en vez
// de Lectura — ese es el único ajuste que hará falta aquí.
export default async function handler(req, res) {
  const sesion = getAlumnoDesdeRequest(req);
  if (!sesion) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  // ¿Ya contestó Bienestar antes? Solo se presenta una vez.
  const { rows: yaRespondido } = await pool.query(
    'SELECT id FROM tmms_respuestas WHERE alumno_id = $1 LIMIT 1',
    [sesion.alumnoId]
  );
  if (yaRespondido[0]) {
    return res.status(200).json({ disponible: false, motivo: 'ya_respondido' });
  }

  const { rows: lectura } = await pool.query(
    `SELECT sesion_finalizacion FROM lecturas_velocidad_intentos WHERE alumno_id = $1 AND estado = 'finalizado' ORDER BY id DESC LIMIT 1`,
    [sesion.alumnoId]
  );
  if (!lectura[0]) {
    return res.status(200).json({ disponible: false, motivo: 'requisito_pendiente' });
  }
  if (lectura[0].sesion_finalizacion && lectura[0].sesion_finalizacion === sesion.sesionId) {
    return res.status(200).json({ disponible: false, motivo: 'espera_nueva_sesion' });
  }

  const { rows: alumno } = await pool.query('SELECT genero FROM alumnos WHERE id = $1', [sesion.alumnoId]);

  return res.status(200).json({ disponible: true, generoGuardado: alumno[0]?.genero || null });
}
