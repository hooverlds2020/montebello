-- Reactivos de Matemáticas capturados a mano desde las capturas del cliente
-- Estos son los que NO requieren imagen (texto, fórmulas o tablas de datos)

-- 3
INSERT INTO reactivos (categoria_id, pregunta)
VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'),
'Una persona mide la longitud de la sombra de un poste cuando la luz directa del sol forma un ángulo de 35° con respecto al piso. tan35°=0.70; sen35°=0.57; cos35°=0.82. ¿Cuál es la altura del poste?')
RETURNING id \gset q3_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q3_id, '3.9 m', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q3_id, '4.9 m', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q3_id, '5.7 m', FALSE);

-- 4
INSERT INTO reactivos (categoria_id, pregunta)
VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'),
'¿Qué conjunto de números presenta una desviación estándar mayor?')
RETURNING id \gset q4_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q4_id, '{1, 3, 4, 3, 4, 2, 4, 1, 2, 2, 1}', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q4_id, '{8, 16, 42, 12, 14, 24, 15, 32}', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q4_id, '{33, 42, 40, 27, 35, 38, 34, 32}', FALSE);

-- 7
INSERT INTO reactivos (categoria_id, pregunta)
VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'),
'En un juego de azar se detecta que se utiliza un dado alterado de 6 caras en el que los números 4 y 5 tienen el doble de probabilidad de caer que el resto de los números. Determine la probabilidad de que al lanzar el dado caiga un 4.')
RETURNING id \gset q7_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q7_id, '1/4', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q7_id, '1/5', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q7_id, '2/3', FALSE);

-- 8
INSERT INTO reactivos (categoria_id, pregunta)
VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'),
'Se tienen dos segmentos: uno de A a C pasando por B, con AB=3 y BC=x-10; otro de D a F pasando por E, con DE=x-6 y EF=4. ¿Cuál es el valor de x para que la razón AB/BC sea proporcional a la razón DE/EF?')
RETURNING id \gset q8_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q8_id, '10', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q8_id, '12', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q8_id, '22', FALSE);

-- 12
INSERT INTO reactivos (categoria_id, pregunta)
VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'),
'En la tabla se muestran datos sobre las características socioeconómicas de una población. Tipo A: 1,000,000 viviendas habitadas, 368,000 disponen de computadora. Tipo B: 655,000 viviendas habitadas, 100,000 disponen de computadora. Tipo C: 256 viviendas habitadas, 25 disponen de computadora. Indique la tasa de viviendas habitadas que cuentan con computadora. Considere redondear el resultado al entero inmediato superior o inferior.')
RETURNING id \gset q12_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q12_id, '28 de cada 100', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q12_id, '37 de cada 100', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q12_id, '47 de cada 100', FALSE);

-- 13
INSERT INTO reactivos (categoria_id, pregunta)
VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'),
'Seleccione el denominador x del exponente fraccionario en la expresión m^(2/x), para que sea equivalente a la expresión (raíz cuarta de m²)³.')
RETURNING id \gset q13_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q13_id, '1', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q13_id, '2', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q13_id, '8', FALSE);

-- 14
INSERT INTO reactivos (categoria_id, pregunta)
VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'),
'En una tienda de ropa, una joven observa que una gorra tiene un precio de $330 y que, por temporada, se le aplica un descuento del 20%. Al pagar en caja, le hacen un descuento adicional del 15%, pues presentó una tarjeta de cliente frecuente. ¿A cuánto asciende el monto total del descuento que la joven obtuvo por su compra?')
RETURNING id \gset q14_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q14_id, '$105.6', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q14_id, '$115.5', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q14_id, '$224.4', FALSE);

-- 15
INSERT INTO reactivos (categoria_id, pregunta)
VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'),
'Complete la oración con la unidad de medida correspondiente y la estimación faltante. Para un experimento escolar, Pablo pone a germinar un frijol en algodón y observa que crece en promedio 0.08 _____ por hora, por lo que después de _____ horas mide 57.6 mm.')
RETURNING id \gset q15_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q15_id, 'mm, 72', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q15_id, 'cm, 72', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q15_id, 'cm, 720', FALSE);

