/** Grava a última PTAX de venda publicada pelo Banco Central em `app/data/cambio.json`. */
import { writeFile } from 'node:fs/promises';

function dataBcb(data) {
  return `${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}-${data.getFullYear()}`;
}

const fim = new Date();
const inicio = new Date(fim);
inicio.setDate(fim.getDate() - 10);
const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?@dataInicial='${dataBcb(inicio)}'&@dataFinalCotacao='${dataBcb(fim)}'&$format=json`;

const resposta = await fetch(url, { signal: AbortSignal.timeout(15000) });
if (!resposta.ok) throw new Error(`BCB respondeu ${resposta.status}`);
const { value } = await resposta.json();
const ultima = value.at(-1);
if (!ultima || !(ultima.cotacaoVenda > 0)) throw new Error('BCB não devolveu cotação');

const registro = {
  usdBrl: ultima.cotacaoVenda,
  tipo: 'PTAX de venda',
  data: ultima.dataHoraCotacao.slice(0, 10),
  source: 'Banco Central do Brasil, PTAX',
  url: 'https://www.bcb.gov.br/estabilidadefinanceira/historicocotacoes',
};
await writeFile(new URL('../../app/data/cambio.json', import.meta.url), `${JSON.stringify(registro, null, 2)}\n`);
console.log(`PTAX de venda ${registro.data}: R$ ${registro.usdBrl}`);
