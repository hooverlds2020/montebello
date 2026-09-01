const { pool } = require('../../../lib/db');
const { getAlumnoDesdeRequest } = require('../../../lib/auth-alumno');

export default async function handler(req, res) {
  const sesion = getAlumnoDesdeRequest(req);
  if (!sesion) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const { examenId } = req.query;

  const { rows: examenRows } = await pool.query(
    `SELECT id FROM examenes WHERE id = $1 AND alumno_id = $2`,
    [examenId, sesion.alumnoId]
  );
  if (!examenRows[0]) {
    return res.status(404).json({ error: 'Examen no encontrado' });
  }

  const { rows } = await pool.query(
    `SELECT er.id AS examen_reactivo_id, er.opcion_respondida_id, c.nombre AS categoria
     FROM examen_reactivos er
     JOIN reactivos r ON r.id = er.reactivo_id
     JOIN categorias c ON c.id = r.categoria_id
     WHERE er.examen_id = $1
     ORDER BY er.orden ASC`,
    [examenId]
  );

  // Las preguntas de una misma materia siempre quedan juntas y consecutivas
  // (así se arma el examen desde /api/examen/iniciar), así que basta con
  // detectar cuándo cambia la materia para separar en bloques y numerar
  // 1..N dentro de cada uno — igual que en el panel admin.
  const categorias = [];
  let actual = null;
  let contador = 0;
  for (const row of rows) {
    if (!actual || actual.nombre !== row.categoria) {
      actual = { nombre: row.categoria, items: [] };
      categorias.push(actual);
      contador = 0;
    }
    contador++;
    actual.items.push({
      examenReactivoId: row.examen_reactivo_id,
      numero: contador,
      respondida: !!row.opcion_respondida_id,
    });
  }

  return res.status(200).json({ categorias });
}
