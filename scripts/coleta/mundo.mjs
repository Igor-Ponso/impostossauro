#!/usr/bin/env node
/**
 * Indicadores de bem-estar dos 30 países de maior carga tributária (lista do
 * estudo IRBES do IBPT, 14ª edição), lidos da API do Banco Mundial e gravados
 * em `app/data/world.json`.
 *
 * A API limita taxa com força: após ~10 requisições em poucos minutos devolve
 * HTTP 502 com HTML. Por isso: uma chamada por indicador (os 30 países em
 * lote), pausa entre elas e gravação parcial a cada indicador que dá certo.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const SAIDA = resolve(import.meta.dirname, '../../app/data/world.json');
const PAUSA_ENTRE_CHAMADAS = 6000;
const ESPERAS = [5000, 15000, 45000];
const JANELA = '2018:2025';

/**
 * Fonte: IBPT, "Estudo sobre carga tributária/PIB x IDH — cálculo do IRBES",
 * 14ª edição, maio/2025, tabela "RANKING FINAL" (carga e IDH de 2023).
 */
const IRBES = [
  { iso: 'IRL', nome: 'Irlanda', carga: 22.7, idh: 0.95, irbes: 169.65, posicao: 1 },
  { iso: 'CHE', nome: 'Suíça', carga: 27.9, idh: 0.967, irbes: 165.11, posicao: 2 },
  { iso: 'USA', nome: 'Estados Unidos', carga: 26.9, idh: 0.921, irbes: 162.35, posicao: 3 },
  { iso: 'AUS', nome: 'Austrália', carga: 29.1, idh: 0.942, irbes: 161.61, posicao: 4 },
  { iso: 'ISR', nome: 'Israel', carga: 29.7, idh: 0.927, irbes: 159.64, posicao: 5 },
  { iso: 'KOR', nome: 'Coreia do Sul', carga: 29.9, idh: 0.923, irbes: 159.07, posicao: 6 },
  { iso: 'NZL', nome: 'Nova Zelândia', carga: 33.0, idh: 0.939, irbes: 156.87, posicao: 7 },
  { iso: 'CAN', nome: 'Canadá', carga: 33.2, idh: 0.936, irbes: 156.38, posicao: 8 },
  { iso: 'ISL', nome: 'Islândia', carga: 36.1, idh: 0.959, irbes: 155.0, posicao: 9 },
  { iso: 'JPN', nome: 'Japão', carga: 33.7, idh: 0.923, irbes: 154.7, posicao: 10 },
  { iso: 'ARG', nome: 'Argentina', carga: 28.6, idh: 0.849, irbes: 154.28, posicao: 11 },
  { iso: 'NOR', nome: 'Noruega', carga: 37.9, idh: 0.966, irbes: 153.53, posicao: 12 },
  { iso: 'GBR', nome: 'Reino Unido', carga: 35.3, idh: 0.924, irbes: 152.95, posicao: 13 },
  { iso: 'URY', nome: 'Uruguai', carga: 29.0, idh: 0.83, irbes: 152.2, posicao: 14 },
  { iso: 'CZE', nome: 'República Tcheca', carga: 34.3, idh: 0.895, irbes: 151.63, posicao: 15 },
  { iso: 'DEU', nome: 'Alemanha', carga: 38.8, idh: 0.947, irbes: 150.88, posicao: 16 },
  { iso: 'SVN', nome: 'Eslovênia', carga: 36.9, idh: 0.918, irbes: 150.6, posicao: 17 },
  { iso: 'ESP', nome: 'Espanha', carga: 37.5, idh: 0.911, irbes: 149.31, posicao: 18 },
  { iso: 'SVK', nome: 'Eslováquia', carga: 34.5, idh: 0.859, irbes: 148.34, posicao: 19 },
  { iso: 'FRA', nome: 'França', carga: 42.8, idh: 0.969, irbes: 148.15, posicao: 20 },
  { iso: 'HUN', nome: 'Hungria', carga: 34.8, idh: 0.859, irbes: 148.0, posicao: 21 },
  { iso: 'SWE', nome: 'Suécia', carga: 42.0, idh: 0.952, irbes: 147.62, posicao: 22 },
  { iso: 'FIN', nome: 'Finlândia', carga: 41.6, idh: 0.942, irbes: 147.23, posicao: 23 },
  { iso: 'GRC', nome: 'Grécia', carga: 38.5, idh: 0.893, irbes: 146.63, posicao: 24 },
  { iso: 'DNK', nome: 'Dinamarca', carga: 44.1, idh: 0.956, irbes: 145.55, posicao: 25 },
  { iso: 'BEL', nome: 'Bélgica', carga: 43.2, idh: 0.942, irbes: 145.39, posicao: 26 },
  { iso: 'LUX', nome: 'Luxemburgo', carga: 42.8, idh: 0.927, irbes: 144.58, posicao: 27 },
  { iso: 'AUT', nome: 'Áustria', carga: 42.1, idh: 0.913, irbes: 144.19, posicao: 28 },
  { iso: 'ITA', nome: 'Itália', carga: 42.0, idh: 0.906, irbes: 143.71, posicao: 29 },
  { iso: 'BRA', nome: 'Brasil', carga: 33.43, idh: 0.786, irbes: 143.37, posicao: 30 },
];

