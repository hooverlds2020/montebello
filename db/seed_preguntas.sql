-- Seed generado automáticamente desde el Word EXANI II - Simulador General
-- 77 reactivos importados limpio. 13 requieren captura manual (fórmulas/gráficas).

INSERT INTO categorias (nombre) VALUES ('Español'), ('Matemáticas') ON CONFLICT DO NOTHING;

-- Reactivo original #1
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'De acuerdo con el texto, ¿qué impacto tiene para México el proceso que vive Chile?') RETURNING id \gset r1_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r1_id, 'Es una noticia que repercute en la vida política de Latinoamérica, región a la que pertenece México', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r1_id, 'Es un ejemplo para el gobierno mexicano en la toma de decisiones acerca de la estructura política', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r1_id, 'La sociedad mexicana toma como referencia las acciones de la sociedad chilena para su transformación', FALSE);

-- Reactivo original #2
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), '¿Cuál oración sintetiza la postura del autor?') RETURNING id \gset r2_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r2_id, 'Aunque no hubo tanta participación en el referéndum, Chile ha dado un gran paso político', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r2_id, 'Los chilenos no desean la transición, pues se sienten ajenos a las decisiones gubernamentales', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r2_id, 'La inminente transición chilena solo ha sido posible por la gran participación de la sociedad', FALSE);

-- Reactivo original #3
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), '¿Cómo se relaciona el creciente descontento de la sociedad con el resultado del referéndum?') RETURNING id \gset r3_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r3_id, 'La situación actual en Chile provoca la apatía de la gente en la toma de decisiones', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r3_id, 'El referéndum es la única vía por la cual se expresa una inconformidad social', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r3_id, 'Los chilenos eligen participar en la consulta ciudadana para transformar su sociedad', TRUE);

-- Reactivo original #4
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'Los chilenos decidieron que _____________ debe estar a cargo de ____________') RETURNING id \gset r4_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r4_id, 'El Parlamento – las reformas a la Constitución', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r4_id, 'Un órgano mixto – reconsiderar la arquitectura institucional', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r4_id, 'Una convención constitucional – la nueva Carta Magna', TRUE);

-- Reactivo original #5
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'De acuerdo con el texto, ¿cuál es el problema con la actual Constitución de Chile?') RETURNING id \gset r5_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r5_id, 'Responde a una forma de gobierno sin distribución de poderes ni legitimación para la toma de decisiones', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r5_id, 'Es muy antigua, por lo que requiere adecuarse a una sociedad que está demandando un cambio', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r5_id, 'Surgió en un momento en la que la sociedad no podía involucrarse en la toma de decisiones.', FALSE);

-- Reactivo original #6
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'El estallido social fue a causa ___________ y el proceso constituyente busca ___________') RETURNING id \gset r6_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r6_id, 'De la dictadura – infundir vitalidad democrática', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r6_id, 'De la pandemia – dar respuestas a las necesidades más urgentes', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r6_id, 'Del modelo socioeconómico – canalizar el descontento por la vía institucional', TRUE);

-- Reactivo original #7
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), '¿Qué acción se realiza a partir de la emisión de esta carta?') RETURNING id \gset r7_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r7_id, 'El apoderado, Rómulo, funge como fiador del poderdante Juan Carlos', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r7_id, 'La poderdante, Esmeralda, tramita la carta para cobrarle a Rigoberta', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r7_id, 'El fiador, Rómulo, procede en contra de la ciudadana Rigoberta', FALSE);

-- Reactivo original #8
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'Con base en el texto, ¿cuál afirmación es correcta?') RETURNING id \gset r8_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r8_id, 'El apoderado, Rómulo, funge como fiador del poderdante Juan Carlos', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r8_id, 'La poderdante, Esmeralda, tramita la carta para cobrarle a Rigoberta', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r8_id, 'El fiador, Rómulo, procede en contra de la ciudadana Rigoberta', FALSE);

-- Reactivo original #9
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), '¿Qué documentos se deben anexar 	para dar validez a la carta?') RETURNING id \gset r9_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r9_id, 'El pasaporte de Esmeralda, la identificación de Juan Carlos y los recibos vencidos de Rigoberta', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r9_id, 'La licencia de conducir de Esmeralda, el pasaporte de Juan Carlos y el INE de los testigos', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r9_id, 'Los recibos vencidos de Rigoberta, el contrato de fiador de Rómulo y el INE de los testigos', FALSE);

