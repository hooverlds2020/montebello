const { pool } = require('../../../lib/db');
const { COOKIE_NAME, getAlumnoDesdeRequest } = require('../../../lib/auth-alumno');

export default async function handler(req, res) {
  const sesion = getAlumnoDesdeRequest(req);
  if (sesion) {
    await pool.query(
      'UPDATE alumnos SET sesion_token = NULL, sesion_expira = NULL WHERE id = $1',
      [sesion.alumnoId]
    );
  }
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
  return res.status(200).json({ ok: true });
}
