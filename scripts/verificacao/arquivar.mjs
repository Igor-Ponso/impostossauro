/**
 * Garante uma cópia de cada fonte na Wayback Machine e grava o mapa em
 * `app/data/arquivos.json`. Reaproveita o snapshot que já existir; só pede
 * captura nova para URL sem nenhum. URL que falhar fica de fora e sai no log.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';

const pastaDados = new URL('../../app/data/', import.meta.url);
const arquivoMapa = new URL('arquivos.json', pastaDados);
const PARALELO_CONSULTA = 6;
/** A Wayback devolve 429 acima de ~1 captura simultânea; a espera abaixo é dela, não nossa. */
const PARALELO_CAPTURA = 1;
const ESPERA_ENTRE_CAPTURAS_MS = 6000;
const ESPERA_LIMITE_MS = 60000;
const TENTATIVAS = 3;

const dormir = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function coletarUrls(valor, saida) {
  if (Array.isArray(valor)) { valor.forEach((item) => coletarUrls(item, saida)); return; }
  if (!valor || typeof valor !== 'object') return;
  for (const [chave, item] of Object.entries(valor)) {
    if (chave === 'url' && typeof item === 'string' && /^https?:\/\//.test(item)) saida.add(item);
    else coletarUrls(item, saida);
  }
}

async function snapshotExistente(url) {
  const resposta = await fetch(`https://archive.org/wayback/available?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(20000) });
  if (!resposta.ok) return null;
  const dados = await resposta.json();
  const mais = dados.archived_snapshots?.closest;
  return mais?.available && mais.url ? mais.url.replace(/^http:/, 'https:') : null;
}

async function capturar(url) {
  let ultimo = 'sem resposta';
  for (let tentativa = 0; tentativa < TENTATIVAS; tentativa += 1) {
    try {
      const resposta = await fetch(`https://web.archive.org/save/${url}`, { redirect: 'follow', signal: AbortSignal.timeout(120000) });
      const local = resposta.headers.get('content-location');
      if (local) return `https://web.archive.org${local}`;
      if (/\/web\/\d{14}\//.test(resposta.url)) return resposta.url;
      ultimo = `HTTP ${resposta.status}`;
      if (resposta.status !== 429 && resposta.status < 500) break;
    } catch (erro) {
      ultimo = erro.message;
    }
    await dormir(ESPERA_LIMITE_MS);
    // A captura pode ter concluído mesmo com a resposta perdida.
    const pronto = await snapshotExistente(url).catch(() => null);
    if (pronto) return pronto;
  }
  throw new Error(ultimo);
}

async function emLotes(itens, tamanho, tarefa) {
  const fila = [...itens];
  await Promise.all(Array.from({ length: tamanho }, async () => {
    while (fila.length) await tarefa(fila.shift());
  }));
}

const urls = new Set();
for (const nome of await readdir(pastaDados)) {
  if (!nome.endsWith('.json') || nome === 'arquivos.json') continue;
  coletarUrls(JSON.parse(await readFile(new URL(nome, pastaDados), 'utf8')), urls);
}

let mapa = {};
try { mapa = JSON.parse(await readFile(arquivoMapa, 'utf8')); } catch { /* primeira execução */ }
for (const url of Object.keys(mapa)) if (!urls.has(url)) delete mapa[url];

async function gravar() {
  const ordenado = Object.fromEntries(Object.entries(mapa).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(arquivoMapa, `${JSON.stringify(ordenado, null, 2)}\n`);
}

const falhas = [];
const semCopia = [];
const fila = [...urls].filter((url) => !mapa[url]);
console.log(`${urls.size} fontes; ${fila.length} sem cópia registrada.`);

await emLotes(fila, PARALELO_CONSULTA, async (url) => {
  try {
    const arquivo = await snapshotExistente(url);
    if (arquivo) mapa[url] = arquivo;
    else semCopia.push(url);
  } catch (erro) {
    falhas.push(`${url} — consulta: ${erro.message}`);
  }
});
await gravar();
console.log(`${semCopia.length} sem snapshot; pedindo captura.`);

let feitas = 0;
await emLotes(semCopia, PARALELO_CAPTURA, async (url) => {
  try {
    mapa[url] = await capturar(url);
  } catch (erro) {
    falhas.push(`${url} — captura: ${erro.message}`);
  }
  feitas += 1;
  console.log(`${feitas}/${semCopia.length} ${mapa[url] ? 'ok' : 'falhou'} ${url}`);
  if (feitas % 10 === 0) await gravar();
  await dormir(ESPERA_ENTRE_CAPTURAS_MS);
});

await gravar();
console.log(`\n${Object.keys(mapa).length}/${urls.size} fontes com cópia arquivada.`);
if (falhas.length) console.log(`\nSem cópia (${falhas.length}):\n${falhas.join('\n')}`);
