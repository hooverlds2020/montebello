const jwt = require('jsonwebtoken');

const SECRET = process.env.ALUMNO_JWT_SECRET || 'cambia-este-secreto-antes-de-produccion';
const COOKIE_NAME = 'montebello_alumno_session';

function crearTokenAlumno(alumnoId) {
  return jwt.sign({ role: 'alumno', alumnoId }, SECRET, { expiresIn: '6h' });
}

function verificarTokenAlumno(token) {
  try {
    const payload = jwt.verify(token, SECRET);
    if (payload.role !== 'alumno') return null;
    return payload;
  } catch {
    return null;
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

function getAlumnoDesdeRequest(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return verificarTokenAlumno(token);
}

module.exports = { crearTokenAlumno, verificarTokenAlumno, getAlumnoDesdeRequest, COOKIE_NAME };
