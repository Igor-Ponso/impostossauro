<script setup lang="ts">
import brazilGeometry from '@svg-maps/brazil';
import statesDataPt from '~/data/states.json';

const { t, locale } = useI18n();

const statesData = dadoNoIdioma('states.json', statesDataPt, locale.value);

interface FiscalPoint {
  year: number;
  sent: number | null;
  received: number | null;
  totalRevenue?: number | null;
  dependence?: number | null;
  sentSource?: string;
  sentUrl?: string;
  receivedSource?: string;
  receivedUrl?: string;
}

interface IndicatorPoint {
  year: number;
  value: number | null;
  unit?: string;
  source?: string;
  url?: string;
}

interface StateEntry {
  name: string;
  region: string;
  fiscal: FiscalPoint[];
  indicators: Record<string, IndicatorPoint[]>;
}

const states = statesData.states as unknown as Record<string, StateEntry>;
const fiscalYears = statesData.fiscalYears as number[];
const geometryCredit = statesData.meta.geometry;

const locations = (brazilGeometry.locations as { id: string; name: string; path: string }[]).map(
  (loc) => ({ ...loc, uf: loc.id.toUpperCase() }),
);

const selectedUf = ref<string | null>(null);
const hoveredUf = ref<string | null>(null);
const activeYear = ref<number | null>(fiscalYears.at(-1) ?? null);

const focusedUf = computed(() => selectedUf.value ?? hoveredUf.value);
const focused = computed(() => (focusedUf.value ? states[focusedUf.value] : null));

function fiscalAt(uf: string, year: number | null): FiscalPoint | null {
  if (year === null) return null;
  return states[uf]?.fiscal.find((point) => point.year === year) ?? null;
}

function returnPer100(point: FiscalPoint | null): number | null {
  if (!point || point.sent === null || point.received === null || point.sent === 0) return null;
  return (point.received / point.sent) * 100;
}

const hasData = computed(() => fiscalYears.length > 0);

const ratios = computed(() => {
  const map = new Map<string, number | null>();
  for (const loc of locations) map.set(loc.uf, returnPer100(fiscalAt(loc.uf, activeYear.value)));
  return map;
});

/** Âmbar/azul em vez de vermelho/verde: legível para daltônicos. */
const BUCKETS = [
  { max: 25, color: 'var(--map-1)', label: 'menos de R$ 25' },
  { max: 50, color: 'var(--map-2)', label: 'R$ 25 a R$ 50' },
  { max: 100, color: 'var(--map-3)', label: 'R$ 50 a R$ 100' },
  { max: 200, color: 'var(--map-4)', label: 'R$ 100 a R$ 200' },
  { max: 400, color: 'var(--map-5)', label: 'R$ 200 a R$ 400' },
  { max: Infinity, color: 'var(--map-6)', label: 'mais de R$ 400' },
];

const NO_DATA = 'var(--map-none)';

function fillFor(uf: string) {
  const ratio = ratios.value.get(uf);
  if (ratio === null || ratio === undefined) return NO_DATA;
  return BUCKETS.find((bucket) => ratio < bucket.max)!.color;
}

