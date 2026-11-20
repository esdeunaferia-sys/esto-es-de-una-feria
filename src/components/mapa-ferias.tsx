import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

import { armarHtmlMapa, conCoordenadas, slugDelMensajeDelMapa } from '@/components/mapa-html';
import type { Feria } from '@/types/feria';

// Mapa del CELU (iOS/Android): el HTML de Leaflet va adentro de un WebView.
// (En la web Expo usa mapa-ferias.web.tsx, con <iframe>. Elige solo según la plataforma,
// así la web no carga el código del WebView.)
export function MapaFerias({ ferias }: { ferias: Feria[] }) {
  const router = useRouter();

  return (
    <WebView
      // Si cambian las ferias (filtros), la `key` cambia y el mapa se rearma de cero
      key={conCoordenadas(ferias).map((f) => f.id).join(',')}
      originWhitelist={['*']}
      source={{ html: armarHtmlMapa(ferias) }}
      style={styles.mapa}
      onMessage={(evento) => {
        // En el celu el mensaje llega como texto: lo convertimos de vuelta
        try {
          const slug = slugDelMensajeDelMapa(JSON.parse(evento.nativeEvent.data));
          if (slug) router.push({ pathname: '/feria/[slug]', params: { slug } });
        } catch {
          // mensaje que no es JSON: lo ignoramos
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  mapa: {
    flex: 1,
    width: '100%',
  },
});
