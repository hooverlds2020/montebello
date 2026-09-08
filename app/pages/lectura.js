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

  // Fase: finalizado, muestra resumen.
  if (faseVista === 'finalizado' && resultado) {
    return (
      <div style={contenedor}>
        <div style={{ textAlign: 'center', padding: 28, background: '#eafaf1', borderRadius: 12 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
          <p style={{ margin: '0 0 16px 0', color: '#2e7d32', fontSize: 15 }}>Terminaste la lectura "{resultado.lecturaTitulo}".</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap', fontSize: 14, color: '#333' }}>
            <div><strong>{resultado.totalPalabras}</strong><br />palabras</div>
            <div><strong>{resultado.tiempoMinutos} min</strong><br />tiempo</div>
            <div><strong>{resultado.ppm}</strong><br />ppm</div>
            <div><strong>{resultado.aciertos}/{resultado.totalPreguntas}</strong><br />aciertos</div>
          </div>
          <button
            onClick={cerrarSesion}
            style={{ marginTop: 24, padding: '10px 24px', background: '#fff', color: '#2e7d32', border: '1px solid #2e7d32', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return <div style={contenedor}>Cargando…</div>;
}