-- Reactivo original #10
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), '¿Cuántas veces se afeitaba el protagonista cuando empezó a irritarse su piel?') RETURNING id \gset r10_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r10_id, 'Una vez por día', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r10_id, 'Dos veces al día', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r10_id, 'Antes de cada comida', FALSE);

-- Reactivo original #11
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), '¿Por qué el protagonista extrema su régimen de higiene cuando vive con su pareja?') RETURNING id \gset r11_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r11_id, 'Porque ella es poco tolerante con el vello corporal, ya que lastima sus labios', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r11_id, 'Porque prefiere dedicarse a su higiene personal, pues no tiene nada que hacer', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r11_id, 'Porque quiere agradarle a ella y eso desata su propia obsesión', TRUE);

-- Reactivo original #12
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'Con base en el cuento, ¿cuál afirmación es correcta?') RETURNING id \gset r12_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r12_id, 'Comenzó afeitándose la barba y terminó afeitándose todo el cuerpo', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r12_id, 'Empezó afeitándose el pecho y enseguida hizo lo mismo con la barba', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r12_id, 'Inició depilándose las cejas y pestañas, a pesar de que a ella le gustaban', FALSE);

-- Reactivo original #13
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), '¿Cuál es uno de los mensajes del cuento?') RETURNING id \gset r13_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r13_id, 'Se necesita ser complaciente para mantener una pareja', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r13_id, 'El cuidado personal se puede convertir en una obsesión', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r13_id, 'Ceder a las peticiones de los demás puede provocar un daño', TRUE);

-- Reactivo original #14
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), '¿Qué función tiene el título del cuento?') RETURNING id \gset r14_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r14_id, 'Anticipa la transformación física que vivirá el protagonista', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r14_id, 'Hace referencia a la falta de higiene inicial del protagonista', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r14_id, 'Revela el ideal de belleza al que aspira el protagonista', FALSE);

-- Reactivo original #15
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), '¿Qué tipo de desenlace tiene el cuento?') RETURNING id \gset r15_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r15_id, 'Previsible, ya que la suerte del protagonista es la que el lector esperaba', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r15_id, 'Terminante, pues el conflicto que vive el protagonista queda resuelto', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r15_id, 'Abierto, porque el lector tiene que imaginar el destino del protagonista', TRUE);

-- Reactivo original #16
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), '¿Cuál refrán es equivalente a la situación planteada en la noticia?') RETURNING id \gset r16_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r16_id, 'Ojos que no ven, corazón que no siente', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r16_id, 'Aunque la mona se vista de seda, mona se queda', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r16_id, 'No todo lo que brilla es oro', TRUE);

-- Reactivo original #17
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), '¿Cuál es el tema central de la noticia?') RETURNING id \gset r17_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r17_id, 'Las decepciones amorosas en relaciones a distancia', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r17_id, 'El riesgo que implica la solicitud de préstamos bancarios', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r17_id, 'El aumento de las estafas a quienes buscan pareja en la red', TRUE);

-- Reactivo original #18
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'El dinero que depositó ___________ lo obtuvo de ___________.') RETURNING id \gset r18_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r18_id, 'Tonia – préstamos', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r18_id, 'Thomas – una herencia', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r18_id, 'Thomas – préstamos', FALSE);

-- Reactivo original #19
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), '¿Cuál pregunta debe formar parte de la encuesta que se aplicó a la población de estudio?') RETURNING id \gset r19_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r19_id, '¿Tus padres también tienen acceso a las redes sociales?', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r19_id, '¿Tienes control sobre el tiempo que pasan tus hijos en internet?', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r19_id, '¿Con qué frecuencia publicas contenido en las redes sociales?', TRUE);

-- Reactivo original #20
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'De acuerdo con el ensayo, una medida de control directo es que los padres…') RETURNING id \gset r20_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r20_id, 'Utilicen las herramientas de control parental que existen para cada una de las redes sociales', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r20_id, 'Tengan con sus hijos una buena relación que les permita estar enterados de lo que ven en redes sociales', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r20_id, 'Estén informados acerca de los riesgos que existen para sus hijos con el uso de las aplicaciones en la red', FALSE);

-- Reactivo original #21
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), '¿Cuál es el objetivo de este estudio?') RETURNING id \gset r21_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r21_id, 'Establecer una línea clara entre la información que debe ser pública y la que debe ser privada en las redes sociales', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r21_id, 'Demostrar a los adolescentes los riesgos que existen al publicar con descuido información privada', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r21_id, 'Identificar si los padres y las madres tendrían que adoptar una actitud de control en las redes sociales de sus hijos', TRUE);

