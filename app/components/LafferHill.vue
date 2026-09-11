<script setup lang="ts">
const { t } = useI18n();
const { app } = useRuntimeConfig();
const hillClipId = `morro-${useId()}`;

const rate = ref(32);

const W = 640;
const H = 300;
const M = { top: 100, right: 44, bottom: 44, left: 44 };

/** Curva ilustrativa: o topo em 50% é desenho, não medida. */
function revenue(pct: number) {
  const r = pct / 100;
  return r * (1 - r) * 4; // normalizada: pico 1.0 em 50%
}

const x = (pct: number) => M.left + (pct / 100) * (W - M.left - M.right);
const y = (value: number) => H - M.bottom - value * (H - M.top - M.bottom);

const hillPath = (() => {
  const points: string[] = [];
  for (let pct = 0; pct <= 100; pct += 2) {
    points.push(`${points.length === 0 ? 'M' : 'L'} ${x(pct).toFixed(1)} ${y(revenue(pct)).toFixed(1)}`);
  }
  return points.join(' ');
})();

const fillPath = `${hillPath} L ${x(100)} ${y(0)} L ${x(0)} ${y(0)} Z`;

const currentRevenue = computed(() => revenue(rate.value));
const dinoX = computed(() => x(rate.value));
const dinoY = computed(() => y(currentRevenue.value));

const zone = computed(() => {
  if (rate.value <= 35) return 'low';
  if (rate.value <= 65) return 'top';
  return 'high';
});

const zoneText = computed(() => t(`laffer.zones.${zone.value}`));
const dinoMood = computed(() =>
  zone.value === 'top' ? 'greedy' : zone.value === 'high' ? 'hungry' : 'happy',
);
</script>

<template>
  <div class="glass rounded-3xl p-5 sm:p-7">
    <div class="flex flex-wrap items-baseline justify-between gap-3">
      <h3 class="font-display text-ink text-xl font-bold sm:text-2xl">
        {{ t('laffer.chartTitle') }}
      </h3>
      <p class="tabular text-dino text-lg font-bold">
        {{ t('laffer.rateLabel') }}: {{ rate }}%
      </p>
    </div>

    <div class="mt-4 overflow-x-auto" tabindex="0" role="region" :aria-label="t('laffer.alt')">
      <svg :viewBox="`0 0 ${W} ${H}`" class="min-w-[480px]" role="img" :aria-label="t('laffer.alt')">
        <!-- ART: economia-morro · o terreno segue a curva ilustrativa e o mascote acompanha o controle -->
        <defs><clipPath :id="hillClipId"><path :d="fillPath" /></clipPath></defs>
        <g :clip-path="`url(#${hillClipId})`">
          <image :href="`${app.baseURL}art/${arteCatalogo['economia-morro']!.file}`" width="640" height="300" preserveAspectRatio="xMidYMid slice" />
        </g>
        <path :d="hillPath" fill="none" stroke="var(--color-chart-visible)" stroke-width="2.5" stroke-linecap="round" />

        <line :x1="M.left" :x2="W - M.right" :y1="y(0)" :y2="y(0)" stroke="var(--color-line)" stroke-width="1.5" />
        <text :x="x(0)" :y="y(0) + 18" font-size="11" fill="var(--color-ink-dim)">0%</text>
        <text :x="x(50)" :y="y(0) + 18" text-anchor="middle" font-size="11" fill="var(--color-ink-dim)">50%</text>
        <text :x="x(100)" :y="y(0) + 18" text-anchor="end" font-size="11" fill="var(--color-ink-dim)">100%</text>
        <text :x="x(0)" :y="y(0) + 34" font-size="10" fill="var(--color-ink-dim)">{{ t('laffer.axisZero') }}</text>
        <text :x="x(100)" :y="y(0) + 34" text-anchor="end" font-size="10" fill="var(--color-ink-dim)">{{ t('laffer.axisHundred') }}</text>

        <line :x1="x(50)" :x2="x(50)" :y1="y(1)" :y2="y(0)" stroke="var(--color-money)" stroke-width="1" stroke-dasharray="4 4" opacity="0.4" />
        <text :x="x(50)" :y="y(1) - 84" text-anchor="middle" font-size="11" fill="var(--color-money)">
          {{ t('laffer.peakLabel') }}
        </text>

        <line :x1="dinoX" :x2="dinoX" :y1="dinoY" :y2="y(0)" stroke="var(--color-chart-hidden)" stroke-width="1.5" opacity="0.6" />
        <circle :cx="dinoX" :cy="dinoY" r="7" fill="var(--color-chart-hidden)" stroke="var(--color-abyss)" stroke-width="2" />
        <g :transform="`translate(${dinoX - 40} ${dinoY - 70})`">
          <DinoMascot :mood="dinoMood" width="80" height="70" />
        </g>
      </svg>
    </div>

    <input
      v-model.number="rate"
      type="range"
      min="0"
      max="100"
      step="1"
      class="accent-dino mt-2 w-full"
      :aria-label="t('laffer.rateLabel')"
    >

    <div class="mt-4 flex items-start gap-4">
      <DinoMascot :mood="dinoMood" class="w-14 shrink-0" />
      <p class="text-ink leading-relaxed">{{ zoneText }}</p>
    </div>

    <p class="text-ink-dim mt-4 text-xs leading-relaxed">
      {{ t('laffer.chartNote') }}
    </p>
  </div>
</template>
