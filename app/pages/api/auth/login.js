const bcrypt = require('bcryptjs');
const crypto = require('crypto');
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
    'SELECT id, nombre, email, password_hash, sesion_token, sesion_expira FROM alumnos WHERE email = $1',
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

  // Sesión única: si ya hay una sesión activa y no ha expirado, se niega el
  // acceso en vez de dejar entrar una segunda vez con el mismo usuario.
  const sesionVigente = alumno.sesion_token && alumno.sesion_expira && new Date(alumno.sesion_expira) > new Date();
  if (sesionVigente) {
    return res.status(409).json({
      error: 'Ya hay una sesión activa con este usuario. Si eres tú, cierra la otra pestaña/navegador y espera unos minutos, o contacta al instituto si no puedes acceder.',
    });
  }

  const sesionId = crypto.randomUUID();
  const expira = new Date(Date.now() + 6 * 60 * 60 * 1000);
  await pool.query(
    'UPDATE alumnos SET sesion_token = $1, sesion_expira = $2 WHERE id = $3',
    [sesionId, expira, alumno.id]
  );

  const token = crearTokenAlumno(alumno.id, sesionId);
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${6 * 60 * 60}; SameSite=Lax`
  );
  return res.status(200).json({ ok: true, alumno: { id: alumno.id, nombre: alumno.nombre, email: alumno.email } });
}
