const bcrypt = require('bcryptjs');
const { pool } = require('../../../lib/db');
const { estaAutenticado } = require('../../../lib/auth');

export default async function handler(req, res) {
  if (!estaAutenticado(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (req.method === 'GET') {
    const { rows } = await pool.query(
      'SELECT id, nombre, email, creado_en FROM administradores ORDER BY creado_en'
    );
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const { nombre, email, password } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Correo inválido' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    try {
      const hash = await bcrypt.hash(password, 10);
      const { rows } = await pool.query(
        'INSERT INTO administradores (nombre, email, password_hash) VALUES ($1, $2, $3) RETURNING id, nombre, email, creado_en',
        [nombre.trim(), email.trim().toLowerCase(), hash]
      );
      return res.status(201).json(rows[0]);
    } catch (e) {
      if (e.code === '23505') {
        return res.status(409).json({ error: 'Ya existe un administrador con ese correo' });
      }
      return res.status(500).json({ error: e.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end();
}
