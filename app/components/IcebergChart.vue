<script setup lang="ts">
const { formatDinheiroInteiro } = useMoeda();

const props = defineProps<{
  visibleTax: number;
  hiddenTax: number;
  gross: number;
}>();

const WATERLINE = 120;

const totalTax = computed(() => props.visibleTax + props.hiddenTax);
const biteRate = computed(() => (props.gross > 0 ? totalTax.value / props.gross : 0));
const visibleShare = computed(() =>
  totalTax.value > 0 ? props.visibleTax / totalTax.value : 0.5,
);

const animatedBite = useAnimatedNumber(biteRate, 600);
const animatedShare = useAnimatedNumber(visibleShare, 600);

const totalHeight = computed(
  () => 40 + 185 * Math.min(1, Math.max(0, animatedBite.value) / 0.6),
);
const tipHeight = computed(() =>
  Math.min(96, Math.max(10, totalHeight.value * animatedShare.value)),
);
const bodyHeight = computed(() =>
  Math.min(160, Math.max(12, totalHeight.value * (1 - animatedShare.value))),
);

function facetedTip(height: number): string {
  const w = 26 + height * 0.62;
  const points: Array<[number, number]> = [
    [200 - w, WATERLINE],
    [200 - w * 0.42, WATERLINE - height * 0.58],
    [200 - w * 0.08, WATERLINE - height],
    [200 + w * 0.3, WATERLINE - height * 0.52],
    [200 + w * 0.62, WATERLINE - height * 0.2],
    [200 + w * 0.92, WATERLINE],
  ];
  return points.map((point) => point.join(',')).join(' ');
}

function facetedBody(height: number): string {
  const w = 34 + height * 0.68;
  const top = WATERLINE + 3;
  const points: Array<[number, number]> = [
    [200 - w * 1.04, top],
    [200 - w * 0.68, top + height * 0.55],
    [200 - w * 0.2, top + height],
    [200 + w * 0.34, top + height * 0.82],
    [200 + w * 0.78, top + height * 0.38],
    [200 + w * 0.98, top],
  ];
  return points.map((point) => point.join(',')).join(' ');
}

const tipPoints = computed(() => facetedTip(tipHeight.value));
const bodyPoints = computed(() => facetedBody(bodyHeight.value));

</script>

<template>
  <div class="relative w-full overflow-hidden rounded-3xl">
    <svg
      viewBox="0 0 400 320"
      class="bg-abyss block w-full"
      role="img"
      :aria-label="$t('iceberg.alt')"
    >
      <defs>
        <!-- Misturar com chart-hidden, não com abyss: abyss inverte a direção
             entre temas e a água profunda convergia com o gelo raso no claro. -->
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-water)" stop-opacity="0.9" />
          <stop
            offset="100%"
            stop-color="color-mix(in oklab, var(--color-water) 62%, var(--color-chart-hidden))"
            stop-opacity="0.98"
          />
        </linearGradient>
        <!-- dino-belly puro dá 1,12:1 contra o céu no tema claro; misturado
             50/50 com ink sobe para 4,04:1 sem piorar o escuro. -->
        <linearGradient id="ice-tip" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stop-color="color-mix(in oklab, var(--color-dino-belly) 50%, var(--color-ink) 50%)"
          />
          <stop offset="100%" stop-color="var(--color-chart-visible)" />
        </linearGradient>
        <!-- chart-hidden e water têm luminância quase igual no tema claro;
             misturado com dino-belly o gelo fica sempre mais claro que a água. -->
        <linearGradient id="ice-body" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stop-color="color-mix(in oklab, var(--color-chart-hidden) 20%, var(--color-dino-belly))"
          />
          <stop
            offset="100%"
            stop-color="color-mix(in oklab, var(--color-chart-hidden) 30%, var(--color-dino-belly))"
          />
        </linearGradient>
      </defs>

      <rect x="0" :y="WATERLINE" width="400" height="200" fill="url(#water)" />

      <g class="berg-bob">
        <polygon :points="bodyPoints" fill="url(#ice-body)" opacity="0.9" />
        <polygon :points="tipPoints" fill="url(#ice-tip)" />
      </g>

      <!-- Cores fixas: sobre a água, escura nos dois temas, o contraste fecha
           (mínimo 2,97:1). -->
      <g opacity="0.55">
        <path
          class="wave"
          :d="`M -220 ${WATERLINE} q 27.5 -9 55 0 t 55 0 t 55 0 t 55 0 t 55 0 t 55 0 t 55 0 t 55 0 t 55 0 t 55 0 t 55 0 t 55 0`"
          fill="none"
          stroke="#7dd3fc"
          stroke-width="2.5"
          stroke-linecap="round"
        />
      </g>
      <g opacity="0.28">
        <path
          class="wave-slow"
          :d="`M -220 ${WATERLINE + 14} q 27.5 -7 55 0 t 55 0 t 55 0 t 55 0 t 55 0 t 55 0 t 55 0 t 55 0 t 55 0 t 55 0 t 55 0 t 55 0`"
          fill="none"
          stroke="#38bdf8"
          stroke-width="2"
          stroke-linecap="round"
        />
      </g>
    </svg>

    <div class="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-5">
      <div class="glass max-w-[58%] self-start rounded-2xl px-3 py-2 sm:px-4">
        <p class="text-ink-dim text-[10px] tracking-wide uppercase sm:text-xs">
          {{ $t('iceberg.visibleLabel') }}
        </p>
        <p class="tabular text-chart-visible text-sm font-bold sm:text-lg">
          {{ formatDinheiroInteiro(visibleTax) }}<span class="text-ink-dim text-[10px] font-normal sm:text-xs">/{{ $t('iceberg.month') }}</span>
        </p>
      </div>
      <div class="glass max-w-[58%] self-end rounded-2xl px-3 py-2 text-right sm:px-4">
        <p class="text-ink-dim text-[10px] tracking-wide uppercase sm:text-xs">
          {{ $t('iceberg.hiddenLabel') }}
        </p>
        <p class="tabular text-chart-hidden text-sm font-bold sm:text-lg">
          {{ formatDinheiroInteiro(hiddenTax) }}<span class="text-ink-dim text-[10px] font-normal sm:text-xs">/{{ $t('iceberg.month') }}</span>
        </p>
      </div>
    </div>
  </div>
</template>
