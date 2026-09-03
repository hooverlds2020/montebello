const PALETA = ['#4a90d9', '#2e7d32', '#e08e2b', '#8e44ad', '#c0392b', '#16a085'];

// Punto sobre un círculo de radio r, centrado en (cx, cy), con 0° arriba
// (12 en punto) y avanzando en sentido de las manecillas del reloj —
// mismo sistema de grados que usábamos para el conic-gradient.
function puntoEnCirculo(cx, cy, r, gradosDesdeArriba) {
  const rad = (gradosDesdeArriba * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

export default function DonaResultado({ resultado, tamano = 220 }) {
  let acumuladoGrados = 0;
  const segmentos = resultado.porCategoria.map((c, i) => {
    const proporcion = c.total / resultado.general.total;
    const grados = proporcion * 360;
    const desde = acumuladoGrados;
    const hasta = acumuladoGrados + grados;
    acumuladoGrados = hasta;
    return { ...c, color: PALETA[i % PALETA.length], desde, hasta };
  });

  const grosor = tamano * 0.16;
  const radio = tamano / 2 - grosor / 2;
  const circunferencia = 2 * Math.PI * radio;
  const cx = tamano / 2;
  const cy = tamano / 2;
  // Espacio extra alrededor de la dona para que quepan las líneas y las
  // etiquetas de porcentaje sin que se corten.
  const margenEtiquetas = tamano * 0.42;
  const svgTam = tamano + margenEtiquetas * 2;
  const svgCx = svgTam / 2;
  const svgCy = svgTam / 2;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: svgTam, height: svgTam, flexShrink: 0 }}>
        <svg width={svgTam} height={svgTam} viewBox={`0 0 ${svgTam} ${svgTam}`}>
          <g transform={`translate(${svgCx - cx}, ${svgCy - cy})`}>
            {segmentos.map((s) => {
              const dash = (s.proporcionDeseada ?? (s.hasta - s.desde) / 360) * circunferencia;
              return (
                <circle
                  key={s.categoria}
                  cx={cx}
                  cy={cy}
                  r={radio}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={grosor}
                  strokeDasharray={`${dash} ${circunferencia - dash}`}
                  strokeDashoffset={-((s.desde / 360) * circunferencia)}
                  transform={`rotate(-90 ${cx} ${cy})`}
                />
              );
            })}
          </g>
          {segmentos.map((s) => {
            const medio = s.desde + (s.hasta - s.desde) / 2;
            const pBorde = puntoEnCirculo(svgCx, svgCy, radio + grosor / 2 + 6, medio);
            const pCodo = puntoEnCirculo(svgCx, svgCy, radio + grosor / 2 + 22, medio);
            const haciaLaDerecha = pCodo.x >= svgCx;
            const pFinal = { x: pCodo.x + (haciaLaDerecha ? 16 : -16), y: pCodo.y };
            return (
              <g key={`etq-${s.categoria}`}>
                <polyline
                  points={`${pBorde.x},${pBorde.y} ${pCodo.x},${pCodo.y} ${pFinal.x},${pFinal.y}`}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={1.5}
                />
                <text
                  x={pFinal.x + (haciaLaDerecha ? 4 : -4)}
                  y={pFinal.y}
                  textAnchor={haciaLaDerecha ? 'start' : 'end'}
                  dominantBaseline="middle"
                  style={{ fontSize: Math.max(11, tamano / 17), fontWeight: 700, fill: s.color }}
                >
                  {s.porcentaje}%
                </text>
              </g>
            );
          })}
        </svg>
        <div
          style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: Math.round(tamano * 0.68), height: Math.round(tamano * 0.68), borderRadius: '50%',
            background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: tamano / 5.5, fontWeight: 'bold', color: '#333' }}>{resultado.general.porcentaje}%</div>
          <div style={{ fontSize: 12, color: '#888' }}>{resultado.general.correctas} de {resultado.general.total}</div>
        </div>
      </div>

      <div style={{ minWidth: 200 }}>
        {segmentos.map((s) => (
          <div
            key={s.categoria}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
              borderLeft: `4px solid ${s.color}`, background: `${s.color}12`,
              padding: '8px 12px', borderRadius: 6,
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{s.categoria}</div>
              <div style={{ fontSize: 13, color: '#666' }}>
                ✅ {s.correctas} correctas · ❌ {s.incorrectas ?? 0} incorrectas
                {s.sinContestar > 0 && <> · ⬜ {s.sinContestar} sin contestar</>}
                {' '}· <strong style={{ color: s.color }}>{s.porcentaje}%</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
