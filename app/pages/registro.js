import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function calcularFuerzaPassword(pw) {
  if (!pw) return { puntos: 0, etiqueta: '', color: '#ddd' };
  let puntos = 0;
  if (pw.length >= 6) puntos++;
  if (pw.length >= 10) puntos++;
  if (/[0-9]/.test(pw)) puntos++;
  if (/[A-Z]/.test(pw)) puntos++;
  if (/[^A-Za-z0-9]/.test(pw)) puntos++;
  if (puntos <= 1) return { puntos, etiqueta: 'Débil', color: '#c0392b' };
  if (puntos <= 3) return { puntos, etiqueta: 'Aceptable', color: '#e08e2b' };
  return { puntos, etiqueta: 'Fuerte', color: '#2e7d32' };
}

export default function Registro() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [preparatoriaProcedencia, setPreparatoriaProcedencia] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  // Registra qué campos ya "tocó" el usuario (les dio clic y salió), para
  // no mostrarle errores en rojo antes de que siquiera haya empezado a
  // escribir en ese campo.
  const [tocado, setTocado] = useState({});
  const router = useRouter();

  const emailValido = email === '' || REGEX_EMAIL.test(email);
  const passwordsCoinciden = password2 === '' || password === password2;
  const fuerza = calcularFuerzaPassword(password);

  function marcarTocado(campo) {
    setTocado((t) => ({ ...t, [campo]: true }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setTocado({ email: true, password: true, password2: true });

    if (!REGEX_EMAIL.test(email)) {
      setError('Ingresa un correo electrónico válido');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
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

  const estiloInput = { display: 'block', width: '100%', padding: 10, marginBottom: 4, boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: 6 };
  const estiloInputError = { ...estiloInput, border: '1px solid #c0392b' };
  const estiloErrorCampo = { color: '#c0392b', fontSize: 12, margin: '0 0 10px 2px' };

  return (
    <div style={{ maxWidth: 380, margin: '40px auto', fontFamily: 'sans-serif', padding: 24 }}>
      <h1 style={{ fontSize: 22, textAlign: 'center' }}>Crear cuenta</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: 24 }}>Examen de diagnóstico</p>

      <form onSubmit={handleSubmit} noValidate>
        <input
          placeholder="Nombre y apellido"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          autoComplete="name"
          style={{ ...estiloInput, marginBottom: 10 }}
        />
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => marcarTocado('email')}
          required
          autoComplete="email"
          inputMode="email"
          aria-invalid={tocado.email && !emailValido}
          style={tocado.email && !emailValido ? estiloInputError : { ...estiloInput, marginBottom: 10 }}
        />
        {tocado.email && !emailValido && (
          <p style={estiloErrorCampo}>Ese correo no parece válido (ej. nombre@correo.com)</p>
        )}
        <input
          type="tel"
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          required
          autoComplete="tel"
          inputMode="tel"
          style={{ ...estiloInput, marginBottom: 10 }}
        />
        <input
          placeholder="Escuela de procedencia"
          value={preparatoriaProcedencia}
          onChange={(e) => setPreparatoriaProcedencia(e.target.value)}
          required
          autoComplete="organization"
          style={{ ...estiloInput, marginBottom: 10 }}
        />
        <input
          type="password"
          placeholder="Contraseña (mínimo 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => marcarTocado('password')}
          required
          minLength={6}
          autoComplete="new-password"
          style={estiloInput}
        />
        {password && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 4, flex: 1, borderRadius: 2,
                    background: i < fuerza.puntos ? fuerza.color : '#eee',
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: 12, color: fuerza.color }}>
              Seguridad: {fuerza.etiqueta}
              {password.length < 6 && ' — falta llegar al mínimo de 6 caracteres'}
            </span>
          </div>
        )}
        <input
          type="password"
          placeholder="Confirma tu contraseña"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          onBlur={() => marcarTocado('password2')}
          required
          autoComplete="new-password"
          aria-invalid={tocado.password2 && !passwordsCoinciden}
          style={tocado.password2 && !passwordsCoinciden ? estiloInputError : { ...estiloInput, marginBottom: 10 }}
        />
        {tocado.password2 && !passwordsCoinciden && (
          <p style={estiloErrorCampo}>Las contraseñas no coinciden</p>
        )}
        <button
          type="submit"
          disabled={cargando}
          aria-busy={cargando}
          style={{
            width: '100%', padding: 10, background: cargando ? '#8fb6de' : '#4a90d9', color: '#fff',
            border: 'none', borderRadius: 6, cursor: cargando ? 'not-allowed' : 'pointer',
          }}
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
