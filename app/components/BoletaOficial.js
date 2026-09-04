// Boleta oficial de resultado — componente ÚNICO usado tanto en el panel
// admin (/admin/alumno/[id]/intento/[folioId]) como en la vista del alumno
// (/examen, resultado recién terminado e historial). Así es IMPOSIBLE que
// existan dos diseños de PDF distintos para el mismo examen: si se ajusta
// algo aquí, se ajusta en los dos lados a la vez.
//
// Props:
//   alumno: { nombre, email }
//   folio: number|string          (examenId)
//   fecha: string|Date            (finalizadoEn)
//   porCategoria: [{ categoria, correctas, incorrectas, sinContestar, porcentaje }]
//   total, correctas, porcentaje  (resultado general)
//   umbral: número de aprobación (default 60)
//   alerta: texto opcional, ej. "Salió de pantalla 2 veces"

const PALETA_MATERIAS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

function construirGradienteDona(porCategoria, total, paleta) {
  if (!total) return 'conic-gradient(#e5e7eb 0% 100%)';
  let acumulado = 0;
  const tramos = [];
  porCategoria.forEach((c, i) => {
    // Las materias en 0% no pintan segmento (se funden con el gris de
    // fondo) — pintar un segmento de ancho cero no cambia nada visualmente,
    // pero así queda explícito que solo lo que sí tiene aciertos colorea.
    const ancho = (c.correctas / total) * 100;
    if (ancho > 0) {
      const desde = acumulado;
      acumulado += ancho;
      tramos.push(`${paleta[i % paleta.length]} ${desde}% ${acumulado}%`);
    }
  });
  tramos.push(`#e5e7eb ${acumulado}% 100%`);
  return `conic-gradient(${tramos.join(', ')})`;
}

