import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import contrasts from '../app/data/contrasts.json';
import federative from '../app/data/federative.json';
import governments from '../app/data/governments.json';
import social from '../app/data/social-history.json';

/**
 * A série do IBGE é revisada: a divulgação de janeiro/2018 dizia 12,7% de
 * desemprego em 2017, a tabela atual (SIDRA 4562) diz 12,6%, e o pico da
 * série é 2021 (14,0%). O que se tranca é o valor da tabela e o superlativo.
 */
const desemprego = social.indicators.find((i) => i.key === 'unemployment')!;
const analfabetismo = social.indicators.find((i) => i.key === 'illiteracy')!;
const ponto = (ano: number) => desemprego.points.find((p) => p.year === ano)!;

describe('desemprego — o valor da tabela, nao o da divulgacao antiga', () => {
  it('2017 e 12,6%, o valor da serie revisada', () => {
    expect(ponto(2017).value).toBe(12.6);
  });

  it('o pico da serie e 2021, e nenhum outro ano se diz pico', () => {
    const maior = [...desemprego.points].sort((a, b) => b.value - a.value)[0]!;
    expect(maior.year).toBe(2021);
    expect(maior.value).toBe(14.0);
  });

  it('nenhum arquivo publica mais o 12,7% de 2017', () => {
    const tudo = JSON.stringify(contrasts) + JSON.stringify(governments) + JSON.stringify(social);
    expect(tudo).not.toContain('12,7%');
  });

  it('o texto do Temer diz "ate entao", e nao "a maior da serie"', () => {
    const temer = governments.governments.find((g) => g.key === 'temer')!;
    const desemp = temer.outcomes.find((o) => o.label === 'Desemprego')!;
    expect(desemp.value).toContain('12,6%');
    expect(desemp.value).toContain('até então');
    expect(desemp.value).toContain('2021');
  });

  it('o salto de Dilma usa os valores revisados', () => {
    const recibo = contrasts.contrasts[3]!.receipts[0]!;
    expect(recibo.value).toBe('7,0% → 11,6%');
  });
});

describe('analfabetismo — a serie chega a 1900, com a mesma fonte', () => {
  it('os dois marcos novos vem da mesma tabela do INEP', () => {
    const mil900 = analfabetismo.points.find((p) => p.year === 1900)!;
    const mil920 = analfabetismo.points.find((p) => p.year === 1920)!;
    expect(mil900.value).toBe(65.3);
    expect(mil920.value).toBe(65.0);
    expect(mil900.url).toBe(analfabetismo.points.find((p) => p.year === 1940)!.url);
  });

  it('a serie so desce depois de 1920, e comeca no pior ponto', () => {
    const anos = analfabetismo.points.map((p) => p.year);
    expect(anos[0]).toBe(1900);
    expect([...anos].sort((a, b) => a - b)).toEqual(anos);
    expect(analfabetismo.points[0]!.value).toBe(Math.max(...analfabetismo.points.map((p) => p.value)));
  });

  it('o ponto nao conferido esta declarado como nao conferido', () => {
    const dez = analfabetismo.points.find((p) => p.year === 2010)!;
    expect(dez.source).toContain('não conferido');
  });
});

/**
 * `finding` é paráfrase; entre aspas só entra `quote`, lido no documento. O
 * Ipea foi lido (Considerações Finais do boletim); o Banco Mundial recusa robô.
 */
describe('veredito — aspas so onde o documento foi lido', () => {
  const verdict = federative.verdict as Array<{
    key: string; quote?: string; finding: string; unverified?: boolean; source: string;
  }>;

  it('o Ipea tem a frase literal, e ela cita os preceitos constitucionais', () => {
    const ipea = verdict.find((v) => v.key === 'ipea')!;
    expect(ipea.quote).toContain('não são capazes de equalizar a capacidade fiscal');
    expect(ipea.quote).toContain('preceitos constitucionais');
    expect(ipea.source).toContain('Considerações Finais');
  });

  it('o que nao foi lido no documento esta marcado como nao conferido', () => {
    const bm = verdict.find((v) => v.key === 'worldbank')!;
    expect(bm.quote).toBeUndefined();
    expect(bm.unverified).toBe(true);
  });

  it('a tela so poe aspas quando existe quote', () => {
    const fonte = readFileSync('app/pages/maquina-publica.vue', 'utf-8');
    expect(fonte).toContain('“{{ item.quote }}”');
    expect(fonte).not.toContain('“{{ item.finding }}”');
  });
});

/**
 * A matéria diz "Santa Catarina, que recebeu somente R$ 0,13 por real pago":
 * R$ 13, o terceiro pior retorno do país. Paraná e Rio Grande do Sul só
 * existem no infográfico, que não é alcançável, e por isso não entram.
 */
