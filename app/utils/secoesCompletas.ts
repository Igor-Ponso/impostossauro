import companiesDataPt from '~/data/companies.json';
import spendingDataCru from '~/data/spending.json';
import currencyHistoryPt from '~/data/currency-history.json';
import econDataPt from '~/data/economia101.json';
import fallaciesCru from '~/data/fallacies.json';
import federativeDataCru from '~/data/federative.json';
import historicalDataCru from '~/data/historical.json';
import journeyDataPt from '~/data/journey.json';
import literacyDataCru from '~/data/literacy.json';
import payrollCru from '~/data/payroll-2026.json';
import promisesDataPt from '~/data/promises.json';
import taxDataCru from '~/data/tax-data.json';
import whatItBuysCru from '~/data/what-it-buys.json';
import { indicadoresMundo } from '~/utils/indicadoresMundo';
import worldDataCru from '~/data/world.json';
import { calcIrrf, type PayrollTables } from '~/utils/payroll';
import { formatCount } from '~/utils/taxMath';
import { vereditoDe, type PaisMundo } from '~/utils/mundo';
import { dadoNaMoeda, dadoNoIdioma } from '~/utils/dadoNoIdioma';
import { contextoDaMoeda, naMoedaEscolhida } from '~/utils/estadoDaMoeda';
import { partesDoNumero } from '~/utils/portas';

/** Todo dado desta página passa pelo funil da moeda, como nos componentes. */
const spendingData = dadoNaMoeda('spending.json', spendingDataCru);
const fallacies = dadoNaMoeda('fallacies.json', fallaciesCru);
const federativeData = dadoNaMoeda('federative.json', federativeDataCru);
const historicalData = dadoNaMoeda('historical.json', historicalDataCru);
const literacyData = dadoNaMoeda('literacy.json', literacyDataCru);
const payroll = dadoNaMoeda('payroll-2026.json', payrollCru);
const taxData = dadoNaMoeda('tax-data.json', taxDataCru);
const whatItBuys = dadoNaMoeda('what-it-buys.json', whatItBuysCru);
const worldData = dadoNaMoeda('world.json', worldDataCru);

/**
 * Bloco de números, subtema, conclusão e fontes de cada seção da home; trilho,
 * kicker, título e parágrafo vêm de `intros.ts`. Todo `valor` é lido do JSON da
 * própria página, nunca digitado, e `origem` documenta o caminho. `chave` aponta
 * para texto que já existe no i18n nos dois idiomas; `literal` só para citação
 * de documento primário. Cada seção passa por `protegida()`: se uma lançar, só
 * ela some do mapa.
 */

export interface Fonte {
  label: string;
  url: string;
}

export type Texto =
  | {
    chave: string;
    valores?: Record<string, string | number>;
    /** ISO do país cujo nome falta em `valores.pais`: quem renderiza resolve no
     *  idioma da rota antes de chamar `t()`. */
    paisIso?: string;
    /** Nome próprio ou artigo de lei: o mesmo nos dois idiomas, por isso sem `chave`. */
    atribuicao?: string;
  }
  | { literal: string; atribuicao?: string };

export interface NumeroDaSecao {
  valor: string | number;
  origem: string;
  legenda?: Texto;
  notas?: Texto[];
  fonte: Fonte;
}

export interface SecaoCompleta {
  numeros?: NumeroDaSecao[];
  subtema?: Texto;
  conclusao?: Texto[];
  fontes?: Fonte[];
}

function protegida(nome: string, montar: () => SecaoCompleta): SecaoCompleta | undefined {
  try {
    return montar();
  } catch (erro) {
    console.error(`secoesCompletas: a secao "${nome}" falhou ao montar e ficou de fora do mapa.`, erro);
    return undefined;
  }
}

/** Nunca `${n}` direto: o template literal escreve "40.82" em qualquer idioma. */
function numero(valor: number, idioma: string, opcoes: Intl.NumberFormatOptions = {}): string {
  return valor.toLocaleString(idioma, opcoes);
}

function abreviacao(escala: 'bi' | 'tri', idioma: string): string {
  const ingles = { bi: 'bn', tri: 'tn' };
  return idioma.startsWith('en') ? ingles[escala] : escala;
}

function porcento(valor: number, idioma: string): string {
  return `${numero(valor, idioma)}%`;
}

