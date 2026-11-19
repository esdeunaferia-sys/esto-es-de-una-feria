import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

// No hay nada a qué "suscribirse": solo queremos saber si estamos en el servidor o en el navegador.
const noSuscribir = () => () => {};

/**
 * En el build estático no se conoce el tema del usuario, así que el HTML se arma en claro.
 * En el navegador se usa el tema real. useSyncExternalStore devuelve `false` en el build
 * (y en la primera pasada del navegador, para que coincida con el HTML) y `true` después.
 */
export function useColorScheme() {
  const estaEnNavegador = useSyncExternalStore(
    noSuscribir,
    () => true,
    () => false,
  );

  const colorScheme = useRNColorScheme();

  if (estaEnNavegador) {
    return colorScheme;
  }

  return 'light';
}
