import businessEn from '~/data/en/business.json';
import businessClosuresEn from '~/data/en/business-closures.json';
import commissionedPostsEn from '~/data/en/commissioned-posts.json';
import companiesEn from '~/data/en/companies.json';
import contrastsEn from '~/data/en/contrasts.json';
import corporateCardEn from '~/data/en/corporate-card.json';
import currencyHistoryEn from '~/data/en/currency-history.json';
import economia101En from '~/data/en/economia101.json';
import errataEn from '~/data/en/errata.json';
import { ehReguaEmReal, naMoedaEscolhida } from '~/utils/estadoDaMoeda';
import fallaciesEn from '~/data/en/fallacies.json';
import federalPayrollEn from '~/data/en/federal-payroll.json';
import federativeEn from '~/data/en/federative.json';
import governmentsEn from '~/data/en/governments.json';
import historicalEn from '~/data/en/historical.json';
import importTariffEn from '~/data/en/import-tariff.json';
import inflationHistoryEn from '~/data/en/inflation-history.json';
import journeyEn from '~/data/en/journey.json';
import justificationsEn from '~/data/en/justifications.json';
import leniencyEn from '~/data/en/leniency.json';
import literacyEn from '~/data/en/literacy.json';
import partyFundsEn from '~/data/en/party-funds.json';
import promisesEn from '~/data/en/promises.json';
import publicityEn from '~/data/en/publicity.json';
import socialHistoryEn from '~/data/en/social-history.json';
import stateCompaniesEn from '~/data/en/state-companies.json';
import statesEn from '~/data/en/states.json';
import taxDataEn from '~/data/en/tax-data.json';
import wagesEn from '~/data/en/wages.json';
import whatItBuysEn from '~/data/en/what-it-buys.json';
import unemploymentEn from '~/data/en/unemployment.json';
import priceLevelEn from '~/data/en/price-level.json';
import worldEn from '~/data/en/world.json';

/**
 * Só a prosa do site é traduzida; fala de político, texto de lei e nome próprio
 * ficam em português nas duas rotas. Mapa plano caminho → texto: caminho que
 * deixar de existir no dado quebra `tests/dadosEmIngles.spec.ts`, não some calado.
 */
const TRADUZIDOS: Record<string, Record<string, string>> = {
  'business.json': businessEn,
  'business-closures.json': businessClosuresEn,
  'commissioned-posts.json': commissionedPostsEn,
  'companies.json': companiesEn,
  'contrasts.json': contrastsEn,
  'corporate-card.json': corporateCardEn,
  'currency-history.json': currencyHistoryEn,
  'economia101.json': economia101En,
  'errata.json': errataEn,
  'fallacies.json': fallaciesEn,
  'federal-payroll.json': federalPayrollEn,
  'federative.json': federativeEn,
  'governments.json': governmentsEn,
  'historical.json': historicalEn,
  'import-tariff.json': importTariffEn,
  'inflation-history.json': inflationHistoryEn,
  'journey.json': journeyEn,
  'justifications.json': justificationsEn,
  'leniency.json': leniencyEn,
  'literacy.json': literacyEn,
  'party-funds.json': partyFundsEn,
  'promises.json': promisesEn,
  'publicity.json': publicityEn,
  'social-history.json': socialHistoryEn,
  'state-companies.json': stateCompaniesEn,
  'states.json': statesEn,
  'tax-data.json': taxDataEn,
  'wages.json': wagesEn,
  'price-level.json': priceLevelEn,
  'unemployment.json': unemploymentEn,
  'what-it-buys.json': whatItBuysEn,
  'world.json': worldEn,
};

export const ARQUIVOS_TRADUZIDOS = Object.keys(TRADUZIDOS);

/** `cases[0].loophole.name` → ['cases', 0, 'loophole', 'name'] */
function partes(caminho: string): Array<string | number> {
  return caminho
    .split('.')
    .flatMap((pedaco) => {
      const [nome, ...indices] = pedaco.split('[');
      return [nome!, ...indices.map((i) => Number(i.replace(']', '')))];
    })
    .filter((parte) => parte !== '');
}

function aplicar(alvo: unknown, caminho: string, valor: string): boolean {
  const trilha = partes(caminho);
  const ultima = trilha.pop()!;
  let atual: Record<string | number, unknown> | undefined = alvo as Record<string, unknown>;
  for (const parte of trilha) {
    atual = atual?.[parte] as Record<string, unknown> | undefined;
    if (atual === null || typeof atual !== 'object') return false;
  }
  if (!atual || typeof atual[ultima] !== 'string') return false;
  atual[ultima] = valor;
  return true;
}

const cache = new Map<string, unknown>();

const proxies = new WeakMap<object, unknown>();

/**
 * Boa parte do dinheiro do site é texto pronto no JSON. Em vez de marcar valor por
 * valor na tela, a troca de moeda acontece na leitura: o proxy converte a string no
 * momento do acesso, que é durante a renderização — por isso a tela reage à troca.
 * Método não é amarrado ao alvo de propósito: `lista.map()` precisa ler pelo proxy.
 */
function comMoeda<T>(valor: T, arquivo: string, caminho = ''): T {
  if (typeof valor === 'string') {
    return (ehReguaEmReal(arquivo, caminho) ? valor : naMoedaEscolhida(valor)) as T;
  }
  if (valor === null || typeof valor !== 'object') return valor;

  const alvo = valor as object;
  const guardado = proxies.get(alvo);
  if (guardado) return guardado as T;

  const proxy = new Proxy(alvo, {
    get(bruto, chave, receptor) {
      const conteudo = Reflect.get(bruto, chave, receptor);
      if (typeof chave === 'symbol' || typeof conteudo === 'function') return conteudo;
      const filho = Array.isArray(bruto) ? `${caminho}[${chave}]` : caminho ? `${caminho}.${chave}` : chave;
      return comMoeda(conteudo, arquivo, filho);
    },
  });
  proxies.set(alvo, proxy);
  return proxy as T;
}

export function dadoNoIdioma<T>(arquivo: string, dadoPt: T, idioma: string): T {
  if (!idioma.startsWith('en')) return comMoeda(dadoPt, arquivo);

  const chave = `${arquivo}|${idioma}`;
  const pronto = cache.get(chave);
  if (pronto) return comMoeda(pronto as T, arquivo);

  const traducoes = TRADUZIDOS[arquivo];
  if (!traducoes) throw new Error(`dadoNoIdioma: nao ha traducao registrada para "${arquivo}"`);

  const copia = structuredClone(dadoPt);
  for (const [caminho, texto] of Object.entries(traducoes)) {
    if (!aplicar(copia, caminho, texto)) {
      throw new Error(`dadoNoIdioma: o caminho "${caminho}" nao existe em ${arquivo}`);
    }
  }
  cache.set(chave, copia);
  return comMoeda(copia as T, arquivo);
}

/** Para dado que não passa pelo funil de idioma, como `payroll-2026.json`. */
export function dadoNaMoeda<T>(arquivo: string, dado: T): T {
  return comMoeda(dado, arquivo);
}
