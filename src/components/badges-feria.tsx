import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { Feria } from '@/types/feria';

// Los badges de una feria, en el mismo orden en la card de la home y en la ficha:
// 🛍️ Compra ropa → 🤝 Acepta donaciones → 🔄 Acepta cambios → modalidad.
// Los sí/no solo aparecen cuando son `true` (nunca se muestra "No compra", etc.).
// Para sumar un badge nuevo, se agrega una línea en `badgesDe()` y su color en COLORES.

type Props = {
  feria: Feria;
  // 'chico' en la card de la home (letra 11), 'normal' en la ficha (letra 12)
  tamano?: 'chico' | 'normal';
  // Para que cada pantalla lo acomode (márgenes, alineación)
  style?: StyleProp<ViewStyle>;
};

type Color = keyof typeof COLORES;

function badgesDe(feria: Feria): { texto: string; color: Color }[] {
  const badges: { texto: string; color: Color }[] = [];
  if (feria.compra_ropa === true) badges.push({ texto: '🛍️ Compra ropa', color: 'azul' });
  if (feria.acepta_donaciones === true) badges.push({ texto: '🤝 Acepta donaciones', color: 'rosa' });
  if (feria.acepta_cambios === true) badges.push({ texto: '🔄 Acepta cambios', color: 'naranja' });
  if (feria.modalidad && feria.modalidad.length > 0) {
    badges.push({ texto: feria.modalidad.join(' / '), color: 'verde' });
  }
  return badges;
}

export function BadgesFeria({ feria, tamano = 'normal', style }: Props) {
  const badges = badgesDe(feria);
  if (badges.length === 0) return null;

  return (
    <View style={[styles.contenedor, style]}>
      {badges.map(({ texto, color }) => (
        <View
          key={texto}
          style={[
            styles.badge,
            { backgroundColor: COLORES[color].fondo, borderColor: COLORES[color].borde },
          ]}
        >
          <Text
            style={[
              styles.texto,
              tamano === 'chico' && styles.textoChico,
              { color: COLORES[color].texto },
            ]}
          >
            {texto}
          </Text>
        </View>
      ))}
    </View>
  );
}

const COLORES = {
  azul: { fondo: '#EBF8FF', borde: '#BEE3F8', texto: '#2B6CB0' },
  rosa: { fondo: '#FFF5F7', borde: '#FED7E2', texto: '#B83280' },
  naranja: { fondo: '#FFFAF0', borde: '#FEEBC8', texto: '#C05621' },
  // La modalidad no tenía borde: se usa el mismo color del fondo para que no se note
  verde: { fondo: '#E6FFFA', borde: '#E6FFFA', texto: '#234E52' },
};

const styles = StyleSheet.create({
  // Si no entran en una línea, pasan a la siguiente
  contenedor: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  texto: {
    fontSize: 12,
    fontWeight: '700',
  },
  textoChico: {
    fontSize: 11,
  },
});