export default function BoletaOficial({ alumno, folio, fecha, porCategoria, total, correctas, porcentaje, umbral = 60, alerta }) {
  const aprobado = porcentaje >= umbral;
  const colorPrincipal = aprobado ? '#22c55e' : '#ef4444';
  const urlVerificacion = typeof window !== 'undefined'
    ? `${window.location.origin}/verificar?folio=${folio}`
    : '';
  const urlQr = urlVerificacion
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=0&data=${encodeURIComponent(urlVerificacion)}`
    : '';
  const fechaTexto = fecha
    ? new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
    : '';

  return (
    <div id="boleta-print" style={{ maxWidth: 780, margin: '0 auto', background: '#fff', padding: 28 }}>
      {/* Encabezado: logo + instituto a la izquierda, alumno + folio a la derecha */}
      <div className="boleta-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, borderBottom: '3px solid #0d3b66', paddingBottom: 16, marginBottom: 20 }}>
        <div className="boleta-header-izq" style={{ display: 'flex', gap: 12, flex: 1, minWidth: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/logo-montebello-icono.webp" alt="" className="boleta-logo" style={{ width: 48, height: 'auto', flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <h1 className="boleta-titulo" style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0d3b66', letterSpacing: 0.3 }}>INSTITUTO EDUCATIVO MONTEBELLO</h1>
            <p className="boleta-subtitulo" style={{ margin: '3px 0 0 0', fontSize: 10, fontWeight: 'bold', color: '#555', letterSpacing: 0.5 }}>DIAGNÓSTICO DE ADMISIÓN — RESULTADO OFICIAL</p>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p className="boleta-alumno-linea" style={{ margin: 0, fontSize: 13, fontWeight: 'bold', color: '#222' }}>{alumno?.nombre}</p>
          <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#888' }}>{alumno?.email}</p>
          <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#888' }}>Folio #{folio} · {fechaTexto}</p>
        </div>
      </div>

      {alerta && (
        <div style={{ marginBottom: 16 }}>
          <span
            style={{
              fontSize: 11, fontWeight: 'bold', padding: '4px 10px', borderRadius: 999,
              background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a',
            }}
          >
            ⚠️ {alerta}
          </span>
        </div>
      )}

      <h2 style={{ textAlign: 'center', fontSize: 15, fontWeight: 'bold', margin: '0 0 20px 0' }}>Detalle del intento</h2>

      {/* Dona: solo pinta las materias con aciertos (>0%); el resto queda
          gris, sin segmento ni etiqueta, para no confundir con "algo que sí
          se contó" cuando en realidad fueron 0 aciertos. */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <div style={{ position: 'relative', width: 170, height: 170 }}>
          <div
            style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: construirGradienteDona(porCategoria, total, PALETA_MATERIAS),
            }}
          />
          <div
            style={{
              position: 'absolute', inset: 20, borderRadius: '50%', background: '#fff',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 30, fontWeight: 900, lineHeight: 1 }}>{porcentaje}%</span>
            <span style={{ fontSize: 11, color: '#999', marginTop: 3 }}>{correctas} de {total}</span>
            <span
              style={{
                marginTop: 5, fontSize: 9, fontWeight: 'bold', padding: '2px 8px', borderRadius: 999,
                background: aprobado ? '#f0faf3' : '#fef2f2', color: colorPrincipal,
                border: `1px solid ${aprobado ? '#c8ecd3' : '#fecaca'}`,
              }}
            >
              {aprobado ? 'Aprobado' : 'No aprobado'} · umbral {umbral}%
            </span>
          </div>
        </div>
      </div>

      {/* Materias: fila con borde de color a la izquierda (mismo color que
          su segmento en la dona), aciertos/errores/sin contestar y % */}
      <div style={{ maxWidth: 460, margin: '0 auto 24px' }}>
        {porCategoria.map((c, i) => (
          <div
            key={c.categoria}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
              background: '#fafbfc', borderLeft: `4px solid ${PALETA_MATERIAS[i % PALETA_MATERIAS.length]}`,
              borderRadius: 8, padding: '8px 12px', marginBottom: 8,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 'bold' }}>{c.categoria}</p>
              <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#777' }}>
                ✅ {c.correctas} · ❌ {c.incorrectas} · ☐ {c.sinContestar} sin contestar
              </p>
            </div>
            <span style={{ fontSize: 15, fontWeight: 900, flexShrink: 0 }}>{c.porcentaje}%</span>
          </div>
        ))}
      </div>

      {/* Pie: datos reales de contacto del instituto + QR de verificación */}
      <div style={{ borderTop: '1px solid #ddd', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
        <div style={{ fontSize: 9, lineHeight: 1.5, color: '#777', maxWidth: '62%' }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#444' }}>Instituto Educativo Montebello A.C.</p>
          <p style={{ margin: 0 }}>6a. Av. Ote. Sur 31 B, Barrio Pilita Seca</p>
          <p style={{ margin: 0 }}>963 159 75 28 · 963 59 37 094 · www.institutomontebello.mx</p>
          <p style={{ margin: '6px 0 0 0', fontSize: 8 }}>Folio #{folio} · Generado el {new Date().toLocaleString('es-MX')} · Documento verificable</p>
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div className="boleta-qr-caja" style={{ width: 78, height: 78, border: '1px solid #ccc', padding: 4, background: '#fff' }}>
            {urlQr && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urlQr} alt="Código QR de verificación" style={{ width: '100%', height: '100%' }} />
            )}
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: 8, color: '#999' }}>Folio #{folio}<br />Escanea para verificar</p>
        </div>
      </div>

      <style jsx global>{`
        @page { size: letter; margin: 12mm; }
        @media print {
          /* Se oculta TODO el documento y solo se deja visible la boleta —
             sin importar qué otra cosa hubiera en la página (botones, nav,
             tarjetas de otros intentos), nunca se cuela contenido de más
             ni una segunda hoja en blanco. */
          body * { visibility: hidden !important; }
          #boleta-print, #boleta-print * { visibility: visible !important; }
          #boleta-print {
            position: absolute; left: 0; top: 0; width: 100%;
            margin: 0 !important; padding: 0 !important; box-shadow: none !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        @media (max-width: 600px) {
          .boleta-header { gap: 10px !important; padding-bottom: 12px !important; flex-wrap: wrap; }
          .boleta-header-izq { gap: 8px !important; flex-basis: 100%; }
          .boleta-logo { width: 36px !important; }
          .boleta-titulo { font-size: 12px !important; }
          .boleta-subtitulo { font-size: 8px !important; }
          .boleta-qr-caja { width: 60px !important; height: 60px !important; }
        }
      `}</style>
    </div>
  );
}
