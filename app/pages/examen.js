import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import BoletaOficial from '../components/BoletaOficial';
import PantallaCarga from '../components/PantallaCarga';
import { renderizarExponentes } from '../lib/formato';
import parse from 'html-react-parser';

// KaTeX (~250KB) se carga DIFERIDO — el alumno solo necesita esto si la
// pregunta que le toca tiene una fórmula matemática, así que no tiene
// sentido que TODOS los alumnos paguen ese peso desde que abren el examen,
// incluidos los que nunca se topan con una fórmula en su intento.
const InlineMath = dynamic(() => import('react-katex').then((mod) => mod.InlineMath), { ssr: false });

// Convierte el HTML guardado por el editor (Quill) a elementos de React,
// re-renderizando en vivo cualquier fórmula matemática (los <span
// class="ql-formula"> que deja Quill) con react-katex — esto es necesario
// porque el HTML guardado no trae la fórmula ya "pintada": solo trae el
// LaTeX original en el atributo data-value, y hay que volver a procesarlo
// con KaTeX cada vez que se muestra.
function renderizarHTMLconMatematicas(htmlString) {
  if (!htmlString) return null;
  const opciones = {
    replace: (domNode) => {
      if (domNode.attribs && domNode.attribs.class && domNode.attribs.class.includes('ql-formula')) {
        const expresionMatematica = domNode.attribs['data-value'];
        return <InlineMath math={expresionMatematica} />;
      }
    },
  };
  return parse(htmlString, opciones);
}

