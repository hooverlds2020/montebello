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
    <div style={{ minHeight: '100vh', background: '#f7f8fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.07)', padding: 36 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/logo-montebello.webp" alt="Instituto Educativo Montebello" style={{ width: 90, height: 'auto' }} />
        </div>

        <h1 style={{ fontSize: 20, textAlign: 'center', margin: 0 }}>Instituto Educativo Montebello</h1>
        <p style={{ textAlign: 'center', color: '#888', marginTop: 4, marginBottom: 28, fontSize: 14 }}>Examen de diagnóstico</p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ display: 'block', width: '100%', padding: 11, marginBottom: 12, boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ display: 'block', width: '100%', padding: 11, marginBottom: 16, boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }}
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

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#666' }}>
          <Link href="/recuperar" style={{ color: '#4a90d9' }}>¿Olvidaste tu contraseña?</Link>
          <br /><br />
          ¿No tienes cuenta? <Link href="/registro" style={{ color: '#4a90d9' }}>Regístrate aquí</Link>
        </div>
      </div>
    </div>
  );
}
