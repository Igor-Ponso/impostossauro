<script setup lang="ts">
import currencyHistoryPt from '~/data/currency-history.json';
import inflationHistoryPt from '~/data/inflation-history.json';
import taxDataPt from '~/data/tax-data.json';

const SpotlightCard = defineAsyncComponent(
  () => import('~/components/vb/SpotlightCard/SpotlightCard.vue'),
);
const { formatDinheiroInteiro, prefixo, campoNaMoeda, limiteNaMoeda } = useMoeda();


const { t, locale } = useI18n();

const currencyHistory = dadoNoIdioma('currency-history.json', currencyHistoryPt, locale.value);
const inflationHistory = dadoNoIdioma('inflation-history.json', inflationHistoryPt, locale.value);
const taxData = dadoNoIdioma('tax-data.json', taxDataPt, locale.value);

usePaginaSeo({ titulo: t('inflationPage.pageTitle'), descricao: t('inflationPage.tldr') });

const timelineReveal = useInView(0.15);

const revenueDefinition = taxData.federalRevenueDefinition;
const revenueCaveats = computed(() => [
  { title: t('revenueAudit.rulerTitle'), text: t('revenueAudit.rulerText') },
  {
    title: t('revenueAudit.sourceTitle'),
    text: t('revenueAudit.sourceText'),
    source: taxData.revenueSeries[0]!.source,
    url: taxData.revenueSeries[0]!.url,
  },
  {
    title: t('revenueAudit.measuredTitle'),
    text: t('revenueAudit.measuredText'),
    source: revenueDefinition.source,
    url: revenueDefinition.url,
  },
]);
let zerosSoFar = 0;
const changes = currencyHistory.changes.map((change) => {
  zerosSoFar += change.zeros;
  return { ...change, zerosSoFar };
});
const hyperYears = currencyHistory.hyperinflation.annualIpca;
const maxHyperPct = Math.max(...hyperYears.map((entry) => entry.pct));

const defaultInflation =
  Math.round(averageInflationPct(taxData.ipcaSeries) * 10) / 10;

const principal = ref(10_000);
const principalNaTela = campoNaMoeda(principal);
const years = ref(10);
const returnPct = ref(12);
const inflationPct = ref(defaultInflation);

const result = computed(() =>
  simulateInvestment(principal.value || 0, years.value, returnPct.value, inflationPct.value),
);

const animatedFinal = useAnimatedNumber(computed(() => result.value.finalValue));
const animatedTax = useAnimatedNumber(computed(() => result.value.tax));
const animatedTaxOnInflation = useAnimatedNumber(
  computed(() => result.value.taxOnInflation),
);

const lostToInflation = computed(() => result.value.realGain < 0);

