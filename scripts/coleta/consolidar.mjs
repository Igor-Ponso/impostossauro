/**
 * Transforma os arquivos de `data-bruto/` em `app/data/states.json` (mapa por
 * estado) e na `federalRevenueSeries` de `app/data/tax-data.json`.
 *
 * Nada é estimado ou interpolado: faltou na fonte, entra como null. Um ano só é
 * publicável com as duas metades da conta para os 27 estados. Valores nominais.
 */
import { readFileSync, writeFileSync, existsSync, realpathSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const BRUTO = join(RAIZ, 'data-bruto');
const DESTINO = join(RAIZ, 'app', 'data', 'states.json');
const DESTINO_TAX_DATA = join(RAIZ, 'app', 'data', 'tax-data.json');

const UFS = [
  ['AC', 'Acre', 'Norte'],
  ['AP', 'Amapá', 'Norte'],
  ['AM', 'Amazonas', 'Norte'],
  ['PA', 'Pará', 'Norte'],
  ['RO', 'Rondônia', 'Norte'],
  ['RR', 'Roraima', 'Norte'],
  ['TO', 'Tocantins', 'Norte'],
  ['AL', 'Alagoas', 'Nordeste'],
  ['BA', 'Bahia', 'Nordeste'],
  ['CE', 'Ceará', 'Nordeste'],
  ['MA', 'Maranhão', 'Nordeste'],
  ['PB', 'Paraíba', 'Nordeste'],
  ['PE', 'Pernambuco', 'Nordeste'],
  ['PI', 'Piauí', 'Nordeste'],
  ['RN', 'Rio Grande do Norte', 'Nordeste'],
  ['SE', 'Sergipe', 'Nordeste'],
  ['DF', 'Distrito Federal', 'Centro-Oeste'],
  ['GO', 'Goiás', 'Centro-Oeste'],
  ['MT', 'Mato Grosso', 'Centro-Oeste'],
  ['MS', 'Mato Grosso do Sul', 'Centro-Oeste'],
  ['ES', 'Espírito Santo', 'Sudeste'],
  ['MG', 'Minas Gerais', 'Sudeste'],
  ['RJ', 'Rio de Janeiro', 'Sudeste'],
  ['SP', 'São Paulo', 'Sudeste'],
  ['PR', 'Paraná', 'Sul'],
  ['RS', 'Rio Grande do Sul', 'Sul'],
  ['SC', 'Santa Catarina', 'Sul'],
];

const FONTE_ARRECADACAO = {
  source: 'Receita Federal — Arrecadação por Estado',
  url: 'https://www.gov.br/receitafederal/dados/arrecadacao-estado.csv',
};

/**
 * A série nacional não sai da soma do CSV por estado: lá a previdenciária só
 * existe de 2013 em diante e "outros órgãos" de 2010, e antes disso o ano sai
 * ~30% menor sem qualquer sinal de erro. Onde as duas se sobrepõem (2013-2024) fecham em 0,05%.
 */
const FONTE_SERIE_FEDERAL = {
  source: 'Receita Federal — Arrecadação das Receitas Federais, série histórica (ReceitaData)',
  url: 'https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/dados-abertos/receitadata/arrecadacao/serie-historica',
};

const FONTE_TRANSFERENCIA = {
  source: 'Tesouro Nacional — SICONFI, RREO Anexo 01 (6º bimestre)',
  url: 'https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo',
};

function precisa(caminho) {
  const cheio = join(BRUTO, caminho);
  if (!existsSync(cheio)) {
    console.error(
      `Falta ${caminho}. Rode o fluxo de coleta e traga a branch:\n` +
        '  git fetch origin dados-brutos && git checkout origin/dados-brutos -- data-bruto',
    );
    process.exit(1);
  }
  return cheio;
}

/**
 * O CSV da Receita mistura três convenções de número entre anos:
 *   2001-2002    47,953,915   vírgula é separador de milhar
 *   2008-2026    91.155.798   ponto é milhar, vírgula é decimal
 *   2000, 03-07  292096       inteiro puro
 */
export function numeroCsv(bruto) {
  const t = String(bruto ?? '').trim();
  if (t === '' || t === '-') return 0;
  if (/^-?\d+$/.test(t)) return Number(t);
  if (/^-?\d{1,3}(,\d{3})+$/.test(t)) return Number(t.replace(/,/g, ''));
  if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) return Number(t.replace(/\./g, ''));
  if (/^-?[\d.]+,\d+$/.test(t)) return Number(t.replace(/\./g, '').replace(',', '.'));
  throw new Error(`numero em formato desconhecido no CSV: ${JSON.stringify(t)}`);
}

