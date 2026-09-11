import { describe, expect, it } from 'vitest';
import companiesData from '../app/data/companies.json';
import currencyHistory from '../app/data/currency-history.json';
import econData from '../app/data/economia101.json';
import fallaciesData from '../app/data/fallacies.json';
import federativeData from '../app/data/federative.json';
import historicalData from '../app/data/historical.json';
import journeyData from '../app/data/journey.json';
import literacyData from '../app/data/literacy.json';
import payroll from '../app/data/payroll-2026.json';
import promisesData from '../app/data/promises.json';
import taxData from '../app/data/tax-data.json';
import worldData from '../app/data/world.json';
import { secoesCompletas, secoesCompletasDe, type SecaoCompleta, type Texto } from '../app/utils/secoesCompletas';
import { partesDoNumero } from '../app/utils/portas';
import en from '../i18n/locales/en.json';
import ptBR from '../i18n/locales/pt-BR.json';

/**
 * Nada nas seções da home é digitado: todo valor vem do JSON da própria página,
 * e onde uma parte não existe o descritor a omite. A Metodologia é apêndice e
 * fica fora do mapa.
 */
const PAGINAS_COM_SECOES = [
  'journey', 'calculator', 'timeMachine', 'inflation', 'fallacies', 'economics',
  'business', 'publicMachine', 'promises', 'world', 'manifesto',
] as const;

const locales: Record<string, Record<string, unknown>> = { 'pt-BR': ptBR, en };

function valorEmChave(l: Record<string, unknown>, caminho: string): unknown {
  return caminho.split('.').reduce<unknown>((o, p) => (o as never)?.[p], l);
}

function chavesDe(secao: SecaoCompleta): string[] {
  const textos: (Texto | undefined)[] = [
    secao.subtema,
    ...(secao.conclusao ?? []),
    ...(secao.numeros ?? []).flatMap((n) => [n.legenda, ...(n.notas ?? [])]),
  ];
  return textos.filter((t): t is Texto => t !== undefined && 'chave' in t).map((t) => t.chave);
}

/**
 * `expect(x.valor).toBe(json.campo)` passa verde com os dois lados `undefined`
 * se o campo for renomeado. Esta função não tem esse ponto cego.
 */
function existeETipo(valor: unknown, tipo: 'number' | 'string', contexto: string): void {
  expect(valor !== undefined && valor !== null, `${contexto}: valor ausente`).toBe(true);
  expect(typeof valor, `${contexto}: esperava ${tipo}, veio ${typeof valor}`).toBe(tipo);
  if (tipo === 'number') {
    expect(Number.isNaN(valor as number), `${contexto}: valor e NaN`).toBe(false);
  } else {
    expect((valor as string).length > 0, `${contexto}: string vazia`).toBe(true);
  }
}

describe('secoesCompletas — bloco de números, subtema, conclusão e fontes', () => {
  it('toda pagina com denuncia tem um descritor', () => {
    for (const chave of PAGINAS_COM_SECOES) {
      expect(secoesCompletas[chave], `falta o descritor de "${chave}"`).toBeDefined();
    }
  });

  it('toda secao que publica numero tem fonte com URL https:// para ele', () => {
    for (const [chave, secao] of Object.entries(secoesCompletas)) {
      for (const numero of secao?.numeros ?? []) {
        expect(
          numero.fonte.url.startsWith('https://'),
          `${chave}: o numero de origem "${numero.origem}" tem uma fonte sem URL https:// (${numero.fonte.url})`,
        ).toBe(true);
      }
    }
  });

  it('toda chave de i18n usada existe nos dois idiomas', () => {
    for (const [pagina, secao] of Object.entries(secoesCompletas)) {
      if (!secao) continue;
      for (const caminho of chavesDe(secao)) {
        for (const [nome, locale] of Object.entries(locales)) {
          const valor = valorEmChave(locale, caminho);
          expect(
            typeof valor === 'string' && valor.length > 0,
            `${nome}: a chave "${caminho}", usada na secao de "${pagina}", nao existe`,
          ).toBe(true);
        }
      }
    }
  });

  it('a metodologia nao recebe denuncia — as quatro partes ficam de fora', () => {
    expect(secoesCompletas.methodology).toEqual({});
  });

  it('uma secao sem uma das partes nao quebra: journey nao tem "notas" no segundo numero, e o descritor omite', () => {
    const [, segundo] = secoesCompletas.journey!.numeros!;
    expect(segundo!.legenda).toBeUndefined();
    expect(segundo!.notas).toBeUndefined();
  });

  it('world: o nome do adversario nao vem cravado na conclusao — fica em paisIso pra quem renderiza resolver', () => {
    const [duelo] = secoesCompletas.world!.conclusao!;
    expect(duelo).toHaveProperty('paisIso');
    if (!('paisIso' in duelo)) throw new Error('conclusao[0] do world deveria ter paisIso');
    const suica = worldData.paises.find((p) => p.iso === 'CHE')!;
    expect(duelo.paisIso).toBe(suica.iso);
    expect(duelo.valores).not.toHaveProperty('pais');
  });
});