/**
 * Nenhum indicador aqui é carga tributária: a do Banco Mundial
 * (`GC.TAX.TOTL.GD.ZS`) mede só o governo central e dá 15,4% ao Brasil.
 */
const INDICADORES = [
  // Resultado: entram no placar. `escala` é fixa e vai à tela; normalizar pelo
  // mínimo do grupo daria barra zero ao Brasil onde ele é o mínimo.
  { id: 'vida', codigo: 'SP.DYN.LE00.IN', tipo: 'resultado', ordem: 'maiorMelhor', escala: [60, 90],
    rotulo: 'Esperança de vida ao nascer', movimento: 'VIDA LONGA', unidade: 'anos',
    rotuloCurto: 'Esperança de vida',
    rotuloCurtoEn: 'Life expectancy', movimentoEn: 'LONG LIFE' },
  { id: 'homicidios', codigo: 'VC.IHR.PSRC.P5', tipo: 'resultado', ordem: 'menorMelhor', escala: [0, 25],
    rotulo: 'Homicídios por 100 mil habitantes', movimento: 'SEGURANÇA', unidade: 'por 100 mil',
    rotuloCurto: 'Homicídios',
    rotuloCurtoEn: 'Homicides', movimentoEn: 'SAFETY' },
  { id: 'saneamento', codigo: 'SH.STA.SMSS.ZS', tipo: 'resultado', ordem: 'maiorMelhor', escala: [0, 100],
    rotulo: 'População com saneamento gerido com segurança', movimento: 'SANEAMENTO', unidade: '% da população',
    rotuloCurto: 'Saneamento',
    rotuloCurtoEn: 'Sanitation', movimentoEn: 'SANITATION' },
  { id: 'mortInfantil', codigo: 'SP.DYN.IMRT.IN', tipo: 'resultado', ordem: 'menorMelhor', escala: [0, 15],
    rotulo: 'Mortalidade infantil', movimento: 'PRIMEIROS ANOS', unidade: 'por mil nascidos',
    rotuloCurto: 'Mortalidade infantil',
    rotuloCurtoEn: 'Infant mortality', movimentoEn: 'EARLY YEARS' },
  { id: 'mortMaterna', codigo: 'SH.STA.MMRT', tipo: 'resultado', ordem: 'menorMelhor', escala: [0, 70],
    rotulo: 'Mortalidade materna', movimento: 'VIDA DE MÃE', unidade: 'por 100 mil nascidos',
    rotuloCurto: 'Mortalidade materna',
    rotuloCurtoEn: 'Maternal mortality', movimentoEn: 'MOTHERS\' LIVES' },
  { id: 'ensinoMedio', codigo: 'SE.SEC.CUAT.UP.ZS', tipo: 'resultado', ordem: 'maiorMelhor', escala: [30, 100],
    rotulo: 'Adultos que concluíram o ensino médio', movimento: 'ESCOLA', unidade: '% dos 25+',
    rotuloCurto: 'Ensino médio',
    rotuloCurtoEn: 'Upper secondary', movimentoEn: 'SCHOOL' },

  // Insumo: quanto entra, não o que sai. Nunca entra no placar.
  { id: 'educacaoGasto', codigo: 'SE.XPD.TOTL.GD.ZS', tipo: 'insumo', ordem: 'maiorMelhor', escala: [0, 8],
    rotulo: 'Gasto público em educação', unidade: '% do PIB',
    rotuloCurto: 'Gasto em educação',
    rotuloCurtoEn: 'Education spending' },
  { id: 'saudeGasto', codigo: 'SH.XPD.CHEX.GD.ZS', tipo: 'insumo', ordem: 'maiorMelhor', escala: [0, 18],
    rotulo: 'Gasto total em saúde', unidade: '% do PIB',
    rotuloCurto: 'Gasto em saúde',
    rotuloCurtoEn: 'Health spending' },

  // Contexto: nem placar nem insumo.
  { id: 'pibPorHabitante', codigo: 'NY.GDP.PCAP.PP.CD', tipo: 'contexto', ordem: 'maiorMelhor', escala: [0, 160000],
    rotulo: 'PIB por habitante', unidade: 'dólares PPP',
    rotuloCurto: 'PIB por habitante',
    rotuloCurtoEn: 'GDP per capita' },
];

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/** O erro de limite de taxa chega como HTML (começa por `<`), não como JSON. */
async function buscar(codigo, isos) {
  const url = `https://api.worldbank.org/v2/country/${isos.join(';')}/indicator/${codigo}`
    + `?format=json&date=${JANELA}&per_page=1000`;

  for (let tentativa = 0; tentativa <= ESPERAS.length; tentativa += 1) {
    if (tentativa > 0) {
      const pausa = ESPERAS[tentativa - 1];
      console.log(`      nova tentativa em ${pausa / 1000}s...`);
      await espera(pausa);
    }
    try {
      const resposta = await fetch(url, { headers: { Accept: 'application/json' } });
      const corpo = (await resposta.text()).trim();

      if (corpo.startsWith('<')) {
        console.log(`      recusado: veio HTML, nao JSON (HTTP ${resposta.status})`);
        continue;
      }
      const dados = JSON.parse(corpo);
      if (!Array.isArray(dados) || !Array.isArray(dados[1])) {
        console.log(`      recusado: JSON sem a serie esperada (${JSON.stringify(dados).slice(0, 120)})`);
        continue;
      }
      return dados[1];
    } catch (erro) {
      console.log(`      falhou: ${erro.message}`);
    }
  }
  return null;
}

