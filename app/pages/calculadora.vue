<script setup lang="ts">
import payrollData from '~/data/payroll-2026.json';
import taxData from '~/data/tax-data.json';
import type { PayrollTables } from '~/utils/payroll';

const { formatDinheiro, formatDinheiroCompacto, formatDinheiroInteiro, formatCount, prefixo, campoNaMoeda, limiteNaMoeda } = useMoeda();

const { t, locale } = useI18n();

usePaginaSeo({
  titulo: t('calculator.pageTitle'),
  descricao: t('calculator.tldr'),
  imagem: 'og-calculadora.png',
});

const tables = payrollData.tables as PayrollTables;

const grossInput = useState<number>('calculadora-salario', () => 5000);
const salarioNaTela = campoNaMoeda(grossInput);
const dependents = ref(0);
const spendShare = ref(0.8);

const result = computed(() => calcPayroll(grossInput.value || 0, Math.max(0, Math.floor(Number(dependents.value) || 0)), tables));

const embeddedRate = taxData.consumption.averageEmbeddedPct / 100;
const hiddenTax = computed(() => result.value.net * spendShare.value * embeddedRate);

const totalBite = computed(() => result.value.totalTax + hiddenTax.value);
const realRate = computed(() =>
  result.value.gross > 0 ? totalBite.value / result.value.gross : 0,
);

const daysForGovernment = computed(() => Math.round(realRate.value * 365));
// `locale.value`, não 'pt-BR': "4,1 months" na rota em inglês não é um número.
const monthsForGovernment = computed(() =>
  (realRate.value * 12).toLocaleString(locale.value, { maximumFractionDigits: 1 }),
);

const yearlyTax = computed(() => result.value.totalTax * 13.333 + hiddenTax.value * 12);

const basketCost = taxData.referenceCosts.basicBasket.unitCost;
const basketsPerYear = computed(() => howMany(yearlyTax.value, basketCost));

const ibptDays = taxData.workDays.days;

const liberationDate = computed(() => {
  const dayOfYear = Math.max(1, Math.round(realRate.value * 365));
  const date = new Date(Date.UTC(payrollData.year, 0, dayOfYear));
  return date.toLocaleDateString(locale.value, { day: 'numeric', month: 'long', timeZone: 'UTC' });
});

const shareText = computed(() =>
  daysForGovernment.value === 0 ? t('calculator.zeroLine') : t('share.calcText', {
    days: daysForGovernment.value,
    date: liberationDate.value,
  }),
);

