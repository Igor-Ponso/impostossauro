import { describe, expect, it } from 'vitest';
import {
  brasilVence,
  comparaveis,
  fracaoNaEscala,
  movimentoDe,
  paisPorSlug,
  posicaoNoRanking,
  slugDoPais,
  vereditoDe,
  type Indicador,
  type IndicadorMundo,
  type PaisMundo,
} from '~/utils/mundo';

describe('posicaoNoRanking', () => {
  it('acha a posicao quando maior e melhor', () => {
    expect(posicaoNoRanking(76, [83, 80, 76, 70], 'maiorMelhor')).toBe(3);
  });

  it('inverte quando menor e melhor, como em homicidios', () => {
    expect(posicaoNoRanking(19.3, [0.9, 1.2, 19.3, 25], 'menorMelhor')).toBe(3);
  });

  it('trata empate sem quebrar', () => {
    expect(posicaoNoRanking(10, [10, 10, 5], 'maiorMelhor')).toBe(1);
  });

  it('devolve zero para lista vazia em vez de quebrar', () => {
    expect(posicaoNoRanking(10, [], 'maiorMelhor')).toBe(0);
  });
});

describe('comparaveis', () => {
  const paises = ['BRA', 'SWE', 'USA'];

  it('aceita indicador que cobre todos os paises comparados', () => {
    const ind: Indicador = { id: 'vida', fonte: 'Banco Mundial',
      valores: { BRA: 76, SWE: 83, USA: 77 } };
    expect(comparaveis([ind], paises)).toHaveLength(1);
  });

  it('recusa indicador com pais faltando', () => {
    const ind: Indicador = { id: 'vida', fonte: 'Banco Mundial',
      valores: { BRA: 76, SWE: 83 } };
    expect(comparaveis([ind], paises)).toHaveLength(0);
  });

  // O Banco Mundial devolve `"value": null` no ano sem dado; parseFloat(null) dá
  // NaN, e `typeof NaN` é 'number'.
  it('recusa NaN como cobertura, porque NaN também é do tipo number', () => {
    const semDado = Number.parseFloat(null as unknown as string);
    const ind: Indicador = { id: 'saneamento', fonte: 'Banco Mundial',
      valores: { BRA: 54.96, SWE: 99.5, USA: semDado } };
    expect(Number.isNaN(semDado), 'o teste só vale se o valor for mesmo NaN').toBe(true);
    expect(comparaveis([ind], paises)).toHaveLength(0);
  });

  it('recusa indicador cujos valores vieram de fontes diferentes', () => {
    const ind: Indicador = { id: 'carga', fonte: 'Banco Mundial',
      valores: { BRA: 32.3, SWE: 42.6, USA: 27.7 },
      fontePorPais: { BRA: 'Tesouro Nacional' } };
    expect(comparaveis([ind], paises)).toHaveLength(0);
  });
});

const BR = {
  iso: 'BRA', nome: 'Brasil', carga: 33.43, idh: 0.786, irbes: 143.37, posicao: 30,
} as PaisMundo;
const CH = {
  iso: 'CHE', nome: 'Suíça', carga: 27.9, idh: 0.967, irbes: 165.11, posicao: 2,
} as PaisMundo;

const vida = {
  id: 'vida', ordem: 'maiorMelhor', escala: [60, 90], movimento: 'VIDA LONGA',
  valores: { BRA: 76, CHE: 84.4 },
} as unknown as IndicadorMundo;
const homic = {
  id: 'homicidios', ordem: 'menorMelhor', escala: [0, 25], movimento: 'SEGURANÇA',
  valores: { BRA: 19.3, CHE: 0.6 },
} as unknown as IndicadorMundo;
const escola = {
  id: 'ensinoMedio', ordem: 'maiorMelhor', escala: [30, 100], movimento: 'ESCOLA',
  valores: { BRA: 61.7, CHE: 84.4 },
} as unknown as IndicadorMundo;

describe('slugDoPais', () => {
  it('tira acento e troca espaco por hifen', () => {
    expect(slugDoPais('Suíça')).toBe('suica');
    expect(slugDoPais('República Tcheca')).toBe('republica-tcheca');
    expect(slugDoPais('Estados Unidos')).toBe('estados-unidos');
    expect(slugDoPais('Coreia do Sul')).toBe('coreia-do-sul');
  });
});