-- 16
INSERT INTO reactivos (categoria_id, pregunta)
VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'),
'Al lanzar un par de dados comunes, la probabilidad de obtener números menores a 4 en ambos dados es _____ que la probabilidad de que salgan números primos en ambos dados.')
RETURNING id \gset q16_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q16_id, 'Menor', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q16_id, 'Mayor', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q16_id, 'Igual', TRUE);

-- 19
INSERT INTO reactivos (categoria_id, pregunta)
VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'),
'¿Cuál es el resultado de la operación A - 2B - C? Considere para su cálculo los siguientes polinomios: A = x² - 3x + 5; B = -x² - 2x - 1; C = 2x² + 3x + 1.')
RETURNING id \gset q19_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q19_id, 'x² - 2x + 6', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q19_id, 'x² + 4x + 8', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q19_id, 'x² - 10x + 2', FALSE);

-- 20
INSERT INTO reactivos (categoria_id, pregunta)
VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'),
'Seleccione la solución del siguiente sistema de ecuaciones lineales: -x - 4y = 8; -x + 4y = -2.')
RETURNING id \gset q20_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q20_id, 'x = -3; y = -3/4', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q20_id, 'x = 5; y = 3/4', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q20_id, 'x = -3; y = 1/4', FALSE);

-- 21
INSERT INTO reactivos (categoria_id, pregunta)
VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'),
'¿Cuál es el valor de cos α si se tiene que sen α = 8/8.544?')
RETURNING id \gset q21_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q21_id, '0.544/8.544', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q21_id, '2.999/8.544', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q21_id, '8.999/8.544', FALSE);

-- 27
INSERT INTO reactivos (categoria_id, pregunta)
VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'),
'De acuerdo con los datos, ¿cuál es el modelo que representa la cantidad de calorías quemadas por un atleta, en función de los minutos que ha entrenado en los últimos 5 días? Datos (tiempo en minutos - calorías quemadas): 100-550, 320-1100, 200-800, 160-700, 240-900.')
RETURNING id \gset q27_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q27_id, 'y = 2.5x - 300', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q27_id, 'y = 2.5x + 300', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q27_id, 'y = 3x + 250', FALSE);

-- 29
INSERT INTO reactivos (categoria_id, pregunta)
VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'),
'La tabla muestra los datos de una encuesta que se realizó a 30 familias para conocer la cantidad de focos que tienen en su casa: 12 focos-5 familias, 13-4, 14-1, 15-7, 16-1, 17-2, 18-3, 19-1, 20-3, 21-2, 3-total restante. ¿Cuál es el número máximo de focos por vivienda de 60% de las familias encuestadas?')
RETURNING id \gset q29_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q29_id, '16', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q29_id, '17', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q29_id, '18', FALSE);

-- 30
INSERT INTO reactivos (categoria_id, pregunta)
VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'),
'El Departamento de Calidad reporta que hay modelos de celulares que han presentado gran cantidad de defectos en 5 lotes. El gerente recolecta los datos de la tabla y observa que ambos modelos tienen un promedio de 29 equipos defectuosos, por lo que descontinuará el modelo cuya cantidad de equipo defectuoso se aleje más del promedio. Datos (Lote - Modelo CT5 - Modelo PF3): 1-28-30, 2-25-26, 3-33-29, 4-28-31, 5-31-29. ¿Qué decisión toma el gerente?')
RETURNING id \gset q30_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q30_id, 'Descontinuar el modelo PF3, ya que es el que presenta menor dispersión en la cantidad de aparatos defectuosos por lote', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q30_id, 'Descontinuar el modelo CT5, ya que es el que presenta mayor dispersión en la cantidad de aparatos defectuosos por lote', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q30_id, 'Descontinuar otro modelo, ya que la dispersión es la cantidad de aparatos defectuosos por lote de los modelos CT5 y PF3 es menor al promedio', FALSE);
