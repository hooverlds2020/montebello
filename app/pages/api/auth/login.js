const bcrypt = require('bcryptjs');
const { pool } = require('../../../lib/db');
const { crearTokenAlumno, COOKIE_NAME } = require('../../../lib/auth-alumno');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
  }

  const { rows } = await pool.query(
    'SELECT id, nombre, email, password_hash FROM alumnos WHERE email = $1',
    [email.trim().toLowerCase()]
  );
  const alumno = rows[0];

  // Mensaje genérico a propósito, para no revelar si el correo existe o no
  if (!alumno) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
  }

  const passwordOk = await bcrypt.compare(password, alumno.password_hash);
  if (!passwordOk) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
  }

  const token = crearTokenAlumno(alumno.id);
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${6 * 60 * 60}; SameSite=Lax`
  );
  return res.status(200).json({ ok: true, alumno: { id: alumno.id, nombre: alumno.nombre, email: alumno.email } });
}
