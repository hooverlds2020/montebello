const nodemailer = require('nodemailer');

function transporterDisponible() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function enviarCorreoRecuperacion(destinatario, nombre, link) {
  if (!transporterDisponible()) {
    // Sin SMTP configurado: dejamos el link en el log del contenedor para pruebas.
    // Revisa con: docker logs montebello-app
    console.log('=== [SIN SMTP CONFIGURADO] Link de recuperación de contraseña ===');
    console.log(`Para: ${destinatario} (${nombre})`);
    console.log(`Link: ${link}`);
    console.log('===================================================================');
    return { simulado: true };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: destinatario,
    subject: 'Recuperación de contraseña — Instituto Montebello',
    html: `
      <p>Hola ${nombre},</p>
      <p>Recibimos una solicitud para restablecer tu contraseña del sistema de diagnóstico.</p>
      <p><a href="${link}">Haz clic aquí para crear una nueva contraseña</a></p>
      <p>Este enlace expira en 1 hora. Si tú no solicitaste esto, puedes ignorar este correo.</p>
    `,
  });

  return { simulado: false };
}

module.exports = { enviarCorreoRecuperacion };
