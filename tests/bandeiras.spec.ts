import { describe, expect, it } from 'vitest';
import { BANDEIRAS, bandeiraDe } from '~/utils/bandeiras';
import world from '../app/data/world.json';

describe('bandeiras', () => {
  it('tem uma para cada um dos 30 paises, e nenhuma sobrando', () => {
    const isos = world.paises.map((p) => p.iso);
    for (const iso of isos) {
      expect(BANDEIRAS[iso], `falta bandeira de ${iso}`).toBeTruthy();
    }
    expect(Object.keys(BANDEIRAS).sort()).toEqual([...isos].sort());
  });

  it('marca a bandeira como decorativa', () => {
    // Sem aria-hidden o leitor de tela anuncia "imagem" antes de cada item da lista.
    const svg = bandeiraDe('BRA');
    expect(svg).toContain('aria-hidden="true"');
    expect(svg).toContain('focusable="false"');
  });

  it('gera SVG que o navegador consegue interpretar', () => {
    // Bandeira com SVG invalido nao derruba nada: so some da tela em silencio.
    for (const iso of Object.keys(BANDEIRAS)) {
      const doc = new DOMParser().parseFromString(bandeiraDe(iso), 'image/svg+xml');
      expect(doc.querySelector('parsererror'), `${iso} gera SVG invalido`).toBeNull();
      const svg = doc.querySelector('svg');
      expect(svg, `${iso} nao produz elemento svg`).not.toBeNull();
      expect(
        svg!.querySelectorAll('rect, circle, path, g').length,
        `${iso} nao desenha forma nenhuma`,
      ).toBeGreaterThan(0);
    }
  });

  it('devolve string vazia para pais desconhecido, sem quebrar', () => {
    expect(bandeiraDe('XXX')).toBe('');
  });

  it('nao usa emoji em nenhuma bandeira', () => {
    const emoji = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    for (const [iso, corpo] of Object.entries(BANDEIRAS)) {
      expect(emoji.test(corpo), `${iso} usa emoji`).toBe(false);
    }
  });
});
