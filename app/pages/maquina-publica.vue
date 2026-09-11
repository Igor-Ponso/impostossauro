<script setup lang="ts">
import federativePt from '~/data/federative.json';
import statesDataPt from '~/data/states.json';
const SpotlightCard = defineAsyncComponent(
  () => import('~/components/vb/SpotlightCard/SpotlightCard.vue'),
);

const { t, locale } = useI18n();

const federative = dadoNoIdioma('federative.json', federativePt, locale.value);
const statesData = dadoNoIdioma('states.json', statesDataPt, locale.value);

usePaginaSeo({ titulo: t('federative.pageTitle'), descricao: t('federative.tldr') });

const dependencyReveal = useInView(0.2);
const verdictReveal = useInView(0.2);

interface Stat {
  key: string;
  value: string;
  label: string;
  source: string;
  url: string;
}

interface Verdict {
  key: string;
  institution: string;
  /** Frase literal do documento; só existe quando foi lida lá. */
  quote?: string;
  /** Paráfrase; a tela a sinaliza como tal. */
  finding: string;
  unverified?: boolean;
  source: string;
  url: string;
}

const howItWorks = federative.howItWorks as Stat[];
const dependency = federative.dependency as Stat[];
const verdict = federative.verdict as Verdict[];
/** `fiscalYears` só traz ano com as duas metades da conta nos 27 estados. */
const hasMap = statesData.fiscalYears.length > 0;
const sanitation = federative.sanitationExtremes;
const piaui = federative.piauiCase;
const ratio = federative.returnRatio;
const ratioReveal = useInView(0.2);

