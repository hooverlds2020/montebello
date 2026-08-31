const bcrypt = require('bcryptjs');
const { pool } = require('../../../lib/db');
const { crearTokenAlumno, COOKIE_NAME } = require('../../../lib/auth-alumno');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const { nombre, email, password, telefono, preparatoriaProcedencia } = req.body;

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
      'INSERT INTO alumnos (nombre, email, password_hash, telefono, preparatoria_procedencia) VALUES ($1, $2, $3, $4, $5) RETURNING id, nombre, email',
      [nombre.trim(), email.trim().toLowerCase(), hash, telefono || null, preparatoriaProcedencia || null]
    );
    const alumno = rows[0];

    const token = crearTokenAlumno(alumno.id);
    res.setHeader(
      'Set-Cookie',
      `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${6 * 60 * 60}; SameSite=Lax`
    );
    return res.status(201).json({ ok: true, alumno });
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });
    }
    return res.status(500).json({ error: 'Error al registrar. Intenta de nuevo.' });
  }
}
