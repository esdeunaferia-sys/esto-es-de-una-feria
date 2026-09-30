import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { supabase } from '../supabase';

export type Feria = {
  id: string;
  nombre: string;
  foto_perfil: string | null;
  fotos: string[] | null;
  barrio: string;
  direccion: string;
  dias_semana: string[] | null;
  horario: string;
  observaciones_dias: string | null;
  modalidad: string[] | null;
  precio: string[] | null;
  genero: string[] | null;
  tipo: string[] | null;
  instagram: string | null;
  whatsapp: string | null;
  lat: number | null;
  lng: number | null;
  compra_ropa: boolean | null;
  orden: number | null; // <-- Nueva propiedad
};

export default function HomeScreen() {
  const router = useRouter();
  const [ferias, setFerias] = useState<Feria[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [vistaActual, setVistaActual] = useState<'lista' | 'mapa'>('lista');

  // Estados de Filtro
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [barrioFiltro, setBarrioFiltro] = useState<string>('');
  const [precioFiltro, setPrecioFiltro] = useState<string>('');
  const [diaFiltro, setDiaFiltro] = useState<string>('');
  const [tipoFiltro, setTipoFiltro] = useState<string>('');
  const [generoFiltro, setGeneroFiltro] = useState<string>('');
  const [modalidadFiltro, setModalidadFiltro] = useState<string>('');
  const [compraRopaFiltro, setCompraRopaFiltro] = useState<boolean | null>(null);

  // Cargar ferias desde Supabase
  useEffect(() => {
    cargarFerias();
  }, []);

const cargarFerias = async () => {
  setLoading(true);
  try {
    const { data, error } = await supabase
      .from('ferias')
      .select('*')
      .eq('activa', true)
      .order('orden', { ascending: true }) // <-- Ordena por tu número personalizado (1, 2, 3...)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar ferias:', error.message);
    } else if (data) {
      setFerias(data as Feria[]);
    }
  } catch (err) {
    console.error('Error de conexión:', err);
  } finally {
    setLoading(false);
  }
};

  // Opciones únicas para filtros
  const opcionesBarrios = useMemo(() => {
    const barrios = ferias.map(f => f.barrio).filter(Boolean);
    return Array.from(new Set(barrios));
  }, [ferias]);

  const opcionesPrecios = ['$', '$$', '$$$', '$$$$', '$$$$$'];
  const opcionesDias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const opcionesModalidades = ['Fija / Local', 'Showroom fijo', 'Itinerante'];

  const opcionesTipos = useMemo(() => {
    const tipos = ferias.flatMap(f => f.tipo || []).filter(Boolean);
    return Array.from(new Set(tipos));
  }, [ferias]);

  const opcionesGeneros = useMemo(() => {
    const generos = ferias.flatMap(f => f.genero || []).filter(Boolean);
    return Array.from(new Set(generos));
  }, [ferias]);

  // Filtrado de ferias
  const feriasFiltradas = useMemo(() => {
    return ferias.filter(f => {
      if (barrioFiltro && f.barrio !== barrioFiltro) return false;
      if (precioFiltro && (!f.precio || !f.precio.includes(precioFiltro))) return false;
      if (modalidadFiltro && (!f.modalidad || !f.modalidad.includes(modalidadFiltro))) return false;
      if (diaFiltro && (!f.dias_semana || !f.dias_semana.includes(diaFiltro.toLowerCase()))) return false;
      if (tipoFiltro && (!f.tipo || !f.tipo.includes(tipoFiltro))) return false;
      if (generoFiltro && (!f.genero || !f.genero.includes(generoFiltro))) return false;
      if (compraRopaFiltro !== null && f.compra_ropa !== compraRopaFiltro) return false;
      return true;
    });
  }, [ferias, barrioFiltro, precioFiltro, diaFiltro, tipoFiltro, generoFiltro, modalidadFiltro, compraRopaFiltro]);

  const totalFiltrosActivos = [
    barrioFiltro, 
    precioFiltro, 
    diaFiltro, 
    tipoFiltro, 
    generoFiltro, 
    modalidadFiltro, 
    compraRopaFiltro !== null ? 'compraRopa' : ''
  ].filter(Boolean).length;

  const limpiarFiltros = () => {
    setBarrioFiltro('');
    setPrecioFiltro('');
    setDiaFiltro('');
    setTipoFiltro('');
    setGeneroFiltro('');
    setModalidadFiltro('');
    setCompraRopaFiltro(null);
  };

  const irADetalle = (feria: Feria) => {
    router.push({
      pathname: '/detalle',
      params: {
        id: feria.id,
        nombre: feria.nombre,
        fotoPerfil: feria.foto_perfil || '',
        fotos: JSON.stringify(feria.fotos || []),
        barrio: feria.barrio || '',
        direccion: feria.direccion || '',
        dias: (feria.dias_semana || []).join(', '),
        horario: feria.horario || '',
        modalidad: (feria.modalidad || []).join(', '),
        precio: (feria.precio || []).join(', '),
        genero: (feria.genero || []).join(', '),
        tipo: (feria.tipo || []).join(', '),
        instagram: feria.instagram || '',
        whatsapp: feria.whatsapp || '',
        compraRopa: feria.compra_ropa ? 'Sí' : 'No',
      },
    });
  };

  // Coordenadas para Mapa
  const feriasConCoordenadas = feriasFiltradas.filter(f => f.lat !== null && f.lng !== null);
  
  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body, html, #map { height: 100%; margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var defaultLat = ${feriasConCoordenadas[0]?.lat ?? -34.6037};
          var defaultLng = ${feriasConCoordenadas[0]?.lng ?? -58.3816};
          var map = L.map('map').setView([defaultLat, defaultLng], 12);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
          }).addTo(map);

          var ferias = ${JSON.stringify(feriasConCoordenadas)};
          ferias.forEach(function(f) {
            L.marker([f.lat, f.lng])
              .addTo(map)
              .bindPopup('<b>' + f.nombre + '</b><br>' + f.direccion + '<br>' + (f.horario || ''));
          });
        </script>
      </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.tituloApp}>¡Esto es de una feria!</Text>
            <Text style={styles.subtitulo}>Encontrá ferias americanas cerca tuyo</Text>
          </View>
          <TouchableOpacity 
            style={[styles.botonFiltroToggle, totalFiltrosActivos > 0 && styles.botonFiltroActivo]}
            onPress={() => setMostrarFiltros(!mostrarFiltros)}
          >
            <Text style={[styles.textoBotonFiltro, totalFiltrosActivos > 0 && styles.textoBotonFiltroActivo]}>
              🔍 Filtros {totalFiltrosActivos > 0 ? `(${totalFiltrosActivos})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Panel Desplegable de Filtros */}
        {mostrarFiltros && (
          <ScrollView style={styles.panelFiltros} nestedScrollEnabled>
            <View style={styles.headerFiltros}>
              <Text style={styles.tituloFiltros}>Filtrar ferias</Text>
              {totalFiltrosActivos > 0 && (
                <TouchableOpacity onPress={limpiarFiltros}>
                  <Text style={styles.textoLimpiar}>Limpiar todos</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Filtro: ¿Compra ropa? */}
            <Text style={styles.labelFiltro}>🛍️ ¿Compra ropa?</Text>
            <View style={styles.chipsContainer}>
              <TouchableOpacity 
                style={[styles.chip, compraRopaFiltro === null && styles.chipSeleccionado]}
                onPress={() => setCompraRopaFiltro(null)}
              >
                <Text style={[styles.chipTexto, compraRopaFiltro === null && styles.chipTextoSeleccionado]}>Todos</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.chip, compraRopaFiltro === true && styles.chipSeleccionado]}
                onPress={() => setCompraRopaFiltro(compraRopaFiltro === true ? null : true)}
              >
                <Text style={[styles.chipTexto, compraRopaFiltro === true && styles.chipTextoSeleccionado]}>Sí compra</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.chip, compraRopaFiltro === false && styles.chipSeleccionado]}
                onPress={() => setCompraRopaFiltro(compraRopaFiltro === false ? null : false)}
              >
                <Text style={[styles.chipTexto, compraRopaFiltro === false && styles.chipTextoSeleccionado]}>No compra</Text>
              </TouchableOpacity>
            </View>

            {/* Filtro: Barrio */}
            {opcionesBarrios.length > 0 && (
              <>
                <Text style={styles.labelFiltro}>📍 Barrio</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
                  <TouchableOpacity 
                    style={[styles.chip, barrioFiltro === '' && styles.chipSeleccionado]}
                    onPress={() => setBarrioFiltro('')}
                  >
                    <Text style={[styles.chipTexto, barrioFiltro === '' && styles.chipTextoSeleccionado]}>Todos</Text>
                  </TouchableOpacity>
                  {opcionesBarrios.map(barrio => (
                    <TouchableOpacity 
                      key={barrio} 
                      style={[styles.chip, barrioFiltro === barrio && styles.chipSeleccionado]}
                      onPress={() => setBarrioFiltro(barrioFiltro === barrio ? '' : barrio)}
                    >
                      <Text style={[styles.chipTexto, barrioFiltro === barrio && styles.chipTextoSeleccionado]}>{barrio}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Filtro: Día */}
            <Text style={styles.labelFiltro}>🗓️ Día</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
              <TouchableOpacity 
                style={[styles.chip, diaFiltro === '' && styles.chipSeleccionado]}
                onPress={() => setDiaFiltro('')}
              >
                <Text style={[styles.chipTexto, diaFiltro === '' && styles.chipTextoSeleccionado]}>Todos</Text>
              </TouchableOpacity>
              {opcionesDias.map(dia => (
                <TouchableOpacity 
                  key={dia} 
                  style={[styles.chip, diaFiltro === dia && styles.chipSeleccionado]}
                  onPress={() => setDiaFiltro(diaFiltro === dia ? '' : dia)}
                >
                  <Text style={[styles.chipTexto, diaFiltro === dia && styles.chipTextoSeleccionado]}>{dia}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Filtro: Modalidad */}
            <Text style={styles.labelFiltro}>🏢 Modalidad</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
              <TouchableOpacity 
                style={[styles.chip, modalidadFiltro === '' && styles.chipSeleccionado]}
                onPress={() => setModalidadFiltro('')}
              >
                <Text style={[styles.chipTexto, modalidadFiltro === '' && styles.chipTextoSeleccionado]}>Todas</Text>
              </TouchableOpacity>
              {opcionesModalidades.map(mod => (
                <TouchableOpacity 
                  key={mod} 
                  style={[styles.chip, modalidadFiltro === mod && styles.chipSeleccionado]}
                  onPress={() => setModalidadFiltro(modalidadFiltro === mod ? '' : mod)}
                >
                  <Text style={[styles.chipTexto, modalidadFiltro === mod && styles.chipTextoSeleccionado]}>{mod}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Filtro: Precios */}
            <Text style={styles.labelFiltro}>🏷️ Rango de Precios</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
              <TouchableOpacity 
                style={[styles.chip, precioFiltro === '' && styles.chipSeleccionado]}
                onPress={() => setPrecioFiltro('')}
              >
                <Text style={[styles.chipTexto, precioFiltro === '' && styles.chipTextoSeleccionado]}>Todos</Text>
              </TouchableOpacity>
              {opcionesPrecios.map(precio => (
                <TouchableOpacity 
                  key={precio} 
                  style={[styles.chip, precioFiltro === precio && styles.chipSeleccionado]}
                  onPress={() => setPrecioFiltro(precioFiltro === precio ? '' : precio)}
                >
                  <Text style={[styles.chipTexto, precioFiltro === precio && styles.chipTextoSeleccionado]}>{precio}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Filtro: Tipo / Estilo */}
            {opcionesTipos.length > 0 && (
              <>
                <Text style={styles.labelFiltro}>🎨 Estilo / Tipo</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
                  <TouchableOpacity 
                    style={[styles.chip, tipoFiltro === '' && styles.chipSeleccionado]}
                    onPress={() => setTipoFiltro('')}
                  >
                    <Text style={[styles.chipTexto, tipoFiltro === '' && styles.chipTextoSeleccionado]}>Todos</Text>
                  </TouchableOpacity>
                  {opcionesTipos.map(tipo => (
                    <TouchableOpacity 
                      key={tipo} 
                      style={[styles.chip, tipoFiltro === tipo && styles.chipSeleccionado]}
                      onPress={() => setTipoFiltro(tipoFiltro === tipo ? '' : tipo)}
                    >
                      <Text style={[styles.chipTexto, tipoFiltro === tipo && styles.chipTextoSeleccionado]}>{tipo}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Filtro: Género */}
            {opcionesGeneros.length > 0 && (
              <>
                <Text style={styles.labelFiltro}>👤 Género</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
                  <TouchableOpacity 
                    style={[styles.chip, generoFiltro === '' && styles.chipSeleccionado]}
                    onPress={() => setGeneroFiltro('')}
                  >
                    <Text style={[styles.chipTexto, generoFiltro === '' && styles.chipTextoSeleccionado]}>Todos</Text>
                  </TouchableOpacity>
                  {opcionesGeneros.map(genero => (
                    <TouchableOpacity 
                      key={genero} 
                      style={[styles.chip, generoFiltro === genero && styles.chipSeleccionado]}
                      onPress={() => setGeneroFiltro(generoFiltro === genero ? '' : genero)}
                    >
                      <Text style={[styles.chipTexto, generoFiltro === genero && styles.chipTextoSeleccionado]}>{genero}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
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

      {/* Loader mientras carga Supabase */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3182CE" />
          <Text style={styles.loadingTexto}>Cargando ferias desde la nube...</Text>
        </View>
      ) : vistaActual === 'lista' ? (
        <FlatList
          data={feriasFiltradas}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listaContainer}
          onRefresh={cargarFerias}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTexto}>No encontramos ferias que coincidan con esos filtros.</Text>
              <TouchableOpacity style={styles.botonLimpiarEmpty} onPress={limpiarFiltros}>
                <Text style={styles.textoLimpiarEmpty}>Limpiar filtros</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.cardFeria} onPress={() => irADetalle(item)}>
              {item.foto_perfil ? (
                <Image source={{ uri: item.foto_perfil }} style={styles.imagenPortada} />
              ) : (
                <View style={[styles.imagenPortada, styles.imagenPlaceholder]}>
                  <Text style={{ color: '#A0AEC0' }}>Sin imagen</Text>
                </View>
              )}

              <View style={styles.cardContenido}>
                <View style={styles.cardHeader}>
                  <Text style={styles.nombreFeria}>{item.nombre}</Text>
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    {item.compra_ropa && (
                      <View style={styles.badgeCompraRopa}>
                        <Text style={styles.badgeCompraRopaText}>🛍️ Compra ropa</Text>
                      </View>
                    )}
                    {item.modalidad && item.modalidad.length > 0 && (
                      <View style={styles.badgeModalidad}>
                        <Text style={styles.badgeModalidadText}>
                          {item.modalidad.join(' / ')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <Text style={styles.infoText}>📍 {item.direccion} ({item.barrio})</Text>
                <Text style={styles.infoText}>
                  🗓️ {(item.dias_semana || []).join(', ')} • 🕒 {item.horario}
                </Text>
                {item.precio && item.precio.length > 0 && (
                  <Text style={styles.infoText}>🏷️ Precios: {item.precio.join(', ')}</Text>
                )}

                <View style={styles.tagsContainer}>
                  {(item.tipo || []).map((t, idx) => (
                    <View key={idx} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
                  ))}
                  {(item.genero || []).map((g, idx) => (
                    <View key={idx} style={styles.tag}><Text style={styles.tagText}>{g}</Text></View>
                  ))}
                </View>

                <View style={styles.contactoContainer}>
                  {item.instagram && <Text style={styles.contactoText}>📸 {item.instagram}</Text>}
                  {item.whatsapp && <Text style={styles.contactoText}>💬 {item.whatsapp}</Text>}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : Platform.OS === 'web' ? (
        <iframe
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
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tituloApp: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  subtitulo: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  botonFiltroToggle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EDF2F7',
  },
  botonFiltroActivo: {
    backgroundColor: '#3182CE',
  },
  textoBotonFiltro: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A5568',
  },
  textoBotonFiltroActivo: {
    color: '#FFFFFF',
  },
  panelFiltros: {
    maxHeight: 280,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  textoLimpiar: {
    fontSize: 12,
    color: '#E53E3E',
    fontWeight: '600',
  },
  labelFiltro: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A5568',
    marginTop: 8,
    marginBottom: 6,
  },
  chipsContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    marginRight: 6,
  },
  chipSeleccionado: {
    backgroundColor: '#3182CE',
  },
  chipTexto: {
    fontSize: 11,
    color: '#4A5568',
    fontWeight: '500',
  },
  chipTextoSeleccionado: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  selectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#EDF2F7',
    borderRadius: 10,
    padding: 4,
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
  cardFeria: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  imagenPortada: {
    width: '100%',
    height: 160,
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
  badgeCompraRopa: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EBF8FF',
    borderWidth: 1,
    borderColor: '#BEE3F8',
  },
  badgeCompraRopaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2B6CB0',
  },
  badgeModalidad: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#E6FFFA',
  },
  badgeModalidadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#234E52',
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
    marginBottom: 12,
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
  contactoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
  },
  contactoText: {
    fontSize: 12,
    color: '#3182CE',
    fontWeight: '500',
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