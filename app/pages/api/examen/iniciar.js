const { pool } = require('../../../lib/db');
const { getAlumnoDesdeRequest } = require('../../../lib/auth-alumno');

// Baraja un arreglo (Fisher-Yates)
function barajar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const sesion = getAlumnoDesdeRequest(req);
  if (!sesion) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  // Si ya tiene un examen en progreso, lo retomamos en vez de crear uno nuevo
  const enProgreso = await pool.query(
    `SELECT id FROM examenes WHERE alumno_id = $1 AND estado = 'en_progreso' ORDER BY id DESC LIMIT 1`,
    [sesion.alumnoId]
  );
  if (enProgreso.rows[0]) {
    return res.status(200).json({ examenId: enProgreso.rows[0].id, retomado: true });
  }

  // Materias habilitadas con cantidad configurada para el examen
  const { rows: categorias } = await pool.query(
    `SELECT id, cantidad_examen FROM categorias WHERE activa = TRUE AND cantidad_examen > 0`
  );

  if (categorias.length === 0) {
    return res.status(400).json({ error: 'No hay materias configuradas para el examen todavía. Contacta al administrador.' });
  }

  const seleccionTotal = [];
  const avisos = [];

  for (const cat of categorias) {
    const { rows: disponibles } = await pool.query(
      `SELECT r.id FROM reactivos r
       WHERE r.categoria_id = $1
         AND (r.lectura_id IS NULL OR EXISTS (
           SELECT 1 FROM lecturas l WHERE l.id = r.lectura_id AND l.activa = TRUE
         ))`,
      [cat.id]
    );
    const ids = disponibles.map((r) => r.id);
    const cantidad = Math.min(cat.cantidad_examen, ids.length);
    if (cantidad < cat.cantidad_examen) {
      avisos.push(`Materia id ${cat.id}: se pidieron ${cat.cantidad_examen} pero solo hay ${ids.length} disponibles`);
    }
    const elegidos = barajar(ids).slice(0, cantidad);
    seleccionTotal.push(...elegidos);
  }

  if (seleccionTotal.length === 0) {
    return res.status(400).json({ error: 'No hay reactivos disponibles para armar el examen. Contacta al administrador.' });
  }

  const ordenFinal = barajar(seleccionTotal);
  const tiempoLimite = parseInt(process.env.EXAMEN_TIEMPO_LIMITE_MINUTOS || '120', 10);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO examenes (alumno_id, tiempo_limite_minutos, estado) VALUES ($1, $2, 'en_progreso') RETURNING id`,
      [sesion.alumnoId, tiempoLimite]
    );
    const examenId = rows[0].id;

    let orden = 1;
    for (const reactivoId of ordenFinal) {
      await client.query(
        `INSERT INTO examen_reactivos (examen_id, reactivo_id, orden) VALUES ($1, $2, $3)`,
        [examenId, reactivoId, orden]
      );
      orden++;
    }

    await client.query('COMMIT');
    return res.status(201).json({ examenId, totalPreguntas: ordenFinal.length, avisos });
  } catch (e) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
}
