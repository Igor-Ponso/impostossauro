<script setup lang="ts">
import fallaciesPt from '~/data/fallacies.json';
import taxDataPt from '~/data/tax-data.json';

const { t, locale } = useI18n();
const { converter, prefixo } = useMoeda();

const bi = (valor: number) => converter(valor).toLocaleString(locale.value, { maximumFractionDigits: 1 });

const fallacies = dadoNoIdioma('fallacies.json', fallaciesPt, locale.value);
const taxData = dadoNoIdioma('tax-data.json', taxDataPt, locale.value);

usePaginaSeo({ titulo: t('fallacies.pageTitle'), descricao: t('fallacies.tldr') });

const goldReveal = useInView(0.2);
const hungerReveal = useInView(0.2);
const hungerMoneyReveal = useInView(0.25);
const indicatorsReveal = useInView(0.15);

const revenue2025 = taxData.revenueSeries.at(-1)!;

const fome = fallacies.hunger44;

/**
 * `wfpBrlBillions` está em reais de out/2022 (PTAX); a arrecadação é do ano
 * corrente. O IPCA acumulado desde out/2022 corrige antes de dividir — a
 * mesma conta de HungerFallacy.vue.
 */
const anoBaseCambio = 2022;
// `ipcaSeries` só tem anos fechados: nov-dez/2022 entram por
// `ipcaMonthsAfterOct2022`, para a régua começar em out/2022.
const ipcaNovDez2022 = taxData.ipcaMonthsAfterOct2022.reduce((fator, mes) => fator * (1 + mes.pct / 100), 1);
const ipcaAcumulado = taxData.ipcaSeries
  .filter((item) => item.year > anoBaseCambio && item.year <= revenue2025.year)
  .reduce((fator, item) => fator * (1 + item.pct / 100), ipcaNovDez2022);

const razaoFome = Math.round(revenue2025.totalBillions / (fome.wfpBrlBillions * ipcaAcumulado));
const diasFome = Math.max(1, Math.round(((fome.wfpBrlBillions * ipcaAcumulado) / revenue2025.totalBillions) * 365));

// Uma casa decimal: arredondar ao inteiro muda a divisão que o leitor refaz
// (102 em vez de 101).
const wfpCorrected = fome.wfpBrlBillions * ipcaAcumulado;

const hunger44Sources = [...fome.sources, { label: revenue2025.source, url: revenue2025.url }];

