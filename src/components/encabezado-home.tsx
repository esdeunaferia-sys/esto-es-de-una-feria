import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { FiltroChips } from '@/components/filtro-chips';
import type { Filtros } from '@/hooks/use-filtros';

export type Vista = 'lista' | 'mapa';

type Props = {
  filtros: Filtros;
  vista: Vista;
  onCambiarVista: (vista: Vista) => void;
};

// Encabezado de la home: título, "¡Sumá tu feria!", botón y panel de filtros, y Lista/Mapa.
// En el celu va todo centrado y en columna: título, Sumá tu feria y filtros. En la compu
// (web, desde 768px) src/global.css lo pasa a una fila: filtros a la izquierda, título al
// medio y Sumá tu feria a la derecha. Los nativeID son los que usa ese CSS.
export function EncabezadoHome({ filtros, vista, onCambiarVista }: Props) {
  const { totalActivos, panelAbierto } = filtros;
  const cantidad = filtros.feriasFiltradas.length;

  return (
    <View style={styles.header}>
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
            style={[styles.botonFiltroToggle, totalActivos > 0 && styles.botonFiltroActivo]}
            onPress={filtros.alternarPanel}
          >
            <Text style={[styles.textoBotonFiltro, totalActivos > 0 && styles.textoBotonFiltroActivo]}>
              🔍 Filtrar ferias{totalActivos > 0 ? ` (${totalActivos})` : ''} {panelAbierto ? '▴' : '▾'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Panel desplegable de filtros */}
      {panelAbierto && (
        <ScrollView
          style={[styles.panelFiltros, vista === 'mapa' && styles.panelFiltrosMapa]}
          nestedScrollEnabled
        >
          <View style={styles.headerFiltros}>
            <Text style={styles.tituloFiltros}>
              Filtrar ferias{' '}
              <Text style={styles.contadorFiltros}>
                · {cantidad} {cantidad === 1 ? 'feria' : 'ferias'}
              </Text>
            </Text>
            {totalActivos > 0 && (
              <TouchableOpacity onPress={filtros.limpiar}>
                <Text style={styles.textoLimpiar}>Limpiar todos</Text>
              </TouchableOpacity>
            )}
          </View>

          {filtros.grupos.map((grupo) => (
            <FiltroChips
              key={grupo.clave}
              titulo={grupo.titulo}
              opciones={grupo.opciones}
              seleccionados={grupo.seleccionados}
              onCambiar={grupo.onCambiar}
            />
          ))}
        </ScrollView>
      )}

      {/* Selector de vista (Lista / Mapa) */}
      <View style={styles.selectorContainer}>
        <TouchableOpacity
          style={[styles.botonSelector, vista === 'lista' && styles.botonActivo]}
          onPress={() => onCambiarVista('lista')}
        >
          <Text style={[styles.textoSelector, vista === 'lista' && styles.textoActivo]}>
            📋 Lista ({cantidad})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.botonSelector, vista === 'mapa' && styles.botonActivo]}
          onPress={() => onCambiarVista('mapa')}
        >
          <Text style={[styles.textoSelector, vista === 'mapa' && styles.textoActivo]}>🗺️ Mapa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