const taxOnInflationShare = computed(() =>
  result.value.tax > 0 ? (result.value.taxOnInflation / result.value.tax) * 100 : 0,
);
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-12 sm:py-16">
    <header class="max-w-3xl space-y-4">
      <p class="text-alert text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t('inflationPage.kicker') }}
      </p>
      <h1 class="font-display text-ink text-4xl font-bold tracking-tight  md:text-6xl">
        {{ t('inflationPage.title') }}
      </h1>
      <p class="text-ink-dim text-lg leading-relaxed">
        {{ t('inflationPage.intro') }}
      </p>
      <TldrBadge :text="t('inflationPage.tldr')" />
    </header>

    <section :ref="timelineReveal.target" class="mt-14">
      <h2 class="font-display text-ink text-2xl font-bold tracking-tight sm:text-4xl">
        {{ t('inflationPage.currencies.title') }}
      </h2>
      <p class="text-ink-dim mt-3 text-lg leading-relaxed">
        {{ t('inflationPage.currencies.intro') }}
      </p>

      <ol class="border-line mt-8 space-y-0 border-l-2 pl-6">
        <li
          v-for="(change, index) in changes"
          :key="change.year"
          class="reveal relative pb-8"
          :class="{ in: timelineReveal.inView.value }"
          :style="{ transitionDelay: `${index * 90}ms` }"
        >
          <span
            class="bg-dino border-abyss absolute top-1 -left-[31px] h-3 w-3 rounded-full border-2"
            aria-hidden="true"
          />
          <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span class="tabular font-display text-dino text-xl font-bold">{{ change.year }}</span>
            <span class="text-ink font-semibold">{{ change.from }} → {{ change.to }}</span>
            <span class="glass text-ink-dim rounded-full px-2.5 py-0.5 text-xs">
              {{ change.factorLabel }}
            </span>
          </div>
          <p class="text-ink-dim mt-1 text-sm">
            {{ change.government }}
            <span v-if="change.zeros > 0">
              · {{ t('inflationPage.currencies.zerosCut', { zeros: change.zeros, total: change.zerosSoFar }) }}
            </span>
          </p>
        </li>
      </ol>

      <div class="border-alert/30 bg-alert/5 mt-4 rounded-3xl border p-6 sm:p-8">
        <p class="font-display text-ink text-xl leading-snug font-bold sm:text-2xl">
          {{ t('inflationPage.currencies.punch', { zeros: currencyHistory.totalZeros }) }}
        </p>
        <p class="tabular text-alert mt-3 text-lg font-bold break-words">
          {{ currencyHistory.equivalenceLabel }}
        </p>
        <p class="text-ink-dim mt-2 text-xs">
          {{ t('equivalences.sourcePrefix') }}:
          <a
            :href="currencyHistory.changesSource.url"
            target="_blank"
            rel="noopener"
            class="text-dino underline underline-offset-4"
            >{{ currencyHistory.changesSource.source }}</a
          >
        </p>
      </div>

      <div class="mt-10 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <SpotlightCard
          class="glass !rounded-3xl !p-6 sm:!p-7"
          spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
        >
          <h3 class="font-display text-ink text-lg font-bold sm:text-xl">
            {{ t('inflationPage.hyper.title') }}
          </h3>
          <ul class="mt-5 space-y-3">
            <li v-for="entry in hyperYears" :key="entry.year" class="flex items-center gap-3">
              <span class="tabular text-ink-dim w-10 text-sm">{{ entry.year }}</span>
              <div class="bg-abyss/60 h-3 flex-1 overflow-hidden rounded-full">
                <div
                  class="bg-alert h-full rounded-full transition-[width] duration-1000 ease-out"
                  :style="{ width: `${timelineReveal.inView.value ? (entry.pct / maxHyperPct) * 100 : 0}%` }"
                />
              </div>
              <span class="tabular text-ink w-24 text-right text-sm font-bold">
                {{ entry.pct.toLocaleString($i18n.locale, { maximumFractionDigits: 0 }) }}%
              </span>
            </li>
          </ul>
          <p class="text-ink-dim mt-4 text-xs">
            {{ t('inflationPage.hyper.perYear') }} ·
            <a
              :href="currencyHistory.hyperinflation.annualSource.url"
              target="_blank"
              rel="noopener"
              class="text-dino underline underline-offset-4"
              >{{ currencyHistory.hyperinflation.annualSource.source }}</a
            >
          </p>
        </SpotlightCard>

        <div class="flex flex-col gap-6">
          <SpotlightCard
            class="glass flex-1 !rounded-3xl !p-6 sm:!p-7"
            spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
          >
            <p class="text-ink-dim text-sm">{{ t('inflationPage.hyper.accumulatedLabel') }}</p>
            <p class="tabular font-display text-alert mt-2 text-xl font-bold break-words sm:text-3xl">
              {{ currencyHistory.hyperinflation.accumulated1980to1994 }}
            </p>
            <p class="text-ink-dim mt-2 text-xs">
              {{ t('equivalences.sourcePrefix') }}:
              <a
                :href="currencyHistory.hyperinflation.accumulatedSource.url"
                target="_blank"
                rel="noopener"
                class="text-dino underline underline-offset-4"
                >{{ currencyHistory.hyperinflation.accumulatedSource.source }}</a
              >
            </p>
          </SpotlightCard>
          <SpotlightCard
            class="glass flex-1 !rounded-3xl !p-6 sm:!p-7"
            spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
          >
            <p class="text-ink-dim text-sm">{{ t('inflationPage.hyper.realLabel') }}</p>
            <p class="font-display text-money mt-2 text-2xl font-bold sm:text-3xl">
              R$ 1 (1994) = R$ {{ currencyHistory.planoReal.realOneIn1994EqualsIn2024.toLocaleString($i18n.locale) }} (2024)
            </p>
            <p class="text-ink-dim mt-2 text-sm">
              {{ t('inflationPage.hyper.realNote', { pct: currencyHistory.planoReal.accumulatedPctAt30Years }) }}
            </p>
            <p class="text-ink-dim mt-2 text-xs">
              {{ t('equivalences.sourcePrefix') }}:
              <a
                :href="currencyHistory.planoReal.url"
                target="_blank"
                rel="noopener"
                class="text-dino underline underline-offset-4"
                >{{ currencyHistory.planoReal.source }}</a
              >
            </p>
          </SpotlightCard>
        </div>
      </div>
    </section>

    <section class="mt-14">
      <h2 class="font-display text-ink text-2xl font-bold tracking-tight sm:text-4xl">
        {{ t('inflationPage.decades.title') }}
      </h2>
      <p class="text-ink-dim mt-3 text-lg leading-relaxed">
        {{ t('inflationPage.decades.intro') }}
      </p>
      <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SpotlightCard
          v-for="decade in inflationHistory.decades"
          :key="decade.period"
          class="glass !rounded-2xl !p-5"
          spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
        >
          <p class="text-ink-dim text-xs font-semibold tracking-wider uppercase">{{ decade.period }}</p>
          <p class="tabular font-display text-alert mt-1 text-2xl font-bold">{{ decade.stat }}</p>
          <p class="text-ink-dim mt-2 text-sm leading-relaxed">{{ decade.note }}</p>
          <a :href="decade.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-2 inline-block text-xs underline underline-offset-4">
            {{ t('equivalences.sourcePrefix') }}: {{ decade.source }}
          </a>
        </SpotlightCard>
        <div class="border-money/30 bg-money/5 rounded-2xl border p-5">
          <p class="text-money text-xs font-semibold tracking-wider uppercase">{{ t('inflationPage.decades.wageKicker') }}</p>
          <p class="font-display text-ink mt-1 text-lg leading-snug font-bold">{{ t('inflationPage.decades.wageTitle') }}</p>
          <p class="text-ink-dim mt-2 text-sm leading-relaxed">{{ inflationHistory.minimumWage.peakNote }}</p>
          <p class="text-ink-dim mt-2 text-xs leading-relaxed">{{ inflationHistory.minimumWage.creationNote }}</p>
          <a :href="inflationHistory.minimumWage.peakUrl" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-2 inline-block text-xs underline underline-offset-4">
            {{ t('equivalences.sourcePrefix') }}: {{ inflationHistory.minimumWage.peakSource }}
          </a>
        </div>
      </div>
      <p class="text-ink-dim mt-4 text-xs leading-relaxed">
        {{ t('inflationPage.decades.note') }}
        <a :href="inflationHistory.igpSource.url" target="_blank" rel="noopener" class="text-dino underline underline-offset-4">{{ inflationHistory.igpSource.label }}</a>
      </p>
    </section>

    <section class="mt-14">
      <HistoryChart nivel-do-titulo="h2" />
      <HiddenTruth :points="revenueCaveats" />
    </section>

    <section class="mt-16">
      <PoderDeCompra />

      <NivelDePreco class="mt-16" />
    </section>

    <!-- Régua diferente da corrida acima: só a União, não as três esferas. -->
    <section class="mt-10">
      <FederalRevenueChart nivel-do-titulo="h2" />
    </section>

    <section class="mt-12">
      <h2 class="font-display text-ink text-2xl font-bold tracking-tight sm:text-4xl">
        {{ t('inflationPage.calc.title') }}
      </h2>
      <p class="text-ink-dim mt-3 text-lg leading-relaxed">
        {{ t('inflationPage.calc.intro') }}
      </p>

      <div class="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
        <form class="glass space-y-6 rounded-3xl p-6 sm:p-7" @submit.prevent>
          <div class="space-y-2">
            <label for="principal" class="text-ink block text-sm font-semibold">
              {{ t('inflationPage.calc.principal') }}
            </label>
            <div
              class="border-line bg-abyss/70 focus-within:border-dino flex items-center gap-2 rounded-xl border px-4 py-3"
            >
              <span class="text-ink-dim font-medium">{{ prefixo.trim() }}</span>
              <input
                id="principal"
                v-model.number="principalNaTela"
                type="number"
                min="0"
                :step="limiteNaMoeda(1000)"
                inputmode="decimal"
                class="text-ink w-full bg-transparent text-xl font-semibold outline-none"
              >
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div class="space-y-2">
              <label for="years" class="text-ink block text-sm font-semibold">
                {{ t('inflationPage.calc.years') }}
              </label>
              <input
                id="years"
                v-model.number="years"
                type="number"
                min="1"
                max="40"
                class="border-line bg-abyss/70 text-ink focus:border-dino w-full rounded-xl border px-3 py-3 outline-none"
              >
            </div>
            <div class="space-y-2">
              <label for="return" class="text-ink block text-sm font-semibold">
                {{ t('inflationPage.calc.returnPct') }}
              </label>
              <input
                id="return"
                v-model.number="returnPct"
                type="number"
                min="0"
                max="40"
                step="0.5"
                class="border-line bg-abyss/70 text-ink focus:border-dino w-full rounded-xl border px-3 py-3 outline-none"
              >
            </div>
            <div class="space-y-2">
              <label for="inflation" class="text-ink block text-sm font-semibold">
                {{ t('inflationPage.calc.inflationPct') }}
              </label>
              <input
                id="inflation"
                v-model.number="inflationPct"
                type="number"
                min="0"
                max="30"
                step="0.5"
                class="border-line bg-abyss/70 text-ink focus:border-dino w-full rounded-xl border px-3 py-3 outline-none"
              >
            </div>
          </div>

          <p class="text-ink-dim text-xs leading-relaxed">
            {{ t('inflationPage.calc.note', { pct: defaultInflation.toLocaleString($i18n.locale) }) }}
          </p>
        </form>

        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div class="glass rounded-2xl p-4">
              <p class="text-ink-dim text-xs">{{ t('inflationPage.calc.finalValue') }}</p>
              <p class="tabular text-money mt-1 font-bold whitespace-nowrap">
                {{ formatDinheiroInteiro(animatedFinal) }}
              </p>
            </div>
            <div class="glass rounded-2xl p-4">
              <p class="text-ink-dim text-xs">{{ t('inflationPage.calc.inflationPart') }}</p>
              <p class="tabular mt-1 font-bold whitespace-nowrap text-chart-hidden">
                {{ formatDinheiroInteiro(result.inflationPortion) }}
              </p>
            </div>
            <div class="glass rounded-2xl p-4">
              <p class="text-ink-dim text-xs">{{ t('inflationPage.calc.tax') }}</p>
              <p class="tabular text-alert mt-1 font-bold whitespace-nowrap">
                {{ formatDinheiroInteiro(animatedTax) }}
              </p>
            </div>
            <div class="glass rounded-2xl p-4">
              <p class="text-ink-dim text-xs">{{ t('inflationPage.calc.taxOnInflation') }}</p>
              <p class="tabular text-alert mt-1 font-bold whitespace-nowrap">
                {{ formatDinheiroInteiro(animatedTaxOnInflation) }}
              </p>
            </div>
          </div>

          <div class="border-alert/30 bg-alert/5 space-y-3 rounded-3xl border p-6 sm:p-7">
            <p v-if="lostToInflation" class="font-display text-ink text-xl leading-snug font-bold sm:text-2xl">
              {{ t('inflationPage.calc.punchLost', { tax: formatDinheiroInteiro(result.tax) }) }}
            </p>
            <p v-else class="font-display text-ink text-xl leading-snug font-bold sm:text-2xl">
              {{
                t('inflationPage.calc.punchGain', {
                  share: taxOnInflationShare.toLocaleString($i18n.locale, { maximumFractionDigits: 0 }),
                  rate: result.effectiveRealRatePct?.toLocaleString($i18n.locale, { maximumFractionDigits: 1 }) ?? '—',
                })
              }}
            </p>
            <p class="text-ink-dim leading-relaxed">
              {{ t('inflationPage.calc.explain') }}
            </p>
            <p class="text-ink-dim text-xs leading-relaxed">
              {{ t('inflationPage.calc.legalNote') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <SignaturePhrase :phrase="t('signature.inflation')" />

    <NotaMetodologia :nota="t('inflationPage.methodNote')" />
  </div>
</template>
