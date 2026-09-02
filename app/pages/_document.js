import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* CSS de KaTeX para las fórmulas matemáticas del editor de
            preguntas (usadas junto con react-katex en examen.js y admin). */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.18.5/dist/katex.min.css"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
