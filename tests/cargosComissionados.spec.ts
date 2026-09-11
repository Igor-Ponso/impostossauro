import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * A peça afirma o que não está escrito na tela — a escada do reajuste, o vão
 * entre topo e base, a função a 60% do cargo. Tudo sai da tabela da lei; se a
 * escada deixar de ser escada, a suíte quebra antes de a página publicar.
 */
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const dados = JSON.parse(
  readFileSync(join(raiz, 'app', 'data', 'commissioned-posts.json'), 'utf-8'),
) as {
  levels: Array<{ level: string; from: number; to: number; fceFrom: number | null; fceTo: number | null }>;
};

const niveis = dados.levels;
const reajuste = (n: (typeof niveis)[number]) => n.to / n.from - 1;

describe('a tabela de cargos comissionados da Lei 15.141/2025', () => {
  it('tem os dezoito niveis, do CCE-18 ao CCE-1, do topo para a base', () => {
    expect(niveis.map((n) => n.level)).toEqual([
      'CCE-18', 'CCE-17', 'CCE-16', 'CCE-15', 'CCE-14', 'CCE-13', 'CCE-12', 'CCE-11', 'CCE-10',
      'CCE-9', 'CCE-8', 'CCE-7', 'CCE-6', 'CCE-5', 'CCE-4', 'CCE-3', 'CCE-2', 'CCE-1',
    ]);
  });

  it('reajusta todo nivel, e o do topo e o maior de todos', () => {
    expect(niveis.every((n) => n.to > n.from)).toBe(true);
    const maior = Math.max(...niveis.map(reajuste));
    expect(reajuste(niveis[0]!)).toBeCloseTo(maior, 10);
  });

  it('nao e uma rampa: sao quatro degraus, e o degrau so depende da altura do cargo', () => {
    // A tabela separa os cinco níveis de cima dos treze de baixo com um vão no meio.
    const pct = niveis.map(reajuste);
    expect(pct[0]).toBeCloseTo(0.3, 4);   // CCE-18
    expect(pct[1]).toBeCloseTo(0.23, 4);  // CCE-17
    expect(pct.slice(2, 5).every((r) => Math.abs(r - 0.17) < 5e-5)).toBe(true); // CCE-16 a CCE-14

    // Os treze restantes levaram 9% ou menos — um deles, o CCE-9, levou 8,50%.
    const base = pct.slice(5);
    expect(base).toHaveLength(13);
    expect(Math.max(...base)).toBeLessThan(0.0901);
    expect(Math.min(...base)).toBeCloseTo(0.085, 3);

    // O vão: o menor reajuste do topo é quase o dobro do maior da base.
    expect(Math.min(...pct.slice(0, 5))).toBeGreaterThan(Math.max(...base) * 1.85);
  });

  it('da ao topo um aumento mensal duzentas vezes o da base', () => {
    const topo = niveis[0]!.to - niveis[0]!.from;
    const base = niveis.at(-1)!.to - niveis.at(-1)!.from;
    expect(topo / base).toBeGreaterThan(200);
  });

  it('paga na funcao (FCE) 60% do cargo (CCE) de CCE-5 para cima, e o mesmo abaixo', () => {
    for (const n of niveis) {
      if (n.fceTo === null) continue; // CCE-18 nao tem funcao correspondente
      const acimaDoCorte = Number(n.level.replace('CCE-', '')) >= 5;
      // A tolerância é a do arredondamento ao centavo da própria tabela: o
      // CCE-9 sai a 0,6028 porque foi ele que recebeu os 8,50%.
      expect(n.fceTo / n.to).toBeCloseTo(acimaDoCorte ? 0.6 : 1, 2);
      expect(n.fceFrom! / n.from).toBeCloseTo(acimaDoCorte ? 0.6 : 1, 2);
    }
  });
});
