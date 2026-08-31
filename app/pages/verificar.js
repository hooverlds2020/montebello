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
          <p style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>Resultado: {resultado.porcentaje}%</p>
          <p style={{ fontSize: 13, color: '#666' }}>
            Fecha: {new Date(resultado.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
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