describe('retorno federativo — so o que a materia afirma no texto', () => {
  const linhas = (federative.returnRatio as {
    narrowRuler: { rows: Array<{ uf: string; value: string }>; scope?: string };
  }).narrowRuler;

  it('Santa Catarina volta a ser R$ 13, do lado dos que menos recebem', () => {
    const sc = linhas.rows.find((r) => r.uf === 'Santa Catarina') as { value: string; note: string };
    expect(sc.value).toBe('R$ 13');
    expect(sc.note).toContain('terceiro pior retorno');
  });

  it('nenhuma linha publica valor que so existia no infografico', () => {
    const ufs = linhas.rows.map((r) => r.uf);
    expect(ufs).not.toContain('Paraná');
    expect(ufs).not.toContain('Rio Grande do Sul');
  });

  it('as linhas sobem do pior retorno para o melhor', () => {
    const numeros = linhas.rows.map((r) => Number(r.value.replace(/\D/g, '')));
    expect([...numeros].sort((a, b) => a - b)).toEqual(numeros);
  });

  it('o tamanho da conta inteira esta publicado junto', () => {
    expect(linhas.scope).toContain('2,218 trilhões');
    expect(linhas.scope).toContain('607,8 bilhões');
  });
});

/**
 * Os 9% e 28% de São Paulo estão no Observatório de Política Fiscal, com os
 * denominadores (R$ 505 bi de repasse direto, R$ 734 bi de previdência) — não
 * no Blog da Conjuntura Econômica, que é outro artigo.
 */
describe('o numero que explica a discordia — a fonte certa', () => {
  const ratio = federative.returnRatio as {
    keyInsight: { finding: string; source: string; url: string };
    broadRuler: { unverified?: boolean; url: string; rows: Array<{ uf: string; value: string }> };
  };

  it('aponta para o Observatorio, e nao para o blog', () => {
    expect(ratio.keyInsight.url).toContain('observatorio-politica-fiscal');
    expect(ratio.keyInsight.url).toContain('balanco-de-custos-e-beneficios-por-uf');
  });

  it('publica os denominadores, e nao so as porcentagens', () => {
    expect(ratio.keyInsight.finding).toContain('R$ 505 bilhões');
    expect(ratio.keyInsight.finding).toContain('R$ 734 bilhões');
  });

  /**
   * Os três valores são literais do artigo "Federação brasileira em
   * perspectiva: uma análise da contribuição e retorno fiscal..."; o "balanço
   * de custos e benefícios por UF", do mesmo observatório, não traz nenhum.
   */
  it('a regua ampla foi lida, e aponta para o artigo que traz os numeros', () => {
    expect(ratio.broadRuler.unverified).toBeUndefined();
    expect(ratio.broadRuler.url).toContain('uma-analise-da-contribuicao-e-retorno');
    expect(ratio.broadRuler.rows.map((r) => r.value)).toEqual(['+66%', '+19%', 'acima de 3×']);
  });
});

/**
 * A LC 143/2013 deu nova redação ao art. 2º da LC 62/1989: a regra dos
 * 85%/15% valeu até 31/12/2015, não foi "mantida".
 */
describe('FPE — a regra de 1989 e a redacao que a substituiu', () => {
  const fpe = (federative.howItWorks as Array<{ key: string; label: string; source: string }>)
    .find((s) => s.key === 'split')!;

  it('nao diz mais que a LC 143/2013 manteve o texto', () => {
    expect(fpe.source).not.toContain('mantida pela');
    expect(fpe.label).toContain('não manteve esse texto');
  });

  it('publica a data em que a regra original deixou de valer', () => {
    expect(fpe.label).toContain('31 de dezembro de 2015');
    expect(fpe.source).toContain('ADI 5069');
  });
});

/**
 * A divulgação do IBGE responde 403 a robô; a tabela abre. Taxa na SIDRA 4562,
 * subutilizados na 4666 (16.647 mil).
 */
describe('o contraste do emprego aponta para a tabela, nao para a divulgacao', () => {
  const recibos = (contrasts.contrasts[1] as { receipts: Array<{ value: string; url: string }> }).receipts;

  it('a taxa e a contagem citam SIDRA', () => {
    expect(recibos[0]!.url).toContain('sidra.ibge.gov.br/tabela/4562');
    expect(recibos[1]!.url).toContain('sidra.ibge.gov.br/tabela/4666');
  });

  it('a contagem publicada e a que a tabela devolve', () => {
    expect(recibos[1]!.value).toBe('16,6 milhões');
  });
});

/**
 * A Agência de Notícias do IBGE responde 403 a robô. PIB na SIDRA 5932 (−3,5%
 * em 2015, −3,3% em 2016, +1,3% em 2017, +1,8% em 2018 já revisado); IPCA na
 * SIDRA 1737 (10,67% em 2015, 10,06% em 2021).
 */
describe('os dossies citam a tabela do IBGE, nao a divulgacao', () => {
  const saidas = governments.governments.flatMap((g) => g.outcomes);

  it('nenhum PIB ou IPCA aponta mais para a agencia de noticias', () => {
    const economicos = saidas.filter((o) => /^(PIB|Inflação)/.test(o.label));
    expect(economicos.length).toBeGreaterThan(0);
    for (const o of economicos) {
      expect(o.url, `${o.label} ainda cita a agencia`).not.toContain('agenciadenoticias.ibge');
      expect(o.url).toContain('sidra.ibge.gov.br');
    }
  });

  it('o PIB de 2018 continua declarando a revisao', () => {
    const temer = governments.governments.find((g) => g.key === 'temer')!;
    const pib = temer.outcomes.find((o) => o.label === 'PIB')!;
    expect(pib.value).toContain('revisado depois para 1,8%');
  });
});
