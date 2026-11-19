# CLAUDE.md — Esto es de una feria

@AGENTS.md

## 0. Cómo trabajar con Brian
- Brian está aprendiendo programación sobre la marcha (viene del diseño de imagen y sonido). Explicá los cambios en lenguaje simple, sin jerga innecesaria, y contá el *por qué* de cada decisión.
- Respondé en español rioplatense (voseo).
- Cambios chicos y de a uno. Antes de algo grande o riesgoso, explicá el plan y esperá el OK.
- No hacer `git commit` ni `git push` sin que Brian lo pida: él revisa el diff en VS Code y publica.
- Antes de dar algo por terminado: `npx tsc --noEmit` y `npx expo lint`, y pedirle a Brian que lo mire en el navegador.

---

## 1. Descripción del Proyecto y Objetivo
- **Nombre:** Esto es de una feria (`esto-es-de-una-feria`)
- **Producción:** https://estoesdeunaferia.com.ar
- **Propósito:** Directorio web responsive (con proyección a app móvil nativa en iOS/Android) para descubrir ferias locales, showrooms y ferias americanas en Buenos Aires y Argentina.
- **Modelo de negocio y KPI:** Monetización futura mediante venta de espacios publicitarios y auspicios a ferias y marcas. La métrica principal actual es el volumen de **Usuarios Activos Mensuales (MAU)** para armar un media kit comercial.

---

## 2. Stack Tecnológico
- **Framework:** React Native + **Expo SDK 57** con **Expo Router** (rutas por archivo en `src/app/`, `typedRoutes: true`, `reactCompiler: true`). Un solo código para web (React Native Web) e iOS/Android.
- **Configuración (`app.json`):** `scheme: estoesdeunaferia`, `web.output: static`, plugins `expo-router` y `expo-splash-screen`. El nombre, colores del splash (`#208AEF`) e íconos todavía son los del template de Expo.
- **Base de datos:** **Supabase** (PostgreSQL). Cliente en `src/supabase.ts`.
  - La URL y la `anon key` están escritas en el código. La anon key es pública por diseño, así que la seguridad depende de las políticas RLS de la tabla. **Nunca** usar ni pegar la `service_role` key en el frontend.
- **Analíticas:** **Firebase Analytics** (SDK modular `firebase`), solo tráfico general/MAU.
  - Inicializado en `/firebaseConfig.js` validando `isSupported()` antes de `getAnalytics(app)`.
  - Importado globalmente en `src/app/_layout.tsx`.
- **Mapa:** Leaflet + OpenStreetMap, armado como un HTML en texto dentro de `index.tsx` y mostrado con `<iframe>` en web y `react-native-webview` en el celu. (`react-native-maps` está instalado pero no se usa).
- **Hosting y CI/CD:** Repo en **GitHub** conectado a **Vercel**. Cada `git push` dispara el build estático y publica en `estoesdeunaferia.com.ar`.

---

