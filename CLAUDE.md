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
- **Mapa:** Leaflet + OpenStreetMap, armado como un HTML en texto dentro de `index.tsx` y mostrado con `<iframe>` en web y `react-native-webview` en el celu.. (`react-native-maps` se desinstaló porque no se usaba).
  - Encuadre automático: `fitBounds` con todos los pines (margen 40px, zoom máx. 15). Con una sola feria, zoom 15 sobre ella; sin ninguna, centro de Buenos Aires con zoom 12. Como el HTML del mapa se rearma al cambiar los filtros, siempre encuadra las ferias que quedaron.
  - Globito de cada pin: foto de portada, nombre, dirección, días/horario y botón "Ver feria →". Se arma con `textContent`, nunca concatenando HTML, y el JSON se inyecta con `<` escapado.
  - Para abrir la ficha, el mapa manda un mensaje `{ tipo: 'abrir-feria', slug }`: en la web con `window.parent.postMessage` (la home lo acepta solo si viene de su propio iframe) y en el celu con `window.ReactNativeWebView.postMessage` (`onMessage` del WebView). La home navega con `router.push`.
- **Hosting y CI/CD:** Repo en **GitHub** conectado a **Vercel**. Cada `git push` dispara el build estático y publica en `estoesdeunaferia.com.ar` (que redirige a `www.`, el dominio principal).
  - `vercel.json` fija `buildCommand: npm run build` y `outputDirectory: dist`, más `cleanUrls: true`. `npm run build` = `expo export -p web` + `scripts/despues-del-build.js`, que agrega `dist/404.html` (copia de `+not-found.html`) y `dist/sitemap.xml` (home + una entrada por feria activa, pedidas a Supabase). Si el script falla, el build se corta y Vercel deja publicada la versión anterior.
  - `public/robots.txt` (Expo lo copia tal cual a `dist/`) apunta al sitemap.
  - En `app.json`, el plugin `expo-router` tiene `sitemap: false` para no publicar la página `/_sitemap` de Expo.

---

