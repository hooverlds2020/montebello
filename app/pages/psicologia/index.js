import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const ITEMS_HAMILTON = [
  'Estado de ánimo ansioso',
  'Tensión',
  'Temores',
  'Insomnio',
  'Intelectual (cognitivo)',
  'Estado de ánimo deprimido',
  'Síntomas somáticos generales (musculares)',
  'Síntomas somáticos generales (sensoriales)',
  'Síntomas cardiovasculares',
  'Síntomas respiratorios',
  'Síntomas gastrointestinales',
  'Síntomas genitourinarios',
  'Síntomas autónomos',
  'Comportamiento en la entrevista',
];

const ESCALA = [
  { v: 0, l: 'Ausente' },
  { v: 1, l: 'Leve' },
  { v: 2, l: 'Moderado' },
  { v: 3, l: 'Grave' },
  { v: 4, l: 'Muy grave' },
];

export default function Psicologia() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [capturando, setCapturando] = useState(false);
  const [items, setItems] = useState(Array(14).fill(null));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/psicologia/me')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setUsuario(data);
        setCargando(false);
      })
      .catch(() => router.push('/psicologia/login'));
  }, []);

  async function buscar(q) {
    setBusqueda(q);
    if (!q.trim()) {
      setResultadosBusqueda([]);
      return;
    }
    const res = await fetch(`/api/psicologia/buscar-alumnos?q=${encodeURIComponent(q)}`);
    setResultadosBusqueda(await res.json());
  }

  async function seleccionarAlumno(a) {
    setAlumnoSeleccionado(a);
    setResultadosBusqueda([]);
    setBusqueda('');
    setCapturando(false);
    setItems(Array(14).fill(null));
    setError('');
    const res = await fetch(`/api/psicologia/hamilton?alumnoId=${a.id}`);
    setHistorial(await res.json());
  }

  async function guardarEvaluacion() {
    setError('');
    if (items.some((v) => v == null)) {
      setError('Debes calificar los 14 ítems.');
      return;
    }
    setGuardando(true);
    const res = await fetch('/api/psicologia/hamilton', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alumnoId: alumnoSeleccionado.id, items }),
    });
    const data = await res.json();
    setGuardando(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setCapturando(false);
    setItems(Array(14).fill(null));
    const res2 = await fetch(`/api/psicologia/hamilton?alumnoId=${alumnoSeleccionado.id}`);
    setHistorial(await res2.json());
  }

  async function cerrarSesion() {
    await fetch('/api/psicologia/logout', { method: 'POST' });
    router.push('/psicologia/login');
  }

  if (cargando) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Cargando…</div>;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, margin: 0 }}>Módulo de orientación</h1>
          <p style={{ fontSize: 13, color: '#888', margin: '2px 0 0 0' }}>{usuario.nombre}</p>
        </div>
        <button
          onClick={cerrarSesion}
          style={{ height: 36, padding: '0 16px', border: '1px solid #ddd', background: '#fff', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
        >
          Cerrar sesión
        </button>
      </div>

      {!alumnoSeleccionado && (
        <div style={{ position: 'relative' }}>
          <input
            placeholder="Buscar alumno por nombre o correo…"
            value={busqueda}
            onChange={(e) => buscar(e.target.value)}
            style={{ width: '100%', height: 44, padding: '0 14px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' }}
          />
          {resultadosBusqueda.length > 0 && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, marginTop: 6, overflow: 'hidden' }}>
              {resultadosBusqueda.map((a) => (
                <button
                  key={a.id}
                  onClick={() => seleccionarAlumno(a)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: 12, border: 'none', borderBottom: '1px solid #f0f0f0', background: '#fff', cursor: 'pointer' }}
                >
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{a.nombre}</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#888' }}>
                    {a.email} · {a.num_evaluaciones} evaluación(es) previa(s)
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {alumnoSeleccionado && (
        <div>
          <button
            onClick={() => setAlumnoSeleccionado(null)}
            style={{ background: 'none', border: 'none', color: '#4a90d9', fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0 }}
          >
            ← Buscar otro alumno
          </button>

          <div style={{ background: '#fafbfc', border: '1px solid #eee', borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{alumnoSeleccionado.nombre}</p>
            <p style={{ margin: '2px 0 0 0', fontSize: 13, color: '#888' }}>{alumnoSeleccionado.email}</p>
          </div>

          {!capturando && (
            <>
              <button
                onClick={() => setCapturando(true)}
                style={{ height: 42, padding: '0 20px', background: '#0f2a44', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 24 }}
              >
                + Nueva evaluación
              </button>

              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Historial</h3>
              {!historial && <p style={{ color: '#888', fontSize: 13 }}>Cargando…</p>}
              {historial && historial.length === 0 && <p style={{ color: '#888', fontSize: 13 }}>Sin evaluaciones previas.</p>}
              {historial && historial.map((h) => (
                <div key={h.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, marginBottom: 10 }}>
                  <p style={{ margin: '0 0 6px 0', fontSize: 12, color: '#888' }}>
                    {new Date(h.creado_en).toLocaleString('es-MX')} · capturado por {h.capturado_por || 'usuario eliminado'}
                  </p>
                  <p style={{ margin: '0 0 4px 0', fontSize: 13 }}><strong>Puntuación total:</strong> {h.puntuacion_total} — {h.nivel}</p>
                  <p style={{ margin: 0, fontSize: 13 }}>
                    <strong>Ansiedad psíquica:</strong> {h.ansiedad_psiquica} · <strong>Ansiedad somática:</strong> {h.ansiedad_somatica}
                  </p>
                </div>
              ))}
            </>
          )}

          {capturando && (
            <div>
              <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
                Califica cada ítem según tu observación durante la entrevista (0 = ausente, 4 = muy grave/incapacitante).
              </p>
              {ITEMS_HAMILTON.map((texto, i) => (
                <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #f0f0f0' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: 14 }}>{i + 1}. {texto}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {ESCALA.map((op) => (
                      <button
                        key={op.v}
                        onClick={() => {
                          const copia = [...items];
                          copia[i] = op.v;
                          setItems(copia);
                        }}
                        style={{
                          flex: '1 0 80px', padding: '8px 4px', borderRadius: 8, cursor: 'pointer', fontSize: 12, textAlign: 'center',
                          border: items[i] === op.v ? '2px solid #4a90d9' : '1px solid #ddd',
                          background: items[i] === op.v ? '#eaf2fb' : '#fff',
                          color: items[i] === op.v ? '#3a5b7a' : '#555',
                          fontWeight: items[i] === op.v ? 600 : 400,
                        }}
                      >
                        {op.v} — {op.l}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {error && <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 12 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={guardarEvaluacion}
                  disabled={guardando}
                  style={{ height: 42, padding: '0 20px', background: guardando ? '#a9c6e8' : '#4a90d9', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: guardando ? 'default' : 'pointer' }}
                >
                  {guardando ? 'Guardando…' : 'Guardar evaluación'}
                </button>
                <button
                  onClick={() => { setCapturando(false); setItems(Array(14).fill(null)); setError(''); }}
                  style={{ height: 42, padding: '0 20px', background: '#fff', border: '1px solid #ddd', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
