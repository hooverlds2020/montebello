import { useState } from 'react';
import Link from 'next/link';

export default function Recuperar() {
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setCargando(true);
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setCargando(false);
    setMensaje(data.mensaje || data.error);
    setEnviado(true);
  }

  return (
    <div style={{ maxWidth: 380, margin: '60px auto', fontFamily: 'sans-serif', padding: 24 }}>
      <h1 style={{ fontSize: 22, textAlign: 'center' }}>Recuperar contraseña</h1>

      {!enviado ? (
        <form onSubmit={handleSubmit}>
          <p style={{ color: '#666', fontSize: 14 }}>
            Escribe tu correo y te enviaremos un enlace para crear una nueva contraseña.
          </p>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ display: 'block', width: '100%', padding: 10, marginBottom: 10, boxSizing: 'border-box' }}
          />
          <button
            type="submit"
            disabled={cargando}
            style={{ width: '100%', padding: 10, background: '#4a90d9', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            {cargando ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>
      ) : (
        <p style={{ color: '#2e7d32' }}>{mensaje}</p>
      )}

      <div style={{ marginTop: 16, textAlign: 'center', fontSize: 14 }}>
        <Link href="/login">Volver a iniciar sesión</Link>
      </div>
    </div>
  );
}
