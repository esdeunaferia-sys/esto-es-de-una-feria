// Corre después de `expo export -p web` (ver "build" en package.json y vercel.json).
// Agrega a la carpeta dist/ lo que Expo no genera solo:
//   - 404.html: la página de "no encontrado" que muestra Vercel (copia de +not-found.html)
//   - sitemap.xml: la lista de páginas del sitio para Google, con una entrada por feria
// Como el sitio se rearma cada vez que cambia la tabla `ferias`, el sitemap siempre está al día.
const fs = require('fs');
const path = require('path');

const DOMINIO = 'https://www.estoesdeunaferia.com.ar';
const DIST = path.join(__dirname, '..', 'dist');

// La URL y la anon key (pública) de Supabase se leen de src/supabase.ts,
// para no tenerlas escritas en dos lugares.
function leerConfigSupabase() {
  const codigo = fs.readFileSync(path.join(__dirname, '..', 'src', 'supabase.ts'), 'utf8');
  const url = codigo.match(/supabaseUrl = '([^']+)'/)?.[1];
  const key = codigo.match(/supabaseAnonKey = '([^']+)'/)?.[1];
  if (!url || !key) throw new Error('No encontré supabaseUrl / supabaseAnonKey en src/supabase.ts');
  return { url, key };
}

async function main() {
  // 1) 404.html
  fs.copyFileSync(path.join(DIST, '+not-found.html'), path.join(DIST, '404.html'));
  console.log('✓ dist/404.html');

  // 2) sitemap.xml (solo ferias activas: la política RLS no deja ver las otras)
  const { url, key } = leerConfigSupabase();
  const respuesta = await fetch(`${url}/rest/v1/ferias?select=slug&activa=eq.true&order=slug`, {
    headers: { apikey: key },
  });
  if (!respuesta.ok) throw new Error(`Supabase respondió ${respuesta.status}`);
  const ferias = await respuesta.json();

  const direcciones = [`${DOMINIO}/`, ...ferias.map((f) => `${DOMINIO}/feria/${f.slug}`)];
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    direcciones.map((d) => `  <url><loc>${d}</loc></url>`).join('\n') +
    '\n</urlset>\n';
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), xml);
  console.log(`✓ dist/sitemap.xml (${direcciones.length} páginas)`);
}

main().catch((error) => {
  console.error('✗ Falló despues-del-build.js:', error.message);
  process.exit(1); // corta el build: Vercel deja publicada la versión anterior
});
