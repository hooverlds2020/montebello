const PALETA = ['#4a90d9', '#2e7d32', '#e08e2b', '#8e44ad', '#c0392b', '#16a085'];

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
  const gradienteCss = `conic-gradient(${segmentos
    .map((s) => `${s.color} ${s.desde}deg ${s.hasta}deg`)
    .join(', ')})`;
  const tamanoInterior = Math.round(tamano * 0.68);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
      <div
        style={{
          width: tamano, height: tamano, borderRadius: '50%', background: gradienteCss,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ width: tamanoInterior, height: tamanoInterior, borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: tamano / 5.5, fontWeight: 'bold', color: '#333' }}>{resultado.general.porcentaje}%</div>
          <div style={{ fontSize: 12, color: '#888' }}>{resultado.general.correctas} de {resultado.general.total}</div>
        </div>
      </div>

      <div style={{ minWidth: 200 }}>
        {segmentos.map((s) => (
          <div key={s.categoria} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{s.categoria}</div>
              <div style={{ fontSize: 13, color: '#888' }}>{s.correctas}/{s.total} correctas · {s.porcentaje}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
