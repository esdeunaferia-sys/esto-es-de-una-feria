import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

  // Portada + galería en una sola lista (sin repetidas), para poder volver a la portada
  const todasLasFotos = [
    ...new Set([feria.foto_perfil, ...(feria.fotos ?? [])].filter((f): f is string => !!f)),
  ];
  const fotoActiva = fotoElegida ?? todasLasFotos[0] ?? null;

  const dias = (feria.dias_semana ?? []).join(', ');
  const diasYHorario = [dias, feria.horario].filter(Boolean).join(' • ');
  const precio = (feria.precio ?? []).join(' ');
  const etiquetas = [...(feria.tipo ?? []), ...(feria.genero ?? [])];

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
        {/* Columna centrada con ancho máximo: en la compu no se estira a toda la pantalla */}
        <View style={styles.columna}>
          <TouchableOpacity style={styles.botonVolver} onPress={volver}>
            <Text style={styles.textoVolver}>← Volver</Text>
          </TouchableOpacity>

          {/* Foto principal con proporción fija 4:3 */}
          {fotoActiva ? (
            <Image
              source={{ uri: fotoActiva }}
              style={styles.fotoPrincipal}
              contentFit="cover"
              transition={200} // fundido suave al cargar o al elegir otra miniatura
              loading="eager" // es lo primero que se ve: que cargue ya, sin esperar
              alt={feria.nombre}
            />
          ) : (
            <View style={[styles.fotoPrincipal, styles.fotoPlaceholder]}>
              <Text style={{ color: '#A0AEC0' }}>Sin imágenes disponibles</Text>
            </View>
          )}

          {/* Miniaturas si hay más de una foto */}
          {todasLasFotos.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.miniaturas}
            >
              {todasLasFotos.map((url) => (
                <TouchableOpacity key={url} onPress={() => setFotoElegida(url)}>
                  <Image
                    source={{ uri: url }}
                    style={[styles.miniatura, fotoActiva === url && styles.miniaturaActiva]}
                    contentFit="cover"
                    alt=""
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Tarjeta con la información, mismo estilo que las cards de la home */}
          <View style={styles.tarjeta}>
            <Text style={styles.titulo}>{feria.nombre}</Text>

            {(!!feria.modalidad?.length || feria.compra_ropa === true) && (
              <View style={styles.badges}>
                {feria.modalidad && feria.modalidad.length > 0 && (
                  <View style={styles.badgeModalidad}>
                    <Text style={styles.badgeModalidadText}>{feria.modalidad.join(' / ')}</Text>
                  </View>
                )}
                {feria.compra_ropa === true && (
                  <View style={styles.badgeCompraRopa}>
                    <Text style={styles.badgeCompraRopaText}>🛍️ Compra ropa</Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.datos}>
              {feria.direccion ? (
                <Text style={styles.dato}>
                  📍 {feria.direccion}
                  {feria.barrio ? ` (${feria.barrio})` : ''}
                </Text>
              ) : null}

              {diasYHorario ? <Text style={styles.dato}>🗓️ {diasYHorario}</Text> : null}

              {feria.observaciones_dias ? (
                <Text style={styles.observacion}>{feria.observaciones_dias}</Text>
              ) : null}

              {precio ? <Text style={styles.dato}>🏷️ Precios: {precio}</Text> : null}

              {/* Solo se muestra si el dato está cargado: null = no sabemos */}
              {feria.compra_ropa !== null ? (
                <Text style={styles.dato}>
                  👕 {feria.compra_ropa ? 'Compra o toma ropa usada' : 'No compra ropa usada'}
                </Text>
              ) : null}
            </View>

            {etiquetas.length > 0 && (
              <View style={styles.etiquetas}>
                {etiquetas.map((etiqueta, index) => (
                  <View key={`${etiqueta}-${index}`} style={styles.etiqueta}>
                    <Text style={styles.etiquetaText}>{etiqueta}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Botones de contacto, uno al lado del otro */}
          {feria.instagram || feria.whatsapp ? (
            <View style={styles.contacto}>
              {feria.instagram ? (
                <TouchableOpacity
                  style={[styles.botonContacto, styles.botonInstagram]}
                  onPress={abrirInstagram}
                >
                  <Text style={styles.textoBotonContacto}>📸 Instagram</Text>
                </TouchableOpacity>
              ) : null}

              {feria.whatsapp ? (
                <TouchableOpacity
                  style={[styles.botonContacto, styles.botonWhatsapp]}
                  onPress={abrirWhatsApp}
                >
                  <Text style={styles.textoBotonContacto}>💬 WhatsApp</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Misma sombra que las cards de la home
const SOMBRA = '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
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
    padding: 16,
    paddingBottom: 40,
  },
  columna: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    gap: 16,
  },
  botonVolver: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingRight: 12,
  },
  textoVolver: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3182CE',
  },
  fotoPrincipal: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    backgroundColor: '#EDF2F7',
  },
  fotoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniaturas: {
    gap: 8,
  },
  miniatura: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#EDF2F7',
  },
  miniaturaActiva: {
    borderColor: '#3182CE',
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    boxShadow: SOMBRA,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A202C',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  badgeModalidad: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#E6FFFA',
  },
  badgeModalidadText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#234E52',
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
    fontSize: 12,
    fontWeight: '700',
    color: '#2B6CB0',
  },
  datos: {
    marginTop: 16,
    gap: 8,
  },
  dato: {
    fontSize: 15,
    color: '#4A5568',
    lineHeight: 22,
  },
  observacion: {
    fontSize: 13,
    color: '#718096',
    marginTop: -4,
    marginLeft: 26,
  },
  etiquetas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 16,
  },
  etiqueta: {
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  etiquetaText: {
    fontSize: 12,
    color: '#4A5568',
    fontWeight: '600',
  },
  contacto: {
    flexDirection: 'row',
    gap: 10,
  },
  botonContacto: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  botonInstagram: {
    backgroundColor: '#E1306C',
  },
  botonWhatsapp: {
    backgroundColor: '#25D366',
  },
  textoBotonContacto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
