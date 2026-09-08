import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';

export default function Lectura() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [estado, setEstado] = useState(null); // respuesta de /api/lectura/estado
  const [error, setError] = useState('');
  const [intentoId, setIntentoId] = useState(null);
  const [faseVista, setFaseVista] = useState(null); // 'leyendo' | 'preguntas' | 'finalizado'
  const [textoLectura, setTextoLectura] = useState('');
  const [fuenteLectura, setFuenteLectura] = useState('');
  const [tituloLectura, setTituloLectura] = useState('');
  const [pregunta, setPregunta] = useState(null);
  const [seleccion, setSeleccion] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [vistaFinal, setVistaFinal] = useState('resumen'); // 'resumen' | 'detalle'
  const [detalleRespuestas, setDetalleRespuestas] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Cronómetro visible mientras lee: solo de referencia visual para el
  // alumno — el tiempo real y oficial se calcula en el servidor.
  const [segundosVisibles, setSegundosVisibles] = useState(0);
  const inicioRef = useRef(null);
  const intervaloRef = useRef(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => cargarEstado())
      .catch(() => router.push('/login'));
  }, []);

  async function cargarEstado() {
    setCargando(true);
    const res = await fetch('/api/lectura/estado');
    const data = await res.json();
    setEstado(data);
    if (data.intento) {
      setIntentoId(data.intento.id);
      setTituloLectura(data.intento.lectura.titulo);
      setTextoLectura(data.intento.lectura.texto);
      setFuenteLectura(data.intento.lectura.fuente || '');
      setFaseVista(data.intento.estado === 'preguntas' ? 'preguntas' : data.intento.estado);
      if (data.intento.estado === 'preguntas') {
        cargarPregunta(data.intento.id);
      }
      if (data.intento.estado === 'finalizado') {
        cargarResultado(data.intento.id);
      }
    }
    setCargando(false);
  }

  async function iniciar() {
    setError('');
    const res = await fetch('/api/lectura/iniciar', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setIntentoId(data.intentoId);
    if (estado?.lecturaDisponible) {
      setTituloLectura(estado.lecturaDisponible.titulo);
    }
    // Necesitamos el texto completo: recargamos el estado ya con el intento creado.
    const res2 = await fetch('/api/lectura/estado');
    const data2 = await res2.json();
    setEstado(data2);
    setTextoLectura(data2.intento.lectura.texto);
    setFuenteLectura(data2.intento.lectura.fuente || '');
    setFaseVista('leyendo');
    inicioRef.current = Date.now();
    setSegundosVisibles(0);
    intervaloRef.current = setInterval(() => {
      setSegundosVisibles(Math.floor((Date.now() - inicioRef.current) / 1000));
    }, 1000);
  }

  async function terminarLectura() {
    if (intervaloRef.current) clearInterval(intervaloRef.current);
    setEnviando(true);
    await fetch('/api/lectura/terminar-lectura', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intentoId }),
    });
    setEnviando(false);
    setFaseVista('preguntas');
    cargarPregunta(intentoId);
  }

  async function cargarPregunta(id) {
    const res = await fetch(`/api/lectura/pregunta?intentoId=${id}`);
    const data = await res.json();
    if (data.terminado) {
      finalizar(id);
      return;
    }
    setPregunta(data);
    setSeleccion(data.opcionSeleccionadaId || null);
  }

  async function siguientePregunta() {
    if (seleccion == null) return;
    setEnviando(true);
    await fetch('/api/lectura/responder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intentoId, preguntaId: pregunta.preguntaId, opcionId: seleccion }),
    });
    setEnviando(false);
    cargarPregunta(intentoId);
  }

  async function finalizar(id) {
    const res = await fetch(`/api/lectura/resultado?intentoId=${id}`, { method: 'POST' });
    const data = await res.json();
    setResultado(data);
    setFaseVista('finalizado');
  }

  async function cargarResultado(id) {
    const res = await fetch(`/api/lectura/resultado?intentoId=${id}`);
    const data = await res.json();
    setResultado(data);
  }

  async function verDetalleRespuestas() {
    const res = await fetch(`/api/lectura/detalle?intentoId=${intentoId}`);
    const data = await res.json();
    setDetalleRespuestas(data.detalle || []);
    setVistaFinal('detalle');
  }

  // 79 -> "1:19", para mostrar la tabla de referencia con el mismo formato
  // que se capturó en el admin.
  function segundosAMmss(seg) {
    if (seg == null) return '';
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  async function cerrarSesion() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (cargando) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Cargando…</div>;
  }

  const contenedor = { maxWidth: 720, margin: '0 auto', padding: '32px 20px' };

  // Bloqueado: no ha terminado su diagnóstico todavía.
  if (estado && !estado.disponible && estado.motivo === 'diagnostico_pendiente') {
    return (
      <div style={contenedor}>
        <div style={{ background: '#fdf3e3', border: '1px solid #f0d9a8', borderRadius: 12, padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
          <p style={{ margin: 0, color: '#8a6416', fontSize: 15 }}>
            Esta sección se habilitará después de que presentes tu examen de diagnóstico.
          </p>
        </div>
      </div>
    );
  }

  // Terminó el diagnóstico, pero en ESTA MISMA sesión — debe cerrar sesión
  // y volver a entrar más tarde para que se habilite la lectura.
  if (estado && !estado.disponible && estado.motivo === 'espera_nueva_sesion') {
    return (
      <div style={contenedor}>
        <div style={{ background: '#fdf3e3', border: '1px solid #f0d9a8', borderRadius: 12, padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
          <p style={{ margin: 0, color: '#8a6416', fontSize: 15 }}>
            Ya terminaste tu examen de diagnóstico. La lectura se habilitará la próxima vez que inicies sesión.
          </p>
        </div>
      </div>
    );
  }

  // Sin lectura configurada por el admin todavía.
  if (estado && !estado.disponible && estado.motivo === 'sin_lectura_activa') {
    return (
      <div style={contenedor}>
        <div style={{ background: '#eaf2fb', border: '1px solid #cfe3f7', borderRadius: 12, padding: 28, textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#3a5b7a', fontSize: 15 }}>
            Esta sección aún no está disponible. Vuelve a intentarlo más tarde.
          </p>
        </div>
      </div>
    );
  }

  // Sin intento aún, pero ya puede iniciar.
  if (!intentoId && estado?.lecturaDisponible) {
    return (
      <div style={contenedor}>
        <div style={{ textAlign: 'center', padding: 28, background: '#eaf2fb', borderRadius: 12 }}>
          <p style={{ color: '#3a5b7a', marginBottom: 16, fontSize: 15 }}>
            Vas a leer <strong>{estado.lecturaDisponible.titulo}</strong> ({estado.lecturaDisponible.totalPalabras} palabras).
            Lee en voz alta a tu ritmo normal; al terminar presiona el botón para pasar a las preguntas.
          </p>
          <button
            onClick={iniciar}
            style={{ padding: '12px 28px', background: '#4a90d9', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 600 }}
          >
            Iniciar lectura
          </button>
          {error && <p style={{ color: '#c0392b', marginTop: 12 }}>{error}</p>}
        </div>
      </div>
    );
  }

  // Fase: leyendo el texto, cronómetro corriendo.
  if (faseVista === 'leyendo') {
    return (
      <div style={contenedor}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{tituloLectura}</h2>
          <div style={{ fontVariantNumeric: 'tabular-nums', fontSize: 18, fontWeight: 700, color: '#4a90d9' }}>
            ⏱ {Math.floor(segundosVisibles / 60)}:{String(segundosVisibles % 60).padStart(2, '0')}
          </div>
        </div>
        <div style={{ background: '#fafbfc', border: '1px solid #eee', borderRadius: 12, padding: 24, fontSize: 16, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
          {textoLectura}
        </div>
        {fuenteLectura && (
          <p style={{ fontSize: 12, color: '#999', marginTop: 8, fontStyle: 'italic' }}>{fuenteLectura}</p>
        )}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            onClick={terminarLectura}
            disabled={enviando}
            style={{ padding: '12px 28px', background: enviando ? '#a9c6e8' : '#4a90d9', color: '#fff', border: 'none', borderRadius: 8, cursor: enviando ? 'default' : 'pointer', fontSize: 16, fontWeight: 600 }}
          >
            {enviando ? 'Guardando…' : 'Terminé de leer'}
          </button>
        </div>
      </div>
    );
  }

  // Fase: preguntas de comprensión.
  if (faseVista === 'preguntas' && pregunta) {
    return (
      <div style={contenedor}>
        {pregunta.totalPreguntas && (
          <p style={{ fontSize: 13, color: '#888', margin: '0 0 6px 0' }}>
            Pregunta {pregunta.numeroActual} de {pregunta.totalPreguntas}
          </p>
        )}
        <h2 style={{ fontSize: 18, marginBottom: 20 }}>{pregunta.pregunta}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pregunta.opciones.map((o) => (
            <label
              key={o.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 10,
                border: seleccion === o.id ? '2px solid #4a90d9' : '1px solid #ddd', cursor: 'pointer',
                background: seleccion === o.id ? '#eaf2fb' : '#fff',
              }}
            >
              <input type="radio" checked={seleccion === o.id} onChange={() => setSeleccion(o.id)} />
              {o.texto}
            </label>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button
            onClick={siguientePregunta}
            disabled={seleccion == null || enviando}
            style={{
              padding: '12px 28px', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600,
              background: seleccion == null || enviando ? '#a9c6e8' : '#4a90d9',
              cursor: seleccion == null || enviando ? 'default' : 'pointer',
            }}
          >
            {enviando ? 'Guardando…' : 'Siguiente'}
          </button>
        </div>
      </div>
    );
  }

  // Fase: finalizado, muestra resumen (o el detalle de respuestas si lo pidió).
  if (faseVista === 'finalizado' && resultado) {
    if (vistaFinal === 'detalle') {
      return (
        <div style={contenedor}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Detalle de respuestas — {resultado.lecturaTitulo}</h2>
          {!detalleRespuestas && <p style={{ color: '#888' }}>Cargando…</p>}
          {detalleRespuestas && detalleRespuestas.map((d, i) => (
            <div key={i} style={{ background: '#fafbfc', border: '1px solid #eee', borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <p style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600 }}>{i + 1}. {d.pregunta}</p>
              <p style={{ margin: 0, fontSize: 13, color: d.acerto ? '#2e7d32' : '#c0392b' }}>
                {d.acerto ? '✓' : '✕'} Tu respuesta: {d.opcionElegida || '(sin responder)'}
              </p>
              {!d.acerto && (
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#2e7d32' }}>
                  Respuesta correcta: {d.opcionCorrecta}
                </p>
              )}
            </div>
          ))}
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button
              onClick={() => setVistaFinal('resumen')}
              style={{ padding: '10px 24px', background: '#fff', color: '#4a90d9', border: '1px solid #4a90d9', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              ← Volver al resumen
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={contenedor}>
        <div style={{ textAlign: 'center', padding: 28, background: '#eafaf1', borderRadius: 12 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
          <h2 style={{ margin: '0 0 16px 0', color: '#2e7d32', fontSize: 18 }}>
            Resultado de Lectura — {resultado.lecturaTitulo}
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap', fontSize: 14, color: '#333' }}>
            <div><strong>{resultado.totalPalabras}</strong><br />palabras</div>
            <div><strong>{resultado.tiempoMinutos} min</strong><br />tiempo</div>
            <div><strong>{resultado.ppm}</strong><br />ppm</div>
            <div><strong>{resultado.aciertos}/{resultado.totalPreguntas}</strong><br />aciertos</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
            <button
              onClick={verDetalleRespuestas}
              style={{ padding: '10px 22px', background: '#4a90d9', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Ver detalle de respuestas
            </button>
            <button
              onClick={() => router.push('/examen')}
              style={{ padding: '10px 22px', background: '#fff', color: '#2e7d32', border: '1px solid #2e7d32', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Volver al diagnóstico
            </button>
          </div>
        </div>

        {/* Tabla de referencia: solo aparece si el admin configuró los 4
            umbrales para ESTA lectura específica; si no, no se muestra nada
            (evita clasificaciones incorrectas con datos de otra lectura). */}
        {resultado.tablaReferencia && (
          <div style={{ marginTop: 20, background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px 0' }}>
              Tabla de referencia — {resultado.totalPalabras} palabras
            </h3>
            {resultado.nivel && (
              <p style={{ margin: '4px 0 12px 0', fontSize: 14, fontWeight: 600, color: '#4a90d9' }}>
                Velocidad: {resultado.nivel}
              </p>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Nivel</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Tiempo</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Excelente', resultado.tablaReferencia.excelente],
                  ['Muy bien', resultado.tablaReferencia.muybien],
                  ['Bien', resultado.tablaReferencia.bien],
                  ['Deficiente', resultado.tablaReferencia.deficiente],
                ].filter(([, seg]) => seg != null).map(([nombre, seg]) => (
                  <tr key={nombre} style={{ fontWeight: resultado.nivel === nombre ? 700 : 400, color: resultado.nivel === nombre ? '#4a90d9' : '#333' }}>
                    <td style={{ padding: 8, borderBottom: '1px solid #f5f5f5' }}>{nombre}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f5f5f5' }}>{segundosAMmss(seg)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            onClick={cerrarSesion}
            style={{ padding: '10px 24px', background: '#fff', color: '#888', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return <div style={contenedor}>Cargando…</div>;
}
