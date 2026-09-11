import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import en from '../i18n/locales/en.json';
import pt from '../i18n/locales/pt-BR.json';
import dado from '../app/data/imposto-sobre-imposto.json';

/**
 * A peça se apoia em três dispositivos lidos no Planalto. Nenhum número da tela
 * é digitado: a alíquota real sai da anunciada. Se alguém trocar a conta por um
 * literal, ou trocar o texto da lei, estes testes quebram.
 */
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const componente = readFileSync(join(raiz, 'app', 'components', 'ImpostoSobreImposto.vue'), 'utf-8');

/** A alíquota que incide sobre a mercadoria, quando o imposto está na própria base. */
const efetiva = (a: number) => (a / (100 - a)) * 100;

describe('a alíquota por dentro', () => {
  it('a conta vem da aliquota, nao de numero digitado no componente', () => {
    expect(componente).toContain('(anunciada / (100 - anunciada)) * 100');
    // 21,95 é o resultado do exemplo: não pode estar escrito na tela.
    expect(componente).not.toMatch(/21[,.]95/);
  });

  it('18% por dentro dao 21,95% sobre a mercadoria', () => {
    expect(efetiva(18)).toBeCloseTo(21.9512, 3);
  });

  it('cada aliquota anunciada e menor que a real', () => {
    for (const a of dado.porDentro.rates) {
      expect(efetiva(a), `${a}% deixou de ser menor que a real`).toBeGreaterThan(a);
    }
  });

  it('o exemplo usa uma aliquota que esta na tabela', () => {
    expect(dado.porDentro.rates).toContain(dado.porDentro.example.rate);
  });
});

describe('os tres dispositivos citados', () => {
  const blocos = [
    ['porDentro', dado.porDentro.law, /lcp87/],
    ['cumulativo', dado.cumulativo.law, /l10\.833/],
    ['reforma', dado.reforma.law, /emc132/],
  ] as const;

  for (const [nome, lei, naUrl] of blocos) {
    it(`${nome}: tem texto, artigo, fonte e link do Planalto`, () => {
      expect(lei.text.length).toBeGreaterThan(40);
      expect(lei.article).toBeTruthy();
      expect(lei.source).toContain('Planalto');
      expect(lei.url).toMatch(/^https:\/\/www\.planalto\.gov\.br\//);
      expect(lei.url).toMatch(naUrl);
    });
  }

  /**
   * Texto de lei é a prova: fica em português nas duas rotas e não entra no
   * i18n, senão o `postTranslation` o trataria como prosa.
   */
  it('o texto das leis mora no dado, nao no i18n', () => {
    const emIngles = JSON.stringify(en);
    expect(emIngles).not.toContain('montante do próprio imposto');
    expect(emIngles).not.toContain('Permanecem sujeitas');
  });
});

describe('os casos de regime cumulativo', () => {
  it('cada caso tem inciso e traducao nos dois idiomas', () => {
    for (const caso of dado.cumulativo.casos) {
      expect(caso.inciso, 'caso sem inciso').toMatch(/^[IVX]+$/);
      for (const [nome, bloco] of [['pt-BR', pt], ['en', en]] as const) {
        const casos = (bloco.econ101 as Record<string, unknown>).cascadeCases as Record<string, string>;
        expect(casos[caso.key], `${nome} sem econ101.cascadeCases.${caso.key}`).toBeTruthy();
      }
    }
  });

  it('nenhum inciso se repete', () => {
    const incisos = dado.cumulativo.casos.map((c) => c.inciso);
    expect(new Set(incisos).size).toBe(incisos.length);
  });
});

describe('a peca fala nos dois idiomas', () => {
  const CHAVES = [
    'cascadeKicker', 'cascadeTitle', 'cascadeLead',
    'insideTitle', 'insideLead', 'insideWalkTitle', 'insideTag', 'insideTax',
    'insideGoods', 'insideResult', 'insideTableTitle', 'insideAnnounced',
    'insideReal', 'insideTableNote',
    'cascadeWhereTitle', 'cascadeWhereLead', 'cascadeWhereNote',
    'cascadeFixTitle', 'cascadeFixLead', 'cascadeQuestion',
  ] as const;

  for (const nome of CHAVES) {
    it(`econ101.${nome} existe nos dois idiomas`, () => {
      expect((pt.econ101 as Record<string, string>)[nome], `pt-BR sem ${nome}`).toBeTruthy();
      expect((en.econ101 as Record<string, string>)[nome], `en sem ${nome}`).toBeTruthy();
    });
  }

  it('as frases com aliquota carregam {rate}', () => {
    for (const bloco of [pt, en]) {
      const e = bloco.econ101 as Record<string, string>;
      expect(e.insideTax).toContain('{rate}');
      expect(e.insideResult).toContain('{rate}');
    }
  });

  it('fecha em pergunta, nos dois idiomas', () => {
    for (const bloco of [pt, en]) {
      expect((bloco.econ101 as Record<string, string>).cascadeQuestion!.trim()).toMatch(/\?$/);
    }
  });
});


