import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function LoginAlumno() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
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
      {/* Panel izquierdo: identidad institucional — contenido centrado, con
          textura sutil de fondo para que un bloque de color tan grande no se
          sienta plano. */}
      <div
        className="panel-bienvenida"
        style={{
          flex: '0 1 40%', minWidth: 320, background: 'linear-gradient(160deg, #0d3b66, #14548c)',
          color: '#fff', padding: '48px 40px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}
      >
        <div className="textura-panel" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/logo-montebello.webp" alt="" style={{ width: 130, height: 'auto', marginBottom: 28, filter: 'brightness(0) invert(1)', opacity: 0.95, position: 'relative' }} />
        <h1 style={{ fontSize: 30, margin: '0 0 14px 0', position: 'relative' }}>Bienvenido</h1>
        <p style={{ fontSize: 15, opacity: 0.85, lineHeight: 1.6, maxWidth: 340, position: 'relative' }}>
          Examen de diagnóstico del Instituto Educativo Montebello.
        </p>
        <p style={{ fontSize: 13, fontStyle: 'italic', opacity: 0.7, marginTop: 24, position: 'relative' }}>
          Transformando la educación hacia la sociedad del conocimiento
        </p>
      </div>

      {/* Panel derecho: formulario, enmarcado como tarjeta para que no flote
          en tanto espacio en blanco. */}
      <div className="panel-formulario" style={{ flex: '1 1 60%', minWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, background: '#f7f9fb' }}>
        {/* Logo institucional: solo visible en móvil, donde el panel azul de
            la izquierda se oculta. Sin esto, en celular no queda ningún
            indicio visual de a qué institución pertenece la pantalla. */}
        <div className="logo-movil-login">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/logo-montebello.webp" alt="Instituto Educativo Montebello" style={{ width: 130, height: 'auto' }} />
        </div>
        <div className="tarjeta-formulario" style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(13,59,102,0.08)', border: '1px solid #eef1f5', padding: 36 }}>
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
              style={{ display: 'block', width: '100%', padding: '13px 14px', marginBottom: 16, boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }}
            />
            <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>Contraseña</label>
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <input
                type={mostrarPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ display: 'block', width: '100%', padding: '13px 44px 13px 14px', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword((v) => !v)}
                title={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, padding: 8, color: '#888' }}
              >
                {mostrarPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <button
              type="submit"
              disabled={cargando}
              style={{ width: '100%', padding: 13, background: '#4a90d9', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}
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
        .textura-panel {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.10) 1.5px, transparent 1.5px);
          background-size: 26px 26px;
          opacity: 0.5;
          pointer-events: none;
        }
        @media (max-width: 700px) {
          .panel-bienvenida { display: none !important; }
        }
        .logo-movil-login {
          display: none;
        }
        @media (max-width: 700px) {
          .logo-movil-login {
            display: flex;
            justify-content: center;
            margin-bottom: 28px;
          }
        }
        @media (max-width: 480px) {
          .panel-formulario { padding: 16px !important; }
          .tarjeta-formulario { padding: 22px !important; border-radius: 12px !important; box-shadow: none !important; border: none !important; }
        }
      `}</style>
    </div>
  );
}