-- Reactivo original #22
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'Según el texto, ¿cuál es la consecuencia principal de que las redes sociales sean utilizadas sin precaución?') RETURNING id \gset r22_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r22_id, 'Tener sanciones por parte de la administración de las redes sociales', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r22_id, 'Expresar una opinión que afecte a la familia que no forma parte de la red social', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r22_id, 'Recibir diferentes opiniones, incluso agresivas y violentas', TRUE);

-- Reactivo original #23
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), '¿Cuál opción presenta la información que plantea el ensayo?') RETURNING id \gset r23_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r23_id, 'La población de estudio son hombres de entre 10 y 20 años que usan constantemente las redes sociales', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r23_id, 'Las redes sociales representan un problema latente para la seguridad y el desarrollo de los adolescentes y jóvenes', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r23_id, 'Los padres de familia son los responsables de poner controles de seguridad para la interacción de los jóvenes', FALSE);

-- Reactivo original #24
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'De acuerdo con los objetivos de la investigación, ¿qué criterios son relevantes en la aplicación de la encuesta?') RETURNING id \gset r24_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r24_id, 'La edad de las personas consultadas y las características que comparte una generación', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r24_id, 'La responsabilidad de los padres de familia y las obligaciones familiares de los jóvenes y adolescentes', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r24_id, 'Las costumbres y valores de una generación y las formas de socializar de los jóvenes', FALSE);

-- Reactivo original #25
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'La protagonista desea que cuando muera…') RETURNING id \gset r25_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r25_id, 'Sus afectos perduren y su nombre se destuerza', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r25_id, 'Salgan los huesos de su carne a nutrir azucenas', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r25_id, 'Eviten llorar por su muerte y arroparla con tierra', TRUE);

-- Reactivo original #26
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'La protagonista anhela que su muerte ocurra en ___________ y _____________') RETURNING id \gset r26_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r26_id, 'Los campos – sonriendo', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r26_id, 'Una isla – en soledad', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r26_id, 'Sus sueños – entre sollozos', FALSE);

-- Reactivo original #27
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), '¿Qué condición debe darse para que la protagonista pueda ser nombrada poeta?') RETURNING id \gset r27_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r27_id, 'Perder la vida en una isla', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r27_id, 'Quedarse sola y abandonada', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r27_id, 'Volverse parte de la tierra', TRUE);

-- Reactivo original #28
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'De acuerdo con el poema, ¿qué pasará cuando la autora muera?') RETURNING id \gset r28_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r28_id, 'Volverá el amor', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r28_id, 'Será olvidada', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r28_id, 'Afirmará su identidad', TRUE);

-- Reactivo original #29
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'De acuerdo con el poema, ¿qué es la muerte?') RETURNING id \gset r29_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r29_id, 'La reintegración a la naturaleza y la vida', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r29_id, 'La tristeza de la soledad y el silencio', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r29_id, 'El final de los afectos y los sueños', FALSE);

-- Reactivo original #30
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'La función de los versos Un clavel interpuesto entre el viento y mi sombra, /hijo mío y de la muerte, me llamará poeta, es…') RETURNING id \gset r30_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r30_id, 'Establecer una comparación entre la vida humana y una flor', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r30_id, 'Atribuir una acción propia de los seres humanos a una flor', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r30_id, 'Utilizar la flor como símbolo de la breve existencia humana', FALSE);

-- Reactivo original #31
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), '¿En qué oración las palabras tienen una relación correcta?') RETURNING id \gset r31_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r31_id, 'La gente que vive en el norte y sur del país fueron muy afectadas por las intensas sequías de los últimos años', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r31_id, 'El archipiélago ecuatorial contiene el mayor número de especies vegetales y animales endémicas del planeta', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r31_id, 'Se determinó que la jauría de mestizos estuvieron alimentándose de la comida que se encontraba en el lugar', FALSE);

-- Reactivo original #32
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'La nueva camioneta tiene 250 caballos de fuerza; __________, una potencia única en el mercado.') RETURNING id \gset r32_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r32_id, 'Mejor dicho', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r32_id, 'Es decir', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r32_id, 'Más bien', FALSE);

-- Reactivo original #33
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'Identifique el enunciado que está escrito correctamente.') RETURNING id \gset r33_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r33_id, 'Desde que comenzó a leer libros en francés, su lécsico en ese idioma mejoró enormemente', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r33_id, 'Las excentricidades del artista plástico siempre estuvieron ligadas a su genio y creatividad', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r33_id, 'El éxsodo comenzó después de que los dos terremotos destruyeran las ciudades principales', FALSE);

