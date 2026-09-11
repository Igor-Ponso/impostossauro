import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import taxData from '../app/data/tax-data.json';
import whatItBuys from '../app/data/what-it-buys.json';
import en from '../app/data/en/what-it-buys.json';

/**
 * O que se tranca aqui é a procedência, não a aritmética: sem o nível
 * declarado, uma estimativa de terceiro (o orçamento do GTA VI, que a Rockstar
 * nunca divulgou) entraria no site como se alguém tivesse pago.
 */
const NIVEIS = ['pago', 'mercado', 'estimativa'];
const total = taxData.currentYear.totalBillions * 1e9;

describe('o que dava para comprar — a procedencia de cada preco', () => {
  it('todo item declara um dos niveis de procedencia', () => {
    for (const item of whatItBuys.items) {
      expect(NIVEIS, `"${item.key}" tem procedencia "${item.provenance}"`).toContain(item.provenance);
    }
  });

  it('todo item tem fonte com link, e o link e https', () => {
    for (const item of whatItBuys.items) {
      expect(item.source.length, `"${item.key}" sem fonte`).toBeGreaterThan(3);
      expect(item.url, `"${item.key}" com url invalida`).toMatch(/^https:\/\//);
    }
  });

  it('nenhum preco e zero, e a moeda e uma das tres convertidas', () => {
    for (const item of whatItBuys.items) {
      expect(item.amount.value, `"${item.key}" com preco zerado`).toBeGreaterThan(0);
      expect(['BRL', 'USD', 'EUR'], `"${item.key}" em moeda sem cotacao`).toContain(item.amount.currency);
    }
  });

  it('o que a Rockstar nunca divulgou entra como estimativa', () => {
    const gta = whatItBuys.items.find((i) => i.key === 'gta6');
    expect(gta?.provenance).toBe('estimativa');
    expect(gta?.detail).toContain('NUNCA');
  });

  it('a base e a mesma do contador, e as contas fecham', () => {
    // 4.109 bi = 3.985 de 2025 × 1,031 do ritmo do painel do Impostômetro.
    // Se a base mudar, este número muda junto, de propósito.
    expect(total).toBe(4_109 * 1e9);
    const twitter = whatItBuys.items.find((i) => i.key === 'twitter')!;
    const vezes = total / (twitter.amount.value * whatItBuys.fx.usdBrl);
    expect(Math.round(vezes)).toBe(18);
  });
});

describe('o que dava para comprar — a familia fisica', () => {
  it('a pilha de moedas usa a espessura que o Banco Central publica', () => {
    const pilha = whatItBuys.physical.find((p) => p.key === 'pilhaMoedas')!;
    expect(pilha.inputs.unitMm).toBe(1.95);
    const km = ((total / pilha.inputs.unitValueBrl) * pilha.inputs.unitMm) / 1e6;
    expect(Math.round(km)).toBe(8_012_550);
    expect(Number((km / pilha.compare.km).toFixed(1))).toBe(20.8);
  });

  it('a fila de cedulas usa o comprimento da nota de R$ 200', () => {
    const fila = whatItBuys.physical.find((p) => p.key === 'filaCedulas')!;
    expect(fila.inputs.unitValueBrl).toBe(200);
    expect(fila.inputs.unitMm).toBe(142);
  });

  it('a distancia da Lua nao esta escrita no componente', () => {
    const fonte = readFileSync('app/components/OQueDavaParaComprar.vue', 'utf-8');
    expect(fonte).not.toContain('384400');
    expect(fonte).not.toContain('384_400');
  });

  it('a circunferencia sai do diametro da NASA, e o dado diz isso', () => {
    expect(whatItBuys.earth.equatorialDiameterKm).toBe(12_756);
    expect(whatItBuys.earth.note).toContain('π');
  });
});

describe('o que dava para comprar — a versao em ingles', () => {
  it('todo item tem rotulo e detalhe traduzidos', () => {
    for (let i = 0; i < whatItBuys.items.length; i += 1) {
      const chaves = en as Record<string, string>;
      expect(chaves[`items[${i}].label`], `item ${i} sem label em ingles`).toBeTruthy();
      expect(chaves[`items[${i}].detail`], `item ${i} sem detail em ingles`).toBeTruthy();
    }
  });

  it('a ressalva de que comprar nao e manter existe nos dois idiomas', () => {
    expect(whatItBuys.caveat).toContain('comprar não é manter');
    expect((en as Record<string, string>).caveat).toContain('buying is not running');
  });
});

describe('o que dava para comprar — o peso da pilha', () => {
  it('a pilha de moedas pesa 28,7 milhoes de toneladas, nao 28,7 mil', () => {
    const peso = whatItBuys.physical.find((p) => p.key === 'pesoMoedas')!;
    expect(peso.inputs.unitG).toBe(7);
    const toneladas = ((total / peso.inputs.unitValueBrl) * peso.inputs.unitG) / 1e6;
    expect(Math.round(toneladas)).toBe(28_763_000);
  });

  it('o componente nao divide as gramas duas vezes', () => {
    const fonte = readFileSync('app/components/OQueDavaParaComprar.vue', 'utf-8');
    expect(fonte).not.toContain('/ 1e6 / 1e3');
  });
});

/**
 * O overlay em ingles e indexado por posicao (`items[9].label`): inserir um
 * item no meio nao quebra nada, so desloca a traducao para o vizinho, em
 * silencio. Reordenar e legitimo, mas obriga a refazer o overlay junto.
 */
const ORDEM = [
  'obrasParadas', 'copa2014', 'abreuLima', 'prosub', 'angra3', 'transnordestina',
  'maneGarrincha', 'maracana', 'petrobras', 'arenaAmazonia', 'tremBala', 'twitter',
  'disney', 'iss', 'apollo', 'jwst', 'chelsea', 'burjKhalifa', 'gta6', 'salvatorMundi',
  'mercedes300slr', 'neymar', 'qatar2022', 'erasTour', 'celtics', 'koru', 'tokyo2020',
  'eurotunel', 'applePark',
];

describe('o que dava para comprar — a ordem trava a traducao', () => {
  it('a lista esta na ordem que o overlay em ingles espera', () => {
    expect(whatItBuys.items.map((i) => i.key)).toEqual(ORDEM);
  });

  it('as familias saem em blocos, e nao intercaladas', () => {
    const familias = whatItBuys.items.map((i) => i.family);
    const blocos = familias.filter((f, i) => f !== familias[i - 1]);
    expect(blocos).toEqual(['brasil', 'mundo']);
  });

  it('a pagina publica pelo menos trinta coisas somando as tres familias', () => {
    const social = Object.keys(taxData.referenceCosts).length;
    expect(social + whatItBuys.items.length + whatItBuys.physical.length).toBeGreaterThanOrEqual(30);
  });
});
