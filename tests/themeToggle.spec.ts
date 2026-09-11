import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, unref } from 'vue';
import { mount } from '@vue/test-utils';
import { revealRadius, THEME_STORAGE_KEY } from '~/utils/theme';

/**
 * useTheme.ts usa `ref`/`onMounted` via auto-import do Nuxt (mesmo padrao de
 * useInView.ts). Fora do Nuxt, o vitest nao resolve esses globais sozinho —
 * aqui replicamos manualmente o que o unplugin-auto-import faria em build,
 * e so entao carregamos o composable (import dinamico: um import estatico
 * rodaria antes desta atribuicao, por causa do hoisting de ES modules).
 */
let useTheme: (typeof import('~/composables/useTheme'))['useTheme'];

beforeAll(async () => {
  const vue = await import('vue');
  (globalThis as Record<string, unknown>).ref = vue.ref;
  (globalThis as Record<string, unknown>).onMounted = vue.onMounted;
  ({ useTheme } = await import('~/composables/useTheme'));
});

/** Monta o composable dentro de um componente real, unico jeito dos hooks
 *  (onMounted) funcionarem. */
function montar() {
  const Harness = defineComponent({
    setup: () => useTheme(),
    render: () => null,
  });
  return mount(Harness).vm as unknown as { theme: string; toggle: (origem: HTMLElement) => Promise<void> };
}

/** O círculo nasce no CENTRO do botão, como no Element Plus — não no ponto do clique. */
function botao(left: number, top: number, width = 0, height = 0) {
  return { getBoundingClientRect: () => ({ left, top, width, height }) } as unknown as HTMLElement;
}
const clique = botao;

beforeEach(() => {
  // O `theme` do composable vive no escopo do modulo (uma so instancia para
  // o site inteiro) — sem isso, o valor de um teste vaza para o proximo.
  // montar() dispara onMounted, que resincroniza theme.value a partir do
  // localStorage recem-limpo.
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (document as { startViewTransition?: unknown }).startViewTransition;
  delete (document.documentElement as { animate?: unknown }).animate;
});

describe('useTheme / toggle', () => {
  it('sem suporte a View Transitions: troca o tema e grava no localStorage', async () => {
    // happy-dom nao implementa startViewTransition — e exatamente o cenario
    // real do Firefox, sem precisar simular nada.
    expect(document.startViewTransition).toBeUndefined();

    const vm = montar();
    expect(unref(vm.theme)).toBe('dark');

    await vm.toggle(clique(10, 10));

    expect(unref(vm.theme)).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('escuro remove o atributo data-theme em vez de escrever um valor nele', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    const vm = montar();
    expect(unref(vm.theme)).toBe('light');

    await vm.toggle(clique(10, 10));

    expect(unref(vm.theme)).toBe('dark');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('movimento reduzido: troca direto e NAO chama startViewTransition', async () => {
    const startViewTransition = vi.fn();
    (document as unknown as { startViewTransition: typeof startViewTransition }).startViewTransition =
      startViewTransition;
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: query.includes('prefers-reduced-motion'),
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as MediaQueryList,
    );

    const vm = montar();
    await vm.toggle(clique(10, 10));

    expect(unref(vm.theme)).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(startViewTransition).not.toHaveBeenCalled();
  });

  /** O círculo é CSS: o teste cobra as variáveis e o sentido no `<html>` antes da captura, e a limpeza no fim. */
  it('caminho normal: centro do botao, raio e sentido chegam ao <html> antes da transicao, e saem no fim', async () => {
    window.innerWidth = 1440;
    window.innerHeight = 900;

    const raiz = document.documentElement;
    let vistoDuranteACaptura: Record<string, string | undefined> = {};
    const startViewTransition = vi.fn((callback: () => Promise<void> | void) => {
      // na captura do novo estado o CSS já precisa saber onde e em que sentido animar
      vistoDuranteACaptura = {
        sentido: raiz.dataset.themeTransition,
        x: raiz.style.getPropertyValue('--theme-transition-x'),
        y: raiz.style.getPropertyValue('--theme-transition-y'),
        raio: raiz.style.getPropertyValue('--theme-transition-radius'),
      };
      callback();
      return { ready: Promise.resolve(), finished: Promise.resolve(), updateCallbackDone: Promise.resolve() };
    });
    (document as unknown as { startViewTransition: typeof startViewTransition }).startViewTransition =
      startViewTransition;

    const vm = montar();
    // botão de 36×36 no canto superior direito: o centro dele é a origem
    const origem = botao(1402, 2, 36, 36);
    const x = 1420;
    const y = 20;

    await vm.toggle(origem);

    expect(startViewTransition).toHaveBeenCalledTimes(1);

    const raioReferencia = Math.hypot(1440, 900) / Math.SQRT2;
    expect(vistoDuranteACaptura.sentido).toBe('to-light');
    expect(vistoDuranteACaptura.x).toBe(`${(100 * x) / 1440}%`);
    expect(vistoDuranteACaptura.y).toBe(`${(100 * y) / 900}%`);
    expect(vistoDuranteACaptura.raio).toBe(`${(100 * revealRadius(x, y, 1440, 900)) / raioReferencia}%`);

    // a animacao nao e so preparada: o tema realmente trocou junto
    expect(unref(vm.theme)).toBe('light');
    expect(raiz.dataset.theme).toBe('light');

    // `finished` resolvido: o <html> volta limpo, senão a próxima troca herda o sentido errado
    await Promise.resolve();
    await Promise.resolve();
    expect(raiz.dataset.themeTransition).toBeUndefined();
    expect(raiz.style.getPropertyValue('--theme-transition-x')).toBe('');
  });

  it('voltando ao escuro o sentido e to-dark', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    const raiz = document.documentElement;
    let sentido: string | undefined;
    const startViewTransition = vi.fn((callback: () => Promise<void> | void) => {
      sentido = raiz.dataset.themeTransition;
      callback();
      return { ready: Promise.resolve(), finished: Promise.resolve(), updateCallbackDone: Promise.resolve() };
    });
    (document as unknown as { startViewTransition: typeof startViewTransition }).startViewTransition =
      startViewTransition;

    const vm = montar();
    await vm.toggle(botao(10, 10));

    expect(sentido).toBe('to-dark');
    expect(unref(vm.theme)).toBe('dark');
  });

  it('excecao do localStorage (armazenamento bloqueado) nao impede a troca de tema', async () => {
    // vi.spyOn(Storage.prototype, ...) nao e confiavel aqui: o localStorage
    // do happy-dom e um Proxy que, uma vez acessado (e os testes acima ja
    // acessaram), deixa de rotear pelo prototype - o spy fica mudo e o
    // teste passaria mesmo sem o try/catch do composable existir. Trocar o
    // objeto inteiro evita essa armadilha (confirmado: sem essa troca, este
    // teste continuava verde mesmo com o try/catch removido do composable).
    const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
    const storageBloqueado = {
      setItem: () => {
        throw new DOMException('armazenamento bloqueado');
      },
      getItem: () => null,
      removeItem: () => {},
      clear: () => {},
    };
    Object.defineProperty(window, 'localStorage', { configurable: true, value: storageBloqueado });
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storageBloqueado });

    try {
      const vm = montar();
      await vm.toggle(clique(10, 10));

      expect(unref(vm.theme)).toBe('light');
      expect(document.documentElement.dataset.theme).toBe('light');
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(window, 'localStorage', originalDescriptor);
        Object.defineProperty(globalThis, 'localStorage', originalDescriptor);
      }
    }
  });
});