const mapCaveats = computed(() => [
  { title: t('map.hiddenSentTitle'), text: t('map.hiddenSentText') },
  {
    title: t('map.hiddenReceivedTitle'),
    text: t('map.hiddenReceivedText'),
    source: ratio.keyInsight.source,
    url: ratio.keyInsight.url,
  },
  { title: t('map.hiddenDependenceTitle'), text: t('map.hiddenDependenceText') },
  { title: t('map.hiddenNominalTitle'), text: t('map.hiddenNominalText') },
]);
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-12 sm:py-16">
    <header class="max-w-3xl space-y-4">
      <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t('federative.kicker') }}
      </p>
      <h1 class="font-display text-ink text-4xl font-bold tracking-tight  md:text-6xl">
        {{ t('federative.title') }}
      </h1>
      <p class="text-ink-dim text-lg leading-relaxed">
        {{ t('federative.intro') }}
      </p>
      <TldrBadge :text="t('federative.tldr')" />
    </header>
    <!-- ART: maquina-fluxo · representação conceitual; valores permanecem no mapa -->
    <Art id="maquina-fluxo" class="mx-auto mt-8 w-full max-w-2xl" />

    <section class="mt-14">
      <h2 class="font-display text-ink text-2xl font-bold tracking-tight sm:text-4xl">
        {{ t('federative.howTitle') }}
      </h2>
      <div class="mt-6 grid gap-4 sm:grid-cols-2">
        <SpotlightCard
          v-for="item in howItWorks"
          :key="item.key"
          class="glass !rounded-3xl !p-6 sm:!p-7"
          spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
        >
          <p class="tabular font-display text-money text-3xl font-bold sm:text-4xl">{{ item.value }}</p>
          <p class="text-ink mt-3 leading-relaxed">{{ item.label }}</p>
          <a :href="item.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4">
            {{ t('equivalences.sourcePrefix') }}: {{ item.source }}
          </a>
        </SpotlightCard>
      </div>
    </section>

    <section :ref="ratioReveal.target" class="mt-16">
      <h2 class="font-display text-ink text-2xl font-bold tracking-tight sm:text-4xl">
        {{ t('federative.ratioTitle') }}
      </h2>
      <p class="text-ink-dim mt-3 text-lg leading-relaxed">
        {{ t('federative.ratioIntro') }}
      </p>

      <div class="mt-8 grid gap-4 lg:grid-cols-2">
        <article
          class="glass reveal rounded-3xl p-6 sm:p-7"
          :class="{ in: ratioReveal.inView.value }"
        >
          <p class="font-display text-ink text-lg font-bold">{{ ratio.narrowRuler.label }}</p>
          <p class="text-ink-dim mt-2 text-sm leading-relaxed">{{ ratio.narrowRuler.explain }}</p>
          <p v-if="ratio.narrowRuler.scope" class="text-ink-dim mt-2 text-sm leading-relaxed">
            {{ ratio.narrowRuler.scope }}
          </p>
          <p class="text-ink-dim mt-5 text-xs tracking-[0.16em] uppercase">
            {{ ratio.narrowRuler.unit }}
          </p>
          <ul class="border-line/60 mt-3 divide-y divide-line/40 border-t">
            <li v-for="row in ratio.narrowRuler.rows" :key="row.uf" class="py-3">
              <div class="flex items-baseline justify-between gap-4">
                <span class="text-ink">{{ row.uf }}</span>
                <span class="tabular font-display text-money text-2xl font-bold whitespace-nowrap">
                  {{ row.value }}
                </span>
              </div>
              <p v-if="row.note" class="text-ink-dim mt-1 text-xs leading-relaxed">{{ row.note }}</p>
            </li>
          </ul>
          <a
            :href="ratio.narrowRuler.url"
            target="_blank"
            rel="noopener"
            class="text-ink-dim hover:text-dino mt-4 inline-block text-xs underline underline-offset-4"
          >
            {{ t('equivalences.sourcePrefix') }}: {{ ratio.narrowRuler.source }}
          </a>
        </article>

        <article
          class="glass reveal rounded-3xl p-6 sm:p-7"
          :class="{ in: ratioReveal.inView.value }"
          style="transition-delay: 120ms"
        >
          <p class="font-display text-ink text-lg font-bold">{{ ratio.broadRuler.label }}</p>
          <p class="text-ink-dim mt-2 text-sm leading-relaxed">{{ ratio.broadRuler.explain }}</p>
          <!--
            As linhas da régua ampla não estão no texto da página citada (devem
            estar num gráfico); `unverified` mantém o aviso até serem lidas.
          -->
          <p v-if="'unverified' in ratio.broadRuler && ratio.broadRuler.unverified" class="text-ink-dim mt-2 text-xs leading-relaxed">
            {{ t('federative.rowsUnverified') }}
          </p>
          <ul class="border-line/60 mt-8 divide-y divide-line/40 border-t">
            <li v-for="row in ratio.broadRuler.rows" :key="row.uf" class="py-3">
              <div class="flex items-baseline justify-between gap-4">
                <span class="text-ink">{{ row.uf }}</span>
                <span class="tabular font-display text-2xl font-bold whitespace-nowrap text-chart-hidden">
                  {{ row.value }}
                </span>
              </div>
              <p v-if="row.note" class="text-ink-dim mt-1 text-xs leading-relaxed">{{ row.note }}</p>
            </li>
          </ul>
          <a
            :href="ratio.broadRuler.url"
            target="_blank"
            rel="noopener"
            class="text-ink-dim hover:text-dino mt-4 inline-block text-xs underline underline-offset-4"
          >
            {{ t('equivalences.sourcePrefix') }}: {{ ratio.broadRuler.source }}
          </a>
        </article>
      </div>

      <article class="border-money/30 bg-money/5 mt-6 rounded-3xl border p-6 sm:p-8">
        <p class="text-money text-xs font-semibold tracking-[0.18em] uppercase">
          {{ ratio.keyInsight.title }}
        </p>
        <p class="text-ink mt-3 text-lg leading-relaxed">{{ ratio.keyInsight.finding }}</p>
        <a
          :href="ratio.keyInsight.url"
          target="_blank"
          rel="noopener"
          class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4"
        >
          {{ t('equivalences.sourcePrefix') }}: {{ ratio.keyInsight.source }}
        </a>
      </article>

      <SpotlightCard
        class="glass mt-4 !rounded-3xl !p-6 sm:!p-7"
        spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
      >
        <p class="text-ink-dim leading-relaxed">{{ ratio.confirmation.finding }}</p>
        <a
          :href="ratio.confirmation.url"
          target="_blank"
          rel="noopener"
          class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4"
        >
          {{ t('equivalences.sourcePrefix') }}: {{ ratio.confirmation.source }}
        </a>
      </SpotlightCard>

      <article class="border-line mt-4 rounded-3xl border border-dashed p-6 sm:p-7">
        <p class="font-display text-ink font-bold">{{ t('federative.officialGapTitle') }}</p>
        <p class="text-ink-dim mt-3 leading-relaxed">{{ ratio.officialGap.finding }}</p>
        <ul class="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          <li v-for="src in ratio.officialGap.sources" :key="src.url">
            <a
              :href="src.url"
              target="_blank"
              rel="noopener"
              class="text-ink-dim hover:text-dino text-xs underline underline-offset-4"
            >
              {{ src.label }}
            </a>
          </li>
        </ul>
      </article>
    </section>

    <section :ref="dependencyReveal.target" class="mt-16">
      <h2 class="font-display text-ink text-2xl font-bold tracking-tight sm:text-4xl">
        {{ t('federative.dependencyTitle') }}
      </h2>
      <p class="text-ink-dim mt-3 text-lg leading-relaxed">
        {{ t('federative.dependencyIntro') }}
      </p>
      <div class="mt-8 grid gap-4 sm:grid-cols-3">
        <article
          v-for="(item, index) in dependency"
          :key="item.key"
          class="glass reveal rounded-3xl p-6"
          :class="{ in: dependencyReveal.inView.value }"
          :style="{ transitionDelay: `${index * 100}ms` }"
        >
          <p class="tabular font-display text-alert text-3xl font-bold sm:text-4xl">{{ item.value }}</p>
          <p class="text-ink mt-2 leading-relaxed">{{ item.label }}</p>
          <a :href="item.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-2 inline-block text-xs underline underline-offset-4">
            {{ t('equivalences.sourcePrefix') }}: {{ item.source }}
          </a>
        </article>
      </div>
    </section>

    <section :ref="verdictReveal.target" class="mt-16">
      <h2 class="font-display text-ink text-2xl font-bold tracking-tight sm:text-4xl">
        {{ t('federative.verdictTitle') }}
      </h2>
      <p class="text-ink mt-4 text-lg leading-relaxed">
        {{ t('federative.verdictIntro') }}
      </p>
      <div class="mt-8 grid gap-4 lg:grid-cols-2">
        <article
          v-for="(item, index) in verdict"
          :key="item.key"
          class="border-alert/30 bg-alert/5 reveal rounded-3xl border p-6 sm:p-8"
          :class="{ in: verdictReveal.inView.value }"
          :style="{ transitionDelay: `${index * 120}ms` }"
        >
          <p class="text-alert text-xs font-semibold tracking-[0.2em] uppercase">
            {{ item.institution }}
          </p>
          <!-- Aspas só em `quote`: `finding` é paráfrase, e paráfrase entre aspas é citação falsa. -->
          <p v-if="item.quote" class="font-display text-ink mt-3 text-lg leading-snug font-bold sm:text-xl">
            “{{ item.quote }}”
          </p>
          <p v-else class="font-display text-ink mt-3 text-lg leading-snug font-bold sm:text-xl">
            {{ item.finding }}
          </p>
          <p v-if="item.quote" class="text-ink-dim mt-3 text-sm leading-relaxed">{{ item.finding }}</p>
          <p v-else class="text-ink-dim mt-3 text-xs">
            {{ t(item.unverified ? 'federative.paraphraseUnverified' : 'federative.paraphrase') }}
          </p>
          <a :href="item.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4">
            {{ t('equivalences.sourcePrefix') }}: {{ item.source }}
          </a>
        </article>
      </div>
    </section>

    <section class="mt-16">
      <h2 class="font-display text-ink text-2xl font-bold tracking-tight sm:text-4xl">
        {{ t('federative.indicatorsTitle') }}
      </h2>
      <p class="text-ink-dim mt-3 text-lg leading-relaxed">
        {{ t('federative.indicatorsIntro') }}
      </p>

      <div class="mt-8 grid gap-4 sm:grid-cols-2">
        <div class="glass rounded-3xl p-6">
          <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">{{ t('federative.best') }}</p>
          <ul class="mt-4 space-y-3">
            <li v-for="item in sanitation.best" :key="item.uf" class="flex items-center gap-3">
              <span class="tabular text-ink w-16 shrink-0 text-lg font-bold">{{ item.pct.toLocaleString($i18n.locale, { minimumFractionDigits: 1 }) }}%</span>
              <span class="bg-line/40 h-2 flex-1 overflow-hidden rounded-full">
                <span class="bg-dino block h-full rounded-full" :style="{ width: `${item.pct}%` }" />
              </span>
              <span class="text-ink-dim w-32 shrink-0 text-sm">{{ item.uf }}</span>
            </li>
          </ul>
        </div>
        <SpotlightCard
          class="glass !rounded-3xl !p-6"
          spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
        >
          <p class="text-alert text-xs font-semibold tracking-[0.2em] uppercase">{{ t('federative.worst') }}</p>
          <ul class="mt-4 space-y-3">
            <li v-for="item in sanitation.worst" :key="item.uf" class="flex items-center gap-3">
              <span class="tabular text-ink w-16 shrink-0 text-lg font-bold">{{ item.pct.toLocaleString($i18n.locale, { minimumFractionDigits: 1 }) }}%</span>
              <span class="bg-line/40 h-2 flex-1 overflow-hidden rounded-full">
                <span class="bg-alert block h-full rounded-full" :style="{ width: `${item.pct}%` }" />
              </span>
              <span class="text-ink-dim w-32 shrink-0 text-sm">{{ item.uf }}</span>
            </li>
          </ul>
        </SpotlightCard>
      </div>
      <p class="text-ink-dim mt-3 text-xs">
        {{ sanitation.metric }} ({{ sanitation.year }}) ·
        <a :href="sanitation.url" target="_blank" rel="noopener" class="hover:text-dino underline underline-offset-4">
          {{ sanitation.source }}
        </a>
      </p>

      <article class="border-money/30 bg-money/5 mt-6 rounded-3xl border p-6 sm:p-8">
        <p class="text-money text-xs font-semibold tracking-[0.18em] uppercase">{{ piaui.title }}</p>
        <p class="text-ink mt-3 leading-relaxed">{{ piaui.finding }}</p>
        <a :href="piaui.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4">
          {{ t('equivalences.sourcePrefix') }}: {{ piaui.source }}
        </a>
      </article>
    </section>

    <section class="mt-16">
      <CargaPorEsfera nivel-do-titulo="h2" />
    </section>

    <section v-if="hasMap" class="mt-16">
      <h2 class="font-display text-ink text-2xl font-bold tracking-tight sm:text-4xl">
        {{ t('federative.mapTitle') }}
      </h2>
      <p class="text-ink-dim mt-3 text-lg leading-relaxed">
        {{ t('federative.mapIntro') }}
      </p>
      <div class="mt-8">
        <BrazilMap />
      </div>
      <HiddenTruth :points="mapCaveats" />
    </section>
    <p v-else class="text-ink-dim border-line mt-10 rounded-3xl border border-dashed p-6 text-sm leading-relaxed">
      {{ t('federative.mapPending') }}
    </p>

    <section class="mt-16">
      <h2 class="font-display text-ink text-2xl font-bold tracking-tight sm:text-4xl">
        {{ t('federative.honestyTitle') }}
      </h2>
      <p class="text-ink-dim mt-3 text-lg leading-relaxed">
        {{ t('federative.honestyIntro') }}
      </p>
      <div class="mt-6 space-y-4">
        <SpotlightCard
          class="glass !rounded-3xl !p-6 sm:!p-7"
          spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
        >
          <p class="font-display text-ink font-bold">{{ federative.counterpoint.title }}</p>
          <p class="text-ink-dim mt-3 leading-relaxed">{{ federative.counterpoint.finding }}</p>
          <a :href="federative.counterpoint.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4">
            {{ t('equivalences.sourcePrefix') }}: {{ federative.counterpoint.source }}
          </a>
        </SpotlightCard>
        <SpotlightCard
          class="glass !rounded-3xl !p-6 sm:!p-7"
          spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
        >
          <p class="font-display text-ink font-bold">{{ federative.originCaveat.title }}</p>
          <p class="text-ink-dim mt-3 leading-relaxed">{{ federative.originCaveat.finding }}</p>
          <a :href="federative.originCaveat.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4">
            {{ t('equivalences.sourcePrefix') }}: {{ federative.originCaveat.source }}
          </a>
        </SpotlightCard>
      </div>
    </section>

    <NuxtLink :to="$localePath('/eles-gastaram')" class="border-control bg-card text-ink mt-16 block rounded-3xl border p-6 sm:p-8">
      <span class="font-display block text-2xl">{{ t('spending.title') }}</span>
      <span class="text-ink-dim mt-3 block">{{ t('spending.machineCta') }} →</span>
    </NuxtLink>

    <SignaturePhrase :phrase="t('signature.publicMachine')" />

    <NotaMetodologia :nota="t('federative.methodNote')" />
  </div>
</template>
