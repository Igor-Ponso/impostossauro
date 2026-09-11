import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import pt from '../i18n/locales/pt-BR.json';
import en from '../i18n/locales/en.json';

/**
 * `role="img"` faz o leitor de tela anunciar só o `aria-label` e nunca chegar aos
 * anos e números; `role="group"` deixa os filhos serem lidos. A conferência é o
 * texto do componente porque montá-lo exigiria o i18n e os auto-imports do Nuxt.
 */
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
/**
 * `PoderDeCompra` e `ImperioComposicao` ficam de fora: navegam por `<button>` e
 * `role="button"`, e a regra do `tabindex="0"` e de SVG. Ver `imperioComposicao.spec.ts`.
 */
const GRAFICOS = ['HistoryChart', 'BurdenChart', 'FederalRevenueChart', 'CargaPorEsfera'] as const;
const fonte = Object.fromEntries(
  GRAFICOS.map((nome) => [nome, readFileSync(join(raiz, 'app', 'components', `${nome}.vue`), 'utf-8')]),
) as Record<(typeof GRAFICOS)[number], string>;

describe.each(GRAFICOS)('%s — acessibilidade', (nome) => {
  it('tem ponto navegavel por teclado', () => {
    expect(fonte[nome], 'nenhum elemento do grafico recebe foco').toContain('tabindex="0"');
  });

  it('o ponto navegavel se anuncia com o proprio dado', () => {
    expect(fonte[nome]).toMatch(/:aria-label=/);
    expect(fonte[nome], 'o ponto precisa reagir ao foco, nao so ao mouse').toContain('@focus');
  });

  it('nao usa role="img", que esconde os numeros de dentro', () => {
    expect(fonte[nome], 'role="img" impede o leitor de tela de chegar aos dados').not.toContain('role="img"');
  });

  it('anuncia a leitura quando ela muda', () => {
    expect(fonte[nome], 'a caixa de leitura precisa de aria-live').toContain('aria-live="polite"');
  });
});

describe('a dica de cada grafico descreve interacao que existe', () => {
  const dicas = [
    ['historyChart', 'HistoryChart'],
    ['burden', 'BurdenChart'],
    ['federalRevenueChart', 'FederalRevenueChart'],
  ] as const;

  it.each(dicas)('%s promete o teclado, que agora existe', (chave) => {
    const ptDica = (pt as Record<string, Record<string, string>>)[chave]!.hint!;
    const enDica = (en as Record<string, Record<string, string>>)[chave]!.hint!;
    expect(ptDica, 'a dica em portugues nao menciona o teclado').toMatch(/Tab/);
    expect(enDica, 'a dica em ingles nao menciona o teclado').toMatch(/Tab/);
  });
});
