import taxData from '~/data/tax-data.json';
import { passouOIntervalo } from '~/utils/relogio';

export function useTaxClock() {
  const { year, totalBillions } = taxData.currentYear;

  const now = ref(new Date());
  const sessionStart = new Date();
  let rafId = 0;
  let ultimo: number | null = null;

  /** Sem o intervalo, o herói re-renderiza na taxa do monitor (120 Hz em ProMotion). */
  const tick = (agora: number) => {
    rafId = requestAnimationFrame(tick);
    if (!passouOIntervalo(ultimo, agora)) return;
    ultimo = agora;
    now.value = new Date();
  };

  const aoTrocarDeVisibilidade = () => {
    cancelAnimationFrame(rafId);
    if (!document.hidden) {
      ultimo = null;
      now.value = new Date();
      rafId = requestAnimationFrame(tick);
    }
  };

  onMounted(() => {
    rafId = requestAnimationFrame(tick);
    document.addEventListener('visibilitychange', aoTrocarDeVisibilidade);
  });

  onUnmounted(() => {
    cancelAnimationFrame(rafId);
    document.removeEventListener('visibilitychange', aoTrocarDeVisibilidade);
  });

  const amount = computed(() => collectedThisYear(totalBillions, now.value));
  const perSecond = perSecondRate(totalBillions, year);

  const sinceArrival = computed(
    () => Math.max(0, (now.value.getTime() - sessionStart.getTime()) / 1000) * perSecond,
  );

  return { amount, perSecond, sinceArrival, year };
}
