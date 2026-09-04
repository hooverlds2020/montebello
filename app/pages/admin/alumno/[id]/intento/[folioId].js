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
// colores que las filas de abajo), no un solo color plano desconectado.
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
      const t = setTimeout(() => window.print(), 400);
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

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
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

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24, marginBottom: 16 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#888' }}>
            Folio #{intento.examenId} • {new Date(intento.finalizadoEn).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          <h1 style={{ margin: '4px 0 0 0', fontSize: 24, fontWeight: 900 }}>{alumno.nombre}</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#666' }}>{alumno.email}</p>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <div>
              {intento.salidasPantalla > 0 && (
                <span
                  style={{
                    fontSize: 11, fontWeight: 'bold', padding: '4px 10px', borderRadius: 999,
                    background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a',
                  }}
                >
                  ⚠️ Salió de pantalla {intento.salidasPantalla} {intento.salidasPantalla === 1 ? 'vez' : 'veces'}
                </span>
              )}
              <p style={{ margin: '6px 0 0 0', fontSize: 12, color: '#999' }}>
                {intento.correctas} de {intento.total} reactivos correctos
              </p>
            </div>
            <span
              style={{
                fontSize: 12, fontWeight: 'bold', padding: '5px 12px', borderRadius: 999, flexShrink: 0,
                background: aprobado ? '#f0faf3' : '#fef2f2', color: colorPrincipal,
                border: `1px solid ${aprobado ? '#c8ecd3' : '#fecaca'}`,
              }}
            >
              {intento.porcentaje}% {aprobado ? '- Aprobado' : '- No aprobado'}
            </span>
          </div>

          <div className="intento-individual-grid" style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 32, alignItems: 'center' }}>
            <div>
              <div style={{ position: 'relative', width: 180, height: 180, margin: '0 auto' }}>
                <div
                  style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    background: construirGradienteDona(intento.porCategoria, intento.total, PALETA_MATERIAS),
                  }}
                />
                <div
                  style={{
                    position: 'absolute', inset: 16, borderRadius: '50%', background: '#fff',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: 34, fontWeight: 900, lineHeight: 1 }}>{intento.porcentaje}%</span>
                  <span style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{intento.correctas} de {intento.total}</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                {intento.porCategoria.map((c, i) => (
                  <span key={c.categoria} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#666' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: PALETA_MATERIAS[i % PALETA_MATERIAS.length], flexShrink: 0 }} />
                    {c.categoria.split('›').pop().trim()} {c.porcentaje}%
                  </span>
                ))}
              </div>
            </div>

            <div>
              {intento.porCategoria.map((c, i) => (
                <div
                  key={c.categoria}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6,
                    padding: '12px 14px', borderRadius: 12, background: '#fafbfc', border: '1px solid #f0f0f0', marginBottom: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: PALETA_MATERIAS[i % PALETA_MATERIAS.length], flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{c.categoria}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, flexShrink: 0 }}>
                    <span style={{ color: '#22c55e', fontWeight: 'bold' }}>✓ {c.correctas}</span>
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>✕ {c.incorrectas}</span>
                    <span style={{ color: '#aaa' }}>{c.sinContestar} sin contestar</span>
                    <span style={{ width: 40, textAlign: 'right', fontWeight: 900 }}>{c.porcentaje}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @page { size: letter; margin: 14mm; }
        @media print {
          header, nav, button, .no-print {
            display: none !important;
          }
          body { background: #fff !important; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        @media (max-width: 600px) {
          .intento-individual-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }
      `}</style>
    </div>
  );
}
