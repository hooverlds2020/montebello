import { useState } from 'react';
import { useRouter } from 'next/router';

export default function PsicologiaLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    const res = await fetch('/api/psicologia/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setEnviando(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    router.push('/psicologia');
  }

  return (
    <div style={{ maxWidth: 380, margin: '80px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>Acceso restringido</h1>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Módulo de orientación / psicología</p>
      <form onSubmit={entrar}>
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', height: 44, padding: '0 14px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box', marginBottom: 10 }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', height: 44, padding: '0 14px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box', marginBottom: 14 }}
        />
        {error && <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 10 }}>{error}</p>}
        <button
          type="submit"
          disabled={enviando}
          style={{ width: '100%', height: 44, background: '#0f2a44', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