</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-12 sm:py-16">
    <header class="max-w-3xl space-y-4">
      <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">{{ t('calculator.kicker') }}</p>
      <h1 class="font-display text-ink text-4xl font-bold tracking-tight md:text-6xl">{{ t('calculator.pageTitle') }}</h1>
      <p class="text-ink-dim text-lg leading-relaxed">{{ t('calculator.intro') }}</p>
    </header>

    <section aria-labelledby="simulation-title" class="mt-10">
      <div class="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="simulation-title" class="font-display text-ink text-xl font-bold sm:text-2xl">{{ t('calculator.inputTitle') }}</h2>
        <p class="text-ink-dim text-sm">{{ t('calculator.liveHint') }}</p>
      </div>
      <div class="grid gap-6 lg:grid-cols-2">
        <form class="glass min-w-0 space-y-6 rounded-3xl p-5 sm:p-8" @submit.prevent>
          <div class="space-y-3">
            <label for="gross" class="text-ink block text-sm font-semibold">{{ t('calculator.grossLabel') }}</label>
            <div class="border-line bg-abyss/70 focus-within:border-dino flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors">
              <span class="text-ink-dim font-medium">{{ prefixo.trim() }}</span>
              <input id="gross" v-model.number="salarioNaTela" type="number" min="0" :step="limiteNaMoeda(100)" inputmode="decimal" class="text-ink min-w-0 w-full bg-transparent text-3xl font-semibold outline-none">
            </div>
            <input v-model.number="salarioNaTela" type="range" min="0" :max="limiteNaMoeda(30000)" :step="limiteNaMoeda(100)" class="accent-dino h-6 w-full" :aria-label="t('calculator.grossLabel')">
            <div class="text-ink-dim flex justify-between text-xs" aria-hidden="true">
              <span>{{ formatDinheiroInteiro(0) }}</span><span>{{ formatDinheiroInteiro(30000) }}</span>
            </div>
          </div>
          <div class="border-line space-y-3 border-t pt-5">
            <div class="flex items-start justify-between gap-4">
              <label for="spend" class="text-ink text-sm font-semibold">{{ t('calculator.spendLabel') }}</label>
              <output for="spend" class="tabular text-ink shrink-0 text-lg font-bold">{{ Math.round(spendShare * 100) }}%</output>
            </div>
            <input id="spend" v-model.number="spendShare" type="range" min="0" max="1" step="0.05" aria-describedby="spend-hint" class="accent-dino h-6 w-full">
            <p id="spend-hint" class="text-ink-dim text-sm leading-relaxed">{{ t('calculator.spendHint', { value: formatDinheiroInteiro(result.net * spendShare) }) }}</p>
          </div>
          <div class="border-line flex items-center justify-between gap-4 border-t pt-5">
            <label for="dependents" class="text-ink text-sm font-semibold">{{ t('calculator.dependentsLabel') }}</label>
            <input id="dependents" v-model.number="dependents" type="number" min="0" max="10" step="1" inputmode="numeric" class="border-line bg-abyss/70 text-ink focus:border-dino w-24 rounded-xl border px-4 py-3 outline-none">
          </div>
        </form>

        <div class="border-alert/35 bg-alert/5 flex min-w-0 flex-col rounded-3xl border p-5 sm:p-8" aria-live="polite" aria-atomic="true">
          <p class="text-alert text-sm font-semibold">{{ t('calculator.totalLabel') }}</p>
          <p class="tabular font-display text-ink mt-3 text-4xl leading-tight font-bold break-words sm:text-5xl">{{ formatDinheiroInteiro(totalBite) }}<span class="text-ink-dim ml-2 text-base font-normal">/{{ t('iceberg.month') }}</span></p>
          <p class="text-ink-dim mt-3 text-base">{{ t('calculator.rateLine', { rate: (realRate * 100).toLocaleString(locale, { maximumFractionDigits: 1 }) }) }}</p>
          <dl class="border-alert/20 mt-6 space-y-4 border-t pt-5 text-sm">
            <div class="flex flex-wrap justify-between gap-2"><dt class="text-ink-dim">{{ t('calculator.payrollLabel') }}</dt><dd class="tabular text-ink font-semibold">{{ formatDinheiro(result.totalTax) }}</dd></div>
            <div class="flex flex-wrap justify-between gap-2"><dt class="text-ink-dim">{{ t('calculator.hidden') }}</dt><dd class="tabular text-ink font-semibold">+ {{ formatDinheiro(hiddenTax) }}</dd></div>
            <div class="border-alert/20 flex flex-wrap justify-between gap-2 border-t pt-4"><dt class="text-ink font-semibold">{{ t('calculator.afterAllTaxes') }}</dt><dd class="tabular text-ink font-bold">{{ formatDinheiroInteiro(result.gross - totalBite) }}</dd></div>
          </dl>
          <p class="text-ink-dim mt-auto pt-5 text-xs leading-relaxed">{{ t('calculator.remainingHint') }}</p>
        </div>
      </div>
      <details class="border-line mt-5 rounded-2xl border px-5 py-4">
        <summary class="text-ink cursor-pointer text-sm font-semibold">{{ t('calculator.assumptionsTitle') }}</summary>
        <p class="text-ink-dim mt-4 text-sm leading-relaxed">{{ t('calculator.scopeNote', { pct: taxData.consumption.averageEmbeddedPct }) }}</p>
        <NotaMetodologia :nota="t('calculator.methodNote')" />
      </details>
    </section>

    <section aria-labelledby="breakdown-title" class="border-line mt-12 border-t pt-10 sm:mt-16 sm:pt-14">
      <h2 id="breakdown-title" class="font-display text-ink text-2xl font-bold tracking-tight sm:text-3xl">{{ t('calculator.breakdownTitle') }}</h2>
      <div class="mt-6 grid items-center gap-7 lg:grid-cols-2 lg:gap-10">
        <IcebergChart :visible-tax="result.totalTax" :hidden-tax="hiddenTax" :gross="result.gross" />
        <div class="min-w-0">
          <dl class="divide-line divide-y">
            <div class="pb-5"><dt class="text-ink-dim text-sm">{{ t('calculator.payrollLabel') }}</dt><dd class="tabular text-chart-visible mt-2 text-2xl font-bold">{{ formatDinheiro(result.totalTax) }}</dd><dd class="text-ink-dim mt-2 text-sm">INSS: {{ formatDinheiro(result.inss) }} · IRRF: {{ formatDinheiro(result.irrf) }}</dd></div>
            <div class="py-5"><dt class="text-ink-dim text-sm">{{ t('calculator.takeHomeLabel') }}</dt><dd class="tabular text-ink mt-2 text-2xl font-bold">{{ formatDinheiroInteiro(result.net) }}</dd><dd class="text-ink-dim mt-2 text-sm">{{ t('calculator.takeHomeHint') }}</dd></div>
            <div class="pt-5"><dt class="text-ink-dim text-sm">{{ t('calculator.hidden') }}</dt><dd class="tabular text-chart-hidden mt-2 text-2xl font-bold">{{ formatDinheiro(hiddenTax) }}</dd><dd class="text-ink-dim mt-2 text-sm leading-relaxed">{{ t('calculator.consumptionCalculation', { spending: formatDinheiroInteiro(result.net * spendShare), pct: taxData.consumption.averageEmbeddedPct }) }}</dd></div>
          </dl>
        </div>
      </div>
    </section>

    <section aria-labelledby="calendar-title" class="border-line mt-12 border-t pt-10 sm:mt-16 sm:pt-14">
      <h2 id="calendar-title" class="font-display text-ink text-2xl font-bold tracking-tight sm:text-3xl">3. {{ t('calculator.liberation.kicker') }}</h2>
      <div class="border-alert/30 bg-alert/5 mt-6 overflow-hidden rounded-3xl border">
        <div class="grid items-center gap-6 p-5 sm:p-8 lg:grid-cols-2 lg:gap-10">
          <div class="space-y-4">
            <p class="font-display text-ink text-2xl leading-snug font-bold sm:text-3xl">{{ daysForGovernment > 0 ? t('calculator.liberation.line', { date: liberationDate }) : t('calculator.zeroLine') }}</p>
            <p class="text-alert text-lg font-semibold leading-relaxed">{{ t('calculator.daysLine', { days: daysForGovernment, months: monthsForGovernment }) }}</p>
            <p class="text-ink-dim text-sm leading-relaxed">{{ t('calculator.liberation.note') }}</p>
          </div>
          <Art id="calculadora-calendario" sizes="(min-width: 1152px) 490px, (min-width: 1024px) 43vw, 90vw" class="w-full rounded-2xl" />
        </div>
        <div class="px-3 pb-3 sm:px-6 sm:pb-6">
          <CalendarioIlustrado :year="payrollData.year" :government-days="daysForGovernment" />
        </div>
      </div>
      <div class="mt-6 space-y-4">
        <p class="text-ink text-lg leading-relaxed">{{ t('calculator.yearLine', { value: formatDinheiroCompacto(yearlyTax), baskets: formatCount(basketsPerYear) }) }}</p>
        <p class="text-ink-dim text-sm leading-relaxed">{{ t('calculator.ibptLine', { days: ibptDays, year: taxData.workDays.referenceYear }) }} <a :href="taxData.workDays.url" target="_blank" rel="noopener" class="text-dino underline underline-offset-4">IBPT</a>.</p>
        <ShareRow :text="shareText" />
      </div>
    </section>
    <NotaMetodologia :nota="t('calculator.methodNote')" />
  </div>
</template>
