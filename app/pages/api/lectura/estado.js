const { pool } = require('../../../lib/db');
const { getAlumnoDesdeRequest } = require('../../../lib/auth-alumno');

// Decide qué debe ver el alumno al entrar a /lectura:
// - Si no ha finalizado su examen de diagnóstico: bloqueado.
// - Si no hay ninguna lectura activa configurada por el admin: sin disponibilidad.
// - Si ya tiene un intento (en curso o finalizado): retoma ese mismo (no cambia
//   aunque el admin haya activado otra lectura distinta mientras tanto).
// - Si no tiene ningún intento: puede iniciar con la lectura activa actual.
export default async function handler(req, res) {
  const sesion = getAlumnoDesdeRequest(req);
  if (!sesion) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const { rows: diag } = await pool.query(
    `SELECT sesion_finalizacion FROM examenes WHERE alumno_id = $1 AND estado = 'finalizado' ORDER BY id DESC LIMIT 1`,
    [sesion.alumnoId]
  );
  if (!diag[0]) {
    return res.status(200).json({ disponible: false, motivo: 'diagnostico_pendiente' });
  }
  // Si el examen se finalizó en ESTA MISMA sesión (login), la lectura todavía
  // no se habilita — debe esperar a que el alumno cierre sesión y vuelva a
  // entrar (se hace en otro momento, ej. durante la entrevista).
  if (diag[0].sesion_finalizacion && diag[0].sesion_finalizacion === sesion.sesionId) {
    return res.status(200).json({ disponible: false, motivo: 'espera_nueva_sesion' });
  }

  // ¿Ya tiene un intento (de cualquier estado)? Ese manda, sin importar cuál
  // lectura esté activa ahora mismo — así no se rompe algo ya en curso.
  const { rows: intentoRows } = await pool.query(
    `SELECT i.*, l.titulo, l.texto, l.fuente, l.total_palabras
     FROM lecturas_velocidad_intentos i
     JOIN lecturas_velocidad l ON l.id = i.lectura_velocidad_id
     WHERE i.alumno_id = $1
     ORDER BY i.id DESC LIMIT 1`,
    [sesion.alumnoId]
  );
  if (intentoRows[0]) {
    const it = intentoRows[0];
    return res.status(200).json({
      disponible: true,
      intento: {
        id: it.id,
        estado: it.estado,
        lectura: { id: it.lectura_velocidad_id, titulo: it.titulo, texto: it.texto, fuente: it.fuente, totalPalabras: it.total_palabras },
      },
    });
  }

  // Sin intento previo: ver si hay una lectura activa para ofrecer.
  const { rows: activaRows } = await pool.query(
    'SELECT id, titulo, total_palabras FROM lecturas_velocidad WHERE activa = TRUE LIMIT 1'
  );
  if (!activaRows[0]) {
    return res.status(200).json({ disponible: false, motivo: 'sin_lectura_activa' });
  }

  return res.status(200).json({
    disponible: true,
    intento: null,
    lecturaDisponible: { id: activaRows[0].id, titulo: activaRows[0].titulo, totalPalabras: activaRows[0].total_palabras },
  });
}
