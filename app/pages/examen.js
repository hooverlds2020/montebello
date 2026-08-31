import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const PALETA = ['#4a90d9', '#2e7d32', '#e08e2b', '#8e44ad', '#c0392b', '#16a085'];

function DonaResultado({ resultado }) {
  let acumuladoGrados = 0;
  const segmentos = resultado.porCategoria.map((c, i) => {
    const proporcion = c.total / resultado.general.total;
    const grados = proporcion * 360;
    const desde = acumuladoGrados;
    const hasta = acumuladoGrados + grados;
    acumuladoGrados = hasta;
    return { ...c, color: PALETA[i % PALETA.length], desde, hasta };
  });
  const gradienteCss = `conic-gradient(${segmentos
    .map((s) => `${s.color} ${s.desde}deg ${s.hasta}deg`)
    .join(', ')})`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
      <div
        style={{
          width: 220, height: 220, borderRadius: '50%', background: gradienteCss,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ width: 150, height: 150, borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 40, fontWeight: 'bold', color: '#333' }}>{resultado.general.porcentaje}%</div>
          <div style={{ fontSize: 12, color: '#888' }}>{resultado.general.correctas} de {resultado.general.total}</div>
        </div>
      </div>

      <div style={{ minWidth: 220 }}>
        {segmentos.map((s) => (
          <div key={s.categoria} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{s.categoria}</div>
              <div style={{ fontSize: 13, color: '#888' }}>{s.correctas}/{s.total} correctas · {s.porcentaje}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatearFecha(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Examen() {
  const [alumno, setAlumno] = useState(null);
  const [umbralAprobacion, setUmbralAprobacion] = useState(60); // valor por defecto mientras carga
  const [cargando, setCargando] = useState(true);
  const [examenId, setExamenId] = useState(null);
  const [pregunta, setPregunta] = useState(null);
  const [seleccion, setSeleccion] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  const [historial, setHistorial] = useState(null);
  const [resultadoHistorico, setResultadoHistorico] = useState(null);
  const [cargandoHistorico, setCargandoHistorico] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setAlumno(data);
        cargarHistorial();
        setCargando(false);
      })
      .catch(() => router.push('/login'));

    fetch('/api/config/publico')
      .then((res) => res.json())
      .then((data) => setUmbralAprobacion(data.umbralAprobacion))
      .catch(() => {}); // si falla, se queda con el valor por defecto (60)
  }, []);

  async function cargarHistorial() {
    const res = await fetch('/api/examen/historial');
    if (res.ok) setHistorial(await res.json());
  }

  async function verResultadoHistorico(id) {
    setCargandoHistorico(true);
    const res = await fetch(`/api/examen/resultado?examenId=${id}`);
    const data = await res.json();
    setCargandoHistorico(false);
    setResultadoHistorico(data);
  }

  async function iniciarExamen() {
    setError('');
    setCargando(true);
    const res = await fetch('/api/examen/iniciar', { method: 'POST' });
    const data = await res.json();
    setCargando(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setExamenId(data.examenId);
    cargarSiguiente(data.examenId);
  }

  async function cargarSiguiente(id) {
    setSeleccion(null);
    const res = await fetch(`/api/examen/siguiente?examenId=${id}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    if (data.terminado) {
      finalizarExamen(id);
      return;
    }
    setPregunta(data);
  }

  async function enviarRespuesta() {
    if (!seleccion) return;
    setEnviando(true);
    const res = await fetch('/api/examen/responder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examenReactivoId: pregunta.examenReactivoId, opcionId: seleccion }),
    });
    setEnviando(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      return;
    }
    cargarSiguiente(examenId);
  }

  async function finalizarExamen(id) {
    const res = await fetch(`/api/examen/resultado?examenId=${id}`, { method: 'POST' });
    const data = await res.json();
    setResultado(data);
    setPregunta(null);
    cargarHistorial();
  }

  async function cerrarSesion() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (cargando) return null;

  // ---- Pantalla de resultado (examen recién terminado) ----
  if (resultado) {
    return (
      <div style={{ maxWidth: 640, margin: '40px auto', fontFamily: 'sans-serif', padding: 24 }}>
        <h1 style={{ textAlign: 'center', marginBottom: 32 }}>Resultado del diagnóstico</h1>
        <DonaResultado resultado={resultado} />
        <div style={{ textAlign: 'center', marginTop: 40, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={() => { setResultado(null); }}
            style={{ padding: '8px 16px', background: '#4a90d9', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            Ver mi panel
          </button>
          <button onClick={cerrarSesion} style={{ padding: '8px 16px' }}>Cerrar sesión</button>
        </div>
      </div>
    );
  }

  // ---- Pantalla de presentación de pregunta ----
  if (pregunta) {
    return (
      <div style={{ maxWidth: pregunta.lectura ? 680 : 560, margin: '40px auto', fontFamily: 'sans-serif', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#666', marginBottom: 8 }}>
          <span>{pregunta.categoria}</span>
          <span>Pregunta {pregunta.numero} de {pregunta.total}</span>
        </div>
        <div style={{ background: '#eee', borderRadius: 6, height: 6, marginBottom: 20 }}>
          <div style={{ width: `${(pregunta.respondidas / pregunta.total) * 100}%`, height: '100%', background: '#4a90d9', borderRadius: 6 }} />
        </div>

        {pregunta.lectura && (
          <div style={{ background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: 8, padding: 20, marginBottom: 20 }}>
            {pregunta.lectura.titulo && (
              <h2 style={{ textAlign: 'center', fontSize: 18, marginBottom: 4 }}>{pregunta.lectura.titulo}</h2>
            )}
            {pregunta.lectura.subtitulo && (
              <p style={{ textAlign: 'center', fontStyle: 'italic', color: '#666', fontSize: 14, marginBottom: 16 }}>
                {pregunta.lectura.subtitulo}
              </p>
            )}
            {pregunta.lectura.imagenUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pregunta.lectura.imagenUrl} alt="" style={{ maxWidth: '100%', marginBottom: 16, display: 'block' }} />
            )}
            <div style={{ fontSize: 15, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: pregunta.lectura.texto }} />
          </div>
        )}

        <p style={{ fontSize: 17, marginBottom: 16 }}>{pregunta.pregunta}</p>
        {pregunta.imagenUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pregunta.imagenUrl} alt="" style={{ maxWidth: '100%', marginBottom: 16 }} />
        )}

        {pregunta.opciones.map((o) => (
          <label
            key={o.id}
            style={{
              display: 'block', padding: 12, marginBottom: 8,
              border: `1px solid ${seleccion === o.id ? '#4a90d9' : '#ddd'}`,
              borderRadius: 6, background: seleccion === o.id ? '#eef4fb' : '#fff', cursor: 'pointer',
            }}
          >
            <input type="radio" name="opcion" checked={seleccion === o.id} onChange={() => setSeleccion(o.id)} style={{ marginRight: 8 }} />
            {o.texto}
            {o.imagen_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={o.imagen_url} alt="" style={{ display: 'block', maxWidth: '100%', marginTop: 6 }} />
            )}
          </label>
        ))}

        {error && <p style={{ color: '#c0392b' }}>{error}</p>}

        <button
          onClick={enviarRespuesta}
          disabled={!seleccion || enviando}
          style={{ width: '100%', padding: 12, marginTop: 12, background: '#4a90d9', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: !seleccion || enviando ? 0.6 : 1 }}
        >
          {enviando ? 'Guardando...' : 'Siguiente'}
        </button>
      </div>
    );
  }

  // ---- Ver el detalle de un intento pasado ----
  if (resultadoHistorico) {
    return (
      <div style={{ maxWidth: 640, margin: '40px auto', fontFamily: 'sans-serif', padding: 24 }}>
        <button onClick={() => setResultadoHistorico(null)} style={{ marginBottom: 20, padding: '6px 12px' }}>
          ← Volver a mi panel
        </button>
        <h1 style={{ textAlign: 'center', marginBottom: 32 }}>Detalle del intento</h1>
        <DonaResultado resultado={resultadoHistorico} />
      </div>
    );
  }

  // ---- Dashboard principal del alumno ----
  const mejor = historial && historial.length > 0 ? Math.max(...historial.map((h) => h.porcentaje)) : null;
  const masReciente = historial && historial.length > 0 ? historial[0] : null;

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'sans-serif', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0 }}>Hola, {alumno?.nombre} 👋</h1>
          <p style={{ color: '#888', margin: 0, fontSize: 14 }}>{alumno?.email}</p>
        </div>
        <button onClick={cerrarSesion} style={{ padding: '6px 12px' }}>Cerrar sesión</button>
      </div>

      {error && <p style={{ color: '#c0392b' }}>{error}</p>}

      {/* Tarjetas de estadísticas rápidas */}
      {historial && historial.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 140, background: '#f0f4fa', borderRadius: 10, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#4a90d9' }}>{historial.length}</div>
            <div style={{ fontSize: 12, color: '#666' }}>Intentos realizados</div>
          </div>
          <div style={{ flex: 1, minWidth: 140, background: '#eafaf1', borderRadius: 10, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#2e7d32' }}>{mejor}%</div>
            <div style={{ fontSize: 12, color: '#666' }}>Mejor resultado</div>
          </div>
          <div style={{ flex: 1, minWidth: 140, background: '#fdf3e3', borderRadius: 10, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#e08e2b' }}>{masReciente.porcentaje}%</div>
            <div style={{ fontSize: 12, color: '#666' }}>Último intento</div>
          </div>
        </div>
      )}

      {/* Botón para nuevo examen */}
      <div style={{ textAlign: 'center', marginBottom: 40, padding: 24, border: '2px dashed #ddd', borderRadius: 10 }}>
        <p style={{ color: '#666', marginBottom: 16 }}>
          {historial && historial.length > 0
            ? '¿Listo para presentar un nuevo diagnóstico?'
            : 'Aún no has presentado tu examen de diagnóstico.'}
        </p>
        <button
          onClick={iniciarExamen}
          style={{ padding: '12px 28px', background: '#4a90d9', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 16 }}
        >
          Iniciar examen
        </button>
      </div>

      {/* Historial de intentos */}
      {historial && historial.length > 0 && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Historial de evaluaciones</h2>
          {historial.map((h) => (
            <div
              key={h.examenId}
              onClick={() => verResultadoHistorico(h.examenId)}
              style={{
                padding: 14, border: '1px solid #eee', borderRadius: 8, marginBottom: 8, cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: h.porCategoria.length > 0 ? 10 : 0 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{formatearFecha(h.finalizadoEn)}</div>
                  <div style={{ fontSize: 13, color: '#888' }}>{h.correctas} de {h.total} correctas</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      fontSize: 15, fontWeight: 'bold', color: h.porcentaje >= umbralAprobacion ? '#2e7d32' : '#c0392b',
                      background: h.porcentaje >= umbralAprobacion ? '#eafaf1' : '#fdeceb', padding: '4px 10px', borderRadius: 20,
                    }}
                  >
                    {h.porcentaje}%
                  </div>
                  <span style={{ color: '#ccc' }}>›</span>
                </div>
              </div>
              {h.porCategoria.length > 0 && (
                <div style={{ borderTop: '1px solid #f2f2f2', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {h.porCategoria.map((c) => (
                    <div key={c.categoria}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', marginBottom: 3 }}>
                        <span>{c.categoria}</span>
                        <span style={{ fontWeight: 600, color: c.porcentaje >= umbralAprobacion ? '#2e7d32' : '#c0392b' }}>{c.porcentaje}%</span>
                      </div>
                      <div style={{ background: '#eee', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${c.porcentaje}%`, height: '100%', borderRadius: 4,
                            background: c.porcentaje >= umbralAprobacion ? '#2e7d32' : '#c0392b',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {cargandoHistorico && <p style={{ textAlign: 'center', color: '#888' }}>Cargando...</p>}
    </div>
  );
}
