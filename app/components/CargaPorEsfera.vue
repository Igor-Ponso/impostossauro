<script setup lang="ts">
import taxData from '~/data/tax-data.json';

const props = withDefaults(defineProps<{ nivelDoTitulo?: 'h2' | 'h3' }>(), { nivelDoTitulo: 'h3' });

const { t, locale } = useI18n();
const { converter, prefixo } = useMoeda();
const { target, inView } = useInView(0.2);

const dados = taxData.taxBurdenBySphere;
const anos = dados.years;
const primeiro = anos[0]!;
const ultimo = anos.at(-1)!;

type Esfera = 'central' | 'states' | 'municipal';
const ESFERAS: Esfera[] = ['central', 'states', 'municipal'];
const COR: Record<Esfera, string> = {
  central: 'var(--color-chart-visible)',
  states: 'var(--color-chart-hidden)',
  municipal: 'var(--color-chart-net)',
};

const acesa = ref<Esfera | null>(null);
const anoNoFoco = ref<number | null>(null);

const num = (valor: number, casas = 0) =>
  converter(valor).toLocaleString(locale.value, { minimumFractionDigits: casas, maximumFractionDigits: casas });

const multiplo = (esfera: Esfera) => anos.at(-1)![esfera] / anos[0]![esfera];
const fatia = (esfera: Esfera, ano = ultimo) => (ano[esfera] / ano.total) * 100;

const queMaisCresceu = [...ESFERAS].sort((a, b) => multiplo(b) - multiplo(a))[0]!;

const W = 680;
const H = 340;
const M = { top: 20, right: 116, bottom: 34, left: 58 };
const maxTotal = Math.max(...anos.map((a) => a.total)) * 1.04;
const x = (ano: number) =>
  M.left + ((ano - primeiro.year) / (ultimo.year - primeiro.year)) * (W - M.left - M.right);
const y = (valor: number) => H - M.bottom - (valor / maxTotal) * (H - M.top - M.bottom);

function faixa(esfera: Esfera) {
  const abaixo = ESFERAS.slice(0, ESFERAS.indexOf(esfera));
  const base = (ano: (typeof anos)[number]) => abaixo.reduce((soma, e) => soma + ano[e], 0);
  const topo = anos.map((ano) => `${x(ano.year).toFixed(1)} ${y(base(ano) + ano[esfera]).toFixed(1)}`);
  const chao = [...anos].reverse().map((ano) => `${x(ano.year).toFixed(1)} ${y(base(ano)).toFixed(1)}`);
  return `M ${topo.join(' L ')} L ${chao.join(' L ')} Z`;
}

const faixas = ESFERAS.map((esfera) => ({ esfera, d: faixa(esfera) }));

const antesDaPandemia = anos.find((a) => a.year === PANDEMIA.from - 1);
const noPico = anos.find((a) => a.year === PANDEMIA.from);
const quedaCentral = antesDaPandemia && noPico ? antesDaPandemia.central - noPico.central : 0;
const altaEstados = antesDaPandemia && noPico ? noPico.states - antesDaPandemia.states : 0;

const ticks = [0, 1000, 2000, 3000, 4000];
const anosNoEixo = anos.filter((ano) => ano.year % 5 === 0 || ano.year === ultimo.year);

const leitura = computed(() => {
  const ano = anos.find((item) => item.year === anoNoFoco.value);
  if (!ano) return null;
  return { ano, esferas: ESFERAS.map((e) => ({ esfera: e, valor: ano[e], fatia: fatia(e, ano) })) };
});
</script>

