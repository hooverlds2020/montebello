const { pool } = require('../../../lib/db');
const { getAlumnoDesdeRequest } = require('../../../lib/auth-alumno');

export default async function handler(req, res) {
  const sesion = getAlumnoDesdeRequest(req);
  if (!sesion) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const { intentoId } = req.query;

  const { rows: intentoRows } = await pool.query(
    `SELECT i.*, l.titulo, l.total_palabras
     FROM lecturas_velocidad_intentos i
     JOIN lecturas_velocidad l ON l.id = i.lectura_velocidad_id
     WHERE i.id = $1 AND i.alumno_id = $2`,
    [intentoId, sesion.alumnoId]
  );
  const intento = intentoRows[0];
  if (!intento) {
    return res.status(404).json({ error: 'Intento no encontrado' });
  }

  if (req.method === 'POST' && intento.estado !== 'finalizado') {
    await pool.query(
      `UPDATE lecturas_velocidad_intentos SET estado = 'finalizado', finalizado_en = NOW() WHERE id = $1`,
      [intentoId]
    );
    intento.estado = 'finalizado';
  }

  const { rows: aciertosRows } = await pool.query(
    `SELECT count(*) AS total,
            count(*) FILTER (WHERE o.es_correcta) AS correctas
     FROM lecturas_velocidad_respuestas r
     JOIN lecturas_velocidad_opciones o ON o.id = r.opcion_id
     WHERE r.intento_id = $1`,
    [intentoId]
  );
  const totalPreguntas = parseInt(aciertosRows[0].total, 10) || 0;
  const correctas = parseInt(aciertosRows[0].correctas, 10) || 0;

  const tiempoSegundos = intento.tiempo_segundos;
  const ppm = tiempoSegundos > 0 ? Math.round((intento.total_palabras / tiempoSegundos) * 60) : null;

  return res.status(200).json({
    estado: intento.estado,
    lecturaTitulo: intento.titulo,
    totalPalabras: intento.total_palabras,
    tiempoSegundos,
    tiempoMinutos: tiempoSegundos != null ? +(tiempoSegundos / 60).toFixed(2) : null,
    ppm,
    aciertos: correctas,
    totalPreguntas,
    porcentaje: totalPreguntas > 0 ? Math.round((correctas / totalPreguntas) * 100) : null,
  });
}
