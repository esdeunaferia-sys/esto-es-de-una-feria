import { useEffect, useState } from 'react';

import { supabase } from '@/supabase';
import type { Feria } from '@/types/feria';

// Pide las ferias activas a Supabase. Solo trae los datos (no toca el estado
// de la pantalla): devuelve la lista, o null si algo falló.
async function pedirFerias(): Promise<Feria[] | null> {
  try {
    const { data, error } = await supabase
      .from('ferias')
      .select('*')
      .eq('activa', true)
      .order('orden', { ascending: true }) // orden manual (1, 2, 3...)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar ferias:', error.message);
      return null;
    }
    return (data ?? []) as Feria[];
  } catch (err) {
    console.error('Error de conexión:', err);
    return null;
  }
}

// Las ferias de la home. Las pide una vez al abrir la pantalla.
//   cargando:    true mientras llega la primera respuesta
//   refrescando: true mientras se recarga con "deslizar para refrescar" (celu)
export function useFerias() {
  const [ferias, setFerias] = useState<Feria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  // Ojo con la regla de ESLint `set-state-in-effect`: el estado se cambia
  // recién en el `.then`, cuando ya llegaron los datos.
  useEffect(() => {
    pedirFerias().then((lista) => {
      if (lista) setFerias(lista);
      setCargando(false);
    });
  }, []);

  const refrescar = async () => {
    setRefrescando(true);
    const lista = await pedirFerias();
    if (lista) setFerias(lista); // si falló, dejamos las que ya estaban
    setRefrescando(false);
  };

  return { ferias, cargando, refrescando, refrescar };
}
