import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function DetalleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const nombre = params.nombre as string;
  const fotoPerfil = params.fotoPerfil as string;
  const barrio = params.barrio as string;
  const direccion = params.direccion as string;
  const dias = params.dias as string;
  const horario = params.horario as string;
  const modalidad = params.modalidad as string;
  const precio = params.precio as string;
  const genero = params.genero as string;
  const tipo = params.tipo as string;
  const instagram = params.instagram as string;
  const whatsapp = params.whatsapp as string;
  const compraRopa = params.compraRopa as string; // <-- Recibimos si compra ropa ('Sí' / 'No')

  let fotos: string[] = [];
  try {
    if (params.fotos) {
      fotos = JSON.parse(params.fotos as string);
    }
  } catch (e) {
    fotos = [];
  }

  const [fotoActiva, setFotoActiva] = useState(
    fotoPerfil || (fotos.length > 0 ? fotos[0] : '')
  );

  const abrirInstagram = () => {
    if (instagram) {
      const usuario = instagram.replace('@', '').trim();
      Linking.openURL(`https://instagram.com/${usuario}`);
    }
  };

  const abrirWhatsApp = () => {
    if (whatsapp) {
      const numero = whatsapp.replace(/[^0-9]/g, '');
      Linking.openURL(`https://wa.me/${numero}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Botón Volver */}
        <TouchableOpacity style={styles.botonVolver} onPress={() => router.back()}>
          <Text style={styles.textoVolver}>← Volver</Text>
        </TouchableOpacity>

        {/* Galería / Imagen de Portada */}
        {fotoActiva ? (
          <Image source={{ uri: fotoActiva }} style={styles.imagenPrincipal} />
        ) : (
          <View style={[styles.imagenPrincipal, styles.imagenPlaceholder]}>
            <Text style={{ color: '#A0AEC0' }}>Sin imágenes disponibles</Text>
          </View>
        )}

        {/* Carrusel de Miniaturas si hay múltiples fotos */}
        {fotos.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carruselMiniaturas}>
            {fotos.map((imgUrl, index) => (
              <TouchableOpacity key={index} onPress={() => setFotoActiva(imgUrl)}>
                <Image
                  source={{ uri: imgUrl }}
                  style={[
                    styles.miniatura,
                    fotoActiva === imgUrl && styles.miniaturaSeleccionada
                  ]}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Detalle Principal */}
        <View style={styles.infoSection}>
          <Text style={styles.titulo}>{nombre}</Text>

          {/* Badges de Modalidad y Compra de Ropa */}
          <View style={styles.badgesRow}>
            {modalidad ? (
              <View style={styles.badgeModalidad}>
                <Text style={styles.badgeModalidadText}>{modalidad}</Text>
              </View>
            ) : null}

            {compraRopa === 'Sí' && (
              <View style={styles.badgeCompraRopa}>
                <Text style={styles.badgeCompraRopaText}>🛍️ Compra ropa</Text>
              </View>
            )}
          </View>

          {/* Información Detallada */}
          <View style={styles.cardInfo}>
            <Text style={styles.label}>📍 Ubicación</Text>
            <Text style={styles.valor}>{direccion} ({barrio})</Text>

            <Text style={styles.label}>🗓️ Días y Horarios</Text>
            <Text style={styles.valor}>{dias} • {horario}</Text>

            {precio ? (
              <>
                <Text style={styles.label}>🏷️ Rango de Precios</Text>
                <Text style={styles.valor}>{precio}</Text>
              </>
            ) : null}

            {compraRopa ? (
              <>
                <Text style={styles.label}>👕 Compra de Ropa usada</Text>
                <Text style={styles.valor}>
                  {compraRopa === 'Sí' ? 'Sí, esta feria compra o toma ropa.' : 'No compra ropa.'}
                </Text>
              </>
            ) : null}

            {tipo ? (
              <>
                <Text style={styles.label}>🎨 Estilos / Tipo</Text>
                <Text style={styles.valor}>{tipo}</Text>
              </>
            ) : null}

            {genero ? (
              <>
                <Text style={styles.label}>👤 Géneros</Text>
                <Text style={styles.valor}>{genero}</Text>
              </>
            ) : null}
          </View>

          {/* Botones de Contacto */}
          <View style={styles.contactoSection}>
            <Text style={styles.subtituloSection}>Contacto Directo</Text>
            
            {instagram ? (
              <TouchableOpacity style={styles.botonInstagram} onPress={abrirInstagram}>
                <Text style={styles.textoBotonContacto}>📸 Abrir Instagram ({instagram})</Text>
              </TouchableOpacity>
            ) : null}

            {whatsapp ? (
              <TouchableOpacity style={styles.botonWhatsapp} onPress={abrirWhatsApp}>
                <Text style={styles.textoBotonContacto}>💬 Escribir por WhatsApp ({whatsapp})</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  botonVolver: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 3,
  },
  textoVolver: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C3E50',
  },
  imagenPrincipal: {
    width: width,
    height: 280,
  },
  imagenPlaceholder: {
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carruselMiniaturas: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
  },
  miniatura: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  miniaturaSeleccionada: {
    borderColor: '#3182CE',
  },
  infoSection: {
    padding: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  badgeModalidad: {
    backgroundColor: '#E6FFFA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B2F5EA',
  },
  badgeModalidadText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#234E52',
  },
  badgeCompraRopa: {
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BEE3F8',
  },
  badgeCompraRopaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2B6CB0',
  },
  cardInfo: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#718096',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  valor: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2D3748',
    marginTop: 2,
  },
  contactoSection: {
    gap: 10,
  },
  subtituloSection: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 6,
  },
  botonInstagram: {
    backgroundColor: '#E1306C',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  botonWhatsapp: {
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  textoBotonContacto: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});