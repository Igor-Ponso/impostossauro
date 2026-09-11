import { describe, expect, it } from 'vitest';
import en from '../i18n/locales/en.json';
import pt from '../i18n/locales/pt-BR.json';
import pisa from '../app/data/pisa.json';
import world from '../app/data/world.json';

/**
 * Os seis pares saem do texto do factsheet da OCDE, não de resumo: cada um
 * aparece lá como "X% of students ... (OECD average: Y%)". Se um número mudar
 * aqui sem o documento mudar, este teste quebra.
 */
const DO_DOCUMENTO = {
  baseline: { math: [27, 69], reading: [50, 74], science: [45, 76] },
  top: { math: [1, 9], reading: [2, 7], science: [1, 7] },
} as const;

describe('PISA 2022: o dado publicado e o do documento', () => {
  for (const grupo of ['baseline', 'top'] as const) {
    for (const [chave, [brasil, ocde]] of Object.entries(DO_DOCUMENTO[grupo])) {
      it(`${grupo}.${chave}: Brasil ${brasil}% contra ${ocde}% da OCDE`, () => {
        const linha = pisa[grupo].find((l) => l.key === chave);
        expect(linha, `${grupo} sem a linha "${chave}"`).toBeDefined();
        expect(linha!.brazil).toBe(brasil);
        expect(linha!.oecd).toBe(ocde);
      });
    }
  }

  it('o Brasil fica abaixo da OCDE em todas as seis medidas', () => {
    for (const linha of [...pisa.baseline, ...pisa.top]) {
      expect(linha.brazil, `${linha.key} deixou de ficar abaixo da OCDE`).toBeLessThan(linha.oecd);
    }
  });

  it('declara a rodada, a fonte e o link do documento', () => {
    expect(pisa.round).toBe(2022);
    expect(pisa.source).toContain('OECD');
    expect(pisa.url).toMatch(/^https:\/\/www\.oecd\.org\//);
    expect(pisa.url).toMatch(/\.pdf$/);
  });
});

describe('o gasto ao lado do aprendizado', () => {
  /**
   * O gasto vem do Banco Mundial, a mesma série que a página já publica como
   * insumo. Publicar dois valores diferentes para a mesma coisa na mesma tela
   * seria o site afirmando duas contas.
   */
  it('bate com o educacaoGasto que a pagina ja mostra', () => {
    const ind = world.indicadores.find((i) => i.id === 'educacaoGasto')!;
    const doMapa = (ind.valores as Record<string, number>).BRA;
    expect(Math.round(doMapa * 10) / 10).toBe(pisa.spending.pctGdp);
  });

  it('nomeia o indicador do Banco Mundial', () => {
    expect(pisa.spending.indicator).toBe('SE.XPD.TOTL.GD.ZS');
    expect(pisa.spending.url).toContain('SE.XPD.TOTL.GD.ZS');
  });
});

describe('a peca fala nos dois idiomas', () => {
  const CHAVES = [
    'pisaTitle', 'pisaIntro', 'pisaSpending', 'pisaBaselineTitle', 'pisaTopTitle',
    'pisaBrazil', 'pisaOecd', 'pisaMath', 'pisaReading', 'pisaScience',
    'pisaLeaders', 'pisaPunch', 'pisaQuestion', 'pisaSourcePrefix',
  ] as const;

  for (const nome of CHAVES) {
    it(`world.${nome} existe em pt-BR e en, e nao repete`, () => {
      const emPt = (pt.world as Record<string, string>)[nome];
      const emEn = (en.world as Record<string, string>)[nome];
      expect(emPt, `pt-BR sem world.${nome}`).toBeTruthy();
      expect(emEn, `en sem world.${nome}`).toBeTruthy();
    });
  }

  it('a frase do gasto carrega os dois espacos reservados', () => {
    for (const [nome, bloco] of [['pt-BR', pt], ['en', en]] as const) {
      const frase = (bloco.world as Record<string, string>).pisaSpending!;
      expect(frase, `${nome}: pisaSpending sem {pct}`).toContain('{pct}');
      expect(frase, `${nome}: pisaSpending sem {ano}`).toContain('{ano}');
    }
  });

  it('a frase dos lideres carrega {share}', () => {
    for (const bloco of [pt, en]) {
      expect((bloco.world as Record<string, string>).pisaLeaders).toContain('{share}');
    }
  });
});
