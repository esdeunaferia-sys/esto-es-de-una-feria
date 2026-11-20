// Días de la semana. En Supabase `dias_semana` es una lista del enum `dia_semana`
// (minúscula y sin tilde: 'miercoles', 'sabado'). Acá está cómo se muestran.

export const DIAS_SEMANA = [
  { valor: 'lunes', etiqueta: 'Lunes' },
  { valor: 'martes', etiqueta: 'Martes' },
  { valor: 'miercoles', etiqueta: 'Miércoles' },
  { valor: 'jueves', etiqueta: 'Jueves' },
  { valor: 'viernes', etiqueta: 'Viernes' },
  { valor: 'sabado', etiqueta: 'Sábado' },
  { valor: 'domingo', etiqueta: 'Domingo' },
];

// Convierte la lista de la base en un texto lindo:
//   todos                        → "Todos los días"
//   lunes…viernes                → "Lunes a viernes"
//   lunes…viernes + domingo      → "Lunes a viernes y domingo"
//   martes, jueves, sabado       → "Martes, jueves y sábado"
// Tres o más días seguidos se juntan con "a". Devuelve '' si no hay días.
export function formatearDias(dias: string[] | null | undefined): string {
  // Posiciones (0 = lunes … 6 = domingo), ordenadas y sin repetir
  const posiciones = DIAS_SEMANA.map((d, i) => (dias?.includes(d.valor) ? i : -1)).filter(
    (i) => i >= 0,
  );
  if (posiciones.length === 0) return '';
  if (posiciones.length === 7) return 'Todos los días';

  // Agrupa los días seguidos: [0,1,2,3,4,6] → [[0..4], [6]]
  const tramos: number[][] = [];
  for (const i of posiciones) {
    const ultimo = tramos[tramos.length - 1];
    if (ultimo && ultimo[ultimo.length - 1] === i - 1) ultimo.push(i);
    else tramos.push([i]);
  }

  const nombre = (i: number) => DIAS_SEMANA[i].etiqueta.toLowerCase();
  const partes = tramos.flatMap((t) =>
    t.length >= 3 ? [`${nombre(t[0])} a ${nombre(t[t.length - 1])}`] : t.map(nombre),
  );

  const texto =
    partes.length === 1
      ? partes[0]
      : `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
