const bcrypt = require('bcryptjs');
const { pool } = require('../../../lib/db');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  const { rows } = await pool.query(
    'SELECT id, alumno_id, expira_en, usado FROM password_resets WHERE token = $1',
    [token]
  );
  const reset = rows[0];

  if (!reset) {
    return res.status(400).json({ error: 'Enlace inválido' });
  }
  if (reset.usado) {
    return res.status(400).json({ error: 'Este enlace ya fue utilizado' });
  }
  if (new Date(reset.expira_en) < new Date()) {
    return res.status(400).json({ error: 'Este enlace expiró, solicita uno nuevo' });
  }

  const hash = await bcrypt.hash(password, 10);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE alumnos SET password_hash = $1 WHERE id = $2', [hash, reset.alumno_id]);
    await client.query('UPDATE password_resets SET usado = TRUE WHERE id = $1', [reset.id]);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: 'Error al actualizar la contraseña' });
  } finally {
    client.release();
  }

  return res.status(200).json({ ok: true });
}