-- Reactivo original #34
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), '¿En qué oración se establece una relación correcta entre las palabras?') RETURNING id \gset r34_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r34_id, 'Un saco de patatas se desparramaron por el suelo', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r34_id, 'Existían infinidad de cosillas urgidas de un arreglo', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r34_id, 'La mitad de las mesas se encontraba desocupada', FALSE);

-- Reactivo original #35
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'Elija la oración que está acentuada correctamente.') RETURNING id \gset r35_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r35_id, 'Los expertos recurrieron a la casuística para analizar las molestias que produce el ruido', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r35_id, 'Faltan veintiun días para que comiencen las exposiciones sobre los mantos acuíferos', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r35_id, 'La colección está constituida por una veintena de piezas jesuíticas que fueron restauradas', FALSE);

-- Reactivo original #36
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), '¿En cuál oración las palabras tienen una relación correcta?') RETURNING id \gset r36_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r36_id, 'Clara Campoamor es una de las defensoras de la igualdad más brillantes', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r36_id, 'La persona que escribió el artículo es una de los ambientalistas más notables', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r36_id, 'Violeta Parra es una de los cantautores más importantes del siglo XX', FALSE);

-- Reactivo original #37
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'Complete el enunciado con las grafías correctas.') RETURNING id \gset r37_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r37_id, 'c – z – c – s', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r37_id, 's – z – s – z', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r37_id, 'z – s – c – s', FALSE);

-- Reactivo original #38
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), '¿Cuál oración está redactada correctamente?') RETURNING id \gset r38_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r38_id, 'Toda la familia acudió con alegría a la celebración del quinceavo cumpleaños de Mariana', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r38_id, 'El despacho de los arquitectos se encuentra en el diecinueveavo piso de la torre central', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r38_id, 'La doceava parte de las ganancias será destinada a la reforestación del bosque tropical', TRUE);

-- Reactivo original #39
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'El profesor de Literatura solicita a los estudiantes un prólogo para un libro que acaba de ser publicado. ¿Cuál es el texto adecuado?') RETURNING id \gset r39_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r39_id, 'Del autor de Un romance en la ciudad llega Retina, una novela que conseguirá adentrarte en la complicada mente de alguien experto en escribir historias para ser devoradas. No te la puedes perder por nada del mundo. Acompaña a Edouard, el personaje principal, en esa historia en la que su madre quizás no sea quien todos pensaban. Disponible en librerías para Navidad', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r39_id, 'Retina, la nueva novela del escritor francés Mathieu Dupont, se concibe como una de las más representativas del autor. En esta obra, el galo no sólo muestra que su estilo está en continuo cambio, sino también sorprende con un género distinto, pasando de la novela rosa a una policiaca, que nos ha dejado intrigados sobre el personaje principal y el mundo que lo rodea', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r39_id, 'Dupont considera que Retina fue una de sus obras más difíciles de lograr. En un par de cartas enviadas a la editorial, indicó que tuvo que adentrarse en lo más profundo de las emociones y los miedos que abundaron en su infancia. En esta novela no sólo se abordará el misterio que envolvió la muerte de su padre, sino también lo difícil que para él fue mantener una relación con su madre', TRUE);

-- Reactivo original #40
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'Elija la opción que tiene un significado opuesto a la palabra resaltada con negritas.') RETURNING id \gset r40_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r40_id, 'Inédito', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r40_id, 'Actual', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r40_id, 'Bisoño', FALSE);

-- Reactivo original #41
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'Seleccione la opción que tiene un significado similar al de las palabras resaltadas con negritas.') RETURNING id \gset r41_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r41_id, 'La batería', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r41_id, 'La fuente', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r41_id, 'El montón', TRUE);

-- Reactivo original #42
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'La editorial de un periódico de circulación nacional está por publicar una columna de opinión. ¿Cuál texto es el adecuado para tal fin?') RETURNING id \gset r42_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r42_id, 'El incremento de la inflación ha impactado tanto en la tasa de interés como en el costo anual total de más de 20 instrumentos analizados durante el último trimestre del año. Además de estos datos, los resultados de la encuesta aplicada a los usuarios de tarjetas de crédito muestran que 56.9% de los tarjetahabientes realiza el pago del total, en tanto que 43.1% liquida el saldo total', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r42_id, 'Según datos oficiales, miles de usuarios de tarjetas de crédito desconocen la manera en la que funcionan estos instrumentos, por lo que considero necesario difundir la educación financiera a la población en general e, incluso, incorporarla en la educación básica. De hecho, son varios los organismos públicos y privados que se suman a las iniciativas que, desde mi punto de vista, favorecen la educación financiera', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r42_id, 'La educación financiera es una herramienta cada vez más necesaria. El libro Cuentas claras, carteras sanas plantea que este conocimiento tendría que incorporarse incluso como parte de la educación básica, pues, con base en los datos de esta obra, son miles los usuarios de servicios financieros los que toman malas decisiones por desconocimiento de instrumentos como las tarjetas de crédito', FALSE);

