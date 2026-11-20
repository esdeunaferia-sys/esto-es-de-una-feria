import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';

import '../../firebaseConfig';

import '@/global.css';

// La app está diseñada solo en modo claro (app.json: "userInterfaceStyle": "light"),
// así que usamos siempre el tema claro, aunque el celu esté en modo oscuro.
export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="feria/[slug]" />
      </Stack>
    </ThemeProvider>
  );
}
