import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import Head from 'expo-router/head';

import '../../firebaseConfig';

import '@/global.css';
import { TITULO_SITIO } from '@/utils/sitio';

// La app está diseñada solo en modo claro (app.json: "userInterfaceStyle": "light"),
// así que usamos siempre el tema claro, aunque el celu esté en modo oscuro.
export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      {/* Título de la pestaña y de Google. Va con <Head> (no en +html.tsx): ver el
          comentario de src/app/+html.tsx */}
      <Head>
        <title>{TITULO_SITIO}</title>
      </Head>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="feria/[slug]" />
      </Stack>
    </ThemeProvider>
  );
}
