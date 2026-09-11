<script setup lang="ts">
import taxData from '~/data/tax-data.json';

/**
 * O nível do título é do documento: `h3` dentro da seção da home, `h2` na
 * /inflacao, onde é a única série da seção.
 */
const props = withDefaults(defineProps<{ nivelDoTitulo?: 'h2' | 'h3' }>(), { nivelDoTitulo: 'h3' });

const { t } = useI18n();

const START = 2010;
const END = 2025;

const filled = fillRevenueSeries(taxData.revenueSeries, taxData.currentYear);
const base = filled.find((entry) => entry.year === START)!.totalBillions;

const years = Array.from({ length: END - START + 1 }, (_, index) => START + index);

const revenueIndex = years.map((year) => {
  const entry = filled.find((item) => item.year === year)!;
  return {
    year,
    value: (entry.totalBillions / base) * 100,
    // O Impostômetro divulga marcos, não um valor por ano; o resto é interpolado
    // e não pode ser desenhado como ponto medido.
    measured: !entry.interpolated && !entry.estimate,
  };
});
const measuredPoints = computed(() => revenueIndex.filter((point) => point.measured));
const priceIndex = years.map((year) => ({
  year,
  value: year === START ? 100 : inflationFactor(taxData.ipcaSeries, START + 1, year) * 100,
}));

const W = 640;
const H = 360;
const M = { top: 24, right: 118, bottom: 34, left: 44 };
const maxValue = Math.max(...revenueIndex.map((point) => point.value)) * 1.06;

const x = (year: number) =>
  M.left + ((year - START) / (END - START)) * (W - M.left - M.right);
const y = (value: number) =>
  H - M.bottom - ((value - 80) / (maxValue - 80)) * (H - M.top - M.bottom);

