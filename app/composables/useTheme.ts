import { nextTick } from 'vue';
import { resolveTheme, revealRadius, THEME_STORAGE_KEY, type Theme } from '~/utils/theme';

/** Fora da função para que todos os componentes compartilhem o mesmo estado. */
const theme = ref<Theme>('dark');

export function useTheme() {
  onMounted(() => {
    try {
      theme.value = resolveTheme(localStorage.getItem(THEME_STORAGE_KEY));
    } catch {
      theme.value = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    }
  });

  function apply(next: Theme) {
    theme.value = next;
    // Escuro é a ausência do atributo: o `:root` do CSS segue sendo o padrão.
    if (next === 'light') document.documentElement.dataset.theme = 'light';
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // armazenamento bloqueado: a troca vale só para a sessão
    }
  }

  /** Como no Element Plus: origem no centro do botão, círculo em CSS (`theme-change`, main.css). */
  let ultimaTransicao = 0;

  async function toggle(origem: HTMLElement) {
    const next: Theme = theme.value === 'dark' ? 'light' : 'dark';

    const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (semMovimento || !document.startViewTransition) {
      apply(next);
      return;
    }

    const caixa = origem.getBoundingClientRect();
    const x = caixa.left + caixa.width / 2;
    const y = caixa.top + caixa.height / 2;
    const largura = window.innerWidth;
    const altura = window.innerHeight;
    const raio = revealRadius(x, y, largura, altura);
    // `circle(r%)` em CSS mede r contra hypot(largura, altura) / √2.
    const raioDeReferencia = Math.hypot(largura, altura) / Math.SQRT2;

    const raiz = document.documentElement;
    const minhaTransicao = ++ultimaTransicao;
    raiz.dataset.themeTransition = next === 'dark' ? 'to-dark' : 'to-light';
    raiz.style.setProperty('--theme-transition-x', `${(100 * x) / largura}%`);
    raiz.style.setProperty('--theme-transition-y', `${(100 * y) / altura}%`);
    raiz.style.setProperty('--theme-transition-radius', `${(100 * raio) / raioDeReferencia}%`);

    const transicao = document.startViewTransition(async () => {
      apply(next);
      await nextTick();
    });

    transicao.finished.finally(() => {
      if (minhaTransicao !== ultimaTransicao) return;
      delete raiz.dataset.themeTransition;
      raiz.style.removeProperty('--theme-transition-x');
      raiz.style.removeProperty('--theme-transition-y');
      raiz.style.removeProperty('--theme-transition-radius');
    });
  }

  return { theme, toggle };
}
