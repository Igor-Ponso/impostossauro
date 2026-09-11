import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import historical from '../app/data/historical.json';
import en from '../app/data/en/historical.json';

/**
 * Não existe carga tributária em % do PIB para o século XIX — não havia contas
 * nacionais. A peça mede outra coisa (composição da receita), a soma tem de
 * fechar na fonte, e a ressalva do denominador não pode sair da tela.
 */
const imperio = historical.empire as unknown as {
  milestones: Array<{ label: string; imports: number; exports: number; others: number }>;
  table: { source: string; url: string };
  ruler: string;
  tariff: string;
  denominatorCaveat: string;
};

describe('o Imperio — a regua e outra, e isso esta na tela', () => {
  it('nao publica carga em % do PIB para o seculo XIX', () => {
    expect(imperio.ruler).toContain('não existe para o período');
    for (const marco of imperio.milestones) {
      expect(Object.keys(marco)).not.toContain('pctGdp');
    }
  });

  it('os cinco marcos da tabela 1.2 somam 100% cada um', () => {
    expect(imperio.milestones).toHaveLength(5);
    for (const marco of imperio.milestones) {
      const soma = marco.imports + marco.exports + marco.others;
      expect(Number(soma.toFixed(1)), `${marco.label} soma ${soma}`).toBe(100);
    }
  });

  it('os marcos sao os anos que a fonte mede, na ordem', () => {
    expect(imperio.milestones.map((m) => m.label)).toEqual(['1823', '1830-31', '1850-51', '1870-71', '1888']);
  });

  it('a fonte e o documento primario, com link', () => {
    expect(imperio.table.source).toContain('TD 584');
    expect(imperio.table.source).toContain('Carreira');
    expect(imperio.table.url).toMatch(/^https:\/\/www\.econ\.puc-rio\.br\//);
  });

  /**
   * A tabela mede a receita total; a prosa do estudo fala em "sempre superior a
   * 50%" da receita ordinária depois de 1833. Denominadores diferentes — por isso
   * 1830-31 aparece em 22,1%, e sem a ressalva a barra desmente o estudo que cita.
   */
  it('a ressalva do denominador esta publicada, nos dois idiomas', () => {
    expect(imperio.denominatorCaveat).toContain('ORDINÁRIA');
    expect(imperio.denominatorCaveat).toContain('TOTAL');
    const ingles = en as Record<string, string>;
    expect(ingles['empire.denominatorCaveat']).toContain('ORDINARY');
    expect(ingles['empire.ruler']).toBeTruthy();
    expect(ingles['empire.tariff']).toBeTruthy();
  });

  it('o marco de 1830-31 e mesmo o que o estudo traz, e nao um erro de leitura', () => {
    const trinta = imperio.milestones.find((m) => m.label === '1830-31')!;
    expect(trinta.imports).toBe(22.1);
    expect(trinta.others).toBe(70.8);
  });
});

describe('o Imperio — a peca na tela', () => {
  const fonte = readFileSync('app/components/ImperioComposicao.vue', 'utf-8');

  it('a frase de efeito sai do dado, nao digitada no componente', () => {
    expect(fonte).toContain("t('empire.punch'");
    expect(fonte).not.toMatch(/77[,.]1/);
  });

  it('cada fatia se anuncia e recebe foco de teclado', () => {
    expect(fonte).toContain('tabindex="0"');
    expect(fonte).toMatch(/:aria-label=/);
    expect(fonte).toContain('@focus');
    expect(fonte).toContain('aria-live="polite"');
    expect(fonte).not.toContain('role="img"');
  });

  it('a largura da fatia e a propria porcentagem, sem escala escolhida', () => {
    expect(fonte).toContain('${marco[fatia.chave]}%');
  });
});

/**
 * Com `reveal` a seção nasce invisível no HTML estático e só aparece quando o
 * observador de rolagem responde; no fim de uma página longa o risco não vale a animação.
 */
describe('o Imperio — o grafico nao depende de JavaScript para existir', () => {
  const fonte = readFileSync('app/components/ImperioComposicao.vue', 'utf-8');

  it('a secao nao esconde o conteudo atras do observador de rolagem', () => {
    expect(fonte).not.toContain('useInView');
    expect(fonte).not.toContain('class="reveal"');
  });

  it('a largura da fatia nao passa por um estado errado antes de assentar', () => {
    // Escalar por transformacao uma fatia de largura em % a desloca enquanto
    // anima: a barra aparece torta ate assentar, e a captura pega a composicao errada.
    expect(fonte).not.toContain('transform:');
    expect(fonte).not.toContain('@keyframes');
    expect(fonte).not.toContain("'0%'");
  });
});

describe('marcador de pandemia — a janela mora num lugar so', () => {
  const GRAFICOS = [
    'BurdenChart', 'CargaPorEsfera', 'HistoryChart', 'FederalRevenueChart', 'PoderDeCompra',
  ];

  it('todo grafico que cruza a janela usa a constante, e nao um ano digitado', () => {
    for (const nome of GRAFICOS) {
      const fonte = readFileSync(`app/components/${nome}.vue`, 'utf-8');
      expect(fonte, `${nome} nao marca a pandemia`).toMatch(/PANDEMIA|naPandemia/);
      expect(fonte, `${nome} digitou o ano em vez de usar a constante`).not.toMatch(/=== 2020|=== 2021/);
    }
  });

  it('a janela e 2020-2021, definida uma vez', () => {
    const util = readFileSync('app/utils/pandemia.ts', 'utf-8');
    expect(util).toContain('from: 2020');
    expect(util).toContain('to: 2021');
  });
});
