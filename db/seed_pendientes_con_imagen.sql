-- Reactivos pendientes que requieren imagen
-- Sube cada imagen recortada del Word a: /home/dockerdata/montebello-diagnostico/uploads/preguntas/
-- con el nombre exacto indicado en cada imagen_url antes de ejecutar este script.

-- 5: área sombreada
INSERT INTO reactivos (categoria_id, pregunta, imagen_url)
VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'),
'Identifica cuánto mide el área sombreada.',
'/uploads/preguntas/q05_area_sombreada.png')
RETURNING id \gset q5_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q5_id, '16 - 4π', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q5_id, '24 - 4π', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q5_id, '40 - 4π', FALSE);

-- 9: gráfica de renta de sillas
INSERT INTO reactivos (categoria_id, pregunta, imagen_url)
VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'),
'El costo de rentar x sillas con 3 empresas diferentes se muestra en la gráfica. ¿Cuál es la empresa que cobra menos renta por unidad?',
'/uploads/preguntas/q09_grafica_renta.png')
RETURNING id \gset q9_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q9_id, 'P', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q9_id, 'Q', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q9_id, 'R', FALSE);

-- 10: mapa del camino
INSERT INTO reactivos (categoria_id, pregunta, imagen_url)
VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'),
'¿Qué opción representa el camino para llegar al punto B saliendo del punto A?',
'/uploads/preguntas/q10_mapa.png')
RETURNING id \gset q10_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q10_id, 'Caminar media cuadra hacia el suroeste, 1 cuadra al noroeste y 2.5 cuadras al suroeste', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q10_id, 'Andar 1 cuadra al sureste, 1 cuadra hacia el suroeste y 2 cuadras hacia el noroeste', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q10_id, 'Recorrer media cuadra hacia el suroeste, 1 cuadra hacia el noroeste y 3 cuadras al suroeste', FALSE);

-- 11: tipo de simetría con diseño (imagen en pregunta y podría llevar imagen por opción también)
INSERT INTO reactivos (categoria_id, pregunta, imagen_url)
VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'),
'Relacione el tipo de simetría con el diseño correspondiente.',
'/uploads/preguntas/q11_simetria.png')
RETURNING id \gset q11_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q11_id, '1a, 2b, 3c', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q11_id, '1b, 2a, 3c', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q11_id, '1b, 2c, 3a', FALSE);

-- 17: figura de 9 unidades cuadradas
INSERT INTO reactivos (categoria_id, pregunta, imagen_url)
VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'),
'Seleccione la figura cuya área es de 9 unidades cuadradas.',
'/uploads/preguntas/q17_figuras.png')
RETURNING id \gset q17_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q17_id, 'F1', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q17_id, 'F2', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q17_id, 'F3', TRUE);

-- 18: diagrama de árbol
INSERT INTO reactivos (categoria_id, pregunta, imagen_url)
VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'),
'Identifique el diagrama de árbol que representa el espacio muestral del experimento: se lanza un dado de tres caras en dos ocasiones consecutivas.',
'/uploads/preguntas/q18_diagrama_arbol.png')
RETURNING id \gset q18_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q18_id, 'a', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q18_id, 'b', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q18_id, 'c', TRUE);

-- 22: sistema de ecuaciones (gráfica)
INSERT INTO reactivos (categoria_id, pregunta, imagen_url)
VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'),
'¿Cuál es la solución del sistema de ecuaciones con 2 variables que se muestra en la gráfica?',
'/uploads/preguntas/q22_sistema_ecuaciones.png')
RETURNING id \gset q22_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q22_id, 'El punto A, B, o C es solución', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q22_id, 'Los puntos A, B y C son solución', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q22_id, 'Un sistema así no tiene solución', TRUE);

-- 25: gráfica de barras a pastel (opciones con imagen)
INSERT INTO reactivos (categoria_id, pregunta, imagen_url)
VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'),
'El gráfico de barras representa las edades de los integrantes de un curso de verano. ¿Cuál es la gráfica de pastel que le corresponde?',
'/uploads/preguntas/q25_barras_edades.png')
RETURNING id \gset q25_
INSERT INTO opciones (reactivo_id, texto, imagen_url, es_correcta) VALUES (:q25_id, 'Opción a', '/uploads/preguntas/q25_opcion_a.png', FALSE);
INSERT INTO opciones (reactivo_id, texto, imagen_url, es_correcta) VALUES (:q25_id, 'Opción b', '/uploads/preguntas/q25_opcion_b.png', TRUE);
INSERT INTO opciones (reactivo_id, texto, imagen_url, es_correcta) VALUES (:q25_id, 'Opción c', '/uploads/preguntas/q25_opcion_c.png', FALSE);

-- 26: media/moda (opciones con imagen)
INSERT INTO reactivos (categoria_id, pregunta, imagen_url)
VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'),
'La media de las calificaciones de Química obtenidas en un grupo es menor que su moda. Selecciona la gráfica que corresponde al hecho anterior.',
NULL)
RETURNING id \gset q26_
INSERT INTO opciones (reactivo_id, texto, imagen_url, es_correcta) VALUES (:q26_id, 'Opción a', '/uploads/preguntas/q26_opcion_a.png', TRUE);
INSERT INTO opciones (reactivo_id, texto, imagen_url, es_correcta) VALUES (:q26_id, 'Opción b', '/uploads/preguntas/q26_opcion_b.png', FALSE);
INSERT INTO opciones (reactivo_id, texto, imagen_url, es_correcta) VALUES (:q26_id, 'Opción c', '/uploads/preguntas/q26_opcion_c.png', FALSE);

-- 28: función cuadrática (opciones con imagen)
INSERT INTO reactivos (categoria_id, pregunta, imagen_url)
VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'),
'En el plano cartesiano se muestra la gráfica de la función f(x) = -ax² - 2ax - a, donde a es un valor positivo.',
'/uploads/preguntas/q28_funcion.png')
RETURNING id \gset q28_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q28_id, 'Opción a', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q28_id, 'Opción b', FALSE);
