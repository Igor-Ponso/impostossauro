<script setup lang="ts">
import payrollPt from '~/data/federal-payroll.json';
const SpotlightCard = defineAsyncComponent(
  () => import('~/components/vb/SpotlightCard/SpotlightCard.vue'),
);

/** A série (Tabela 1.1-A do Tesouro) já vem deflacionada pelo IPCA; não deflacionar de novo. */
const { t, locale } = useI18n();
const { converter, prefixo } = useMoeda();
const { target, inView } = useInView(0.15);

const dados = dadoNoIdioma('federal-payroll.json', payrollPt, locale.value);

const num = (v: number, casas = 0) =>
  converter(v).toLocaleString(locale.value, { minimumFractionDigits: casas, maximumFractionDigits: casas });

const anos = dados.years;
const primeiro = anos[0]!;
const ultimo = anos.at(-1)!;

const vezesFolha = ultimo.payrollBi / primeiro.payrollBi;
const vezesReceita = ultimo.netRevenueBi / primeiro.netRevenueBi;

const W = 720;
const H = 300;
const M = { top: 18, right: 16, bottom: 30, left: 34 };

const INICIO = primeiro.year;
const FIM = ultimo.year;

const indice = (valor: number, base: number) => (valor / base) * 100;
const teto = Math.max(...anos.map((a) => indice(a.netRevenueBi, primeiro.netRevenueBi))) * 1.05;

const x = (ano: number) => M.left + ((ano - INICIO) / (FIM - INICIO)) * (W - M.left - M.right);
const y = (v: number) => H - M.bottom - (v / teto) * (H - M.top - M.bottom);

const caminho = (pegar: (a: (typeof anos)[number]) => number, base: number) =>
  anos.map((a, i) => `${i ? 'L' : 'M'}${x(a.year).toFixed(1)} ${y(indice(pegar(a), base)).toFixed(1)}`).join(' ');

const linhaFolha = caminho((a) => a.payrollBi, primeiro.payrollBi);
const linhaReceita = caminho((a) => a.netRevenueBi, primeiro.netRevenueBi);

const marcas = [100, 200, 300].filter((m) => m <= teto);
const anosRotulados = anos.filter((a) => a.year % 5 === 0 || a.year === INICIO || a.year === FIM);

const emFoco = ref<(typeof anos)[number] | null>(null);
const lido = computed(() => emFoco.value ?? ultimo);
</script>

