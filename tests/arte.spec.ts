import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import catalog from '../public/art/manifest.json';
import status from '../artwork/status.json';

const directory = join(dirname(fileURLToPath(import.meta.url)), '../public/art');

describe('entrega das ilustrações raster', () => {
  it('preserva as peças mapeadas e registra as novas cenas ainda pendentes', () => {
    const mapped = JSON.parse(readFileSync(join(directory, '../../artwork/catalog-source.json'), 'utf8')) as { id: string }[];
    const ids = catalog.map(item => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of mapped) expect(ids).toContain(item.id);
    for (const family of ['cosmos', 'social', 'brasil', 'mundo']) {
      expect([...ids, ...status.pending]).toContain(`compras-${family}`);
    }
    expect(catalog.filter(item => item.status === 'ready').map(item => item.id)).toEqual(status.ready);
  });

  for (const item of catalog) {
    it(`${item.id}: arquivo válido, dimensões, descrição e versão responsiva`, async () => {
      const file = join(directory, item.file);
      const metadata = await sharp(file).metadata();
      expect(metadata.format).toBe(item.status === 'ready' ? 'webp' : 'svg');
      expect(metadata.width).toBe(item.width);
      expect(metadata.height).toBe(item.height);
      expect(statSync(file).size).toBe(item.bytes);
      expect(item.bytes).toBeLessThan(1_000_000);
      expect(item.alt['pt-BR'].length).toBeGreaterThan(3);
      expect(item.alt.en.length).toBeGreaterThan(3);
      if (item.status === 'ready' && item.width > 640) {
        const small = await sharp(join(directory, `${item.id}-640.webp`)).metadata();
        expect(small.width).toBe(640);
        expect(Math.abs(small.height! / small.width! - item.height / item.width)).toBeLessThan(0.002);
      }
      if ('sources' in item && Array.isArray(item.sources)) {
        const widths = item.sources.map(source => source.width);
        expect(widths).toEqual([...new Set(widths)].sort((a, b) => a - b));
        expect(widths.at(-1)).toBe(item.width);
        for (const source of item.sources) {
          const variant = await sharp(join(directory, source.file)).metadata();
          expect(variant.width).toBe(source.width);
          expect(Math.abs(variant.height! / variant.width! - item.height / item.width)).toBeLessThan(0.002);
        }
        const original = await sharp(join(directory, '../../artwork/originals', item.original!)).metadata();
        expect(item.width).toBeLessThanOrEqual(original.width!);
      }
    });
  }

  it('entrega os cartões sociais e ícones nos tamanhos de publicação', async () => {
    for (const id of ['home', 'manifesto', 'calculadora', 'jornada']) {
      const metadata = await sharp(join(directory, `../og/og-${id}.png`)).metadata();
      expect([metadata.width, metadata.height]).toEqual([1200, 630]);
    }
    for (const size of [192, 512]) {
      const metadata = await sharp(join(directory, `../icone-${size}.png`)).metadata();
      expect([metadata.width, metadata.height]).toEqual([size, size]);
    }
  });
});
