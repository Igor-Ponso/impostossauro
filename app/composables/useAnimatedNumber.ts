import type { Ref } from 'vue';

export function useAnimatedNumber(source: Ref<number>, durationMs = 500) {
  const animated = ref(source.value);
  let rafId = 0;

  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  watch(source, (target) => {
    const from = animated.value;
    const start = performance.now();
    cancelAnimationFrame(rafId);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animated.value = target;
      return;
    }

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      animated.value = from + (target - from) * easeOutCubic(t);
      if (t < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
  });

  onUnmounted(() => cancelAnimationFrame(rafId));

  return animated;
}