/**
 * `federative.json` é lido em português de propósito: o IDH do Piauí sai da prosa
 * por âncora textual (`idhAncorado`), e ler o inglês derrubaria `publicMachine`
 * em silêncio na rota `/en/`. Quem trocar isso troca a âncora primeiro.
 */
function montarJourney(idioma: string): SecaoCompleta {
  const journeyData = dadoNoIdioma('journey.json', journeyDataPt, idioma);
  const ghostStep = journeyData.steps.find((s) => s.key === 'ghost')!;
  // `name` é traduzido e não serve de chave de busca: o índice sai do dado em
  // português e a leitura, do dado no idioma.
  const ghostPt = journeyDataPt.steps.find((s) => s.key === 'ghost')!;
  const indiceClt = ghostPt.taxes.findIndex((t) => t.name === 'custo total de um CLT');
  if (indiceClt < 0) throw new Error('journey.json: nao achei a linha "custo total de um CLT"');
  const custoClt = ghostStep.taxes[indiceClt]!;

  return {
    numeros: [
      {
        valor: numero(journeyData.taxCount, idioma),
        origem: 'journey.json taxCount',
        legenda: { chave: 'journey.taxCountLine', valores: { count: journeyData.taxCount } },
        fonte: { label: journeyData.taxCountSource.source, url: journeyData.taxCountSource.url },
      },
      {
        valor: porcento(journeyData.incomeBurdenPct, idioma),
        origem: 'journey.json incomeBurdenPct',
        fonte: { label: journeyData.incomeBurdenSource.source, url: journeyData.incomeBurdenSource.url },
      },
      {
        valor: custoClt.rate,
        origem: 'journey.json steps[ghost].taxes[custo total de um CLT]',
        legenda: { chave: 'journey.custoCltLabel' },
        fonte: { label: custoClt.name, url: custoClt.url },
      },
    ],
    subtema: { chave: 'journey.tldr' },
    conclusao: [
      { chave: 'journey.verdict.title', valores: { pct: journeyData.incomeBurdenPct } },
      { chave: 'journey.verdict.body' },
      { chave: 'journey.finale' },
    ],
    fontes: [
      { label: journeyData.taxCountSource.source, url: journeyData.taxCountSource.url },
      { label: journeyData.incomeBurdenSource.source, url: journeyData.incomeBurdenSource.url },
      { label: custoClt.name, url: custoClt.url },
    ],
  };
}

function limiteIsencaoIrrf(t: PayrollTables): number {
  let baixo = 0;
  let alto = 20000;
  for (let i = 0; i < 40; i += 1) {
    const meio = (baixo + alto) / 2;
    if (calcIrrf(meio, 0, t) <= 0) baixo = meio; else alto = meio;
  }
  return Math.round(baixo);
}

function montarCalculator(idioma: string): SecaoCompleta {
  const tables = payroll.tables as PayrollTables;
  const inssTeto = tables.inss.ceiling;
  const inssMaiorAliquota = tables.inss.brackets.at(-1)!.ratePct;

  return {
    numeros: [
      {
        valor: naMoedaEscolhida(`R$ ${inssTeto.toLocaleString(idioma, { minimumFractionDigits: 2 })}`) + ` · ${inssMaiorAliquota}%`,
        origem: 'payroll-2026.json tables.inss.ceiling + brackets[3].ratePct',
        fonte: payroll.sources[0]!,
      },
      {
        valor: naMoedaEscolhida(`R$ ${limiteIsencaoIrrf(tables).toLocaleString(idioma)}`),
        origem: 'payroll-2026.json tables.irrf.lowIncomeReduction (limite calculado)',
        fonte: payroll.sources[2]!,
      },
      {
        valor: porcento(taxData.consumption.averageEmbeddedPct, idioma),
        origem: 'tax-data.json consumption.averageEmbeddedPct',
        legenda: { chave: 'calculator.consumptionLegend' },
        fonte: { label: taxData.consumption.source, url: taxData.consumption.url },
      },
    ],
    subtema: { chave: 'calculator.tldr' },
    conclusao: [{ chave: 'calculator.icebergPunch' }],
    fontes: [
      payroll.sources[0]!,
      payroll.sources[2]!,
      { label: taxData.consumption.source, url: taxData.consumption.url },
    ],
  };
}

