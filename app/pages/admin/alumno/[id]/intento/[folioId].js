import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BoletaOficial from '../../../../../components/BoletaOficial';
import { estaAutenticado } from '../../../../../lib/auth';

export async function getServerSideProps({ req }) {
  if (!estaAutenticado(req)) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
  return { props: {} };
}

export default function IntentoIndividual() {
  const router = useRouter();
  const { id, folioId, imprimir } = router.query;
  const [alumno, setAlumno] = useState(null);
  const [intento, setIntento] = useState(null);
  const [umbral, setUmbral] = useState(60);
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

  const alerta = intento.salidasPantalla > 0
    ? `Salió de pantalla ${intento.salidasPantalla} ${intento.salidasPantalla === 1 ? 'vez' : 'veces'}`
    : null;

  return (
    <div className="pagina-intento-individual" style={{ background: '#f0f2f5', minHeight: '100vh', fontFamily: 'sans-serif' }}>
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

      <div style={{ maxWidth: 780, margin: '20px auto 40px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }}>
        <BoletaOficial
          alumno={alumno}
          folio={intento.examenId}
          fecha={intento.finalizadoEn}
          porCategoria={intento.porCategoria}
          total={intento.total}
          correctas={intento.correctas}
          porcentaje={intento.porcentaje}
          umbral={umbral}
          alerta={alerta}
        />
      </div>

      <style jsx global>{`
        @media print {
          .pagina-intento-individual { min-height: 0 !important; background: #fff !important; }
        }
      `}</style>
    </div>
  );
}