-- Reactivo original #43
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'Elija la oración que está acentuada correctamente') RETURNING id \gset r43_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r43_id, 'Durante la audiencia, la jueza puso un “estáte quieto” a la fiscalía', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r43_id, 'Muchos discípulos no entienden, aun diciéndoselos de buena manera', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r43_id, 'Algunas estrategias mejoran tu desempeño escolar, pónlas en práctica', FALSE);

-- Reactivo original #44
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'Una persona escribió la crónica de un día de su vida. ¿Cuál fragmento pertenece a esta situación comunicativa?') RETURNING id \gset r44_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r44_id, 'Quienes nos vieron ese día dijeron que traíamos los ojos redondos como platos, y no era para menos. Daniel y yo habíamos sufrido la mayor impresión de nuestras vidas. La caminata de los lunes había sido interrumpida por un trozo enorme de metal que cayó apenas a un par de metros delante nuestro: era una especie de esfera metálica, en cuyo diámetro brillaba un cinturón mineral', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r44_id, 'El 19 de enero, el día de mi cumpleaños, también cumple años Chema, mi mejor amigo y la única persona que me comprende. Posiblemente por esa coincidencia de fechas, Chema parece tener el poder de leerme la mente y de adivinar mis alegrías y tristezas. Yo lo quiero por eso, pero también porque es un chico amable, con un gran sentido del humor y siempre dispuesto a ayudar a los demás', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r44_id, 'Esa jornada comenzó como cualquier otra. Yo había llegado puntualmente a la escuela para dar la clase de las 7:00, pues era martes. Todo transcurrió como de costumbre en las primeras tres sesiones. A las 10:00 vino el receso, que apenas me alcanzó para tomar un café. En punto de las 10:20, me dirigí al salón donde daría la penúltima clase. Para mi sorpresa, ella estaba ahí aguardándome', TRUE);

-- Reactivo original #45
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'Elija la oración en la que se establece una relación correcta entre las palabras.') RETURNING id \gset r45_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r45_id, 'Le pedí con mucha anticipación un ensayo a mis alumnos, pero igual no lo hicieron', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r45_id, 'Nunca duden de aquel cuyas manos sean tan ásperas como la tierra que nos sustenta', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r45_id, 'Las encontré exactamente donde dijiste: mis lentes estaban olvidados sobre el periódico', FALSE);

-- Reactivo original #46
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), '¿Qué enunciado está acentuado correctamente?') RETURNING id \gset r46_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r46_id, 'El género épico – lírico estaba en boga hace veintiseis siglos', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r46_id, 'El género épico – lirico estaba en boga hace veintiseis siglos', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r46_id, 'El género épico – lírico estaba en boga hace veintiséis siglos', TRUE);

-- Reactivo original #47
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), '¿En qué oración se usan de forma correcta los paréntesis?') RETURNING id \gset r47_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r47_id, 'Carlos Fuentes (	1928 – 2012) escribió La región más transparente', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r47_id, 'Carlos Fuentes (	1928) – (2012) escribió La región más transparente', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r47_id, '(Carlos Fuentes 1928 – 2012) escribió La región más transparente', FALSE);

-- Reactivo original #48
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'Seleccione el enunciado que está puntuado correctamente.') RETURNING id \gset r48_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r48_id, 'En este pequeño pueblo podemos encontrar tiendas, cafés, bares, etc…', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r48_id, 'Con base en todas las evidencias, el jurado decidió que… usted es el ganador.', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r48_id, 'Siempre me he preguntado: ¿Acaso me habré equivocado al suponer?...', FALSE);

