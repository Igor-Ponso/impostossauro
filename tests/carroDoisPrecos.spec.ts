import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import en from '../i18n/locales/en.json';
import pt from '../i18n/locales/pt-BR.json';
import cambio from '../app/data/cambio.json';
import dado from '../app/data/carro-dois-precos.json';

/**
 * A peça compara duas etiquetas do mesmo carro. O que sustenta a conclusão é a
 * convergência: o preço brasileiro menos o tributo cai quase em cima do preço
 * paraguaio. Se essa convergência deixar de existir, a peça perde o sentido e
 * estes testes avisam — em vez de continuar publicando a frase antiga.
 */
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const componente = readFileSync(join(raiz, 'app', 'components', 'CarroDoisPrecos.vue'), 'utf-8');

const paraguaiEmReal = dado.paraguai.preco * cambio.usdBrl;
const tributo = (dado.brasil.preco * dado.carga.pct) / 100;
const brasilSemTributo = dado.brasil.preco - tributo;

describe('as duas etiquetas', () => {
  it('cada preco vem do site da propria montadora, com data de consulta', () => {
    for (const [nome, lado] of [['brasil', dado.brasil], ['paraguai', dado.paraguai]] as const) {
      expect(lado.source, `${nome} sem fonte`).toContain('Chevrolet');
      expect(lado.url, `${nome} com link errado`).toMatch(/^https:\/\/www\.chevrolet\.com\./);
      expect(lado.consultaEm, `${nome} sem data`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(lado.preco).toBeGreaterThan(0);
    }
  });

  it('cada lado declara a moeda em que a fonte publicou', () => {
    expect(dado.brasil.moeda).toBe('BRL');
    expect(dado.paraguai.moeda).toBe('USD');
  });

  it('as duas versoes sao 1.0 manual, para a comparacao fazer sentido', () => {
    for (const lado of [dado.brasil, dado.paraguai]) {
      expect(lado.versao).toMatch(/1\.0/);
      expect(lado.versao).toMatch(/MT/);
    }
  });
});

describe('o corte do tributo', () => {
  it('a carga e a do item de carro popular, com fonte', () => {
    expect(dado.carga.pct).toBeCloseTo(34.96, 2);
    expect(dado.carga.item).toMatch(/popular/i);
    expect(dado.carga.source).toMatch(/Impost[oô]metro/i);
  });

  it('nenhum resultado esta digitado na tela: tudo sai do dado', () => {
    expect(componente).toContain('(brasil.preco * carga.pct) / 100');
    expect(componente).toContain('paraguai.preco * cambio.usdBrl');
    // os resultados da conta nao podem aparecer como literal
    expect(componente).not.toMatch(/35[.,]970/);
    expect(componente).not.toMatch(/66[.,]9\d\d/);
  });

  /**
   * O coração da peça: tirado o tributo, os dois preços convergem. Se a folga
   * passar de 5% do preço paraguaio, a conclusão publicada deixa de valer.
   */
  it('sem o tributo, os dois precos convergem', () => {
    const folga = Math.abs(brasilSemTributo - paraguaiEmReal);
    expect(folga / paraguaiEmReal).toBeLessThan(0.05);
  });

  it('o tributo explica a quase totalidade da diferenca', () => {
    const diferenca = dado.brasil.preco - paraguaiEmReal;
    expect(diferenca).toBeGreaterThan(0);
    expect(tributo / diferenca).toBeGreaterThan(0.9);
  });

  it('a conversao usa a PTAX que o site ja publica', () => {
    expect(cambio.usdBrl).toBeGreaterThan(1);
    expect(cambio.tipo).toMatch(/PTAX/i);
  });
});

describe('a ressalva da imunidade', () => {
  /**
   * Sem isto a peça é atacável: imunidade de exportação é regra universal, e
   * omiti-la faria parecer que só o Brasil desonera o que exporta.
   */
  it('cita o dispositivo da imunidade de exportacao', () => {
    expect(dado.imunidade.article).toBe('Art. 3º, II');
    expect(dado.imunidade.text).toMatch(/n[ãa]o incide/i);
    expect(dado.imunidade.text).toMatch(/exterior/i);
    expect(dado.imunidade.url).toContain('planalto.gov.br');
  });

  it('a pagina diz que a imunidade nao e invencao brasileira', () => {
    for (const [nome, bloco] of [['pt-BR', pt], ['en', en]] as const) {
      const nota = (bloco.econ101 as Record<string, string>).carWhyNote!;
      expect(nota, `${nome}: ressalva fraca demais`).toMatch(/todo pa[íi]s|every country/i);
      expect(nota.length).toBeGreaterThan(180);
    }
  });

  it('a ressalva declara data, cotacao e o limite da comparacao', () => {
    for (const bloco of [pt, en]) {
      const c = (bloco.econ101 as Record<string, string>).carCaveat!;
      expect(c).toContain('{data}');
      expect(c).toContain('{ptax}');
      expect(c).toMatch(/equipamento|equipment/i);
    }
  });
});

describe('a peca fala nos dois idiomas', () => {
  const CHAVES = [
    'carKicker', 'carTitle', 'carLead', 'carHere', 'carThere', 'carConverted',
    'carCutTitle', 'carCutLead', 'carRowBr', 'carRowTax', 'carRowNet', 'carRowPy',
    'carRowLeft', 'carPunch', 'carWhyTitle', 'carWhyLead', 'carWhyNote',
    'carCaveat', 'carQuestion',
  ] as const;

  for (const nome of CHAVES) {
    it(`econ101.${nome} existe nos dois idiomas`, () => {
      expect((pt.econ101 as Record<string, string>)[nome], `pt-BR sem ${nome}`).toBeTruthy();
      expect((en.econ101 as Record<string, string>)[nome], `en sem ${nome}`).toBeTruthy();
    });
  }

  it('o fecho nao acusa pessoa nomeada', () => {
    for (const bloco of [pt, en]) {
      const fecho = (bloco.econ101 as Record<string, string>).carQuestion!;
      expect(fecho).not.toMatch(/Lula|Bolsonaro|Dilma|Temer|ladr|corrupt/i);
    }
  });
});
