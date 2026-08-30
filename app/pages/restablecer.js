import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Restablecer() {
  const router = useRouter();
  const { token } = router.query;

  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== password2) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setCargando(true);
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setCargando(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setExito(true);
    setTimeout(() => router.push('/login'), 2000);
  }

  return (
    <div style={{ maxWidth: 380, margin: '60px auto', fontFamily: 'sans-serif', padding: 24 }}>
      <h1 style={{ fontSize: 22, textAlign: 'center' }}>Nueva contraseña</h1>

      {exito ? (
        <p style={{ color: '#2e7d32' }}>Contraseña actualizada. Redirigiendo al inicio de sesión...</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Nueva contraseña (mínimo 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ display: 'block', width: '100%', padding: 10, marginBottom: 10, boxSizing: 'border-box' }}
          />
          <input
            type="password"
            placeholder="Confirma la nueva contraseña"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
            style={{ display: 'block', width: '100%', padding: 10, marginBottom: 10, boxSizing: 'border-box' }}
          />
          <button
            type="submit"
            disabled={cargando || !token}
            style={{ width: '100%', padding: 10, background: '#4a90d9', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            {cargando ? 'Guardando...' : 'Guardar nueva contraseña'}
          </button>
        </form>
      )}

      {error && <p style={{ color: '#c0392b', marginTop: 10 }}>{error}</p>}
    </div>
  );
}
