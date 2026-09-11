<script setup lang="ts">
import taxData from '~/data/tax-data.json';

/**
 * Só a União, do arquivo aberto da Receita. Não comparar com `revenueSeries`
 * (três esferas, outra régua).
 */
/**
 * O nível do título é do documento: `h3` dentro da seção da home, `h2` na
 * /inflacao, onde é a única série da seção.
 */
const props = withDefaults(defineProps<{ nivelDoTitulo?: 'h2' | 'h3' }>(), { nivelDoTitulo: 'h3' });

const { t, locale } = useI18n();
const { converter, prefixo } = useMoeda();

const bi = (valor: number) => converter(valor).toLocaleString(locale.value, { maximumFractionDigits: 1 });

/**
 * Só anos de régua completa: a receita previdenciária só existe no arquivo da
 * Receita a partir de 2013, e emendar as metades desenharia um salto de 56,6%
 * que é mudança de definição, não de arrecadação.
 */
const series = anosDaReguaCompleta(taxData.federalRevenueSeries);
const naoDesenhados = taxData.federalRevenueSeries.filter(
  (entry) => !series.some((desenhado) => desenhado.year === entry.year),
);
const temSerie = series.length > 1;
const firstEntry = series[0];
const START = firstEntry?.year ?? 0;
const END = series.at(-1)?.year ?? 0;

interface GovernmentBand {
  key: string;
  start: number;
  end: number;
}

// As fronteiras seguem os presets da Máquina do Tempo.
const TODOS_GOVERNOS: GovernmentBand[] = [
  { key: 'fhc1', start: 1995, end: 1998 },
  { key: 'fhc2', start: 1999, end: 2002 },
  { key: 'lula1', start: 2003, end: 2006 },
  { key: 'lula2', start: 2007, end: 2010 },
  { key: 'dilma', start: 2011, end: 2016 },
  { key: 'temer', start: 2016, end: 2018 },
  { key: 'bolsonaro', start: 2019, end: 2022 },
  { key: 'lula3', start: 2023, end: 2025 },
];

const GOVERNMENTS = TODOS_GOVERNOS.filter(
  (government) => government.end >= START && government.start <= END,
);

const bands = GOVERNMENTS.map((government, index) => ({
  ...government,
  rectStart: Math.max(government.start, START),
  rectEnd: Math.min(GOVERNMENTS[index + 1]?.start ?? END, END),
}));

function governmentOf(year: number) {
  // 2016 é o último ano de Dilma e o primeiro de Temer; buscar do fim faz o
  // rótulo concordar com a faixa sombreada.
  return [...GOVERNMENTS].reverse().find(
    (government) => year >= government.start && year <= government.end,
  );
}

const W = 760;
const H = 420;
const M = { top: 50, right: 100, bottom: 40, left: 62 };
const maxValue = Math.max(...series.map((entry) => entry.totalBillions)) * 1.15;
const ticks = [0, 600, 1200, 1800, 2400, 3000];
const yearTicks = [...new Set([...bands.map((band) => band.rectStart), END])];

const x = (year: number) => M.left + ((year - START) / (END - START)) * (W - M.left - M.right);
const y = (value: number) => H - M.bottom - (value / maxValue) * (H - M.top - M.bottom);

const linePath = series
  .map((entry, index) => `${index === 0 ? 'M' : 'L'} ${x(entry.year).toFixed(1)} ${y(entry.totalBillions).toFixed(1)}`)
  .join(' ');

const lastEntry = series.at(-1)!;

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
  const entry = series.find((item) => item.year === hoverYear.value)!;
  return { year: entry.year, value: entry.totalBillions, governmentKey: governmentOf(entry.year)?.key };
});
</script>

