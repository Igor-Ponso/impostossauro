import { readFile, writeFile, mkdir, stat, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = resolve(root, 'artwork/originals');
const output = resolve(root, 'public/art');
const catalog = JSON.parse(await readFile(resolve(root, 'artwork/catalog-source.json'), 'utf8'));
const extra = [
  ['jornada-ciclo', 'Brasileiros de diferentes idades comparam holerite, recibos e documentos de patrimônio enquanto o Impostossauro, escondido sob a mesa, pega notas do envelope.', 'Brazilians of different ages compare a payslip, receipts and property documents while Impostossauro hides under the table and takes banknotes from an envelope.'],
  ['compras-cosmos', 'Um arco de moedas liga o Brasil à Lua em uma cena espacial ilustrada.', 'An arc of coins links Brazil to the Moon in an illustrated space scene.'],
  ['compras-social', 'Uma cidade reúne escolas, saúde, moradia, alimentação e espaços públicos.', 'A city brings together schools, healthcare, housing, food and public spaces.'],
  ['compras-brasil', 'Panorama ilustrado de infraestrutura brasileira, com barragem, ponte, transporte e cidade.', 'An illustrated panorama of Brazilian infrastructure, with a dam, bridge, transit and city.'],
  ['compras-mundo', 'Navio, arranha-céus e exploração espacial ilustram a escala dos grandes projetos.', 'A ship, skyscrapers and space exploration illustrate the scale of megaprojects.'],
  ['conferencia-fontes', 'Uma cidadã confere um documento de gastos públicos e compartilha o registro com o link da fonte.', 'A citizen checks a public spending document and shares the record with its source link.'],
  ['escala-lua', 'Moedas empilhadas e notas enfileiradas ligam a Terra à Lua em uma comparação ilustrativa de distâncias.', 'Stacked coins and end-to-end banknotes connect Earth to the Moon in an illustrative distance comparison.'],
  ['escala-terra', 'Uma longa pilha de moedas contorna a Terra na linha do equador; ilustração sem escala.', 'A long stack of coins wraps around Earth at the equator; illustration not to scale.'],
  ['escala-peso', 'Uma montanha de moedas ao lado de estruturas da Torre Eiffel ilustra uma comparação de peso.', 'A mountain of coins beside Eiffel Tower structures illustrates a weight comparison.'],
];
for (const [id, pt, en] of extra) catalog.push({ id, kind: 'scene', alt: { 'pt-BR': pt, en } });
const aliases = {
  'jornada-ghost': 'jornada-ghost-mesa-diverso',
  'jornada-payslip': 'jornada-payslip-diverso',
  'jornada-spend': 'jornada-spend-diverso',
  'jornada-save': 'jornada-save-diverso',
  'jornada-house': 'jornada-house-diverso',
  'jornada-inherit': 'jornada-inherit-diverso',
  'escala-terra': 'escala-terra-refino',
  'dino-mascote': 'dino-mascote-happy',
  'impostossauro-cidade': 'impostossauro-cidade',
  'calculadora-calendario': 'calculadora-calendario',
  'calculadora-calendario-mobile': 'calculadora-calendario',
  'social-home': 'impostossauro-cidade',
  'social-manifesto': 'parabola-ac-3',
  'social-calculadora': 'calculadora-calendario',
  'social-jornada': 'jornada-ghost-diverso',
};
const missing = [];
for (const item of catalog) {
  try { await access(resolve(source, `${aliases[item.id] || item.id}.png`)); }
  catch { missing.push(item.id); }
}
// Uma peça ainda em produção não pode impedir a publicação das que já existem.
// Preserve os SVGs anteriores como fallback explícito; nunca invente um URL WebP.
const pending = [];
await mkdir(output, { recursive: true });
const result = [];
for (const entry of catalog) {
  const id = entry.id;
  if (missing.includes(id)) {
    pending.push(id);
    const file = `${id}.svg`;
    try {
      await access(resolve(output, file));
      result.push({ ...entry, file, bytes: (await stat(resolve(output, file))).size, status: 'pending', original: null });
    } catch {
      // Peças novas sem original nem versão anterior não são publicadas ainda.
    }
    continue;
  }
  const original = `${aliases[id] || id}.png`;
  const input = resolve(source, original);
  const isSocial = id.startsWith('social-');
  const isJourney = id.startsWith('jornada-');
  let pipeline = sharp(input);
  if (isSocial) pipeline = pipeline.resize(1200, 630, { fit: 'cover', position: sharp.strategy.attention });
  else {
    const width = id === 'sistema-nao' || id === 'sistema-sim'
      ? 640
      : id.startsWith('sistema-') || id === 'dino-cabecalho' ? 320 : isJourney ? 3072 : 1600;
    pipeline = pipeline.resize({ width, withoutEnlargement: true });
  }
  const path = resolve(output, `${id}.webp`);
  const info = await pipeline.webp({ quality: isJourney ? 92 : 88, effort: 6 }).toFile(path);
  const alt = { ...entry.alt };
  if (id.startsWith('dino-')) {
    alt['pt-BR'] = id === 'dino-cabecalho' ? 'Rosto do Impostossauro, dinossauro verde fofinho de gravata azul.' : `Impostossauro, dinossauro verde fofinho de gravata azul${id.endsWith('greedy') ? ', abraçando moedas' : id.endsWith('hungry') ? ', com fome e a mão na barriga' : ', sorrindo e dando boas-vindas'}.`;
    alt.en = id === 'dino-cabecalho' ? 'Portrait of Impostossauro, a cute green dinosaur wearing a blue tie.' : `Impostossauro, a cute green dinosaur wearing a blue tie${id.endsWith('greedy') ? ', hugging coins' : id.endsWith('hungry') ? ', hungry with a hand on his belly' : ', smiling in welcome'}.`;
  }
  if (id === 'inflacao-nota') {
    alt['pt-BR'] = 'Cédula retangular azul ilustrada, com efígie da República, arabescos e valor 100.';
    alt.en = 'An illustrated rectangular blue banknote with a Republic effigy, ornamental engraving and denomination 100.';
  }
  if (id.startsWith('calculadora-calendario')) {
    alt['pt-BR'] = 'Trabalhador exausto diante de contas e um calendário riscado, enquanto o Impostossauro recolhe suas moedas.';
    alt.en = 'An exhausted worker faces bills and a crossed-out calendar while Impostossauro collects his coins.';
  }
  if (id === 'impostossauro-cidade') {
    alt['pt-BR'] = 'Uma família preocupada com as contas e a carteira vazia, enquanto o Impostossauro acumula suas moedas sobre Brasília.';
    alt.en = 'A family worries over bills and an empty wallet while Impostossauro accumulates their coins above Brasília.';
  }
  if (isJourney && original.endsWith('-diverso.png')) {
    const descriptions = {
      'jornada-ghost': ['Na oficina, empregadora e trabalhador conferem a folha enquanto o Impostossauro contorna a borda da mesa com o braço e pega parte do dinheiro antes do salário.', 'In a workshop, an employer and worker review payroll while Impostossauro reaches around the edge of the desk and takes some money before it becomes wages.'],
      'jornada-payslip': ['Uma trabalhadora confere o holerite enquanto o Impostossauro, atrás da cadeira, retira notas do envelope do salário e esconde moedas.', 'A worker checks her payslip while Impostossauro reaches from behind her chair to take banknotes from the wage envelope and conceal coins.'],
      'jornada-spend': ['No caixa do mercado, uma consumidora confere as compras enquanto o Impostossauro pega discretamente parte do pagamento.', 'At a supermarket checkout, a shopper checks her groceries while Impostossauro discreetly takes part of the payment.'],
      'jornada-save': ['Um investidor confere o extrato enquanto o Impostossauro pega uma moeda do pequeno broto que representa o rendimento, deixando a poupança na base.', 'An investor checks his statement while Impostossauro takes a coin from a small sprout representing returns, leaving the savings at the base.'],
      'jornada-house': ['Um casal confere documentos e cobranças da casa e do carro enquanto o Impostossauro, escondido perto da entrada, pega moedas do orçamento.', 'A couple checks paperwork and bills for their home and car while Impostossauro hides near the entrance and takes coins from their budget.'],
      'jornada-inherit': ['Mãe e filha organizam documentos, chaves e lembranças de família enquanto o Impostossauro retira parte da herança, escondido atrás de uma cadeira vazia.', 'A mother and daughter sort documents, keys and family keepsakes while Impostossauro takes part of the inheritance from behind an empty chair.'],
    };
    [alt['pt-BR'], alt.en] = descriptions[id];
  }
  if (id.startsWith('social-')) {
    const descriptions = {
      'social-home': ['Uma família pressionada pelas contas enquanto o Impostossauro acumula o dinheiro.', 'A family under pressure from bills while Impostossauro accumulates the money.'],
      'social-manifesto': ['O Impostossauro apresenta dois aparelhos, enquanto o ar escapa pelo buraco na parede.', 'Impostossauro presents two air conditioners while cool air escapes through a hole in the wall.'],
      'social-calculadora': ['Trabalhador exausto, contas e dias riscados enquanto o Impostossauro recolhe suas moedas.', 'An exhausted worker, bills and crossed-out days while Impostossauro collects his coins.'],
      'social-jornada': ['O Impostossauro pega dinheiro sob a mesa da oficina antes de o salário chegar ao trabalhador.', 'Impostossauro takes money under a workshop desk before the wages reach the worker.'],
    };
    [alt['pt-BR'], alt.en] = descriptions[id];
  }
  const item = { id, file: `${id}.webp`, width: info.width, height: info.height, bytes: (await stat(path)).size, kind: entry.kind === 'icon' ? 'vignette' : entry.kind, original, status: 'ready', alt };
  if (isJourney) {
    // Exporta do PNG para evitar uma segunda compressão. Nunca amplia um original.
    const sources = [];
    for (const width of [640, 960, 1280, 2048].filter(width => width < info.width)) {
      const file = `${id}-${width}.webp`;
      await sharp(input).resize(width).webp({ quality: 92, effort: 6 }).toFile(resolve(output, file));
      sources.push({ file, width });
    }
    sources.push({ file: item.file, width: info.width });
    item.sources = sources;
  } else if (info.width > 640) await sharp(path).resize(640).webp({ quality: 86, effort: 6 }).toFile(resolve(output, `${id}-640.webp`));
  result.push(item);
}
await writeFile(resolve(output, 'manifest.json'), JSON.stringify(result, null, 2) + '\n');
const metadata = Object.fromEntries(result.map(({ id, file, width, height, status, alt, sources }) => [id, { file, width, height, status, alt, ...(sources ? { sources } : {}) }]));
await writeFile(resolve(root, 'app/utils/arteCatalogo.ts'), '// Gerado por scripts/arte/gerar.mjs; somente arquivos existentes.\nexport interface ArteDoSite { file: string; width: number; height: number; status: string; sources?: { file: string; width: number }[]; alt: { \'pt-BR\': string; en: string } }\nexport const arteCatalogo: Record<string, ArteDoSite> = ' + JSON.stringify(metadata, null, 2) + ';\n');
await writeFile(resolve(root, 'artwork/status.json'), JSON.stringify({ ready: result.filter(item => item.status === 'ready').map(item => item.id), pending }, null, 2) + '\n');
console.log(`${result.filter(item => item.status === 'ready').length} artes raster exportadas; ${pending.length} posições aguardam geração. Fallbacks existentes preservados.`);
