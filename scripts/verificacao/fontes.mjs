#!/usr/bin/env node
/**
 * Testa, com GET, toda URL que os JSON de `app/data/` publicam.
 *
 * GET, e não HEAD: a API de agregados do IBGE responde 405 a HEAD e 200 a GET.
 * `405` e `403` a HEAD dizem pouco sobre o que GET devolve.
 *
 * Uso:
 *   node scripts/verificacao/fontes.mjs              # todos os arquivos
 *   node scripts/verificacao/fontes.mjs federative   # só os que casarem
 *
 * Saída: `código  arquivo  url` por linha. `000` é falha de rede, não resposta.
 */
import { execFile } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

const executar = promisify(execFile);

const RAIZ = new URL('../../', import.meta.url).pathname;
const DADOS = join(RAIZ, 'app', 'data');
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const LIMITE = 6;
const TEMPO = 45_000;

const filtro = process.argv[2];
const arquivos = readdirSync(DADOS)
  .filter((n) => n.endsWith('.json'))
  .filter((n) => !filtro || n.includes(filtro));

/** Toda string http em chave terminada em `url`, em qualquer profundidade. */
function urlsDe(arquivo) {
  const achadas = new Map();
  const anda = (valor) => {
    if (Array.isArray(valor)) return valor.forEach(anda);
    if (valor && typeof valor === 'object') {
      for (const [chave, item] of Object.entries(valor)) {
        if (typeof item === 'string' && /^https?:\/\//.test(item) && /url$/i.test(chave)) {
          achadas.set(item, (achadas.get(item) ?? 0) + 1);
        } else anda(item);
      }
    }
  };
  anda(JSON.parse(readFileSync(join(DADOS, arquivo), 'utf-8')));
  return [...achadas.keys()];
}

/**
 * O `fetch` do Node falha em hosts que o `curl` alcança (o PDF do INEP é um
 * caso), e `429` costuma ser limite de taxa da própria varredura em paralelo:
 * os dois são reconferidos por `curl` antes de virar veredito.
 */
async function porCurl(url) {
  try {
    const { stdout } = await executar(
      'curl',
      ['-sSL', '-A', UA, '-m', '45', '-o', '/dev/null', '-w', '%{http_code}', url],
      { timeout: TEMPO + 5_000 },
    );
    return Number(stdout.trim()) || 0;
  } catch {
    return 0;
  }
}

async function testar(url) {
  const corte = AbortSignal.timeout(TEMPO);
  let status;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: corte });
    // O corpo precisa ser drenado ou a conexão fica presa.
    await r.arrayBuffer().catch(() => {});
    status = r.status;
  } catch {
    status = 0;
  }
  if (status === 0 || status === 429) return porCurl(url);
  return status;
}

const fila = arquivos.flatMap((arquivo) => urlsDe(arquivo).map((url) => ({ arquivo, url })));
const resultados = [];
let proximo = 0;

await Promise.all(
  Array.from({ length: LIMITE }, async () => {
    while (proximo < fila.length) {
      const item = fila[proximo++];
      const status = await testar(item.url);
      resultados.push({ ...item, status });
      const marca = String(status).padStart(3, '0');
      console.log(`${marca}  ${item.arquivo.padEnd(22)}  ${item.url.slice(0, 96)}`);
    }
  }),
);

const ruins = resultados.filter((r) => r.status < 200 || r.status >= 300);
console.log(`\n${resultados.length} URLs · ${resultados.length - ruins.length} abriram · ${ruins.length} não`);
for (const r of ruins.sort((a, b) => a.arquivo.localeCompare(b.arquivo))) {
  console.log(`  ${String(r.status).padStart(3, '0')}  ${r.arquivo}  ${r.url}`);
}