/**
 * O Banco Mundial devolve `"value": null` nos anos sem dado, e cada país tem o
 * seu último ano disponível; o ano vai junto com o valor.
 */
function maisRecentePorPais(registros) {
  const porPais = new Map();
  for (const r of registros) {
    const iso = r.countryiso3code;
    const valor = r.value;
    if (!iso || valor === null || valor === undefined) continue;
    const ano = Number(r.date);
    const atual = porPais.get(iso);
    if (!atual || ano > atual.ano) porPais.set(iso, { valor, ano });
  }
  return porPais;
}

/** O Banco Mundial já devolve `country.value` em inglês em cada registro. */
function nomesEmIngles(registros) {
  const nomes = {};
  for (const r of registros) {
    if (r.countryiso3code && r.country?.value) nomes[r.countryiso3code] = r.country.value;
  }
  return nomes;
}

async function carregarParcial() {
  try {
    return JSON.parse(await readFile(SAIDA, 'utf8'));
  } catch {
    return null;
  }
}

async function main() {
  const isos = IRBES.map((p) => p.iso);
  const anterior = await carregarParcial();
  const jaColetados = new Map(
    (anterior?.indicadores ?? []).filter((i) => !i.falhou).map((i) => [i.id, i]),
  );

  console.log(`Coletando ${INDICADORES.length} indicadores para ${isos.length} paises.`);
  if (jaColetados.size > 0) {
    console.log(`Retomando: ${jaColetados.size} ja estavam no arquivo e nao serao buscados de novo.`);
  }

  const indicadores = [];
  const nomesEn = { ...(anterior?.nomesEn ?? {}) };
  let primeira = true;

  for (const ind of INDICADORES) {
    if (jaColetados.has(ind.id)) {
      console.log(`  ${ind.id}: ja coletado, pulando`);
      // A definição por cima do disco: mudar rótulo ou escala não exige bater na API.
      indicadores.push({ ...jaColetados.get(ind.id), ...ind });
      continue;
    }

    if (!primeira) await espera(PAUSA_ENTRE_CHAMADAS);
    primeira = false;

    console.log(`  ${ind.id} (${ind.codigo})...`);
    const registros = await buscar(ind.codigo, isos);

    if (registros === null) {
      console.log(`  ${ind.id}: FALHOU em todas as tentativas — registrado como falha`);
      indicadores.push({ ...ind, falhou: true, valores: {}, anos: {} });
      continue;
    }

    Object.assign(nomesEn, nomesEmIngles(registros));

    const porPais = maisRecentePorPais(registros);
    const valores = {};
    const anos = {};
    for (const [iso, { valor, ano }] of porPais) {
      valores[iso] = valor;
      anos[iso] = ano;
    }

    const faltando = isos.filter((i) => !(i in valores));
    console.log(`  ${ind.id}: ${Object.keys(valores).length}/${isos.length} paises`
      + (faltando.length ? ` — sem dado: ${faltando.join(', ')}` : ''));

    indicadores.push({
      ...ind,
      fonte: 'Banco Mundial',
      url: `https://data.worldbank.org/indicator/${ind.codigo}`,
      valores,
      anos,
      faltando,
      paisesComparados: isos.filter((i) => i in valores),
    });

    await escrever(indicadores, nomesEn);
  }

  await escrever(indicadores, nomesEn);

  const falhas = indicadores.filter((i) => i.falhou);
  console.log(`\nGravado em ${SAIDA}`);
  if (falhas.length) {
    console.log(`ATENCAO: ${falhas.length} indicador(es) falharam: ${falhas.map((i) => i.id).join(', ')}`);
    console.log('Espere alguns minutos e rode de novo — o que deu certo nao sera buscado outra vez.');
  }
}

