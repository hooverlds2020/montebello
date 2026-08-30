const crypto = require('crypto');
const { pool } = require('../../../lib/db');
const { enviarCorreoRecuperacion } = require('../../../lib/mailer');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Correo obligatorio' });
  }

  const { rows } = await pool.query(
    'SELECT id, nombre, email FROM alumnos WHERE email = $1',
    [email.trim().toLowerCase()]
  );
  const alumno = rows[0];

  // Respuesta genérica siempre, exista o no la cuenta (evita revelar qué correos están registrados)
  const respuestaGenerica = {
    ok: true,
    mensaje: 'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.',
  };

  if (!alumno) {
    return res.status(200).json(respuestaGenerica);
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiraEn = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await pool.query(
    'INSERT INTO password_resets (alumno_id, token, expira_en) VALUES ($1, $2, $3)',
    [alumno.id, token, expiraEn]
  );

  const baseUrl = process.env.SITE_URL || `https://${req.headers.host}`;
  const link = `${baseUrl}/restablecer?token=${token}`;

  try {
    await enviarCorreoRecuperacion(alumno.email, alumno.nombre, link);
  } catch (e) {
    console.error('Error enviando correo de recuperación:', e.message);
    // No revelamos el error real al usuario, pero sí lo dejamos en el log del servidor
  }

  return res.status(200).json(respuestaGenerica);
}
