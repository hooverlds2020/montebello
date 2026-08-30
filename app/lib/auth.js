const jwt = require('jsonwebtoken');

const SECRET = process.env.ADMIN_JWT_SECRET || 'cambia-este-secreto-antes-de-produccion';
const COOKIE_NAME = 'montebello_admin_session';

function crearToken() {
  return jwt.sign({ role: 'admin' }, SECRET, { expiresIn: '12h' });
}

function verificarToken(token) {
  try {
    const payload = jwt.verify(token, SECRET);
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

function parseCookies(req) {
  const raw = req.headers.cookie || '';
  return Object.fromEntries(
    raw.split(';').filter(Boolean).map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k, decodeURIComponent(v.join('='))];
    })
  );
}

function estaAutenticado(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  return token ? verificarToken(token) : false;
}

module.exports = { crearToken, verificarToken, estaAutenticado, COOKIE_NAME };
