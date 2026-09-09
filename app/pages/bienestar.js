import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

// Las 24 afirmaciones oficiales del instrumento TMMS-24 ("¿Qué es lo que
// siento?"). Son fijas, no configurables desde el admin — el instrumento
// no se modifica.
const AFIRMACIONES = [
  'Presto mucha atención a los sentimientos.',
  'Normalmente me preocupo mucho por lo que siento.',
  'Normalmente dedico tiempo a pensar en mis emociones.',
  'Pienso que merece la pena prestar atención a mis emociones y estado de ánimo.',
  'Dejo que mis sentimientos afecten a mis pensamientos.',
  'Pienso en mi estado de ánimo constantemente.',
  'A menudo pienso en mis sentimientos.',
  'Presto mucha atención a cómo me siento.',
  'Tengo claros mis sentimientos.',
  'Frecuentemente puedo definir mis sentimientos.',
  'Casi siempre sé cómo me siento.',
  'Normalmente conozco mis sentimientos sobre las personas.',
  'A menudo me doy cuenta de mis sentimientos en diferentes situaciones.',
  'Siempre puedo decir cómo me siento.',
  'A veces puedo decir cuáles son mis emociones.',
  'Puedo llegar a comprender mis sentimientos.',
  'Aunque a veces me siento triste, suelo tener una visión optimista.',
  'Aunque me sienta mal, procuro pensar en cosas agradables.',
  'Cuando estoy triste, pienso en todos los placeres de la vida.',
  'Intento tener pensamientos positivos aunque me sienta mal.',
  'Si doy demasiadas vueltas a las cosas, complicándolas, trato de calmarme.',
  'Me preocupo por tener un buen estado de ánimo.',
  'Tengo mucha energía cuando me siento feliz.',
  'Cuando estoy enfadado intento cambiar mi estado de ánimo.',
];

const ESCALA = [
  { valor: 1, texto: 'Nada de acuerdo' },
  { valor: 2, texto: 'Algo de acuerdo' },
  { valor: 3, texto: 'Bastante de acuerdo' },
  { valor: 4, texto: 'Muy de acuerdo' },
  { valor: 5, texto: 'Totalmente de acuerdo' },
];

export default function Bienestar() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [estado, setEstado] = useState(null);
  const [genero, setGenero] = useState('');
  const [respuestas, setRespuestas] = useState(Array(24).fill(null));
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [finalizado, setFinalizado] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => {
        fetch('/api/bienestar/estado')
          .then((r) => r.json())
          .then((d) => {
            setEstado(d);
            if (d.generoGuardado) setGenero(d.generoGuardado);
            setCargando(false);
          });
      })
      .catch(() => router.push('/login'));
  }, []);

  async function enviar() {
    setError('');
    if (!genero) {
      setError('Falta indicar el género.');
      return;
    }
    if (respuestas.some((r) => r == null)) {
      setError('Debes responder las 24 afirmaciones antes de continuar.');
      return;
    }
    setEnviando(true);
    const res = await fetch('/api/bienestar/guardar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ genero, respuestas }),
    });
    const data = await res.json();
    setEnviando(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setFinalizado(true);
  }

  async function cerrarSesion() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const contenedor = { maxWidth: 720, margin: '0 auto', padding: '32px 20px' };

  if (cargando) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Cargando…</div>;
  }

  if (finalizado) {
    return (
      <div style={contenedor}>
        <div style={{ background: '#eafaf1', border: '1px solid #cfe8d8', borderRadius: 12, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
          <p style={{ margin: '0 0 20px 0', color: '#2e7d32', fontSize: 15 }}>
            Gracias por completar esta actividad.
          </p>
          <button
            onClick={cerrarSesion}
            style={{ padding: '10px 24px', background: '#fff', color: '#2e7d32', border: '1px solid #2e7d32', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  if (estado && !estado.disponible) {
    const mensajes = {
      requisito_pendiente: 'Esta sección se habilitará más adelante.',
      espera_nueva_sesion: 'Esta sección se habilitará la próxima vez que inicies sesión.',
      ya_respondido: 'Ya completaste esta actividad. ¡Gracias!',
    };
    return (
      <div style={contenedor}>
        <div style={{ background: '#fdf3e3', border: '1px solid #f0d9a8', borderRadius: 12, padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
          <p style={{ margin: 0, color: '#8a6416', fontSize: 15 }}>
            {mensajes[estado.motivo] || 'Esta sección no está disponible por ahora.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={contenedor}>
      <h2 style={{ fontSize: 18, marginBottom: 4 }}>¿Qué es lo que siento?</h2>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
        Lee cada frase y elige qué tan de acuerdo estás. No hay respuestas correctas ni incorrectas — responde con lo primero que sientas, sin pensarlo demasiado.
      </p>

      <div style={{ background: '#fafbfc', border: '1px solid #eee', borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <p style={{ margin: '0 0 10px 0', fontSize: 14, fontWeight: 600 }}>Género</p>
        <div style={{ display: 'flex', gap: 10 }}>
          {[{ v: 'M', l: 'Hombre' }, { v: 'F', l: 'Mujer' }].map((g) => (
            <button
              key={g.v}
              onClick={() => setGenero(g.v)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer', fontSize: 14,
                border: genero === g.v ? '2px solid #4a90d9' : '1px solid #ddd',
                background: genero === g.v ? '#eaf2fb' : '#fff',
                color: genero === g.v ? '#3a5b7a' : '#555', fontWeight: genero === g.v ? 600 : 400,
              }}
            >
              {g.l}
            </button>
          ))}
        </div>
      </div>

      {AFIRMACIONES.map((texto, i) => (
        <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
          <p style={{ margin: '0 0 10px 0', fontSize: 14 }}>{i + 1}. {texto}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ESCALA.map((op) => (
              <button
                key={op.valor}
                onClick={() => {
                  const copia = [...respuestas];
                  copia[i] = op.valor;
                  setRespuestas(copia);
                }}
                title={op.texto}
                style={{
                  flex: '1 0 60px', padding: '8px 4px', borderRadius: 8, cursor: 'pointer', fontSize: 12, textAlign: 'center',
                  border: respuestas[i] === op.valor ? '2px solid #4a90d9' : '1px solid #ddd',
                  background: respuestas[i] === op.valor ? '#eaf2fb' : '#fff',
                  color: respuestas[i] === op.valor ? '#3a5b7a' : '#555',
                  fontWeight: respuestas[i] === op.valor ? 600 : 400,
                }}
              >
                {op.valor}
              </button>
            ))}
          </div>
        </div>
      ))}

      {error && <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <button
          onClick={enviar}
          disabled={enviando}
          style={{
            padding: '12px 28px', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600,
            background: enviando ? '#a9c6e8' : '#4a90d9', cursor: enviando ? 'default' : 'pointer',
          }}
        >
          {enviando ? 'Guardando…' : 'Terminar'}
        </button>
      </div>
    </div>
  );
}