<template>
  <div v-if="temSerie" id="federal-revenue-chart" class="glass rounded-3xl p-5 sm:p-7">
    <component :is="props.nivelDoTitulo" class="font-display text-ink text-xl font-bold sm:text-2xl">
      {{ t('federalRevenueChart.title') }}
    </component>
    <p class="text-ink mt-2 text-base font-semibold sm:text-lg">
      {{
        t('federalRevenueChart.headline', {
          first: firstEntry!.totalBillions.toLocaleString($i18n.locale, { maximumFractionDigits: 1 }),
          firstYear: START,
          last: lastEntry.totalBillions.toLocaleString($i18n.locale, { maximumFractionDigits: 1 }),
          lastYear: END,
        })
      }}
    </p>
    <p class="text-ink-dim mt-2 text-sm leading-relaxed sm:text-base">
      {{ t('federalRevenueChart.subtitle') }}
    </p>

    <div
      v-if="naoDesenhados.length"
      class="border-money/40 bg-money/[0.04] mt-4 rounded-2xl border border-dashed p-4 sm:p-5"
    >
      <p class="font-display text-ink font-bold">
        {{ t('federalRevenueChart.rulerTitle', { firstYear: START }) }}
      </p>
      <p class="text-ink-dim mt-2 text-sm leading-relaxed">
        {{ t('federalRevenueChart.rulerText', { firstYear: START }) }}
      </p>
    </div>

    <div class="mt-5 overflow-x-auto" tabindex="0" role="region" :aria-label="t('federalRevenueChart.alt', { firstYear: START, lastYear: END })">
      <svg
        :viewBox="`0 0 ${W} ${H}`"
        class="min-w-[620px]"
        role="group"
        :aria-label="t('federalRevenueChart.alt', { firstYear: START, lastYear: END })"
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

        <g v-for="(band, index) in bands" :key="band.key">
          <rect
            :x="x(band.rectStart)"
            :y="M.top"
            :width="x(band.rectEnd) - x(band.rectStart)"
            :height="H - M.top - M.bottom"
            fill="var(--color-ink-dim)"
            :opacity="index % 2 === 0 ? 0.05 : 0.12"
          />
          <text
            :x="(x(band.rectStart) + x(band.rectEnd)) / 2"
            y="28"
            text-anchor="middle"
            font-size="10"
            font-weight="600"
            fill="var(--color-ink-dim)"
          >
            {{ t(`federalRevenueChart.governments.${band.key}`) }}
          </text>
        </g>

        <g v-for="tick in ticks" :key="tick">
          <line :x1="M.left" :x2="W - M.right" :y1="y(tick)" :y2="y(tick)" stroke="var(--color-line)" stroke-width="1" />
          <text :x="M.left - 8" :y="y(tick) + 4" text-anchor="end" font-size="11" fill="var(--color-ink-dim)" class="tabular">
            {{ tick }}
          </text>
        </g>
        <g v-for="year in yearTicks" :key="year">
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

        <path :d="linePath" fill="none" stroke="var(--color-chart-visible)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

        <circle
          v-for="entry in series"
          :key="entry.year"
          :cx="x(entry.year)"
          :cy="y(entry.totalBillions)"
          r="2.5"
          fill="var(--color-chart-visible)"
        />

        <circle :cx="x(lastEntry.year)" :cy="y(lastEntry.totalBillions)" r="4.5" fill="var(--color-chart-visible)" stroke="var(--color-abyss)" stroke-width="2" />
        <text :x="x(lastEntry.year) + 8" :y="y(lastEntry.totalBillions) + 4" font-size="12" font-weight="700" fill="var(--color-chart-visible)" class="tabular">
          {{ prefixo }}{{ bi(lastEntry.totalBillions) }} {{ t('federalRevenueChart.unit') }}
        </text>

        <circle v-if="hover" :cx="x(hover.year)" :cy="y(hover.value)" r="4.5" fill="var(--color-chart-visible)" stroke="var(--color-ink)" stroke-width="1.5" />

        <!-- Alvos de foco, um por ano, navegáveis por Tab: sem eles o gráfico é
             mudo para teclado e leitor de tela. -->
        <circle
          v-for="entry in series"
          :key="`foco-${entry.year}`"
          :cx="x(entry.year)"
          :cy="y(entry.totalBillions)"
          r="11"
          fill="transparent"
          tabindex="0"
          role="button"
          :aria-label="`${entry.year}: ${prefixo}${bi(entry.totalBillions)} ${t('federalRevenueChart.unit')}`"
          class="focus-visible:stroke-dino cursor-pointer outline-none focus-visible:stroke-2"
          @focus="hoverYear = entry.year"
          @blur="hoverYear = null"
          @click="hoverYear = entry.year"
        />
      </svg>
    </div>

    <!-- `aria-live` para o leitor de tela anunciar o valor do ponto focado -->
    <div aria-live="polite" class="mt-3 flex min-h-9 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <template v-if="hover">
        <span class="tabular text-ink font-bold">{{ hover.year }}</span>
        <span v-if="hover.governmentKey" class="text-ink-dim">
          {{ t(`federalRevenueChart.governments.${hover.governmentKey}`) }}
        </span>
        <span class="tabular text-chart-visible font-bold">
          {{ prefixo }}{{ bi(hover.value) }} {{ t('federalRevenueChart.unit') }}
        </span>
      </template>
      <span v-else class="text-ink-dim text-xs">{{ t('federalRevenueChart.hint') }}</span>
    </div>

    <p class="text-ink-dim mt-3 text-xs leading-relaxed">
      {{ t('federalRevenueChart.caveatsNote', { firstYear: START, lastYear: END }) }}
    </p>
    <p class="text-ink-dim mt-2 text-xs leading-relaxed">
      {{ t('federalRevenueChart.note') }}
      <a :href="series[0]!.url" target="_blank" rel="noopener" class="text-dino underline underline-offset-4">{{ series[0]!.source }}</a>
    </p>
  </div>
</template>
