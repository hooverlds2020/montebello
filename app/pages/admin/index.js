import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
const { estaAutenticado } = require('../../lib/auth');

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

export async function getServerSideProps({ req }) {
  if (!estaAutenticado(req)) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
  return { props: {} };
}


export default function AdminPage() {
  const [categorias, setCategorias] = useState([]);
  const [reactivos, setReactivos] = useState([]);
  const [lecturas, setLecturas] = useState([]);
  const [nuevaCategoria, setNuevaCategoria] = useState('');

  // Categoría activa en el menú lateral (reemplaza al filtro suelto de antes)
  const [categoriaActivaId, setCategoriaActivaId] = useState(null);

  const [mensaje, setMensaje] = useState('');

  // Carga rápida: generar N preguntas de una lectura de golpe
  const [lecturaRapidaId, setLecturaRapidaId] = useState('');
  const [numPreguntas, setNumPreguntas] = useState(5);
  const [preguntasRapidas, setPreguntasRapidas] = useState([]);
  const [mensajeRapido, setMensajeRapido] = useState('');

  // Toast: mensaje flotante que reemplaza a los alert() nativos del navegador
  const [toast, setToast] = useState(null); // { texto, tipo: 'exito' | 'error' }
  function mostrarToast(texto, tipo = 'exito') {
    setToast({ texto, tipo });
    setTimeout(() => setToast(null), 3500);
  }

  // Paleta consistente de botones, para no depender del estilo por defecto del navegador
  function btnStyle(variant = 'secundario', extra = {}) {
    const base = {
      border: 'none',
      borderRadius: 6,
      padding: '8px 14px',
      fontSize: 14,
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'background 0.15s ease',
    };
    const variantes = {
      primario: { background: '#4a90d9', color: '#fff' },
      secundario: { background: '#eef1f5', color: '#333' },
      peligro: { background: '#fdeceb', color: '#c0392b' },
      exito: { background: '#e8f5e9', color: '#2e7d32' },
      activo: { background: '#4a90d9', color: '#fff' },
    };
    return { ...base, ...variantes[variant], ...extra };
  }

  const [guardandoRapido, setGuardandoRapido] = useState(false);

  const [editandoId, setEditandoId] = useState(null);
  const [editPregunta, setEditPregunta] = useState('');
  const [editLecturaId, setEditLecturaId] = useState('');
  const [editOpciones, setEditOpciones] = useState([]);

  const [tituloLectura, setTituloLectura] = useState('');
  const [textoLectura, setTextoLectura] = useState('');
  const [mensajeLectura, setMensajeLectura] = useState('');

  // Edición de una lectura ya existente (desde el encabezado del grupo)
  const [editandoLecturaId, setEditandoLecturaId] = useState(null);
  const [editLecturaTitulo, setEditLecturaTitulo] = useState('');
  const [editLecturaSubtitulo, setEditLecturaSubtitulo] = useState('');
  const [editLecturaTexto, setEditLecturaTexto] = useState('');
  const [editLecturaImagenUrl, setEditLecturaImagenUrl] = useState('');


  // Lectura inline dentro de "Carga rápida de reactivos"
  const [modoLectura, setModoLectura] = useState('ninguna'); // 'ninguna' | 'existente' | 'nueva'
  const [lecturaInlineTitulo, setLecturaInlineTitulo] = useState('');
  const [lecturaInlineSubtitulo, setLecturaInlineSubtitulo] = useState('');
  const [lecturaInlineTexto, setLecturaInlineTexto] = useState('');
  const [lecturaInlineImagenUrl, setLecturaInlineImagenUrl] = useState('');


  async function cargarCategorias() {
    const res = await fetch('/api/admin/categorias');
    const data = await res.json();
    setCategorias(data);
    if (!categoriaActivaId && data.length > 0) {
      setCategoriaActivaId(data[0].id);
    }
  }

  async function cargarLecturas() {
    const res = await fetch('/api/admin/lecturas');
    setLecturas(await res.json());
  }

  async function cargarReactivos(categoriaId) {
    const url = categoriaId
      ? `/api/admin/reactivos?categoria_id=${categoriaId}`
      : '/api/admin/reactivos';
    const res = await fetch(url);
    setReactivos(await res.json());
  }

  useEffect(() => {
    cargarCategorias();
    cargarLecturas();
  }, []);

  useEffect(() => {
    if (categoriaActivaId) {
      cargarReactivos(categoriaActivaId);
      // al cambiar de categoría, limpiamos la carga rápida en curso
      setPreguntasRapidas([]);
      setLecturaRapidaId('');
    }
  }, [categoriaActivaId]);

  async function crearCategoria(e) {
    e.preventDefault();
    setMensaje('');
    const res = await fetch('/api/admin/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nuevaCategoria }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMensaje(data.error);
      return;
    }
    setNuevaCategoria('');
    cargarCategorias();
    setCategoriaActivaId(data.id);
  }

  const [editandoMateriaId, setEditandoMateriaId] = useState(null);
  const [editMateriaNombre, setEditMateriaNombre] = useState('');

  function iniciarEdicionMateria(c) {
    setEditandoMateriaId(c.id);
    setEditMateriaNombre(c.nombre);
  }

  async function guardarNombreMateria(id) {
    const res = await fetch(`/api/admin/categorias/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: editMateriaNombre }),
    });
    const data = await res.json();
    if (!res.ok) {
      mostrarToast(data.error, 'error');
      return;
    }
    setEditandoMateriaId(null);
    cargarCategorias();
  }

  async function toggleMateriaActiva(c) {
    await fetch(`/api/admin/categorias/${c.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activa: !c.activa }),
    });
    cargarCategorias();
    mostrarToast(
      c.activa ? `"${c.nombre}" deshabilitada — no se usará en el examen` : `"${c.nombre}" habilitada de nuevo`,
      'exito'
    );
  }

  async function crearLectura(e) {
    e.preventDefault();
    setMensajeLectura('');
    const res = await fetch('/api/admin/lecturas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: tituloLectura, texto_html: textoLectura }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMensajeLectura(data.error);
      return;
    }
    setTituloLectura('');
    setTextoLectura('');
    cargarLecturas();
  }

  async function borrarLectura(id) {
    if (!confirm('¿Borrar esta lectura?')) return;
    const res = await fetch(`/api/admin/lecturas/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      mostrarToast(data.error, 'error');
      return;
    }
    cargarLecturas();
  }

  function iniciarEdicionLectura(lecturaId) {
    const l = lecturas.find((x) => x.id === lecturaId);
    if (!l) return;
    setEditandoLecturaId(lecturaId);
    setEditLecturaTitulo(l.titulo || '');
    setEditLecturaSubtitulo(l.subtitulo || '');
    setEditLecturaTexto(l.texto || '');
    setEditLecturaImagenUrl(l.imagen_url || '');
  }

  function cancelarEdicionLectura() {
    setEditandoLecturaId(null);
  }

  async function guardarEdicionLectura(id) {
    const res = await fetch(`/api/admin/lecturas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: editLecturaTitulo,
        subtitulo: editLecturaSubtitulo,
        texto_html: editLecturaTexto,
        imagen_url: editLecturaImagenUrl,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      mostrarToast(data.error, 'error');
      return;
    }
    setEditandoLecturaId(null);
    cargarLecturas();
    cargarReactivos(categoriaActivaId);
  }

  async function toggleLecturaActiva(lecturaId, activaActual) {
    await fetch(`/api/admin/lecturas/${lecturaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activa: !activaActual }),
    });
    cargarLecturas();
    cargarReactivos(categoriaActivaId);
    mostrarToast(
      activaActual ? 'Lectura deshabilitada — no se usará en el examen' : 'Lectura habilitada de nuevo',
      'exito'
    );
  }


  async function borrarReactivo(id) {
    if (!confirm('¿Borrar este reactivo?')) return;
    await fetch(`/api/admin/reactivos/${id}`, { method: 'DELETE' });
    cargarReactivos(categoriaActivaId);
  }

  function iniciarEdicion(r) {
    setEditandoId(r.id);
    setEditPregunta(r.pregunta);
    setEditLecturaId(r.lectura_id || '');
    setEditOpciones(r.opciones.map((o) => ({ texto: o.texto, es_correcta: o.es_correcta })));
  }

  function cancelarEdicion() {
    setEditandoId(null);
  }

  function actualizarOpcionEdit(i, campo, valor) {
    const copia = [...editOpciones];
    if (campo === 'es_correcta') {
      copia.forEach((o, idx) => (o.es_correcta = idx === i));
    } else {
      copia[i][campo] = valor;
    }
    setEditOpciones(copia);
  }

  async function guardarEdicion(id) {
    const res = await fetch(`/api/admin/reactivos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pregunta: editPregunta,
        lectura_id: editLecturaId || null,
        opciones: editOpciones.filter((o) => o.texto.trim()),
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      mostrarToast(data.error, 'error');
      return;
    }
    setEditandoId(null);
    cargarReactivos(categoriaActivaId);
  }

  // ---- Carga rápida por lectura ----
  function generarCamposRapidos(tipo) {
    const opcionesBase =
      tipo === 'vf'
        ? [{ texto: 'Verdadero', es_correcta: false, imagen_url: '' }, { texto: 'Falso', es_correcta: false, imagen_url: '' }]
        : Array.from({ length: tipo }, () => ({ texto: '', es_correcta: false, imagen_url: '' }));

    const nuevas = Array.from({ length: numPreguntas }, () => ({
      pregunta: '',
      imagen_url: '',
      opciones: opcionesBase.map((o) => ({ ...o })),
    }));
    setPreguntasRapidas(nuevas);
    setMensajeRapido('');
  }

  function actualizarPreguntaRapida(idx, texto) {
    const copia = [...preguntasRapidas];
    copia[idx].pregunta = texto;
    setPreguntasRapidas(copia);
  }

  function actualizarImagenPreguntaRapida(idx, url) {
    const copia = [...preguntasRapidas];
    copia[idx].imagen_url = url;
    setPreguntasRapidas(copia);
  }

  function actualizarOpcionRapida(idxPregunta, idxOpcion, campo, valor) {
    const copia = [...preguntasRapidas];
    if (campo === 'es_correcta') {
      copia[idxPregunta].opciones.forEach((o, i) => (o.es_correcta = i === idxOpcion));
    } else {
      copia[idxPregunta].opciones[idxOpcion][campo] = valor;
    }
    setPreguntasRapidas(copia);
  }

  function agregarPreguntaExtra() {
    const plantilla = preguntasRapidas[0]?.opciones.map(() => ({ texto: '', es_correcta: false, imagen_url: '' })) ||
      [{ texto: '', es_correcta: false, imagen_url: '' }, { texto: '', es_correcta: false, imagen_url: '' }, { texto: '', es_correcta: false, imagen_url: '' }];
    setPreguntasRapidas([...preguntasRapidas, { pregunta: '', imagen_url: '', opciones: plantilla }]);
  }

  function quitarPreguntaRapida(idx) {
    setPreguntasRapidas(preguntasRapidas.filter((_, i) => i !== idx));
  }


  async function guardarTodasRapidas() {
    setMensajeRapido('');
    const incompletas = preguntasRapidas.filter(
      (p) => !p.pregunta.trim() || !p.opciones.some((o) => o.es_correcta) || p.opciones.some((o) => !o.texto.trim())
    );
    if (incompletas.length > 0) {
      setMensajeRapido(`Faltan ${incompletas.length} pregunta(s) por completar o marcar su respuesta correcta`);
      return;
    }
    if (modoLectura === 'nueva' && !lecturaInlineTexto.trim()) {
      setMensajeRapido('Escribe el texto de la lectura, o cambia a "Sin lectura"');
      return;
    }
    if (modoLectura === 'continuar' && !lecturaRapidaId) {
      setMensajeRapido('Selecciona a qué lectura le vas a agregar estas preguntas');
      return;
    }

    setGuardandoRapido(true);
    try {
      let lecturaIdUsar = modoLectura === 'continuar' ? lecturaRapidaId : null;

      if (modoLectura === 'nueva') {
        const resLectura = await fetch('/api/admin/lecturas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            titulo: lecturaInlineTitulo,
            subtitulo: lecturaInlineSubtitulo,
            texto_html: lecturaInlineTexto,
            imagen_url: lecturaInlineImagenUrl,
          }),
        });
        const dataLectura = await resLectura.json();
        if (!resLectura.ok) throw new Error(dataLectura.error);
        lecturaIdUsar = dataLectura.id;
        await cargarLecturas();
      }

      for (const p of preguntasRapidas) {
        const res = await fetch('/api/admin/reactivos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoria_id: categoriaActivaId,
            pregunta: p.pregunta,
            imagen_url: p.imagen_url || null,
            lectura_id: lecturaIdUsar || null,
            opciones: p.opciones,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error);
        }
      }
      setPreguntasRapidas([]);
      setMensajeRapido('');
      setModoLectura('ninguna');
      setLecturaRapidaId('');
      setLecturaInlineTitulo('');
      setLecturaInlineSubtitulo('');
      setLecturaInlineTexto('');
      setLecturaInlineImagenUrl('');
      cargarReactivos(categoriaActivaId);
      mostrarToast('Todas las preguntas se guardaron correctamente ✓', 'exito');
    } catch (e) {
      setMensajeRapido('Error al guardar: ' + e.message + ' (revisa qué ya se guardó abajo en la lista de reactivos)');
    } finally {
      setGuardandoRapido(false);
    }
  }

  const categoriaActiva = categorias.find((c) => c.id === categoriaActivaId);

  // Agrupa reactivos por lectura (manteniendo el orden en que aparecen), para no
  // mezclar en la vista preguntas de lecturas distintas ni las sueltas sin lectura.
  function agruparPorLectura(lista) {
    const grupos = [];
    const indiceGrupo = {};
    for (const r of lista) {
      const clave = r.lectura_id || 'sin-lectura';
      if (!(clave in indiceGrupo)) {
        indiceGrupo[clave] = grupos.length;
        grupos.push({ clave, titulo: r.lectura_titulo || null, activa: r.lectura_activa !== false, items: [] });
      }
      grupos[indiceGrupo[clave]].items.push(r);
    }
    return grupos;
  }
  const gruposReactivos = agruparPorLectura(reactivos);
  const [gruposAbiertos, setGruposAbiertos] = useState({});
  function toggleGrupo(clave) {
    setGruposAbiertos((prev) => ({ ...prev, [clave]: !prev[clave] }));
  }


  return (
    <div className="admin-root" style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @media (max-width: 768px) {
          .admin-root { flex-direction: column !important; }
          .admin-sidebar {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid #ddd;
          }
          .admin-main { max-width: 100% !important; padding: 16px !important; }
        }
      `}</style>
      {/* MENÚ LATERAL */}
      <aside className="admin-sidebar" style={{ width: 220, borderRight: '1px solid #ddd', padding: 16, flexShrink: 0 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Materias</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {categorias.map((c) => (
            <li key={c.id} style={{ marginBottom: 4 }}>
              {editandoMateriaId === c.id ? (
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    value={editMateriaNombre}
                    onChange={(e) => setEditMateriaNombre(e.target.value)}
                    style={{ flex: 1, padding: 4, fontSize: 13 }}
                    autoFocus
                  />
                  <button onClick={() => guardarNombreMateria(c.id)} style={{ fontSize: 12 }}>✓</button>
                  <button onClick={() => setEditandoMateriaId(null)} style={{ fontSize: 12 }}>✕</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    onClick={() => setCategoriaActivaId(c.id)}
                    style={{
                      display: 'block',
                      flex: 1,
                      textAlign: 'left',
                      padding: '8px 10px',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: c.id === categoriaActivaId ? '#4a90d9' : 'transparent',
                      color: c.id === categoriaActivaId ? '#fff' : c.activa === false ? '#aaa' : '#333',
                      fontWeight: c.id === categoriaActivaId ? 'bold' : 'normal',
                      fontStyle: c.activa === false ? 'italic' : 'normal',
                    }}
                  >
                    {c.nombre} {c.activa === false && '(deshabilitada)'}
                  </button>
                  <button
                    onClick={() => iniciarEdicionMateria(c)}
                    title="Renombrar"
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13 }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => toggleMateriaActiva(c)}
                    title={c.activa === false ? 'Habilitar' : 'Deshabilitar'}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13 }}
                  >
                    {c.activa === false ? '🔒' : '🔓'}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>

        <form onSubmit={crearCategoria} style={{ marginTop: 16 }}>
          <input
            placeholder="Nueva materia"
            value={nuevaCategoria}
            onChange={(e) => setNuevaCategoria(e.target.value)}
            style={{ width: '100%', padding: 6, marginBottom: 6, boxSizing: 'border-box' }}
          />
          <button type="submit" style={btnStyle('primario', { width: '100%', padding: 8 })}>+ Agregar materia</button>
        </form>
        {mensaje && <p style={{ color: 'red', fontSize: 13 }}>{mensaje}</p>}
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="admin-main" style={{ flex: 1, padding: 24, maxWidth: 900, minWidth: 0 }}>
        <h1 style={{ marginTop: 0, marginBottom: 20 }}>
          {categoriaActiva ? categoriaActiva.nombre : 'Selecciona una materia'}
        </h1>

        {categoriaActiva && categoriaActiva.activa === false && (
          <div style={{
            background: '#fdeceb', border: '1px solid #e6a29c', color: '#7a1f14',
            padding: '10px 14px', borderRadius: 6, marginBottom: 20, fontSize: 14,
          }}>
            🔒 <strong>Materia deshabilitada.</strong> Todas sus lecturas y preguntas quedan fuera del
            examen de diagnóstico mientras esté así, aunque siguen guardadas. Habilítala en el menú
            lateral para volver a incluirla.
          </div>
        )}

        {categoriaActivaId && (
          <div style={{ opacity: categoriaActiva?.activa === false ? 0.5 : 1 }}>
            <section style={{ marginBottom: 32, padding: 16, border: '2px solid #4a90d9', borderRadius: 8 }}>
              <h2>Carga rápida de reactivos</h2>
              <p style={{ color: '#666', fontSize: 14 }}>
                Se agregarán a la materia <strong>{categoriaActiva?.nombre}</strong>. Opcionalmente
                asocia una lectura, indica cuántas preguntas y cuántas opciones cada una.
              </p>

              <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
                <label>
                  <input type="radio" checked={modoLectura === 'ninguna'} onChange={() => setModoLectura('ninguna')} /> Sin lectura
                </label>
                <label>
                  <input type="radio" checked={modoLectura === 'nueva'} onChange={() => setModoLectura('nueva')} /> Crear nueva lectura
                </label>
                <label>
                  <input type="radio" checked={modoLectura === 'continuar'} onChange={() => setModoLectura('continuar')} /> Agregar más preguntas a una lectura ya guardada
                </label>
              </div>

              {modoLectura === 'continuar' && (
                <div style={{ marginBottom: 12, padding: 10, background: '#fff8e6', border: '1px solid #f0d060', borderRadius: 6 }}>
                  <p style={{ fontSize: 13, color: '#6b5900', margin: '0 0 8px 0' }}>
                    Elige la lectura a la que quieres sumarle más preguntas. El texto de la lectura NO se
                    vuelve a crear, solo se agregan preguntas nuevas ligadas a ella.
                  </p>
                  <select
                    value={lecturaRapidaId}
                    onChange={(e) => setLecturaRapidaId(e.target.value)}
                    style={{ display: 'block', padding: 8, width: '100%' }}
                  >
                    <option value="">-- Selecciona la lectura --</option>
                    {lecturas.map((l) => (
                      <option key={l.id} value={l.id}>{l.titulo || `Lectura #${l.id}`}</option>
                    ))}
                  </select>
                </div>
              )}

              {modoLectura === 'nueva' && (
                <div style={{ marginBottom: 12, padding: 12, background: '#f7f9fc', borderRadius: 6 }}>
                  <input
                    placeholder="Título (ej. Chile se reinventa)"
                    value={lecturaInlineTitulo}
                    onChange={(e) => setLecturaInlineTitulo(e.target.value)}
                    style={{ display: 'block', marginBottom: 8, padding: 8, width: '100%', boxSizing: 'border-box' }}
                  />
                  <input
                    placeholder="Subtítulo (opcional, ej. El proceso constituyente representa...)"
                    value={lecturaInlineSubtitulo}
                    onChange={(e) => setLecturaInlineSubtitulo(e.target.value)}
                    style={{ display: 'block', marginBottom: 8, padding: 8, width: '100%', boxSizing: 'border-box' }}
                  />
                  <input
                    placeholder="URL de imagen (opcional, si el texto lleva una imagen o gráfica)"
                    value={lecturaInlineImagenUrl}
                    onChange={(e) => setLecturaInlineImagenUrl(e.target.value)}
                    style={{ display: 'block', marginBottom: 8, padding: 8, width: '100%', boxSizing: 'border-box' }}
                  />
                  <div style={{ background: '#fff' }}>
                    <ReactQuill theme="snow" value={lecturaInlineTexto} onChange={setLecturaInlineTexto} placeholder="Cuerpo del texto..." />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                <label>
                  Número de preguntas:{' '}
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={numPreguntas}
                    onChange={(e) => setNumPreguntas(parseInt(e.target.value, 10) || 1)}
                    style={{ width: 60, padding: 4 }}
                  />
                </label>
                <span>Tipo de opciones:</span>
                <button type="button" onClick={() => generarCamposRapidos(2)} style={btnStyle('secundario')}>2 opciones</button>
                <button type="button" onClick={() => generarCamposRapidos(3)} style={btnStyle('secundario')}>3 opciones</button>
                <button type="button" onClick={() => generarCamposRapidos(4)} style={btnStyle('secundario')}>4 opciones</button>
                <button type="button" onClick={() => generarCamposRapidos('vf')} style={btnStyle('secundario')}>Verdadero/Falso</button>
              </div>

              {preguntasRapidas.length > 0 && (
                <div>
                  {preguntasRapidas.map((p, idxP) => (
                    <div key={idxP} style={{ border: '1px solid #ddd', padding: 10, marginBottom: 8, borderRadius: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong>Pregunta {idxP + 1}</strong>
                        <button
                          type="button"
                          onClick={() => quitarPreguntaRapida(idxP)}
                          style={{ fontSize: 12, color: '#a00', border: 'none', background: 'transparent', cursor: 'pointer' }}
                        >
                          ✕ quitar
                        </button>
                      </div>
                      <textarea
                        value={p.pregunta}
                        onChange={(e) => actualizarPreguntaRapida(idxP, e.target.value)}
                        placeholder="Texto de la pregunta"
                        style={{ display: 'block', marginTop: 4, marginBottom: 6, padding: 8, width: '100%', minHeight: 90, boxSizing: 'border-box', fontSize: 14, lineHeight: 1.4 }}
                      />
                      <input
                        value={p.imagen_url || ''}
                        onChange={(e) => actualizarImagenPreguntaRapida(idxP, e.target.value)}
                        placeholder="URL de imagen para la pregunta (opcional, ej. gráfica o diagrama)"
                        style={{ display: 'block', marginBottom: 6, padding: 6, width: '100%', boxSizing: 'border-box', fontSize: 13 }}
                      />
                      {p.opciones.map((o, idxO) => (
                        <div key={idxO} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center' }}>
                          <input
                            type="radio"
                            name={`correcta-rapida-${idxP}`}
                            checked={o.es_correcta}
                            onChange={() => actualizarOpcionRapida(idxP, idxO, 'es_correcta', true)}
                          />
                          <input
                            value={o.texto}
                            onChange={(e) => actualizarOpcionRapida(idxP, idxO, 'texto', e.target.value)}
                            style={{ flex: 1, padding: 6 }}
                            placeholder={`Opción ${idxO + 1}`}
                          />
                          <input
                            value={o.imagen_url || ''}
                            onChange={(e) => actualizarOpcionRapida(idxP, idxO, 'imagen_url', e.target.value)}
                            style={{ flex: 1, padding: 6, fontSize: 12 }}
                            placeholder="URL imagen (opcional)"
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                  <button type="button" onClick={agregarPreguntaExtra} style={btnStyle('secundario', { marginBottom: 12 })}>
                    + Agregar otra pregunta
                  </button>
                  <br />
                  <button onClick={guardarTodasRapidas} disabled={guardandoRapido} style={btnStyle('primario', { padding: '10px 20px', opacity: guardandoRapido ? 0.6 : 1 })}>
                    {guardandoRapido ? 'Guardando...' : `Guardar las ${preguntasRapidas.length} preguntas`}
                  </button>
                  {mensajeRapido && <p style={{ color: 'red' }}>{mensajeRapido}</p>}
                </div>
              )}
            </section>

            <section>
              <h2>Reactivos de {categoriaActiva?.nombre} ({reactivos.length})</h2>
              <p style={{ color: '#666', fontSize: 13 }}>
                Agrupadas por lectura, en el orden en que se cargaron, para no mezclar preguntas de una
                lectura con las de otra.
              </p>
              {gruposReactivos.map((grupo) => {
                const abierto = !!gruposAbiertos[grupo.clave];
                return (
                <div key={grupo.clave} style={{ marginBottom: 20 }}>
                  <div
                    onClick={() => toggleGrupo(grupo.clave)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0f4fa', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', userSelect: 'none' }}
                  >
                    <h3 style={{ fontSize: 15, margin: 0, flex: 1, opacity: grupo.activa ? 1 : 0.5 }}>
                      <span style={{ display: 'inline-block', width: 16 }}>{abierto ? '▼' : '▶'}</span>
                      {grupo.titulo ? `📖 ${grupo.titulo}` : 'Sin lectura asociada'} — {grupo.items.length} pregunta(s)
                      {grupo.clave !== 'sin-lectura' && !grupo.activa && (
                        <span style={{ marginLeft: 8, fontSize: 11, color: '#c0392b', fontWeight: 'bold' }}>DESHABILITADA</span>
                      )}
                    </h3>
                    {grupo.clave !== 'sin-lectura' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleLecturaActiva(grupo.clave, grupo.activa); }}
                          title={grupo.activa ? 'Deshabilitar (no se usará en el examen)' : 'Habilitar'}
                          style={btnStyle('secundario', { fontSize: 12, padding: '4px 10px' })}
                        >
                          {grupo.activa ? '🔓 Habilitada' : '🔒 Deshabilitada'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); iniciarEdicionLectura(grupo.clave); }}
                          style={btnStyle('secundario', { fontSize: 12, padding: '4px 10px' })}
                        >
                          ✏️ Editar lectura
                        </button>
                      </div>
                    )}
                  </div>

                  {editandoLecturaId === grupo.clave && (
                    <div style={{ border: '1px solid #4a90d9', padding: 12, marginTop: 6, borderRadius: 6, background: '#f7f9fc' }}>
                      <input
                        placeholder="Título"
                        value={editLecturaTitulo}
                        onChange={(e) => setEditLecturaTitulo(e.target.value)}
                        style={{ display: 'block', marginBottom: 8, padding: 8, width: '100%', boxSizing: 'border-box' }}
                      />
                      <input
                        placeholder="Subtítulo (opcional)"
                        value={editLecturaSubtitulo}
                        onChange={(e) => setEditLecturaSubtitulo(e.target.value)}
                        style={{ display: 'block', marginBottom: 8, padding: 8, width: '100%', boxSizing: 'border-box' }}
                      />
                      <input
                        placeholder="URL de imagen (opcional)"
                        value={editLecturaImagenUrl}
                        onChange={(e) => setEditLecturaImagenUrl(e.target.value)}
                        style={{ display: 'block', marginBottom: 8, padding: 8, width: '100%', boxSizing: 'border-box' }}
                      />
                      <div style={{ marginBottom: 8, background: '#fff' }}>
                        <ReactQuill theme="snow" value={editLecturaTexto} onChange={setEditLecturaTexto} />
                      </div>
                      <button onClick={() => guardarEdicionLectura(grupo.clave)} style={btnStyle('primario', { marginRight: 8 })}>Guardar cambios</button>
                      <button onClick={cancelarEdicionLectura} style={btnStyle('secundario')}>Cancelar</button>
                    </div>
                  )}

                  {abierto && grupo.items.map((r) => (
                    <div key={r.id} style={{ border: '1px solid #eee', padding: 12, marginBottom: 8, borderRadius: 6 }}>
                      {editandoId === r.id ? (
                        <div>
                          <select
                            value={editLecturaId}
                            onChange={(e) => setEditLecturaId(e.target.value)}
                            style={{ display: 'block', marginBottom: 8, padding: 8, width: '100%' }}
                          >
                            <option value="">-- Sin lectura asociada --</option>
                            {lecturas.map((l) => (
                              <option key={l.id} value={l.id}>{l.titulo || `Lectura #${l.id}`}</option>
                            ))}
                          </select>
                          <textarea
                            value={editPregunta}
                            onChange={(e) => setEditPregunta(e.target.value)}
                            style={{ display: 'block', marginBottom: 8, padding: 8, width: '100%', minHeight: 90, boxSizing: 'border-box', fontSize: 14, lineHeight: 1.4 }}
                          />
                          {editOpciones.map((o, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center' }}>
                              <input
                                type="radio"
                                name={`correcta-edit-${r.id}`}
                                checked={o.es_correcta}
                                onChange={() => actualizarOpcionEdit(i, 'es_correcta', true)}
                              />
                              <input
                                value={o.texto}
                                onChange={(e) => actualizarOpcionEdit(i, 'texto', e.target.value)}
                                style={{ flex: 1, padding: 8 }}
                              />
                            </div>
                          ))}
                          <button onClick={() => guardarEdicion(r.id)} style={btnStyle('primario', { marginRight: 8 })}>Guardar cambios</button>
                          <button onClick={cancelarEdicion} style={btnStyle('secundario')}>Cancelar</button>
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              {r.pregunta}
                              {r.imagen_url && <div><em>Imagen: {r.imagen_url}</em></div>}
                              <ul>
                                {r.opciones.map((o) => (
                                  <li key={o.id} style={{ color: o.es_correcta ? 'green' : 'inherit' }}>
                                    {o.texto} {o.imagen_url && `[img: ${o.imagen_url}]`} {o.es_correcta && '✓'}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                              <button
                                onClick={() => iniciarEdicion(r)}
                                title="Editar"
                                style={{ border: 'none', background: '#eef1f5', cursor: 'pointer', fontSize: 15, borderRadius: 6, width: 30, height: 30 }}
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => borrarReactivo(r.id)}
                                title="Borrar"
                                style={{ border: 'none', background: '#fdeceb', cursor: 'pointer', fontSize: 15, borderRadius: 6, width: 30, height: 30 }}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );})}
              {reactivos.length === 0 && <p style={{ color: '#888' }}>Aún no hay reactivos en esta materia.</p>}
            </section>
          </div>
        )}
      </main>

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            padding: '12px 20px',
            borderRadius: 8,
            color: '#fff',
            background: toast.tipo === 'error' ? '#c0392b' : '#2e7d32',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            fontSize: 14,
            maxWidth: 360,
            zIndex: 1000,
          }}
        >
          {toast.texto}
        </div>
      )}
    </div>
  );
}
