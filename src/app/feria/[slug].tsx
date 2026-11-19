import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/supabase';
import type { Feria } from '@/types/feria';

// Se ejecuta UNA vez, cuando Vercel arma el sitio (no en el navegador).
// Le pide a Supabase la lista de ferias activas y Expo genera un HTML
// por cada una: /feria/camom, /feria/feria-capri, etc.
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const { data, error } = await supabase
    .from('ferias')
    .select('slug')
    .eq('activa', true);

  // Si Supabase falla, preferimos que el build falle (y quede online la
  // versión anterior) antes que publicar un sitio sin páginas de ferias.
  if (error) throw error;

  return (data ?? []).map((fila) => ({ slug: fila.slug }));
}

type Estado = 'cargando' | 'lista' | 'no-encontrada' | 'error';

export default function FeriaScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [feria, setFeria] = useState<Feria | null>(null);
  const [estado, setEstado] = useState<Estado>('cargando');
  const [fotoElegida, setFotoElegida] = useState<string | null>(null);

  // Buscar la feria en Supabase según el slug de la URL
  useEffect(() => {
    let cancelado = false; // por si el usuario se va antes de que llegue la respuesta

    supabase
      .from('ferias')
      .select('*')
      .eq('slug', slug)
      .eq('activa', true)
      .maybeSingle() // devuelve null (en vez de error) si no hay ninguna
      .then(({ data, error }) => {
        if (cancelado) return;
        if (error) {
          console.error('Error al cargar la feria:', error.message);
          setEstado('error');
        } else if (!data) {
          setEstado('no-encontrada');
        } else {
          setFeria(data as Feria);
          setEstado('lista');
        }
      });

    return () => {
      cancelado = true;
    };
  }, [slug]);

  // Si la persona llegó por un link compartido no hay pantalla anterior
  // a la cual "volver", así que la mandamos a la home.
  const volver = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const botonVolver = (
    <TouchableOpacity style={styles.botonVolver} onPress={volver}>
      <Text style={styles.textoVolver}>← Volver</Text>
    </TouchableOpacity>
  );

  if (estado === 'cargando') {
    return (
      <SafeAreaView style={[styles.container, styles.centrado]}>
        <ActivityIndicator size="large" color="#3182CE" />
      </SafeAreaView>
    );
  }

  if (estado !== 'lista' || !feria) {
    return (
      <SafeAreaView style={[styles.container, styles.centrado]}>
        <Text style={styles.mensajeTitulo}>
          {estado === 'error' ? 'No pudimos cargar la feria' : 'No encontramos esta feria'}
        </Text>
        <Text style={styles.mensajeTexto}>
          {estado === 'error'
            ? 'Revisá tu conexión e intentá de nuevo.'
            : 'Puede que el link esté mal escrito o que la feria ya no esté publicada.'}
        </Text>
        <TouchableOpacity style={styles.botonInicio} onPress={() => router.replace('/')}>
          <Text style={styles.textoBotonInicio}>Ver todas las ferias</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const fotos = feria.fotos ?? [];
  const fotoActiva = fotoElegida ?? feria.foto_perfil ?? fotos[0] ?? null;
  const modalidad = (feria.modalidad ?? []).join(', ');
  const dias = (feria.dias_semana ?? []).join(', ');
  const precio = (feria.precio ?? []).join(', ');
  const tipo = (feria.tipo ?? []).join(', ');
  const genero = (feria.genero ?? []).join(', ');

  const abrirInstagram = () => {
    if (feria.instagram) {
      const usuario = feria.instagram.replace('@', '').trim();
      Linking.openURL(`https://instagram.com/${usuario}`);
    }
  };

  const abrirWhatsApp = () => {
    if (feria.whatsapp) {
      const numero = feria.whatsapp.replace(/[^0-9]/g, '');
      Linking.openURL(`https://wa.me/${numero}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {botonVolver}

        {/* Imagen principal */}
        {fotoActiva ? (
          <Image source={{ uri: fotoActiva }} style={styles.imagenPrincipal} />
        ) : (
          <View style={[styles.imagenPrincipal, styles.imagenPlaceholder]}>
            <Text style={{ color: '#A0AEC0' }}>Sin imágenes disponibles</Text>
          </View>
        )}

        {/* Miniaturas si hay varias fotos */}
        {fotos.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carruselMiniaturas}>
            {fotos.map((imgUrl, index) => (
              <TouchableOpacity key={index} onPress={() => setFotoElegida(imgUrl)}>
                <Image
                  source={{ uri: imgUrl }}
                  style={[styles.miniatura, fotoActiva === imgUrl && styles.miniaturaSeleccionada]}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.titulo}>{feria.nombre}</Text>

          {/* Badges de modalidad y compra de ropa */}
          <View style={styles.badgesRow}>
            {modalidad ? (
              <View style={styles.badgeModalidad}>
                <Text style={styles.badgeModalidadText}>{modalidad}</Text>
              </View>
            ) : null}

            {feria.compra_ropa === true && (
              <View style={styles.badgeCompraRopa}>
                <Text style={styles.badgeCompraRopaText}>🛍️ Compra ropa</Text>
              </View>
            )}
          </View>

          {/* Información detallada */}
          <View style={styles.cardInfo}>
            <Text style={styles.label}>📍 Ubicación</Text>
            <Text style={styles.valor}>
              {feria.direccion}
              {feria.barrio ? ` (${feria.barrio})` : ''}
            </Text>

            <Text style={styles.label}>🗓️ Días y Horarios</Text>
            <Text style={styles.valor}>{[dias, feria.horario].filter(Boolean).join(' • ')}</Text>

            {precio ? (
              <>
                <Text style={styles.label}>🏷️ Rango de Precios</Text>
                <Text style={styles.valor}>{precio}</Text>
              </>
            ) : null}

            {/* Solo se muestra si el dato está cargado: null = no sabemos */}
            {feria.compra_ropa !== null ? (
              <>
                <Text style={styles.label}>👕 Compra de Ropa usada</Text>
                <Text style={styles.valor}>
                  {feria.compra_ropa ? 'Sí, esta feria compra o toma ropa.' : 'No compra ropa.'}
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

          {/* Botones de contacto */}
          {feria.instagram || feria.whatsapp ? (
            <View style={styles.contactoSection}>
              <Text style={styles.subtituloSection}>Contacto Directo</Text>

              {feria.instagram ? (
                <TouchableOpacity style={styles.botonInstagram} onPress={abrirInstagram}>
                  <Text style={styles.textoBotonContacto}>📸 Abrir Instagram ({feria.instagram})</Text>
                </TouchableOpacity>
              ) : null}

              {feria.whatsapp ? (
                <TouchableOpacity style={styles.botonWhatsapp} onPress={abrirWhatsApp}>
                  <Text style={styles.textoBotonContacto}>💬 Escribir por WhatsApp ({feria.whatsapp})</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
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
  centrado: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  mensajeTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  mensajeTexto: {
    fontSize: 15,
    color: '#718096',
    marginBottom: 20,
    textAlign: 'center',
  },
  botonInicio: {
    backgroundColor: '#3182CE',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  textoBotonInicio: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
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
    // '100%' en vez de medir la pantalla: en el build estático no hay pantalla que medir
    width: '100%',
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
