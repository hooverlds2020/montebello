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

// Selecciona `cantidad` reactivos de una materia, respetando que las preguntas
// de una misma lectura queden SIEMPRE juntas y en orden consecutivo (nunca
// intercaladas con las de otra lectura ni con las preguntas sueltas).
function seleccionarConGrupos(disponibles, cantidad) {
  // Agrupa por lectura_id (null = pregunta suelta, cada una su propio bloque)
  const gruposPorLectura = {};
  const sueltas = [];
  for (const r of disponibles) {
    if (r.lectura_id) {
      if (!gruposPorLectura[r.lectura_id]) gruposPorLectura[r.lectura_id] = [];
      gruposPorLectura[r.lectura_id].push(r.id);
    } else {
      sueltas.push(r.id);
    }
  }

  // Cada bloque es un arreglo de ids que deben quedar juntos y consecutivos
  const bloques = Object.values(gruposPorLectura).map((ids) => barajar(ids));
  const bloquesSueltos = sueltas.map((id) => [id]); // cada suelta es su propio bloque de tamaño 1

  const todosLosBloques = barajar([...bloques, ...bloquesSueltos]);

  const seleccion = [];
  const bloquesNoUsados = [];

  for (const bloque of todosLosBloques) {
    if (seleccion.length + bloque.length <= cantidad) {
      seleccion.push(...bloque);
    } else {
      bloquesNoUsados.push(bloque);
    }
  }

  // Si aún falta completar la cantidad exacta (p. ej. solo quedaban bloques
  // grandes que no cupieron), rellenamos con lo que quepa de esos bloques,
  // priorizando los bloques sueltos (tamaño 1) para llegar exacto sin cortar
  // una lectura a la mitad si se puede evitar.
  bloquesNoUsados.sort((a, b) => a.length - b.length);
  for (const bloque of bloquesNoUsados) {
    if (seleccion.length >= cantidad) break;
    const restante = cantidad - seleccion.length;
    seleccion.push(...bloque.slice(0, restante));
  }

  return seleccion;
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

  // Verifica el límite de intentos permitidos (0 = ilimitados)
  const { rows: configRows0 } = await pool.query('SELECT intentos_permitidos FROM configuracion ORDER BY id LIMIT 1');
  const intentosPermitidos = configRows0[0]?.intentos_permitidos ?? 0;
  if (intentosPermitidos > 0) {
    const { rows: conteo } = await pool.query(
      `SELECT count(*) FROM examenes WHERE alumno_id = $1 AND estado = 'finalizado'`,
      [sesion.alumnoId]
    );
    if (parseInt(conteo[0].count, 10) >= intentosPermitidos) {
      return res.status(403).json({
        error: `Ya alcanzaste el número máximo de intentos permitidos (${intentosPermitidos}). Si crees que esto es un error, contacta al instituto.`,
      });
    }
  }

  // Materias habilitadas con cantidad configurada para el examen. El orden
  // se decide PRIMERO por la materia raíz (Español, Matemáticas, etc. — la
  // que se controla arrastrando en el panel), y solo como desempate por el
  // orden propio de la subcategoría.
  //
  // OJO: si la materia raíz nunca tuvo un número de "orden" explícito
  // guardado (queda NULL), no hay que caer en el orden propio de la
  // subcategoría como plan B — eso es lo que causaba el bug: cada
  // subcategoría puede tener su PROPIO número de orden (asignado en un
  // momento distinto, dentro del contexto de su propia materia), y esos
  // números chocan entre materias distintas sin ninguna relación real
  // (ej. "Pensamiento matemático" con orden=15 se colaba entre
  // "Comprensión lectora"=10 y "Redacción indirecta"=20, aunque son de
  // materias distintas). El plan B correcto es el ID de la materia raíz
  // (estable, nunca choca entre materias), no el orden de la subcategoría.
  const { rows: categorias } = await pool.query(
    `SELECT c.id, c.cantidad_examen
     FROM categorias c
     LEFT JOIN categorias padre ON padre.id = c.categoria_padre_id
     WHERE c.activa = TRUE AND c.cantidad_examen > 0
     ORDER BY COALESCE(padre.orden, padre.id, c.orden, c.id), c.orden, c.id`
  );

  if (categorias.length === 0) {
    return res.status(400).json({ error: 'No hay materias configuradas para el examen todavía. Contacta al administrador.' });
  }

  // El orden final se arma materia por materia (bloques de lectura intactos
  // dentro de cada una); no se revuelve nada entre materias distintas ni
  // entre lecturas distintas.
  const ordenFinal = [];
  const avisos = [];

  for (const cat of categorias) {
    const { rows: disponibles } = await pool.query(
      `SELECT r.id, r.lectura_id FROM reactivos r
       WHERE r.categoria_id = $1
         AND (r.lectura_id IS NULL OR EXISTS (
           SELECT 1 FROM lecturas l WHERE l.id = r.lectura_id AND l.activa = TRUE
         ))`,
      [cat.id]
    );

    if (disponibles.length < cat.cantidad_examen) {
      avisos.push(`Materia id ${cat.id}: se pidieron ${cat.cantidad_examen} pero solo hay ${disponibles.length} disponibles`);
    }

    const cantidad = Math.min(cat.cantidad_examen, disponibles.length);
    const elegidos = seleccionarConGrupos(disponibles, cantidad);
    ordenFinal.push(...elegidos);
  }

  if (ordenFinal.length === 0) {
    return res.status(400).json({ error: 'No hay reactivos disponibles para armar el examen. Contacta al administrador.' });
  }

  const { rows: configRows } = await pool.query('SELECT tiempo_limite_minutos FROM configuracion ORDER BY id LIMIT 1');
  const tiempoLimite = configRows[0]?.tiempo_limite_minutos ?? 120;

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
