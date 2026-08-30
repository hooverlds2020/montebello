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
    <div style={{ maxWidth: 380, margin: '60px auto', fontFamily: 'sans-serif', padding: 24 }}>
      <h1 style={{ fontSize: 22, textAlign: 'center' }}>Instituto Educativo Montebello</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: 24 }}>Examen de diagnóstico</p>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ display: 'block', width: '100%', padding: 10, marginBottom: 10, boxSizing: 'border-box' }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ display: 'block', width: '100%', padding: 10, marginBottom: 10, boxSizing: 'border-box' }}
        />
        <button
          type="submit"
          disabled={cargando}
          style={{ width: '100%', padding: 10, background: '#4a90d9', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          {cargando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      {error && <p style={{ color: '#c0392b', marginTop: 10 }}>{error}</p>}

      <div style={{ marginTop: 16, textAlign: 'center', fontSize: 14 }}>
        <Link href="/recuperar">¿Olvidaste tu contraseña?</Link>
        <br /><br />
        ¿No tienes cuenta? <Link href="/registro">Regístrate aquí</Link>
      </div>
    </div>
  );
}
