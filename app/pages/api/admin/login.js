const bcrypt = require('bcryptjs');
const { pool } = require('../../../lib/db');
const { crearToken, COOKIE_NAME } = require('../../../lib/auth');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const { email, password } = req.body;

  // Modo 1 (preferido): usuario administrador real, correo + contraseña propia
  if (email) {
    const { rows } = await pool.query(
      'SELECT id, password_hash FROM administradores WHERE email = $1',
      [email.trim().toLowerCase()]
    );
    const admin = rows[0];
    if (admin) {
      const ok = await bcrypt.compare(password || '', admin.password_hash);
      if (!ok) {
        return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
      }
      const token = crearToken(admin.id);
      res.setHeader(
        'Set-Cookie',
        `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${12 * 60 * 60}; SameSite=Lax`
      );
      return res.status(200).json({ ok: true });
    }
  }

  // Modo 2 (respaldo/transición): clave maestra compartida, para no perder acceso
  // mientras se crean las cuentas individuales de administrador.
  const claveMaestra = process.env.ADMIN_PASSWORD || 'CAMBIA_ESTA_CLAVE_ADMIN';
  if (password === claveMaestra) {
    const token = crearToken(null);
    res.setHeader(
      'Set-Cookie',
      `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${12 * 60 * 60}; SameSite=Lax`
    );
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
}