async function escrever(indicadores, nomesEn) {
  const saida = {
    updatedAt: new Date().toISOString(),
    criterio: 'Os 30 paises de maior carga tributaria do mundo, grupo definido pelo '
      + 'estudo IRBES do IBPT (14a edicao, maio/2025, dados de 2023). O Brasil esta '
      + 'no grupo por merito proprio, em 30o lugar.',
    paises: IRBES,
    nomesEn,
    irbes: {
      fonte: 'IBPT — Estudo sobre carga tributária/PIB x IDH, cálculo do IRBES, 14ª edição',
      edicao: '14ª',
      publicado: '2025-05-06',
      anoBase: 2023,
      url: 'https://ibpt.org.br/estudo-irbes-14a-edicao-idh-e-carga-tributaria-pib-dados-de-2023-maio-2025/',
      autores: ['João Eloi Olenike', 'Gilberto Luiz do Amaral', 'Letícia Mary Fernandes do Amaral'],
      metodologia: 'IRBES pondera carga tributária com peso 15% e IDH com peso 85%. '
        + 'A carga vem da OCDE; o IDH, do PNUD.',
      fonteCargaPorPais: {
        BRA: 'O estudo declara a OCDE como fonte da carga tributária, mas o valor do '
          + 'Brasil (33,43%) é o resultado da conta que o próprio IBPT mostra na seção 2.1 '
          + '(R$ 3,629 tri de arrecadação sobre R$ 10,856 tri de PIB). É o único dos 30 '
          + 'com duas casas decimais; os outros 29 têm uma, no formato das tabelas da OCDE.',
      },
    },
    indicadores,
  };
  await writeFile(SAIDA, `${JSON.stringify(saida, null, 2)}\n`);
}

await main();