<template>
  <section ref="target" class="glass reveal rounded-3xl p-5 sm:p-7" :class="{ in: inView }">
    <component :is="props.nivelDoTitulo" class="font-display text-ink text-xl font-bold sm:text-2xl">
      {{ t('sphereBurden.title') }}
    </component>
    <p class="text-ink-dim mt-2 text-sm leading-relaxed sm:text-base">
      {{ t('sphereBurden.subtitle') }}
    </p>

    <div
      class="mt-5 flex flex-wrap gap-2"
      role="group"
      :aria-label="t('sphereBurden.selectorLabel')"
    >
      <button
        type="button"
        class="rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
        :class="acesa === null ? 'border-ink text-ink' : 'border-control text-ink-dim hover:text-ink'"
        :aria-pressed="acesa === null"
        @click="acesa = null"
      >
        {{ t('sphereBurden.all') }}
      </button>
      <button
        v-for="esfera in ESFERAS"
        :key="esfera"
        type="button"
        class="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
        :class="acesa === esfera ? 'border-ink text-ink' : 'border-control text-ink-dim hover:text-ink'"
        :aria-pressed="acesa === esfera"
        @click="acesa = acesa === esfera ? null : esfera"
      >
        <span aria-hidden="true" class="h-2.5 w-2.5 rounded-full" :style="{ background: COR[esfera] }" />
        {{ t(`sphereBurden.${esfera}`) }}
      </button>
    </div>

    <div class="mt-6">
      <p class="tabular font-display text-money text-4xl leading-none font-bold sm:text-5xl">
        <template v-if="acesa">{{ num(multiplo(acesa), 2) }}×</template>
        <template v-else>{{ prefixo }}{{ num(ultimo.total) }} bi</template>
      </p>
      <p class="text-ink-dim mt-2 text-sm">
        <template v-if="acesa">
          {{ t('sphereBurden.multipleLegend', {
            sphere: t(`sphereBurden.${acesa}`),
            first: primeiro.year,
            last: ultimo.year,
            share: num(fatia(acesa), 1),
          }) }}
        </template>
        <template v-else>
          {{ t('sphereBurden.totalLegend', { year: ultimo.year, pct: num(ultimo.pctGdp, 2) }) }}
        </template>
      </p>
    </div>

    <div class="mt-5 overflow-x-auto" tabindex="0" role="region" :aria-label="t('sphereBurden.alt', { firstYear: primeiro.year, lastYear: ultimo.year })">
      <svg
        :viewBox="`0 0 ${W} ${H}`"
        class="min-w-[600px]"
        role="group"
        :aria-label="t('sphereBurden.alt', { firstYear: primeiro.year, lastYear: ultimo.year })"
      >
        <g v-for="tick in ticks" :key="tick">
          <line :x1="M.left" :x2="W - M.right" :y1="y(tick)" :y2="y(tick)" stroke="var(--color-line)" stroke-width="1" />
          <text :x="M.left - 8" :y="y(tick) + 4" text-anchor="end" font-size="11" fill="var(--color-ink-dim)" class="tabular">
            {{ num(tick) }}
          </text>
        </g>

        <rect
          :x="x(PANDEMIA.from)"
          :y="M.top"
          :width="x(PANDEMIA.to) - x(PANDEMIA.from)"
          :height="H - M.top - M.bottom"
          fill="var(--color-alert)"
          opacity="0.14"
        />
        <text
          :x="(x(PANDEMIA.from) + x(PANDEMIA.to)) / 2"
          :y="M.top + 12"
          text-anchor="middle"
          font-size="9"
          fill="var(--color-alert)"
          letter-spacing="1"
        >
          {{ t('pandemia.label') }}
        </text>

        <path
          v-for="banda in faixas"
          :key="banda.esfera"
          :d="banda.d"
          :fill="COR[banda.esfera]"
          :opacity="acesa === null ? 0.75 : acesa === banda.esfera ? 0.9 : 0.12"
          class="transition-opacity duration-300"
        />

        <line
          v-if="anoNoFoco !== null"
          :x1="x(anoNoFoco)"
          :x2="x(anoNoFoco)"
          :y1="M.top"
          :y2="H - M.bottom"
          stroke="var(--color-ink)"
          stroke-width="1"
          stroke-dasharray="3 3"
        />

        <g v-for="ano in anosNoEixo" :key="`eixo-${ano.year}`">
          <text :x="x(ano.year)" :y="H - 12" text-anchor="middle" font-size="11" fill="var(--color-ink-dim)" class="tabular">
            {{ ano.year }}
          </text>
        </g>

        <text
          v-for="(esfera, indice) in [...ESFERAS].reverse()"
          :key="`rotulo-${esfera}`"
          :x="W - M.right + 10"
          :y="M.top + 16 + indice * 20"
          font-size="12"
          font-weight="700"
          :fill="COR[esfera]"
          :opacity="acesa === null || acesa === esfera ? 1 : 0.35"
        >
          {{ t(`sphereBurden.${esfera}`) }} {{ num(fatia(esfera), 1) }}%
        </text>

        <rect
          v-for="ano in anos"
          :key="`foco-${ano.year}`"
          :x="x(ano.year) - 10"
          :y="M.top"
          width="20"
          :height="H - M.top - M.bottom"
          fill="transparent"
          tabindex="0"
          role="button"
          :aria-label="`${ano.year}: ${ESFERAS.map((e) => `${t(`sphereBurden.${e}`)} ${prefixo}${num(ano[e])} bi`).join(', ')}`"
          class="focus-visible:stroke-dino cursor-pointer outline-none focus-visible:stroke-2"
          @mouseenter="anoNoFoco = ano.year"
          @mouseleave="anoNoFoco = null"
          @focus="anoNoFoco = ano.year"
          @blur="anoNoFoco = null"
          @click="anoNoFoco = ano.year"
        />
      </svg>

      <p
        v-if="antesDaPandemia && noPico"
        class="border-alert/30 bg-alert/5 text-ink mt-5 rounded-2xl border p-4 text-sm leading-relaxed"
      >
        <span class="text-alert font-semibold">{{ t('pandemia.label') }}</span>
        {{ t('pandemia.sphereNote', { drop: num(quedaCentral, 1), rise: num(altaEstados, 1) }) }}
      </p>
    </div>

    <div aria-live="polite" class="mt-3 flex min-h-9 flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      <template v-if="leitura">
        <span class="tabular text-ink font-bold">{{ leitura.ano.year }}</span>
        <span v-for="item in leitura.esferas" :key="item.esfera" class="text-ink-dim">
          {{ t(`sphereBurden.${item.esfera}`) }}:
          <b class="tabular" :style="{ color: COR[item.esfera] }">{{ prefixo }}{{ num(item.valor) }} bi</b>
        </span>
      </template>
      <span v-else class="text-ink-dim text-xs">{{ t('sphereBurden.hint') }}</span>
    </div>

    <div class="border-alert/30 bg-alert/5 mt-6 rounded-3xl border p-5 sm:p-6">
      <p class="text-alert text-lg leading-relaxed font-bold sm:text-xl">
        {{ t('sphereBurden.punch', {
          winner: t(`sphereBurden.${queMaisCresceu}`),
          winnerMultiple: num(multiplo(queMaisCresceu), 2),
          central: num(multiplo('central'), 2),
          first: primeiro.year,
          last: ultimo.year,
        }) }}
      </p>
    </div>

    <p class="text-ink-dim mt-4 text-xs leading-relaxed">
      {{ t('sphereBurden.note') }}
      <a :href="dados.url" target="_blank" rel="noopener" class="text-dino underline underline-offset-4">
        {{ dados.source }}
      </a>
    </p>
  </section>
</template>