const naRegua = (valor: number) => valor.toLocaleString('pt-BR');
const emPct = (valor: number) => `${naRegua(valor)}%`;

describe('secoesCompletas — cada valor vem do JSON da propria pagina', () => {
  it('journey', () => {
    const [numTax, numRenda, numClt] = secoesCompletas.journey!.numeros!;
    expect(numTax!.valor).toBe(naRegua(journeyData.taxCount));
    existeETipo(numTax!.valor, 'string', 'journey.taxCount');
    expect(numRenda!.valor).toBe(emPct(journeyData.incomeBurdenPct));
    existeETipo(numRenda!.valor, 'string', 'journey.incomeBurdenPct');
    const ghost = journeyData.steps.find((s) => s.key === 'ghost')!;
    const custoClt = ghost.taxes.find((t) => t.name === 'custo total de um CLT')!;
    expect(numClt!.valor).toBe(custoClt.rate);
    expect(numClt!.fonte.url).toBe(custoClt.url);
    existeETipo(numClt!.valor, 'string', 'journey.custoClt.rate');
  });

  it('calculator', () => {
    const [numInss, numIsencao, numConsumo] = secoesCompletas.calculator!.numeros!;
    expect(numInss!.valor).toContain(payroll.tables.inss.ceiling.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    expect(numInss!.fonte).toEqual(payroll.sources[0]);
    existeETipo(numInss!.valor, 'string', 'calculator.inssTeto');
    expect(numIsencao!.valor).toContain('5.000');
    expect(numIsencao!.fonte).toEqual(payroll.sources[2]);
    existeETipo(numIsencao!.valor, 'string', 'calculator.limiteIsencao');
    expect(numConsumo!.valor).toBe(emPct(taxData.consumption.averageEmbeddedPct));
    existeETipo(numConsumo!.valor, 'string', 'calculator.averageEmbeddedPct');
  });

  it('timeMachine', () => {
    const [numCarga, numRenda] = secoesCompletas.timeMachine!.numeros!;
    expect(numCarga!.valor).toBe(emPct(taxData.taxBurden.pctGdp));
    existeETipo(numCarga!.valor, 'string', 'timeMachine.taxBurden.pctGdp');
    expect(numRenda!.valor).toBe(emPct(taxData.workDays.incomeSharePct));
    existeETipo(numRenda!.valor, 'string', 'timeMachine.workDays.incomeSharePct');
    expect(secoesCompletas.timeMachine!.conclusao![0]).toEqual({ chave: 'timeMachine.tiradentesConclusion' });
    expect(ptBR.timeMachine.tiradentesConclusion).toBe(historicalData.tiradentes.finding);
  });

  it('inflation', () => {
    const [numZeros, numTrocas, numHiper] = secoesCompletas.inflation!.numeros!;
    expect(numZeros!.valor).toBe(naRegua(currencyHistory.totalZeros));
    existeETipo(numZeros!.valor, 'string', 'inflation.totalZeros');
    expect(numTrocas!.valor).toBe(naRegua(currencyHistory.changes.filter((c) => c.zeros > 0).length));
    existeETipo(numTrocas!.valor, 'string', 'inflation.trocasComCorte');
    expect(numHiper!.valor).toBe(currencyHistory.hyperinflation.accumulated1980to1994);
    existeETipo(numHiper!.valor, 'string', 'inflation.accumulated1980to1994');
  });

  it('economics — cigarros vira dois numeros CURTOS (partesDoNumero), o titulo (prosa) vira nota do primeiro', () => {
    const cigarros = econData.brazilCases.find((c) => c.key === 'cigarros')!;
    const [numA, numB] = secoesCompletas.economics!.numeros!;
    expect(secoesCompletas.economics!.numeros!).toHaveLength(2);
    const partes = cigarros.numbers.split(';').map((s) => s.trim());
    const ilegais = partesDoNumero(partes[0]!);
    const sonegados = partesDoNumero(partes[1]!);
    expect(numA!.valor).toBe(ilegais.numero);
    existeETipo(numA!.valor, 'string', 'economics.cigarrosIlegais');
    expect((numA!.valor as string).length, 'economics.cigarrosIlegais: valor nao ficou curto').toBeLessThan(20);
    expect(numA!.legenda).toEqual({ chave: 'econ101.cigarrosIlegaisLegend' });
    expect(numA!.notas).toEqual([{ literal: cigarros.title }]);
    expect(numB!.valor).toBe(sonegados.numero);
    existeETipo(numB!.valor, 'string', 'economics.cigarrosSonegados');
    expect((numB!.valor as string).length, 'economics.cigarrosSonegados: valor nao ficou curto').toBeLessThan(20);
    expect(numB!.legenda).toEqual({ chave: 'econ101.cigarrosSonegadosLegend' });
  });

  it('business', () => {
    const assai = companiesData.companies.find((c) => c.key === 'assai')!;
    const [numRevenue, numProfit, numMargin] = secoesCompletas.business!.numeros!;
    expect(numRevenue!.valor).toBe(assai.revenueLabel);
    existeETipo(numRevenue!.valor, 'string', 'business.revenueLabel');
    expect(numProfit!.valor).toBe(assai.profitLabel);
    existeETipo(numProfit!.valor, 'string', 'business.profitLabel');
    expect(numMargin!.valor).toBe(emPct(assai.netMarginPct));
    existeETipo(numMargin!.valor, 'string', 'business.netMarginPct');
  });

  it('publicMachine', () => {
    const esgoto = federativeData.sanitationExtremes.worst.find((e) => e.uf === 'Piauí')!;
    const [numIdh2000, numIdh2020, numEsgoto] = secoesCompletas.publicMachine!.numeros!;
    existeETipo(numIdh2000!.valor, 'string', 'publicMachine.idh2000');
    existeETipo(numIdh2020!.valor, 'string', 'publicMachine.idh2020');
    expect(numEsgoto!.valor).toBe(emPct(esgoto.pct));
    existeETipo(numEsgoto!.valor, 'string', 'publicMachine.esgotoPiaui');
    const ipea = federativeData.verdict.find((v) => v.key === 'ipea')!;
    expect(secoesCompletas.publicMachine!.conclusao![0]).toEqual({
      chave: 'federative.ipeaConclusion',
      atribuicao: ipea.institution,
    });
    expect(ptBR.federative.ipeaConclusion).toBe(ipea.finding);
  });

  it('promises — o paragrafo juridico vira nota, os dois numeros que sobram sao collected.months e .amount', () => {
    const cpmf = promisesData.cases.find((c) => c.id === 'cpmf')!;
    const [numMonths, numAmount] = secoesCompletas.promises!.numeros!;
    expect(secoesCompletas.promises!.numeros!).toHaveLength(2);
    expect(numMonths!.valor).toBe(naRegua(cpmf.collected.months));
    existeETipo(numMonths!.valor, 'string', 'promises.collected.months');
    expect(numMonths!.notas).toEqual([{ literal: cpmf.promise.deadlineText, atribuicao: cpmf.promise.deadlineArticle }]);
    expect(numAmount!.valor).toBe(cpmf.collected.amount);
    existeETipo(numAmount!.valor, 'string', 'promises.collected.amount');
    expect(secoesCompletas.promises!.conclusao![0]).toEqual({ chave: 'promises.cpmfConclusion' });
  });

  it('world', () => {
    const paises = worldData.paises;
    const brasil = paises.find((p) => p.iso === 'BRA')!;
    const suica = paises.find((p) => p.iso === 'CHE')!;
    const [numBra, numChe, numVida] = secoesCompletas.world!.numeros!;
    expect(numBra!.valor).toBe(emPct(brasil.carga));
    existeETipo(numBra!.valor, 'string', 'world.brasil.carga');
    expect(numChe!.valor).toBe(emPct(suica.carga));
    existeETipo(numChe!.valor, 'string', 'world.suica.carga');
    existeETipo(numVida!.valor, 'string', 'world.anosAMais');
  });

  it('manifesto', () => {
    const [numAnalfabetos, numProficientes, numPiora] = secoesCompletas.manifesto!.numeros!;
    expect(numAnalfabetos!.valor).toBe(emPct(literacyData.functionalIlliteratePct));
    existeETipo(numAnalfabetos!.valor, 'string', 'manifesto.functionalIlliteratePct');
    expect(numProficientes!.valor).toBe(emPct(literacyData.proficientPct));
    existeETipo(numProficientes!.valor, 'string', 'manifesto.proficientPct');
    existeETipo(numPiora!.valor, 'string', 'manifesto.youthWorsened');
  });

  it('fallacies — o caso do Twitter, migrado de HungerFallacy.vue: 3 numeros, o primeiro com duas notas', () => {
    const fome = fallaciesData.hunger44;
    const revenue2025 = taxData.revenueSeries.at(-1)!;
    const [numTwitter, numRevenue, numRatio] = secoesCompletas.fallacies!.numeros!;
    expect(secoesCompletas.fallacies!.numeros!).toHaveLength(3);
    expect(numTwitter!.valor).toBe(`R$ ${fome.twitterBrlBillions} bi`);
    expect(numTwitter!.notas).toHaveLength(2);
    expect(numRevenue!.valor).toContain('tri');
    existeETipo(numRatio!.valor, 'string', 'fallacies.twittersPerYear');
    expect((numRatio!.valor as string)).toContain('×');
    expect(secoesCompletas.fallacies!.subtema).toEqual({ chave: 'hungerFallacy.pictoTitle', valores: { days: expect.any(Number) } });
    // A razao e os dias (101x, 4 dias) sao travados em tests/falaciaFome.spec.ts;
    // aqui so se confere a fonte.
    expect(secoesCompletas.fallacies!.conclusao).toHaveLength(4);
    expect(secoesCompletas.fallacies!.fontes!.length).toBeGreaterThanOrEqual(fome.sources.length);
    expect(revenue2025.totalBillions).toBeGreaterThan(3000);
  });
});

describe('secoesCompletas — texto que virou i18n na unificacao continua o MESMO texto (so vertido)', () => {
  const cigarros = econData.brazilCases.find((c) => c.key === 'cigarros')!;
  const [cigarrosIlegais, cigarrosSonegados] = cigarros.numbers.split(';').map((s) => s.trim());
  const ilegais = partesDoNumero(cigarrosIlegais!);
  const sonegados = partesDoNumero(cigarrosSonegados!);
  const assai = companiesData.companies.find((c) => c.key === 'assai')!;
  const piauiCase = federativeData.piauiCase;
  const cpmf = promisesData.cases.find((c) => c.id === 'cpmf')!;
  const ghost = journeyData.steps.find((s) => s.key === 'ghost')!;
  const custoClt = ghost.taxes.find((t) => t.name === 'custo total de um CLT')!;

  const PARES: [string, string][] = [
    ['journey.custoCltLabel', custoClt.name],
    ['calculator.consumptionLegend', taxData.consumption.description],
    ['timeMachine.taxBurdenLegend', taxData.taxBurden.description],
    ['timeMachine.workDaysLegend', taxData.workDays.description],
    ['inflationPage.equivalenceLegend', currencyHistory.equivalenceLabel],
    ['econ101.cigarrosIlegaisLegend', ilegais.legenda],
    ['econ101.cigarrosSonegadosLegend', sonegados.legenda],
    ['business.assaiMarginLegend', assai.note],
    ['federative.piauiTitle', piauiCase.title],
    ['federative.sanitationMetricLegend', federativeData.sanitationExtremes.metric],
    ['promises.collectedPeriodLabel', cpmf.collected.period],
    ['promises.collectedNoteLegend', cpmf.collected.note],
    ['promises.cpmfConclusion', cpmf.question],
  ];

  it('pt-BR: a chave nova tem exatamente o texto que a fonte publica', () => {
    for (const [caminho, original] of PARES) {
      const valor = caminho.split('.').reduce<unknown>((o, p) => (o as never)?.[p], ptBR as unknown);
      expect(valor, `pt-BR.${caminho} deveria ser igual a fonte original`).toBe(original);
    }
  });

  it('en: a chave existe e nao ficou em portugues', () => {
    for (const [caminho, original] of PARES) {
      const valor = caminho.split('.').reduce<unknown>((o, p) => (o as never)?.[p], en as unknown);
      expect(typeof valor === 'string' && valor.length > 0, `en.${caminho} nao existe`).toBe(true);
      expect(valor, `en.${caminho} ainda esta identico ao portugues — falta traduzir`).not.toBe(original);
    }
  });

  it('world.lifeDuelLegend existe nos dois idiomas com os tres placeholders', () => {
    for (const [nome, locale] of Object.entries({ 'pt-BR': ptBR, en } as Record<string, { world: { lifeDuelLegend: string } }>)) {
      const frase = locale.world.lifeDuelLegend;
      expect(frase, `${nome}.world.lifeDuelLegend`).toContain('{anosA}');
      expect(frase, `${nome}.world.lifeDuelLegend`).toContain('{anosB}');
      expect(frase, `${nome}.world.lifeDuelLegend`).toContain('{pais}');
    }
  });
});

/**
 * `valor` aceita `number`, e um número que vira texto sozinho sai com o
 * separador do JavaScript e sem unidade ("40.82", "29" onde é 29%). Por isso
 * a varredura é de todos os cartões, nos dois idiomas.
 */
describe('secoesCompletas — todo numero de cartao sai na régua do idioma', () => {
  const cartoes = (idioma: string) =>
    Object.entries(secoesCompletasDe(idioma))
      .flatMap(([chave, secao]) =>
        (secao?.numeros ?? []).map((n) => ({ chave, origem: n.origem, valor: n.valor })));

  it.each(['pt-BR', 'en'])('%s: nenhum valor chega ao cartao como number', (idioma) => {
    const crus = cartoes(idioma).filter((c) => typeof c.valor !== 'string');
    expect(crus.map((c) => `${c.chave}: ${c.origem}`)).toEqual([]);
  });

  it('pt-BR: nenhum decimal sai com ponto no lugar da virgula', () => {
    // `1.172.286` é separador de milhar e passa; `40.82` e `23.3%` não.
    const comPonto = cartoes('pt-BR').filter((c) => /\d\.\d{1,2}(?!\d)/.test(String(c.valor)));
    expect(comPonto.map((c) => `${c.chave}: ${c.valor}`)).toEqual([]);
  });

  /**
   * Só os cartões que este módulo formata. Os que saem verbatim do JSON de dado
   * ficam na régua portuguesa também em `/en/`: `secoesCompletas.ts` lê o JSON
   * em português direto, e o cartão do IDH do Piauí é ancorado nessa prosa.
   */
  it('en: o que o modulo formata sai com ponto decimal, nunca com virgula', () => {
    const formatadosAqui = /incomeBurdenPct|averageEmbeddedPct|pctGdp|incomeSharePct|netMarginPct|sanitationExtremes|paises\[|functionalIlliteratePct|proficientPct|indicadores\[vida\]/;
    const comVirgula = cartoes('en')
      .filter((c) => formatadosAqui.test(c.origem))
      .filter((c) => /\d,\d{1,2}(?!\d)/.test(String(c.valor)));
    expect(comVirgula.map((c) => `${c.chave}: ${c.valor}`)).toEqual([]);
  });

  it('os cartoes que a legenda le como porcentagem trazem o % na tela', () => {
    const devemTerPct = [
      ['journey', 'incomeBurdenPct'],
      ['calculator', 'averageEmbeddedPct'],
      ['timeMachine', 'taxBurden.pctGdp'],
      ['timeMachine', 'workDays.incomeSharePct'],
      ['manifesto', 'functionalIlliteratePct'],
      ['manifesto', 'proficientPct'],
    ] as const;
    const todos = cartoes('pt-BR');
    for (const [secao, origem] of devemTerPct) {
      const cartao = todos.find((c) => c.chave === secao && c.origem.includes(origem));
      expect(cartao, `nao achei o cartao ${secao}/${origem}`).toBeDefined();
      expect(String(cartao!.valor), `${secao}/${origem}`).toMatch(/%$/);
    }
  });
});

/**
 * `protegida()` engole o erro para uma seção quebrada não derrubar as outras;
 * o preço é que uma seção pode sumir num idioma sem quebrar teste nenhum.
 */
describe('secoesCompletas — nenhuma secao pode sumir num idioma so', () => {
  it('monta o mesmo conjunto de secoes em pt-BR e em en', () => {
    const definidas = (idioma: string) =>
      Object.entries(secoesCompletasDe(idioma))
        .filter(([, secao]) => secao !== undefined)
        .map(([chave]) => chave)
        .sort();
    expect(definidas('en')).toEqual(definidas('pt-BR'));
  });

  it('e nenhuma delas fica sem numeros por causa do idioma', () => {
    for (const idioma of ['pt-BR', 'en']) {
      for (const [chave, secao] of Object.entries(secoesCompletasDe(idioma))) {
        if (!secao?.numeros) continue;
        for (const numero of secao.numeros) {
          expect(numero.valor, `${idioma}/${chave}: ${numero.origem}`).toBeTruthy();
        }
      }
    }
  });
});

