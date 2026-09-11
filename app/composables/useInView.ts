import type { ComponentPublicInstance } from 'vue';

type RefTarget = Element | ComponentPublicInstance | null;

/**
 * O `threshold` vira linha da viewport via `rootMargin`, não fração do elemento:
 * seção mais alta que a tela nunca chega a 25% visível e ficaria oculta no mobile.
 */
export function useInView(threshold = 0.25) {
  const target = ref<RefTarget>(null);
  const inView = ref(false);
  let observer: IntersectionObserver | null = null;

  const resolveElement = (): Element | null => {
    const raw = target.value;
    if (!raw) return null;
    if (raw instanceof Element) return raw;
    const el = (raw as ComponentPublicInstance).$el;
    return el instanceof Element ? el : null;
  };

  onMounted(() => {
    const element = resolveElement();
    if (!element) {
      inView.value = true; // sem alvo: não esconda conteúdo
      return;
    }
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          inView.value = true;
          observer?.disconnect();
        }
      },
      { threshold: 0, rootMargin: `0px 0px -${Math.round(threshold * 100)}% 0px` },
    );
    observer.observe(element);
  });

  onUnmounted(() => observer?.disconnect());

  return { target, inView };
}
