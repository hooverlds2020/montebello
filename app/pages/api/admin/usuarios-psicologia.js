const bcrypt = require('bcryptjs');
const { pool } = require('../../../lib/db');
const { estaAutenticado } = require('../../../lib/auth');

export default async function handler(req, res) {
  if (!estaAutenticado(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (req.method === 'GET') {
    const { rows } = await pool.query('SELECT id, nombre, email, creado_en FROM usuarios_psicologia ORDER BY nombre');
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const { nombre, email, password } = req.body;
    if (!nombre?.trim() || !email?.trim() || !password || password.length < 6) {
      return res.status(400).json({ error: 'Nombre, correo y contraseña (mínimo 6 caracteres) son obligatorios.' });
    }
    const hash = await bcrypt.hash(password, 10);
    try {
      const { rows } = await pool.query(
        'INSERT INTO usuarios_psicologia (nombre, email, password_hash) VALUES ($1, $2, $3) RETURNING id, nombre, email, creado_en',
        [nombre.trim(), email.trim().toLowerCase(), hash]
      );
      return res.status(201).json(rows[0]);
    } catch (e) {
      if (e.code === '23505') {
        return res.status(409).json({ error: 'Ya existe un usuario con ese correo.' });
      }
      return res.status(500).json({ error: e.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end();
}
