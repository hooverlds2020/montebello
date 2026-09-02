const { estaAutenticado } = require('../../../lib/auth');
const { formidable } = require('formidable'); // formidable v3: la importación es distinta a v2, se usa como destructuring
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// formidable maneja el body como multipart/form-data, así que se desactiva
// el bodyParser default de Next (que solo entiende JSON/urlencoded).
export const config = {
  api: { bodyParser: false },
};

const EXTENSIONES_PERMITIDAS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const TAMANO_MAXIMO = 8 * 1024 * 1024; // 8 MB

export default async function handler(req, res) {
  if (!estaAutenticado(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const carpetaDestino = path.join(process.cwd(), 'public', 'uploads');
  fs.mkdirSync(carpetaDestino, { recursive: true });

  const form = formidable({
    maxFileSize: TAMANO_MAXIMO,
    uploadDir: carpetaDestino,
    keepExtensions: true,
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      const mensaje = err.code === 1016 // formidable: archivo excede maxFileSize
        ? 'La imagen pesa demasiado (máximo 8 MB)'
        : 'No se pudo subir la imagen. Intenta de nuevo.';
      return res.status(400).json({ error: mensaje });
    }

    const archivo = Array.isArray(files.imagen) ? files.imagen[0] : files.imagen;
    if (!archivo) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen' });
    }

    const extension = path.extname(archivo.originalFilename || '').toLowerCase();
    if (!EXTENSIONES_PERMITIDAS.has(extension)) {
      fs.unlink(archivo.filepath, () => {});
      return res.status(400).json({ error: 'Formato no permitido. Usa JPG, PNG, GIF o WEBP.' });
    }

    // Renombra a un nombre único (evita choques y no expone el nombre original del archivo del usuario)
    const nombreFinal = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${extension}`;
    const rutaFinal = path.join(carpetaDestino, nombreFinal);
    fs.renameSync(archivo.filepath, rutaFinal);

    return res.status(200).json({ url: `/uploads/${nombreFinal}` });
  });
}
