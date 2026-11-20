import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EncabezadoHome, type Vista } from '@/components/encabezado-home';
import { FeriaCard } from '@/components/feria-card';
import { MapaFerias } from '@/components/mapa-ferias';
import { useFerias } from '@/hooks/use-ferias';
import { useFiltros } from '@/hooks/use-filtros';

// La home: trae las ferias, aplica los filtros y muestra el encabezado con la lista
// (grilla en la web) o el mapa. Cada parte vive en su archivo:
//   datos → hooks/use-ferias.ts         filtros → hooks/use-filtros.ts
//   encabezado → components/encabezado-home.tsx
//   card → components/feria-card.tsx    mapa → components/mapa-ferias(.web).tsx
export default function HomeScreen() {
  const router = useRouter();
  const { ferias, cargando, refrescando, refrescar } = useFerias();
  const filtros = useFiltros(ferias);
  const { feriasFiltradas } = filtros;

  // La vista (lista o mapa) se guarda en la URL (/?vista=mapa). Así, al volver
  // de una ficha, al recargar o al compartir el link, se mantiene la vista elegida.
  const { vista } = useLocalSearchParams<{ vista?: string }>();
  const vistaActual: Vista = vista === 'mapa' ? 'mapa' : 'lista';
  const cambiarVista = (nueva: Vista) => {
    router.setParams({ vista: nueva === 'mapa' ? 'mapa' : undefined });
  };

  const emptyList = (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTexto}>No encontramos ferias que coincidan con esos filtros.</Text>
      <TouchableOpacity style={styles.botonLimpiarEmpty} onPress={filtros.limpiar}>
        <Text style={styles.textoLimpiarEmpty}>Limpiar filtros</Text>
      </TouchableOpacity>
    </View>
  );

  // En la vista Lista el encabezado va adentro de lo que se scrollea (así en el celu
  // no ocupa media pantalla todo el tiempo); en la vista Mapa queda fijo arriba.
  const encabezado = (
    <EncabezadoHome filtros={filtros} vista={vistaActual} onCambiarVista={cambiarVista} />
  );

  return (
    <SafeAreaView style={styles.container}>
      {cargando ? (
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
                  {feriasFiltradas.map((f) => (
                    <FeriaCard key={f.id} feria={f} />
                  ))}
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
            onRefresh={refrescar}
            refreshing={refrescando}
            ListEmptyComponent={emptyList}
            renderItem={({ item }) => (
              <View style={styles.itemLista}>
                <FeriaCard feria={item} />
              </View>
            )}
          />
        )
      ) : (
        // Vista Mapa: encabezado fijo arriba y el mapa ocupa el resto
        <>
          {encabezado}
          <MapaFerias ferias={feriasFiltradas} />
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