import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DonaResultado from '../../components/DonaResultado';
import { renderizarExponentes } from '../../lib/formato';
const { estaAutenticado } = require('../../lib/auth');

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

// Toolbar reducida para el enunciado de las preguntas: negritas, cursiva,
// subrayado, resaltado tipo marcador (fondo amarillo), y exponente/subíndice
// (necesario para matemáticas: (4a+6b)³, x², H₂O, etc.). Quill no trae
// "highlight" por defecto, así que se habilita vía el formato "background".
const quillPreguntaModules = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ background: ['#fff2a8', false] }],
    [{ script: 'super' }, { script: 'sub' }],
    ['clean'],
  ],
};
const quillPreguntaFormats = ['bold', 'italic', 'underline', 'background', 'script'];

export async function getServerSideProps({ req }) {
  if (!estaAutenticado(req)) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
  return { props: {} };
}


export default function AdminPage() {
  const router = useRouter();
  const [categorias, setCategorias] = useState([]);
  const [reactivos, setReactivos] = useState([]);
  const [lecturas, setLecturas] = useState([]);
  const [nuevaCategoria, setNuevaCategoria] = useState('');

  // Categoría activa en el menú lateral (reemplaza al filtro suelto de antes)
  const [categoriaActivaId, setCategoriaActivaId] = useState(null);

  // Vista general del panel: 'asignaturas' (banco de reactivos) o 'alumnos' (resultados)
  const [vistaGeneral, setVistaGeneral] = useState('asignaturas');
  const [resultadosResumen, setResultadosResumen] = useState(null);
  const [busquedaAlumno, setBusquedaAlumno] = useState('');
  const [filtroFechaAlumno, setFiltroFechaAlumno] = useState('');
  const [paginaAlumnos, setPaginaAlumnos] = useState(1);
  const ALUMNOS_POR_PAGINA = 20;
  const [alumnoSeleccionadoId, setAlumnoSeleccionadoId] = useState(null);
  const [detalleAlumno, setDetalleAlumno] = useState(null);
  const [mostrandoFicha, setMostrandoFicha] = useState(false);
  const [fichaInput, setFichaInput] = useState({});
  const [editandoPerfilAlumno, setEditandoPerfilAlumno] = useState(false);
  const [perfilInput, setPerfilInput] = useState({});
  const [menuOpcionesAbierto, setMenuOpcionesAbierto] = useState(false);
  const [cargandoAlumnos, setCargandoAlumnos] = useState(false);

  // Usuarios administradores del panel
  const [usuariosAdmin, setUsuariosAdmin] = useState(null);
  const [nuevoAdminNombre, setNuevoAdminNombre] = useState('');
  const [nuevoAdminEmail, setNuevoAdminEmail] = useState('');
  const [nuevoAdminPassword, setNuevoAdminPassword] = useState('');
  const [mensajeUsuarios, setMensajeUsuarios] = useState('');

  async function cargarUsuariosAdmin() {
    const res = await fetch('/api/admin/usuarios');
    setUsuariosAdmin(await res.json());
  }

  async function crearUsuarioAdmin(e) {
    e.preventDefault();
    setMensajeUsuarios('');
    const res = await fetch('/api/admin/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nuevoAdminNombre, email: nuevoAdminEmail, password: nuevoAdminPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMensajeUsuarios(data.error);
      return;
    }
    setNuevoAdminNombre('');
    setNuevoAdminEmail('');
    setNuevoAdminPassword('');
    cargarUsuariosAdmin();
    mostrarToast('Administrador agregado', 'exito');
  }

  function borrarUsuarioAdmin(u) {
    pedirConfirmacion(`¿Eliminar el acceso de "${u.nombre}"?`, async () => {
      const res = await fetch(`/api/admin/usuarios/${u.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        mostrarToast(data.error, 'error');
        return;
      }
      cargarUsuariosAdmin();
      mostrarToast('Administrador eliminado', 'exito');
    });
  }
  const [umbralAprobacion, setUmbralAprobacion] = useState(60);
  const [editandoUmbral, setEditandoUmbral] = useState(false);
  const [umbralInput, setUmbralInput] = useState(60);
  const [tiempoLimiteMinutos, setTiempoLimiteMinutos] = useState(120);
  const [editandoTiempo, setEditandoTiempo] = useState(false);
  const [tiempoInput, setTiempoInput] = useState(120);
  const [intentosPermitidos, setIntentosPermitidos] = useState(0);
  const [editandoIntentos, setEditandoIntentos] = useState(false);
  const [intentosInput, setIntentosInput] = useState(0);
  const [instrucciones, setInstrucciones] = useState('');
  const [editandoInstrucciones, setEditandoInstrucciones] = useState(false);
  const [instruccionesInput, setInstruccionesInput] = useState('');

  async function cargarUmbral() {
    const res = await fetch('/api/admin/configuracion');
    const data = await res.json();
    setUmbralAprobacion(data.umbral_aprobacion);
    setUmbralInput(data.umbral_aprobacion);
    setTiempoLimiteMinutos(data.tiempo_limite_minutos);
    setTiempoInput(data.tiempo_limite_minutos);
    setIntentosPermitidos(data.intentos_permitidos ?? 0);
    setIntentosInput(data.intentos_permitidos ?? 0);
    setInstrucciones(data.instrucciones || '');
    setInstruccionesInput(data.instrucciones || '');
  }

  async function guardarUmbral() {
    const res = await fetch('/api/admin/configuracion', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ umbralAprobacion: umbralInput }),
    });
    if (!res.ok) {
      const data = await res.json();
      mostrarToast(data.error, 'error');
      return;
    }
    setUmbralAprobacion(umbralInput);
    setEditandoUmbral(false);
    mostrarToast('Umbral de aprobación actualizado', 'exito');
  }

  async function guardarTiempo() {
    const res = await fetch('/api/admin/configuracion', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tiempoLimiteMinutos: tiempoInput }),
    });
    if (!res.ok) {
      const data = await res.json();
      mostrarToast(data.error, 'error');
      return;
    }
    setTiempoLimiteMinutos(tiempoInput);
    setEditandoTiempo(false);
    mostrarToast('Tiempo del examen actualizado (aplica a exámenes nuevos)', 'exito');
  }

  async function guardarIntentos() {
    const res = await fetch('/api/admin/configuracion', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intentosPermitidos: intentosInput }),
    });
    if (!res.ok) {
      const data = await res.json();
      mostrarToast(data.error, 'error');
      return;
    }
    setIntentosPermitidos(intentosInput);
    setEditandoIntentos(false);
    mostrarToast('Límite de intentos actualizado', 'exito');
  }

  async function guardarInstrucciones() {
    const res = await fetch('/api/admin/configuracion', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instrucciones: instruccionesInput }),
    });
    if (!res.ok) {
      const data = await res.json();
      mostrarToast(data.error, 'error');
      return;
    }
    setInstrucciones(instruccionesInput);
    setEditandoInstrucciones(false);
    mostrarToast('Instrucciones del examen actualizadas', 'exito');
  }

  async function cargarResumenAlumnos() {
    setCargandoAlumnos(true);
    const res = await fetch('/api/admin/resultados');
    const data = await res.json();
    setResultadosResumen(data);
    setCargandoAlumnos(false);
  }

  async function verDetalleAlumno(id) {
    setAlumnoSeleccionadoId(id);
    setDetalleAlumno(null);
    setMostrandoFicha(false);
    setEditandoPerfilAlumno(false);
    setMenuOpcionesAbierto(false);
    const res = await fetch(`/api/admin/alumnos/${id}`);
    const data = await res.json();
    setDetalleAlumno(data);
    setFichaInput(data.alumno.ficha_registro || {});
    setPerfilInput({
      nombre: data.alumno.nombre,
      email: data.alumno.email,
      telefono: data.alumno.telefono || '',
      preparatoria_procedencia: data.alumno.preparatoria_procedencia || '',
    });
  }

  async function guardarPerfilAlumno() {
    const res = await fetch(`/api/admin/alumnos/${detalleAlumno.alumno.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(perfilInput),
    });
    const data = await res.json();
    if (!res.ok) {
      mostrarToast(data.error, 'error');
      return;
    }
    mostrarToast('Perfil actualizado ✓', 'exito');
    setEditandoPerfilAlumno(false);
    verDetalleAlumno(detalleAlumno.alumno.id);
  }

  function actualizarCampoFicha(campo, valor) {
    setFichaInput((prev) => ({ ...prev, [campo]: valor }));
  }

  function actualizarPuntajeArea(categoria, valor) {
    setFichaInput((prev) => ({
      ...prev,
      puntajesPorArea: { ...(prev.puntajesPorArea || {}), [categoria]: valor },
    }));
  }

  async function guardarFicha() {
    const res = await fetch(`/api/admin/alumnos/${detalleAlumno.alumno.id}/ficha`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ficha_registro: fichaInput }),
    });
    if (!res.ok) {
      const data = await res.json();
      mostrarToast(data.error, 'error');
      return;
    }
    mostrarToast('Ficha guardada ✓', 'exito');
  }

  function borrarHistorialAlumno(id, nombre) {
    pedirConfirmacion(
      `¿Borrar TODO el historial de exámenes de "${nombre}"? La cuenta del alumno se conserva (puede volver a presentar), pero esta acción no se puede deshacer.`,
      async () => {
        const res = await fetch(`/api/admin/alumnos/${id}?soloHistorial=1`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json();
          mostrarToast(data.error, 'error');
          return;
        }
        mostrarToast('Historial borrado ✓', 'exito');
        verDetalleAlumno(id);
        cargarResumenAlumnos();
      }
    );
  }

  function borrarAlumnoCompleto(id, nombre) {
    pedirConfirmacion(
      `¿Borrar por completo la cuenta de "${nombre}" junto con todo su historial? Esta acción no se puede deshacer.`,
      async () => {
        const res = await fetch(`/api/admin/alumnos/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json();
          mostrarToast(data.error, 'error');
          return;
        }
        mostrarToast('Alumno borrado ✓', 'exito');
        setDetalleAlumno(null);
        setAlumnoSeleccionadoId(null);
        cargarResumenAlumnos();
      }
    );
  }

  function exportarCSV() {
    if (!resultadosResumen) return;
    const encabezados = ['Nombre', 'Correo', 'Intentos', 'Correctas', 'Total', 'Porcentaje', 'Fecha de último intento'];
    const filas = resultadosResumen.alumnos.map((a) => [
      a.nombre, a.email, a.intentos, a.correctas, a.total, `${a.porcentaje}%`,
      a.finalizadoEn ? new Date(a.finalizadoEn).toLocaleDateString('es-MX') : '',
    ]);
    const csv = [encabezados, ...filas]
      .map((fila) => fila.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultados_diagnostico_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const [mensaje, setMensaje] = useState('');

  // Carga rápida: generar N preguntas de una lectura de golpe
  const [lecturaRapidaId, setLecturaRapidaId] = useState('');
  const [numPreguntas, setNumPreguntas] = useState(5);
  const [preguntasRapidas, setPreguntasRapidas] = useState([]);
  const [mensajeRapido, setMensajeRapido] = useState('');

  // Insertar pregunta(s) en una posición específica (ej. se brincaron la 16 y
  // ya capturaron la 17): guarda entre qué dos "orden" existentes debe caer
  // lo que se agregue en Carga rápida, en vez de irse siempre al final.
  const [insertarInfo, setInsertarInfo] = useState(null); // { ordenAntes, ordenDespues, numeroRef }
  const cargaRapidaRef = useRef(null);

  function iniciarInsercionDespuesDe(r, idxEnLista) {
    const siguiente = reactivos[idxEnLista + 1];
    // Si el siguiente reactivo pertenece a otra lectura (o no hay siguiente),
    // no hay límite superior: se inserta después de r con margen libre.
    const mismoContexto = siguiente && (siguiente.lectura_id || null) === (r.lectura_id || null);
    setInsertarInfo({
      ordenAntes: parseFloat(r.orden),
      ordenDespues: mismoContexto ? parseFloat(siguiente.orden) : null,
      numeroRef: r.numero,
    });
    if (r.lectura_id) {
      setModoLectura('continuar');
      setLecturaRapidaId(r.lectura_id);
    } else {
      setModoLectura('ninguna');
      setLecturaRapidaId('');
    }
    setPreguntasRapidas([]);
    cargaRapidaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function cancelarInsercion() {
    setInsertarInfo(null);
  }

  // Reparte `cantidad` valores de "orden" dentro del hueco (ordenAntes, ordenDespues),
  // en orden, sin necesidad de tocar el orden de ninguna otra pregunta ya guardada.
  function calcularOrdenesInsercion(cantidad, ordenAntes, ordenDespues) {
    const base = ordenAntes ?? 0;
    const techo = ordenDespues ?? base + cantidad + 1;
    const paso = (techo - base) / (cantidad + 1);
    return Array.from({ length: cantidad }, (_, i) => base + paso * (i + 1));
  }

  // Toast: mensaje flotante que reemplaza a los alert() nativos del navegador
  const [toast, setToast] = useState(null); // { texto, tipo: 'exito' | 'error' }
  function mostrarToast(texto, tipo = 'exito') {
    setToast({ texto, tipo });
    setTimeout(() => setToast(null), 3500);
  }

  // Sube un archivo de imagen a /api/admin/subir-imagen y devuelve la URL
  // final (/uploads/archivo.jpg) para meterla directo en un campo de imagen.
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  async function subirImagen(archivo, onListo) {
    setSubiendoImagen(true);
    try {
      const formData = new FormData();
      formData.append('imagen', archivo);
      const res = await fetch('/api/admin/subir-imagen', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        mostrarToast(data.error, 'error');
        return;
      }
      onListo(data.url);
      mostrarToast('Imagen subida ✓', 'exito');
    } catch (e) {
      mostrarToast('No se pudo subir la imagen — revisa tu conexión', 'error');
    } finally {
      setSubiendoImagen(false);
    }
  }

  // Botón "📷 Subir" reutilizable: input de archivo oculto + botón visible.
  // onSubida recibe la URL final para meterla en el campo correspondiente.
  function BotonSubirImagen({ onSubida }) {
    const inputRef = useRef(null);
    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            if (archivo) subirImagen(archivo, onSubida);
            e.target.value = ''; // permite volver a elegir el mismo archivo después
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={subiendoImagen}
          title="Subir imagen desde tu computadora"
          style={{ border: '1px solid #ddd', background: '#f7f8fa', cursor: subiendoImagen ? 'wait' : 'pointer', borderRadius: 6, padding: '0 10px', fontSize: 13, flexShrink: 0 }}
        >
          {subiendoImagen ? '⏳' : '📷'}
        </button>
      </>
    );
  }

  // Modal de confirmación: reemplaza al confirm() nativo del navegador
  const [confirmacion, setConfirmacion] = useState(null); // { mensaje, onConfirmar }
  function pedirConfirmacion(mensaje, onConfirmar) {
    setConfirmacion({ mensaje, onConfirmar });
  }

  async function cerrarSesionAdmin() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
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
  const [editImagenUrl, setEditImagenUrl] = useState('');
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
  const [editLecturaInstruccion, setEditLecturaInstruccion] = useState('');


  // Lectura inline dentro de "Carga rápida de reactivos"
  const [modoLectura, setModoLectura] = useState('ninguna'); // 'ninguna' | 'existente' | 'nueva'
  const [lecturaInlineTitulo, setLecturaInlineTitulo] = useState('');
  const [lecturaInlineSubtitulo, setLecturaInlineSubtitulo] = useState('');
  const [lecturaInlineTexto, setLecturaInlineTexto] = useState('');
  const [lecturaInlineImagenUrl, setLecturaInlineImagenUrl] = useState('');
  const [lecturaInlineInstruccion, setLecturaInlineInstruccion] = useState('');

  // Recordar en qué materia / pestaña / edición en curso se quedó el admin,
  // para restaurarlo si la página se refresca (F5, o pierde la sesión de red un momento).
  const LS_KEY_ESTADO = 'montebello_admin_estado';
  const [hidratado, setHidratado] = useState(false);

  async function cargarCategorias() {
    const res = await fetch('/api/admin/categorias');
    const data = await res.json();
    setCategorias(data);
    // Si ya hay una categoría seleccionada (por navegación normal o restaurada
    // tras un refresh), no la pisamos. Si no hay ninguna, arrancamos en la
    // primera categoría RAÍZ (materia principal, ej. "Español"), no en la
    // primera fila de la tabla que podría ser una subcategoría cualquiera
    // (ej. "Redacción indirecta") según el orden en que se haya creado.
    setCategoriaActivaId((prev) => {
      if (prev) return prev;
      const raiz = data.filter((c) => !c.categoria_padre_id);
      return (raiz[0] || data[0])?.id ?? null;
    });
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

  // Al montar: restauramos primero lo que había guardado del refresh anterior
  // (materia activa, pestaña, y si estabas editando algo, el borrador tal cual
  // lo dejaste sin guardar), y luego cargamos categorías/lecturas normalmente.
  useEffect(() => {
    try {
      const guardadoRaw = window.localStorage.getItem(LS_KEY_ESTADO);
      if (guardadoRaw) {
        const g = JSON.parse(guardadoRaw);
        if (g.categoriaActivaId) setCategoriaActivaId(g.categoriaActivaId);
        if (g.vistaGeneral) setVistaGeneral(g.vistaGeneral);
        if (g.editandoId) {
          setEditandoId(g.editandoId);
          setEditPregunta(g.editPregunta || '');
          setEditImagenUrl(g.editImagenUrl || '');
          setEditLecturaId(g.editLecturaId || '');
          setEditOpciones(g.editOpciones || []);
        }
        if (g.editandoLecturaId) {
          setEditandoLecturaId(g.editandoLecturaId);
          setEditLecturaTitulo(g.editLecturaTitulo || '');
          setEditLecturaSubtitulo(g.editLecturaSubtitulo || '');
          setEditLecturaTexto(g.editLecturaTexto || '');
          setEditLecturaImagenUrl(g.editLecturaImagenUrl || '');
          setEditLecturaInstruccion(g.editLecturaInstruccion || '');
        }
      }
    } catch (e) {
      // localStorage corrupto o inaccesible: seguimos normal, sin restaurar nada
    }
    setHidratado(true);
    cargarCategorias();
    cargarLecturas();
  }, []);

  // Si estábamos editando una pregunta y esa pregunta vive dentro de un grupo
  // (lectura) plegado, lo desplegamos para que el formulario de edición
  // restaurado sea visible en lugar de quedar oculto en el acordeón.
  useEffect(() => {
    if (!editandoId || reactivos.length === 0) return;
    const r = reactivos.find((x) => x.id === editandoId);
    if (r) {
      const clave = r.lectura_id || 'sin-lectura';
      setGruposAbiertos((prev) => (prev[clave] ? prev : { ...prev, [clave]: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reactivos]);

  // Guardamos en localStorage el "dónde estabas parado" cada vez que cambia,
  // para poder restaurarlo si la página se recarga.
  useEffect(() => {
    if (!hidratado) return; // evita pisar lo guardado antes de terminar de restaurarlo
    try {
      window.localStorage.setItem(
        LS_KEY_ESTADO,
        JSON.stringify({
          categoriaActivaId,
          vistaGeneral,
          editandoId,
          editPregunta,
          editImagenUrl,
          editLecturaId,
          editOpciones,
          editandoLecturaId,
          editLecturaTitulo,
          editLecturaSubtitulo,
          editLecturaTexto,
          editLecturaImagenUrl,
          editLecturaInstruccion,
        })
      );
    } catch (e) {
      // si el navegador bloquea localStorage (modo privado, etc.), simplemente no persistimos
    }
  }, [
    hidratado,
    categoriaActivaId,
    vistaGeneral,
    editandoId,
    editPregunta,
    editImagenUrl,
    editLecturaId,
    editOpciones,
    editandoLecturaId,
    editLecturaTitulo,
    editLecturaSubtitulo,
    editLecturaTexto,
    editLecturaImagenUrl,
    editLecturaInstruccion,
  ]);

  useEffect(() => {
    if (categoriaActivaId) {
      cargarReactivos(categoriaActivaId);
      // al cambiar de categoría, limpiamos la carga rápida en curso
      setPreguntasRapidas([]);
      setLecturaRapidaId('');
    }
  }, [categoriaActivaId]);

  useEffect(() => {
    if (vistaGeneral === 'alumnos') {
      if (!resultadosResumen) cargarResumenAlumnos();
      cargarUmbral();
    }
    if (vistaGeneral === 'usuarios' && !usuariosAdmin) {
      cargarUsuariosAdmin();
    }
  }, [vistaGeneral]);

  const [nuevaCategoriaPadreId, setNuevaCategoriaPadreId] = useState('');
  const [nuevaCategoriaCodigo, setNuevaCategoriaCodigo] = useState('');

  async function crearCategoria(e) {
    e.preventDefault();
    setMensaje('');
    const res = await fetch('/api/admin/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: nuevaCategoria,
        categoria_padre_id: nuevaCategoriaPadreId || null,
        codigo: nuevaCategoriaCodigo || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMensaje(data.error);
      return;
    }
    setNuevaCategoria('');
    setNuevaCategoriaPadreId('');
    setNuevaCategoriaCodigo('');
    cargarCategorias();
    setCategoriaActivaId(data.id);
  }

  const [editandoMateriaId, setEditandoMateriaId] = useState(null);
  const [agregandoSubPara, setAgregandoSubPara] = useState(null); // id de la materia padre, o null
  const [nuevaSubNombre, setNuevaSubNombre] = useState('');

  async function crearSubcategoriaRapida(padreId) {
    if (!nuevaSubNombre.trim()) return;
    const res = await fetch('/api/admin/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nuevaSubNombre, categoria_padre_id: padreId }),
    });
    const data = await res.json();
    if (!res.ok) {
      mostrarToast(data.error, 'error');
      return;
    }
    setNuevaSubNombre('');
    setAgregandoSubPara(null);
    cargarCategorias();
    setCategoriaActivaId(data.id);
  }
  const [editMateriaNombre, setEditMateriaNombre] = useState('');
  const [editMateriaCodigo, setEditMateriaCodigo] = useState('');

  function iniciarEdicionMateria(c) {
    setEditandoMateriaId(c.id);
    setEditMateriaNombre(c.nombre);
    setEditMateriaCodigo(c.codigo || '');
  }

  async function guardarNombreMateria(id) {
    const res = await fetch(`/api/admin/categorias/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: editMateriaNombre, codigo: editMateriaCodigo }),
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

  async function borrarMateria(c) {
    pedirConfirmacion(`¿Borrar "${c.nombre}"? Solo se puede si no tiene preguntas cargadas.`, async () => {
      const res = await fetch(`/api/admin/categorias/${c.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        mostrarToast(data.error, 'error');
        return;
      }
      if (categoriaActivaId === c.id) setCategoriaActivaId(null);
      cargarCategorias();
      mostrarToast(`"${c.nombre}" eliminada`, 'exito');
    });
  }

  async function actualizarCantidadExamen(c, valor) {
    const n = parseInt(valor, 10) || 0;
    await fetch(`/api/admin/categorias/${c.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cantidad_examen: n }),
    });
    cargarCategorias();
  }

  // Drag & drop para reordenar materias en el menú lateral (arrastrar en vez de escribir números).
  // `scope` agrupa qué se puede reordenar entre sí: 'top' para materias de primer nivel,
  // o el id de la materia padre para reordenar sus subcategorías entre ellas.
  const [arrastrando, setArrastrando] = useState(null); // { id, scope }

  async function soltarSobre(listaScope, idDestino) {
    if (!arrastrando || arrastrando.scope !== listaScope || arrastrando.id === idDestino) {
      setArrastrando(null);
      return;
    }
    const lista = listaScope === 'top'
      ? categorias.filter((c) => !c.categoria_padre_id)
      : categorias.filter((c) => c.categoria_padre_id === listaScope);

    const ordenActual = [...lista].sort((a, b) => (a.orden ?? a.id) - (b.orden ?? b.id));
    const idxOrigen = ordenActual.findIndex((c) => c.id === arrastrando.id);
    const idxDestino = ordenActual.findIndex((c) => c.id === idDestino);
    if (idxOrigen === -1 || idxDestino === -1) {
      setArrastrando(null);
      return;
    }

    const reordenado = [...ordenActual];
    const [movido] = reordenado.splice(idxOrigen, 1);
    reordenado.splice(idxDestino, 0, movido);

    // Guarda el nuevo orden secuencial (de 10 en 10, deja espacio por si luego se quiere insertar entre dos)
    await Promise.all(
      reordenado.map((c, i) =>
        fetch(`/api/admin/categorias/${c.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orden: (i + 1) * 10 }),
        })
      )
    );
    setArrastrando(null);
    cargarCategorias();
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
    pedirConfirmacion('¿Borrar esta lectura?', async () => {
      const res = await fetch(`/api/admin/lecturas/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        mostrarToast(data.error, 'error');
        return;
      }
      cargarLecturas();
    });
  }

  function iniciarEdicionLectura(lecturaId) {
    const l = lecturas.find((x) => x.id === lecturaId);
    if (!l) return;
    setEditandoLecturaId(lecturaId);
    setEditLecturaTitulo(l.titulo || '');
    setEditLecturaSubtitulo(l.subtitulo || '');
    setEditLecturaTexto(l.texto || '');
    setEditLecturaImagenUrl(l.imagen_url || '');
    setEditLecturaInstruccion(l.instruccion || '');
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
        instruccion: editLecturaInstruccion,
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
    pedirConfirmacion('¿Borrar este reactivo?', async () => {
      await fetch(`/api/admin/reactivos/${id}`, { method: 'DELETE' });
      cargarReactivos(categoriaActivaId);
    });
  }

  function iniciarEdicion(r) {
    setEditandoId(r.id);
    setEditPregunta(r.pregunta);
    setEditImagenUrl(r.imagen_url || '');
    setEditLecturaId(r.lectura_id || '');
    setEditOpciones(r.opciones.map((o) => ({ texto: o.texto, es_correcta: o.es_correcta, imagen_url: o.imagen_url || '' })));
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
        imagen_url: editImagenUrl || null,
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
            instruccion: lecturaInlineInstruccion,
          }),
        });
        const dataLectura = await resLectura.json();
        if (!resLectura.ok) throw new Error(dataLectura.error);
        lecturaIdUsar = dataLectura.id;
        await cargarLecturas();
      }

      const ordenesAsignados = insertarInfo
        ? calcularOrdenesInsercion(preguntasRapidas.length, insertarInfo.ordenAntes, insertarInfo.ordenDespues)
        : null;

      for (let i = 0; i < preguntasRapidas.length; i++) {
        const p = preguntasRapidas[i];
        const res = await fetch('/api/admin/reactivos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoria_id: categoriaActivaId,
            pregunta: p.pregunta,
            imagen_url: p.imagen_url || null,
            lectura_id: lecturaIdUsar || null,
            opciones: p.opciones,
            orden: ordenesAsignados ? ordenesAsignados[i] : undefined,
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
      setLecturaInlineInstruccion('');
      setInsertarInfo(null);
      cargarReactivos(categoriaActivaId);
      mostrarToast(
        insertarInfo
          ? `Pregunta(s) insertada(s) después de la ${insertarInfo.numeroRef} ✓`
          : 'Todas las preguntas se guardaron correctamente ✓',
        'exito'
      );
    } catch (e) {
      setMensajeRapido('Error al guardar: ' + e.message + ' (revisa qué ya se guardó abajo en la lista de reactivos)');
    } finally {
      setGuardandoRapido(false);
    }
  }

  const categoriaActiva = categorias.find((c) => c.id === categoriaActivaId);
  const categoriaPadreActiva = categoriaActiva?.categoria_padre_id
    ? categorias.find((c) => c.id === categoriaActiva.categoria_padre_id)
    : null;

  // Agrupa reactivos por lectura (manteniendo el orden en que aparecen), para no
  // mezclar en la vista preguntas de lecturas distintas ni las sueltas sin lectura.
  function agruparPorLectura(lista) {
    const grupos = [];
    const indiceGrupo = {};
    lista.forEach((r, i) => {
      // Numeración continua para toda la materia (no reinicia en cada lectura),
      // en el mismo orden en que se fueron capturando — así el número que ves
      // aquí coincide con el de "Pregunta N" en Carga rápida y te sirve para
      // ubicar rápido un error que te reporten (ej. "la 26 está mal").
      const rNum = { ...r, numero: i + 1 };
      const clave = r.lectura_id || 'sin-lectura';
      if (!(clave in indiceGrupo)) {
        indiceGrupo[clave] = grupos.length;
        grupos.push({ clave, titulo: r.lectura_titulo || null, activa: r.lectura_activa !== false, items: [] });
      }
      grupos[indiceGrupo[clave]].items.push(rNum);
    });
    return grupos;
  }
  const gruposReactivos = agruparPorLectura(reactivos);
  const [gruposAbiertos, setGruposAbiertos] = useState({});
  function toggleGrupo(clave) {
    setGruposAbiertos((prev) => ({ ...prev, [clave]: !prev[clave] }));
    // Si al plegar/desplegar el grupo hay un formulario de "Editar lectura" abierto
    // para esta misma lectura, lo cerramos también, sin pedir Guardar/Cancelar primero.
    if (editandoLecturaId === clave) {
      setEditandoLecturaId(null);
    }
  }

  function renderMateriaItem(c) {
    return (
      <>
        {editandoMateriaId === c.id ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                value={editMateriaNombre}
                onChange={(e) => setEditMateriaNombre(e.target.value)}
                style={{ flex: 1, minWidth: 0, padding: 4, fontSize: 13, boxSizing: 'border-box' }}
                autoFocus
              />
              <button onClick={() => guardarNombreMateria(c.id)} title="Guardar" style={{ fontSize: 13, width: 26, height: 26, flexShrink: 0, padding: 0 }}>✓</button>
              <button onClick={() => setEditandoMateriaId(null)} title="Cancelar" style={{ fontSize: 13, width: 26, height: 26, flexShrink: 0, padding: 0 }}>✕</button>
            </div>
            <input
              value={editMateriaCodigo}
              onChange={(e) => setEditMateriaCodigo(e.target.value)}
              placeholder="Código CENEVAL (opcional)"
              style={{ padding: 4, fontSize: 12 }}
            />
          </div>
        ) : (
          <div className="fila-materia" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
            <button
              onClick={() => setCategoriaActivaId(c.id)}
              style={{
                display: 'block',
                flex: 1,
                minWidth: 0,
                textAlign: 'left',
                padding: '8px 10px',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                background: c.id === categoriaActivaId ? '#4a90d9' : 'transparent',
                color: c.id === categoriaActivaId ? '#fff' : c.activa === false ? '#aaa' : '#333',
                fontWeight: c.id === categoriaActivaId ? 'bold' : 'normal',
                fontStyle: c.activa === false ? 'italic' : 'normal',
                fontSize: 14,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {c.nombre} {c.codigo && <span style={{ fontSize: 11, opacity: 0.7 }}>({c.codigo})</span>} {c.activa === false && '(deshabilitada)'}
            </button>
            <div className="iconos-materia" style={{ display: 'flex', flexShrink: 0, marginLeft: 'auto' }}>
              <button
                onClick={() => iniciarEdicionMateria(c)}
                title="Renombrar"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, padding: '4px 6px' }}
              >
                ✏️
              </button>
              <button
                onClick={() => toggleMateriaActiva(c)}
                title={c.activa === false ? 'Habilitar' : 'Deshabilitar'}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, padding: '4px 6px' }}
              >
                {c.activa === false ? '🔒' : '🔓'}
              </button>
              <button
                onClick={() => borrarMateria(c)}
                title="Borrar (solo si no tiene preguntas)"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, padding: '4px 6px' }}
              >
                🗑️
              </button>
            </div>
          </div>
        )}
        {editandoMateriaId !== c.id && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 10, marginTop: 6 }}>
            <span
              style={{ fontSize: 11, color: '#888', cursor: 'help' }}
              title="Cuántas preguntas de esta materia se incluyen al azar en el examen de diagnóstico"
            >
              En examen: ⓘ
            </span>
            <input
              type="number"
              min="0"
              defaultValue={c.cantidad_examen || 0}
              onBlur={(e) => actualizarCantidadExamen(c, e.target.value)}
              title="Cuántas preguntas de esta materia se incluyen al azar en el examen"
              style={{ width: 44, fontSize: 11, padding: 3 }}
            />
          </div>
        )}
      </>
    );
  }


  return (
    <div className="admin-root" style={{ minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @media (max-width: 768px) {
          .admin-body { flex-direction: column !important; }
          .admin-sidebar {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid #ddd;
          }
          .admin-main { max-width: 100% !important; padding: 16px !important; }
        }
        .fila-materia .iconos-materia {
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .fila-materia:hover .iconos-materia {
          opacity: 1;
        }
        /* En pantallas táctiles (sin hover real) los iconos se quedan siempre visibles */
        @media (hover: none) {
          .fila-materia .iconos-materia {
            opacity: 1;
          }
        }
        @page { size: letter; margin: 15mm; }
        @media print {
          .ocultar-al-imprimir { display: none !important; }
          .barra-superior-admin { display: none !important; }
          .solo-impresion { display: block !important; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          /* La Ficha de Registro imprime en tamaño carta, con el mismo look
             del PDF oficial: marco azul marino, sin sombra de tarjeta, y el
             pie de contacto del instituto que solo se ve al imprimir.
             Ya cabe en 1 sola página con margen de sobra (confirmado), así
             que se agranda un poco respecto al primer intento (que había
             quedado demasiado apretado) sin volver a desbordar. */
          .ficha-registro {
            max-width: none !important;
            border: 3px solid #0d3b66 !important;
            border-radius: 4px !important;
            box-shadow: none !important;
            padding: 22px !important;
            font-size: 13px !important;
            line-height: 1.4 !important;
          }
          .ficha-registro table { font-size: 13px !important; }
          .ficha-registro td, .ficha-registro th { padding: 6px 8px !important; }
          .ficha-registro > div { margin-bottom: 10px !important; }
          .ficha-registro p { margin: 4px 0 !important; }
          .ficha-registro label { font-size: 11px !important; }
          .ficha-registro input {
            border: none !important;
            border-bottom: 1px solid #999 !important;
            border-radius: 0 !important;
            padding: 2px 0 !important;
            font-size: 13px !important;
          }
          /* Pie de contacto: se deja envolver en 2 líneas si hace falta
             (ya hay espacio de sobra en la página), en vez de forzar 1 sola
             línea con overflow:hidden — eso era lo que recortaba el texto
             de Facebook/sitio web en los extremos. */
          .ficha-footer-contacto {
            flex-wrap: wrap !important;
            gap: 6px 16px !important;
            font-size: 10px !important;
            padding: 10px 16px !important;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* BARRA SUPERIOR: cambia entre Asignaturas y Alumnos, un solo panel, sin roles separados */}
      <div className="barra-superior-admin ocultar-al-imprimir" style={{ display: 'flex', gap: 8, padding: '12px 16px', borderBottom: '1px solid #ddd', background: '#fafbfc', flexWrap: 'wrap' }}>
        <button
          onClick={() => setVistaGeneral('asignaturas')}
          style={btnStyle(vistaGeneral === 'asignaturas' ? 'primario' : 'secundario', { fontSize: 14 })}
        >
          📚 Asignaturas
        </button>
        <button
          onClick={() => setVistaGeneral('alumnos')}
          style={btnStyle(vistaGeneral === 'alumnos' ? 'primario' : 'secundario', { fontSize: 14 })}
        >
          👥 Alumnos
        </button>
        <button
          onClick={() => setVistaGeneral('usuarios')}
          style={btnStyle(vistaGeneral === 'usuarios' ? 'primario' : 'secundario', { fontSize: 14 })}
        >
          ⚙️ Usuarios
        </button>
        <button
          onClick={cerrarSesionAdmin}
          style={btnStyle('secundario', { fontSize: 14, marginLeft: 'auto' })}
        >
          🚪 Cerrar sesión
        </button>
      </div>

      {vistaGeneral === 'asignaturas' && (
      <div className="admin-body" style={{ display: 'flex' }}>
      {/* MENÚ LATERAL */}
      <aside className="admin-sidebar" style={{ width: 300, borderRight: '1px solid #ddd', padding: 16, flexShrink: 0 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Materias</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {categorias
            .filter((c) => !c.categoria_padre_id)
            .sort((a, b) => (a.orden ?? a.id) - (b.orden ?? b.id))
            .map((padre) => {
            const hijos = categorias
              .filter((h) => h.categoria_padre_id === padre.id)
              .sort((a, b) => (a.orden ?? a.id) - (b.orden ?? b.id));
            return (
              <li
                key={padre.id}
                draggable
                onDragStart={() => setArrastrando({ id: padre.id, scope: 'top' })}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => soltarSobre('top', padre.id)}
                style={{
                  marginBottom: hijos.length > 0 ? 10 : 4,
                  cursor: 'grab',
                  opacity: arrastrando?.id === padre.id ? 0.4 : 1,
                }}
              >
                {hijos.length > 0 ? (
                  <>
                    {editandoMateriaId === padre.id ? (
                      <div style={{ display: 'flex', gap: 4, padding: '0 10px', marginBottom: 4 }}>
                        <input
                          value={editMateriaNombre}
                          onChange={(e) => setEditMateriaNombre(e.target.value)}
                          style={{ flex: 1, minWidth: 0, padding: 4, fontSize: 12, boxSizing: 'border-box' }}
                          autoFocus
                        />
                        <button onClick={() => guardarNombreMateria(padre.id)} title="Guardar" style={{ fontSize: 13, width: 26, height: 26, flexShrink: 0, padding: 0 }}>✓</button>
                        <button onClick={() => setEditandoMateriaId(null)} title="Cancelar" style={{ fontSize: 13, width: 26, height: 26, flexShrink: 0, padding: 0 }}>✕</button>
                      </div>
                    ) : (
                      <div className="fila-materia" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px' }}>
                        <div style={{ fontSize: 12, fontWeight: 'bold', color: '#888', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: '#ccc' }}>⠿</span> {padre.nombre}
                        </div>
                        <div className="iconos-materia" style={{ display: 'flex', gap: 4 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); iniciarEdicionMateria(padre); }}
                            title="Renombrar"
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12 }}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setAgregandoSubPara(padre.id); setNuevaSubNombre(''); }}
                            title="Agregar subcategoría"
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12 }}
                          >
                            ➕
                          </button>
                        </div>
                      </div>
                    )}
                    {agregandoSubPara === padre.id && (
                      <div style={{ display: 'flex', gap: 4, padding: '0 10px', marginBottom: 6 }}>
                        <input
                          placeholder="Nombre de la subcategoría"
                          value={nuevaSubNombre}
                          onChange={(e) => setNuevaSubNombre(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') crearSubcategoriaRapida(padre.id); }}
                          style={{ flex: 1, padding: 4, fontSize: 12 }}
                          autoFocus
                        />
                        <button onClick={() => crearSubcategoriaRapida(padre.id)} style={{ fontSize: 12 }}>✓</button>
                        <button onClick={() => setAgregandoSubPara(null)} style={{ fontSize: 12 }}>✕</button>
                      </div>
                    )}
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, borderLeft: '2px solid #eee', marginLeft: 10 }}>
                      {hijos.map((h) => (
                        <li
                          key={h.id}
                          draggable
                          onDragStart={(e) => { e.stopPropagation(); setArrastrando({ id: h.id, scope: padre.id }); }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => { e.stopPropagation(); soltarSobre(padre.id, h.id); }}
                          style={{ marginBottom: 4, cursor: 'grab', opacity: arrastrando?.id === h.id ? 0.4 : 1 }}
                        >
                          {renderMateriaItem(h)}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <>
                    {renderMateriaItem(padre)}
                    {agregandoSubPara === padre.id ? (
                      <div style={{ display: 'flex', gap: 4, padding: '4px 10px 0' }}>
                        <input
                          placeholder="Nombre de la subcategoría"
                          value={nuevaSubNombre}
                          onChange={(e) => setNuevaSubNombre(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') crearSubcategoriaRapida(padre.id); }}
                          style={{ flex: 1, padding: 4, fontSize: 12 }}
                          autoFocus
                        />
                        <button onClick={() => crearSubcategoriaRapida(padre.id)} style={{ fontSize: 12 }}>✓</button>
                        <button onClick={() => setAgregandoSubPara(null)} style={{ fontSize: 12 }}>✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setAgregandoSubPara(padre.id); setNuevaSubNombre(''); }}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 11, color: '#4a90d9', paddingLeft: 10, marginTop: 2 }}
                      >
                        ➕ Agregar subcategoría
                      </button>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>

        <form onSubmit={crearCategoria} style={{ marginTop: 16 }}>
          <input
            placeholder="Nueva materia"
            value={nuevaCategoria}
            onChange={(e) => setNuevaCategoria(e.target.value)}
            style={{ width: '100%', padding: 6, marginBottom: 6, boxSizing: 'border-box' }}
          />
          <input
            placeholder="Código CENEVAL (opcional, ej. EXIICL1)"
            value={nuevaCategoriaCodigo}
            onChange={(e) => setNuevaCategoriaCodigo(e.target.value)}
            style={{ width: '100%', padding: 6, marginBottom: 6, boxSizing: 'border-box', fontSize: 13 }}
          />
          <select
            value={nuevaCategoriaPadreId}
            onChange={(e) => setNuevaCategoriaPadreId(e.target.value)}
            style={{ width: '100%', padding: 6, marginBottom: 6, boxSizing: 'border-box', fontSize: 13 }}
          >
            <option value="">— Materia de primer nivel (sin padre) —</option>
            {categorias.filter((c) => !c.categoria_padre_id).map((c) => (
              <option key={c.id} value={c.id}>Subcategoría de: {c.nombre}</option>
            ))}
          </select>
          <button type="submit" style={btnStyle('primario', { width: '100%', padding: 8 })}>+ Agregar materia</button>
        </form>
        {mensaje && <p style={{ color: 'red', fontSize: 13 }}>{mensaje}</p>}
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="admin-main" style={{ flex: 1, padding: 24, maxWidth: 900, minWidth: 0 }}>
        <h1 style={{ marginTop: 0, marginBottom: 20 }}>
          {categoriaActiva
            ? (categoriaPadreActiva ? `${categoriaPadreActiva.nombre} › ${categoriaActiva.nombre}` : categoriaActiva.nombre)
            : 'Selecciona una materia'}
          {categoriaActiva?.codigo && (
            <span style={{ fontSize: 15, color: '#888', fontWeight: 'normal', marginLeft: 10 }}>({categoriaActiva.codigo})</span>
          )}
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
            <section ref={cargaRapidaRef} style={{ marginBottom: 32, padding: 16, border: '2px solid #4a90d9', borderRadius: 8 }}>
              <h2>Carga rápida de reactivos</h2>
              <p style={{ color: '#666', fontSize: 14 }}>
                Se agregarán a la materia <strong>{categoriaActiva?.nombre}</strong>. Opcionalmente
                asocia una lectura, indica cuántas preguntas y cuántas opciones cada una.
              </p>

              {insertarInfo && (
                <div style={{ marginBottom: 12, padding: 10, background: '#eaf3ff', border: '1px solid #4a90d9', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#2a5f9e' }}>
                    📍 Lo que agregues aquí se insertará justo <strong>después de la pregunta {insertarInfo.numeroRef}</strong>, ocupando su lugar en la numeración.
                  </span>
                  <button type="button" onClick={cancelarInsercion} style={btnStyle('secundario', { fontSize: 12, padding: '4px 10px', flexShrink: 0, marginLeft: 10 })}>
                    Cancelar, agregar al final
                  </button>
                </div>
              )}

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
                  <input
                    placeholder='Instrucción (opcional, ej. "Lee con atención el siguiente texto y contesta...")'
                    value={lecturaInlineInstruccion}
                    onChange={(e) => setLecturaInlineInstruccion(e.target.value)}
                    style={{ display: 'block', marginBottom: 8, padding: 8, width: '100%', boxSizing: 'border-box' }}
                  />
                  <div style={{ background: '#fff' }}>
                    <ReactQuill theme="snow" value={lecturaInlineTexto} onChange={setLecturaInlineTexto} placeholder="Cuerpo del texto..." />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px 14px', rowGap: 14, alignItems: 'center', marginBottom: 24, marginTop: 4, flexWrap: 'wrap' }}>
                <label>
                  Número de preguntas:{' '}
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={numPreguntas}
                    onChange={(e) => setNumPreguntas(parseInt(e.target.value, 10) || 1)}
                    style={{ width: 60, padding: 6 }}
                  />
                </label>
                <span style={{ color: '#666', fontSize: 13 }}>Tipo de opciones:</span>
                <button type="button" onClick={() => generarCamposRapidos(2)} style={btnStyle('secundario', { minWidth: 96 })}>2 opciones</button>
                <button type="button" onClick={() => generarCamposRapidos(3)} style={btnStyle('secundario', { minWidth: 96 })}>3 opciones</button>
                <button type="button" onClick={() => generarCamposRapidos(4)} style={btnStyle('secundario', { minWidth: 96 })}>4 opciones</button>
                <button type="button" onClick={() => generarCamposRapidos('vf')} style={btnStyle('secundario', { minWidth: 96 })}>Verdadero/Falso</button>
              </div>

              <p style={{ fontSize: 12, color: '#888', marginTop: -8, marginBottom: 12 }}>
                💡 Para exponentes en las opciones escribe <code>^3</code> (ej. <code>(4a+6b)^3</code>). Si tu teclado no
                deja escribir el símbolo <code>^</code> solo (algunos teclados en español lo tratan como tecla muerta),
                escríbelo con un espacio después: <code>^ 3</code> — funciona igual.
              </p>

              {preguntasRapidas.length > 0 && (
                <div>
                  {preguntasRapidas.map((p, idxP) => (
                    <div key={idxP} style={{ border: '1px solid #ddd', padding: 10, marginBottom: 8, borderRadius: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong>Pregunta {reactivos.length + idxP + 1}</strong>
                        <button
                          type="button"
                          onClick={() => quitarPreguntaRapida(idxP)}
                          style={{ fontSize: 12, color: '#a00', border: 'none', background: 'transparent', cursor: 'pointer' }}
                        >
                          ✕ quitar
                        </button>
                      </div>
                      <div style={{ marginTop: 4, marginBottom: 6, background: '#fff' }}>
                        <ReactQuill
                          theme="snow"
                          value={p.pregunta}
                          onChange={(html) => actualizarPreguntaRapida(idxP, html)}
                          placeholder="Texto de la pregunta"
                          modules={quillPreguntaModules}
                          formats={quillPreguntaFormats}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                        <input
                          value={p.imagen_url || ''}
                          onChange={(e) => actualizarImagenPreguntaRapida(idxP, e.target.value)}
                          placeholder="URL de imagen para la pregunta (opcional, ej. gráfica o diagrama)"
                          style={{ flex: 1, padding: 6, boxSizing: 'border-box', fontSize: 13 }}
                        />
                        <BotonSubirImagen onSubida={(url) => actualizarImagenPreguntaRapida(idxP, url)} />
                      </div>
                      {p.imagen_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imagen_url} alt="" style={{ maxWidth: 220, maxHeight: 140, display: 'block', marginBottom: 6, borderRadius: 4, border: '1px solid #eee' }} />
                      )}
                      {p.opciones.map((o, idxO) => (
                        <div key={idxO} style={{ marginBottom: 4 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
                              placeholder={`Opción ${idxO + 1} (ej. (4a+6b)^3)`}
                            />
                            <input
                              value={o.imagen_url || ''}
                              onChange={(e) => actualizarOpcionRapida(idxP, idxO, 'imagen_url', e.target.value)}
                              style={{ flex: 1, padding: 6, fontSize: 12 }}
                              placeholder="URL imagen (opcional)"
                            />
                            <BotonSubirImagen onSubida={(url) => actualizarOpcionRapida(idxP, idxO, 'imagen_url', url)} />
                          </div>
                          {/^.*[\^_]/.test(o.texto) && (
                            <div style={{ marginLeft: 26, fontSize: 12, color: '#888' }}>
                              Vista previa: <span dangerouslySetInnerHTML={{ __html: renderizarExponentes(o.texto) }} />
                            </div>
                          )}
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
                      <input
                        placeholder='Instrucción (opcional, ej. "Lee con atención el siguiente texto y contesta...")'
                        value={editLecturaInstruccion}
                        onChange={(e) => setEditLecturaInstruccion(e.target.value)}
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
                    <div key={r.id} style={{ border: '1px solid #eee', padding: 12, marginBottom: 8, borderRadius: 6, background: r.numero % 2 === 1 ? '#fff' : '#f7f7f7' }}>
                      {editandoId === r.id ? (
                        <div>
                          <div style={{ color: '#4a90d9', fontWeight: 'bold', fontSize: 13, marginBottom: 4 }}>Editando pregunta {r.numero}</div>
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
                          <div style={{ marginBottom: 8, background: '#fff' }}>
                            <ReactQuill
                              theme="snow"
                              value={editPregunta}
                              onChange={setEditPregunta}
                              modules={quillPreguntaModules}
                              formats={quillPreguntaFormats}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                            <input
                              value={editImagenUrl}
                              onChange={(e) => setEditImagenUrl(e.target.value)}
                              placeholder="URL de imagen para la pregunta (opcional, ej. gráfica o diagrama)"
                              style={{ flex: 1, padding: 8, boxSizing: 'border-box' }}
                            />
                            <BotonSubirImagen onSubida={setEditImagenUrl} />
                          </div>
                          {editImagenUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={editImagenUrl} alt="" style={{ maxWidth: 220, maxHeight: 140, display: 'block', marginBottom: 8, borderRadius: 4, border: '1px solid #eee' }} />
                          )}
                          {editOpciones.map((o, i) => (
                            <div key={i} style={{ marginBottom: 4 }}>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
                                  placeholder="Ej. (4a+6b)^3"
                                />
                                <input
                                  value={o.imagen_url || ''}
                                  onChange={(e) => actualizarOpcionEdit(i, 'imagen_url', e.target.value)}
                                  style={{ flex: 1, padding: 8, fontSize: 12 }}
                                  placeholder="URL imagen (opcional)"
                                />
                                <BotonSubirImagen onSubida={(url) => actualizarOpcionEdit(i, 'imagen_url', url)} />
                              </div>
                              {o.imagen_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={o.imagen_url} alt="" style={{ maxWidth: 160, maxHeight: 100, display: 'block', marginTop: 4, marginLeft: 26, borderRadius: 4, border: '1px solid #eee' }} />
                              )}
                              {/^.*[\^_]/.test(o.texto) && (
                                <div style={{ marginLeft: 26, fontSize: 12, color: '#888' }}>
                                  Vista previa: <span dangerouslySetInnerHTML={{ __html: renderizarExponentes(o.texto) }} />
                                </div>
                              )}
                            </div>
                          ))}
                          <button onClick={() => guardarEdicion(r.id)} style={btnStyle('primario', { marginRight: 8 })}>Guardar cambios</button>
                          <button onClick={cancelarEdicion} style={btnStyle('secundario')}>Cancelar</button>
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ color: '#4a90d9', fontWeight: 'bold', fontSize: 13, marginBottom: 4 }}>Pregunta {r.numero}</div>
                              <div dangerouslySetInnerHTML={{ __html: r.pregunta }} />
                              {r.imagen_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={r.imagen_url} alt="" style={{ maxWidth: 260, maxHeight: 180, display: 'block', marginTop: 4, marginBottom: 6, borderRadius: 4, border: '1px solid #eee' }} />
                              )}
                              <ul>
                                {r.opciones.map((o, idx) => (
                                  <li key={o.id} style={{ color: o.es_correcta ? 'green' : 'inherit' }}>
                                    <strong>{String.fromCharCode(97 + idx)})</strong>{' '}
                                    <span dangerouslySetInnerHTML={{ __html: renderizarExponentes(o.texto) }} />
                                    {' '}{o.imagen_url && `[img: ${o.imagen_url}]`} {o.es_correcta && '✓'}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                              <button
                                onClick={() => iniciarInsercionDespuesDe(r, reactivos.findIndex((x) => x.id === r.id))}
                                title="Insertar una pregunta nueva justo después de esta"
                                style={{ border: 'none', background: '#eef1f5', cursor: 'pointer', fontSize: 15, borderRadius: 6, width: 30, height: 30 }}
                              >
                                ⤵️
                              </button>
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
      </div>
      )}

      {vistaGeneral === 'alumnos' && (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h1 className={mostrandoFicha ? 'ocultar-al-imprimir' : ''} style={{ margin: 0 }}>
              {detalleAlumno ? detalleAlumno.alumno.nombre : 'Resultados del diagnóstico'}
            </h1>
            {detalleAlumno ? (
              <div className="ocultar-al-imprimir" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={() => { setAlumnoSeleccionadoId(null); setDetalleAlumno(null); }} style={btnStyle('secundario')}>
                  ← Volver a la lista
                </button>
                <button onClick={() => window.print()} style={btnStyle('primario')}>
                  🖨️ Imprimir / Guardar PDF
                </button>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setMenuOpcionesAbierto((v) => !v)}
                    title="Más opciones"
                    style={btnStyle('secundario', { padding: '10px 12px' })}
                  >
                    ⋯
                  </button>
                  {menuOpcionesAbierto && (
                    <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1px solid #e0e6ec', borderRadius: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.12)', minWidth: 220, zIndex: 20, overflow: 'hidden' }}>
                      <button
                        onClick={() => { setMenuOpcionesAbierto(false); borrarHistorialAlumno(detalleAlumno.alumno.id, detalleAlumno.alumno.nombre); }}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', color: '#c0392b', fontSize: 13 }}
                      >
                        🧹 Borrar historial
                      </button>
                      <button
                        onClick={() => { setMenuOpcionesAbierto(false); borrarAlumnoCompleto(detalleAlumno.alumno.id, detalleAlumno.alumno.nombre); }}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', borderTop: '1px solid #f0f0f0', background: 'none', cursor: 'pointer', color: '#c0392b', fontSize: 13 }}
                      >
                        🗑️ Borrar alumno
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={exportarCSV}
                disabled={!resultadosResumen || resultadosResumen.alumnos.length === 0}
                style={btnStyle('primario')}
              >
                Exportar a Excel (CSV)
              </button>
            )}
          </div>

          {!detalleAlumno && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, fontSize: 13, color: '#666', flexWrap: 'wrap' }}>
              <span>Umbral de aprobación (verde/rojo en toda la app):</span>
              {editandoUmbral ? (
                <>
                  <input
                    type="number" min="0" max="100" value={umbralInput}
                    onChange={(e) => setUmbralInput(parseInt(e.target.value, 10) || 0)}
                    style={{ width: 60, padding: 4 }}
                  />
                  <button onClick={guardarUmbral} style={btnStyle('primario', { padding: '4px 10px', fontSize: 12 })}>Guardar</button>
                  <button onClick={() => setEditandoUmbral(false)} style={btnStyle('secundario', { padding: '4px 10px', fontSize: 12 })}>Cancelar</button>
                </>
              ) : (
                <>
                  <strong>{umbralAprobacion}%</strong>
                  <button onClick={() => setEditandoUmbral(true)} title="Editar" style={btnStyle('secundario', { padding: '4px 8px', fontSize: 12 })}>✏️</button>
                </>
              )}
            </div>
          )}

          {!detalleAlumno && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, fontSize: 13, color: '#666', flexWrap: 'wrap' }}>
              <span>Tiempo límite del examen (para exámenes nuevos):</span>
              {editandoTiempo ? (
                <>
                  <input
                    type="number" min="1" max="600" value={tiempoInput}
                    onChange={(e) => setTiempoInput(parseInt(e.target.value, 10) || 1)}
                    style={{ width: 70, padding: 4 }}
                  />
                  <span>minutos</span>
                  <button onClick={guardarTiempo} style={btnStyle('primario', { padding: '4px 10px', fontSize: 12 })}>Guardar</button>
                  <button onClick={() => setEditandoTiempo(false)} style={btnStyle('secundario', { padding: '4px 10px', fontSize: 12 })}>Cancelar</button>
                </>
              ) : (
                <>
                  <strong>{tiempoLimiteMinutos} minutos</strong>
                  <button onClick={() => setEditandoTiempo(true)} title="Editar" style={btnStyle('secundario', { padding: '4px 8px', fontSize: 12 })}>✏️</button>
                </>
              )}
            </div>
          )}

          {!detalleAlumno && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, fontSize: 13, color: '#666', flexWrap: 'wrap' }}>
              <span>Intentos permitidos por alumno (0 = ilimitados):</span>
              {editandoIntentos ? (
                <>
                  <input
                    type="number" min="0" max="20" value={intentosInput}
                    onChange={(e) => setIntentosInput(parseInt(e.target.value, 10) || 0)}
                    style={{ width: 60, padding: 4 }}
                  />
                  <button onClick={guardarIntentos} style={btnStyle('primario', { padding: '4px 10px', fontSize: 12 })}>Guardar</button>
                  <button onClick={() => setEditandoIntentos(false)} style={btnStyle('secundario', { padding: '4px 10px', fontSize: 12 })}>Cancelar</button>
                </>
              ) : (
                <>
                  <strong>{intentosPermitidos === 0 ? 'Ilimitados' : intentosPermitidos}</strong>
                  <button onClick={() => setEditandoIntentos(true)} title="Editar" style={btnStyle('secundario', { padding: '4px 8px', fontSize: 12 })}>✏️</button>
                </>
              )}
            </div>
          )}

          {!detalleAlumno && (
            <div style={{ marginBottom: 24, maxWidth: 640 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, fontSize: 13, color: '#666' }}>
                <span>Instrucciones del examen (se le muestran al alumno antes de empezar, separadas de las lecturas):</span>
                {!editandoInstrucciones && (
                  <button onClick={() => setEditandoInstrucciones(true)} title="Editar" style={btnStyle('secundario', { padding: '4px 8px', fontSize: 12 })}>✏️</button>
                )}
              </div>
              {editandoInstrucciones ? (
                <div>
                  <div style={{ background: '#fff', marginBottom: 8 }}>
                    <ReactQuill theme="snow" value={instruccionesInput} onChange={setInstruccionesInput} placeholder="Ej. Reglas del examen, tiempo disponible, qué hacer si se corta la luz, etc." />
                  </div>
                  <button onClick={guardarInstrucciones} style={btnStyle('primario', { marginRight: 8 })}>Guardar</button>
                  <button onClick={() => { setInstruccionesInput(instrucciones); setEditandoInstrucciones(false); }} style={btnStyle('secundario')}>Cancelar</button>
                </div>
              ) : instrucciones ? (
                <div style={{ border: '1px solid #eee', borderRadius: 6, padding: 12, background: '#fafafa', fontSize: 13 }} dangerouslySetInnerHTML={{ __html: instrucciones }} />
              ) : (
                <p style={{ color: '#aaa', fontSize: 13, fontStyle: 'italic', margin: 0 }}>Sin instrucciones configuradas todavía.</p>
              )}
            </div>
          )}

          {cargandoAlumnos && <p style={{ color: '#888' }}>Cargando...</p>}

          {/* Vista de detalle de un alumno específico */}
          {detalleAlumno && (
            <div>
              {/* Membrete de impresión: solo visible al imprimir, y solo en
                  la pestaña Desempeño (la Ficha ya trae su propio encabezado
                  con logo, así que aquí sería repetido). */}
              {!mostrandoFicha && (
                <div className="solo-impresion" style={{ display: 'none', marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0d3b66', paddingBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/img/logo-montebello.webp" alt="" style={{ width: 42, height: 'auto' }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0d3b66' }}>Instituto Educativo Montebello</div>
                        <div style={{ fontSize: 10, color: '#888', fontStyle: 'italic' }}>Transformando la educación hacia la sociedad del conocimiento</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 11, color: '#555' }}>
                      <div>{detalleAlumno.alumno.nombre}</div>
                      <div>{new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tarjeta de contacto: en pantalla siempre visible (útil
                  como referencia en ambas pestañas), pero al imprimir la
                  Ficha se oculta porque los mismos datos (o su equivalente)
                  ya están dentro de la ficha. */}
              <div className={mostrandoFicha ? 'ocultar-al-imprimir' : ''} style={{ background: '#f7f8fa', borderRadius: 10, padding: 16, marginBottom: 20, fontSize: 14 }}>
                {editandoPerfilAlumno ? (
                  <div>
                    <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 3 }}>Nombre</label>
                    <input value={perfilInput.nombre} onChange={(e) => setPerfilInput({ ...perfilInput, nombre: e.target.value })} style={{ display: 'block', width: '100%', padding: 8, marginBottom: 8, border: '1px solid #ddd', borderRadius: 6, boxSizing: 'border-box' }} />
                    <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 3 }}>Correo</label>
                    <input value={perfilInput.email} onChange={(e) => setPerfilInput({ ...perfilInput, email: e.target.value })} style={{ display: 'block', width: '100%', padding: 8, marginBottom: 8, border: '1px solid #ddd', borderRadius: 6, boxSizing: 'border-box' }} />
                    <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 3 }}>Teléfono</label>
                    <input value={perfilInput.telefono} onChange={(e) => setPerfilInput({ ...perfilInput, telefono: e.target.value })} style={{ display: 'block', width: '100%', padding: 8, marginBottom: 8, border: '1px solid #ddd', borderRadius: 6, boxSizing: 'border-box' }} />
                    <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 3 }}>Escuela de procedencia</label>
                    <input value={perfilInput.preparatoria_procedencia} onChange={(e) => setPerfilInput({ ...perfilInput, preparatoria_procedencia: e.target.value })} style={{ display: 'block', width: '100%', padding: 8, marginBottom: 10, border: '1px solid #ddd', borderRadius: 6, boxSizing: 'border-box' }} />
                    <button onClick={guardarPerfilAlumno} style={btnStyle('primario', { marginRight: 8 })}>Guardar</button>
                    <button onClick={() => setEditandoPerfilAlumno(false)} style={btnStyle('secundario')}>Cancelar</button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: 6 }}><strong>Correo:</strong> {detalleAlumno.alumno.email}</div>
                        {detalleAlumno.alumno.telefono && (
                          <div style={{ marginBottom: 6 }}><strong>Teléfono:</strong> {detalleAlumno.alumno.telefono}</div>
                        )}
                        {detalleAlumno.alumno.preparatoria_procedencia && (
                          <div style={{ marginBottom: 6 }}><strong>Preparatoria de procedencia:</strong> {detalleAlumno.alumno.preparatoria_procedencia}</div>
                        )}
                        <div style={{ color: '#888', fontSize: 13 }}>
                          Registrado el {new Date(detalleAlumno.alumno.creado_en).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                      <button
                        onClick={() => setEditandoPerfilAlumno(true)}
                        title="Editar perfil"
                        className="ocultar-al-imprimir"
                        style={{ border: 'none', background: '#eef1f5', cursor: 'pointer', fontSize: 14, borderRadius: 6, width: 30, height: 30, flexShrink: 0 }}
                      >
                        ✏️
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Pestañas: Desempeño (resultados de examen) vs Ficha de Ingreso (entrevista) */}
              <div className="ocultar-al-imprimir" style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #eee' }}>
                <button
                  onClick={() => setMostrandoFicha(false)}
                  style={{
                    padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                    color: !mostrandoFicha ? '#0d3b66' : '#999',
                    borderBottom: !mostrandoFicha ? '2px solid #0d3b66' : '2px solid transparent', marginBottom: -2,
                  }}
                >
                  📊 Desempeño
                </button>
                <button
                  onClick={() => setMostrandoFicha(true)}
                  style={{
                    padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                    color: mostrandoFicha ? '#0d3b66' : '#999',
                    borderBottom: mostrandoFicha ? '2px solid #0d3b66' : '2px solid transparent', marginBottom: -2,
                  }}
                >
                  📋 Ficha de Ingreso
                </button>
              </div>

              {!mostrandoFicha && (
                <>
                  {detalleAlumno.historial.length === 0 && (
                    <p style={{ color: '#888' }}>Este alumno aún no ha finalizado ningún examen.</p>
                  )}
                  {detalleAlumno.historial.map((h, idx) => {
                const urlVerifAdmin = typeof window !== 'undefined'
                  ? `${window.location.origin}/verificar?folio=${h.examenId}`
                  : '';
                const urlQrAdmin = urlVerifAdmin
                  ? `https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(urlVerifAdmin)}`
                  : '';
                return (
                <div key={h.examenId} style={{ border: '1px solid #eee', borderRadius: 8, padding: 20, marginBottom: 16, background: idx % 2 === 0 ? '#fff' : '#f7f7f7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>
                      {new Date(h.finalizadoEn).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span style={{ fontSize: 12, color: '#999' }}>Folio #{h.examenId}</span>
                  </div>
                  {h.salidasPantalla > 0 && (
                    <div
                      title="Veces que el alumno cambió de pestaña, minimizó o cambió de app mientras el examen estaba en progreso"
                      style={{ fontSize: 12, color: h.salidasPantalla >= 5 ? '#c0392b' : '#a8791b', marginBottom: 10 }}
                    >
                      ⚠️ Salió de la pantalla del examen {h.salidasPantalla} {h.salidasPantalla === 1 ? 'vez' : 'veces'}
                    </div>
                  )}
                  <DonaResultado
                    tamano={160}
                    resultado={{
                      general: { total: h.total, correctas: h.correctas, porcentaje: h.porcentaje },
                      porCategoria: h.porCategoria,
                    }}
                  />
                  <div className="solo-impresion" style={{ display: 'none', marginTop: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
                      <div style={{ textAlign: 'right', fontSize: 10, color: '#888', maxWidth: 160 }}>
                        Folio #{h.examenId}<br />Escanea para verificar la autenticidad
                      </div>
                      {urlQrAdmin && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={urlQrAdmin} alt="Código QR de verificación" style={{ width: 60, height: 60 }} />
                      )}
                    </div>
                  </div>
                </div>
                );
                  })}
                </>
              )}

              {mostrandoFicha && (
                <div className="ficha-registro" style={{ background: '#fff', border: '1px solid #dde3ea', borderRadius: 10, padding: 28, maxWidth: 820 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #0d3b66', paddingBottom: 14, marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/img/logo-montebello.webp" alt="" style={{ width: 54, height: 'auto' }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#0d3b66' }}>INSTITUTO EDUCATIVO MONTEBELLO</div>
                        <div style={{ fontSize: 11, color: '#888', fontStyle: 'italic' }}>"Transformando la educación hacia la sociedad del conocimiento"</div>
                        <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>FICHA DE REGISTRO</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 11, color: '#a8791b', fontWeight: 700, border: '1px solid #e8d9b0', borderRadius: 6, padding: '4px 10px' }}>
                      Modelo<br />CENEVAL
                    </div>
                  </div>

                  {/* --- Datos que ya calcula el sistema (solo lectura) --- */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px', marginBottom: 18, fontSize: 13 }}>
                    <div><strong>Fecha de diagnóstico:</strong> {detalleAlumno.historial[0] ? new Date(detalleAlumno.historial[0].finalizadoEn).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}</div>
                    <div><strong>Promedio general de examen:</strong> {detalleAlumno.historial[0] ? `${detalleAlumno.historial[0].porcentaje}%` : '—'}</div>
                    <div style={{ gridColumn: '1 / -1' }}><strong>Nombre del alumno:</strong> {detalleAlumno.alumno.nombre}</div>
                    <div><strong>Teléfono del alumno:</strong> {detalleAlumno.alumno.telefono || '—'}</div>
                  </div>

                  {/* --- Campos que se llenan en la entrevista --- */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                    <label style={{ fontSize: 12, color: '#555' }}>
                      Fecha de nacimiento
                      <input type="date" value={fichaInput.fechaNacimiento || ''} onChange={(e) => actualizarCampoFicha('fechaNacimiento', e.target.value)} style={{ display: 'block', width: '100%', padding: 7, marginTop: 3, border: '1px solid #ddd', borderRadius: 5 }} />
                    </label>
                    <label style={{ fontSize: 12, color: '#555', gridColumn: 'span 2' }}>
                      Secundaria/Bachillerato de procedencia
                      <input value={fichaInput.escuelaProcedencia ?? detalleAlumno.alumno.preparatoria_procedencia ?? ''} onChange={(e) => actualizarCampoFicha('escuelaProcedencia', e.target.value)} style={{ display: 'block', width: '100%', padding: 7, marginTop: 3, border: '1px solid #ddd', borderRadius: 5, boxSizing: 'border-box' }} />
                    </label>
                    <label style={{ fontSize: 12, color: '#555', gridColumn: 'span 3' }}>
                      Área o carrera que desea estudiar
                      <input value={fichaInput.areaCarrera || ''} onChange={(e) => actualizarCampoFicha('areaCarrera', e.target.value)} style={{ display: 'block', width: '100%', padding: 7, marginTop: 3, border: '1px solid #ddd', borderRadius: 5, boxSizing: 'border-box' }} />
                    </label>
                    <label style={{ fontSize: 12, color: '#555', gridColumn: 'span 3' }}>
                      Preparatoria(s)/universidad(es) a la(s) que aplica
                      <input value={fichaInput.preparatoriasAplica || ''} onChange={(e) => actualizarCampoFicha('preparatoriasAplica', e.target.value)} style={{ display: 'block', width: '100%', padding: 7, marginTop: 3, border: '1px solid #ddd', borderRadius: 5, boxSizing: 'border-box' }} />
                    </label>
                    <label style={{ fontSize: 12, color: '#555', gridColumn: 'span 2' }}>
                      Nombre del padre/tutor
                      <input value={fichaInput.nombrePadreTutor || ''} onChange={(e) => actualizarCampoFicha('nombrePadreTutor', e.target.value)} style={{ display: 'block', width: '100%', padding: 7, marginTop: 3, border: '1px solid #ddd', borderRadius: 5, boxSizing: 'border-box' }} />
                    </label>
                    <label style={{ fontSize: 12, color: '#555' }}>
                      Teléfono del padre/tutor
                      <input value={fichaInput.telefonoPadreTutor || ''} onChange={(e) => actualizarCampoFicha('telefonoPadreTutor', e.target.value)} style={{ display: 'block', width: '100%', padding: 7, marginTop: 3, border: '1px solid #ddd', borderRadius: 5, boxSizing: 'border-box' }} />
                    </label>
                  </div>

                  {/* --- Tabla de resultados CENEVAL --- */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
                    <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>
                      Resultados de examen diagnóstico CENEVAL
                      <span style={{ fontWeight: 400, color: '#888', marginLeft: 8 }}>(el % lo calcula el sistema; "puntaje" es el que asigne la institución según su escala)</span>
                    </p>
                    <div style={{ display: 'flex', gap: 12, marginLeft: 'auto' }}>
                      {['EXANI I', 'EXANI II'].map((modelo) => (
                        <label key={modelo} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input type="radio" name="modeloExani" checked={fichaInput.modeloExani === modelo} onChange={() => actualizarCampoFicha('modeloExani', modelo)} /> {modelo}
                        </label>
                      ))}
                    </div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 20 }}>
                    <thead>
                      <tr style={{ background: '#f0f3f7' }}>
                        <th style={{ textAlign: 'left', padding: 8, border: '1px solid #e0e6ec' }}>Área</th>
                        <th style={{ padding: 8, border: '1px solid #e0e6ec' }}>Resultado en %</th>
                        <th style={{ padding: 8, border: '1px solid #e0e6ec' }}>Resultado en puntaje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detalleAlumno.historial[0]?.porCategoria || []).map((c) => (
                        <tr key={c.categoria}>
                          <td style={{ padding: 8, border: '1px solid #e0e6ec' }}>{c.categoria}</td>
                          <td style={{ padding: 8, border: '1px solid #e0e6ec', textAlign: 'center' }}>{c.porcentaje}%</td>
                          <td style={{ padding: 4, border: '1px solid #e0e6ec', textAlign: 'center' }}>
                            <input
                              value={fichaInput.puntajesPorArea?.[c.categoria] || ''}
                              onChange={(e) => actualizarPuntajeArea(c.categoria, e.target.value)}
                              style={{ width: '100%', padding: 5, border: '1px solid #ddd', borderRadius: 4, textAlign: 'center', boxSizing: 'border-box' }}
                            />
                          </td>
                        </tr>
                      ))}
                      {!detalleAlumno.historial[0] && (
                        <tr><td colSpan={3} style={{ padding: 10, textAlign: 'center', color: '#aaa', border: '1px solid #e0e6ec' }}>Sin examen finalizado aún</td></tr>
                      )}
                      <tr>
                        <td style={{ padding: 8, border: '1px solid #e0e6ec' }}>Total de Aciertos</td>
                        <td colSpan={2} style={{ padding: 8, border: '1px solid #e0e6ec', textAlign: 'center' }}>{detalleAlumno.historial[0]?.correctas ?? '—'} de {detalleAlumno.historial[0]?.total ?? '—'}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 8, border: '1px solid #e0e6ec' }}>Total de Errores</td>
                        <td colSpan={2} style={{ padding: 8, border: '1px solid #e0e6ec', textAlign: 'center' }}>
                          {detalleAlumno.historial[0] ? detalleAlumno.historial[0].total - detalleAlumno.historial[0].correctas : '—'}
                        </td>
                      </tr>
                      <tr style={{ background: '#fdf3e3' }}>
                        <td style={{ padding: 8, border: '1px solid #e0e6ec', fontWeight: 700, color: '#a8791b' }}>Puntaje total de examen completo</td>
                        <td colSpan={2} style={{ padding: 4, border: '1px solid #e0e6ec', textAlign: 'center' }}>
                          <input value={fichaInput.puntajeTotal || ''} onChange={(e) => actualizarCampoFicha('puntajeTotal', e.target.value)} style={{ width: '100%', padding: 5, border: '1px solid #ddd', borderRadius: 4, textAlign: 'center', boxSizing: 'border-box' }} />
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* --- Comprensión lectora extra (cronometraje manual) --- */}
                  <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Resultados de examen de comprensión lectora</p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 20 }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: 8, border: '1px solid #e0e6ec' }}>Total de palabras en el texto</td>
                        <td style={{ padding: 4, border: '1px solid #e0e6ec', width: 140 }}>
                          <input type="number" value={fichaInput.palabrasTexto || ''} onChange={(e) => actualizarCampoFicha('palabrasTexto', e.target.value)} style={{ width: '100%', padding: 5, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' }} />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: 8, border: '1px solid #e0e6ec' }}>Tiempo de lectura (minutos)</td>
                        <td style={{ padding: 4, border: '1px solid #e0e6ec' }}>
                          <input type="number" value={fichaInput.tiempoLecturaMin || ''} onChange={(e) => actualizarCampoFicha('tiempoLecturaMin', e.target.value)} style={{ width: '100%', padding: 5, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' }} />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: 8, border: '1px solid #e0e6ec' }}>Número de palabras por minuto (ppm)</td>
                        <td style={{ padding: 8, border: '1px solid #e0e6ec', textAlign: 'center' }}>
                          {fichaInput.palabrasTexto && fichaInput.tiempoLecturaMin
                            ? Math.round(fichaInput.palabrasTexto / fichaInput.tiempoLecturaMin)
                            : '—'}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: 8, border: '1px solid #e0e6ec' }}>Total de aciertos en examen de comprensión lectora</td>
                        <td style={{ padding: 8, border: '1px solid #e0e6ec', textAlign: 'center' }}>
                          {(() => {
                            const cl = detalleAlumno.historial[0]?.porCategoria?.find((c) => c.categoria.toLowerCase().includes('comprensión lectora'));
                            return cl ? `${cl.correctas}/${cl.total} · ${cl.porcentaje}%` : '—';
                          })()}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                    <label style={{ fontSize: 12, color: '#555' }}>
                      Fecha de ingreso al curso
                      <input type="date" value={fichaInput.fechaIngreso || ''} onChange={(e) => actualizarCampoFicha('fechaIngreso', e.target.value)} style={{ display: 'block', width: '100%', padding: 7, marginTop: 3, border: '1px solid #ddd', borderRadius: 5 }} />
                    </label>
                    <div>
                      <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>Turno</div>
                      <div style={{ display: 'flex', gap: 14 }}>
                        {['Matutino', 'Vespertino', 'Sábado'].map((t) => (
                          <label key={t} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input type="radio" name="turno" checked={fichaInput.turno === t} onChange={() => actualizarCampoFicha('turno', t)} /> {t}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: 12, color: '#666', fontStyle: 'italic', marginBottom: 20 }}>
                    Rosario Culebro Alfaro — Directora del Instituto Montebello
                  </div>

                  {/* Pie de contacto del instituto: igual al de la ficha oficial en papel, solo visible al imprimir */}
                  <div
                    className="solo-impresion"
                    style={{
                      display: 'none', marginTop: 10, marginLeft: -22, marginRight: -22, marginBottom: -22,
                      background: '#0d3b66', color: '#f0d99a', padding: '10px 22px', fontSize: 10,
                    }}
                  >
                    <div className="ficha-footer-contacto" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
                      <span>📱 963 159 75 28</span>
                      <span>📞 963 59 37 094</span>
                      <span>📍 6a. Av. Ote. Sur 31 B, Barrio Pilita Seca</span>
                      <span>👍 Instituto Montebello A.C.</span>
                      <span>🌐 www.institutomontebello.mx</span>
                    </div>
                  </div>

                  <div className="ocultar-al-imprimir">
                    <button onClick={guardarFicha} style={btnStyle('primario')}>💾 Guardar ficha</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vista general: resumen + lista de alumnos */}
          {!detalleAlumno && resultadosResumen && (
            <>
              {resultadosResumen.alumnos.length === 0 ? (
                <p style={{ color: '#888' }}>Todavía ningún alumno ha finalizado su examen de diagnóstico.</p>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 160, background: '#f4f4f4', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 'bold', color: '#333' }}>{resultadosResumen.totalAlumnosEvaluados}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>Alumnos evaluados</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 160, background: resultadosResumen.promedioGeneral >= umbralAprobacion ? '#eafaf1' : '#fdeceb', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 'bold', color: resultadosResumen.promedioGeneral >= umbralAprobacion ? '#2e7d32' : '#c0392b' }}>
                        {resultadosResumen.promedioGeneral}%
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>Promedio general</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: 16, marginBottom: 12 }}>Promedio por materia</h2>
                    {resultadosResumen.promedioPorMateria.map((m) => (
                      <div key={m.categoria} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                          <span>{m.categoria}</span>
                          <span style={{ fontWeight: 600, color: m.porcentaje >= umbralAprobacion ? '#2e7d32' : '#c0392b' }}>{m.porcentaje}%</span>
                        </div>
                        <div style={{ background: '#eee', borderRadius: 6, height: 14, overflow: 'hidden' }}>
                          <div style={{ width: `${m.porcentaje}%`, height: '100%', background: m.porcentaje >= umbralAprobacion ? '#2e7d32' : '#c0392b' }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h2 style={{ fontSize: 16, marginBottom: 12 }}>Lista de alumnos</h2>

                    <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                      <input
                        placeholder="Buscar por nombre o correo..."
                        value={busquedaAlumno}
                        onChange={(e) => { setBusquedaAlumno(e.target.value); setPaginaAlumnos(1); }}
                        style={{ flex: 1, minWidth: 200, padding: 8, border: '1px solid #ddd', borderRadius: 6 }}
                      />
                      <input
                        type="date"
                        value={filtroFechaAlumno}
                        onChange={(e) => { setFiltroFechaAlumno(e.target.value); setPaginaAlumnos(1); }}
                        style={{ padding: 8, border: '1px solid #ddd', borderRadius: 6 }}
                        title="Filtrar por fecha del último intento"
                      />
                      {(busquedaAlumno || filtroFechaAlumno) && (
                        <button
                          onClick={() => { setBusquedaAlumno(''); setFiltroFechaAlumno(''); setPaginaAlumnos(1); }}
                          style={btnStyle('secundario')}
                        >
                          Limpiar filtros
                        </button>
                      )}
                    </div>

                    {(() => {
                      const filtrados = resultadosResumen.alumnos.filter((a) => {
                        const coincideTexto =
                          !busquedaAlumno ||
                          a.nombre.toLowerCase().includes(busquedaAlumno.toLowerCase()) ||
                          a.email.toLowerCase().includes(busquedaAlumno.toLowerCase());
                        const coincideFecha =
                          !filtroFechaAlumno ||
                          (a.finalizadoEn && a.finalizadoEn.slice(0, 10) === filtroFechaAlumno);
                        return coincideTexto && coincideFecha;
                      });

                      const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ALUMNOS_POR_PAGINA));
                      const paginaSegura = Math.min(paginaAlumnos, totalPaginas);
                      const inicio = (paginaSegura - 1) * ALUMNOS_POR_PAGINA;
                      const paginaActualAlumnos = filtrados.slice(inicio, inicio + ALUMNOS_POR_PAGINA);

                      if (filtrados.length === 0) {
                        return <p style={{ color: '#888' }}>Ningún alumno coincide con la búsqueda.</p>;
                      }

                      return (
                        <>
                          <p style={{ fontSize: 13, color: '#888', marginBottom: 10 }}>
                            {filtrados.length} alumno(s) encontrado(s)
                          </p>
                          {paginaActualAlumnos.map((a, idx) => (
                            <div
                              key={a.alumnoId}
                              onClick={() => verDetalleAlumno(a.alumnoId)}
                              style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: 14, border: '1px solid #eee', borderRadius: 8, marginBottom: 8, cursor: 'pointer',
                                background: idx % 2 === 0 ? '#fff' : '#f7f7f7',
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>{a.nombre}</div>
                                <div style={{ fontSize: 13, color: '#888' }}>{a.email} · {a.intentos} intento(s)</div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span
                                  style={{
                                    fontWeight: 'bold', padding: '3px 10px', borderRadius: 20,
                                    background: a.porcentaje >= umbralAprobacion ? '#eafaf1' : '#fdeceb',
                                    color: a.porcentaje >= umbralAprobacion ? '#2e7d32' : '#c0392b',
                                  }}
                                >
                                  {a.porcentaje}%
                                </span>
                                <span style={{ color: '#ccc' }}>›</span>
                              </div>
                            </div>
                          ))}

                          {totalPaginas > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 }}>
                              <button
                                onClick={() => setPaginaAlumnos(paginaSegura - 1)}
                                disabled={paginaSegura === 1}
                                style={btnStyle('secundario', { opacity: paginaSegura === 1 ? 0.5 : 1 })}
                              >
                                ← Anterior
                              </button>
                              <span style={{ fontSize: 13, color: '#666' }}>
                                Página {paginaSegura} de {totalPaginas}
                              </span>
                              <button
                                onClick={() => setPaginaAlumnos(paginaSegura + 1)}
                                disabled={paginaSegura === totalPaginas}
                                style={btnStyle('secundario', { opacity: paginaSegura === totalPaginas ? 0.5 : 1 })}
                              >
                                Siguiente →
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {vistaGeneral === 'usuarios' && (
        <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
          <h1 style={{ marginTop: 0 }}>Usuarios del panel de administración</h1>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
            Controla quién puede entrar al panel de administración con su propio correo y contraseña.
          </p>

          <div style={{ border: '2px solid #4a90d9', borderRadius: 8, padding: 20, marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, marginTop: 0 }}>Agregar administrador</h2>
            <form onSubmit={crearUsuarioAdmin}>
              <input
                placeholder="Nombre completo"
                value={nuevoAdminNombre}
                onChange={(e) => setNuevoAdminNombre(e.target.value)}
                required
                style={{ display: 'block', width: '100%', padding: 8, marginBottom: 8, boxSizing: 'border-box' }}
              />
              <input
                type="email"
                placeholder="Correo electrónico"
                value={nuevoAdminEmail}
                onChange={(e) => setNuevoAdminEmail(e.target.value)}
                required
                style={{ display: 'block', width: '100%', padding: 8, marginBottom: 8, boxSizing: 'border-box' }}
              />
              <input
                type="password"
                placeholder="Contraseña (mínimo 6 caracteres)"
                value={nuevoAdminPassword}
                onChange={(e) => setNuevoAdminPassword(e.target.value)}
                required
                minLength={6}
                style={{ display: 'block', width: '100%', padding: 8, marginBottom: 12, boxSizing: 'border-box' }}
              />
              <button type="submit" style={btnStyle('primario')}>+ Agregar administrador</button>
            </form>
            {mensajeUsuarios && <p style={{ color: '#c0392b', fontSize: 14 }}>{mensajeUsuarios}</p>}
          </div>

          <h2 style={{ fontSize: 16 }}>Administradores registrados</h2>
          {!usuariosAdmin && <p style={{ color: '#888' }}>Cargando...</p>}
          {usuariosAdmin && usuariosAdmin.length === 0 && (
            <p style={{ color: '#888' }}>
              Aún no hay administradores individuales — el acceso funciona con la clave maestra
              (variable <code>ADMIN_PASSWORD</code>). Agrega el primero arriba.
            </p>
          )}
          {usuariosAdmin && usuariosAdmin.map((u) => (
            <div
              key={u.id}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 14, border: '1px solid #eee', borderRadius: 8, marginBottom: 8,
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{u.nombre}</div>
                <div style={{ fontSize: 13, color: '#888' }}>{u.email}</div>
              </div>
              <button onClick={() => borrarUsuarioAdmin(u)} style={btnStyle('peligro', { fontSize: 12, padding: '4px 10px' })}>
                🗑️ Quitar acceso
              </button>
            </div>
          ))}
        </div>
      )}

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

      {confirmacion && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
          }}
          onClick={() => setConfirmacion(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 12, padding: 24, maxWidth: 380, width: '90%',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
          >
            <p style={{ margin: '0 0 20px 0', fontSize: 15, color: '#333' }}>{confirmacion.mensaje}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmacion(null)} style={btnStyle('secundario')}>Cancelar</button>
              <button
                onClick={() => { const fn = confirmacion.onConfirmar; setConfirmacion(null); fn(); }}
                style={btnStyle('peligro')}
              >
                Sí, continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
