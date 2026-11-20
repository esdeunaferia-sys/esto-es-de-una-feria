// Forma de una fila de la tabla `ferias` de Supabase.
// Vive en su propio archivo porque la usan varias pantallas (home y ficha).
export type Feria = {
  id: string;
  slug: string; // nombre corto para el link: /feria/<slug>
  nombre: string;
  foto_perfil: string | null;
  fotos: string[] | null;
  barrio: string;
  direccion: string;
  dias_semana: string[] | null;
  horario: string;
  observaciones_dias: string | null;
  modalidad: string[] | null;
  precio: string[] | null;
  tipo: string[] | null;
  instagram: string | null;
  whatsapp: string | null;
  lat: number | null;
  lng: number | null;
  compra_ropa: boolean | null;
  orden: number | null;
  // Tamaño de la card en la home. En Supabase es un enum `tamano_feria`
  // ('normal' por defecto). Puede faltar si la columna todavía no existe.
  tamano?: 'normal' | 'grande';
};
