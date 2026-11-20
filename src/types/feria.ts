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
  horario: string | null;
  observaciones_dias: string | null;
  // Texto libre con datos extra (ej: "Una vestuarista te asesora").
  // Puede faltar si la columna todavía no existe.
  observaciones?: string | null;
  modalidad: string[] | null;
  precio: string[] | null;
  tipo: string[] | null;
  instagram: string | null;
  whatsapp: string | null;
  lat: number | null;
  lng: number | null;
  compra_ropa: boolean | null;
  // false por defecto. Puede faltar si la columna todavía no existe.
  acepta_donaciones?: boolean;
  // false por defecto. Puede faltar si la columna todavía no existe.
  acepta_cambios?: boolean;
  orden: number | null;
  // Tamaño de la card en la home. En Supabase es un enum `tamano_feria`
  // ('normal' por defecto). Puede faltar si la columna todavía no existe.
  tamano?: 'normal' | 'grande';
};
