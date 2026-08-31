import { useEffect, useState } from 'react';
import Link from 'next/link';
const { estaAutenticado } = require('../../lib/auth');

export async function getServerSideProps({ req }) {
  if (!estaAutenticado(req)) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
  return { props: {} };
}

function formatearFecha(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ResultadosAdmin() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch('/api/admin/resultados')
      .then((res) => res.json())
      .then((data) => {
        setDatos(data);
        setCargando(false);
      });
  }, []);

  function exportarCSV() {
    if (!datos) return;
    const encabezados = ['Nombre', 'Correo', 'Intentos', 'Correctas', 'Total', 'Porcentaje', 'Fecha de último intento'];
    const filas = datos.alumnos.map((a) => [
      a.nombre, a.email, a.intentos, a.correctas, a.total, `${a.porcentaje}%`, formatearFecha(a.finalizadoEn),
    ]);
    const csv = [encabezados, ...filas]
      .map((fila) => fila.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultados_diagnostico_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (cargando) return null;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>Resultados del diagnóstico</h1>
          <Link href="/admin" style={{ fontSize: 13, color: '#4a90d9' }}>← Volver al banco de reactivos</Link>
        </div>
        <button
          onClick={exportarCSV}
          disabled={!datos || datos.alumnos.length === 0}
          style={{ padding: '8px 16px', background: '#4a90d9', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          Exportar a Excel (CSV)
        </button>
      </div>

      {(!datos || datos.alumnos.length === 0) && (
        <p style={{ color: '#888' }}>Todavía ningún alumno ha finalizado su examen de diagnóstico.</p>
      )}

      {datos && datos.alumnos.length > 0 && (
        <>
          {/* Tarjetas de resumen */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160, background: '#f0f4fa', borderRadius: 10, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: '#4a90d9' }}>{datos.totalAlumnosEvaluados}</div>
              <div style={{ fontSize: 12, color: '#666' }}>Alumnos evaluados</div>
            </div>
            <div style={{ flex: 1, minWidth: 160, background: datos.promedioGeneral >= 60 ? '#eafaf1' : '#fdeceb', borderRadius: 10, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: datos.promedioGeneral >= 60 ? '#2e7d32' : '#c0392b' }}>
                {datos.promedioGeneral}%
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>Promedio general</div>
            </div>
          </div>

          {/* Promedio por materia */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>Promedio por materia</h2>
            {datos.promedioPorMateria.map((m) => (
              <div key={m.categoria} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                  <span>{m.categoria}</span>
                  <span style={{ fontWeight: 600, color: m.porcentaje >= 60 ? '#2e7d32' : '#c0392b' }}>{m.porcentaje}%</span>
                </div>
                <div style={{ background: '#eee', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${m.porcentaje}%`, height: '100%', background: m.porcentaje >= 60 ? '#2e7d32' : '#c0392b' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Lista de alumnos */}
          <div>
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>Alumnos</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                    <th style={{ padding: '8px 6px' }}>Alumno</th>
                    <th style={{ padding: '8px 6px' }}>Correo</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center' }}>Intentos</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center' }}>Resultado</th>
                    <th style={{ padding: '8px 6px' }}>Último intento</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.alumnos.map((a) => (
                    <tr key={a.alumnoId} style={{ borderBottom: '1px solid #f2f2f2' }}>
                      <td style={{ padding: '8px 6px', fontWeight: 600 }}>{a.nombre}</td>
                      <td style={{ padding: '8px 6px', color: '#666' }}>{a.email}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'center' }}>{a.intentos}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                        <span
                          style={{
                            fontWeight: 'bold', padding: '3px 10px', borderRadius: 20,
                            background: a.porcentaje >= 60 ? '#eafaf1' : '#fdeceb',
                            color: a.porcentaje >= 60 ? '#2e7d32' : '#c0392b',
                          }}
                        >
                          {a.correctas}/{a.total} ({a.porcentaje}%)
                        </span>
                      </td>
                      <td style={{ padding: '8px 6px', color: '#888', fontSize: 13 }}>{formatearFecha(a.finalizadoEn)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
