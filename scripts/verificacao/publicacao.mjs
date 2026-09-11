/** Verifica os arquivos publicados, inclusive links com o subdiretório do Pages. */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { Window } from 'happy-dom';

const raiz = join(process.cwd(), '.output/public');
const arquivos = (pasta) => readdirSync(pasta).flatMap((nome) => {
  const caminho = join(pasta, nome);
  return statSync(caminho).isDirectory() ? arquivos(caminho) : [caminho];
});
const paginas = arquivos(raiz).filter((arquivo) => arquivo.endsWith('/index.html'));
const sitemap = readFileSync(join(raiz, 'sitemap.xml'), 'utf8');
const erros = new Set();
const titulos = new Map();
let links = 0;
for (const arquivo of paginas) {
  const rota = relative(raiz, arquivo).replace(/index\.html$/, '');
  const janela = new Window({ url: 'https://publicacao.invalid/', settings: { disableJavaScriptEvaluation: true, disableCSSFileLoading: true, disableJavaScriptFileLoading: true } });
  const doc = janela.document;
  // Preloads iniciam fetch no parser; não são necessários para a auditoria de HTML.
  doc.body.innerHTML = readFileSync(arquivo, 'utf8').replace(/<link\b[^>]*rel="(?:preload|modulepreload|prefetch)"[^>]*>/g, '');
  const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
  const embed = rota.includes('embed/');
  const erro = (mensagem) => erros.add(`${rota || '/'}: ${mensagem}`);
  if (embed) {
    if (!doc.querySelector('meta[name="robots"]')?.content.includes('noindex')) erro('embed sem noindex');
    await janela.happyDOM.close();
    continue;
  }
  if (!canonical) { erro('canonical ausente'); await janela.happyDOM.close(); continue; }
  if (!sitemap.includes(`<loc>${canonical}</loc>`)) erro('canonical fora do sitemap');
  const url = new URL(canonical);
  const base = url.pathname.slice(0, -rota.length || undefined).replace(/\/$/, '');
  const titulo = doc.querySelector('title')?.textContent?.trim();
  const chaveTitulo = `${rota.startsWith('en/') ? 'en' : 'pt'}:${titulo}`;
  if (!titulo) erro('título ausente');
  else if (titulos.has(chaveTitulo)) erro(`título repetido com ${titulos.get(chaveTitulo)}`);
  else titulos.set(chaveTitulo, rota);
  if (!doc.querySelector('meta[name="description"]')?.content) erro('descrição ausente');
  if (!doc.querySelector('h1')) erro('h1 ausente');
  if (doc.querySelectorAll('h1').length > 1) erro('mais de um h1');
  for (const img of doc.querySelectorAll('img')) if (!img.hasAttribute('alt')) erro('imagem sem alt');
  const ids = new Set();
  for (const elemento of doc.querySelectorAll('[id]')) {
    if (ids.has(elemento.id)) erro(`id repetido: ${elemento.id}`);
    ids.add(elemento.id);
  }
  const recursos = [...doc.querySelectorAll('a[href], img[src], script[src], link[rel="stylesheet"], link[rel="icon"], link[rel="manifest"], meta[property="og:image"]')];
  for (const elemento of recursos) {
    const valor = elemento.getAttribute('href') ?? elemento.getAttribute('src') ?? elemento.getAttribute('content');
    if (!valor || /^(mailto:|tel:|data:|blob:)/.test(valor)) continue;
    const destino = new URL(valor, url);
    if (destino.origin !== url.origin) continue;
    links++;
    // CI usa base '/', deploy usa '/impostossauro/'; ambos são conferidos.
    let caminho = decodeURIComponent(destino.pathname);
    if (base && (caminho === base || caminho.startsWith(`${base}/`))) caminho = caminho.slice(base.length);
    const local = join(raiz, caminho);
    const alvo = existsSync(local) && statSync(local).isDirectory() ? join(local, 'index.html') : local;
    if (!existsSync(alvo)) erro(`destino ausente: ${valor}`);
    else if (destino.hash && alvo.endsWith('.html')) {
      const id = decodeURIComponent(destino.hash.slice(1));
      const html = readFileSync(alvo, 'utf8');
      if (!html.includes(`id="${id}"`)) erro(`âncora ausente: ${valor}`);
    }
  }
  await janela.happyDOM.close();
}
if (!existsSync(join(raiz, '404.html'))) erros.add('404.html ausente');
if (!existsSync(join(raiz, 'robots.txt'))) erros.add('robots.txt ausente');

// Fonte sem cópia arquivada não reprova a publicação: a Wayback pode estar fora
// do ar ou recusar o host. Fica avisado para `npm run arquivar` fechar a lacuna.
const pastaDados = join(process.cwd(), 'app/data');
const urlsDeFonte = new Set();
const colher = (valor) => {
  if (Array.isArray(valor)) { valor.forEach(colher); return; }
  if (!valor || typeof valor !== 'object') return;
  for (const [chave, item] of Object.entries(valor)) {
    if (chave === 'url' && typeof item === 'string' && /^https?:\/\//.test(item)) urlsDeFonte.add(item);
    else colher(item);
  }
};
for (const nome of readdirSync(pastaDados)) {
  if (!nome.endsWith('.json') || nome === 'arquivos.json') continue;
  colher(JSON.parse(readFileSync(join(pastaDados, nome), 'utf8')));
}
let arquivadas = {};
try { arquivadas = JSON.parse(readFileSync(join(pastaDados, 'arquivos.json'), 'utf8')); } catch { /* sem mapa ainda */ }
const semCopia = [...urlsDeFonte].filter((url) => !arquivadas[url]);
if (semCopia.length) {
  console.warn(`Aviso: ${semCopia.length} de ${urlsDeFonte.size} fontes ainda sem cópia arquivada. Rode \`npm run arquivar\`.`);
  for (const url of semCopia.slice(0, 5)) console.warn(`  ${url}`);
}
if (erros.size) {
  console.error([...erros].join('\n'));
  process.exitCode = 1;
} else console.log(`Publicação válida: ${paginas.length} páginas, ${links} links e recursos internos, metadados e sitemap. Fontes com cópia arquivada: ${urlsDeFonte.size - semCopia.length}/${urlsDeFonte.size}.`);