/** `caminhoCsv` existe para os testes lerem a fixture de `tests/fixtures/` em vez do CSV de 30 MB. */
export function lerArrecadacao(caminhoCsv) {
  const texto = readFileSync(caminhoCsv ?? precisa('receita-arrecadacao-estado-csv.csv'), 'latin1');
  const linhas = texto.split(/\r?\n/);
  const porAnoUf = new Map();

  // As colunas da régua não existem em todos os anos: onde estão vazias, o ano
  // sai menor sem que nada acuse.
  const cabecalho = (linhas[0] ?? '').split(';').map((nome) => (nome ?? '').trim());
  const COLUNAS_REGUA = {
    previdenciaria: cabecalho.flatMap((nome, i) => (/^RECEITA PREVIDENCI/i.test(nome) ? [i] : [])),
    outrosOrgaos: cabecalho.flatMap((nome, i) => (/OUTROS [ÓO]RG[ÃA]OS/i.test(nome) ? [i] : [])),
  };
  for (const [parte, indices] of Object.entries(COLUNAS_REGUA)) {
    if (indices.length === 0) {
      throw new Error(
        `nao achei no CSV as colunas de ${parte}: o cabecalho da Receita mudou, `
        + 'e a regua de cada ano nao pode mais ser medida.',
      );
    }
  }

  const reguaPorAno = new Map();

  for (const linha of linhas.slice(1)) {
    if (!linha.trim()) continue;
    const campos = linha.split(';');
    const ano = Number(campos[0]);
    const uf = (campos[2] ?? '').trim();
    if (!Number.isInteger(ano) || !uf) continue;

    // Da quarta coluna em diante é tributo; a soma é a arrecadação do estado no mês.
    let total = 0;
    for (const bruto of campos.slice(3)) {
      const valor = numeroCsv(bruto);
      if (Number.isFinite(valor)) total += valor;
    }

    const chave = `${ano}|${uf}`;
    porAnoUf.set(chave, (porAnoUf.get(chave) ?? 0) + total);

    // Conta meses com valor, não a soma: 2005 tem três meses soltos de
    // previdenciária, o bastante para uma soma passar de zero.
    const mesRegua = (campos[1] ?? '').trim();
    if (!reguaPorAno.has(ano)) {
      reguaPorAno.set(ano, { previdenciaria: new Set(), outrosOrgaos: new Set() });
    }
    const regua = reguaPorAno.get(ano);
    for (const [parte, indices] of Object.entries(COLUNAS_REGUA)) {
      if (indices.some((i) => numeroCsv(campos[i]) !== 0)) regua[parte].add(mesRegua);
    }
  }

  // Ano incompleto não entra: o arquivo é mensal e o ano corrente está pela metade.
  const mesesPorAno = new Map();
  for (const linha of linhas.slice(1)) {
    const campos = linha.split(';');
    const ano = Number(campos[0]);
    const mes = (campos[1] ?? '').trim();
    if (!Number.isInteger(ano) || !mes) continue;
    if (!mesesPorAno.has(ano)) mesesPorAno.set(ano, new Set());
    mesesPorAno.get(ano).add(mes);
  }
  const anosCompletos = new Set(
    [...mesesPorAno.entries()].filter(([, meses]) => meses.size === 12).map(([ano]) => ano),
  );

  return { porAnoUf, anosCompletos, reguaPorAno };
}

/** Receita total do estado no ano (denominador da dependência); preenchido por lerTransferencias(). */
const receitaTotal = new Map();

