import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Examen() {
  const [alumno, setAlumno] = useState(null);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setAlumno(data);
        setCargando(false);
      })
      .catch(() => {
        router.push('/login');
      });
  }, []);

  async function cerrarSesion() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (cargando) return null;

  return (
    <div style={{ maxWidth: 500, margin: '60px auto', fontFamily: 'sans-serif', padding: 24, textAlign: 'center' }}>
      <h1>Hola, {alumno?.nombre} 👋</h1>
      <p style={{ color: '#666' }}>
        Tu cuenta ya está lista. Aquí vivirá el examen de diagnóstico completo (próximo paso).
      </p>
      <button onClick={cerrarSesion} style={{ marginTop: 20, padding: '8px 16px' }}>
        Cerrar sesión
      </button>
    </div>
  );
}
