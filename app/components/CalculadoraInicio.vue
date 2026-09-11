<script setup lang="ts">
import payroll from '~/data/payroll-2026.json';
import taxData from '~/data/tax-data.json';
import type { PayrollTables } from '~/utils/payroll';

const { t } = useI18n();
const { formatDinheiroInteiro, prefixo, campoNaMoeda, limiteNaMoeda } = useMoeda();
// Memória da navegação, sem salário em URL, armazenamento ou analytics.
const salario = useState<number>('calculadora-salario', () => 5000);
const salarioNaTela = campoNaMoeda(salario);
const folha = computed(() => calcPayroll(Number(salario.value) || 0, 0, payroll.tables as PayrollTables));
const consumo = computed(() => folha.value.net * 0.8 * taxData.consumption.averageEmbeddedPct / 100);
</script>

<template>
  <section id="sua-conta" class="border-line mx-auto grid max-w-6xl scroll-mt-24 items-center gap-8 border-b px-4 py-16 sm:py-24 lg:grid-cols-2 lg:gap-16">
    <div>
      <p class="text-dino text-sm font-semibold tracking-[0.18em] uppercase">{{ t('homeCalculator.kicker') }}</p>
      <h2 class="font-display text-ink mt-3 text-3xl leading-tight  sm:text-5xl">{{ t('homeCalculator.title') }}</h2>
      <p class="text-ink-dim mt-5 text-lg leading-relaxed">{{ t('homeCalculator.intro') }}</p>
      <p class="text-ink-dim mt-4 text-sm">{{ t('homeCalculator.private') }}</p>
    </div>
    <form class="border-control bg-card rounded-3xl border p-6 sm:p-8" @submit.prevent>
      <label for="salario-inicio" class="text-ink block text-sm font-bold">{{ t('calculator.grossLabel') }}</label>
      <div class="border-control focus-within:border-dino mt-3 flex items-center gap-3 rounded-xl border px-4 py-3">
        <span aria-hidden="true" class="text-ink-dim">{{ prefixo.trim() }}</span>
        <input id="salario-inicio" v-model.number="salarioNaTela" type="number" min="0" :max="limiteNaMoeda(1000000)" :step="limiteNaMoeda(100)" inputmode="decimal" class="text-ink min-w-0 w-full bg-transparent text-2xl font-bold outline-none">
      </div>
      <dl class="mt-6 space-y-3">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <dt class="text-ink-dim text-sm">INSS + IRRF</dt>
          <dd class="tabular text-ink text-xl font-bold">{{ formatDinheiroInteiro(folha.totalTax) }}</dd>
        </div>
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <dt class="text-ink-dim text-sm">{{ t('homeCalculator.consumption') }}</dt>
          <dd class="tabular text-ink text-xl font-bold">{{ formatDinheiroInteiro(consumo) }}</dd>
        </div>
        <div class="border-line flex flex-wrap items-baseline justify-between gap-2 border-t pt-4">
          <dt class="text-ink text-sm font-bold">{{ t('homeCalculator.total') }}</dt>
          <dd class="tabular text-alert text-3xl font-bold">{{ formatDinheiroInteiro(folha.totalTax + consumo) }}</dd>
        </div>
      </dl>
      <p class="text-ink-dim mt-4 text-xs leading-relaxed">{{ t('homeCalculator.assumptions', { year: payroll.year, pct: taxData.consumption.averageEmbeddedPct }) }}</p>
      <NuxtLink :to="$localePath('/calculadora')" class="bg-dino text-abyss mt-6 flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-center text-sm font-bold">
        {{ t('homeCalculator.cta') }} <span aria-hidden="true">→</span>
      </NuxtLink>
    </form>
  </section>
</template>
