import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import governments from '../app/data/governments.json';

/**
 * A lista de dossiês vem de `presets`, a mesma tabela que desenha os botões, e
 * precisa cobrir os governos de `governments.json`: um mandato novo entra nos
 * dois lugares de uma vez, ou este teste falha.
 */
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const pagina = readFileSync(join(raiz, 'app', 'pages', 'maquina-do-tempo.vue'), 'utf-8');

describe('maquina do tempo — os dossies com o periodo inteiro aberto', () => {
  it('nao esconde mais o dossie quando "tudo" esta selecionado', () => {
    expect(
      pagina,
      'o v-if que fechava todos os dossies em "all" voltou',
    ).not.toContain("activePreset !== 'all'");
  });

  it('renderiza uma lista de dossies, nao um so', () => {
    expect(pagina).toMatch(/<MandateDossier[\s\S]{0,120}v-for="\(chave, indice\) in dossies"/);
  });

  it('todo preset de mandato tem dossie no JSON', () => {
    const chavesNaPagina = [...pagina.matchAll(/\{ key: '([a-z0-9]+)', start: \d{4}, end: \d{4} \}/g)]
      .map((m) => m[1]!)
      .filter((chave) => chave !== 'all');
    expect(chavesNaPagina.length, 'nenhum preset encontrado na pagina').toBeGreaterThan(3);

    const noDado = new Set(governments.governments.map((g) => g.key));
    for (const chave of chavesNaPagina) {
      expect(noDado, `o preset "${chave}" nao tem dossie em governments.json`).toContain(chave);
    }
  });
});