-- Reactivo original #49
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'En la redacción de un periódico se pretende publicar una noticia sobre la acusación de corrupción al rey de España. ¿Cuál fragmento es el apropiado?') RETURNING id \gset r49_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r49_id, 'La Fiscalía abrió una nueva investigación judicial contra el rey. Se trata de la segunda indagatoria contra el monarca. En esta ocasión se le investiga por el supuesto cobro de comisiones ilegales en la construcción de un aeropuerto. La Fiscalía sospecha que hay una trama internacional en la que podrían estar involucrados empresarios de varios países', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r49_id, 'Una vez más la monarquía se ve envuelta en un escándalo. Ahora resulta que al rey lo andan siguiendo por corrupto. O sea, que encima de que no trabaja, también le entraba al negocio de la construcción cobrando por tramitar permisos. Y la verdad la culpa es de la gente que en pleno siglo XXI sigue admitiendo a un rey; hay que ser ingenuos para aguantar semejante abuso', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r49_id, 'Da igual cuál sea tu impresión sobre la famosísima monarquía. La nueva acusación de corrupción contra el rey es, además de toda una revelación de la que te enteraste aquí, un golpe para la institucionalidad del país. Para los enemigos de la Corona, resulta urgente que la sociedad se libere de esta institución, a la que consideran obsoleta, decadente y, además, corrupta', FALSE);

-- Reactivo original #50
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'Elija la oración que está acentuada de forma correcta.') RETURNING id \gset r50_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r50_id, 'Tras despedirme de mi asesora, cambié el tema del ensayo', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r50_id, 'La isla se encontraba a veinte millas naúticas de la nave', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r50_id, 'La región del Caúcaso se caracteriza por su geografía accidentada', FALSE);

-- Reactivo original #51
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'Selecciona la oración que está puntuada de forma correcta.') RETURNING id \gset r51_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r51_id, '¿Cómo te llamas?. ¿Qué estudiaste?. ¿En qué trabajas?.', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r51_id, '¿Cómo te llamas?, ¿Qué estudiaste?, ¿En qué trabajas?', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r51_id, '¿Cómo te llamas? ¿Qué estudiaste? ¿En qué trabajas?', TRUE);

-- Reactivo original #52
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'Selecciona el enunciado que está puntuado correctamente.') RETURNING id \gset r52_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r52_id, 'Los jugadores que hayan faltado a un entrenamiento durante la semana, no serán titulares el domingo.', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r52_id, 'Los jugadores, independientemente de su rendimiento físico, deben pasar por una evaluación médica antes del torneo.', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r52_id, 'Toda la temporada de voleibol playero, que arrancó a principios de febrero ha estado lleno de partidos excepcionales.', FALSE);

-- Reactivo original #53
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'Elija el enunciado que está escrito correctamente.') RETURNING id \gset r53_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r53_id, 'Anhelo visitar un orfanato y ayudar a los huérfanos a aprender diversos temas', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r53_id, 'Anelo visitar un orfanato y ayudar a los huérfanos a aprender diversos temas', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r53_id, 'Anhelo visitar un horfanato y ayudar a los huérfanos a aprender diversos temas', FALSE);

-- Reactivo original #54
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'Complete el enunciado con las grafías correctas.') RETURNING id \gset r54_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r54_id, 'll – y – ll – ll', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r54_id, 'y – y – y – ll', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r54_id, 'y – ll – y – y', FALSE);

-- Reactivo original #55
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'Complete el enunciado con la expresión que le da sentido.') RETURNING id \gset r55_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r55_id, 'No obstante', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r55_id, 'Entonces', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r55_id, 'Porque', TRUE);

-- Reactivo original #56
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'Complete con las palabras que le dan sentido al fragmento.') RETURNING id \gset r56_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r56_id, 'le – la – la', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r56_id, 'lo – la – lo', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r56_id, 'le – lo – le', FALSE);

-- Reactivo original #57
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), '¿En cuál fragmento se establece una relación correcta entre las palabras?') RETURNING id \gset r57_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r57_id, 'Los claros motivo y razones del cambio económico', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r57_id, 'Las codiciadas fama y belleza entre la farándula', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r57_id, 'Las necesarias atenciones y cuidados de los infantes', TRUE);

-- Reactivo original #58
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), '¿En cuál fragmento se establece una relación correcta entre las palabras?') RETURNING id \gset r58_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r58_id, 'La carpeta verde y el escritorio estaban húmedas', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r58_id, 'El autobús escolar y la cancha de fútbol son nuevas', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r58_id, 'El estudio y la práctica del deporte son necesarios', TRUE);

