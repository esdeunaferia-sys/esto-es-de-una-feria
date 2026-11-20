import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// El HTML base de TODAS las páginas de la web (no se usa en la app del celu).
// Corre solo al armar el sitio (en Node), así que acá no hay `window` ni nada del navegador.
// El título y la descripción valen para todo el sitio. Los de cada feria quedan para
// Expo SDK 58, con `generateMetadata()` en cada página.

const TITULO = 'Esto es de una feria · Guía de ferias americanas';
const DESCRIPCION =
  'Encontrá ferias americanas, showrooms y ferias de ropa usada en Buenos Aires: ' +
  'días, horarios, precios, mapa y contacto. Todos tienen derecho a vestirse increíble.';

export default function Root({ children }: PropsWithChildren) {
  const { htmlAttributes, bodyAttributes, headNodes, bodyNodes } = useServerDocumentContext();

  return (
    // lang="es-AR": el sitio está en español de Argentina (ayuda a Google y a los lectores de pantalla)
    <html lang="es-AR" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Lo que se ve en la pestaña del navegador y en Google */}
        <title>{TITULO}</title>
        <meta name="description" content={DESCRIPCION} />

        {/* Vista previa al compartir el link (WhatsApp, Instagram, Facebook, etc.) */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Esto es de una feria" />
        <meta property="og:title" content={TITULO} />
        <meta property="og:description" content={DESCRIPCION} />
        <meta property="og:locale" content="es_AR" />

        {/* Color de la barra del navegador en el celu (mismo blanco que el encabezado) */}
        <meta name="theme-color" content="#FFFFFF" />
        {/* El sitio está diseñado solo en claro: que el navegador no oscurezca nada solo */}
        <meta name="color-scheme" content="light" />

        {/* Estilos que necesita React Native Web para ocupar toda la pantalla */}
        <ScrollViewStyleReset />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
