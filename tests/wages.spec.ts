import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * A peça mede o NÍVEL do custo de um mandato — quanto custa hoje, por mês —
 * e não a variação entre dois anos. Nível não depende da janela escolhida,
 * de correção monetária nem de qual régua se aplica. Estes testes travam esse
 * recorte: o total sai da soma dos componentes, sempre do valor corrente.
 */
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const wages = JSON.parse(readFileSync(join(raiz, 'app', 'data', 'wages.json'), 'utf-8')) as {
  level: {
    minimumBrl: number; mandateBrl: number; pocketBrl: number;
    timesTotal: number; timesPocket: number;
  };
  perks: {
    items: Array<{ key: string; brl: number; brlMax?: number; destino: 'bolso' | 'movimenta'; source: string; url: string }>;
    totalMonthlyMin: number; totalMonthlyMax: number; pocketMonthly: number;
    honesty: { text: string }; punch: string;
  };
  steps: Array<{ from: number; brl: number; act: string; source: string; url: string; verified: string }>;
  sources: Array<{ key: string; label: string; url: string }>;
};

const { level, perks } = wages;

describe('o custo de um mandato — o nivel, nao a variacao', () => {
  it('mede o nivel de hoje, e o total sai da soma dos componentes', () => {
    expect(level.mandateBrl).toBeCloseTo(perks.totalMonthlyMin, 2);
    expect(level.pocketBrl).toBeCloseTo(perks.pocketMonthly, 2);
    expect(level.timesTotal).toBeCloseTo(level.mandateBrl / level.minimumBrl, 1);
    expect(level.timesPocket).toBeCloseTo(level.pocketBrl / level.minimumBrl, 1);
  });

  it('um mandato custa mais de cem salarios minimos por mes', () => {
    expect(level.timesTotal).toBeGreaterThan(100);
  });

  it('NAO publica comparacao de variacao — foi ela que nao sobreviveu a regua', () => {
    // Se voltar `window`, `absolute` ou `relative`, a peca voltou a depender de
    // uma janela escolhida por nos. O comentario no topo do arquivo explica.
    const cru = JSON.parse(readFileSync(join(raiz, 'app', 'data', 'wages.json'), 'utf-8'));
    for (const proibido of ['window', 'absolute', 'relative', 'freeze', 'subsidyFreeze']) {
      expect(cru[proibido], `"${proibido}" voltou ao dado`).toBeUndefined();
    }
  });
});

describe('os componentes do custo', () => {
  it('separa o que vai para o bolso do que ele so movimenta', () => {
    const bolso = perks.items.filter((i) => i.destino === 'bolso');
    const movimenta = perks.items.filter((i) => i.destino === 'movimenta');
    expect(bolso.map((i) => i.key).sort()).toEqual(['moradia', 'subsidio']);
    expect(movimenta.map((i) => i.key).sort()).toEqual(['cota', 'gabinete']);
    expect(perks.pocketMonthly).toBeCloseTo(bolso.reduce((s, i) => s + i.brl, 0), 2);
    expect(perks.pocketMonthly).toBeLessThan(perks.totalMonthlyMin / 3);
  });

  it('soma os totais a partir dos itens, sem numero digitado', () => {
    expect(perks.totalMonthlyMin).toBeCloseTo(perks.items.reduce((s, i) => s + i.brl, 0), 2);
    expect(perks.totalMonthlyMax).toBeCloseTo(perks.items.reduce((s, i) => s + (i.brlMax ?? i.brl), 0), 2);
    expect(perks.totalMonthlyMax).toBeGreaterThan(perks.totalMonthlyMin);
  });

  it('o subsidio e menos de um quarto do que o mandato custa', () => {
    const subsidio = perks.items.find((i) => i.key === 'subsidio')!.brl;
    expect(subsidio / perks.totalMonthlyMin).toBeLessThan(0.25);
  });

  it('explica os destinos diferentes do subsídio, gabinete e cota', () => {
    expect(perks.honesty.text).toContain('bolso do parlamentar');
    expect(perks.honesty.text).toContain('verba de gabinete');
    expect(perks.honesty.text).toContain('reembolsa');
  });
});

describe('as fontes', () => {
  it('cada componente aponta para a propria Camara', () => {
    for (const i of perks.items) {
      expect(i.url, i.key).toMatch(/^https:\/\/www2?\.camara\.leg\.br/);
      expect(i.source.length, i.key).toBeGreaterThan(12);
    }
  });

  it('a escada do subsidio traz o ato de cada degrau, com o nivel declarado', () => {
    expect(wages.steps.length).toBeGreaterThanOrEqual(5);
    for (const d of wages.steps) {
      expect(d.url).toMatch(/^https:\/\//);
      expect(['oficial', 'imprensa']).toContain(d.verified);
    }
    // os dois extremos, que sustentam o valor de hoje, sao OFICIAIS
    expect(wages.steps[0]!.verified).toBe('oficial');
    expect(wages.steps.at(-1)!.verified).toBe('oficial');
  });

  it('toda fonte tem rotulo, url https e key unica', () => {
    expect(wages.sources.length).toBeGreaterThanOrEqual(3);
    for (const f of wages.sources) {
      expect(f.label.length, 'fonte sem rotulo').toBeGreaterThan(10);
      expect(f.url).toMatch(/^https:\/\//);
    }
    const keys = wages.sources.map((f) => f.key);
    expect(new Set(keys).size, 'keys duplicadas').toBe(keys.length);
  });

  it('escreve os numeros da prosa na regua do portugues', () => {
    const decimalIngles = /\d+\.\d{1,2}(?![\d-])/;
    for (const texto of [perks.punch, perks.honesty.text]) {
      expect(decimalIngles.test(texto), texto.match(decimalIngles)?.[0]).toBe(false);
    }
  });
});
