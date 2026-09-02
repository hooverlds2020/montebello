// Convierte texto plano con notación tipo "^3" o "^(2n+1)" en HTML con
// exponente real (<sup>), y "_2" o "_(n+1)" en subíndice (<sub>). Se usa en
// las opciones de respuesta, que son campos de texto simple (no un editor
// enriquecido como el de las preguntas) para que la captura masiva siga
// siendo rápida — el alumno de todas formas ve el resultado ya formateado,
// igual que si viniera de Word.
//
// Ejemplos:
//   "(4a + 6b)^3"     -> "(4a + 6b)<sup>3</sup>"
//   "x^2 + y^2"        -> "x<sup>2</sup> + y<sup>2</sup>"
//   "H_2O"             -> "H<sub>2</sub>O"
//   "(16a + 24b)^(2n)" -> "(16a + 24b)<sup>2n</sup>"
function escaparHtml(texto) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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
    .replace(/_\s?([a-zA-Z0-9]+)/g, '<sub>$1</sub>');
}
