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

  const estiloInput = {
    display: 'block', width: '100%', height: 44, padding: '0 16px', marginBottom: 4,
    boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: 12,
    background: '#fafbfc', fontSize: 14,
  };
  const estiloInputError = { ...estiloInput, border: '1px solid #c0392b', background: '#fff' };
  const estiloErrorCampo = { color: '#c0392b', fontSize: 12, margin: '0 0 10px 2px' };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: 420, margin: '0 auto', padding: '56px 24px', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/logo-montebello-icono.webp" alt="" style={{ width: 48, height: 'auto', margin: '0 auto 12px' }} />
          <h1 style={{ fontSize: 22, fontWeight: 'bold', color: '#0f2a44', margin: 0 }}>Crear cuenta</h1>
          <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0 0' }}>Examen de diagnóstico</p>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <form onSubmit={handleSubmit} noValidate>
            <input
              placeholder="Nombre y apellido"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              autoComplete="name"
              className="input-registro-premium"
              style={{ ...estiloInput, marginBottom: 12 }}
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
              className="input-registro-premium"
              style={tocado.email && !emailValido ? estiloInputError : { ...estiloInput, marginBottom: 12 }}
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
              className="input-registro-premium"
              style={{ ...estiloInput, marginBottom: 12 }}
            />
            <input
              placeholder="Escuela de procedencia"
              value={preparatoriaProcedencia}
              onChange={(e) => setPreparatoriaProcedencia(e.target.value)}
              required
              autoComplete="organization"
              className="input-registro-premium"
              style={{ ...estiloInput, marginBottom: 12 }}
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
              className="input-registro-premium"
              style={estiloInput}
            />
            {password && (
              <div style={{ marginBottom: 12, marginTop: 6 }}>
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
              className="input-registro-premium"
              style={tocado.password2 && !passwordsCoinciden ? estiloInputError : { ...estiloInput, marginBottom: 12 }}
            />
            {tocado.password2 && !passwordsCoinciden && (
              <p style={estiloErrorCampo}>Las contraseñas no coinciden</p>
            )}
            <button
              type="submit"
              disabled={cargando}
              aria-busy={cargando}
              className="boton-registro-premium"
              style={{
                width: '100%', height: 44, marginTop: 8, background: cargando ? '#7c8fa0' : '#0f2a44', color: '#fff',
                border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: cargando ? 'not-allowed' : 'pointer',
              }}
            >
              {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          {error && <p style={{ color: '#c0392b', fontSize: 13, marginTop: 12, marginBottom: 0 }}>{error}</p>}
        </div>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#666' }}>
          ¿Ya tienes cuenta? <Link href="/login" style={{ color: '#0f2a44', fontWeight: 600 }}>Inicia sesión</Link>
        </div>
      </div>

      <style jsx global>{`
        .input-registro-premium {
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .input-registro-premium:focus {
          border-color: #0f2a44 !important;
          box-shadow: 0 0 0 3px rgba(15,42,68,0.12);
        }
        .boton-registro-premium:hover:not(:disabled) {
          background: #162f4a !important;
        }
      `}</style>
    </div>
  );
}
