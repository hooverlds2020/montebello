const fs = require('fs');
const path = require('path');

const CARPETA_UPLOADS = path.join(process.cwd(), 'uploads');

const TIPOS_MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

export default async function handler(req, res) {
  const { archivo } = req.query;
  const nombre = Array.isArray(archivo) ? archivo.join('/') : archivo;

  // Evita "path traversal" (que alguien pida ../../algo-sensible): el
  // nombre final, ya resuelto, debe seguir estando dentro de CARPETA_UPLOADS.
  const rutaResuelta = path.join(CARPETA_UPLOADS, nombre || '');
  if (!rutaResuelta.startsWith(CARPETA_UPLOADS + path.sep)) {
    return res.status(400).end('Ruta inválida');
  }

  const extension = path.extname(rutaResuelta).toLowerCase();
  const mime = TIPOS_MIME[extension];
  if (!mime) {
    return res.status(400).end('Tipo de archivo no permitido');
  }

  fs.stat(rutaResuelta, (err, stats) => {
    if (err || !stats.isFile()) {
      return res.status(404).end('Imagen no encontrada');
    }
    res.setHeader('Content-Type', mime);
    // El nombre de archivo incluye un identificador único por subida, así
    // que su contenido nunca cambia — se puede cachear "para siempre" en el
    // navegador sin riesgo de servir una versión vieja.
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    fs.createReadStream(rutaResuelta).pipe(res);
  });
}
