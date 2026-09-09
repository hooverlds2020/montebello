const bcrypt = require('bcryptjs');
const { pool } = require('../../../lib/db');
const { crearTokenPsicologia, COOKIE_NAME } = require('../../../lib/auth-psicologia');

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
    'SELECT id, nombre, password_hash FROM usuarios_psicologia WHERE email = $1',
    [email.trim().toLowerCase()]
  );
  const usuario = rows[0];
  if (!usuario) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
  }
  const ok = await bcrypt.compare(password, usuario.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
  }

  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString().split(',')[0].trim();
  await pool.query(
    'INSERT INTO accesos_hamilton (usuario_psicologia_id, accion, ip) VALUES ($1, $2, $3)',
    [usuario.id, 'login', ip || null]
  );

  const token = crearTokenPsicologia(usuario.id);
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${8 * 60 * 60}; SameSite=Lax`);
  return res.status(200).json({ ok: true, nombre: usuario.nombre });
}