-- Reactivo original #59
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'La revista de una universidad publicó una convocatoria para escribir ensayos académicos sobre la responsabilidad de la humanidad con respecto a los animales. Se recibieron tres propuestas. ¿Cuál es el texto adecuado para publicar en la revista?') RETURNING id \gset r59_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r59_id, 'En los últimos años me he comprometido con los animales. He dejado de usar ropa de piel y he optado por vestir prendas sintéticas. No soy la única persona: han crecido los grupos que defienden los derechos de los animales y se han creado santuarios para resguardar las especies que están en peligro de extinción. Además de eso, cada día somos más los vegetarianos y continuamos luchando para erradicar las corridas de toros y otro tipo de prácticas que atentan contra la vida de los animales', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r59_id, 'Las vacas son animales bien inteligentes pertenecientes a la familia de los bóvidos. Por ejemplo, si se dejan a la orilla de un río y hay un puente, lo utilizarán para atravesar sin necesidad de un pastor. También los perritos son animales con una gran inteligencia, sin lugar a dudas. Actualmente, los estudios sobre la inteligencia en los animales no se centran ni en las vacas ni en los perros, sino en los cefalópodos como los pulpos, ya que han demostrado tener memoria y simetría bilateral', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r59_id, 'La humanidad está pasando por un proceso de sensibilización hacia los sentimientos y las emociones de los animales, ya que estos presentan un sistema nervioso y una inteligencia semejantes a los de los humanos. Por esta razón, diversas ONG buscan concientizar sobre la violencia contra los animales al evidenciar la explotación poco sustentable de recursos naturales. De igual manera, se han investigado el comportamiento animal y los estímulos externos que repercuten en su desarrollo', TRUE);

-- Reactivo original #60
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'El profesor de Cinematografía está revisando los textos sobre una película de estreno reciente para elegir la reseña que incluirá en una publicación. ¿Cuál fragmento cumple de forma adecuada con ese objetivo?') RETURNING id \gset r60_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r60_id, 'El estreno de la película de terror Epitafio pone en evidencia la abismal diferencia entre el cine que se produce en Estados Unidos y el que se puede producir en nuestro país. Epitafio parte de la misma premisa que un sinnúmero de películas del género: dos adolescentes se internan en un bosque para estar solos y lo que encuentran es la tragedia', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r60_id, 'Por si no lo saben, les cuento que epitafio es como se les llama a las inscripciones grabadas en las sepulturas. Hay muchos epitafios famosos. Por ejemplo, está el epitafio de Groucho Marx que dice: “Perdonen que no me levante”. Y bueno, Epitafio también es la más reciente película de terror mexicana. Me hizo brincar varias veces y eso no me pasa siempre', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r60_id, 'Me gustan las películas de terror que me hacen reír y Epitafio no es la excepción. Al monstruo que aparece al final se le ven los hilos. Había gente que sí se encontraba espantada y a mí me daban ganas de reírme en la sala del cine. Pero cada quien, ¿no? Al menos eso pienso yo', FALSE);

-- Reactivo original #63
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Español'), 'Una persona mide la longitud de la sombra de un poste cuando la luz directa del sol forma un ángulo de 35° con respecto al piso, tal como se muestra en la imagen. ¿Cuál es la altura del poste?') RETURNING id \gset r63_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r63_id, '3.9 m', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r63_id, '4.9 m', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r63_id, '5.7 m', FALSE);

-- Reactivo original #66
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'), 'En la gráfica se muestran las calificaciones de Física obtenidas por un grupo de estudiantes.') RETURNING id \gset r66_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r66_id, '7.0', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r66_id, '7.5', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r66_id, '8.0', FALSE);

-- Reactivo original #68
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'), '¿Cuál es el valor de  para que la razón  sea proporcional a la razón ?') RETURNING id \gset r68_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r68_id, '10', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r68_id, '12', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r68_id, '22', FALSE);

-- Reactivo original #69
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'), 'El costo de rentar  sillas con 3 empresas diferentes se muestra en la gráfica. ¿Cuál es la empresa que cobra menos renta por unidad?') RETURNING id \gset r69_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r69_id, 'P', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r69_id, 'Q', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r69_id, 'R', FALSE);

-- Reactivo original #70
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'), '¿Qué opción representa el camino para llegar al punto B saliendo del punto A?') RETURNING id \gset r70_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r70_id, 'Caminar media cuadra hacia el suroeste, 1 cuadra al noroeste y 2.5 cuadras al suroeste', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r70_id, 'Andar 1 cuadra al sureste, 1 cuadra hacia el suroeste y 2 cuadras hacia el noroeste', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r70_id, 'Recorrer media cuadra hacia el suroeste, 1 cuadra hacia el noroeste y 3 cuadras al suroeste', FALSE);

-- Reactivo original #71
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'), 'Relacione el tipo de simetría con el diseño correspondiente.') RETURNING id \gset r71_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r71_id, '1a, 2b, 3c', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r71_id, '1b, 2a, 3c', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r71_id, '1b, 2c, 3a', FALSE);

