import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BadgesFeria } from '@/components/badges-feria';
import type { Feria } from '@/types/feria';
import { cuandoAbre } from '@/utils/dias';

// La card de una feria en la home (grilla de la web y lista del celu).
// Cada card es un link de verdad a la ficha (en la web, un <a href="/feria/...">):
// Google puede seguirlo y se puede abrir en otra pestaña con Ctrl+clic o la ruedita.
// Solo pasamos el slug: la ficha busca el resto de los datos en Supabase.
export function FeriaCard({ feria }: { feria: Feria }) {
  const cuando = cuandoAbre(feria);

  return (
    <Link href={{ pathname: '/feria/[slug]', params: { slug: feria.slug } }} asChild>
      <TouchableOpacity style={styles.cardFeria}>
        {/* Las ferias "grande" tienen la foto más alta y el nombre más grande */}
        {feria.foto_perfil ? (
          <Image
            source={{ uri: feria.foto_perfil }}
            style={[styles.imagenPortada, feria.tamano === 'grande' && styles.imagenPortadaGrande]}
            contentFit="cover"
            transition={200} // aparece con un fundido suave de 0,2 segundos
            alt={feria.nombre}
          />
        ) : (
          <View
            style={[
              styles.imagenPortada,
              feria.tamano === 'grande' && styles.imagenPortadaGrande,
              styles.imagenPlaceholder,
            ]}
          >
            <Text style={styles.sinImagenTexto}>Sin imagen</Text>
          </View>
        )}

        <View style={styles.cardContenido}>
          <View style={styles.cardHeader}>
            <Text style={[styles.nombreFeria, feria.tamano === 'grande' && styles.nombreFeriaGrande]}>
              {feria.nombre}
            </Text>
            <BadgesFeria feria={feria} tamano="chico" style={styles.badgesCard} />
          </View>

          <Text style={styles.infoText}>📍 {feria.direccion} ({feria.barrio})</Text>
          {cuando ? <Text style={styles.infoText}>🗓️ {cuando}</Text> : null}
          {feria.precio && feria.precio.length > 0 && (
            <Text style={styles.infoText}>🏷️ Precios: {feria.precio.join(', ')}</Text>
          )}

          {/* El Instagram y el WhatsApp no van en la card: están como botones en la ficha */}
          {feria.tipo && feria.tipo.length > 0 && (
            <View style={styles.tagsContainer}>
              {feria.tipo.map((tipo, index) => (
                <View key={`${tipo}-${index}`} style={styles.tag}><Text style={styles.tagText}>{tipo}</Text></View>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
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
  sinImagenTexto: {
    color: '#A0AEC0',
  },
});