function fmtMoney(value: number | null) {
  if (value === null) return '—';
  return value.toLocaleString(locale.value, {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

function fmtRatio(value: number | null) {
  if (value === null) return '—';
  return value.toLocaleString(locale.value, { maximumFractionDigits: 0 });
}

const panel = ref<HTMLElement | null>(null);

function select(uf: string) {
  selectedUf.value = selectedUf.value === uf ? null : uf;
  if (selectedUf.value && import.meta.client && window.innerWidth < 1024) {
    nextTick(() => panel.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  }
}

const focusedFiscal = computed(() =>
  focusedUf.value ? fiscalAt(focusedUf.value, activeYear.value) : null,
);

const focusedSeries = computed(() => (focusedUf.value ? states[focusedUf.value]!.fiscal : []));

const indicatorKeys = computed(() =>
  focused.value ? Object.keys(focused.value.indicators) : [],
);

function latest(points: IndicatorPoint[] | undefined) {
  if (!points?.length) return null;
  return points.at(-1)!;
}
</script>

<template>
  <div class="map-ramp">
    <div v-if="hasData" class="mb-4 flex flex-wrap items-center gap-2">
      <span class="text-ink-dim text-xs tracking-[0.16em] uppercase">{{ t('map.yearLabel') }}</span>
      <button
        v-for="year in fiscalYears"
        :key="year"
        type="button"
        class="tabular rounded-full px-3 py-1 text-sm transition"
        :class="
          activeYear === year
            ? 'bg-dino text-abyss font-semibold'
            : 'border-control text-ink-dim hover:text-ink border'
        "
        @click="activeYear = year"
      >
        {{ year }}
      </button>
    </div>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <figure class="glass rounded-3xl p-4 sm:p-6">
        <svg
          :viewBox="brazilGeometry.viewBox"
          role="group"
          :aria-label="t('map.svgLabel')"
          class="h-auto w-full"
          @mouseleave="hoveredUf = null"
        >
          <path
            v-for="loc in locations"
            :key="loc.uf"
            :d="loc.path"
            :fill="fillFor(loc.uf)"
            :fill-opacity="focusedUf && focusedUf !== loc.uf ? 0.4 : 1"
            :stroke="focusedUf === loc.uf ? 'var(--color-dino)' : 'var(--color-abyss)'"
            :stroke-width="focusedUf === loc.uf ? 2.5 : 1"
            stroke-linejoin="round"
            tabindex="0"
            role="button"
            :aria-label="`${states[loc.uf]?.name ?? loc.name}`"
            :aria-pressed="selectedUf === loc.uf"
            class="focus-visible:stroke-dino cursor-pointer transition-[fill-opacity] outline-none focus-visible:stroke-2"
            @mouseenter="hoveredUf = loc.uf"
            @focus="hoveredUf = loc.uf"
            @click="select(loc.uf)"
            @keydown.enter.prevent="select(loc.uf)"
            @keydown.space.prevent="select(loc.uf)"
          />
        </svg>

        <figcaption class="mt-4">
          <p class="text-ink-dim text-xs tracking-[0.16em] uppercase">{{ t('map.legendTitle') }}</p>
          <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-2">
            <li v-for="bucket in BUCKETS" :key="bucket.label" class="flex items-center gap-2">
              <span
                class="border-line/60 inline-block h-3 w-5 rounded-sm border"
                :style="{ backgroundColor: bucket.color }"
              />
              <span class="text-ink-dim text-xs">{{ bucket.label }}</span>
            </li>
            <li class="flex items-center gap-2">
              <span
                class="border-line/60 inline-block h-3 w-5 rounded-sm border"
                :style="{ backgroundColor: NO_DATA }"
              />
              <span class="text-ink-dim text-xs">{{ t('map.noData') }}</span>
            </li>
          </ul>
        </figcaption>
      </figure>

      <aside ref="panel" class="glass rounded-3xl p-5 sm:p-6">
        <p v-if="!focused" class="text-ink-dim leading-relaxed">
          {{ t('map.hint') }}
        </p>

        <div v-else>
          <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
            {{ focused.region }}
          </p>
          <h3 class="font-display text-ink mt-1 text-2xl font-bold">{{ focused.name }}</h3>

          <div v-if="focusedFiscal" class="mt-5 space-y-3">
            <div class="flex items-baseline justify-between gap-3">
              <span class="text-ink-dim text-sm">{{ t('map.sent') }}</span>
              <span class="tabular text-ink font-display font-bold">{{
                fmtMoney(focusedFiscal.sent)
              }}</span>
            </div>
            <div class="flex items-baseline justify-between gap-3">
              <span class="text-ink-dim text-sm">{{ t('map.received') }}</span>
              <span class="tabular text-ink font-display font-bold">{{
                fmtMoney(focusedFiscal.received)
              }}</span>
            </div>
            <div class="border-line flex items-baseline justify-between gap-3 border-t pt-3">
              <span class="text-ink-dim text-sm">{{ t('map.per100') }}</span>
              <span class="tabular font-display text-money text-2xl font-bold">
                R$ {{ fmtRatio(returnPer100(focusedFiscal)) }}
              </span>
            </div>
            <div
              v-if="focusedFiscal.dependence !== null && focusedFiscal.dependence !== undefined"
              class="border-line flex items-baseline justify-between gap-3 border-t pt-3"
            >
              <span class="text-ink-dim text-sm">{{ t('map.dependence') }}</span>
              <span class="tabular font-display text-chart-hidden text-2xl font-bold">
                {{ focusedFiscal.dependence.toLocaleString(locale, { maximumFractionDigits: 1 }) }}%
              </span>
            </div>
          </div>
          <p v-else class="text-ink-dim mt-5 text-sm leading-relaxed">{{ t('map.stateNoData') }}</p>

          <div v-if="focusedSeries.length > 1" class="mt-6">
            <p class="text-ink-dim text-xs tracking-[0.16em] uppercase">{{ t('map.timeline') }}</p>
            <ul class="mt-3 space-y-2">
              <li
                v-for="point in focusedSeries"
                :key="point.year"
                class="flex items-center gap-3 text-sm"
              >
                <span class="tabular text-ink-dim w-10 shrink-0">{{ point.year }}</span>
                <span class="bg-line/40 h-2 flex-1 overflow-hidden rounded-full">
                  <span
                    class="block h-full rounded-full"
                    :style="{
                      width: `${Math.min(100, (returnPer100(point) ?? 0) / 4)}%`,
                      backgroundColor: fillFor(focusedUf!),
                    }"
                  />
                </span>
                <span class="tabular text-ink w-16 shrink-0 text-right">
                  R$ {{ fmtRatio(returnPer100(point)) }}
                </span>
              </li>
            </ul>
          </div>

          <div v-if="indicatorKeys.length" class="mt-6">
            <p class="text-ink-dim text-xs tracking-[0.16em] uppercase">
              {{ t('map.indicators') }}
            </p>
            <ul class="mt-3 space-y-3">
              <li v-for="key in indicatorKeys" :key="key">
                <div class="flex items-baseline justify-between gap-3">
                  <span class="text-ink-dim text-sm">{{ t(`map.indicator.${key}`) }}</span>
                  <span class="tabular text-ink font-display font-bold">
                    {{ latest(focused.indicators[key])?.value ?? '—'
                    }}{{ latest(focused.indicators[key])?.unit ?? '' }}
                  </span>
                </div>
                <a
                  v-if="latest(focused.indicators[key])?.url"
                  :href="latest(focused.indicators[key])!.url"
                  target="_blank"
                  rel="noopener"
                  class="text-ink-dim hover:text-dino text-xs underline underline-offset-4"
                >
                  {{ latest(focused.indicators[key])!.source }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </div>

    <p class="text-ink-dim mt-4 text-xs">
      {{ t('map.geometryCredit') }}:
      <a
        :href="geometryCredit.url"
        target="_blank"
        rel="noopener"
        class="hover:text-dino underline underline-offset-4"
      >
        {{ geometryCredit.package }} ({{ geometryCredit.author }}, {{ geometryCredit.license }})
      </a>
    </p>
  </div>
</template>

<style>
/**
 * Uma rampa por tema: a ordem de luminancia inverte. No escuro a paridade e o
 * passo escuro e os extremos brilham; no claro os extremos sao os mais escuros.
 * Contraste contra o cartao (piso 3:1 para forma):
 *   escuro 10,62 · 5,57 · 2,50 · 2,03 · 4,82 · 9,83 — claro 7,36 · 4,43 · 3,47 · 4,50 · 6,82 · 10,71
 */
.map-ramp {
  --map-1: #fbbf24;
  --map-2: #d97706;
  --map-3: #92400e;
  --map-4: #1e40af;
  --map-5: #3b82f6;
  --map-6: #93c5fd;
  --map-none: #1e2a20;
}

:root[data-theme='light'] .map-ramp {
  --map-1: #6b3a02;
  --map-2: #9a5605;
  --map-3: #a86a0a;
  --map-4: #3160c9;
  --map-5: #1e40af;
  --map-6: #14276b;
  /* "sem dado" quase some no fundo de proposito: e ausencia, nao um valor da escala. */
  --map-none: #c3ccb8;
}
</style>
