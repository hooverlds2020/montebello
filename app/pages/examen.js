import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import DonaResultado from '../components/DonaResultado';


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

  const [historial, setHistorial] = useState(null);
  const [resultadoHistorico, setResultadoHistorico] = useState(null);
  const [cargandoHistorico, setCargandoHistorico] = useState(false);
  const [enProgreso, setEnProgreso] = useState(null); // { examenId, total, respondidas } o null si no hay examen a medias
  const [modalFinalizar, setModalFinalizar] = useState(null); // { faltan } o null: confirmación propia (no window.confirm) al finalizar con preguntas pendientes

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
    const siguienteId = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1].examenReactivoId : idActual;
    await cargarPregunta(examenId, siguienteId);
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

  // ---- Pantalla de presentación de pregunta ----
  if (pregunta) {
    const tiempoBajo = segundosRestantes !== null && segundosRestantes <= 300; // últimos 5 min
    const flatList = aplanarMapa(mapa);
    const totalPreguntas = flatList.length;
    const respondidasCount = flatList.filter((i) => i.respondida).length;
    const posicionActual = flatList.findIndex((i) => i.examenReactivoId === pregunta.examenReactivoId) + 1;

    return (
      <div style={{ maxWidth: pregunta.lectura ? 980 : 860, margin: '40px auto', fontFamily: 'sans-serif', padding: 24, display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
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
              <div style={{ fontSize: 15, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: pregunta.lectura.texto }} />
            </div>
          )}

          <div style={{ fontSize: 17, marginBottom: 16, lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: pregunta.pregunta }} />
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
                {o.texto}
                {o.imagen_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.imagen_url} alt="" style={{ display: 'block', maxWidth: '100%', marginTop: 6 }} />
                )}
              </span>
            </label>
          ))}

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

        {/* Mapa de preguntas: circulitos por materia para ver de un vistazo
            cuáles ya están contestadas y saltar directo a cualquiera. */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <div style={{ position: 'sticky', top: 20, background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Mapa de preguntas
            </div>
            {mapa && mapa.categorias.map((cat) => (
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
                              onClick={() => irAPregunta(it.examenReactivoId)}
                              title={`Pregunta ${it.numero}${it.respondida ? ' — ya contestada' : ' — sin contestar'}${bloque.titulo ? ` (${bloque.titulo})` : ''}`}
                              style={{
                                width: 28, height: 28, borderRadius: '50%', fontSize: 11, fontWeight: 'bold',
                                border: esActual ? '2px solid #4a90d9' : '1px solid #ccc',
                                background: it.respondida ? '#2e7d32' : '#fff',
                                color: it.respondida ? '#fff' : '#666',
                                cursor: 'pointer', padding: 0,
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
            ))}
            <button
              onClick={confirmarFinalizar}
              style={{ marginTop: 6, width: '100%', padding: '9px', background: '#fdeceb', color: '#c0392b', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              🏁 Finalizar examen
            </button>
          </div>
        </div>

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
          <div style={{ fontSize: 14, lineHeight: 1.6, color: '#333' }} dangerouslySetInnerHTML={{ __html: instruccionesExamen }} />
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
