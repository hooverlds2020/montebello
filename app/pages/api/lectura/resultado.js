const { pool } = require('../../../lib/db');
const { getAlumnoDesdeRequest } = require('../../../lib/auth-alumno');

// Compara el tiempo real del alumno contra los 4 umbrales configurados para
// esta lectura (si existen) y regresa el nivel correspondiente. Los umbrales
// son "tiempo máximo para ese nivel" (mientras más rápido, mejor), igual que
// en la tabla del libro (Excelente 1:19, Muy bien 1:34, Bien 1:58...).
function calcularNivel(tiempoSegundos, umbrales) {
  if (tiempoSegundos == null) return null;
  const { excelente, muybien, bien, deficiente } = umbrales;
  if (excelente != null && tiempoSegundos <= excelente) return 'Excelente';
  if (muybien != null && tiempoSegundos <= muybien) return 'Muy bien';
  if (bien != null && tiempoSegundos <= bien) return 'Bien';
  if (deficiente != null && tiempoSegundos > deficiente) return 'Deficiente';
  if (deficiente != null) return 'Bien'; // cae entre "bien" y "deficiente" sin pasarlo
  return null;
}

export default async function handler(req, res) {
  const sesion = getAlumnoDesdeRequest(req);
  if (!sesion) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const { intentoId } = req.query;

  const { rows: intentoRows } = await pool.query(
    `SELECT i.*, l.titulo, l.total_palabras,
            l.tiempo_excelente_seg, l.tiempo_muybien_seg, l.tiempo_bien_seg, l.tiempo_deficiente_seg
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
      `UPDATE lecturas_velocidad_intentos SET estado = 'finalizado', finalizado_en = NOW(), sesion_finalizacion = $2 WHERE id = $1`,
      [intentoId, sesion.sesionId]
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
  const ppmReal = tiempoSegundos > 0 ? Math.round((intento.total_palabras / tiempoSegundos) * 60) : null;
  // Cap en 500: un ppm más alto casi seguro es un error de medición (ej. el
  // alumno le dio "Terminé de leer" casi de inmediato), no un dato útil.
  const ppmMostrar = ppmReal != null && ppmReal > 500 ? '500+' : ppmReal;

  const umbrales = {
    excelente: intento.tiempo_excelente_seg,
    muybien: intento.tiempo_muybien_seg,
    bien: intento.tiempo_bien_seg,
    deficiente: intento.tiempo_deficiente_seg,
  };
  const tieneTablaReferencia = Object.values(umbrales).some((v) => v != null);

  return res.status(200).json({
    estado: intento.estado,
    lecturaTitulo: intento.titulo,
    totalPalabras: intento.total_palabras,
    tiempoSegundos,
    tiempoMinutos: tiempoSegundos != null ? +(tiempoSegundos / 60).toFixed(2) : null,
    ppm: ppmMostrar,
    aciertos: correctas,
    totalPreguntas,
    porcentaje: totalPreguntas > 0 ? Math.round((correctas / totalPreguntas) * 100) : null,
    tablaReferencia: tieneTablaReferencia ? umbrales : null,
    nivel: tieneTablaReferencia ? calcularNivel(tiempoSegundos, umbrales) : null,
  });
}
