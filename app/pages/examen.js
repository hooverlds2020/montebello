import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Examen() {
  const [alumno, setAlumno] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [examenId, setExamenId] = useState(null);
  const [pregunta, setPregunta] = useState(null);
  const [seleccion, setSeleccion] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setAlumno(data);
        setCargando(false);
      })
      .catch(() => router.push('/login'));
  }, []);

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
  }

  async function cerrarSesion() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (cargando) return null;

  if (resultado) {
    return (
      <div style={{ maxWidth: 560, margin: '40px auto', fontFamily: 'sans-serif', padding: 24 }}>
        <h1 style={{ textAlign: 'center' }}>Resultado del diagnóstico</h1>
        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <div style={{ fontSize: 48, fontWeight: 'bold', color: '#4a90d9' }}>{resultado.general.porcentaje}%</div>
          <div style={{ color: '#666' }}>{resultado.general.correctas} de {resultado.general.total} correctas</div>
        </div>

        {resultado.porCategoria.map((c) => (
          <div key={c.categoria} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
              <strong>{c.categoria}</strong>
              <span>{c.correctas}/{c.total} ({c.porcentaje}%)</span>
            </div>
            <div style={{ background: '#eee', borderRadius: 6, height: 12, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${c.porcentaje}%`,
                  height: '100%',
                  background: c.porcentaje >= 60 ? '#2e7d32' : '#c0392b',
                }}
              />
            </div>
          </div>
        ))}

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button onClick={cerrarSesion} style={{ padding: '8px 16px' }}>Cerrar sesión</button>
        </div>
      </div>
    );
  }

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
            <div
              style={{ fontSize: 15, lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: pregunta.lectura.texto }}
            />
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
              display: 'block',
              padding: 12,
              marginBottom: 8,
              border: `1px solid ${seleccion === o.id ? '#4a90d9' : '#ddd'}`,
              borderRadius: 6,
              background: seleccion === o.id ? '#eef4fb' : '#fff',
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              name="opcion"
              checked={seleccion === o.id}
              onChange={() => setSeleccion(o.id)}
              style={{ marginRight: 8 }}
            />
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

  return (
    <div style={{ maxWidth: 500, margin: '60px auto', fontFamily: 'sans-serif', padding: 24, textAlign: 'center' }}>
      <h1>Hola, {alumno?.nombre} 👋</h1>
      <p style={{ color: '#666' }}>
        Estás a punto de comenzar tu examen de diagnóstico. Una vez que empieces, tus respuestas se
        guardan automáticamente en cada paso.
      </p>
      {error && <p style={{ color: '#c0392b' }}>{error}</p>}
      <button
        onClick={iniciarExamen}
        style={{ padding: '12px 24px', background: '#4a90d9', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 16 }}
      >
        Iniciar examen
      </button>
      <div style={{ marginTop: 24 }}>
        <button onClick={cerrarSesion} style={{ padding: '6px 12px' }}>Cerrar sesión</button>
      </div>
    </div>
  );
}
