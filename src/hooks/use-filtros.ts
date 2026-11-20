import { useMemo, useState } from 'react';

import type { OpcionFiltro } from '@/components/filtro-chips';
import type { Feria } from '@/types/feria';
import { DIAS_SEMANA } from '@/utils/dias';

// Todo lo de los filtros de la home: qué está marcado, qué opciones hay,
// qué ferias quedan y si el panel está abierto.
//
// Reglas:
// - Dentro de una categoría alcanza con que coincida UNA opción (sábado o domingo).
// - Entre categorías tienen que cumplirse TODAS (sábado o domingo, y además en Palermo).
// - Extras funciona igual: alcanza con UNO de los marcados.

type Clave = 'dias' | 'barrios' | 'precios' | 'tipos' | 'modalidades' | 'extras';
type Marcados = Record<Clave, string[]>;

const SIN_FILTROS: Marcados = {
  dias: [],
  barrios: [],
  precios: [],
  tipos: [],
  modalidades: [],
  extras: [],
};

// Opciones fijas (los días vienen de src/utils/dias.ts)
const OPCIONES_PRECIOS = comoOpciones(['$', '$$', '$$$', '$$$$', '$$$$$']);
// Los "sí/no" de la feria. El valor es el nombre de la columna en Supabase.
const OPCIONES_EXTRAS: OpcionFiltro[] = [
  { valor: 'compra_ropa', etiqueta: '🛍️ Compra ropa' },
  { valor: 'acepta_donaciones', etiqueta: '🤝 Acepta donaciones' },
  { valor: 'acepta_cambios', etiqueta: '🔄 Acepta cambios' },
];

// Para opciones donde lo que se muestra es igual a lo que está en la base
function comoOpciones(valores: string[]): OpcionFiltro[] {
  return valores.map((valor) => ({ valor, etiqueta: valor }));
}

// Saca vacíos y repetidos, y ordena alfabéticamente (respetando tildes)
function ordenarAlfabetico(valores: (string | null | undefined)[]): string[] {
  const unicos = Array.from(new Set(valores.filter((v): v is string => !!v)));
  return unicos.sort((a, b) => a.localeCompare(b, 'es'));
}

// ¿La feria tiene alguna de las opciones marcadas? Si no hay nada marcado, pasa.
function coincideAlguna(marcados: string[], valoresDeLaFeria: (string | null)[] | null): boolean {
  if (marcados.length === 0) return true;
  return marcados.some((m) => valoresDeLaFeria?.includes(m) ?? false);
}

function extrasDe(f: Feria): (string | null)[] {
  return [
    f.compra_ropa === true ? 'compra_ropa' : null,
    f.acepta_donaciones === true ? 'acepta_donaciones' : null,
    f.acepta_cambios === true ? 'acepta_cambios' : null,
  ];
}

export function useFiltros(ferias: Feria[]) {
  const [marcados, setMarcados] = useState<Marcados>(SIN_FILTROS);
  const [panelAbierto, setPanelAbierto] = useState(false);

  const feriasFiltradas = useMemo(
    () =>
      ferias.filter(
        (f) =>
          coincideAlguna(marcados.dias, f.dias_semana) &&
          coincideAlguna(marcados.barrios, [f.barrio]) &&
          coincideAlguna(marcados.precios, f.precio) &&
          coincideAlguna(marcados.tipos, f.tipo) &&
          coincideAlguna(marcados.modalidades, f.modalidad) &&
          coincideAlguna(marcados.extras, extrasDe(f)),
      ),
    [ferias, marcados],
  );

  // Cambia lo marcado en una sola categoría
  const cambiar = (clave: Clave) => (nuevos: string[]) =>
    setMarcados((anteriores) => ({ ...anteriores, [clave]: nuevos }));

  // Los grupos de chips del panel, en el orden en que se muestran.
  // Barrio, tipo y modalidad salen de los datos, sin repetir y en orden alfabético.
  const definiciones: { clave: Clave; titulo: string; opciones: OpcionFiltro[] }[] = [
    { clave: 'dias', titulo: '🗓️ Día', opciones: DIAS_SEMANA },
    {
      clave: 'barrios',
      titulo: '📍 Barrio',
      opciones: comoOpciones(ordenarAlfabetico(ferias.map((f) => f.barrio))),
    },
    { clave: 'precios', titulo: '🏷️ Precio', opciones: OPCIONES_PRECIOS },
    {
      clave: 'tipos',
      titulo: '🎨 Estilo / Tipo',
      opciones: comoOpciones(ordenarAlfabetico(ferias.flatMap((f) => f.tipo || []))),
    },
    {
      clave: 'modalidades',
      titulo: '🏢 Modalidad',
      opciones: comoOpciones(ordenarAlfabetico(ferias.flatMap((f) => f.modalidad || []))),
    },
    { clave: 'extras', titulo: '✨ Extras', opciones: OPCIONES_EXTRAS },
  ];
  const grupos = definiciones.map((g) => ({
    ...g,
    seleccionados: marcados[g.clave],
    onCambiar: cambiar(g.clave),
  }));

  // Cantidad de chips marcados en total (se muestra en el botón "Filtrar ferias")
  const totalActivos = Object.values(marcados).reduce((total, lista) => total + lista.length, 0);

  return {
    feriasFiltradas,
    grupos,
    totalActivos,
    limpiar: () => setMarcados(SIN_FILTROS),
    panelAbierto,
    alternarPanel: () => setPanelAbierto((abierto) => !abierto),
  };
}

export type Filtros = ReturnType<typeof useFiltros>;
