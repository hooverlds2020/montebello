import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
      {/* Contenido principal */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 640 }}>
          {/* Logo grande: es el ancla visual de la página */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/logo-montebello.webp"
            alt="Instituto Educativo Montebello"
            style={{ width: 190, height: 'auto', marginBottom: 8 }}
          />

          <h1 style={{ fontSize: 30, color: '#0d3b66', margin: '28px 0 8px 0' }}>
            Sistema de Examen de Diagnóstico
          </h1>
          <p style={{ fontSize: 15, color: '#a8791b', fontStyle: 'italic', marginBottom: 40 }}>
            Transformando la educación hacia la sociedad del conocimiento
          </p>

          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" className="tarjeta-selector" style={{ display: 'block', textDecoration: 'none', width: 260, padding: '28px 24px', background: '#0d3b66', color: '#fff', borderRadius: 14, boxShadow: '0 6px 20px rgba(13,59,102,0.25)' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🎓</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Soy alumno</div>
              <div style={{ fontSize: 13, opacity: 0.85 }}>Presenta tu examen de diagnóstico</div>
            </Link>

            <Link href="/admin/login" className="tarjeta-selector" style={{ display: 'block', textDecoration: 'none', width: 260, padding: '28px 24px', background: '#fff', color: '#0d3b66', borderRadius: 14, border: '2px solid #e0e6ec' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔐</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Soy administrador</div>
              <div style={{ fontSize: 13, color: '#888' }}>Acceso al panel de gestión</div>
            </Link>
          </div>
        </div>
      </main>

      {/* Pie de página */}
      <footer style={{ textAlign: 'center', padding: '20px 16px', color: '#999', fontSize: 12, borderTop: '1px solid #eee' }}>
        © {new Date().getFullYear()} Instituto Educativo Montebello · Comitán de Domínguez, Chiapas
      </footer>

      <style jsx global>{`
        .tarjeta-selector {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .tarjeta-selector:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 28px rgba(13, 59, 102, 0.22);
        }
      `}</style>
    </div>
  );
}
