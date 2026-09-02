import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Verificar() {
  const router = useRouter();
  const { folio } = router.query;
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!folio) return;
    fetch(`/api/verificar?examenId=${folio}`)
      .then((res) => res.json())
      .then((data) => {
        setResultado(data);
        setCargando(false);
      });
  }, [folio]);

  return (
    <div style={{ maxWidth: 420, margin: '60px auto', fontFamily: 'sans-serif', padding: 24, textAlign: 'center' }}>
      <h1 style={{ fontSize: 20 }}>Verificación de folio</h1>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>Instituto Educativo Montebello</p>

      {cargando && <p>Verificando...</p>}

      {!cargando && resultado?.valido && (
        <div style={{ background: '#eafaf1', border: '1px solid #c8e6d0', borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Folio válido</p>
          <p style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>Folio: #{resultado.folio}</p>
          <p style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>Alumno: {resultado.nombre}</p>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
            Fecha: {new Date(resultado.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>

          {resultado.porCategoria && resultado.porCategoria.length > 0 && (
            <div style={{ textAlign: 'left', background: '#fff', border: '1px solid #dcecdf', borderRadius: 8, padding: 14, marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                Resultado por materia
              </p>
              {resultado.porCategoria.map((c) => (
                <div key={c.categoria} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                    <span>{c.categoria}</span>
                    <span style={{ fontWeight: 600 }}>{c.porcentaje}%</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
                    ✅ {c.correctas} correctas · ❌ {c.incorrectas ?? 0} incorrectas
                    {c.sinContestar > 0 && <> · ⬜ {c.sinContestar} sin contestar</>}
                  </div>
                  <div style={{ background: '#eee', borderRadius: 6, height: 6 }}>
                    <div style={{ width: `${c.porcentaje}%`, height: '100%', background: '#2e7d32', borderRadius: 6 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ borderTop: '1px solid #c8e6d0', paddingTop: 14 }}>
            <p style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>Calificación final</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#2e7d32', margin: 0 }}>
              {resultado.porcentaje}%
            </p>
            <p style={{ fontSize: 12, color: '#666', margin: 0 }}>{resultado.correctas} de {resultado.total} correctas</p>
          </div>
        </div>
      )}

      {!cargando && resultado && !resultado.valido && (
        <div style={{ background: '#fdeceb', border: '1px solid #f0c4bd', borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>❌</div>
          <p style={{ fontWeight: 600 }}>Folio no válido</p>
          <p style={{ fontSize: 13, color: '#666' }}>{resultado.error}</p>
        </div>
      )}
    </div>
  );
}
