import { Link } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Página para cualquier dirección que no existe (ej: /ferias-viejas).
// Al armar el sitio, scripts/despues-del-build.js la copia como 404.html,
// que es la que Vercel muestra (con código 404) cuando no encuentra una página.
export default function NoEncontrada() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titulo}>No encontramos esta página</Text>
      <Text style={styles.texto}>
        Puede que el link esté mal escrito o que la página ya no exista.
      </Text>
      <Link href="/" asChild>
        <TouchableOpacity style={styles.boton}>
          <Text style={styles.textoBoton}>Ver todas las ferias</Text>
        </TouchableOpacity>
      </Link>
    </SafeAreaView>
  );
}

// Mismo estilo que el aviso "No encontramos esta feria" de la ficha
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  texto: {
    fontSize: 15,
    color: '#718096',
    marginBottom: 20,
    textAlign: 'center',
  },
  boton: {
    backgroundColor: '#3182CE',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
