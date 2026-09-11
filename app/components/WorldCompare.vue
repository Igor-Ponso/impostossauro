<script setup lang="ts">
import { comparaveis, posicaoNoRanking, type IndicadorMundo } from '~/utils/mundo';

/** A régua corre do pior (esquerda) ao melhor (direita); o sentido vem do campo `ordem` do dado. */
const props = defineProps<{
  indicador: IndicadorMundo;
  nomes: Record<string, string>;
  /** Indicador de insumo (gasto, não resultado): posição boa não é boa notícia, então a cor fica neutra. */
  insumo?: boolean;
}>();

const { t, locale } = useI18n();

const valido = computed(
  () => comparaveis([props.indicador], props.indicador.paisesComparados).length === 1,
);

const isos = computed(() => props.indicador.paisesComparados);
const valores = computed(() => isos.value.map((iso) => props.indicador.valores[iso]!));
const brasil = computed(() => props.indicador.valores.BRA!);
const total = computed(() => isos.value.length);
const posicao = computed(() =>
  posicaoNoRanking(brasil.value, valores.value, props.indicador.ordem),
);

const menor = computed(() => Math.min(...valores.value));
const maior = computed(() => Math.max(...valores.value));

const melhorIso = computed(() =>
  isos.value.find(
    (iso) =>
      props.indicador.valores[iso] ===
      (props.indicador.ordem === 'maiorMelhor' ? maior.value : menor.value),
  )!,
);
const piorIso = computed(() =>
  isos.value.find(
    (iso) =>
      props.indicador.valores[iso] ===
      (props.indicador.ordem === 'maiorMelhor' ? menor.value : maior.value),
  )!,
);

function fracao(valor: number) {
  const vao = maior.value - menor.value;
  if (vao <= 0) return 0.5;
  const bruta = (valor - menor.value) / vao;
  return props.indicador.ordem === 'maiorMelhor' ? bruta : 1 - bruta;
}

const X0 = 10;
const X1 = 290;
const x = (valor: number) => X0 + fracao(valor) * (X1 - X0);

const cor = computed(() => {
  if (props.insumo) return 'var(--color-ink)';
  const parte = posicao.value / total.value;
  if (parte <= 1 / 3) return 'var(--color-chart-visible)';
  if (parte > 2 / 3) return 'var(--color-alert)';
  return 'var(--color-chart-net)';
});

const fmt = (valor: number) =>
  valor.toLocaleString(locale.value, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const anosGrupo = computed(() => {
  const anos = isos.value.map((iso) => props.indicador.anos[iso]!);
  return { de: Math.min(...anos), ate: Math.max(...anos) };
});

const semDado = computed(() =>
  props.indicador.faltando.map((iso) => props.nomes[iso] ?? iso).join(', '),
);
</script>

<template>
  <article v-if="valido" class="glass rounded-3xl p-5 sm:p-6">
    <div class="flex items-baseline justify-between gap-3">
      <h4 class="font-display text-ink font-bold">{{ indicador.rotulo }}</h4>
      <span class="text-ink-dim shrink-0 text-xs">{{ indicador.unidade }}</span>
    </div>

    <div class="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
      <p class="tabular">
        <b class="font-display text-3xl" :style="{ color: cor }">{{ fmt(brasil) }}</b>
        <span class="text-ink-dim ml-2 text-sm">
          {{ t('world.brazilIn', { ano: indicador.anos.BRA }) }}
        </span>
      </p>
      <p
        v-if="posicao"
        class="tabular border-line text-ink shrink-0 rounded-full border px-3 py-1 text-sm font-bold"
      >
        {{ t('world.rank', { pos: posicao, total }) }}
      </p>
    </div>

    <svg
      viewBox="0 0 300 24"
      class="mt-4 w-full"
      role="img"
      :aria-label="
        t('world.stripAlt', {
          indicador: indicador.rotulo,
          valor: fmt(brasil),
          pos: posicao,
          total,
        })
      "
    >
      <line
        :x1="X0"
        :x2="X1"
        y1="12"
        y2="12"
        stroke="var(--color-line)"
        stroke-width="3"
        stroke-linecap="round"
      />
      <circle
        v-for="iso in isos"
        :key="iso"
        :cx="x(indicador.valores[iso]!)"
        cy="12"
        r="3"
        fill="var(--color-ink-dim)"
        opacity="0.55"
      />
      <circle
        :cx="x(brasil)"
        cy="12"
        r="6"
        :fill="cor"
        stroke="var(--color-abyss)"
        stroke-width="1.5"
      />
    </svg>

    <div class="text-ink-dim mt-1 flex items-baseline justify-between gap-3 text-xs">
      <span class="tabular">
        {{ t('world.worstOf') }}: {{ nomes[piorIso] ?? piorIso }}
        {{ fmt(indicador.valores[piorIso]!) }}
      </span>
      <span class="tabular text-right">
        {{ t('world.bestOf') }}: {{ nomes[melhorIso] ?? melhorIso }}
        {{ fmt(indicador.valores[melhorIso]!) }}
      </span>
    </div>

    <p v-if="anosGrupo.de !== anosGrupo.ate" class="text-ink-dim mt-3 text-xs leading-relaxed">
      {{ t('world.yearSpread', { de: anosGrupo.de, ate: anosGrupo.ate }) }}
    </p>
    <p v-if="indicador.faltando.length" class="text-ink-dim mt-2 text-xs leading-relaxed">
      {{
        t('world.missing', {
          n: total,
          total: total + indicador.faltando.length,
          lista: semDado,
        })
      }}
    </p>

    <a
      :href="indicador.url"
      target="_blank"
      rel="noopener"
      class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4"
    >
      {{ t('equivalences.sourcePrefix') }}: {{ indicador.fonte }}
    </a>
  </article>
</template>
