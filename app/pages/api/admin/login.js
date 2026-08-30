const { crearToken, COOKIE_NAME } = require('../../../lib/auth');

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const { password } = req.body;
  const claveCorrecta = process.env.ADMIN_PASSWORD || 'CAMBIA_ESTA_CLAVE_ADMIN';

  if (password !== claveCorrecta) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  const token = crearToken();
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${12 * 60 * 60}; SameSite=Lax`
  );
  return res.status(200).json({ ok: true });
}