<template>
  <section ref="target" class="reveal" :class="{ in: inView }">
    <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">{{ t('payroll.kicker') }}</p>
    <h2 class="font-display text-ink mt-3 text-2xl font-bold tracking-tight  sm:text-4xl">
      {{ dados.title }}
    </h2>
    <p class="text-ink-dim mt-4 text-base leading-relaxed">{{ dados.intro }}</p>

    <div class="glass mt-8 grid gap-6 rounded-3xl p-6 sm:grid-cols-2 sm:p-9">
      <div>
        <p class="tabular font-display text-ink text-5xl leading-none font-bold sm:text-6xl">
          {{ num(vezesFolha, 1) }}×
        </p>
        <p class="text-ink mt-3 text-sm font-semibold">{{ dados.payrollLabel }}</p>
        <p class="tabular text-ink-dim mt-1 text-sm">
          {{ prefixo }}{{ num(primeiro.payrollBi) }} bi → {{ prefixo }}{{ num(ultimo.payrollBi) }} bi
        </p>
      </div>
      <div>
        <p class="tabular font-display text-alert text-5xl leading-none font-bold sm:text-6xl">
          {{ num(vezesReceita, 1) }}×
        </p>
        <p class="text-ink mt-3 text-sm font-semibold">{{ dados.revenueLabel }}</p>
        <p class="tabular text-ink-dim mt-1 text-sm">
          {{ prefixo }}{{ num(primeiro.netRevenueBi) }} bi → {{ prefixo }}{{ num(ultimo.netRevenueBi) }} bi
        </p>
      </div>
      <p class="text-ink-dim border-line col-span-full border-t pt-5 text-xs leading-relaxed">
        {{ dados.deflatorBase }}
      </p>
    </div>

    <div class="glass mt-6 rounded-3xl p-5 sm:p-7">
      <h3 class="font-display text-ink text-lg font-bold sm:text-xl">
        {{ t('payroll.chartTitle', { year: INICIO }) }}
      </h3>

      <ul class="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs">
        <li class="flex items-center gap-2">
          <span aria-hidden="true" class="bg-alert inline-block h-0.5 w-6 rounded-full" />
          <span class="text-ink-dim">{{ dados.revenueLabel }}</span>
        </li>
        <li class="flex items-center gap-2">
          <span aria-hidden="true" class="bg-ink inline-block h-0.5 w-6 rounded-full" />
          <span class="text-ink-dim">{{ dados.payrollLabel }}</span>
        </li>
      </ul>

      <div class="mt-5 overflow-x-auto" tabindex="0" role="region" :aria-label="t('payroll.chartTitle', { year: INICIO })">
        <svg
          :viewBox="`0 0 ${W} ${H}`"
          class="h-auto w-full min-w-[520px]"
          role="img"
          :aria-label="t('payroll.chartAlt', {
            first: INICIO, last: FIM,
            payroll: num(vezesFolha, 1), revenue: num(vezesReceita, 1),
          })"
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
          >{{ t('pandemia.label') }}</text>

          <g>
            <template v-for="m in marcas" :key="m">
              <line
                :x1="M.left" :x2="W - M.right" :y1="y(m)" :y2="y(m)"
                stroke="var(--color-line)" stroke-width="1"
                :stroke-dasharray="m === 100 ? '0' : '3 4'"
              />
              <text :x="M.left - 6" :y="y(m) + 3" text-anchor="end" font-size="9" fill="var(--color-ink-dim)">
                {{ m }}
              </text>
            </template>
          </g>

          <text
            v-for="a in anosRotulados" :key="a.year"
            :x="x(a.year)" :y="H - 10" text-anchor="middle" font-size="9" fill="var(--color-ink-dim)"
          >{{ a.year }}</text>

          <path :d="linhaReceita" fill="none" stroke="var(--color-alert)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
          <path :d="linhaFolha" fill="none" stroke="var(--color-ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

          <rect
            v-for="a in anos" :key="`alvo-${a.year}`"
            :x="x(a.year) - 6" :y="M.top" width="12" :height="H - M.top - M.bottom"
            fill="transparent" class="cursor-pointer"
            @mouseenter="emFoco = a" @mouseleave="emFoco = null"
          />
          <g v-if="emFoco">
            <line :x1="x(emFoco.year)" :x2="x(emFoco.year)" :y1="M.top" :y2="H - M.bottom" stroke="var(--color-ink-dim)" stroke-width="1" />
            <circle :cx="x(emFoco.year)" :cy="y(indice(emFoco.netRevenueBi, primeiro.netRevenueBi))" r="4" fill="var(--color-alert)" />
            <circle :cx="x(emFoco.year)" :cy="y(indice(emFoco.payrollBi, primeiro.payrollBi))" r="4" fill="var(--color-ink)" />
          </g>
        </svg>
      </div>

      <div aria-live="polite" class="border-line mt-4 grid gap-3 border-t pt-4 text-sm sm:grid-cols-3">
        <p class="tabular text-ink font-bold">{{ lido.year }}</p>
        <p class="text-ink-dim">
          {{ dados.payrollLabel }}:
          <b class="tabular text-ink">{{ prefixo }}{{ num(lido.payrollBi) }} bi</b>
        </p>
        <p class="text-ink-dim">
          {{ t('payroll.shareLabel') }}:
          <b class="tabular text-alert">{{ num(lido.pctOfRevenue, 1) }}%</b>
        </p>
      </div>
      <p class="text-ink-dim mt-3 text-xs">{{ t('payroll.hint') }}</p>
    </div>

    <SpotlightCard
      class="glass mt-6 !rounded-3xl !p-5 sm:!p-7"
      spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
    >
      <h3 class="font-display text-ink text-lg font-bold sm:text-xl">
        {{ t('payroll.shareTitle', {
          first: primeiro.year, firstPct: num(primeiro.pctOfRevenue, 1),
          last: ultimo.year, lastPct: num(ultimo.pctOfRevenue, 1),
        }) }}
      </h3>
      <p class="text-ink mt-4 leading-relaxed">{{ dados.growth.text }}</p>
      <a :href="dados.growth.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4">
        {{ dados.growth.source }}
      </a>

      <p class="border-alert/30 bg-alert/5 text-ink mt-6 rounded-2xl border p-4 text-sm leading-relaxed">
        <span class="text-alert font-semibold">{{ t('pandemia.label') }}</span>
        {{ dados.pandemic.text }}
      </p>
    </SpotlightCard>

    <div class="border-alert/30 bg-alert/5 mt-6 rounded-3xl border p-6 sm:p-7">
      <p class="text-alert text-lg leading-relaxed font-bold sm:text-xl">{{ dados.question }}</p>
    </div>
  </section>
</template>