const toPath = (series: Array<{ year: number; value: number }>) =>
  series.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point.year).toFixed(1)} ${y(point.value).toFixed(1)}`).join(' ');

const revenuePath = toPath(revenueIndex);
const pricePath = toPath(priceIndex);

const ticks = [100, 150, 200, 250, 300];
const lastRevenue = revenueIndex.at(-1)!;
const lastPrice = priceIndex.at(-1)!;

const hoverYear = ref<number | null>(null);
function onMove(event: MouseEvent) {
  const svg = event.currentTarget as SVGSVGElement;
  const rect = svg.getBoundingClientRect();
  const px = ((event.clientX - rect.left) / rect.width) * W;
  const year = Math.round(START + ((px - M.left) / (W - M.left - M.right)) * (END - START));
  hoverYear.value = year >= START && year <= END ? year : null;
}
const hover = computed(() => {
  if (hoverYear.value === null) return null;
  return {
    year: hoverYear.value,
    revenue: revenueIndex.find((point) => point.year === hoverYear.value)!.value,
    price: priceIndex.find((point) => point.year === hoverYear.value)!.value,
  };
});
</script>

<template>
  <div class="glass rounded-3xl p-5 sm:p-7">
    <component :is="props.nivelDoTitulo" class="font-display text-ink text-xl font-bold sm:text-2xl">
      {{ t('historyChart.title') }}
    </component>
    <p class="text-ink-dim mt-2 text-sm leading-relaxed sm:text-base">
      {{
        t('historyChart.subtitle', {
          revenue: Math.round(lastRevenue.value - 100),
          prices: Math.round(lastPrice.value - 100),
        })
      }}
    </p>

    <div class="mt-5 overflow-x-auto" tabindex="0" role="region" :aria-label="t('historyChart.alt')">
      <svg
        :viewBox="`0 0 ${W} ${H}`"
        class="min-w-[520px]"
        role="group"
        :aria-label="t('historyChart.alt')"
        @mousemove="onMove"
        @mouseleave="hoverYear = null"
      >
        <rect
          :x="x(PANDEMIA.from)"
          :y="M.top"
          :width="x(PANDEMIA.to) - x(PANDEMIA.from)"
          :height="H - M.top - M.bottom"
          fill="var(--color-alert)"
          opacity="0.13"
        />
        <text
          :x="(x(PANDEMIA.from) + x(PANDEMIA.to)) / 2"
          :y="H - M.bottom - 6"
          text-anchor="middle"
          font-size="9"
          fill="var(--color-alert)"
          letter-spacing="1"
        >
          {{ t('pandemia.label') }}
        </text>

        <g v-for="tick in ticks" :key="tick">
          <line :x1="M.left" :x2="W - M.right" :y1="y(tick)" :y2="y(tick)" stroke="var(--color-line)" stroke-width="1" />
          <text :x="M.left - 8" :y="y(tick) + 4" text-anchor="end" font-size="11" fill="var(--color-ink-dim)" class="tabular">
            {{ tick }}
          </text>
        </g>
        <g v-for="year in [2010, 2013, 2016, 2019, 2022, 2025]" :key="year">
          <text :x="x(year)" :y="H - M.bottom + 20" text-anchor="middle" font-size="11" fill="var(--color-ink-dim)" class="tabular">
            {{ year }}
          </text>
        </g>

        <line
          v-if="hover"
          :x1="x(hover.year)"
          :x2="x(hover.year)"
          :y1="M.top"
          :y2="H - M.bottom"
          stroke="var(--color-ink-dim)"
          stroke-width="1"
          stroke-dasharray="3 3"
        />

        <path :d="pricePath" fill="none" stroke="var(--color-chart-hidden)" stroke-width="2.5" stroke-linecap="round" />
        <path :d="revenuePath" fill="none" stroke="var(--color-chart-visible)" stroke-width="2.5" stroke-linecap="round" />

        <circle
          v-for="point in measuredPoints"
          :key="`marco-${point.year}`"
          :cx="x(point.year)"
          :cy="y(point.value)"
          r="3.5"
          fill="var(--color-abyss)"
          stroke="var(--color-chart-visible)"
          stroke-width="2"
        />

        <circle :cx="x(END)" :cy="y(lastRevenue.value)" r="4" fill="var(--color-chart-visible)" stroke="var(--color-abyss)" stroke-width="2" />
        <circle :cx="x(END)" :cy="y(lastPrice.value)" r="4" fill="var(--color-chart-hidden)" stroke="var(--color-abyss)" stroke-width="2" />
        <text :x="x(END) + 8" :y="y(lastRevenue.value) + 4" font-size="12" font-weight="700" fill="var(--color-chart-visible)">
          {{ t('historyChart.revenueLabel') }} {{ Math.round(lastRevenue.value) }}
        </text>
        <text :x="x(END) + 8" :y="y(lastPrice.value) + 4" font-size="12" font-weight="700" fill="var(--color-chart-hidden)">
          {{ t('historyChart.priceLabel') }} {{ Math.round(lastPrice.value) }}
        </text>

        <g v-if="hover">
          <circle :cx="x(hover.year)" :cy="y(hover.revenue)" r="4" fill="var(--color-chart-visible)" stroke="var(--color-ink)" stroke-width="1.5" />
          <circle :cx="x(hover.year)" :cy="y(hover.price)" r="4" fill="var(--color-chart-hidden)" stroke="var(--color-ink)" stroke-width="1.5" />
        </g>

        <!-- Alvos de foco, um por ano; o rótulo carrega as duas séries, porque
             a comparação é o assunto do gráfico. -->
        <circle
          v-for="ponto in revenueIndex"
          :key="`foco-${ponto.year}`"
          :cx="x(ponto.year)"
          :cy="y(ponto.value)"
          r="11"
          fill="transparent"
          tabindex="0"
          role="button"
          :aria-label="`${ponto.year}: ${t('historyChart.revenueLabel')} ${Math.round(ponto.value)}, ${t('historyChart.priceLabel')} ${Math.round(priceIndex.find((preco) => preco.year === ponto.year)!.value)}`"
          class="focus-visible:stroke-dino cursor-pointer outline-none focus-visible:stroke-2"
          @focus="hoverYear = ponto.year"
          @blur="hoverYear = null"
          @click="hoverYear = ponto.year"
        />
      </svg>
    </div>

    <!-- `aria-live` para o foco anunciar a leitura -->
    <div aria-live="polite" class="mt-3 flex min-h-9 flex-wrap items-center gap-x-6 gap-y-1 text-sm">
      <template v-if="hover">
        <span class="tabular text-ink font-bold">{{ hover.year }}</span>
        <span class="text-ink-dim">
          {{ t('historyChart.revenueLabel') }}:
          <b class="tabular text-chart-visible">{{ Math.round(hover.revenue) }}</b>
        </span>
        <span class="text-ink-dim">
          {{ t('historyChart.priceLabel') }}:
          <b class="tabular text-chart-hidden">{{ Math.round(hover.price) }}</b>
        </span>
      </template>
      <span v-else class="text-ink-dim text-xs">{{ t('historyChart.hint') }}</span>
    </div>

    <p class="text-ink-dim mt-3 text-xs leading-relaxed">
      {{ t('historyChart.note') }}
      <a :href="taxData.revenueSeries[0]!.url" target="_blank" rel="noopener" class="text-dino underline underline-offset-4">Impostômetro/ACSP</a>
      ·
      <a :href="taxData.ipcaSource.url" target="_blank" rel="noopener" class="text-dino underline underline-offset-4">{{ taxData.ipcaSource.source }}</a>
    </p>
  </div>
</template>
