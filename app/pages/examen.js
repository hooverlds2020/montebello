import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import DonaResultado from '../components/DonaResultado';
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
    const mapaData = await cargarMapa(data.examenId);
    const primera = primeraSinResponder(mapaData);
    cargarPregunta(data.examenId, primera);
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

  function formatearTiempo(segundos) {
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  async function cerrarSesion() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (cargando) return null;

  // ---- Pantalla de resultado (examen recién terminado) ----
  if (resultado) {
    const urlVerificacion = typeof window !== 'undefined'
      ? `${window.location.origin}/verificar?folio=${resultado.examenId}`
      : '';
    const urlQr = urlVerificacion
      ? `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(urlVerificacion)}`
      : '';

    return (
      <div style={{ maxWidth: 640, margin: '40px auto', fontFamily: 'sans-serif', padding: 24 }}>
        {/* Membrete de impresión: logo+instituto a la izquierda, alumno+fecha a la derecha */}
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
              <div>{alumno?.nombre}</div>
              <div>{new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>
        </div>

        <h1 style={{ textAlign: 'center', marginBottom: 32 }}>Resultado del diagnóstico</h1>
        <DonaResultado resultado={resultado} />

        {/* QR de verificación: solo en impresión, esquina inferior derecha */}
        <div className="solo-impresion" style={{ display: 'none', marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right', fontSize: 10, color: '#888', maxWidth: 160 }}>
              Folio #{resultado.examenId}<br />Escanea para verificar la autenticidad
            </div>
            {urlQr && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urlQr} alt="Código QR de verificación" style={{ width: 70, height: 70 }} />
            )}
          </div>
        </div>

        <div className="ocultar-al-imprimir" style={{ textAlign: 'center', marginTop: 40, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setResultado(null); }}
            style={{ padding: '8px 16px', background: '#4a90d9', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            Ver mi panel
          </button>
          <button onClick={() => window.print()} style={{ padding: '8px 16px' }}>🖨️ Imprimir / Guardar PDF</button>
          <button onClick={cerrarSesion} style={{ padding: '8px 16px' }}>Cerrar sesión</button>
        </div>
        <style jsx global>{`
          @page { margin: 15mm; }
          @media print {
            .ocultar-al-imprimir { display: none !important; }
            .solo-impresion { display: block !important; }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          }
        `}</style>
      </div>
    );
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
      <div style={{ maxWidth: pregunta.lectura ? 980 : 860, margin: '40px auto', fontFamily: 'sans-serif', padding: 24, display: 'flex', gap: 24, alignItems: 'stretch', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 480px', minWidth: 0 }}>
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

          {avisoSalidaPantalla && (
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between',
                fontSize: 13, color: '#8a6416', background: '#fdf3e3', border: '1px solid #f0dfae',
                padding: '9px 14px', borderRadius: 8, marginBottom: 14,
              }}
            >
              <span>⚠️ Se detectó que saliste de la pantalla del examen. Esto queda registrado.</span>
              <button
                onClick={() => setAvisoSalidaPantalla(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#8a6416', fontSize: 16, lineHeight: 1, flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
          )}

          {pregunta.lectura && pregunta.lectura.instruccion && (
            <div style={{ background: '#eaf2fb', border: '1px solid #cfe0f5', borderRadius: 8, padding: '12px 16px', marginBottom: 14, fontSize: 14, color: '#2a5f9e', lineHeight: 1.5 }}>{renderizarHTMLconMatematicas(pregunta.lectura.instruccion)}</div>
          )}

          {pregunta.lectura && (
            <div className="panel-lectura" style={{ background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: 8, padding: 20, marginBottom: 20 }}>
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
              <div style={{ fontSize: 15, lineHeight: 1.6 }}>{renderizarHTMLconMatematicas(pregunta.lectura.texto)}</div>
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
                  <span>{renderizarHTMLconMatematicas(renderizarExponentes(o.texto))}</span>
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
        <div className="panel-mapa-escritorio" style={{ width: 220, flexShrink: 0 }}>
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
        <button
          className="boton-mapa-movil"
          onClick={() => setMapaAbiertoMovil(true)}
          style={{
            display: 'none', position: 'fixed', bottom: 20, right: 20, zIndex: 900,
            background: '#0d3b66', color: '#fff', border: 'none', borderRadius: 30,
            padding: '12px 18px', fontSize: 14, fontWeight: 600, boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            cursor: 'pointer', alignItems: 'center', gap: 8,
          }}
        >
          🗺️ {aplanarMapa(mapa).filter((i) => i.respondida).length}/{aplanarMapa(mapa).length}
        </button>

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
          /* Mapa de preguntas: panel fijo en pantallas anchas, botón
             flotante + ventana emergente en pantallas angostas (celular Y
             tablet en vertical — normalmente ~768-820px de ancho, donde el
             panel lateral de 220px ya no cabe cómodo junto al contenido). */
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
    const urlVerifHist = typeof window !== 'undefined'
      ? `${window.location.origin}/verificar?folio=${resultadoHistorico.examenId}`
      : '';
    const urlQrHist = urlVerifHist
      ? `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(urlVerifHist)}`
      : '';

    return (
      <div style={{ maxWidth: 640, margin: '40px auto', fontFamily: 'sans-serif', padding: 24 }}>
        <button
          onClick={() => setResultadoHistorico(null)}
          className="ocultar-al-imprimir"
          style={{ background: 'transparent', border: 'none', color: '#4a90d9', cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 24, display: 'block' }}
        >
          ← Volver al panel
        </button>

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
              <div>{alumno?.nombre}</div>
              <div>{new Date(resultadoHistorico.finalizadoEn || Date.now()).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: '36px 24px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <h1 style={{ textAlign: 'center', marginTop: 0, marginBottom: 28, fontSize: 20 }}>Detalle del intento</h1>
          <DonaResultado resultado={resultadoHistorico} />

          <div className="solo-impresion" style={{ display: 'none', marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right', fontSize: 10, color: '#888', maxWidth: 160 }}>
                Folio #{resultadoHistorico.examenId}<br />Escanea para verificar la autenticidad
              </div>
              {urlQrHist && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={urlQrHist} alt="Código QR de verificación" style={{ width: 70, height: 70 }} />
              )}
            </div>
          </div>
        </div>

        <div className="ocultar-al-imprimir" style={{ textAlign: 'center', marginTop: 20 }}>
          <button onClick={() => window.print()} style={{ padding: '8px 16px' }}>🖨️ Imprimir / Descargar PDF</button>
        </div>

        <style jsx global>{`
          @page { margin: 15mm; }
          @media print {
            .ocultar-al-imprimir { display: none !important; }
            .solo-impresion { display: block !important; }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
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
                style={{ padding: '12px 28px', background: '#4a90d9', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 600 }}
              >
                Continuar examen
              </button>
            </div>
          );
        }

        if (yaAlcanzoLimite) {
          return (
            <div style={{ textAlign: 'center', marginBottom: 40, padding: 28, background: '#fdf3e3', borderRadius: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
              <p style={{ color: '#8a6416', margin: 0, fontSize: 15 }}>
                Ya presentaste tu examen de diagnóstico. Puedes consultar tu resultado abajo en el historial.
              </p>
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
              style={{ padding: '12px 28px', background: '#4a90d9', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 600 }}
            >
              Iniciar examen
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
