import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function LoginAlumno() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setCargando(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    router.push('/examen');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'sans-serif' }}>
      {/* Panel izquierdo: identidad institucional */}
      <div
        className="panel-bienvenida"
        style={{
          flex: 1, minWidth: 320, background: 'linear-gradient(160deg, #0d3b66, #14548c)',
          color: '#fff', padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/logo-montebello.webp" alt="" style={{ width: 90, height: 'auto', marginBottom: 28, filter: 'brightness(0) invert(1)', opacity: 0.95 }} />
        <h1 style={{ fontSize: 28, margin: '0 0 12px 0' }}>Bienvenido</h1>
        <p style={{ fontSize: 15, opacity: 0.85, lineHeight: 1.6, maxWidth: 380 }}>
          Examen de diagnóstico del Instituto Educativo Montebello.
        </p>
        <p style={{ fontSize: 13, fontStyle: 'italic', opacity: 0.7, marginTop: 24 }}>
          Transformando la educación hacia la sociedad del conocimiento
        </p>
      </div>

      {/* Panel derecho: formulario */}
      <div style={{ flex: 1, minWidth: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: 340 }}>
          <h2 style={{ fontSize: 22, margin: '0 0 4px 0' }}>Iniciar sesión</h2>
          <p style={{ color: '#888', fontSize: 14, marginBottom: 28 }}>Ingresa tus datos para continuar.</p>

          <form onSubmit={handleSubmit}>
            <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>Correo electrónico</label>
            <input
              type="email"
              placeholder="tucorreo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ display: 'block', width: '100%', padding: 11, marginBottom: 16, boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }}
            />
            <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ display: 'block', width: '100%', padding: 11, marginBottom: 20, boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }}
            />
            <button
              type="submit"
              disabled={cargando}
              style={{ width: '100%', padding: 12, background: '#4a90d9', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}
            >
              {cargando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {error && <p style={{ color: '#c0392b', marginTop: 12, fontSize: 14 }}>{error}</p>}

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#666' }}>
            <Link href="/recuperar" style={{ color: '#4a90d9' }}>¿Olvidaste tu contraseña?</Link>
            <br /><br />
            ¿No tienes cuenta? <Link href="/registro" style={{ color: '#4a90d9' }}>Regístrate aquí</Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 700px) {
          .panel-bienvenida { display: none !important; }
        }
      `}</style>
    </div>
  );
}
