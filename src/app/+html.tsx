import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

import { DESCRIPCION_SITIO, TITULO_SITIO } from '@/utils/sitio';

// El HTML base de TODAS las páginas de la web (no se usa en la app del celu).
// Corre solo al armar el sitio (en Node), así que acá no hay `window` ni nada del navegador.
// OJO: el <title> NO va acá sino en src/app/_layout.tsx con <Head>. En Expo SDK 57,
// Expo Router siempre pone al principio del <head> un <title> propio (de react-helmet), y
// el navegador usa el primero: si el título estuviera acá, la pestaña mostraría uno vacío.
// Los títulos de cada feria quedan para Expo SDK 58, con `generateMetadata()`.

export default function Root({ children }: PropsWithChildren) {
  const { htmlAttributes, bodyAttributes, headNodes, bodyNodes } = useServerDocumentContext();

  return (
    // lang="es-AR": el sitio está en español de Argentina (ayuda a Google y a los lectores de pantalla)
    <html lang="es-AR" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* El texto debajo del título en Google */}
        <meta name="description" content={DESCRIPCION_SITIO} />

        {/* Vista previa al compartir el link (WhatsApp, Instagram, Facebook, etc.) */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Esto es de una feria" />
        <meta property="og:title" content={TITULO_SITIO} />
        <meta property="og:description" content={DESCRIPCION_SITIO} />
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
