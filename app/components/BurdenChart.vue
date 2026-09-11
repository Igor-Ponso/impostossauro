<script setup lang="ts">
import historicalPt from '~/data/historical.json';

/**
 * Três réguas que não se emendam: Varsano/Ipea 1947-1988 (marcos esparsos,
 * tracejado), FGV/Ibre 1990-2009 e Tesouro 2010-2025. O gráfico desenha a
 * mais oficial de cada ano e marca a troca em 2010.
 */
const { t, locale } = useI18n();

const historical = dadoNoIdioma('historical.json', historicalPt, locale.value);

interface Milestone {
  year: number;
  pctGdp: number;
  ruler: string;
  source: string;
  url: string;
}
interface AnoDaSerie { year: number; fgvIbre?: number; tesouro?: number }

const marcos = (historical.burdenMilestones as Milestone[])
  .filter((m) => m.ruler === 'varsano')
  .sort((a, b) => a.year - b.year);

const serie = (historical.burdenSeries?.years ?? []) as AnoDaSerie[];
const TROCA = 2010;

const pontos = serie
  .map((ano) => {
    const usaTesouro = ano.tesouro !== undefined;
    const valor = usaTesouro ? ano.tesouro! : ano.fgvIbre;
    return valor === undefined ? null : { year: ano.year, pctGdp: valor, ruler: usaTesouro ? 'tesouro' : 'fgvIbre' };
  })
  .filter((p): p is { year: number; pctGdp: number; ruler: string } => p !== null);

const hasData = marcos.length >= 2 && pontos.length >= 2;

const START = hasData ? marcos[0]!.year : 1947;
const END = hasData ? pontos.at(-1)!.year : 2025;

const W = 680;
const H = 380;
const M = { top: 30, right: 44, bottom: 36, left: 46 };
const MAX_PCT = 36;

const x = (year: number) => M.left + ((year - START) / (END - START)) * (W - M.left - M.right);
const y = (pct: number) => H - M.bottom - (pct / MAX_PCT) * (H - M.top - M.bottom);