describe('slugDoPais nos 30 paises de verdade', () => {
  it('gera slug valido e unico para cada um', async () => {
    // Slug vira rota: invalido quebra a URL, repetido faz dois paises disputarem a mesma pagina.
    const world = (await import('../app/data/world.json')).default;
    const vistos = new Map<string, string>();
    for (const pais of world.paises) {
      const slug = slugDoPais(pais.nome);
      expect(slug, `${pais.nome} gerou slug invalido: ${slug}`).toMatch(/^[a-z0-9-]+$/);
      expect(vistos.has(slug), `${pais.nome} colide com ${vistos.get(slug)}`).toBe(false);
      vistos.set(slug, pais.nome);
    }
    expect(vistos.size).toBe(30);
  });

  it('acha de volta todo pais pelo proprio slug', () => {
    return import('../app/data/world.json').then(({ default: world }) => {
      const lista = world.paises as PaisMundo[];
      for (const pais of lista) {
        expect(paisPorSlug(slugDoPais(pais.nome), lista)?.iso).toBe(pais.iso);
      }
    });
  });
});

describe('paisPorSlug', () => {
  it('acha o pais e devolve null para slug desconhecido', () => {
    const lista = [BR, CH];
    expect(paisPorSlug('suica', lista)?.iso).toBe('CHE');
    expect(paisPorSlug('narnia', lista)).toBeNull();
  });
});

describe('brasilVence', () => {
  it('respeita a ordem nos dois sentidos', () => {
    expect(brasilVence(vida, CH)).toBe(false);   // 76 < 84,4 e maior e melhor
    expect(brasilVence(homic, CH)).toBe(false);  // 19,3 > 0,6 e menor e melhor
  });

  it('devolve null quando falta dado de um dos lados', () => {
    const semDado = { ...vida, valores: { BRA: 76 } } as unknown as IndicadorMundo;
    expect(brasilVence(semDado, CH)).toBeNull();
  });
});

describe('fracaoNaEscala', () => {
  it('usa a escala declarada, nao o grupo', () => {
    // 76 anos numa escala de 60 a 90 da 53,3% — nao 0%, que e o que sairia
    // se a escala fosse o minimo e o maximo do grupo (o Brasil é o minimo)
    expect(fracaoNaEscala(76, vida)).toBeCloseTo(53.33, 1);
    expect(fracaoNaEscala(84.4, vida)).toBeCloseTo(81.33, 1);
  });

  it('inverte quando menor e melhor', () => {
    expect(fracaoNaEscala(19.3, homic)).toBeCloseTo(22.8, 1);
    expect(fracaoNaEscala(0.6, homic)).toBeCloseTo(97.6, 1);
  });

  it('grampeia fora da escala em vez de estourar a barra', () => {
    expect(fracaoNaEscala(200, vida)).toBe(100);
    expect(fracaoNaEscala(10, vida)).toBe(0);
  });
});

describe('movimentoDe', () => {
  it('escolhe o indicador de maior abismo a favor do adversario', () => {
    // vida: 84,4/76 = 1,11x · homicidios: 19,3/0,6 = 32,2x
    expect(movimentoDe(CH, [vida, homic])?.movimento).toBe('SEGURANÇA');
  });

  it('ignora indicador em que o Brasil vence', () => {
    const brasilGanha = {
      ...escola, valores: { BRA: 61.7, CHE: 35 },
    } as unknown as IndicadorMundo;
    expect(movimentoDe(CH, [brasilGanha])).toBeNull();
  });

  it('ignora indicador sem dado do adversario', () => {
    const semDado = { ...homic, valores: { BRA: 19.3 } } as unknown as IndicadorMundo;
    expect(movimentoDe(CH, [semDado])).toBeNull();
  });
});

describe('vereditoDe', () => {
  it('da o sinal certo quando o adversario cobra menos', () => {
    const v = vereditoDe(BR, CH, vida);
    expect(v.difCarga).toBeCloseTo(-5.53, 2);
    expect(v.cobraMenos).toBe(true);
    expect(v.anosAMais).toBeCloseTo(8.4, 1);
  });

  it('da o sinal certo quando o adversario cobra mais', () => {
    const dinamarca = { ...CH, iso: 'DNK', nome: 'Dinamarca', carga: 44.1 } as PaisMundo;
    const v = vereditoDe(BR, dinamarca, vida);
    expect(v.difCarga).toBeCloseTo(10.67, 2);
    expect(v.cobraMenos).toBe(false);
  });
});
