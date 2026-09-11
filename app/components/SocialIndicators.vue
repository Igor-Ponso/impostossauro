<script setup lang="ts">
import socialHistoryPt from '~/data/social-history.json';
const SpotlightCard = defineAsyncComponent(
  () => import('~/components/vb/SpotlightCard/SpotlightCard.vue'),
);

const { t, locale } = useI18n();

const socialHistory = dadoNoIdioma('social-history.json', socialHistoryPt, locale.value);

interface IndicatorPoint {
  year: number;
  value: number;
  source: string;
  url: string;
}

interface Indicator {
  key: string;
  unit: string;
  direction: 'up' | 'down';
  points: IndicatorPoint[];
  note?: string;
}

const indicators = (socialHistory.indicators as Indicator[])
  .map((indicator) => ({
    ...indicator,
    points: indicator.points.slice().sort((a, b) => a.year - b.year),
  }))
  .filter((indicator) => indicator.points.length >= 2);

const hovered = ref<Record<string, IndicatorPoint | null>>({});

const W = 260;
const H = 64;
const PAD = 6;

function sparkline(indicator: Indicator) {
  const points = indicator.points;
  const years = points.map((point) => point.year);
  const values = points.map((point) => point.value);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const spanYear = Math.max(1, maxYear - minYear);
  const spanValue = Math.max(1e-9, maxValue - minValue);
  const x = (year: number) => PAD + ((year - minYear) / spanYear) * (W - PAD * 2);
  const y = (value: number) => H - PAD - ((value - minValue) / spanValue) * (H - PAD * 2);
  return {
    path: points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point.year).toFixed(1)} ${y(point.value).toFixed(1)}`)
      .join(' '),
    dots: points.map((point) => ({ point, cx: x(point.year), cy: y(point.value) })),
  };
}

function formatValue(indicator: Indicator, value: number) {
  const formatted = value.toLocaleString(locale.value, { maximumFractionDigits: 1 });
  return indicator.unit === '%' ? `${formatted}%` : formatted;
}

function improved(indicator: Indicator) {
  const first = indicator.points[0]!.value;
  const last = indicator.points.at(-1)!.value;
  return indicator.direction === 'up' ? last > first : last < first;
}

interface GdpEra {
  period: string;
  label: string;
  avg: string;
  source: string;
  url: string;
}

const gdpEras = socialHistory.gdpEras as GdpEra[];
</script>

<template>
  <div v-if="indicators.length" class="space-y-6">
    <div class="grid gap-4 sm:grid-cols-2">
      <article v-for="indicator in indicators" :key="indicator.key" class="glass rounded-3xl p-5 sm:p-6">
        <div class="flex items-baseline justify-between gap-3">
          <h3 class="font-display text-ink font-bold">
            {{ t(`indicators.items.${indicator.key}`) }}
          </h3>
          <span class="text-ink-dim text-xs">{{ t(`indicators.units.${indicator.key}`) }}</span>
        </div>

        <div class="tabular mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span class="text-ink-dim text-sm">
            <b class="text-ink text-lg">{{ formatValue(indicator, indicator.points[0]!.value) }}</b>
            <span class="ml-1">({{ indicator.points[0]!.year }})</span>
          </span>
          <span class="text-ink-dim" aria-hidden="true">→</span>
          <span class="text-sm" :class="improved(indicator) ? 'text-chart-visible' : 'text-alert'">
            <b class="text-lg">{{ formatValue(indicator, indicator.points.at(-1)!.value) }}</b>
            <span class="ml-1">({{ indicator.points.at(-1)!.year }})</span>
          </span>
        </div>

        <svg :viewBox="`0 0 ${W} ${H}`" class="mt-3 w-full" role="img" :aria-label="t(`indicators.items.${indicator.key}`)">
          <path
            :d="sparkline(indicator).path"
            fill="none"
            :stroke="improved(indicator) ? 'var(--color-chart-visible)' : 'var(--color-chart-net)'"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <g v-for="dot in sparkline(indicator).dots" :key="dot.point.year">
            <circle
              :cx="dot.cx"
              :cy="dot.cy"
              r="8"
              fill="transparent"
              class="cursor-pointer"
              @mouseenter="hovered[indicator.key] = dot.point"
              @mouseleave="hovered[indicator.key] = null"
              @click="hovered[indicator.key] = hovered[indicator.key]?.year === dot.point.year ? null : dot.point"
            />
            <circle
              :cx="dot.cx"
              :cy="dot.cy"
              :r="hovered[indicator.key]?.year === dot.point.year ? 4 : 2.5"
              :fill="improved(indicator) ? 'var(--color-chart-visible)' : 'var(--color-chart-net)'"
              stroke="var(--color-abyss)"
              stroke-width="1"
              pointer-events="none"
            />
          </g>
        </svg>

        <div class="mt-2 min-h-8 text-xs">
          <template v-if="hovered[indicator.key]">
            <span class="tabular text-ink font-bold">{{ hovered[indicator.key]!.year }}</span>
            <span class="tabular text-ink ml-2 font-bold">{{ formatValue(indicator, hovered[indicator.key]!.value) }}</span>
            <a
              :href="hovered[indicator.key]!.url"
              target="_blank"
              rel="noopener"
              class="text-ink-dim hover:text-dino ml-2 underline underline-offset-4"
            >
              {{ hovered[indicator.key]!.source }}
            </a>
          </template>
          <span v-else class="text-ink-dim">{{ t('indicators.hint') }}</span>
        </div>

        <p v-if="indicator.note" class="text-ink-dim mt-2 text-xs leading-relaxed">
          {{ indicator.note }}
        </p>
      </article>
    </div>

    <SpotlightCard
      v-if="gdpEras.length"
      class="glass !rounded-3xl !p-5 sm:!p-7"
      spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
    >
      <h3 class="font-display text-ink text-xl font-bold sm:text-2xl">
        {{ t('indicators.gdpTitle') }}
      </h3>
      <p class="text-ink-dim mt-2 text-sm leading-relaxed sm:text-base">
        {{ t('indicators.gdpIntro') }}
      </p>
      <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="era in gdpEras" :key="era.period" class="bg-abyss/60 border-line rounded-2xl border p-4">
          <p class="text-ink-dim text-xs font-semibold tracking-wider uppercase">{{ era.period }}</p>
          <p class="tabular font-display text-ink mt-1 text-2xl font-bold">{{ era.avg }}</p>
          <p class="text-ink-dim mt-1 text-sm leading-relaxed">{{ era.label }}</p>
          <a
            :href="era.url"
            target="_blank"
            rel="noopener"
            class="text-ink-dim hover:text-dino mt-2 inline-block text-xs underline underline-offset-4"
          >
            {{ t('equivalences.sourcePrefix') }}: {{ era.source }}
          </a>
        </div>
      </div>
    </SpotlightCard>
  </div>
</template>
