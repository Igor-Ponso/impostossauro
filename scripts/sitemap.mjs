/**
 * Escreve `.output/public/sitemap.xml` a partir dos `index.html` que o
 * `nuxt generate` produziu. Roda depois dele (`npm run generate`).
 * O embed e as páginas de erro ficam de fora.
 */
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const raiz = join(process.cwd(), '.output', 'public');
const siteUrl = (process.env.NUXT_PUBLIC_SITE_URL || 'https://igor-ponso.github.io/impostossauro').replace(/\/$/, '');

function paginas(pasta) {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return nome.startsWith('_') ? [] : paginas(caminho);
    if (nome !== 'index.html') return [];
    const rota = relative(raiz, pasta).split('\\').join('/');
    if (rota.startsWith('embed') || rota.includes('/embed')) return [];
    return [rota ? `/${rota}/` : '/'];
  });
}

const rotas = paginas(raiz).sort();
const xmlTexto = (texto) => texto.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...rotas.map((rota) => `  <url><loc>${xmlTexto(siteUrl + rota)}</loc></url>`),
  '</urlset>',
  '',
].join('\n');

writeFileSync(join(raiz, 'sitemap.xml'), xml);
const base = new URL(siteUrl).pathname.replace(/\/$/, '');
writeFileSync(join(raiz, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: ${base}/embed/\nDisallow: ${base}/en/embed/\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
console.log(`sitemap.xml: ${rotas.length} rotas`);
