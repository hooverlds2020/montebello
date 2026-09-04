// Pantalla de carga con el logo del instituto: el logo "respira" (pulso
// suave) y un anillo gira alrededor. El logo en sí NO gira (se vería mal,
// trae texto debajo) — solo el indicador de carga alrededor de él.
export default function PantallaCarga({ mensaje = 'Cargando...' }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: '#fff', zIndex: 9999,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18,
      }}
    >
      <div style={{ position: 'relative', width: 96, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="anillo-carga" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/img/logo-montebello-icono.webp"
          alt="Instituto Educativo Montebello"
          className="logo-pulso"
          style={{ width: 56, height: 'auto', position: 'relative', zIndex: 1 }}
        />
      </div>
      <span style={{ fontSize: 13, color: '#888', fontFamily: 'sans-serif' }}>{mensaje}</span>

      <style jsx>{`
        .anillo-carga {
          position: absolute;
          width: 96px;
          height: 96px;
          border-radius: 50%;
          border: 3px solid #e3ecf5;
          border-top-color: #0d3b66;
          animation: girar 0.9s linear infinite;
        }
        .logo-pulso {
          animation: respirar 1.6s ease-in-out infinite;
        }
        @keyframes girar {
          to { transform: rotate(360deg); }
        }
        @keyframes respirar {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.92); opacity: 0.75; }
        }
        @media (prefers-reduced-motion: reduce) {
          .anillo-carga, .logo-pulso { animation: none; }
        }
      `}</style>
    </div>
  );
}