function montarTimeMachine(idioma: string): SecaoCompleta {
  const tiradentes = historicalData.tiradentes;

  return {
    numeros: [
      {
        valor: porcento(taxData.taxBurden.pctGdp, idioma),
        origem: 'tax-data.json taxBurden.pctGdp',
        legenda: { chave: 'timeMachine.taxBurdenLegend' },
        fonte: { label: taxData.taxBurden.source, url: taxData.taxBurden.url },
      },
      {
        valor: porcento(taxData.workDays.incomeSharePct, idioma),
        origem: 'tax-data.json workDays.incomeSharePct',
        legenda: { chave: 'timeMachine.workDaysLegend' },
        fonte: { label: taxData.workDays.source, url: taxData.workDays.url },
      },
    ],
    subtema: { chave: 'signature.timeMachine' },
    conclusao: [{ chave: 'timeMachine.tiradentesConclusion' }],
    fontes: [
      { label: taxData.taxBurden.source, url: taxData.taxBurden.url },
      { label: taxData.workDays.source, url: taxData.workDays.url },
      { label: tiradentes.source, url: tiradentes.url },
    ],
  };
}

// "6 trocas" conta só as que cortaram zero: a de 1990 só renomeou a moeda (`zeros: 0`).
function montarInflation(idioma: string): SecaoCompleta {
  const currencyHistory = dadoNoIdioma('currency-history.json', currencyHistoryPt, idioma);
  const trocasComCorte = currencyHistory.changes.filter((c) => c.zeros > 0).length;

  return {
    numeros: [
      {
        valor: numero(currencyHistory.totalZeros, idioma),
        origem: 'currency-history.json totalZeros',
        legenda: { chave: 'inflationPage.equivalenceLegend' },
        fonte: { label: currencyHistory.changesSource.source, url: currencyHistory.changesSource.url },
      },
      {
        valor: numero(trocasComCorte, idioma),
        origem: 'currency-history.json changes (filtro zeros > 0)',
        fonte: { label: currencyHistory.changesSource.source, url: currencyHistory.changesSource.url },
      },
      {
        valor: currencyHistory.hyperinflation.accumulated1980to1994,
        origem: 'currency-history.json hyperinflation.accumulated1980to1994',
        legenda: { chave: 'inflationPage.hyper.accumulatedLabel' },
        fonte: {
          label: currencyHistory.hyperinflation.accumulatedSource.source,
          url: currencyHistory.hyperinflation.accumulatedSource.url,
        },
      },
    ],
    subtema: { chave: 'inflationPage.tldr' },
    conclusao: [
      { chave: 'inflationPage.currencies.punch', valores: { zeros: currencyHistory.totalZeros } },
      { chave: 'signature.inflation' },
    ],
    fontes: [
      { label: currencyHistory.changesSource.source, url: currencyHistory.changesSource.url },
      {
        label: currencyHistory.hyperinflation.accumulatedSource.source,
        url: currencyHistory.hyperinflation.accumulatedSource.url,
      },
    ],
  };
}

// `numbers` vem como duas frases separadas por ";"; `partesDoNumero` corta o número da legenda.
function montarEconomics(idioma: string): SecaoCompleta {
  const econData = dadoNoIdioma('economia101.json', econDataPt, idioma);
  const cigarros = econData.brazilCases.find((c) => c.key === 'cigarros')!;
  const [cigarrosIlegais, cigarrosSonegados] = cigarros.numbers.split(';').map((s) => s.trim());
  const ilegais = partesDoNumero(cigarrosIlegais!);
  const sonegados = partesDoNumero(cigarrosSonegados!);

  return {
    numeros: [
      {
        valor: ilegais.numero,
        origem: 'economia101.json brazilCases[cigarros].numbers (1ª parte, cortada por partesDoNumero)',
        legenda: { chave: 'econ101.cigarrosIlegaisLegend' },
        notas: [{ literal: cigarros.title }],
        fonte: { label: cigarros.source, url: cigarros.url },
      },
      {
        valor: sonegados.numero,
        origem: 'economia101.json brazilCases[cigarros].numbers (2ª parte, cortada por partesDoNumero)',
        legenda: { chave: 'econ101.cigarrosSonegadosLegend' },
        fonte: { label: cigarros.source, url: cigarros.url },
      },
    ],
    subtema: { chave: 'econ101.tldr' },
    conclusao: [{ chave: 'econ101.cigarrosPunch' }],
    fontes: [{ label: cigarros.source, url: cigarros.url }],
  };
}

