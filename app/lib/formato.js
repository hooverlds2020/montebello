// Convierte texto plano con notación matemática simple en HTML con formato
// real, para usar en las opciones de respuesta (campos de texto simple, no
// un editor enriquecido) sin que la captura se vuelva lenta:
//   - "^3" o "^(2n+1)"  -> exponente real (<sup>)
//   - "_2" o "_(n+1)"   -> subíndice real (<sub>)
//   - "1/4"             -> fracción apilada (numerador sobre denominador,
//                          como en Word), detectado automáticamente — no
//                          hace falta ningún símbolo extra para esto.
//
// Ejemplos:
//   "(4a + 6b)^3"     -> "(4a + 6b)<sup>3</sup>"
//   "x^2 + y^2"        -> "x<sup>2</sup> + y<sup>2</sup>"
//   "H_2O"             -> "H<sub>2</sub>O"
//   "(16a + 24b)^(2n)" -> "(16a + 24b)<sup>2n</sup>"
//   "1/4"              -> fracción apilada con 1 arriba y 4 abajo
function escaparHtml(texto) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function fraccionHtml(numerador, denominador) {
  return (
    '<span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;' +
    'line-height:1.15;margin:0 2px;font-size:0.95em;">' +
    `<span style="border-bottom:1px solid currentColor;padding:0 4px;">${numerador}</span>` +
    `<span style="padding:0 4px;">${denominador}</span>` +
    '</span>'
  );
}

export function renderizarExponentes(texto) {
  if (!texto) return '';
  const escapado = escaparHtml(texto);
  return escapado
    // El espacio opcional (\s?) después de ^ o _ es importante: en varios
    // teclados en español, ^ es una "tecla muerta" que necesita combinarse
    // con la siguiente tecla — si se escribe pegado a un número puede
    // descartarse silenciosamente. Escribir "^ 3" (con espacio) es la forma
    // estándar de forzar el símbolo suelto, y aquí igual se reconoce.
    .replace(/\^\s?\(([^)]+)\)/g, '<sup>$1</sup>')
    .replace(/\^\s?([a-zA-Z0-9]+)/g, '<sup>$1</sup>')
    .replace(/_\s?\(([^)]+)\)/g, '<sub>$1</sub>')
    .replace(/_\s?([a-zA-Z0-9]+)/g, '<sub>$1</sub>')
    // Fracciones: cualquier "número/número" suelto (ej. 1/4, 2/3) se
    // convierte en fracción apilada automáticamente.
    .replace(/\b(\d+)\/(\d+)\b/g, (_, num, den) => fraccionHtml(num, den));
}
