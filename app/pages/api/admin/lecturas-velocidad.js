const { pool } = require('../../../lib/db');
const { estaAutenticado } = require('../../../lib/auth');

// Cuenta palabras separando por espacios/saltos de línea (igual criterio que
// se usa en la boleta física: no cuenta signos de puntuación como palabras
// aparte, solo bloques de texto separados por espacio).
function contarPalabras(texto) {
  const limpio = texto.trim();
  if (!limpio) return 0;
  return limpio.split(/\s+/).length;
}

export default async function handler(req, res) {
  if (!estaAutenticado(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (req.method === 'GET') {
    const { rows } = await pool.query('SELECT * FROM lecturas_velocidad ORDER BY id DESC');
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const { titulo, texto, fuente } = req.body;
    if (!titulo || !titulo.trim()) {
      return res.status(400).json({ error: 'El título es obligatorio' });
    }
    if (!texto || !texto.trim()) {
      return res.status(400).json({ error: 'El texto de la lectura no puede estar vacío' });
    }
    const totalPalabras = contarPalabras(texto);
    const { rows } = await pool.query(
      'INSERT INTO lecturas_velocidad (titulo, texto, total_palabras, fuente) VALUES ($1, $2, $3, $4) RETURNING *',
      [titulo.trim(), texto, totalPalabras, fuente?.trim() || null]
    );
    return res.status(201).json(rows[0]);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} not allowed`);
}
