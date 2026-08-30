-- Correcciones y reactivos adicionales (segunda revisión con capturas más claras)

-- Corrección: pregunta 7, opción b) era 1/3, no 1/5 como se había puesto antes
UPDATE opciones SET texto = '1/3'
WHERE reactivo_id = (SELECT id FROM reactivos WHERE pregunta LIKE 'En un juego de azar se detecta%')
  AND texto = '1/5';

-- 23 (segunda parte): desplazamiento de parábola - es texto puro, no depende de ver la gráfica
INSERT INTO reactivos (categoria_id, pregunta)
VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'),
'La gráfica de la ecuación y = -(x-1)² se obtiene desplazando la gráfica original y = -x² una unidad hacia...')
RETURNING id \gset q23b_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q23b_id, 'Abajo', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q23b_id, 'La izquierda', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q23b_id, 'La derecha', TRUE);

-- 24: se puede describir la geometría en texto sin necesitar la imagen
INSERT INTO reactivos (categoria_id, pregunta)
VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'),
'En un círculo de radio r=1u, dos radios forman un ángulo central de 90°, y dentro de ese sector otro radio forma un ángulo de 45° con uno de ellos. Con base en esto, determina la afirmación verdadera.')
RETURNING id \gset q24_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q24_id, 'La medida del arco que determinan los ángulos es igual a 3/4 π', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q24_id, 'La suma de los dos ángulos centrales es igual a π', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:q24_id, 'La medida del arco que determinan los ángulos es igual a 3/2 π', FALSE);

-- Corrección: tabla completa de la pregunta 29 (faltaba la fila de 21 focos)
UPDATE reactivos SET pregunta =
'La tabla muestra los datos de una encuesta que se realizó a 30 familias para conocer la cantidad de focos que tienen en su casa: 12 focos-5 familias, 13-4, 14-1, 15-7, 16-1, 17-2, 18-3, 19-1, 20-3, 21-3. ¿Cuál es el número máximo de focos por vivienda de 60% de las familias encuestadas?'
WHERE pregunta LIKE 'La tabla muestra los datos de una encuesta%';