## 3. Estructura de Archivos Principal
Raíz: `C:\Users\Brian\esto-es-de-una-feria\` (Windows 11, Node v22, npm 10).
- `app.json`, `package.json`, `tsconfig.json` (alias `@/*` → `src/*`).
- `firebaseConfig.js`: inicialización de Firebase App y Analytics.
- `src/supabase.ts`: cliente de Supabase (con adaptador de AsyncStorage seguro para el render estático).
- `src/global.css`: fuentes y la grilla tipo Pinterest de la web (`#feria-masonry`).
- `src/app/+not-found.tsx`: página "No encontramos esta página" (con botón a la home) para cualquier dirección que no existe. Se publica como `404.html`.
- `src/app/+html.tsx`: HTML base de todas las páginas web (solo corre al armar el sitio, en Node). Tiene `lang="es-AR"`, el título y la descripción generales del sitio, las etiquetas `og:` para la vista previa al compartir y `theme-color`. Usa `useServerDocumentContext()` (ya es la forma del SDK 58).
- `src/app/_layout.tsx`: layout raíz (Stack sin header, tema claro/oscuro, splash, Firebase).
- `src/app/index.tsx`: **home** (~750 líneas): carga de ferias, filtros, lista/grilla y mapa.
- `src/components/filtro-chips.tsx`: grupo de chips de filtro con título y selección múltiple (lo usan todos los filtros de la home).
- `src/app/feria/[slug].tsx`: ficha de una feria (`/feria/<slug>`). Busca la feria en Supabase por `slug` (solo `activa = true`). `generateStaticParams` pide los slugs en el build y genera un HTML por feria.
- `src/types/feria.ts`: tipo `Feria` (forma de una fila de la tabla).
- `src/utils/dias.ts`: lista de días (`DIAS_SEMANA`, valor y etiqueta) y `formatearDias()`, que arma el texto lindo ("Lunes a viernes", "Martes, jueves y sábado", "Todos los días"). Se usa en el filtro, la card, el mapa y la ficha.

---

## 4. Datos (Supabase)
- Tabla **`ferias`**. La home trae `select('*')` filtrando `activa = true`, ordenando por `orden` (ascendente, orden manual 1, 2, 3…) y después por `created_at` (descendente).
- Campos que usa la app: `id`, `slug`, `nombre`, `foto_perfil`, `fotos[]`, `barrio`, `direccion`, `dias_semana[]` (lista del enum `dia_semana`: `lunes` … `domingo`, minúscula y sin tilde; la base rechaza cualquier otro valor. Las ferias sin días fijos van con `dias_semana` vacío y el texto en `observaciones_dias`, ej. "Solo en fechas especiales", que la card y el mapa muestran en lugar de los días), `horario`, `observaciones_dias`, `observaciones` (texto libre opcional, ej. "Una vestuarista te asesora"; se muestra solo en la ficha, en un recuadro gris debajo de los datos, y no en la card para no alargarla), `modalidad[]` (lista del enum `modalidad_feria`: `Local a la calle`, `Showroom fijo`, `Online`, `Taller`; la base rechaza cualquier otro valor. Agregar opciones con `alter type modalidad_feria add value '...'` o en Database → Enumerated Types; renombrar con `rename value`; borrar una no se puede directo), `precio[]`, `tipo[]` (también incluye a quién va dirigida: "mujer", "hombre", "unisex"; la columna `genero` se borró el 2026-11-20), `instagram`, `whatsapp`, `lat`, `lng`, `compra_ropa` (boolean; si es `true` se muestra el badge azul "🛍️ Compra ropa" en la card y en la ficha, y si es `false` o `null` no aparece nada; nunca mostrar "No compra"), `acepta_donaciones` (boolean, `not null default false`; si es `true` se muestra el badge rosa "🤝 Acepta donaciones" en la card y en la ficha, y si es `false` no aparece nada. El filtro de la home tiene "Todas" / "Acepta donaciones"), `acepta_cambios` (boolean, `not null default false`; igual que donaciones pero con badge naranja "🔄 Acepta cambios" y filtro "Todas" / "Acepta cambios"), `orden`, `activa`, `created_at`, `tamano` (enum `tamano_feria`: `normal` | `grande`, por defecto `normal`; en el Table Editor aparece como desplegable).
- Valores fijos en los filtros: precios `$`…`$$$$$`; días en minúscula y **sin tilde** (`miercoles`, `sabado`), aunque en pantalla se muestran con mayúscula y tilde (`formatearDias()`). Barrios, tipos y modalidades salen de los datos (todos los valores que aparezcan al menos una vez, en orden alfabético).
- **Filtros de la home** (2026-11-20), en este orden: Día, Barrio, Precio, Estilo / Tipo, Modalidad y Extras (🛍️ Compra ropa, 🤝 Acepta donaciones, 🔄 Acepta cambios). Todos son de selección múltiple y no tienen chip "Todos": sin nada marcado no filtra, y tocar un chip marcado lo desmarca. Dentro de una categoría alcanza con una coincidencia (sábado **o** domingo); entre categorías se tienen que cumplir todas. Extras funciona igual: alcanza con que cumpla uno de los marcados (por decisión de Brian). No hay opción "No compra". El panel muestra cuántas ferias quedan, y el botón "Filtros (n)" cuenta los chips marcados. Los chips bajan de renglón en vez de deslizarse al costado.

---

## 5. Arquitectura Visual y Diseño UI/UX
- **Fondo general de la home:** `#F5F5F7`. Header blanco.
- **Encabezado de la home:** título "Esto es de / una feria" en dos renglones (más adelante va un logo), el lema "• Todos tienen derecho a vestirse increíble •" y "🪞Guía de ferias americanas por @estoesdeunaferia" (link a Instagram). Además, el link "¡Sumá tu feria!" (Google Form) y el botón "🔍 Filtrar ferias ▾". En el celu va todo centrado en columna: título, Sumá tu feria, filtros. En la web desde 768px, `src/global.css` (con los `nativeID` `encabezado*`) lo pasa a una fila: filtros a la izquierda, título al medio, Sumá tu feria a la derecha. Debajo, la botonera Lista/Mapa con `maxWidth: 360`, centrada. En la vista **Lista** todo el encabezado se scrollea junto con las cards (en la web va adentro del `ScrollView`; en el celu es el `ListHeaderComponent` de la `FlatList`), para que en el celu no ocupe media pantalla. En la vista **Mapa** queda fijo arriba, y el panel de filtros tiene `maxHeight: 360` con scroll propio. El pull-to-refresh del celu usa su propio estado (`refrescando`), separado de `loading`.
- **Grilla:** en web, columnas CSS por ancho de pantalla (1 / 2 desde 560px / 3 desde 900px / 4 desde 1280px), en `src/global.css`. En el celu, `FlatList` de una columna con pull-to-refresh.
- **Card de feria:**
  - Es un link de verdad a la ficha: `<Link href={{ pathname: '/feria/[slug]', params: { slug } }} asChild>` envolviendo el `TouchableOpacity`. En la web queda como `<a href="/feria/...">`, así Google encuentra las fichas y se puede abrir en otra pestaña (Ctrl+clic, ruedita, clic derecho).
  - Contenedor blanco, `borderRadius: 12`, sin borde, con sombra sutil vía `boxShadow` (funciona igual en iOS, Android y web). **Sin `overflow: 'hidden'`** para no recortar la sombra: en su lugar la imagen tiene redondeadas las esquinas superiores.
  1. **Imagen superior:** 100% de ancho, alto fijo de 160px (**320px** si la feria tiene `tamano = 'grande'`, para destacarla; el nombre también pasa de 18 a 22). Mismo ancho que las demás, para no romper la grilla tipo Pinterest. Sin badge de "Destacada": por decisión de producto, se distingue solo por el tamaño.
  2. **Cabecera:** nombre en negrita + badges ("🛍️ Compra ropa" y modalidad).
  3. **Metadatos con íconos:** dirección (barrio), días • horario, precios.
  4. **Tags:** chips grises con los tipos.
  5. **Pie de contacto:** Instagram a la izquierda, WhatsApp a la derecha.
- **Ficha de feria (`/feria/[slug]`):** fondo `#F5F5F7`, columna centrada con `maxWidth: 720`. Arriba "← Volver" en texto azul. Foto principal 4:3 con radio 12 y miniaturas (portada + galería). Tarjeta blanca con la misma sombra que las cards: nombre, badges, datos con íconos, `observaciones_dias` y chips de tipo. Botones de Instagram y WhatsApp lado a lado.
- **Fotos:** se suben a Supabase Storage (bucket `fotos-feria`) **en WebP, máx. 1200px de ancho, calidad ~75** (100–200 KB). Nombre: `<slug>-<n>.webp`, donde 1 = portada. Nunca subir fotos en PNG: pesan 5 a 10 veces más.
- Paleta actual: azul `#3182CE` para acciones/chips activos, grises tipo Tailwind (`#2D3748`, `#4A5568`, `#718096`, `#E2E8F0`).

---

## 6. Entorno Local y Flujo de Despliegue
- **Servidor de desarrollo:** `npx expo start --port 8082` → `http://localhost:8082` (o `w` en la terminal de Expo).
  - En Brave, desactivar los Shields para verificar Firebase Analytics en local.
  - **Es lento a propósito, no sirve para medir velocidad.** Arma cada página en el momento (4–10 s por pedido) y manda ~8 MB de JS sin comprimir. Después de cada cambio en el código recompila todo, y mientras tanto se ve "Cargando ferias desde la nube...", aunque Supabase responde en ~0,2 s. En producción el HTML tarda ~0,2 s y el JS pesa ~0,6 MB comprimido.
- **Probar la velocidad real en local:** `npm run build` (arma el sitio en `dist/`, igual que Vercel) y después `npx expo serve` (normalmente en `http://localhost:8081`).
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
- Seguridad en Supabase (RLS), verificada el 2026-11-19: la tabla `ferias` tiene RLS activado y una sola política, "Permitir lectura publica de ferias activas" (`SELECT` para `public` con `activa = true`). No hay políticas de escritura, así que `anon`/`authenticated` no pueden crear, modificar ni borrar.

- Rutas de detalle `/feria/[slug]` (2026-11-19): columna `slug` en Supabase (obligatoria, única y con formato `minusculas-con-guiones`, chequeado por la base). Una página estática por feria generada en el build. Se borró `detalle.tsx`. Se agregó `vercel.json` con `cleanUrls: true` (sin eso Vercel solo servía `/feria/x.html` y `/feria/x` daba 404 al abrir un link directo). En la ficha, `compra_ropa = null` ya no se muestra.

- Redeploy automático (2026-11-19): las páginas de feria solo existen para los slugs que había al momento del build. Por eso hay un *Database Webhook* en Supabase (`rearmar_sitio_vercel`, tabla `ferias`, Insert/Update/Delete, POST) que llama a un *Deploy Hook* de Vercel (`supabase-ferias`, rama `main`). Cualquier cambio en la tabla rearma el sitio en ~2 minutos. La URL del hook es secreta: vive solo en Supabase, nunca en el repo. Al cargar una feria a mano, completar `slug`.
- ESLint configurado (`eslint.config.js`, `eslint-config-expo`) y sin errores (2026-11-19). Ojo con la regla `react-hooks/set-state-in-effect`: dentro de un `useEffect` no llamar funciones que cambian el estado antes de un `await`. Patrón usado: una función que solo trae datos (`pedirFerias()` en `index.tsx`) y el `setState` dentro del `.then(...)`.
- Fotos comprimidas (2026-11-20): las 19 fotos pasaron de PNG/JPG a WebP (de 6,3 MB a 0,9 MB). Las originales siguen en Storage como respaldo: borrarlas cuando se confirme que todo anda bien. Algunas originales son chicas (ej. Monogatari galería 322×441, Misericordia 442×342) y conviene reemplazarlas por versiones más grandes.
- Rediseño de la ficha (2026-11-20): columna centrada de 720px, ver sección 5.
- Globito del mapa con foto y botón a la ficha, y textos escapados (2026-11-20). Ver sección 2.
- La vista de la home (lista/mapa) vive en la URL (`/?vista=mapa`, leída con `useLocalSearchParams` y cambiada con `router.setParams`), no en un `useState`. Así se mantiene al volver de una ficha, al recargar y al compartir el link (2026-11-20).
- Fotos con `expo-image` en la card de la home y en la ficha (foto principal y miniaturas), con `contentFit="cover"` y `transition={200}` (2026-11-20). En la web carga en modo *lazy* por defecto: solo baja las fotos que están por aparecer en pantalla. La foto principal de la ficha usa `loading="eager"`. Usar siempre `Image` de `expo-image`, no el de `react-native`. En el mapa, la foto de cada globito se baja recién en `popupopen`.

- Limpieza del template de Expo (2026-11-20): se borraron la página `/explore`, los componentes, hooks, imágenes y script de ejemplo, la animación de carga con el logo de Expo, y los paquetes sin uso (`react-native-maps`, `expo-symbols`, `expo-glass-effect`, `@expo/ui`, `expo-device`, `expo-web-browser`). README nuevo en español.

- Título, descripción e idioma del sitio (2026-11-20) en `src/app/+html.tsx`. Por ahora todas las páginas, fichas incluidas, comparten el mismo título; falta una imagen para `og:image` (cuando haya logo).

- Sitemap, robots.txt y página 404 propia (2026-11-20). Ver sección 2, Hosting.

**Próximo**
1. **Título y meta tags por feria (SEO y vista previa al compartir):** dejarlo para cuando se actualice a Expo SDK 58, donde los *data loaders* son estables y se usa `generateMetadata()`. En SDK 57 son experimentales (`unstable_useServerDataLoaders`) y `<Head>` cambia en 58.

**Pendientes detectados (sin prioridad todavía)**
- Separar `index.tsx`: carga de datos en un hook.
- Filtros en la URL (para compartir un link ya filtrado).
- Separar "Tipo" en "A quién va dirigida" (mujer, hombre, unisex) y "Estilo": hoy elegir *mujer + vintage* trae las de mujer **o** vintage.
- Personalizar nombre, ícono, favicon y splash en `app.json` (siguen los de Expo).
- Actualizar parches de Expo (`npx expo install --check`: expo-router, expo-splash-screen y otros 3 tienen versiones nuevas del SDK 57).

---

## 8. Reglas y Límites de Alcance (Qué NO hacer)
- **No agregar eventos personalizados de Analytics (`logEvent`):** por decisión de producto, alcanza con el conteo automático de MAU.
- **No calcular `aspectRatio` al vuelo (`Image.getSize`):** se descartó para evitar saltos de layout y complejidad. La estandarización de proporciones de imagen queda para más adelante.
- **Compatibilidad multiplataforma:** usar componentes de React Native/Expo y `StyleSheet` para que todo funcione en la web estática y en iOS/Android. Si algo es solo para web, separarlo con `Platform.OS` o archivos `.web.tsx`.
- **Pragmatismo:** nada de sobre-ingeniería; código claro, directo y fácil de mantener.