function formatearFecha(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Examen() {
  const [alumno, setAlumno] = useState(null);
  const [lecturaDisponibleAhora, setLecturaDisponibleAhora] = useState(false);
  const [umbralAprobacion, setUmbralAprobacion] = useState(60); // valor por defecto mientras carga
  const [intentosPermitidos, setIntentosPermitidos] = useState(0); // 0 = ilimitados
  const [instruccionesExamen, setInstruccionesExamen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [examenId, setExamenId] = useState(null);
  const [pregunta, setPregunta] = useState(null);
  const [mapa, setMapa] = useState(null); // { categorias: [{ nombre, items: [{examenReactivoId, numero, respondida}] }] }
  const [seleccion, setSeleccion] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [segundosRestantes, setSegundosRestantes] = useState(null);
  const [esNuevaSeccion, setEsNuevaSeccion] = useState(false);
  const seccionActualRef = useRef(null);
  const mapaScrollRef = useRef(null); // contenedor con scroll interno del mapa de preguntas
  const circuloActualRef = useRef(null); // circulito actual dentro del panel de escritorio
  const circuloActualRefMovil = useRef(null); // circulito actual dentro del modal de móvil

  const [historial, setHistorial] = useState(null);
  const [resultadoHistorico, setResultadoHistorico] = useState(null);
  const [cargandoHistorico, setCargandoHistorico] = useState(false);
  const [enProgreso, setEnProgreso] = useState(null); // { examenId, total, respondidas } o null si no hay examen a medias
  const [modalFinalizar, setModalFinalizar] = useState(null); // { faltan } o null: confirmación propia (no window.confirm) al finalizar con preguntas pendientes
  const [modalTerminado, setModalTerminado] = useState(false); // true cuando ya contestó todas y le ofrecemos finalizar
  const [mapaAbiertoMovil, setMapaAbiertoMovil] = useState(false); // ventana emergente del mapa en celular
  // Posición de la burbuja flotante del mapa en móvil (arrastrable con el
  // dedo, como el burbujeo de Messenger). Se guarda en localStorage para
  // que la próxima vez que entre al examen se acuerde dónde la dejó.
  const [burbujaPos, setBurbujaPos] = useState({ right: 20, bottom: 90 });
  const burbujaPosRef = useRef(burbujaPos);
  const arrastreRef = useRef({ activo: false, movida: false, inicioX: 0, inicioY: 0 });
  const [avisoSalidaPantalla, setAvisoSalidaPantalla] = useState(false); // banner al regresar de cambiar de pestaña/app

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
        cargarEnProgreso();
        setCargando(false);
        // Verifica si la lectura ya se puede mostrar (solo si el diagnóstico
        // se terminó en una sesión ANTERIOR, no en esta misma).
        fetch('/api/lectura/estado')
          .then((r) => r.json())
          .then((d) => setLecturaDisponibleAhora(!!d.disponible))
          .catch(() => {});
      })
      .catch(() => router.push('/login'));

    fetch('/api/config/publico')
      .then((res) => res.json())
      .then((data) => {
        setUmbralAprobacion(data.umbralAprobacion);
        setIntentosPermitidos(data.intentosPermitidos ?? 0);
        setInstruccionesExamen(data.instrucciones || null);
      })
      .catch(() => {}); // si falla, se queda con los valores por defecto

    try {
      const guardada = localStorage.getItem('montebello_burbuja_pos');
      if (guardada) {
        const pos = JSON.parse(guardada);
        setBurbujaPos(pos);
        burbujaPosRef.current = pos;
      }
    } catch (e) {
      // sin problema, se queda en la posición por defecto
    }
  }, []);

  async function cargarHistorial() {
    const res = await fetch('/api/examen/historial');
    if (res.ok) setHistorial(await res.json());
  }

  async function cargarEnProgreso() {
    const res = await fetch('/api/examen/en-progreso');
    if (res.ok) setEnProgreso(await res.json());
  }

  async function verResultadoHistorico(id) {
    setCargandoHistorico(true);
    const res = await fetch(`/api/examen/resultado?examenId=${id}`);
    const data = await res.json();
    setCargandoHistorico(false);
    setResultadoHistorico(data);
  }

  async function iniciarExamen() {
    if (cargando) return; // evita doble clic: ya hay una petición en curso
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
    seccionActualRef.current = null; // nuevo examen: reinicia la detección de cambio de sección
    // El mapa y la primera pregunta se piden EN PARALELO (antes se esperaba
    // el mapa completo para recién ahí pedir la pregunta, agregando una
    // vuelta más de espera). El endpoint de "pregunta" ya sabe elegir la
    // primera sin responder por su cuenta cuando no se le indica cuál,
    // así que no necesita depender del mapa para eso.
    cargarMapa(data.examenId);
    cargarPregunta(data.examenId);
  }

  function claveDeSeccion(data) {
    return data.lectura ? `lectura-${data.lectura.id}` : `categoria-${data.categoria}`;
  }

  // Aplana el mapa (agrupado por materia) en una sola lista, en el mismo
  // orden en que se presenta el examen. Se usa para saber "cuál sigue",
  // "en qué posición voy" y el total/contestadas para la barra de progreso.
  function aplanarMapa(mapaData) {
    return mapaData ? mapaData.categorias.flatMap((c) => c.bloques.flatMap((b) => b.items)) : [];
  }

  function primeraSinResponder(mapaData) {
    const flat = aplanarMapa(mapaData);
    const sinResponder = flat.find((i) => !i.respondida);
    return (sinResponder || flat[0])?.examenReactivoId || null;
  }

  async function cargarMapa(id) {
    try {
      const res = await fetch(`/api/examen/mapa?examenId=${id}`);
      const data = await res.json();
      if (res.ok) {
        setMapa(data);
        return data;
      }
    } catch (e) {
      // si falla, simplemente no se actualiza el mapa de circulitos; no es crítico
    }
    return null;
  }

  async function cargarPregunta(id, examenReactivoId) {
    try {
      const url = examenReactivoId
        ? `/api/examen/pregunta?examenId=${id}&examenReactivoId=${examenReactivoId}`
        : `/api/examen/pregunta?examenId=${id}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      if (data.terminado) {
        finalizarExamen(id);
        return;
      }
      const clave = claveDeSeccion(data);
      setEsNuevaSeccion(seccionActualRef.current !== null && seccionActualRef.current !== clave);
      seccionActualRef.current = clave;
      setPregunta(data);
      setSeleccion(data.opcionSeleccionadaId || null);
      setAvisoSalidaPantalla(false);
    } catch (e) {
      setError('No se pudo cargar la pregunta — revisa tu conexión a internet. Tu progreso está guardado, puedes reintentar.');
    }
  }

  // Guarda la selección actual solo si cambió respecto a lo que ya estaba
  // guardado para esta pregunta (evita llamadas de más al solo pasar de
  // pregunta sin haber tocado nada).
  async function guardarSeleccionActual() {
    if (!pregunta || seleccion == null || seleccion === pregunta.opcionSeleccionadaId) return true;
    try {
      const res = await fetch('/api/examen/responder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examenReactivoId: pregunta.examenReactivoId, opcionId: seleccion }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error);
        return false;
      }
      return true;
    } catch (e) {
      setError('No se pudo guardar tu respuesta — revisa tu conexión a internet e intenta de nuevo.');
      return false;
    }
  }

  // Botón "Siguiente": guarda si hace falta y avanza a la pregunta que sigue
  // en el examen (sin importar si ya estaba contestada o no).
  async function irASiguiente() {
    setError('');
    setEnviando(true);
    const idActual = pregunta.examenReactivoId;
    const guardadoOk = await guardarSeleccionActual();
    if (!guardadoOk) {
      setEnviando(false);
      return;
    }
    const mapaData = await cargarMapa(examenId);
    const flat = aplanarMapa(mapaData);
    const idx = flat.findIndex((i) => i.examenReactivoId === idActual);
    const hayUnaSiguiente = idx >= 0 && idx < flat.length - 1;

    if (hayUnaSiguiente) {
      await cargarPregunta(examenId, flat[idx + 1].examenReactivoId);
    } else {
      // No hay "siguiente" en orden — si aún queda alguna sin contestar en
      // cualquier otra parte del examen, la buscamos y saltamos ahí en vez
      // de dejar al alumno trabado en la última pregunta sin avisarle nada.
      const primeraSinContestar = flat.find((i) => !i.respondida);
      if (primeraSinContestar) {
        await cargarPregunta(examenId, primeraSinContestar.examenReactivoId);
      } else {
        // Ya no queda ninguna: felicitamos y ofrecemos finalizar de una vez.
        setModalTerminado(true);
      }
    }
    setEnviando(false);
  }

  // Clic en un circulito del mapa: guarda la selección pendiente (si hay) y
  // salta directo a esa pregunta, contestada o no.
  async function irAPregunta(examenReactivoId) {
    if (pregunta && examenReactivoId === pregunta.examenReactivoId) return;
    setError('');
    const guardadoOk = await guardarSeleccionActual();
    if (!guardadoOk) return;
    await cargarMapa(examenId);
    await cargarPregunta(examenId, examenReactivoId);
  }

  async function confirmarFinalizar() {
    setError('');
    const guardadoOk = await guardarSeleccionActual();
    if (!guardadoOk) return;
    const mapaData = await cargarMapa(examenId);
    const flat = aplanarMapa(mapaData);
    const faltan = flat.filter((i) => !i.respondida).length;
    if (faltan > 0) {
      setModalFinalizar({ faltan });
      return;
    }
    finalizarExamen(examenId);
  }

  async function finalizarExamen(id) {
    const res = await fetch(`/api/examen/resultado?examenId=${id}`, { method: 'POST' });
    const data = await res.json();
    setResultado(data);
    setPregunta(null);
    setMapa(null);
    setEnProgreso(null);
    cargarHistorial();
  }

  // Cronómetro de cuenta regresiva: se calcula a partir de cuándo inició el examen
  // (no del reloj del navegador del alumno), así que no se puede "hacer trampa"
  // cerrando y reabriendo la pestaña.
  useEffect(() => {
    if (!pregunta || !pregunta.iniciadoEn || !pregunta.tiempoLimiteMinutos) {
      setSegundosRestantes(null);
      return;
    }
    function calcularRestante() {
      const finLimite = new Date(pregunta.iniciadoEn).getTime() + pregunta.tiempoLimiteMinutos * 60 * 1000;
      const restante = Math.max(0, Math.floor((finLimite - Date.now()) / 1000));
      setSegundosRestantes(restante);
      if (restante <= 0 && examenId) {
        finalizarExamen(examenId);
      }
    }
    calcularRestante();
    const intervalo = setInterval(calcularRestante, 1000);
    return () => clearInterval(intervalo);
  }, [pregunta?.examenReactivoId]);

  // Al entrar a una lectura/sección nueva, sube la pantalla hasta arriba. Sin
  // esto, si el alumno estaba desplazado hacia abajo (cerca del botón
  // "Siguiente") en la lectura anterior, no ve el inicio del texto nuevo a
  // menos que suba manualmente. Dentro de la misma lectura no se mueve la
  // pantalla, para no ser intrusivos en cada pregunta.
  useEffect(() => {
    if (!pregunta || !esNuevaSeccion) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pregunta?.examenReactivoId, esNuevaSeccion]);

  // Cada vez que cambia la pregunta activa, trae el circulito de esa
  // pregunta a la vista DENTRO del mapa de preguntas (que ahora tiene su
  // propio scroll interno cuando hay muchas preguntas), sin mover la
  // página completa. Así no hay que buscarlo manualmente cuando el mapa
  // es más alto que la pantalla. Se hace para el panel de escritorio y para
  // el modal de móvil por separado (solo uno de los dos estará montado a la
  // vez en la práctica, pero por seguridad se revisan ambos).
  useEffect(() => {
    if (circuloActualRef.current && mapaScrollRef.current) {
      circuloActualRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    if (circuloActualRefMovil.current) {
      circuloActualRefMovil.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [pregunta?.examenReactivoId]);

  // Detecta cuando el alumno sale de la pantalla del examen (cambia de
  // pestaña, minimiza, cambia de app en el celular) mientras el examen sigue
  // activo. No bloquea nada — solo lo registra (queda visible para el admin
  // en el detalle del alumno) y le muestra un aviso al regresar.
  useEffect(() => {
    if (!examenId || !pregunta) return;
    function alCambiarVisibilidad() {
      if (document.hidden) {
        fetch('/api/examen/registrar-salida', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ examenId }),
        }).catch(() => {}); // si falla por conexión, no es crítico, no interrumpe el examen
      } else {
        setAvisoSalidaPantalla(true);
      }
    }
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    return () => document.removeEventListener('visibilitychange', alCambiarVisibilidad);
  }, [examenId, !!pregunta]);

  // El aviso de "saliste de la pantalla" es un toast flotante que no debe
  // quedarse estorbando para siempre: se cierra solo a los 15s (con barrita
  // de progreso), aunque el alumno también lo puede cerrar antes con la X.
  useEffect(() => {
    if (!avisoSalidaPantalla) return;
    const t = setTimeout(() => setAvisoSalidaPantalla(false), 15000);
    return () => clearTimeout(t);
  }, [avisoSalidaPantalla]);

  function formatearTiempo(segundos) {
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  async function cerrarSesion() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (cargando) return <PantallaCarga mensaje="Cargando tu información..." />;

  // ---- Pantalla de resultado (examen recién terminado) ----
  if (resultado) {
    return (
      <div style={{ maxWidth: 780, margin: '40px auto', fontFamily: 'sans-serif', padding: 24 }}>
        <h1 style={{ textAlign: 'center', marginBottom: 24 }}>Resultado del diagnóstico</h1>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <BoletaOficial
            alumno={alumno}
            folio={resultado.examenId}
            fecha={new Date()}
            porCategoria={resultado.porCategoria}
            total={resultado.general.total}
            correctas={resultado.general.correctas}
            porcentaje={resultado.general.porcentaje}
            umbral={umbralAprobacion}
          />
        </div>

        <div className="ocultar-al-imprimir" style={{ textAlign: 'center', marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setResultado(null); }}
            style={{ padding: '8px 16px', background: '#4a90d9', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            Ver mi panel
          </button>
          <button onClick={() => window.print()} style={{ padding: '8px 16px' }}>🖨️ Imprimir / Guardar PDF</button>
          <button onClick={cerrarSesion} style={{ padding: '8px 16px' }}>Cerrar sesión</button>
        </div>
      </div>
    );
  }

  // Arrastre de la burbuja flotante del mapa en móvil (Pointer Events sirve
  // tanto para dedo/touch como mouse). Distingue "toco para abrir el mapa"
  // de "arrastro para moverla": si el dedo se movió más de unos pocos
  // pixeles, se cuenta como arrastre y el click de apertura no se dispara.
  function iniciarArrastreBurbuja(e) {
    arrastreRef.current = { activo: true, movida: false, inicioX: e.clientX, inicioY: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function moverBurbuja(e) {
    if (!arrastreRef.current.activo) return;
    const dx = e.clientX - arrastreRef.current.inicioX;
    const dy = e.clientY - arrastreRef.current.inicioY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) arrastreRef.current.movida = true;
    if (!arrastreRef.current.movida) return;
    const tam = 56;
    const margen = 8;
    const nuevaRight = Math.min(
      window.innerWidth - tam - margen,
      Math.max(margen, window.innerWidth - e.clientX - tam / 2)
    );
    const nuevaBottom = Math.min(
      window.innerHeight - tam - margen,
      Math.max(margen, window.innerHeight - e.clientY - tam / 2)
    );
    const nuevaPos = { right: nuevaRight, bottom: nuevaBottom };
    burbujaPosRef.current = nuevaPos;
    setBurbujaPos(nuevaPos);
  }
  function soltarBurbuja() {
    if (arrastreRef.current.movida) {
      try { localStorage.setItem('montebello_burbuja_pos', JSON.stringify(burbujaPosRef.current)); } catch (e) {}
    }
    arrastreRef.current.activo = false;
  }

  // Arma la lista de materias/lecturas/circulitos del mapa de preguntas.
  // Recibe qué "ref" usar para el circulito activo (uno para el panel de
  // escritorio, otro para el modal de móvil, nunca los dos montados a la
  // vez de verdad) y un callback opcional que se dispara al tocar un
  // circulito (se usa para cerrar el modal en móvil tras saltar de pregunta).
  function contenidoMapa(refCirculoActual, alTocarCirculo) {
    if (!mapa) return null;
    return mapa.categorias.map((cat) => (
      <div key={cat.nombre} style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontWeight: 700 }}>{cat.nombre}</div>
        {cat.bloques.map((bloque, idxBloque) => {
          const primero = bloque.items[0]?.numero;
          const ultimo = bloque.items[bloque.items.length - 1]?.numero;
          const rango = primero === ultimo ? `${primero}` : `${primero}-${ultimo}`;
          return (
            <div key={idxBloque} style={{ marginBottom: 8 }}>
              {bloque.titulo && (
                <div style={{ fontSize: 10, color: '#4a90d9', marginBottom: 4, fontStyle: 'italic' }}>
                  📘 {bloque.titulo} ({rango})
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {bloque.items.map((it) => {
                  const esActual = it.examenReactivoId === pregunta.examenReactivoId;
                  return (
                    <button
                      key={it.examenReactivoId}
                      ref={esActual ? refCirculoActual : null}
                      onClick={() => { irAPregunta(it.examenReactivoId); alTocarCirculo?.(); }}
                      title={`Pregunta ${it.numero}${it.respondida ? ' — ya contestada' : ' — sin contestar'}${bloque.titulo ? ` (${bloque.titulo})` : ''}`}
                      style={{
                        width: 30, height: 30, borderRadius: '50%', fontSize: 12, fontWeight: 'bold',
                        border: esActual ? '2px solid #4a90d9' : '1px solid #ccc',
                        background: it.respondida ? '#2e7d32' : '#fff',
                        color: it.respondida ? '#fff' : '#666',
                        cursor: 'pointer', padding: 0, flexShrink: 0,
                      }}
                    >
                      {it.numero}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    ));
  }

  // ---- Pantalla de presentación de pregunta ----
  if (pregunta) {
    const tiempoBajo = segundosRestantes !== null && segundosRestantes <= 300; // últimos 5 min
    const flatList = aplanarMapa(mapa);
    const totalPreguntas = flatList.length;
    const respondidasCount = flatList.filter((i) => i.respondida).length;
    const posicionActual = flatList.findIndex((i) => i.examenReactivoId === pregunta.examenReactivoId) + 1;

    return (
      <div style={{ maxWidth: pregunta.lectura ? 1400 : 860, margin: '40px auto', fontFamily: 'sans-serif', padding: 24, display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {avisoSalidaPantalla && (
          <div
            style={{
              position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 1200,
              width: '92%', maxWidth: 640,
            }}
          >
            <div
              style={{
                position: 'relative', display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 13, fontWeight: 500, color: '#8a6416', background: '#fdf3e3', border: '1px solid #f0dfae',
                padding: '12px 14px 16px', borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                overflow: 'hidden',
              }}
            >
              <span>⚠️</span>
              <span style={{ flex: 1 }}>Se detectó que saliste de la pantalla del examen. Esto queda registrado.</span>
              <span className="aviso-cierre-texto" style={{ fontSize: 11, opacity: 0.65, flexShrink: 0 }}>Se cierra en 15s</span>
              <button
                onClick={() => setAvisoSalidaPantalla(false)}
                style={{
                  width: 22, height: 22, flexShrink: 0, border: 'none', background: '#f0dfae', borderRadius: '50%',
                  cursor: 'pointer', color: '#8a6416', fontSize: 14, lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ×
              </button>
              <div style={{ position: 'absolute', bottom: 0, left: 8, right: 8, height: 2, background: '#f0dfae', borderRadius: 2, overflow: 'hidden' }}>
                <div className="barra-cierre-aviso" style={{ height: '100%', background: '#d6a532' }} />
              </div>
            </div>
          </div>
        )}
        {pregunta.lectura && (
          <div className="columna-lectura" style={{ flex: '1 1 400px', minWidth: 0, order: 1 }}>
            {pregunta.lectura.instruccion && (
              <div style={{ background: '#eaf2fb', border: '1px solid #cfe0f5', borderRadius: 8, padding: '12px 16px', marginBottom: 14, fontSize: 14, color: '#2a5f9e', lineHeight: 1.5 }}>{renderizarHTMLconMatematicas(pregunta.lectura.instruccion)}</div>
            )}
            <div className="panel-lectura" style={{ background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: 8, padding: 20 }}>
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
              <div style={{ fontSize: 15, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{renderizarHTMLconMatematicas(pregunta.lectura.texto)}</div>
            </div>
          </div>
        )}

        <div style={{ flex: '1 1 480px', minWidth: 0, order: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#666', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
            <span>{pregunta.categoria}</span>
            {totalPreguntas > 0 && <span>Pregunta {posicionActual} de {totalPreguntas}</span>}
            {segundosRestantes !== null && (
              <span
                style={{
                  fontWeight: 'bold', padding: '2px 10px', borderRadius: 20,
                  background: tiempoBajo ? '#fdeceb' : '#f4f4f4',
                  color: tiempoBajo ? '#c0392b' : '#555',
                }}
              >
                ⏱ {formatearTiempo(segundosRestantes)}
              </span>
            )}
          </div>
          {totalPreguntas > 0 && (
            <div style={{ background: '#eee', borderRadius: 6, height: 6, marginBottom: 20 }}>
              <div style={{ width: `${(respondidasCount / totalPreguntas) * 100}%`, height: '100%', background: '#4a90d9', borderRadius: 6 }} />
            </div>
          )}

          {esNuevaSeccion && (
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 14, fontWeight: 600, color: '#fff', background: '#4a90d9',
                padding: '7px 16px', borderRadius: 20, marginBottom: 14,
                boxShadow: '0 2px 6px rgba(74,144,217,0.3)',
              }}
            >
              {pregunta.lectura ? '📘 Nueva lectura' : '📄 Nueva sección'}
            </div>
          )}

          
          <div style={{ border: '1px solid #e0e0e0', borderRadius: 10, padding: '20px 22px', background: '#fff', marginBottom: 12 }}>
            <div style={{ fontSize: 17, marginBottom: 16, lineHeight: 1.5 }}>{renderizarHTMLconMatematicas(pregunta.pregunta)}</div>
            {pregunta.imagenUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pregunta.imagenUrl} alt="" style={{ maxWidth: '100%', marginBottom: 16 }} />
            )}

            {pregunta.opciones.map((o, idx) => (
              <label
                key={o.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12, marginBottom: 8,
                  border: `1px solid ${seleccion === o.id ? '#4a90d9' : '#ddd'}`,
                  borderRadius: 6, background: seleccion === o.id ? '#eef4fb' : '#fff', cursor: 'pointer',
                }}
              >
                <input type="radio" name="opcion" checked={seleccion === o.id} onChange={() => setSeleccion(o.id)} style={{ marginTop: 3, flexShrink: 0 }} />
                <span style={{ fontWeight: 'bold', flexShrink: 0 }}>{String.fromCharCode(97 + idx)})</span>
                <span>
                  <span>{renderizarHTMLconMatematicas(/^<p[\s>]|ql-formula/.test(o.texto) ? o.texto : renderizarExponentes(o.texto))}</span>
                  {o.imagen_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={o.imagen_url} alt="" style={{ display: 'block', maxWidth: '100%', marginTop: 6 }} />
                  )}
                </span>
              </label>
            ))}
          </div>

          {error && <p style={{ color: '#c0392b' }}>{error}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={irASiguiente}
              disabled={!seleccion || enviando}
              className="btn-siguiente"
              style={{ width: '100%', padding: 12, marginTop: 12, background: '#4a90d9', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: !seleccion || enviando ? 0.6 : 1 }}
            >
              {enviando ? 'Guardando...' : 'Siguiente'}
            </button>
          </div>
        </div>

        {/* Mapa de preguntas — versión escritorio: panel lateral fijo, se
            oculta en pantallas angostas (ver .panel-mapa-escritorio en el
            <style> de más abajo) porque ahí es mejor un botón flotante que
            no le quite espacio a la pregunta. */}
        <div className="panel-mapa-escritorio" style={{ width: 220, flexShrink: 0, order: 3 }}>
          <div
            ref={mapaScrollRef}
            style={{
              position: 'sticky', top: 20, background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: 8, padding: 14,
              maxHeight: 'calc(100vh - 40px)', overflowY: 'auto',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Mapa de preguntas
            </div>
            {contenidoMapa(circuloActualRef)}
            <button
              onClick={confirmarFinalizar}
              style={{ marginTop: 6, width: '100%', padding: '9px', background: '#fdeceb', color: '#c0392b', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              🏁 Finalizar examen
            </button>
          </div>
        </div>

        {/* Mapa de preguntas — versión móvil: botón flotante con el conteo
            de avance, que abre el mapa completo como ventana emergente
            desde abajo, en vez de ocupar espacio fijo en pantallas
            angostas donde cada pixel de alto importa. */}
        <div
          className="boton-mapa-movil"
          onClick={() => { if (!arrastreRef.current.movida) setMapaAbiertoMovil(true); }}
          onPointerDown={iniciarArrastreBurbuja}
          onPointerMove={moverBurbuja}
          onPointerUp={soltarBurbuja}
          style={{
            display: 'none', position: 'fixed', right: burbujaPos.right, bottom: burbujaPos.bottom, zIndex: 900,
            background: '#0d3b66', color: '#fff', border: 'none', borderRadius: '50%',
            width: 56, height: 56, fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
            cursor: 'grab', alignItems: 'center', justifyContent: 'center', touchAction: 'none', userSelect: 'none',
          }}
        >
          {aplanarMapa(mapa).filter((i) => i.respondida).length}/{aplanarMapa(mapa).length}
        </div>

        {mapaAbiertoMovil && (
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
              display: 'flex', alignItems: 'flex-end',
            }}
            onClick={() => setMapaAbiertoMovil(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fff', width: '100%', maxHeight: '80vh', borderRadius: '16px 16px 0 0',
                padding: 18, overflowY: 'auto', boxShadow: '0 -4px 20px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  Mapa de preguntas
                </span>
                <button
                  onClick={() => setMapaAbiertoMovil(false)}
                  style={{ border: 'none', background: '#f0f0f0', borderRadius: 20, width: 30, height: 30, fontSize: 16, cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
              {contenidoMapa(circuloActualRefMovil, () => setMapaAbiertoMovil(false))}
              <button
                onClick={() => { setMapaAbiertoMovil(false); confirmarFinalizar(); }}
                style={{ marginTop: 10, width: '100%', padding: '11px', background: '#fdeceb', color: '#c0392b', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
              >
                🏁 Finalizar examen
              </button>
            </div>
          </div>
        )}

        {/* Modal propio de confirmación (en vez de window.confirm nativo del
            navegador) al finalizar con preguntas sin responder. */}
        {modalFinalizar && (
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 20, zIndex: 1000,
            }}
          >
            <div style={{ background: '#fff', borderRadius: 12, padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: 18 }}>Todavía no terminas</h3>
              <p style={{ color: '#555', fontSize: 14, lineHeight: 1.5, marginBottom: 22 }}>
                Te falta{modalFinalizar.faltan === 1 ? '' : 'n'}{' '}
                <strong>{modalFinalizar.faltan} pregunta{modalFinalizar.faltan === 1 ? '' : 's'}</strong> por responder.
                Si finalizas ahora, esas quedarán como incorrectas y no podrás volver a responderlas.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setModalFinalizar(null)}
                  style={{ flex: 1, minWidth: 140, padding: '10px 16px', background: '#eef1f5', color: '#333', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
                >
                  Seguir respondiendo
                </button>
                <button
                  onClick={() => { setModalFinalizar(null); finalizarExamen(examenId); }}
                  style={{ flex: 1, minWidth: 140, padding: '10px 16px', background: '#c0392b', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
                >
                  Finalizar de todas formas
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Aviso de felicitación cuando ya contestó todas las preguntas del
            examen, con la opción de finalizar ahí mismo. */}
        {modalTerminado && (
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 20, zIndex: 1000,
            }}
          >
            <div style={{ background: '#fff', borderRadius: 12, padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: 19 }}>¡Ya contestaste todo!</h3>
              <p style={{ color: '#555', fontSize: 14, lineHeight: 1.5, marginBottom: 22 }}>
                Respondiste las {aplanarMapa(mapa).length} preguntas del examen. Si quieres repasar alguna
                antes de entregar, usa el mapa de preguntas de la derecha. Cuando estés listo, finaliza tu examen.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setModalTerminado(false)}
                  style={{ flex: 1, minWidth: 140, padding: '10px 16px', background: '#eef1f5', color: '#333', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
                >
                  Repasar mis respuestas
                </button>
                <button
                  onClick={() => { setModalTerminado(false); finalizarExamen(examenId); }}
                  style={{ flex: 1, minWidth: 140, padding: '10px 16px', background: '#4a90d9', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
                >
                  🏁 Finalizar examen
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          .barra-cierre-aviso {
            animation: barraCierreAviso 15s linear forwards;
          }
          @keyframes barraCierreAviso {
            from { width: 100%; }
            to { width: 0%; }
          }
          @media (max-width: 480px) {
            .aviso-cierre-texto { display: none; }
          }
          .panel-lectura {
            max-height: none;
          }
          @media (min-width: 900px) {
            .panel-lectura {
              max-height: 420px;
              overflow-y: auto;
            }
            .btn-siguiente {
              width: auto !important;
              min-width: 160px;
              padding-left: 32px !important;
              padding-right: 32px !important;
            }
          }
          /* Escritorio de verdad (≥1100px, hay espacio para las 3 columnas
             lectura + pregunta + mapa a la vez, como el EXANI oficial): la
             lectura deja de tener su cajita chica con scroll interno y en
             vez de eso toda su columna es la que hace scroll, fija en su
             lugar mientras te mueves por las preguntas. */
          @media (min-width: 1100px) {
            .columna-lectura {
              position: sticky;
              top: 20px;
              align-self: flex-start;
              max-height: calc(100vh - 40px);
              overflow-y: auto;
            }
            .panel-lectura {
              max-height: none !important;
              overflow-y: visible !important;
            }
          }
          /* Mapa de preguntas: panel fijo en pantallas anchas, burbuja
             flotante arrastrable + ventana emergente en pantallas angostas
             (celular Y tablet en vertical — normalmente ~768-820px de
             ancho, donde el panel lateral de 220px ya no cabe cómodo junto
             al contenido). */
          @media (max-width: 820px) {
            .panel-mapa-escritorio {
              display: none !important;
            }
            .boton-mapa-movil {
              display: flex !important;
            }
          }
        `}</style>
      </div>
    );
  }

  // ---- Ver el detalle de un intento pasado ----
  if (resultadoHistorico) {
    const alertaHist = resultadoHistorico.salidasPantalla > 0
      ? `Salió de pantalla ${resultadoHistorico.salidasPantalla} ${resultadoHistorico.salidasPantalla === 1 ? 'vez' : 'veces'}`
      : null;

    return (
      <div className="pagina-detalle-intento" style={{ maxWidth: 780, margin: '40px auto', fontFamily: 'sans-serif', padding: 24 }}>
        <button
          onClick={() => setResultadoHistorico(null)}
          className="ocultar-al-imprimir"
          style={{ background: 'transparent', border: 'none', color: '#4a90d9', cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 24, display: 'block' }}
        >
          ← Volver al panel
        </button>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <BoletaOficial
            alumno={alumno}
            folio={resultadoHistorico.examenId}
            fecha={resultadoHistorico.finalizadoEn}
            porCategoria={resultadoHistorico.porCategoria}
            total={resultadoHistorico.total}
            correctas={resultadoHistorico.correctas}
            porcentaje={resultadoHistorico.porcentaje}
            umbral={umbralAprobacion}
            alerta={alertaHist}
          />
        </div>

        <div className="ocultar-al-imprimir" style={{ textAlign: 'center', marginTop: 20 }}>
          <button onClick={() => window.print()} style={{ padding: '8px 16px' }}>🖨️ Imprimir / Descargar PDF</button>
        </div>

        <style jsx global>{`
          @media print {
            .pagina-detalle-intento { margin: 0 !important; padding: 0 !important; }
          }
        `}</style>
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
          <div style={{ flex: 1, minWidth: 140, background: '#f4f4f4', borderRadius: 10, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#333' }}>{historial.length}</div>
            <div style={{ fontSize: 12, color: '#666' }}>Intentos realizados</div>
          </div>
          <div style={{ flex: 1, minWidth: 140, background: mejor >= umbralAprobacion ? '#eafaf1' : '#fdeceb', borderRadius: 10, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: mejor >= umbralAprobacion ? '#2e7d32' : '#c0392b' }}>{mejor}%</div>
            <div style={{ fontSize: 12, color: '#666' }}>Mejor resultado</div>
          </div>
          <div style={{ flex: 1, minWidth: 140, background: masReciente.porcentaje >= umbralAprobacion ? '#eafaf1' : '#fdeceb', borderRadius: 10, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: masReciente.porcentaje >= umbralAprobacion ? '#2e7d32' : '#c0392b' }}>{masReciente.porcentaje}%</div>
            <div style={{ fontSize: 12, color: '#666' }}>Último intento</div>
          </div>
        </div>
      )}

      {/* Instrucciones del examen: separadas a propósito de las lecturas —
          son las reglas generales, no texto de comprensión lectora. Solo se
          muestran si el instituto las configuró. */}
      {instruccionesExamen && (
        <div style={{ marginBottom: 32, padding: 20, background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            📋 Instrucciones del examen
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: '#333' }}>{renderizarHTMLconMatematicas(instruccionesExamen)}</div>
        </div>
      )}

      {/* Botón para nuevo examen / continuar uno a medias / mensaje de límite alcanzado */}
      {(() => {
        const yaAlcanzoLimite = intentosPermitidos > 0 && historial && historial.length >= intentosPermitidos;

        // Si hay un examen sin terminar, siempre se prioriza continuarlo —
        // esto no cuenta como un intento nuevo, así que va antes que el
        // mensaje de "ya alcanzaste el límite de intentos".
        if (enProgreso && enProgreso.examenId) {
          return (
            <div style={{ textAlign: 'center', marginBottom: 40, padding: 28, background: '#eaf2fb', borderRadius: 12 }}>
              <p style={{ color: '#3a5b7a', marginBottom: 4, fontSize: 15 }}>
                Tienes un examen sin terminar.
              </p>
              {enProgreso.total > 0 && (
                <p style={{ color: '#6a8bab', marginBottom: 16, fontSize: 13 }}>
                  Llevas {enProgreso.respondidas} de {enProgreso.total} preguntas contestadas.
                </p>
              )}
              <button
                onClick={iniciarExamen}
                disabled={cargando}
                style={{ padding: '12px 28px', background: cargando ? '#a9c6e8' : '#4a90d9', color: '#fff', border: 'none', borderRadius: 8, cursor: cargando ? 'default' : 'pointer', fontSize: 16, fontWeight: 600 }}
              >
                {cargando ? 'Cargando…' : 'Continuar examen'}
              </button>
            </div>
          );
        }

        if (yaAlcanzoLimite) {
          return (
            <div style={{ textAlign: 'center', marginBottom: 40, padding: 28, background: '#fdf3e3', borderRadius: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
              <p style={{ color: '#8a6416', margin: '0 0 16px 0', fontSize: 15 }}>
                Ya presentaste tu examen de diagnóstico. Puedes consultar tu resultado abajo en el historial.
              </p>
              {lecturaDisponibleAhora && (
                <a
                  href="/lectura"
                  style={{ display: 'inline-block', padding: '10px 22px', background: '#4a90d9', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
                >
                  📖 Continuar con la lectura
                </a>
              )}
            </div>
          );
        }

        return (
          <div style={{ textAlign: 'center', marginBottom: 40, padding: 28, background: '#eaf2fb', borderRadius: 12 }}>
            <p style={{ color: '#3a5b7a', marginBottom: 16, fontSize: 15 }}>
              {historial && historial.length > 0
                ? '¿Listo para presentar un nuevo diagnóstico?'
                : 'Aún no has presentado tu examen de diagnóstico.'}
            </p>
            <button
              onClick={iniciarExamen}
              disabled={cargando}
              style={{ padding: '12px 28px', background: cargando ? '#a9c6e8' : '#4a90d9', color: '#fff', border: 'none', borderRadius: 8, cursor: cargando ? 'default' : 'pointer', fontSize: 16, fontWeight: 600 }}
            >
              {cargando ? 'Cargando…' : 'Iniciar examen'}
            </button>
          </div>
        );
      })()}

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