const traco = (pts: Array<{ year: number; pctGdp: number }>) =>
  pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.year).toFixed(1)} ${y(p.pctGdp).toFixed(1)}`).join(' ');

/** O tracejado não encosta na série anual: ligar 1988 a 1990 emendaria duas réguas. */
const caminhoMarcos = traco(marcos);
const caminhoSerie = traco(pontos);

const ticks = [0, 10, 20, 30];
const dictatorship = { from: 1964, to: 1985 };

const pandemiaAnos = pontos.filter((p) => naPandemia(p.year));
const antesDaPandemia = pontos.find((p) => p.year === PANDEMIA.from - 1);
const quedaNaPandemia = antesDaPandemia && pandemiaAnos[0]
  ? antesDaPandemia.pctGdp - pandemiaAnos[0].pctGdp
  : 0;
const realPlan = 1994;

const fontesDaSerie = (historical.burdenSeries?.sources ?? []) as Array<{ ruler: string; label: string; url: string }>;
const fonteDaRegua = (regua: string) => fontesDaSerie.find((f) => f.ruler === regua);

const primeiro = marcos[0];
const ultimo = pontos.at(-1);

const maiorDistancia = serie
  .filter((a) => a.fgvIbre !== undefined && a.tesouro !== undefined)
  .map((a) => ({ year: a.year, pp: a.fgvIbre! - a.tesouro! }))
  .sort((a, b) => b.pp - a.pp)[0];

const hovered = ref<{ year: number; pctGdp: number; ruler: string } | null>(null);
const num = (v: number, casas = 2) =>
  v.toLocaleString(locale.value, { minimumFractionDigits: casas, maximumFractionDigits: casas });
</script>

<template>
  <div v-if="hasData" class="glass rounded-3xl p-5 sm:p-7">
    <h3 class="font-display text-ink text-xl font-bold sm:text-2xl">
      {{ t('burden.title') }}
    </h3>
    <p class="text-ink-dim mt-2 text-sm leading-relaxed sm:text-base">
      {{ t('burden.subtitle', { from: num(primeiro!.pctGdp, 1), to: num(ultimo!.pctGdp) }) }}
    </p>

    <div class="mt-6 overflow-x-auto" tabindex="0" role="region" :aria-label="t('burden.alt')">
      <svg :viewBox="`0 0 ${W} ${H}`" class="min-w-[540px]" role="group" :aria-label="t('burden.alt')">
        <rect
          :x="x(dictatorship.from)"
          :y="M.top"
          :width="x(dictatorship.to) - x(dictatorship.from)"
          :height="H - M.top - M.bottom"
          fill="var(--color-ink-dim)"
          opacity="0.09"
        />
        <text
          :x="(x(dictatorship.from) + x(dictatorship.to)) / 2"
          :y="M.top + 14"
          text-anchor="middle"
          font-size="10"
          fill="var(--color-ink-dim)"
          letter-spacing="1"
        >
          {{ t('burden.dictatorship') }}
        </text>

        <rect
          :x="x(PANDEMIA.from)"
          :y="M.top"
          :width="x(PANDEMIA.to + 1) - x(PANDEMIA.from)"
          :height="H - M.top - M.bottom"
          fill="var(--color-alert)"
          opacity="0.12"
        />
        <text
          :x="(x(PANDEMIA.from) + x(PANDEMIA.to + 1)) / 2"
          :y="H - M.bottom - 8"
          text-anchor="middle"
          font-size="9"
          fill="var(--color-alert)"
          letter-spacing="1"
        >
          {{ t('pandemia.label') }}
        </text>

        <line :x1="x(realPlan)" :x2="x(realPlan)" :y1="M.top" :y2="H - M.bottom" stroke="var(--color-money)" stroke-width="1" stroke-dasharray="4 4" opacity="0.5" />
        <text :x="x(realPlan) + 4" :y="M.top + 14" font-size="10" fill="var(--color-money)">
          {{ t('burden.realPlan') }}
        </text>

        <g v-for="tick in ticks" :key="tick">
          <line :x1="M.left" :x2="W - M.right" :y1="y(tick)" :y2="y(tick)" stroke="var(--color-line)" stroke-width="1" />
          <text :x="M.left - 8" :y="y(tick) + 4" text-anchor="end" font-size="11" fill="var(--color-ink-dim)" class="tabular">
            {{ tick }}%
          </text>
        </g>
        <g v-for="year in [1947, 1965, 1980, 1994, TROCA, END]" :key="year">
          <text :x="x(year)" :y="H - M.bottom + 20" text-anchor="middle" font-size="11" fill="var(--color-ink-dim)" class="tabular">
            {{ year }}
          </text>
        </g>

        <line
          :x1="x(TROCA)"
          :x2="x(TROCA)"
          :y1="M.top"
          :y2="H - M.bottom"
          stroke="var(--color-ink-dim)"
          stroke-width="1"
          stroke-dasharray="2 4"
        />
        <text :x="x(TROCA) + 4" :y="M.top + 28" font-size="9" fill="var(--color-ink-dim)">
          {{ t('burden.sourceSwitch') }}
        </text>

        <path
          :d="caminhoMarcos"
          fill="none"
          stroke="var(--color-ink-dim)"
          stroke-width="2"
          stroke-dasharray="6 5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path :d="caminhoSerie" fill="none" stroke="var(--color-chart-visible)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

        <g v-for="point in marcos" :key="`marco-${point.year}`">
          <circle
            :cx="x(point.year)"
            :cy="y(point.pctGdp)"
            r="9"
            fill="transparent"
            tabindex="0"
            role="button"
            :aria-label="`${point.year}: ${num(point.pctGdp, 1)}% ${t('burden.ofGdp')}`"
            class="focus-visible:stroke-dino cursor-pointer outline-none focus-visible:stroke-2"
            @mouseenter="hovered = point"
            @mouseleave="hovered = null"
            @focus="hovered = point"
            @blur="hovered = null"
            @click="hovered = hovered?.year === point.year ? null : point"
          />
          <circle
            :cx="x(point.year)"
            :cy="y(point.pctGdp)"
            :r="hovered?.year === point.year ? 5 : 3.5"
            fill="var(--color-abyss)"
            stroke="var(--color-ink-dim)"
            stroke-width="2"
            pointer-events="none"
          />
        </g>

        <circle
          v-for="point in pontos"
          :key="`ano-${point.year}`"
          :cx="x(point.year)"
          :cy="y(point.pctGdp)"
          r="7"
          fill="transparent"
          tabindex="0"
          role="button"
          :aria-label="`${point.year}: ${num(point.pctGdp)}% ${t('burden.ofGdp')}`"
          class="focus-visible:stroke-dino cursor-pointer outline-none focus-visible:stroke-2"
          @mouseenter="hovered = point"
          @mouseleave="hovered = null"
          @focus="hovered = point"
          @blur="hovered = null"
          @click="hovered = hovered?.year === point.year ? null : point"
        />
        <circle
          v-if="hovered"
          :cx="x(hovered.year)"
          :cy="y(hovered.pctGdp)"
          r="4.5"
          fill="var(--color-chart-visible)"
          stroke="var(--color-ink)"
          stroke-width="1.5"
          pointer-events="none"
        />

        <text :x="x(START) + 4" :y="y(primeiro!.pctGdp) - 10" font-size="12" font-weight="700" fill="var(--color-ink-dim)" class="tabular">
          {{ num(primeiro!.pctGdp, 1) }}%
        </text>
        <text :x="x(END) - 4" :y="y(ultimo!.pctGdp) - 12" text-anchor="end" font-size="12" font-weight="700" fill="var(--color-chart-visible)" class="tabular">
          {{ num(ultimo!.pctGdp) }}%
        </text>
      </svg>

      <p v-if="pandemiaAnos.length && antesDaPandemia" class="border-alert/30 bg-alert/5 text-ink mt-5 rounded-2xl border p-4 text-sm leading-relaxed">
        <span class="text-alert font-semibold">{{ t('pandemia.label') }}</span>
        {{ t('pandemia.burdenNote', {
          before: num(antesDaPandemia.pctGdp),
          low: num(pandemiaAnos[0]!.pctGdp),
          drop: num(quedaNaPandemia),
          back: num(pandemiaAnos[1]!.pctGdp),
        }) }}
      </p>
    </div>

    <!-- `aria-live`: o foco por teclado anuncia o ponto -->
    <div aria-live="polite" class="mt-3 min-h-10 text-sm">
      <template v-if="hovered">
        <span class="tabular text-ink font-bold">{{ hovered.year }}</span>
        <span class="tabular text-chart-visible ml-3 font-bold">
          {{ num(hovered.pctGdp, hovered.ruler === 'varsano' ? 1 : 2) }}% {{ t('burden.ofGdp') }}
        </span>
        <a
          v-if="fonteDaRegua(hovered.ruler)"
          :href="fonteDaRegua(hovered.ruler)!.url"
          target="_blank"
          rel="noopener"
          class="text-ink-dim hover:text-dino ml-3 text-xs underline underline-offset-4"
        >
          {{ fonteDaRegua(hovered.ruler)!.label }}
        </a>
        <span v-else class="text-ink-dim ml-3 text-xs">{{ t('burden.milestoneRuler') }}</span>
      </template>
      <span v-else class="text-ink-dim text-xs">{{ t('burden.hint') }}</span>
    </div>

    <div v-if="maiorDistancia" class="border-money/30 bg-money/5 mt-6 rounded-2xl border p-4 sm:p-5">
      <p class="font-display text-ink text-base font-bold">{{ t('burden.divergenceTitle') }}</p>
      <p class="text-ink-dim mt-2 text-sm leading-relaxed">
        {{ t('burden.divergenceText', { year: maiorDistancia.year, pp: num(maiorDistancia.pp) }) }}
      </p>
    </div>

    <p class="text-ink-dim mt-5 text-xs leading-relaxed">
      {{ t('burden.note') }}
      <template v-for="(fonte, indice) in fontesDaSerie" :key="fonte.ruler">
        <span v-if="indice">· </span>
        <a :href="fonte.url" target="_blank" rel="noopener" class="text-dino underline underline-offset-4">{{ fonte.label }}</a>
      </template>
    </p>
  </div>
</template>