## 3. Estructura de Archivos Principal
Raíz: `C:\Users\Brian\esto-es-de-una-feria\` (Windows 11, Node v22, npm 10).
- `app.json`, `package.json`, `tsconfig.json` (alias `@/*` → `src/*`).
- `firebaseConfig.js`: inicialización de Firebase App y Analytics.
- `src/supabase.ts`: cliente de Supabase (con adaptador de AsyncStorage seguro para el render estático).
- `src/global.css`: fuentes y la grilla tipo Pinterest de la web (`#feria-masonry`).
- `src/app/_layout.tsx`: layout raíz (Stack sin header, tema claro/oscuro, splash, Firebase).
- `src/app/index.tsx`: **home** (~780 líneas): carga de ferias, filtros, lista/grilla y mapa. Acá también está definido el tipo `Feria`.
- `src/app/detalle.tsx`: ficha de una feria. Hoy recibe **todos los datos por parámetros de la URL** (se reemplazará por `/feria/[slug]`).
- Restos del template de Expo sin uso: `src/app/explore.tsx`, `src/components/app-tabs*`, `web-badge`, `hint-row`, `ui/collapsible`, `scripts/reset-project.js`, `README.md` genérico.

---

## 4. Datos (Supabase)
- Tabla **`ferias`**. La home trae `select('*')` filtrando `activa = true`, ordenando por `orden` (ascendente, orden manual 1, 2, 3…) y después por `created_at` (descendente).
- Campos que usa la app: `id`, `nombre`, `foto_perfil`, `fotos[]`, `barrio`, `direccion`, `dias_semana[]`, `horario`, `observaciones_dias`, `modalidad[]`, `precio[]`, `genero[]`, `tipo[]`, `instagram`, `whatsapp`, `lat`, `lng`, `compra_ropa` (boolean), `orden`, `activa`, `created_at`.
- Valores fijos en los filtros: precios `$`…`$$$$$`; días en minúscula y **sin tilde** (`miercoles`, `sabado`); modalidades `Fija / Local`, `Showroom fijo`, `Itinerante`. Barrios, tipos y géneros salen de los datos.

---

## 5. Arquitectura Visual y Diseño UI/UX
- **Fondo general de la home:** `#F5F5F7`. Header blanco.
- **Grilla:** en web, columnas CSS por ancho de pantalla (1 / 2 desde 560px / 3 desde 900px / 4 desde 1280px), en `src/global.css`. En el celu, `FlatList` de una columna con pull-to-refresh.
- **Card de feria:**
  - Contenedor blanco, `borderRadius: 12`, sin borde, con sombra sutil vía `boxShadow` (funciona igual en iOS, Android y web). **Sin `overflow: 'hidden'`** para no recortar la sombra: en su lugar la imagen tiene redondeadas las esquinas superiores.
  1. **Imagen superior:** 100% de ancho, alto fijo de 160px.
  2. **Cabecera:** nombre en negrita + badges ("🛍️ Compra ropa" y modalidad).
  3. **Metadatos con íconos:** dirección (barrio), días • horario, precios.
  4. **Tags:** chips grises con tipo y género.
  5. **Pie de contacto:** Instagram a la izquierda, WhatsApp a la derecha.
- Paleta actual: azul `#3182CE` para acciones/chips activos, grises tipo Tailwind (`#2D3748`, `#4A5568`, `#718096`, `#E2E8F0`).

---

## 6. Entorno Local y Flujo de Despliegue
- **Servidor de desarrollo:** `npx expo start --port 8082` → `http://localhost:8082` (o `w` en la terminal de Expo).
  - En Brave, desactivar los Shields para verificar Firebase Analytics en local.
- **Instalar paquetes:** siempre `npx expo install <paquete>` (no `npm install <paquete>`), para que elija versiones compatibles con el SDK.
- **Publicar a producción (Vercel):**
  ```bash
  git add .
  git commit -m "Descripción clara del cambio"
  git push
  ```
  *(Los warnings de Git sobre `LF` → `CRLF` en Windows son normales.)*

---

## 7. Hoja de Ruta
**Hecho**
- Firebase Analytics en producción (solo MAU).
- Ajuste visual de la home: fondo `#F5F5F7` y cards blancas con radio 12 y sombra sutil.

**Próximo (en este orden)**
1. **Seguridad en Supabase (RLS):** verificar que la tabla `ferias` tenga RLS activado, con lectura pública (`SELECT` para `anon`, idealmente solo `activa = true`) y sin permisos de escritura para `anon`/`authenticated`.
2. **Rutas de detalle `/feria/[slug]`:** página por feria que carga sus datos por slug desde Supabase (agregar columna `slug` única). Reemplaza a `detalle.tsx` con parámetros en la URL. Objetivo: links cortos para compartir y SEO (idealmente pre-generando una página estática por feria en el build).

**Pendientes detectados (sin prioridad todavía)**
- Separar `index.tsx`: componente reutilizable de chips de filtro (hoy está copiado 6 veces), tipo `Feria` en un archivo propio, carga de datos en un hook.
- Mapa: escapar los textos que se insertan en el HTML y hacer que el popup lleve a la ficha de la feria.
- Usar `expo-image` en vez de `Image` de React Native (mejor caché y rendimiento).
- En la ficha, `compra_ropa = null` hoy se muestra como "No compra ropa".
- Limpiar restos del template y personalizar nombre, ícono y splash en `app.json`.

---

## 8. Reglas y Límites de Alcance (Qué NO hacer)
- **No agregar eventos personalizados de Analytics (`logEvent`):** por decisión de producto, alcanza con el conteo automático de MAU.
- **No calcular `aspectRatio` al vuelo (`Image.getSize`):** se descartó para evitar saltos de layout y complejidad. La estandarización de proporciones de imagen queda para más adelante.
- **Compatibilidad multiplataforma:** usar componentes de React Native/Expo y `StyleSheet` para que todo funcione en la web estática y en iOS/Android. Si algo es solo para web, separarlo con `Platform.OS` o archivos `.web.tsx`.
- **Pragmatismo:** nada de sobre-ingeniería; código claro, directo y fácil de mantener.