function montarBusiness(idioma: string): SecaoCompleta {
  const companiesData = dadoNoIdioma('companies.json', companiesDataPt, idioma);
  const assai = companiesData.companies.find((c) => c.key === 'assai')!;

  return {
    numeros: [
      {
        valor: assai.revenueLabel,
        origem: 'companies.json companies[assai].revenueLabel',
        legenda: { chave: 'business.assaiRevenueLegend' },
        fonte: { label: assai.source, url: assai.url },
      },
      {
        valor: assai.profitLabel,
        origem: 'companies.json companies[assai].profitLabel',
        legenda: { chave: 'business.assaiProfitLegend' },
        fonte: { label: assai.source, url: assai.url },
      },
      {
        valor: porcento(assai.netMarginPct, idioma),
        origem: 'companies.json companies[assai].netMarginPct',
        legenda: { chave: 'business.assaiMarginLegend' },
        fonte: { label: assai.source, url: assai.url },
      },
    ],
    subtema: { chave: 'business.tldr' },
    conclusao: [{ chave: 'business.stats.punch' }],
    fontes: [{ label: assai.source, url: assai.url }],
  };
}

// O IDH de 2000 e 2020 só existe na prosa de `piauiCase.finding`: a extração é
// presa às âncoras "em 2000"/"em 2020" e lança se o texto mudar de forma.
function idhAncorado(texto: string, ano: number): number {
  const casado = texto.match(new RegExp(`(\\d[,.]\\d+) em ${ano}`));
  if (!casado) throw new Error(`secoesCompletas: nao encontrei o IDH de ${ano} em piauiCase.finding`);
  return Number(casado[1]!.replace(',', '.'));
}

function montarPublicMachine(idioma: string): SecaoCompleta {
  const piauiCase = federativeData.piauiCase;
  const idh2000 = idhAncorado(piauiCase.finding, 2000);
  const idh2020 = idhAncorado(piauiCase.finding, 2020);
  const esgotoPiaui = federativeData.sanitationExtremes.worst.find((e) => e.uf === 'Piauí')!;
  const ipea = federativeData.verdict.find((v) => v.key === 'ipea')!;

  return {
    numeros: [
      {
        valor: idh2000.toLocaleString(idioma, { minimumFractionDigits: 3 }),
        origem: 'federative.json piauiCase.finding (IDH 2000, ancorado no texto)',
        legenda: { chave: 'federative.piauiTitle' },
        fonte: { label: piauiCase.source, url: piauiCase.url },
      },
      {
        valor: idh2020.toLocaleString(idioma, { minimumFractionDigits: 3 }),
        origem: 'federative.json piauiCase.finding (IDH 2020, ancorado no texto)',
        legenda: { chave: 'federative.piauiTitle' },
        fonte: { label: piauiCase.source, url: piauiCase.url },
      },
      {
        valor: porcento(esgotoPiaui.pct, idioma),
        origem: 'federative.json sanitationExtremes.worst[Piauí].pct',
        legenda: { chave: 'federative.sanitationMetricLegend' },
        fonte: { label: federativeData.sanitationExtremes.source, url: federativeData.sanitationExtremes.url },
      },
    ],
    subtema: { chave: 'federative.tldr' },
    conclusao: [{ chave: 'federative.ipeaConclusion', atribuicao: ipea.institution }],
    fontes: [
      { label: piauiCase.source, url: piauiCase.url },
      { label: federativeData.sanitationExtremes.source, url: federativeData.sanitationExtremes.url },
      { label: ipea.source, url: ipea.url },
    ],
  };
}

