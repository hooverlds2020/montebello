const jwt = require('jsonwebtoken');

// Secreto y cookie PROPIOS, distintos a los del admin normal y del alumno —
// una sesión de psicología nunca se confunde ni se cruza con esas otras.
const SECRET = process.env.PSICOLOGIA_JWT_SECRET || 'cambia-este-secreto-psicologia-antes-de-produccion';
const COOKIE_NAME = 'montebello_psicologia_session';

function crearTokenPsicologia(usuarioId) {
  return jwt.sign({ role: 'psicologia', usuarioId }, SECRET, { expiresIn: '8h' });
}

function verificarTokenPsicologia(token) {
  try {
    const payload = jwt.verify(token, SECRET);
    return payload.role === 'psicologia' ? payload : false;
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

function getPsicologiaDesdeRequest(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  return token ? verificarTokenPsicologia(token) : false;
}

module.exports = { crearTokenPsicologia, verificarTokenPsicologia, getPsicologiaDesdeRequest, COOKIE_NAME };
