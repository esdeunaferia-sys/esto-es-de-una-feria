import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { armarHtmlMapa, slugDelMensajeDelMapa } from '@/components/mapa-html';
import type { Feria } from '@/types/feria';

// Mapa de la WEB: el HTML de Leaflet va adentro de un <iframe>.
// (En el celu Expo usa mapa-ferias.tsx, con WebView. Elige solo según la plataforma.)
export function MapaFerias({ ferias }: { ferias: Feria[] }) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Al tocar "Ver feria →" el iframe manda un mensaje. Solo aceptamos los que vienen
  // de NUESTRO iframe (ignoramos los de cualquier otra ventana o extensión).
  useEffect(() => {
    const alRecibirMensaje = (evento: MessageEvent) => {
      if (evento.source !== iframeRef.current?.contentWindow) return;
      const slug = slugDelMensajeDelMapa(evento.data);
      if (slug) router.push({ pathname: '/feria/[slug]', params: { slug } });
    };

    window.addEventListener('message', alRecibirMensaje);
    return () => window.removeEventListener('message', alRecibirMensaje);
  }, [router]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={armarHtmlMapa(ferias)} // si cambian las ferias (filtros), el mapa se rearma
      style={{ width: '100%', height: '100%', border: 'none' }}
      title="Mapa de Ferias"
    />
  );
}