function montarPromises(idioma: string): SecaoCompleta {
  const promisesData = dadoNoIdioma('promises.json', promisesDataPt, idioma);
  const cpmf = promisesData.cases.find((c) => c.id === 'cpmf')!;

  return {
    numeros: [
      {
        valor: numero(cpmf.collected.months!, idioma),
        origem: 'promises.json cases[cpmf].collected.months',
        legenda: { chave: 'promises.collectedPeriodLabel' },
        notas: [{ literal: cpmf.promise.deadlineText!, atribuicao: cpmf.promise.deadlineArticle }],
        fonte: { label: cpmf.collected.source, url: cpmf.collected.url },
      },
      {
        valor: cpmf.collected.amount,
        origem: 'promises.json cases[cpmf].collected.amount',
        legenda: { chave: 'promises.collectedNoteLegend' },
        notas: [{ literal: cpmf.collected.lastYear }],
        fonte: { label: cpmf.collected.source, url: cpmf.collected.url },
      },
    ],
    subtema: { chave: 'promises.tldr' },
    conclusao: [{ chave: 'promises.cpmfConclusion' }],
    fontes: [
      { label: cpmf.promise.source, url: cpmf.promise.url },
      { label: cpmf.collected.source, url: cpmf.collected.url },
    ],
  };
}

function montarWorld(idioma: string): SecaoCompleta {
  const paises = worldData.paises as PaisMundo[];
  const indicadores = indicadoresMundo;
  const brasil = paises.find((p) => p.iso === 'BRA')!;
  const suica = paises.find((p) => p.iso === 'CHE')!;
  const vida = indicadores.find((i) => i.id === 'vida')!;
  const veredito = vereditoDe(brasil, suica, vida);
  const vidaBrasil = vida.valores.BRA!;
  const vidaSuica = vida.valores.CHE!;

  return {
    numeros: [
      {
        valor: porcento(brasil.carga, idioma),
        origem: 'world.json paises[BRA].carga',
        legenda: { chave: 'world.irbesCard', valores: { carga: brasil.carga, idh: brasil.idh } },
        fonte: { label: worldData.irbes.fonte, url: worldData.irbes.url },
      },
      {
        valor: porcento(suica.carga, idioma),
        origem: 'world.json paises[CHE].carga',
        legenda: { chave: 'world.irbesCard', valores: { carga: suica.carga, idh: suica.idh } },
        fonte: { label: worldData.irbes.fonte, url: worldData.irbes.url },
      },
      {
        valor: numero(veredito.anosAMais!, idioma),
        origem: 'world.json indicadores[vida].valores (BRA e CHE)',
        // `world.json` traz mais casas e o renderer não corta; uma casa, como o resto do site.
        legenda: {
          chave: 'world.lifeDuelLegend',
          valores: { anosA: Number(vidaBrasil.toFixed(1)), anosB: Number(vidaSuica.toFixed(1)) },
          paisIso: suica.iso,
        },
        fonte: { label: vida.fonte, url: vida.url },
      },
    ],
    subtema: { chave: 'world.tldr' },
    conclusao: [
      {
        chave: veredito.cobraMenos ? 'signature.worldDuelLess' : 'signature.worldDuelMore',
        valores: { pontos: Math.abs(veredito.difCarga), anos: veredito.anosAMais! },
        paisIso: suica.iso,
      },
      { chave: 'signature.world' },
    ],
    fontes: [
      { label: worldData.irbes.fonte, url: worldData.irbes.url },
      { label: vida.fonte, url: vida.url },
    ],
  };
}

function montarManifesto(idioma: string): SecaoCompleta {
  return {
    numeros: [
      {
        valor: porcento(literacyData.functionalIlliteratePct, idioma),
        origem: 'literacy.json functionalIlliteratePct',
        legenda: { chave: 'manifesto.literacy.stat1' },
        fonte: { label: literacyData.source.source, url: literacyData.source.url },
      },
      {
        valor: porcento(literacyData.proficientPct, idioma),
        origem: 'literacy.json proficientPct',
        legenda: { chave: 'manifesto.literacy.stat2' },
        fonte: { label: literacyData.source.source, url: literacyData.source.url },
      },
      {
        valor: `${literacyData.youthWorsened.from}% (${literacyData.youthWorsened.fromYear}) → `
          + `${literacyData.youthWorsened.to}% (${literacyData.youthWorsened.toYear})`,
        origem: 'literacy.json youthWorsened',
        fonte: { label: literacyData.source.source, url: literacyData.source.url },
      },
    ],
    subtema: { chave: 'manifesto.tldr' },
    conclusao: [{ chave: 'manifesto.literacy.punch' }],
    fontes: [{ label: literacyData.source.source, url: literacyData.source.url }],
  };
}