function lerTransferencias() {
  const caminho = join(BRUTO, 'siconfi-transferencias.jsonl');
  if (!existsSync(caminho)) return new Map();

  const porAnoUf = new Map();
  for (const linha of readFileSync(caminho, 'utf8').split(/\r?\n/)) {
    if (!linha.trim()) continue;
    let registro;
    try {
      registro = JSON.parse(linha);
    } catch {
      continue;
    }
    // "Até o Bimestre (c)" no 6º bimestre é o realizado do ano fechado.
    if (!/Até o Bimestre/i.test(registro.coluna ?? '')) continue;

    const chave = `${registro.exercicio}|${registro.uf}`;
    if (/Transferências da União/i.test(registro.conta ?? '')) {
      // Duas contas distintas (correntes e de capital): somar é o total, não duplicata.
      porAnoUf.set(chave, (porAnoUf.get(chave) ?? 0) + Number(registro.valor ?? 0));
    } else if (/^RECEITAS \(EXCETO INTRA/i.test(registro.conta ?? '')) {
      receitaTotal.set(chave, Number(registro.valor ?? 0));
    }
  }
  return porAnoUf;
}

/**
 * Lê o CSV que `serie-federal.py` extrai da planilha da Receita: uma linha por
 * ano, com a contagem de meses de cada parcela (é ela que mede a régua, não a soma).
 */
function lerSerieFederalOficial() {
  const texto = readFileSync(precisa('receita-serie-historica.csv'), 'utf8');
  const [cabecalho, ...linhas] = texto.trim().split(/\r?\n/);
  const colunas = cabecalho.split(';').map((nome) => nome.trim());
  return linhas
    .filter((linha) => linha.trim())
    .map((linha) => {
      const campos = linha.split(';');
      const registro = Object.fromEntries(colunas.map((nome, i) => [nome, campos[i]]));
      return {
        year: Number(registro.ano),
        meses: Number(registro.meses),
        mesesPrevidenciaria: Number(registro.meses_previdenciaria),
        mesesOutrosOrgaos: Number(registro.meses_outros_orgaos),
        totalMilhoes: Number(registro.total_milhoes),
      };
    })
    .sort((a, b) => a.year - b.year);
}

/**
 * Cada ano declara a régua que a fonte sustenta: `completa` quando as três
 * parcelas têm os doze meses, senão `nucleo` (1994 não traz previdenciária).
 * Campos editoriais já publicados em `tax-data.json` (`corroboration`,
 * `divergence`…) são apuração humana e sobrevivem à regeneração.
 */
function gerarSerieFederal(serieOficial) {
  const existente = JSON.parse(readFileSync(DESTINO_TAX_DATA, 'utf8'));
  const existentesPorAno = new Map(
    (existente.federalRevenueSeries ?? []).map((item) => [item.year, item]),
  );

  const federalRevenueSeries = serieOficial
    // Ano incompleto não entra: a planilha ganha o ano corrente mês a mês.
    .filter((ano) => ano.meses === 12)
    .map((ano) => {
      const anterior = existentesPorAno.get(ano.year);
      const editorial = anterior
        ? Object.fromEntries(
            Object.entries(anterior).filter(
              ([chave]) => !['year', 'totalBillions', 'ruler', 'source', 'url'].includes(chave),
            ),
          )
        : {};

      const completa = ano.mesesPrevidenciaria === 12 && ano.mesesOutrosOrgaos === 12;

      return {
        year: ano.year,
        totalBillions: Math.round((ano.totalMilhoes / 1000) * 10) / 10,
        ruler: completa ? 'completa' : 'nucleo',
        source: FONTE_SERIE_FEDERAL.source,
        url: FONTE_SERIE_FEDERAL.url,
        ...editorial,
      };
    });

  return { ...existente, federalRevenueSeries };
}

/**
 * Importar este módulo não pode regravar `states.json`: o arquivo exporta
 * `numeroCsv`, e `tests/consolidarSemEfeito.spec.ts` cobra que a importação não tenha efeito.
 */
function main() {
  const { porAnoUf: enviado, anosCompletos, reguaPorAno } = lerArrecadacao();
  const recebido = lerTransferencias();

  const siglas = UFS.map(([sigla]) => sigla);
  const anosCandidatos = [...anosCompletos].sort((a, b) => a - b);

  /**
   * Publicável só com as duas metades para os 27 estados E régua completa no
   * ano. A segunda não é redundante: sem a coluna de previdenciária ou de
   * outros órgãos o ano sai menor, e no mapa vira estado que "manda menos".
   */
  const anosPublicaveis = anosCandidatos.filter((ano) => {
    const regua = reguaPorAno.get(ano);
    const reguaCompleta = regua?.previdenciaria.size === 12 && regua?.outrosOrgaos.size === 12;
    return (
      reguaCompleta
      && siglas.every(
        (uf) =>
          Number.isFinite(enviado.get(`${ano}|${uf}`)) && Number.isFinite(recebido.get(`${ano}|${uf}`)),
      )
    );
  });

  const estados = {};
  for (const [sigla, nome, regiao] of UFS) {
    const fiscal = [];
    for (const ano of anosPublicaveis) {
      const receita = receitaTotal.get(`${ano}|${sigla}`);
      const repasse = recebido.get(`${ano}|${sigla}`);
      fiscal.push({
        year: ano,
        sent: Math.round(enviado.get(`${ano}|${sigla}`)),
        received: Math.round(repasse),
        totalRevenue: Number.isFinite(receita) ? Math.round(receita) : null,
        dependence: Number.isFinite(receita) && receita > 0 ? (repasse / receita) * 100 : null,
        sentSource: FONTE_ARRECADACAO.source,
        sentUrl: FONTE_ARRECADACAO.url,
        receivedSource: FONTE_TRANSFERENCIA.source,
        receivedUrl: FONTE_TRANSFERENCIA.url,
      });
    }
    estados[sigla] = { name: nome, region: regiao, fiscal, indicators: {} };
  }

  const saida = {
    meta: {
      geometry: {
        package: '@svg-maps/brazil',
        author: 'Victor Cazanave',
        license: 'CC-BY-4.0',
        url: 'https://github.com/VictorCazanave/svg-maps/tree/master/packages/brazil',
      },
      scope: {
        sent: 'Tributos federais arrecadados no estado, atribuídos pelo domicílio fiscal de quem paga — não pelo lugar onde a produção ou o consumo aconteceu.',
        received:
          'Transferências da União que entraram no caixa do GOVERNO ESTADUAL. Não inclui o que a União repassa direto às prefeituras do estado, nem aposentadoria, salário de servidor federal ou benefício pago a pessoa física.',
        currency: 'Valores nominais do ano, sem correção pelo IPCA.',
      },
      generatedBy: 'scripts/coleta/consolidar.mjs',
    },
    fiscalYears: anosPublicaveis,
    states: estados,
  };

  writeFileSync(DESTINO, `${JSON.stringify(saida, null, 2)}\n`, 'utf8');

  console.log(`Anos com arrecadação completa: ${anosCandidatos.join(', ') || '(nenhum)'}`);
  console.log(`Anos publicáveis (as duas metades, 27 estados): ${anosPublicaveis.join(', ') || '(nenhum)'}`);
  for (const ano of anosPublicaveis) {
    const faltando = siglas.filter((uf) => !Number.isFinite(recebido.get(`${ano}|${uf}`)));
    if (faltando.length) console.log(`  ${ano}: sem repasse para ${faltando.join(', ')}`);
  }
  console.log(`Escrito em ${DESTINO}`);

  const serieOficial = lerSerieFederalOficial();
  const saidaTax = gerarSerieFederal(serieOficial);
  writeFileSync(DESTINO_TAX_DATA, `${JSON.stringify(saidaTax, null, 2)}\n`, 'utf8');
  const publicados = saidaTax.federalRevenueSeries;
  const completos = publicados.filter((ano) => ano.ruler === 'completa');
  console.log(
    `Série federal: ${publicados.length} anos (${publicados[0].year}-${publicados.at(-1).year}), `
    + `dos quais ${completos.length} de régua completa (${completos[0].year}-${completos.at(-1).year}). `
    + `Escrita em ${DESTINO_TAX_DATA}`,
  );
}

/**
 * `import.meta.url` já vem com links simbólicos resolvidos e `process.argv[1]`
 * vem como foi digitado: sem `realpathSync` nos dois, chamar por um link (ou
 * por `/tmp` no macOS) não roda nada e sai com código 0.
 */
function chamadoDireto() {
  const invocado = process.argv[1];
  if (!invocado) return false;
  try {
    return import.meta.url === pathToFileURL(realpathSync(invocado)).href;
  } catch {
    return import.meta.url === pathToFileURL(invocado).href;
  }
}

if (chamadoDireto()) {
  main();
}
