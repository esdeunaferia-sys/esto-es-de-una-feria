import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Una opción del filtro: `valor` es lo que se compara con los datos
// (ej: 'miercoles') y `etiqueta` es lo que ve la gente (ej: 'Miércoles').
export type OpcionFiltro = { valor: string; etiqueta: string };

type Props = {
  titulo: string;
  opciones: OpcionFiltro[];
  // Valores marcados. Si está vacío, el filtro no filtra nada.
  seleccionados: string[];
  onCambiar: (nuevos: string[]) => void;
};

// Un grupo de chips con título, donde se pueden marcar varios a la vez.
// Tocar un chip lo prende; tocarlo de nuevo lo apaga.
export function FiltroChips({ titulo, opciones, seleccionados, onCambiar }: Props) {
  if (opciones.length === 0) return null;

  const alternar = (valor: string) => {
    onCambiar(
      seleccionados.includes(valor)
        ? seleccionados.filter((v) => v !== valor)
        : [...seleccionados, valor],
    );
  };

  return (
    <View>
      <Text style={styles.titulo}>{titulo}</Text>
      <View style={styles.chips}>
        {opciones.map(({ valor, etiqueta }) => {
          const marcado = seleccionados.includes(valor);
          return (
            <TouchableOpacity
              key={valor}
              style={[styles.chip, marcado && styles.chipMarcado]}
              onPress={() => alternar(valor)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: marcado }}
            >
              <Text style={[styles.chipTexto, marcado && styles.chipTextoMarcado]}>{etiqueta}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titulo: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A5568',
    marginTop: 8,
    marginBottom: 6,
  },
  // flexWrap: los chips que no entran bajan de renglón (en vez de esconderse al costado)
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  chipMarcado: {
    backgroundColor: '#3182CE',
  },
  chipTexto: {
    fontSize: 11,
    color: '#4A5568',
    fontWeight: '500',
  },
  chipTextoMarcado: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