-- Reactivo original #72
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'), 'En la tabla se muestran los datos sobre las características socioeconómicas de una población. Indique la tasa de viviendas habitadas que cuentan con computadora. Considere redondear el resultado al entero inmediato superior o inferior.') RETURNING id \gset r72_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r72_id, '28 de cada 100', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r72_id, '37 de cada 100', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r72_id, '47 de cada 100', FALSE);

-- Reactivo original #73
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'), 'Seleccione el denominador  del exponente fraccionario en la expresión , para que sea equivalente a la expresión') RETURNING id \gset r73_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r73_id, '1', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r73_id, '2', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r73_id, '8', FALSE);

-- Reactivo original #74
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'), 'En una tienda de ropa, una joven observa que una gorra tiene un precio de $330 y, por temporada, se le aplica un descuento de 20%. Al pagar en caja, le hacen un descuento adicional de 15%, pues presentó una tarjeta de cliente frecuente. ¿A cuánto asciende el monto total del descuento que la joven obtuvo por su compra?') RETURNING id \gset r74_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r74_id, '$105.6', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r74_id, '$115.5', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r74_id, '$224.4', FALSE);

-- Reactivo original #75
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'), 'Complete la oración con la unidad de medida correspondiente y la estimación faltante. Para un experimento escolar, Pablo pone a germinar un frijol en algodón y observa que crece en promedio 0.08 	 por hora, por lo que después de 	 horas mide 57.6 mm') RETURNING id \gset r75_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r75_id, 'mm, 72', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r75_id, 'cm, 72', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r75_id, 'cm, 720', FALSE);

-- Reactivo original #76
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'), 'Al lanzar un par de dados comunes, la probabilidad de obtener números menores a 4 en ambos dados es 			 que la probabilidad de que salgan números primos en ambos dados:') RETURNING id \gset r76_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r76_id, 'Menor', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r76_id, 'Mayor', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r76_id, 'Igual', TRUE);

-- Reactivo original #77
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'), 'Seleccione la figura cuya área es de 9 unidades cuadradas.') RETURNING id \gset r77_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r77_id, 'F1', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r77_id, 'F2', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r77_id, 'F3', TRUE);

-- Reactivo original #82
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'), '¿Cuál es la solución del sistema de ecuaciones con 2 variables que se muestra en la gráfica?') RETURNING id \gset r82_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r82_id, 'El punto A, B, o C es solución', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r82_id, 'Los puntos A, B y C son solución', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r82_id, 'Un sistema así no tiene solución', TRUE);

-- Reactivo original #83
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'), 'En la gráfica se muestra la ecuación de la parábola .') RETURNING id \gset r83_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r83_id, 'Abajo', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r83_id, 'La izquierda', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r83_id, 'La derecha', TRUE);

-- Reactivo original #84
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'), 'Con base en la siguiente imagen, determina la afirmación verdadera.') RETURNING id \gset r84_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r84_id, 'La medida del arco que determinan los ángulos es igual a', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r84_id, 'La suma de los dos ángulos centrales es igual a', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r84_id, 'La medida del arco que determinan los ángulos es igual', FALSE);

-- Reactivo original #89
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'), 'La tabla muestra los datos de una encuesta que se realizó a 30 familias para conocer la cantidad de focos que tiene en su casa:') RETURNING id \gset r89_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r89_id, '16', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r89_id, '17', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r89_id, '18', FALSE);

-- Reactivo original #90
INSERT INTO reactivos (categoria_id, pregunta) VALUES ((SELECT id FROM categorias WHERE nombre='Matemáticas'), 'El Departamento de Calidad reporta que hay modelos de celulares que han presentado gran cantidad de defectos en 5 lotes. El gerente recolecta los datos de la tabla y observa que ambos modelos tienen un promedio de 29 equipos defectuosos, por lo que descontinuará el modelo cuya cantidad de equipo defectuoso se aleje más del promedio. ¿Qué decisión toma el gerente?') RETURNING id \gset r90_
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r90_id, 'Descontinuar el modelo PF3, ya que es el que presenta menor dispersión en la cantidad de aparatos defectuosos por lote', FALSE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r90_id, 'Descontinuar el modelo CT5, ya que es el que presenta mayor dispersión en la cantidad de aparatos defectuosos por lote', TRUE);
INSERT INTO opciones (reactivo_id, texto, es_correcta) VALUES (:r90_id, 'Descontinuar otro modelo, ya que la dispersión es la cantidad de aparatos defectuosos por lote de los modelos CT5 y PF3 es menor al promedio', FALSE);