const trendColor: Record<string, string> = {
  improved: 'text-dino',
  slow: 'text-money',
  stagnant: 'text-alert',
};
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-12 sm:py-16">
    <header class="max-w-3xl space-y-4">
      <p class="text-alert text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t('fallacies.kicker') }}
      </p>
      <h1 class="font-display text-ink text-4xl font-bold tracking-tight  md:text-6xl">
        {{ t('fallacies.title') }}
      </h1>
      <p class="text-ink-dim text-lg leading-relaxed">
        {{ t('fallacies.intro') }}
      </p>
      <TldrBadge :text="t('fallacies.tldr')" />
    </header>

    <section :ref="goldReveal.target" class="reveal mt-14" :class="{ in: goldReveal.inView.value }">
      <div class="glass overflow-hidden rounded-3xl">
        <Art id="falacia-ouro" class="mx-auto w-full max-w-2xl" />
        <div class="border-line border-b p-6 sm:p-8">
          <p class="text-ink-dim text-xs font-semibold tracking-[0.18em] uppercase">
            {{ t('fallacies.claimLabel') }}
          </p>
          <blockquote class="font-display text-ink mt-2 text-2xl font-bold sm:text-3xl">
            “{{ t('fallacies.gold.claim') }}”
          </blockquote>
        </div>
        <div class="space-y-5 p-6 sm:p-8">
          <p class="text-ink-dim text-xs font-semibold tracking-[0.18em] uppercase">
            {{ t('fallacies.mathLabel') }}
          </p>
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="bg-abyss/60 border-line rounded-2xl border p-4">
              <p class="tabular font-display text-money text-2xl font-bold">
                {{ fallacies.gold.documentedArrivalTonnes }} t
              </p>
              <p class="text-ink-dim mt-1 text-sm">{{ t('fallacies.gold.statDocumented') }}</p>
            </div>
            <div class="bg-abyss/60 border-line rounded-2xl border p-4">
              <p class="tabular font-display text-money text-2xl font-bold">
                {{ prefixo }}{{ bi(fallacies.gold.valueLowBrlBillions) }}–{{ bi(fallacies.gold.valueHighBrlBillions) }} bi
              </p>
              <p class="text-ink-dim mt-1 text-sm">{{ t('fallacies.gold.statValue') }}</p>
            </div>
            <div class="bg-abyss/60 border-alert/40 rounded-2xl border p-4">
              <p class="tabular font-display text-alert text-2xl font-bold">
                {{ fallacies.gold.daysLow }}–{{ fallacies.gold.daysHigh }} {{ t('fallacies.gold.days') }}
              </p>
              <p class="text-ink-dim mt-1 text-sm">
                {{ t('fallacies.gold.statDays', { year: revenue2025.year }) }}
              </p>
            </div>
          </div>
          <p class="font-display text-ink text-xl leading-snug font-bold sm:text-2xl">
            {{ t('fallacies.gold.punch') }}
          </p>
          <ul class="text-ink-dim flex flex-wrap gap-x-5 gap-y-1 text-xs">
            <li v-for="source in fallacies.gold.sources" :key="source.url">
              <a :href="source.url" target="_blank" rel="noopener" class="hover:text-ink underline underline-offset-4">
                {{ source.label }}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section :ref="hungerReveal.target" class="reveal mt-10" :class="{ in: hungerReveal.inView.value }">
      <div class="glass overflow-hidden rounded-3xl">
        <Art id="falacia-regua" class="mx-auto w-full max-w-2xl" />
        <div class="border-line border-b p-6 sm:p-8">
          <p class="text-ink-dim text-xs font-semibold tracking-[0.18em] uppercase">
            {{ t('fallacies.claimLabel') }}
          </p>
          <blockquote class="font-display text-ink mt-2 text-2xl font-bold sm:text-3xl">
            “{{ t('fallacies.hunger.claim') }}”
          </blockquote>
        </div>
        <div class="space-y-5 p-6 sm:p-8">
          <p class="text-ink-dim text-xs font-semibold tracking-[0.18em] uppercase">
            {{ t('fallacies.mathLabel') }}
          </p>
          <ol class="space-y-4">
            <li
              v-for="step in fallacies.hungerMap.timeline"
              :key="step.year"
              class="flex flex-wrap items-baseline gap-x-3 gap-y-1"
            >
              <span class="tabular font-display text-dino text-xl font-bold">{{ step.year }}</span>
              <span class="text-ink font-semibold">
                {{ step.event === 'exit' ? t('fallacies.hunger.exit') : t('fallacies.hunger.return') }}
              </span>
              <span class="glass text-ink-dim rounded-full px-2.5 py-0.5 text-xs">{{ step.threshold }}</span>
              <span class="text-ink-dim text-sm">PoU: {{ step.pou }}</span>
            </li>
          </ol>
          <p class="text-ink-dim leading-relaxed">
            {{ t('fallacies.hunger.body') }}
          </p>
          <p class="font-display text-ink text-xl leading-snug font-bold sm:text-2xl">
            {{ t('fallacies.hunger.punch') }}
          </p>
          <ul class="text-ink-dim flex flex-wrap gap-x-5 gap-y-1 text-xs">
            <li v-for="source in fallacies.hungerMap.sources" :key="source.url">
              <a :href="source.url" target="_blank" rel="noopener" class="hover:text-ink underline underline-offset-4">
                {{ source.label }}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section :ref="hungerMoneyReveal.target" class="reveal mt-10" :class="{ in: hungerMoneyReveal.inView.value }">
      <div class="glass overflow-hidden rounded-3xl">
        <Art id="falacia-fome" class="mx-auto w-full max-w-2xl" />
        <div class="border-line border-b p-6 sm:p-8">
          <p class="text-ink-dim text-xs font-semibold tracking-[0.18em] uppercase">
            {{ t('fallacies.claimLabel') }}
          </p>
          <blockquote class="font-display text-ink mt-2 text-2xl font-bold sm:text-3xl">
            “{{ t('fallacies.hunger44.claim') }}”
          </blockquote>
          <p class="text-ink-dim mt-2 text-xs">
            {{
              t('hungerFallacy.fxNote', {
                usd: fome.twitterUsdBillions,
                ptax: fome.ptaxRate.toLocaleString($i18n.locale, { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
                nominal: fome.twitterBrlBillions,
              })
            }}
          </p>
        </div>
        <div class="space-y-5 p-6 sm:p-8">
          <p class="text-ink-dim text-xs font-semibold tracking-[0.18em] uppercase">
            {{ t('fallacies.mathLabel') }}
          </p>
          <p class="text-ink-dim leading-relaxed">
            {{ t('fallacies.hunger44.body') }}
          </p>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="bg-abyss/60 border-line rounded-2xl border p-4">
              <p class="tabular font-display text-money text-2xl font-bold">
                {{ prefixo }}{{ bi(fome.wfpBrlBillions) }} bi
              </p>
              <p class="text-ink-dim mt-1 text-sm">{{ t('fallacies.hunger44.statPlan') }}</p>
              <p class="text-ink-dim mt-1 text-xs">
                {{
                  t('hungerFallacy.ipcaNote', {
                    nominal: fome.wfpBrlBillions,
                    corrected: wfpCorrected.toLocaleString($i18n.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
                    year: revenue2025.year,
                  })
                }}
              </p>
            </div>
            <div class="bg-abyss/60 border-line rounded-2xl border p-4">
              <p class="tabular font-display text-money text-2xl font-bold">
                {{ prefixo }}{{ converter(revenue2025.totalBillions / 1000).toLocaleString($i18n.locale, { maximumFractionDigits: 2 }) }} tri
              </p>
              <p class="text-ink-dim mt-1 text-sm">
                {{ t('fallacies.hunger44.statRevenue', { year: revenue2025.year }) }}
              </p>
            </div>
          </div>
          <p class="font-display text-ink text-xl leading-snug font-bold sm:text-2xl">
            {{ t('fallacies.hunger44.punch', { times: razaoFome, days: diasFome }) }}
          </p>
          <ul class="text-ink-dim flex flex-wrap gap-x-5 gap-y-1 text-xs">
            <li v-for="fonte in hunger44Sources" :key="fonte.url">
              <a :href="fonte.url" target="_blank" rel="noopener" class="hover:text-ink underline underline-offset-4">
                {{ fonte.label }}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <TaxaQueNaoConta class="mt-10" />

    <section :ref="indicatorsReveal.target" class="mt-16">
      <div class="reveal" :class="{ in: indicatorsReveal.inView.value }">
        <p class="text-alert text-xs font-semibold tracking-[0.2em] uppercase">
          {{ t('fallacies.indicators.kicker') }}
        </p>
        <h2 class="font-display text-ink mt-3 text-3xl font-bold tracking-tight  sm:text-5xl">
          {{ t('fallacies.indicators.title', { trillions: fallacies.fortyTrillion.totalTrillions, years: fallacies.fortyTrillion.periodYears }) }}
        </h2>
        <p class="text-ink-dim mt-4 text-lg leading-relaxed">
          {{ t('fallacies.indicators.intro', { years: fallacies.fortyTrillion.periodYears }) }}
        </p>
        <p class="text-ink-dim mt-1 text-xs">
          {{ fallacies.fortyTrillion.note }}
          {{ t('equivalences.sourcePrefix') }}:
          <a :href="fallacies.fortyTrillion.url" target="_blank" rel="noopener" class="text-dino underline underline-offset-4">
            {{ fallacies.fortyTrillion.source }}
          </a>
        </p>
      </div>

      <div class="mt-8 grid gap-4 sm:grid-cols-2">
        <article
          v-for="(indicator, index) in fallacies.indicators"
          :key="indicator.key"
          class="glass reveal rounded-3xl p-6"
          :class="{ in: indicatorsReveal.inView.value }"
          :style="{ transitionDelay: `${index * 100}ms` }"
        >
          <h3 class="text-ink text-lg font-semibold">
            {{ t(`fallacies.indicators.items.${indicator.key}.label`) }}
          </h3>
          <div class="mt-3 flex flex-wrap items-center gap-3">
            <div class="bg-abyss/60 border-line rounded-xl border px-4 py-2">
              <p class="text-ink-dim text-[10px] uppercase">{{ indicator.thenYear }}</p>
              <p class="tabular text-ink font-bold">{{ indicator.then }}</p>
            </div>
            <span class="text-ink-dim" aria-hidden="true">→</span>
            <div class="bg-abyss/60 border-line rounded-xl border px-4 py-2">
              <p class="text-ink-dim text-[10px] uppercase">{{ indicator.nowYear }}</p>
              <p class="tabular font-bold" :class="trendColor[indicator.trend]">{{ indicator.now }}</p>
            </div>
          </div>
          <p class="text-ink-dim mt-3 text-sm leading-relaxed">
            {{ t(`fallacies.indicators.items.${indicator.key}.comment`) }}
          </p>
          <a
            :href="indicator.url"
            target="_blank"
            rel="noopener"
            class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4"
          >
            {{ t('equivalences.sourcePrefix') }}: {{ indicator.source }}
          </a>
        </article>
      </div>

      <div class="border-alert/30 bg-alert/5 mt-8 rounded-3xl border p-6 sm:p-8">
        <p class="font-display text-ink text-xl leading-snug font-bold sm:text-2xl">
          {{ t('fallacies.indicators.punch') }}
        </p>
      </div>
    </section>

    <SignaturePhrase :phrase="t('signature.fallacies')" />

    <NotaMetodologia :nota="t('fallacies.methodNote')" />
  </div>
</template>