function montarFallacies(idioma: string): SecaoCompleta {
  const revenue2025 = taxData.revenueSeries.at(-1)!;
  const { hypocrisy } = taxData;
  const fome = fallacies.hunger44;

  // twitterBrlBillions e wfpBrlBillions sao PTAX de out/2022; a arrecadacao e do
  // ano corrente. O IPCA acumulado desde out/2022 corrige os dois antes da conta.
  const anoBaseCambio = 2022;
  // `ipcaSeries` so tem anos fechados: nov-dez/2022 entram por `ipcaMonthsAfterOct2022`.
  const ipcaNovDez2022 = taxData.ipcaMonthsAfterOct2022.reduce((fator, mes) => fator * (1 + mes.pct / 100), 1);
  const ipcaAcumulado = taxData.ipcaSeries
    .filter((item) => item.year > anoBaseCambio && item.year <= revenue2025.year)
    .reduce((fator, item) => fator * (1 + item.pct / 100), ipcaNovDez2022);

  const twittersPerYear = revenue2025.totalBillions / (fome.twitterBrlBillions * ipcaAcumulado);
  const daysPerTwitter = Math.round(365 / twittersPerYear);
  const wfpDays = Math.max(
    1,
    Math.round(((fome.wfpBrlBillions * ipcaAcumulado) / revenue2025.totalBillions) * 365),
  );
  const twitterCorrected = fome.twitterBrlBillions * ipcaAcumulado;
  const wfpCorrected = fome.wfpBrlBillions * ipcaAcumulado;
  const umaCasa = (n: number) => n.toLocaleString(idioma, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return {
    numeros: [
      {
        valor: naMoedaEscolhida(`R$ ${numero(fome.twitterBrlBillions, idioma)} ${abreviacao('bi', idioma)}`),
        origem: 'fallacies.json hunger44.twitterBrlBillions',
        legenda: { chave: 'hungerFallacy.statTwitter' },
        notas: [
          {
            chave: 'hungerFallacy.fxNote',
            valores: {
              usd: fome.twitterUsdBillions,
              ptax: fome.ptaxRate.toLocaleString(idioma, { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
              nominal: fome.twitterBrlBillions,
            },
          },
          {
            chave: 'hungerFallacy.ipcaNote',
            valores: { nominal: fome.twitterBrlBillions, corrected: umaCasa(twitterCorrected), year: revenue2025.year },
          },
        ],
        fonte: fome.sources[1]!,
      },
      {
        valor: naMoedaEscolhida(`R$ ${numero(revenue2025.totalBillions / 1000, idioma, { maximumFractionDigits: 2 })} ${abreviacao('tri', idioma)}`),
        origem: 'tax-data.json revenueSeries (ultimo ano)',
        legenda: { chave: 'hungerFallacy.statRevenue', valores: { year: revenue2025.year } },
        fonte: { label: revenue2025.source, url: revenue2025.url },
      },
      {
        valor: `${twittersPerYear.toLocaleString(idioma, { maximumFractionDigits: 1 })}×`,
        origem: 'calculado: revenueSeries.totalBillions / (hunger44.twitterBrlBillions corrigido pelo IPCA)',
        legenda: { chave: 'hungerFallacy.statTwitters' },
        fonte: { label: revenue2025.source, url: revenue2025.url },
      },
    ],
    subtema: { chave: 'hungerFallacy.pictoTitle', valores: { days: daysPerTwitter } },
    conclusao: [
      { chave: 'hungerFallacy.punch1', valores: { wfp: fome.wfpBrlBillions, days: wfpDays } },
      {
        chave: 'hungerFallacy.ipcaNote',
        valores: { nominal: fome.wfpBrlBillions, corrected: umaCasa(wfpCorrected), year: revenue2025.year },
      },
      {
        // Numero cru em `valores`: quem renderiza formata no idioma (`resolverValores`, PageIntro.vue).
        chave: 'hungerFallacy.punch2',
        valores: {
          poverty: hypocrisy.povertyMillions,
          povertyPct: hypocrisy.povertyPct,
          year: hypocrisy.povertyYear,
        },
      },
      { chave: 'hungerFallacy.punch3' },
    ],
    fontes: [...fome.sources, ...hypocrisy.sources, { label: revenue2025.source, url: revenue2025.url }],
  };
}

function montarWhatItBuys(idioma: string): SecaoCompleta {
  const total = taxData.currentYear.totalBillions * 1e9;
  const creche = taxData.referenceCosts.school;
  const disney = whatItBuys.items.find((i) => i.key === 'disney')!;
  const pilha = whatItBuys.physical.find((p) => p.key === 'pilhaMoedas')!;

  const idasALua = ((total / pilha.inputs.unitValueBrl) * pilha.inputs.unitMm) / 1e6 / pilha.compare.km;
  const vezesDisney = total / (disney.amount.value * whatItBuys.fx.usdBrl);
  const umaCasa = (v: number) => v.toLocaleString(idioma, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return {
    numeros: [
      {
        valor: formatCount(Math.round(total / creche.unitCost), idioma),
        origem: 'tax-data.json currentYear.totalBillions / referenceCosts.school.unitCost',
        legenda: { chave: 'whatItBuys.homeNumberSocial' },
        fonte: { label: creche.source, url: creche.url },
      },
      {
        valor: umaCasa(vezesDisney),
        origem: 'what-it-buys.json items[disney].amount + fx.usdBrl',
        legenda: { chave: 'whatItBuys.homeNumberDisney' },
        fonte: { label: disney.source, url: disney.url },
      },
      {
        valor: umaCasa(idasALua),
        origem: 'what-it-buys.json physical[pilhaMoedas].inputs',
        legenda: { chave: 'whatItBuys.homeNumberMoon' },
        fonte: { label: pilha.source, url: pilha.url },
      },
    ],
    subtema: { chave: 'whatItBuys.homeSubtema' },
    conclusao: [{ chave: 'whatItBuys.homeConclusao1' }, { chave: 'whatItBuys.homeConclusao2' }],
    fontes: [
      { label: creche.source, url: creche.url },
      { label: pilha.source, url: pilha.url },
      { label: whatItBuys.fx.source, url: whatItBuys.fx.url },
    ],
  };
}

/** Página de apêndice: não tem seção de conteúdo, então as quatro partes ficam vazias. */
const methodology: SecaoCompleta = {};

/**
 * `valor` já vem escrito, e o ponto separa milhar em português e decimal em
 * inglês: por isso o mapa é função do idioma, com cache por rota.
 */
const porIdioma = new Map<string, Partial<Record<string, SecaoCompleta>>>();

export function secoesCompletasDe(idioma: string): Partial<Record<string, SecaoCompleta>> {
  // A moeda entra na chave: o texto já vem escrito, e ler o contexto aqui é o que
  // faz a tela refazer as seções quando o leitor troca de moeda.
  const chave = `${idioma}|${contextoDaMoeda.value.moeda}`;
  const pronto = porIdioma.get(chave);
  if (pronto) return pronto;

  const mapa: Partial<Record<string, SecaoCompleta>> = {
    journey: protegida('journey', () => montarJourney(idioma)),
    calculator: protegida('calculator', () => montarCalculator(idioma)),
    timeMachine: protegida('timeMachine', () => montarTimeMachine(idioma)),
    inflation: protegida('inflation', () => montarInflation(idioma)),
    fallacies: protegida('fallacies', () => montarFallacies(idioma)),
    economics: protegida('economics', () => montarEconomics(idioma)),
    business: protegida('business', () => montarBusiness(idioma)),
    publicMachine: protegida('publicMachine', () => montarPublicMachine(idioma)),
    spending: {
      numeros: [{
        valor: numero(spendingData.stalled.stopped, idioma),
        origem: 'spending.json stalled.stopped',
        legenda: { chave: 'spending.cases.stalled.metric' },
        fonte: { label: spendingData.stalled.source, url: spendingData.stalled.url },
      }],
      subtema: { chave: 'spending.tldr' },
      conclusao: [{ chave: 'spending.conclusion' }],
    },
    promises: protegida('promises', () => montarPromises(idioma)),
    world: protegida('world', () => montarWorld(idioma)),
    manifesto: protegida('manifesto', () => montarManifesto(idioma)),
    whatItBuys: protegida('whatItBuys', () => montarWhatItBuys(idioma)),
    methodology,
  };
  porIdioma.set(chave, mapa);
  return mapa;
}

/** Para os testes; quem renderiza usa `secoesCompletasDe(locale)`. */
export const secoesCompletas: Partial<Record<string, SecaoCompleta>> = secoesCompletasDe('pt-BR');
