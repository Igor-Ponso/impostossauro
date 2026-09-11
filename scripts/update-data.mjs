#!/usr/bin/env node
/**
 * Acrescenta à `ipcaSeries` de `app/data/tax-data.json` os anos novos do IPCA
 * anual (variação acumulada em dezembro) — IBGE/SIDRA t.1737 v.69.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TAX_DATA_PATH = join(ROOT, 'app/data/tax-data.json');

const SIDRA_IPCA_URL =
  'https://apisidra.ibge.gov.br/values/t/1737/n1/all/v/69/p/all?formato=json';

/** Série anual (dez/dez) das linhas mensais do SIDRA; exportada para teste. */
export function parseAnnualIpca(rows) {
  const annual = [];
  for (const row of rows) {
    const period = String(row.D3C ?? '');
    const value = Number(String(row.V ?? '').replace(',', '.'));
    if (!/^\d{6}$/.test(period) || period.slice(4) !== '12') continue;
    if (!Number.isFinite(value)) continue;
    annual.push({ year: Number(period.slice(0, 4)), pct: value });
  }
  return annual.sort((a, b) => a.year - b.year);
}

/** Acrescenta apenas anos novos à série existente (nunca sobrescreve). */
export function mergeIpcaSeries(existing, incoming) {
  const known = new Set(existing.map((entry) => entry.year));
  const additions = incoming.filter((entry) => !known.has(entry.year));
  return { series: [...existing, ...additions], additions };
}

async function main() {
  const taxData = JSON.parse(readFileSync(TAX_DATA_PATH, 'utf8'));

  console.log('Buscando IPCA anual no SIDRA/IBGE...');
  const response = await fetch(SIDRA_IPCA_URL);
  if (!response.ok) {
    throw new Error(`SIDRA respondeu ${response.status}`);
  }
  const rows = (await response.json()).slice(1); // primeira linha é cabeçalho

  const annual = parseAnnualIpca(rows);
  const { series, additions } = mergeIpcaSeries(taxData.ipcaSeries, annual);

  if (additions.length === 0) {
    console.log('IPCA: nenhum ano novo — nada a fazer.');
    return;
  }

  taxData.ipcaSeries = series;
  taxData.updatedAt = new Date().toISOString().slice(0, 10);
  writeFileSync(TAX_DATA_PATH, `${JSON.stringify(taxData, null, 2)}\n`);
  console.log(
    `IPCA: adicionados ${additions.length} ano(s): ${additions
      .map((entry) => `${entry.year} (${entry.pct}%)`)
      .join(', ')}`,
  );
  console.log(
    'Lembrete de revisão manual: fechamento anual do Impostômetro, estimativa do ano corrente, custos de referência (FNDE/MS/DIEESE/MDS) e tabelas de folha (INSS/IRRF).',
  );
}

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
