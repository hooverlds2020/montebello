import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import BoletaOficial from '../components/BoletaOficial';

export default function Verificar() {
  const router = useRouter();
  const { folio } = router.query;
  const [resultado, setResultado] = useState(null);
  const [umbral, setUmbral] = useState(60);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!folio) return;
    Promise.all([
      fetch(`/api/verificar?examenId=${folio}`).then((res) => res.json()),
      fetch('/api/config/publico').then((res) => (res.ok ? res.json() : null)).catch(() => null),
    ]).then(([datosVerificacion, config]) => {
      setResultado(datosVerificacion);
      if (config?.umbralAprobacion) setUmbral(config.umbralAprobacion);
      setCargando(false);
    });
  }, [folio]);

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: 24 }}>
        {cargando && <p style={{ textAlign: 'center', color: '#888', marginTop: 60 }}>Verificando...</p>}

        {!cargando && resultado?.valido && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 'bold',
                  padding: '6px 14px', borderRadius: 999, background: '#f0faf3', color: '#22c55e',
                  border: '1px solid #c8ecd3',
                }}
              >
                ✅ Folio verificado — documento auténtico
              </span>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <BoletaOficial
                alumno={{ nombre: resultado.nombre }}
                folio={resultado.folio}
                fecha={resultado.fecha}
                porCategoria={resultado.porCategoria}
                total={resultado.total}
                correctas={resultado.correctas}
                porcentaje={resultado.porcentaje}
                umbral={umbral}
              />
            </div>
          </>
        )}

        {!cargando && resultado && !resultado.valido && (
          <div style={{ maxWidth: 420, margin: '60px auto', textAlign: 'center' }}>
            <div style={{ background: '#fdeceb', border: '1px solid #f0c4bd', borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>❌</div>
              <p style={{ fontWeight: 600, margin: 0 }}>Folio no válido</p>
              <p style={{ fontSize: 13, color: '#666', marginTop: 6 }}>{resultado.error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
