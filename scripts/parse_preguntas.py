"""
Extrae las preguntas del Word (EXANI_II_-_Simulador_General__Diagnóstico_.docx)
a un JSON estructurado: pregunta, categoría, subcategoría, opciones y cuál es correcta.

Word usa listas numeradas automáticas de Word (numPr), no texto literal "1." ni "a)",
así que hay que leer el numId de cada párrafo para saber si es pregunta u opción,
y el resaltado (highlight) de cada opción para saber cuál es la correcta.
"""
import json
from docx import Document

NS = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
QUESTION_NUMIDS = {'1', '2', '33'}  # listas de numeración usadas para las preguntas

# Rangos de sección detectados en el documento (por número de pregunta, 1-indexado)
SECTIONS = [
    (1, 33, 'Español', 'Comprensión lectora'),
    (34, 64, 'Español', 'Redacción indirecta'),
    (65, 999, 'Matemáticas', 'Pensamiento matemático'),
]


def seccion_de(n):
    for ini, fin, cat, subcat in SECTIONS:
        if ini <= n <= fin:
            return cat, subcat
    return 'Español', None


def get_numid(paragraph):
    numPr = paragraph._p.find(f'.//{NS}numPr')
    if numPr is None:
        return None
    numId_el = numPr.find(f'{NS}numId')
    return numId_el.get(f'{NS}val') if numId_el is not None else None


def is_highlighted(paragraph):
    return any(r.font.highlight_color is not None for r in paragraph.runs)


def main():
    doc = Document(
        "/mnt/user-data/uploads/EXANI_II_-_Simulador_General__Diagnóstico_.docx"
    )

    preguntas = []
    current = None
    qnum = 0

    for p in doc.paragraphs:
        text = p.text.strip()
        numid = get_numid(p)

        if numid in QUESTION_NUMIDS:
            if not text:
                # párrafo numerado vacío (artefacto de formato de Word) - se ignora,
                # no cuenta como pregunta ni corta la pregunta en curso
                continue
            # nueva pregunta
            if current:
                preguntas.append(current)
            qnum += 1
            categoria, subcategoria = seccion_de(qnum)
            current = {
                "numero": qnum,
                "pregunta": text,
                "categoria": categoria,
                "subcategoria": subcategoria,
                "opciones": [],
            }
        elif numid is not None and current is not None and text:
            # opción de la pregunta actual
            current["opciones"].append({
                "texto": text,
                "es_correcta": is_highlighted(p),
            })

    if current:
        preguntas.append(current)

    # Validación: reactivos sin ninguna opción marcada como correcta
    sin_correcta = [q["numero"] for q in preguntas if not any(o["es_correcta"] for o in q["opciones"])]
    con_2_o_mas = [q["numero"] for q in preguntas if sum(o["es_correcta"] for o in q["opciones"]) > 1]

    print(f"Total preguntas parseadas: {len(preguntas)}")
    print(f"Preguntas SIN respuesta correcta marcada: {sin_correcta}")
    print(f"Preguntas con MÁS de una marcada: {con_2_o_mas}")
    print(f"Español: {sum(1 for q in preguntas if q['categoria']=='Español')}")
    print(f"Matemáticas: {sum(1 for q in preguntas if q['categoria']=='Matemáticas')}")

    with open("/home/claude/montebello-diagnostico/scripts/preguntas.json", "w", encoding="utf-8") as f:
        json.dump(preguntas, f, ensure_ascii=False, indent=2)

    print("Guardado en preguntas.json")


if __name__ == "__main__":
    main()
