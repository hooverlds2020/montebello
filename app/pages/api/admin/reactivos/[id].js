const { pool } = require('../../../../lib/db');
const { estaAutenticado } = require('../../../../lib/auth');

export default async function handler(req, res) {
  if (!estaAutenticado(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { id } = req.query;

  if (req.method === 'PUT') {
    const { pregunta, imagen_url, opciones } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (pregunta !== undefined) {
        await client.query(
          'UPDATE reactivos SET pregunta = $1, imagen_url = $2 WHERE id = $3',
          [pregunta, imagen_url || null, id]
        );
      }

      if (Array.isArray(opciones)) {
        // Actualiza las opciones EXISTENTES en su lugar (en vez de borrar y recrear),
        // porque si un alumno ya respondió esta pregunta, su respuesta está ligada
        // al id de una opción específica — borrarla rompería esa referencia.
        const { rows: existentes } = await client.query(
          'SELECT id FROM opciones WHERE reactivo_id = $1 ORDER BY id',
          [id]
        );

        const cantidadComun = Math.min(existentes.length, opciones.length);

        // 1) Actualiza en su lugar las que ya existían (mismo orden)
        for (let i = 0; i < cantidadComun; i++) {
          const o = opciones[i];
          await client.query(
            'UPDATE opciones SET texto = $1, es_correcta = $2, imagen_url = $3 WHERE id = $4',
            [o.texto, !!o.es_correcta, o.imagen_url || null, existentes[i].id]
          );
        }

        // 2) Si ahora hay MÁS opciones que antes, inserta las nuevas
        for (let i = cantidadComun; i < opciones.length; i++) {
          const o = opciones[i];
          await client.query(
            'INSERT INTO opciones (reactivo_id, texto, es_correcta, imagen_url) VALUES ($1, $2, $3, $4)',
            [id, o.texto, !!o.es_correcta, o.imagen_url || null]
          );
        }

        // 3) Si ahora hay MENOS opciones que antes, intenta borrar las sobrantes;
        //    si alguna ya fue respondida por un alumno, no se puede borrar —
        //    se deja huérfana (invisible en el examen) en vez de romper la respuesta histórica.
        for (let i = cantidadComun; i < existentes.length; i++) {
          try {
            await client.query('DELETE FROM opciones WHERE id = $1', [existentes[i].id]);
          } catch (e) {
            if (e.code !== '23503') throw e; // 23503 = violación de llave foránea, la ignoramos aquí
          }
        }
      }

      await client.query('COMMIT');
      return res.status(200).json({ ok: true });
    } catch (e) {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: e.message });
    } finally {
      client.release();
    }
  }

  if (req.method === 'DELETE') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM opciones WHERE reactivo_id = $1', [id]);
      await client.query('DELETE FROM reactivos WHERE id = $1', [id]);
      await client.query('COMMIT');
      return res.status(200).json({ ok: true });
    } catch (e) {
      await client.query('ROLLBACK');
      if (e.code === '23503') {
        return res.status(409).json({ error: 'Este reactivo ya fue respondido por al menos un alumno, no se puede eliminar.' });
      }
      return res.status(500).json({ error: e.message });
    } finally {
      client.release();
    }
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} not allowed`);
}
