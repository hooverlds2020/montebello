-- Esquema inicial - Piloto Diagnóstico Montebello (estilo CENEVAL)

-- Fila única con los parámetros generales del examen. Se creó originalmente
-- a mano en producción (sin pasar por este archivo), por eso queda aquí
-- documentada con IF NOT EXISTS: no afecta la base de datos ya existente,
-- pero deja el esquema completo para instalaciones nuevas desde cero.
CREATE TABLE IF NOT EXISTS configuracion (
  id SERIAL PRIMARY KEY,
  umbral_aprobacion INTEGER NOT NULL DEFAULT 60,
  tiempo_limite_minutos INTEGER NOT NULL DEFAULT 120,
  intentos_permitidos INTEGER NOT NULL DEFAULT 0,
  -- Instrucciones/reglas del examen que se le muestran al alumno (HTML, se
  -- captura con el mismo editor de texto enriquecido que las lecturas).
  -- Separado a propósito del texto de cada lectura, para no mezclar
  -- "instrucciones generales del examen" con "texto de comprensión lectora".
  instrucciones TEXT
);

CREATE TABLE categorias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  categoria_padre_id INTEGER REFERENCES categorias(id)
);

CREATE TABLE reactivos (
  id SERIAL PRIMARY KEY,
  categoria_id INTEGER NOT NULL REFERENCES categorias(id),
  pregunta TEXT NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT NOW(),
  -- Posición dentro de su materia. Es NUMERIC (no entero) para poder insertar
  -- una pregunta "entre" otras dos sin tener que renumerar el resto: por
  -- ejemplo, entre la pregunta con orden=15 y la de orden=16 se puede
  -- insertar una nueva con orden=15.5, sin tocar las demás.
  orden NUMERIC
);

CREATE TABLE opciones (
  id SERIAL PRIMARY KEY,
  reactivo_id INTEGER NOT NULL REFERENCES reactivos(id),
  texto TEXT NOT NULL,
  es_correcta BOOLEAN NOT NULL DEFAULT FALSE
);

-- Igual que 'configuracion': se creó a mano en producción, documentada aquí
-- con IF NOT EXISTS para no afectar la base de datos ya existente.
CREATE TABLE IF NOT EXISTS lecturas (
  id SERIAL PRIMARY KEY,
  titulo TEXT,
  subtitulo TEXT,
  texto TEXT NOT NULL,
  imagen_url TEXT,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  -- Instrucción específica de ESTA lectura (ej. "Lee con atención..."),
  -- opcional. Se muestra en el examen separada del texto de la lectura, para
  -- no mezclar "instrucción de qué hacer" con "contenido a leer".
  instruccion TEXT
);

CREATE TABLE alumnos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE password_resets (
  id SERIAL PRIMARY KEY,
  alumno_id INTEGER NOT NULL REFERENCES alumnos(id),
  token TEXT NOT NULL,
  expira_en TIMESTAMP NOT NULL,
  usado BOOLEAN DEFAULT FALSE
);

CREATE TABLE examenes (
  id SERIAL PRIMARY KEY,
  alumno_id INTEGER NOT NULL REFERENCES alumnos(id),
  iniciado_en TIMESTAMP DEFAULT NOW(),
  finalizado_en TIMESTAMP,
  tiempo_limite_minutos INTEGER DEFAULT 120,
  estado VARCHAR(20) DEFAULT 'en_progreso'
);

CREATE TABLE examen_reactivos (
  id SERIAL PRIMARY KEY,
  examen_id INTEGER NOT NULL REFERENCES examenes(id),
  reactivo_id INTEGER NOT NULL REFERENCES reactivos(id),
  orden INTEGER NOT NULL,
  opcion_respondida_id INTEGER REFERENCES opciones(id),
  respondido_en TIMESTAMP,
  -- Orden en el que se le mostraron las opciones a ESTE alumno para ESTA
  -- pregunta (arreglo JSON de ids de opciones). Se decide una sola vez, la
  -- primera vez que se le sirve la pregunta, y se reutiliza si vuelve a
  -- pedirla (p. ej. si refresca o se reconecta) para que las opciones no
  -- cambien de posición ni de letra (a/b/c) a medio examen.
  opciones_orden TEXT
);

CREATE INDEX idx_reactivos_categoria ON reactivos(categoria_id);
CREATE INDEX idx_opciones_reactivo ON opciones(reactivo_id);
CREATE INDEX idx_examen_reactivos_examen ON examen_reactivos(examen_id);
