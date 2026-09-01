import { useState } from 'react';
import { useRouter } from 'next/router';

export default function AdminLogin() {
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
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setCargando(false);
    if (!res.ok) {
      setError(data.error || 'Error al iniciar sesión');
      return;
    }
    router.push('/admin');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'sans-serif' }}>
      <div
        className="panel-bienvenida-admin"
        style={{
          flex: '0 1 40%', minWidth: 320, background: 'linear-gradient(160deg, #0d3b66, #14548c)',
          color: '#fff', padding: '48px 40px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}
      >
        <div className="textura-panel-admin" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/logo-montebello.webp" alt="" style={{ width: 130, height: 'auto', marginBottom: 28, filter: 'brightness(0) invert(1)', opacity: 0.95, position: 'relative' }} />
        <h1 style={{ fontSize: 30, margin: '0 0 14px 0', position: 'relative' }}>Panel de administración</h1>
        <p style={{ fontSize: 15, opacity: 0.85, lineHeight: 1.6, maxWidth: 340, position: 'relative' }}>
          Gestión del examen de diagnóstico — Instituto Educativo Montebello.
        </p>
        <p style={{ fontSize: 13, opacity: 0.6, marginTop: 24, position: 'relative' }}>
          Acceso restringido únicamente para personal autorizado.
        </p>
      </div>

      <div style={{ flex: '1 1 60%', minWidth: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, background: '#f7f9fb' }}>
        <div style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(13,59,102,0.08)', border: '1px solid #eef1f5', padding: 36 }}>
          <h2 style={{ fontSize: 22, margin: '0 0 4px 0' }}>Iniciar sesión</h2>
          <p style={{ color: '#888', fontSize: 14, marginBottom: 28 }}>Ingresa tus credenciales para acceder.</p>

          <form onSubmit={handleSubmit}>
            <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>Correo electrónico</label>
            <input
              type="email"
              placeholder="admin@institutomontebello.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '13px 14px', marginBottom: 16, boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }}
              autoFocus
            />
            <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>Contraseña</label>
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <input
                type={mostrarPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              style={{ width: '100%', padding: 13, background: '#0d3b66', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}
            >
              {cargando ? 'Entrando...' : 'Entrar al panel'}
            </button>
          </form>

          {error && <p style={{ color: '#c0392b', marginTop: 12, fontSize: 14 }}>{error}</p>}
        </div>
      </div>

      <style jsx global>{`
        .textura-panel-admin {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.10) 1.5px, transparent 1.5px);
          background-size: 26px 26px;
          opacity: 0.5;
          pointer-events: none;
        }
        @media (max-width: 700px) {
          .panel-bienvenida-admin { display: none !important; }
        }
      `}</style>
    </div>
  );
}
