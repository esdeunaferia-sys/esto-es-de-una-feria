import { Image } from 'expo-image';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { supabase } from '../supabase';
import type { Feria } from '@/types/feria';
import { BadgesFeria } from '@/components/badges-feria';
import { FiltroChips, type OpcionFiltro } from '@/components/filtro-chips';
import { DIAS_SEMANA, formatearDias } from '@/utils/dias';

// Opciones fijas de los filtros (los días vienen de src/utils/dias.ts)
const OPCIONES_PRECIOS = comoOpciones(['$', '$$', '$$$', '$$$$', '$$$$$']);
// Los "sí/no" de la feria. El valor es el nombre de la columna en Supabase.
const OPCIONES_EXTRAS: OpcionFiltro[] = [
  { valor: 'compra_ropa', etiqueta: '🛍️ Compra ropa' },
  { valor: 'acepta_donaciones', etiqueta: '🤝 Acepta donaciones' },
  { valor: 'acepta_cambios', etiqueta: '🔄 Acepta cambios' },
];

// Para opciones donde lo que se muestra es igual a lo que está en la base
function comoOpciones(valores: string[]): OpcionFiltro[] {
  return valores.map((valor) => ({ valor, etiqueta: valor }));
}

// Saca vacíos y repetidos, y ordena alfabéticamente (respetando tildes)
function ordenarAlfabetico(valores: (string | null | undefined)[]): string[] {
  const unicos = Array.from(new Set(valores.filter((v): v is string => !!v)));
  return unicos.sort((a, b) => a.localeCompare(b, 'es'));
}

// "Lunes a viernes • 10 a 19 hs". Si la feria no tiene días fijos, usa la
// observación de días (ej: "Solo en fechas especiales"). Solo lo que haya.
function cuandoAbre(f: Feria): string {
  const dias = formatearDias(f.dias_semana) || f.observaciones_dias?.trim();
  return [dias, f.horario?.trim()].filter(Boolean).join(' • ');
}

// ¿La feria tiene alguna de las opciones marcadas? Si no hay nada marcado, pasa.
function coincideAlguna(marcados: string[], valoresDeLaFeria: (string | null)[] | null): boolean {
  if (marcados.length === 0) return true;
  return marcados.some((m) => valoresDeLaFeria?.includes(m) ?? false);
}

// Pide las ferias activas a Supabase. Solo trae los datos (no toca el estado
// de la pantalla): devuelve la lista, o null si algo falló.
async function pedirFerias(): Promise<Feria[] | null> {
  try {
    const { data, error } = await supabase
      .from('ferias')
      .select('*')
      .eq('activa', true)
      .order('orden', { ascending: true }) // <-- Ordena por tu número personalizado (1, 2, 3...)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar ferias:', error.message);
      return null;
    }
    return (data ?? []) as Feria[];
  } catch (err) {
    console.error('Error de conexión:', err);
    return null;
  }
}

// El mapa manda mensajes del tipo { tipo: 'abrir-feria', slug: 'camom' }.
// Devuelve el slug si el mensaje tiene esa forma, o null si es cualquier otra cosa.
function slugDelMensajeDelMapa(mensaje: unknown): string | null {
  if (typeof mensaje !== 'object' || mensaje === null) return null;
  const { tipo, slug } = mensaje as { tipo?: unknown; slug?: unknown };
  return tipo === 'abrir-feria' && typeof slug === 'string' ? slug : null;
}

