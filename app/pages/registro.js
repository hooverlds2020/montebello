import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Registro() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [preparatoriaProcedencia, setPreparatoriaProcedencia] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== password2) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setCargando(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password, telefono, preparatoriaProcedencia }),
    });
    const data = await res.json();
    setCargando(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    router.push('/examen');
  }

  const estiloInput = { display: 'block', width: '100%', padding: 10, marginBottom: 10, boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: 6 };

  return (
    <div style={{ maxWidth: 380, margin: '40px auto', fontFamily: 'sans-serif', padding: 24 }}>
      <h1 style={{ fontSize: 22, textAlign: 'center' }}>Crear cuenta</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: 24 }}>Examen de diagnóstico</p>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Nombre y apellido"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          style={estiloInput}
        />
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={estiloInput}
        />
        <input
          type="tel"
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          required
          style={estiloInput}
        />
        <input
          placeholder="Escuela de procedencia"
          value={preparatoriaProcedencia}
          onChange={(e) => setPreparatoriaProcedencia(e.target.value)}
          required
          style={estiloInput}
        />
        <input
          type="password"
          placeholder="Contraseña (mínimo 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={estiloInput}
        />
        <input
          type="password"
          placeholder="Confirma tu contraseña"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          required
          style={estiloInput}
        />
        <button
          type="submit"
          disabled={cargando}
          style={{ width: '100%', padding: 10, background: '#4a90d9', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>

      {error && <p style={{ color: '#c0392b', marginTop: 10 }}>{error}</p>}

      <div style={{ marginTop: 16, textAlign: 'center', fontSize: 14 }}>
        ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
      </div>
    </div>
  );
}
