-- Migración: sesión única por alumno.
-- Evita que dos personas (o dos pestañas/dispositivos) entren al mismo
-- tiempo con el mismo correo y contraseña.
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS sesion_token TEXT;
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS sesion_expira TIMESTAMPTZ;