export default function HomeScreen() {
  const router = useRouter();
  const iframeMapaRef = useRef<HTMLIFrameElement>(null);
  const [ferias, setFerias] = useState<Feria[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refrescando, setRefrescando] = useState(false); // deslizar para refrescar (celu)
  // La vista (lista o mapa) se guarda en la URL (/?vista=mapa). Así, al volver
  // de una ficha, al recargar o al compartir el link, se mantiene la vista elegida.
  const { vista } = useLocalSearchParams<{ vista?: string }>();
  const vistaActual: 'lista' | 'mapa' = vista === 'mapa' ? 'mapa' : 'lista';
  const setVistaActual = (nueva: 'lista' | 'mapa') => {
    router.setParams({ vista: nueva === 'mapa' ? 'mapa' : undefined });
  };

  // Estados de Filtro
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  // Cada filtro guarda la lista de opciones marcadas. Lista vacía = no filtra.
  const [diasFiltro, setDiasFiltro] = useState<string[]>([]);
  const [barriosFiltro, setBarriosFiltro] = useState<string[]>([]);
  const [preciosFiltro, setPreciosFiltro] = useState<string[]>([]);
  const [tiposFiltro, setTiposFiltro] = useState<string[]>([]);
  const [modalidadesFiltro, setModalidadesFiltro] = useState<string[]>([]);
  const [extrasFiltro, setExtrasFiltro] = useState<string[]>([]);

  // Al abrir la home: `loading` ya arranca en true, y cuando llega la respuesta
  // guardamos las ferias y apagamos la ruedita.
  useEffect(() => {
    pedirFerias().then((lista) => {
      if (lista) setFerias(lista);
      setLoading(false);
    });
  }, []);

  // En la web el mapa es un <iframe>: escuchamos sus mensajes, pero solo los que
  // vienen de NUESTRO iframe (ignoramos los de cualquier otra ventana o extensión).
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const alRecibirMensaje = (evento: MessageEvent) => {
      if (evento.source !== iframeMapaRef.current?.contentWindow) return;
      const slug = slugDelMensajeDelMapa(evento.data);
      if (slug) router.push({ pathname: '/feria/[slug]', params: { slug } });
    };

    window.addEventListener('message', alRecibirMensaje);
    return () => window.removeEventListener('message', alRecibirMensaje);
  }, [router]);

  // Deslizar hacia abajo para refrescar (solo en el celu)
  const refrescarFerias = async () => {
    setRefrescando(true);
    const lista = await pedirFerias();
    if (lista) setFerias(lista); // si falló, dejamos las que ya estaban
    setRefrescando(false);
  };

  // Opciones de barrio, tipo y modalidad: salen de los datos, sin repetir y en orden alfabético
  const opcionesBarrios = useMemo(
    () => comoOpciones(ordenarAlfabetico(ferias.map((f) => f.barrio))),
    [ferias],
  );
  const opcionesTipos = useMemo(
    () => comoOpciones(ordenarAlfabetico(ferias.flatMap((f) => f.tipo || []))),
    [ferias],
  );
  const opcionesModalidades = useMemo(
    () => comoOpciones(ordenarAlfabetico(ferias.flatMap((f) => f.modalidad || []))),
    [ferias],
  );

  // Filtrado de ferias.
  // Dentro de una categoría alcanza con que coincida UNA opción (sábado o domingo).
  // Entre categorías tienen que cumplirse TODAS (sábado o domingo, y además en Palermo).
  const feriasFiltradas = useMemo(() => {
    return ferias.filter((f) => {
      if (!coincideAlguna(diasFiltro, f.dias_semana)) return false;
      if (!coincideAlguna(barriosFiltro, [f.barrio])) return false;
      if (!coincideAlguna(preciosFiltro, f.precio)) return false;
      if (!coincideAlguna(tiposFiltro, f.tipo)) return false;
      if (!coincideAlguna(modalidadesFiltro, f.modalidad)) return false;
      // Extras: igual que el resto, alcanza con que cumpla UNO de los marcados
      const extrasDeLaFeria = [
        f.compra_ropa === true ? 'compra_ropa' : null,
        f.acepta_donaciones === true ? 'acepta_donaciones' : null,
        f.acepta_cambios === true ? 'acepta_cambios' : null,
      ];
      if (!coincideAlguna(extrasFiltro, extrasDeLaFeria)) return false;
      return true;
    });
  }, [ferias, diasFiltro, barriosFiltro, preciosFiltro, tiposFiltro, modalidadesFiltro, extrasFiltro]);

  // Cantidad de chips marcados en total (se muestra en el botón "Filtros")
  const totalFiltrosActivos =
    diasFiltro.length +
    barriosFiltro.length +
    preciosFiltro.length +
    tiposFiltro.length +
    modalidadesFiltro.length +
    extrasFiltro.length;

  const limpiarFiltros = () => {
    setDiasFiltro([]);
    setBarriosFiltro([]);
    setPreciosFiltro([]);
    setTiposFiltro([]);
    setModalidadesFiltro([]);
    setExtrasFiltro([]);
  };

  // Coordenadas para Mapa
  const feriasConCoordenadas = feriasFiltradas.filter(f => f.lat !== null && f.lng !== null);

  // Solo los datos que necesita el globito del mapa
  const datosMapa = feriasConCoordenadas.map((f) => ({
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

  const mapHtml = `
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

  // Cada card es un link de verdad a la ficha (en la web, un <a href="/feria/...">):
  // Google puede seguirlo y se puede abrir en otra pestaña con Ctrl+clic o la ruedita.
  // Solo pasamos el slug: la ficha busca el resto de los datos en Supabase.
  const renderCard = (item: Feria) => (
    <Link key={item.id} href={{ pathname: '/feria/[slug]', params: { slug: item.slug } }} asChild>
      <TouchableOpacity style={styles.cardFeria}>
        {/* Las ferias "grande" tienen la foto más alta y el nombre más grande */}
        {item.foto_perfil ? (
          <Image
            source={{ uri: item.foto_perfil }}
            style={[styles.imagenPortada, item.tamano === 'grande' && styles.imagenPortadaGrande]}
            contentFit="cover"
            transition={200} // aparece con un fundido suave de 0,2 segundos
            alt={item.nombre}
          />
        ) : (
          <View
            style={[
              styles.imagenPortada,
              item.tamano === 'grande' && styles.imagenPortadaGrande,
              styles.imagenPlaceholder,
            ]}
          >
            <Text style={{ color: '#A0AEC0' }}>Sin imagen</Text>
          </View>
        )}

        <View style={styles.cardContenido}>
          <View style={styles.cardHeader}>
            <Text style={[styles.nombreFeria, item.tamano === 'grande' && styles.nombreFeriaGrande]}>
              {item.nombre}
            </Text>
            <BadgesFeria feria={item} tamano="chico" style={styles.badgesCard} />
          </View>

          <Text style={styles.infoText}>📍 {item.direccion} ({item.barrio})</Text>
          {cuandoAbre(item) ? <Text style={styles.infoText}>🗓️ {cuandoAbre(item)}</Text> : null}
          {item.precio && item.precio.length > 0 && (
            <Text style={styles.infoText}>🏷️ Precios: {item.precio.join(', ')}</Text>
          )}

          {/* El Instagram y el WhatsApp no van en la card: están como botones en la ficha */}
          {item.tipo && item.tipo.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tipo.map((tipo, index) => (
                <View key={`${tipo}-${index}`} style={styles.tag}><Text style={styles.tagText}>{tipo}</Text></View>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Link>
  );

  const emptyList = (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTexto}>No encontramos ferias que coincidan con esos filtros.</Text>
      <TouchableOpacity style={styles.botonLimpiarEmpty} onPress={limpiarFiltros}>
        <Text style={styles.textoLimpiarEmpty}>Limpiar filtros</Text>
      </TouchableOpacity>
    </View>
  );

  // Encabezado: título, Sumá tu feria, filtros y Lista/Mapa. En la vista Lista va
  // adentro de lo que se scrollea (así en el celu no ocupa media pantalla todo el
  // tiempo); en la vista Mapa queda fijo arriba, porque el mapa no se scrollea.
  const encabezado = (
    <View style={styles.header}>
      {/* Encabezado. En el celu va todo centrado y en columna: título, "Sumá tu
          feria" y filtros. En la compu (web, desde 768px) src/global.css lo pasa a
          una fila: filtros a la izquierda, título al medio y "Sumá tu feria" a la
          derecha. Los nativeID son los que usa ese CSS. */}
      <View style={styles.headerTop} nativeID="encabezado">
        <View style={styles.headerTitulo} nativeID="encabezado-titulo">
          <Text style={styles.tituloApp}>{'Esto es de\nuna feria'}</Text>
          <Text style={styles.lema}>• Todos tienen derecho a vestirse increíble •</Text>
          <Text style={styles.subtitulo}>
            🪞Guía de ferias americanas por{' '}
            {/* En la web es un <a> de verdad; en el celu abre Instagram */}
            <Link href="https://instagram.com/estoesdeunaferia" target="_blank" style={styles.linkInstagram}>
              @estoesdeunaferia
            </Link>
          </Text>
        </View>

        <View style={styles.encabezadoSumar} nativeID="encabezado-sumar">
          <Link href="https://forms.gle/hrpUULd6UGmay2JC9" target="_blank" style={styles.linkSumarFeria}>
            ¡Sumá tu feria!
          </Link>
        </View>

        <View style={styles.encabezadoFiltros} nativeID="encabezado-filtros">
          <TouchableOpacity
            style={[styles.botonFiltroToggle, totalFiltrosActivos > 0 && styles.botonFiltroActivo]}
            onPress={() => setMostrarFiltros(!mostrarFiltros)}
          >
            <Text style={[styles.textoBotonFiltro, totalFiltrosActivos > 0 && styles.textoBotonFiltroActivo]}>
              🔍 Filtrar ferias{totalFiltrosActivos > 0 ? ` (${totalFiltrosActivos})` : ''} {mostrarFiltros ? '▴' : '▾'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Panel Desplegable de Filtros */}
      {mostrarFiltros && (
        <ScrollView
          style={[styles.panelFiltros, vistaActual === 'mapa' && styles.panelFiltrosMapa]}
          nestedScrollEnabled
        >
          <View style={styles.headerFiltros}>
            <Text style={styles.tituloFiltros}>
              Filtrar ferias{' '}
              <Text style={styles.contadorFiltros}>
                · {feriasFiltradas.length} {feriasFiltradas.length === 1 ? 'feria' : 'ferias'}
              </Text>
            </Text>
            {totalFiltrosActivos > 0 && (
              <TouchableOpacity onPress={limpiarFiltros}>
                <Text style={styles.textoLimpiar}>Limpiar todos</Text>
              </TouchableOpacity>
            )}
          </View>

          <FiltroChips titulo="🗓️ Día" opciones={DIAS_SEMANA} seleccionados={diasFiltro} onCambiar={setDiasFiltro} />
          <FiltroChips titulo="📍 Barrio" opciones={opcionesBarrios} seleccionados={barriosFiltro} onCambiar={setBarriosFiltro} />
          <FiltroChips titulo="🏷️ Precio" opciones={OPCIONES_PRECIOS} seleccionados={preciosFiltro} onCambiar={setPreciosFiltro} />
          <FiltroChips titulo="🎨 Estilo / Tipo" opciones={opcionesTipos} seleccionados={tiposFiltro} onCambiar={setTiposFiltro} />
          <FiltroChips titulo="🏢 Modalidad" opciones={opcionesModalidades} seleccionados={modalidadesFiltro} onCambiar={setModalidadesFiltro} />
          <FiltroChips titulo="✨ Extras" opciones={OPCIONES_EXTRAS} seleccionados={extrasFiltro} onCambiar={setExtrasFiltro} />
        </ScrollView>
      )}

      {/* Selector de Vista (Lista / Mapa) */}
      <View style={styles.selectorContainer}>
        <TouchableOpacity 
          style={[styles.botonSelector, vistaActual === 'lista' && styles.botonActivo]}
          onPress={() => setVistaActual('lista')}
        >
          <Text style={[styles.textoSelector, vistaActual === 'lista' && styles.textoActivo]}>
            📋 Lista ({feriasFiltradas.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.botonSelector, vistaActual === 'mapa' && styles.botonActivo]}
          onPress={() => setVistaActual('mapa')}
        >
          <Text style={[styles.textoSelector, vistaActual === 'mapa' && styles.textoActivo]}>
            🗺️ Mapa
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        // Mientras carga Supabase
        <>
          {encabezado}
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3182CE" />
            <Text style={styles.loadingTexto}>Cargando ferias desde la nube...</Text>
          </View>
        </>
      ) : vistaActual === 'lista' ? (
        Platform.OS === 'web' ? (
          <ScrollView>
            {encabezado}
            <View style={styles.listaContainer}>
              {feriasFiltradas.length === 0 ? (
                emptyList
              ) : (
                <View style={styles.listaWeb} nativeID="feria-masonry">
                  {feriasFiltradas.map(renderCard)}
                </View>
              )}
            </View>
          </ScrollView>
        ) : (
          <FlatList
            data={feriasFiltradas}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={encabezado}
            ListHeaderComponentStyle={styles.encabezadoLista}
            contentContainerStyle={styles.listaNativa}
            onRefresh={refrescarFerias}
            refreshing={refrescando}
            ListEmptyComponent={emptyList}
            renderItem={({ item }) => <View style={styles.itemLista}>{renderCard(item)}</View>}
          />
        )
      ) : (
        // Vista Mapa: encabezado fijo arriba y el mapa ocupa el resto
        <>
          {encabezado}
          {Platform.OS === 'web' ? (
            <iframe
              ref={iframeMapaRef}
              srcDoc={mapHtml}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Mapa de Ferias"
            />
          ) : (
            <WebView
              key={JSON.stringify(feriasConCoordenadas.map(f => f.id))}
              originWhitelist={['*']}
              source={{ html: mapHtml }}
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
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTop: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginBottom: 12,
  },
  headerTitulo: {
    alignItems: 'center',
  },
  tituloApp: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
  },
  lema: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#4A5568',
    marginTop: 4,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 8,
    textAlign: 'center',
  },
  linkInstagram: {
    color: '#3182CE',
    fontWeight: '600',
  },
  botonFiltroToggle: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#EBF8FF',
    borderWidth: 1.5,
    borderColor: '#3182CE',
  },
  encabezadoSumar: {
    alignItems: 'center',
    marginTop: 12,
  },
  linkSumarFeria: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3182CE',
  },
  encabezadoFiltros: {
    alignItems: 'center',
    marginTop: 12,
  },
  botonFiltroActivo: {
    backgroundColor: '#3182CE',
  },
  textoBotonFiltro: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2B6CB0',
  },
  textoBotonFiltroActivo: {
    color: '#FFFFFF',
  },
  panelFiltros: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  // En el Mapa el encabezado no se scrollea: el panel se limita y se scrollea por dentro
  panelFiltrosMapa: {
    maxHeight: 360,
  },
  headerFiltros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tituloFiltros: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  contadorFiltros: {
    fontWeight: '400',
    color: '#718096',
  },
  textoLimpiar: {
    fontSize: 12,
    color: '#E53E3E',
    fontWeight: '600',
  },
  selectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#EDF2F7',
    borderRadius: 10,
    padding: 4,
    // En el celu ocupa todo el ancho; en pantallas grandes se queda en 360px, centrada
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  botonSelector: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  botonActivo: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  textoSelector: {
    fontSize: 13,
    fontWeight: '600',
    color: '#718096',
  },
  textoActivo: {
    color: '#2C3E50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTexto: {
    marginTop: 12,
    color: '#718096',
    fontSize: 14,
  },
  listaContainer: {
    padding: 16,
  },
  // Celu: el encabezado ocupa todo el ancho y las cards llevan margen a los costados
  encabezadoLista: {
    marginBottom: 16,
  },
  listaNativa: {
    paddingBottom: 16,
  },
  itemLista: {
    paddingHorizontal: 16,
  },
  listaWeb: {
    width: '100%',
  },
  cardFeria: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    // Sombra sutil multiplataforma (iOS, Android y web) para despegar la card del fondo
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
  },
  imagenPortada: {
    width: '100%',
    height: 160,
    backgroundColor: '#EDF2F7', // gris de fondo mientras la foto carga
    // Redondeamos solo la imagen (en vez de overflow: 'hidden' en la card) para no recortar la sombra
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  imagenPortadaGrande: {
    height: 320, // el doble que la normal
  },
  imagenPlaceholder: {
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContenido: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nombreFeria: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
    flex: 1,
    marginRight: 8,
  },
  nombreFeriaGrande: {
    fontSize: 22,
  },
  // Badges de la card: a la derecha del nombre
  badgesCard: {
    justifyContent: 'flex-end',
    flexShrink: 1,
  },
  infoText: {
    fontSize: 13,
    color: '#4A5568',
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 11,
    color: '#4A5568',
    fontWeight: '600',
  },
  mapa: {
    flex: 1,
    width: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTexto: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 12,
  },
  botonLimpiarEmpty: {
    backgroundColor: '#3182CE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  textoLimpiarEmpty: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
});