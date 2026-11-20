import type { Feria } from '@/types/feria';
import { cuandoAbre } from '@/utils/dias';

// Lo que comparten el mapa de la web (mapa-ferias.web.tsx, con <iframe>) y el del
// celu (mapa-ferias.tsx, con WebView): el HTML de Leaflet + OpenStreetMap y cómo
// leer el mensaje que manda el globito al tocar "Ver feria →".

// Solo las ferias que tienen coordenadas cargadas
export function conCoordenadas(ferias: Feria[]): Feria[] {
  return ferias.filter((f) => f.lat !== null && f.lng !== null);
}

// El mapa manda mensajes del tipo { tipo: 'abrir-feria', slug: 'camom' }.
// Devuelve el slug si el mensaje tiene esa forma, o null si es cualquier otra cosa.
export function slugDelMensajeDelMapa(mensaje: unknown): string | null {
  if (typeof mensaje !== 'object' || mensaje === null) return null;
  const { tipo, slug } = mensaje as { tipo?: unknown; slug?: unknown };
  return tipo === 'abrir-feria' && typeof slug === 'string' ? slug : null;
}

// Arma la página completa del mapa con un pin por feria.
// Los textos se ponen con textContent (nunca como HTML) y el JSON va con `<` escapado,
// así ningún nombre o dirección puede romper el mapa.
export function armarHtmlMapa(ferias: Feria[]): string {
  // Solo los datos que necesita el globito del mapa
  const datosMapa = conCoordenadas(ferias).map((f) => ({
    slug: f.slug,
    nombre: f.nombre,
    lugar: [f.direccion, f.barrio ? `(${f.barrio})` : ''].filter(Boolean).join(' '),
    cuando: cuandoAbre(f),
    foto: f.foto_perfil,
    lat: f.lat,
    lng: f.lng,
  }));
  // `<` escapado para que ningún texto pueda cerrar el <script> del mapa
  const datosMapaJson = JSON.stringify(datosMapa).replace(/</g, '\\u003c');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body, html, #map { height: 100%; margin: 0; padding: 0; }
          .leaflet-popup-content-wrapper { border-radius: 12px; padding: 0; overflow: hidden; }
          .leaflet-popup-content { margin: 0; width: 220px !important; font-family: system-ui, sans-serif; }
          .globito-foto { display: block; width: 100%; height: 120px; object-fit: cover; background: #EDF2F7; }
          .globito-info { padding: 10px 12px 12px; }
          .globito-nombre { font-size: 15px; font-weight: 700; color: #1A202C; margin-bottom: 4px; }
          .globito-dato { font-size: 12px; color: #4A5568; margin-top: 2px; }
          .globito-boton { display: block; width: 100%; margin-top: 10px; padding: 8px; border: none;
            border-radius: 8px; background: #3182CE; color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map');

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
          }).addTo(map);

          // Le avisa a la app qué feria abrir (en la web y en el celu el "buzón" es distinto)
          function abrirFeria(slug) {
            var mensaje = { tipo: 'abrir-feria', slug: slug };
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify(mensaje));
            } else {
              window.parent.postMessage(mensaje, '*');
            }
          }

          // Crea un elemento con texto. Usamos textContent (no HTML) para que
          // ningún nombre o dirección pueda romper el mapa.
          function crear(etiqueta, clase, texto) {
            var el = document.createElement(etiqueta);
            el.className = clase;
            if (texto) el.textContent = texto;
            return el;
          }

          var ferias = ${datosMapaJson};
          var puntos = []; // posición de cada pin, para encuadrar el mapa al final
          ferias.forEach(function(f) {
            puntos.push([f.lat, f.lng]);
            var globito = document.createElement('div');

            // La foto se baja recién cuando se abre el globito (ver 'popupopen' más abajo)
            var foto = null;
            if (f.foto) {
              foto = crear('img', 'globito-foto');
              foto.alt = f.nombre;
              globito.appendChild(foto);
            }

            var info = crear('div', 'globito-info');
            info.appendChild(crear('div', 'globito-nombre', f.nombre));
            if (f.lugar) info.appendChild(crear('div', 'globito-dato', '📍 ' + f.lugar));
            if (f.cuando) info.appendChild(crear('div', 'globito-dato', '🗓️ ' + f.cuando));

            var boton = crear('button', 'globito-boton', 'Ver feria →');
            boton.onclick = function() { abrirFeria(f.slug); };
            info.appendChild(boton);
            globito.appendChild(info);

            var marcador = L.marker([f.lat, f.lng]).addTo(map).bindPopup(globito, { minWidth: 220, maxWidth: 220 });
            marcador.on('popupopen', function() {
              if (foto && !foto.getAttribute('src')) foto.src = f.foto;
            });
          });

          // Encuadre: el mapa se acomoda para que se vean todos los pines (con un margen).
          // Como el mapa se rearma al cambiar los filtros, siempre muestra las que quedaron.
          if (puntos.length > 1) {
            map.fitBounds(puntos, { padding: [40, 40], maxZoom: 15 });
          } else if (puntos.length === 1) {
            map.setView(puntos[0], 15); // una sola feria: zoom de barrio
          } else {
            map.setView([-34.6037, -58.3816], 12); // ninguna: centro de Buenos Aires
          }
        </script>
      </body>
    </html>
  `;
}
