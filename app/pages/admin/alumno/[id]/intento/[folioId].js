import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { estaAutenticado } from '../../../../../lib/auth';

export async function getServerSideProps({ req }) {
  if (!estaAutenticado(req)) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
  return { props: {} };
}

const PALETA_MATERIAS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
const UMBRAL_POR_DEFECTO = 60;

// Igual que en el panel: la dona refleja el desglose real por materia (mismos
// colores que la tabla de abajo), no un solo color plano desconectado.
function construirGradienteDona(porCategoria, total, paleta) {
  if (!total) return `conic-gradient(#e5e7eb 0% 100%)`;
  let acumulado = 0;
  const tramos = porCategoria.map((c, i) => {
    const desde = acumulado;
    acumulado += (c.correctas / total) * 100;
    return `${paleta[i % paleta.length]} ${desde}% ${acumulado}%`;
  });
  tramos.push(`#e5e7eb ${acumulado}% 100%`);
  return `conic-gradient(${tramos.join(', ')})`;
}

export default function IntentoIndividual() {
  const router = useRouter();
  const { id, folioId, imprimir } = router.query;
  const [alumno, setAlumno] = useState(null);
  const [intento, setIntento] = useState(null);
  const [umbral, setUmbral] = useState(UMBRAL_POR_DEFECTO);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || !folioId) return;
    (async () => {
      const [resAlumno, resConfig] = await Promise.all([
        fetch(`/api/admin/alumnos/${id}`),
        fetch('/api/config/publico'),
      ]);
      if (!resAlumno.ok) {
        setError('No se pudo cargar la información de este alumno.');
        return;
      }
      const data = await resAlumno.json();
      const encontrado = data.historial.find((h) => String(h.examenId) === String(folioId));
      if (!encontrado) {
        setError('Ese intento ya no existe o fue borrado.');
        return;
      }
      setAlumno(data.alumno);
      setIntento(encontrado);
      if (resConfig.ok) {
        const cfg = await resConfig.json();
        if (cfg.umbralAprobacion) setUmbral(cfg.umbralAprobacion);
      }
    })();
  }, [id, folioId]);

  // Si llegaron con ?imprimir=1 (botón "🖨️ PDF solo este"), se abre el
  // diálogo de impresión en automático apenas todo terminó de cargar.
  useEffect(() => {
    if (imprimir === '1' && intento) {
      const t = setTimeout(() => window.print(), 500);
      return () => clearTimeout(t);
    }
  }, [imprimir, intento]);

  if (error) {
    return (
      <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <p style={{ color: '#c0392b' }}>{error}</p>
        {id && <Link href={`/admin`}>← Volver al panel</Link>}
      </div>
    );
  }

  if (!alumno || !intento) {
    return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif', color: '#888' }}>Cargando...</div>;
  }

  const aprobado = intento.porcentaje >= umbral;
  const colorPrincipal = aprobado ? '#22c55e' : '#ef4444';
  const urlVerificacion = typeof window !== 'undefined'
    ? `${window.location.origin}/verificar?folio=${intento.examenId}`
    : '';
  const urlQr = urlVerificacion
    ? `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=0&data=${encodeURIComponent(urlVerificacion)}`
    : '';

  return (
    <div className="pagina-boleta" style={{ background: '#f0f2f5', fontFamily: 'sans-serif' }}>
      <div className="no-print" style={{ maxWidth: 780, margin: '0 auto', padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Link
          href={`/admin`}
          onClick={() => { try { sessionStorage.setItem('montebello_volver_alumno_id', String(id)); } catch {} }}
          style={{ height: 40, padding: '0 16px', border: '1px solid #ddd', borderRadius: 12, background: '#fff', fontSize: 14, textDecoration: 'none', color: '#333', display: 'flex', alignItems: 'center' }}
        >
          ← Volver a {alumno.nombre}
        </Link>
        <button
          onClick={() => window.print()}
          style={{ height: 40, padding: '0 20px', border: 'none', borderRadius: 12, background: '#4a90d9', color: '#fff', fontSize: 14, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 3px rgba(74,144,217,0.3)' }}
        >
          🖨️ Imprimir este resultado
        </button>
      </div>

      {/* Esta es la boleta tal cual — lo único que se imprime. Todo lo de
          arriba (Volver / Imprimir) tiene className="no-print" y desaparece
          al imprimir. */}
      <div id="boleta" style={{ maxWidth: 780, margin: '20px auto 40px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 28 }}>
        {/* Encabezado con logo, nombre del instituto, datos del alumno y QR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, borderBottom: '3px solid #0d3b66', paddingBottom: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo-montebello.webp" alt="" style={{ width: 48, height: 'auto', flexShrink: 0 }} />
            <div>
              <h1 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0d3b66', letterSpacing: 0.3 }}>INSTITUTO EDUCATIVO MONTEBELLO</h1>
              <p style={{ margin: '3px 0 0 0', fontSize: 10, fontWeight: 'bold', color: '#555', letterSpacing: 0.5 }}>DIAGNÓSTICO DE ADMISIÓN — RESULTADO OFICIAL</p>
              <p style={{ margin: '6px 0 0 0', fontSize: 12, color: '#333' }}>
                <strong>{alumno.nombre}</strong> · {alumno.email}
              </p>
              <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#888' }}>
                Folio #{intento.examenId} · {new Date(intento.finalizadoEn).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ width: 78, height: 78, border: '1px solid #ccc', padding: 4, background: '#fff' }}>
              {urlQr && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={urlQr} alt="Código QR de verificación" style={{ width: '100%', height: '100%' }} />
              )}
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 8, color: '#999', fontFamily: 'monospace' }}>Verificar folio</p>
          </div>
        </div>

        {intento.salidasPantalla > 0 && (
          <div style={{ marginBottom: 16 }}>
            <span
              style={{
                fontSize: 11, fontWeight: 'bold', padding: '4px 10px', borderRadius: 999,
                background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a',
              }}
            >
              ⚠️ Salió de pantalla {intento.salidasPantalla} {intento.salidasPantalla === 1 ? 'vez' : 'veces'}
            </span>
          </div>
        )}

        {/* Cuerpo: dona a la izquierda, tabla de materias a la derecha (2
            columnas para que quepa todo en 1 sola hoja) */}
        <div className="boleta-grid" style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 24, alignItems: 'start' }}>
          <div>
            <div style={{ position: 'relative', width: 150, height: 150, margin: '0 auto' }}>
              <div
                style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: construirGradienteDona(intento.porCategoria, intento.total, PALETA_MATERIAS),
                }}
              />
              <div
                style={{
                  position: 'absolute', inset: 14, borderRadius: '50%', background: '#fff',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{intento.porcentaje}%</span>
                <span style={{ fontSize: 11, color: '#999', marginTop: 3 }}>{intento.correctas} de {intento.total}</span>
                <span
                  style={{
                    marginTop: 5, fontSize: 9, fontWeight: 'bold', padding: '2px 8px', borderRadius: 999,
                    background: aprobado ? '#f0faf3' : '#fef2f2', color: colorPrincipal,
                    border: `1px solid ${aprobado ? '#c8ecd3' : '#fecaca'}`,
                  }}
                >
                  {aprobado ? 'Aprobado' : 'No aprobado'}
                </span>
              </div>
            </div>
            <p style={{ textAlign: 'center', fontSize: 10, color: '#999', marginTop: 10 }}>Umbral de aprobación: {umbral}%</p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#0d3b66', color: '#fff' }}>
                <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 'bold' }}>Materia</th>
                <th style={{ padding: '8px 6px', width: 40 }}>✓</th>
                <th style={{ padding: '8px 6px', width: 40 }}>✕</th>
                <th style={{ padding: '8px 6px', width: 70 }}>Sin cont.</th>
                <th style={{ padding: '8px 6px', width: 50 }}>%</th>
              </tr>
            </thead>
            <tbody>
              {intento.porCategoria.map((c, i) => (
                <tr key={c.categoria} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: PALETA_MATERIAS[i % PALETA_MATERIAS.length], flexShrink: 0 }} />
                    {c.categoria}
                  </td>
                  <td style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 'bold', color: '#22c55e' }}>{c.correctas}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 'bold', color: '#ef4444' }}>{c.incorrectas}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'center', color: '#999' }}>{c.sinContestar}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 900 }}>{c.porcentaje}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 24, paddingTop: 10, borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#999', fontFamily: 'monospace', flexWrap: 'wrap', gap: 6 }}>
          <span>Folio #{intento.examenId} · Generado el {new Date().toLocaleString('es-MX')}</span>
          <span>Documento verificable con el código QR · montebello.clicknube.site</span>
        </div>
      </div>

      <style jsx global>{`
        @page { size: letter; margin: 12mm; }
        @media print {
          /* Técnica robusta: se oculta TODO el documento y solo se hace
             visible la boleta — así, sin importar qué más hubiera en la
             página, nunca se cuela una segunda hoja en blanco ni contenido
             de más. Esto es más confiable que ocultar elemento por
             elemento (header/nav/botón), que es justo lo que fallaba
             antes: el contenedor exterior tenía un alto mínimo de pantalla
             completa (100vh) que no se anulaba al imprimir, y el navegador
             agregaba una segunda hoja en blanco para "completar" ese
             espacio de sobra. */
          body * { visibility: hidden; }
          #boleta, #boleta * { visibility: visible; }
          #boleta {
            position: absolute; left: 0; top: 0; width: 100%;
            margin: 0 !important; border: none !important; border-radius: 0 !important; padding: 0 !important;
          }
          .pagina-boleta { background: #fff !important; min-height: 0 !important; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        @media (max-width: 600px) {
          .boleta-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
