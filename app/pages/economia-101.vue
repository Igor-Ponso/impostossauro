<script setup lang="ts">
import econPt from '~/data/economia101.json';
const SpotlightCard = defineAsyncComponent(
  () => import('~/components/vb/SpotlightCard/SpotlightCard.vue'),
);

const { t, locale } = useI18n();

const econ = dadoNoIdioma('economia101.json', econPt, locale.value);

usePaginaSeo({ titulo: t('econ101.pageTitle'), descricao: t('econ101.tldr') });

const conceptsReveal = useInView(0.2);

interface Concept {
  key: string;
  anchorValue: string;
  anchorLabel: string;
  note?: string;
  noteUrl?: string;
  noteSource?: string;
  source: string;
  url: string;
}

const concepts = econ.concepts as Concept[];

interface DebateCard {
  key: string;
  finding: string;
  source: string;
  url: string;
}

const lafferDebate = (econ.lafferDebate ?? []) as DebateCard[];

interface LafferCase {
  key: string;
  title: string;
  finding: string;
  numbers: string;
  source: string;
  url: string;
}

const brazilCases = (econ.brazilCases ?? []) as LafferCase[];

interface WorldStat {
  key: string;
  value: string;
  label: string;
  note?: string;
  noteUrl?: string;
  noteSource?: string;
  source: string;
  url: string;
}

const worldData = (econ.worldData ?? []) as WorldStat[];
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-12 sm:py-16">
    <header class="max-w-3xl space-y-4">
      <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t('econ101.kicker') }}
      </p>
      <h1 class="font-display text-ink text-4xl font-bold tracking-tight  md:text-6xl">
        {{ t('econ101.title') }}
      </h1>
      <p class="text-ink-dim text-lg leading-relaxed">
        {{ t('econ101.intro') }}
      </p>
      <TldrBadge :text="t('econ101.tldr')" />
    </header>

    <section class="mt-14">
      <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t('econ101.lafferKicker') }}
      </p>
      <h2 class="font-display text-ink mt-3 text-2xl font-bold tracking-tight sm:text-4xl">
        {{ t('econ101.lafferTitle') }}
      </h2>
      <p class="text-ink mt-4 text-lg leading-relaxed sm:text-xl">
        {{ t('econ101.lafferLead') }}
      </p>

      <!--
        `minmax(0,1fr)` também na base: sem isso a grade cai em `min-width: auto`
        e o gráfico do LafferHill, que rola por dentro, estica a coluna a 522 px
        num celular de 390.
      -->
      <div
        class="mt-8 grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
      >
        <LafferHill />
        <div class="space-y-4">
          <div class="border-money/30 bg-money/5 rounded-3xl border p-6">
            <h3 class="font-display text-money text-lg font-bold">
              {{ t('econ101.lafferHonestyTitle') }}
            </h3>
            <p class="text-ink mt-2 leading-relaxed">
              {{ t('econ101.lafferHonesty') }}
            </p>
          </div>
          <div v-if="econ.lafferHistory" class="glass rounded-3xl p-6">
            <p class="text-ink leading-relaxed">{{ econ.lafferHistory.finding }}</p>
            <a
              :href="econ.lafferHistory.url"
              target="_blank"
              rel="noopener"
              class="text-ink-dim hover:text-dino mt-2 inline-block text-xs underline underline-offset-4"
            >
              {{ t('equivalences.sourcePrefix') }}: {{ econ.lafferHistory.source }}
            </a>
          </div>
        </div>
      </div>

      <div v-if="lafferDebate.length" class="mt-6 grid gap-4 lg:grid-cols-3">
        <SpotlightCard
          v-for="card in lafferDebate"
          :key="card.key"
          class="glass !rounded-3xl !p-6"
          spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
        >
          <p class="text-ink leading-relaxed">{{ card.finding }}</p>
          <a
            :href="card.url"
            target="_blank"
            rel="noopener"
            class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4"
          >
            {{ t('equivalences.sourcePrefix') }}: {{ card.source }}
          </a>
        </SpotlightCard>
      </div>

      <template v-if="brazilCases.length">
        <h3 class="font-display text-ink mt-12 text-xl font-bold tracking-tight sm:text-3xl">
          {{ t('econ101.casesTitle') }}
        </h3>
        <p class="text-ink-dim mt-2 leading-relaxed">
          {{ t('econ101.casesIntro') }}
        </p>
        <div class="mt-6 grid gap-4 lg:grid-cols-3">
          <SpotlightCard
            v-for="item in brazilCases"
            :key="item.key"
            class="glass !rounded-3xl !p-6"
            spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
          >
            <h4 class="font-display text-ink text-lg font-bold">{{ item.title }}</h4>
            <p class="text-ink-dim mt-2 leading-relaxed">{{ item.finding }}</p>
            <p class="tabular text-alert mt-2 font-bold">{{ item.numbers }}</p>
            <a
              :href="item.url"
              target="_blank"
              rel="noopener"
              class="text-ink-dim hover:text-dino mt-2 inline-block text-xs underline underline-offset-4"
            >
              {{ t('equivalences.sourcePrefix') }}: {{ item.source }}
            </a>
          </SpotlightCard>
        </div>
        <p class="text-ink-dim mt-4 text-sm leading-relaxed">
          {{ t('econ101.casesCaveat') }}
        </p>
      </template>
    </section>

    <section :ref="conceptsReveal.target" class="mt-16">
      <h2 class="font-display text-ink text-2xl font-bold tracking-tight sm:text-4xl">
        {{ t('econ101.conceptsTitle') }}
      </h2>
      <p class="text-ink-dim mt-3 text-lg leading-relaxed">
        {{ t('econ101.conceptsIntro') }}
      </p>
      <div class="mt-8 grid gap-4 sm:grid-cols-2">
        <article
          v-for="(concept, index) in concepts"
          :key="concept.key"
          class="glass reveal rounded-3xl p-6 sm:p-7"
          :class="{ in: conceptsReveal.inView.value }"
          :style="{ transitionDelay: `${index * 100}ms` }"
        >
          <h3 class="font-display text-ink text-xl font-bold">
            {{ t(`econ101.concepts.${concept.key}.title`) }}
          </h3>
          <p class="text-ink-dim mt-3 leading-relaxed">
            {{ t(`econ101.concepts.${concept.key}.body`) }}
          </p>
          <div class="border-line mt-4 border-t pt-4">
            <p class="tabular font-display text-alert text-2xl font-bold">{{ concept.anchorValue }}</p>
            <p class="text-ink mt-1 text-sm leading-relaxed">{{ concept.anchorLabel }}</p>
            <!-- `noteUrl`: a nota pode citar fonte diferente da do cartão
                 (informalidade: IBGE na nota, ETCO no cartão). -->
            <p v-if="concept.note" class="text-ink-dim mt-2 text-xs leading-relaxed">
              {{ concept.note }}
              <a
                v-if="'noteUrl' in concept && concept.noteUrl"
                :href="concept.noteUrl"
                target="_blank"
                rel="noopener"
                class="hover:text-dino underline underline-offset-4"
                >{{ concept.noteSource }}</a
              >
            </p>
            <a
              :href="concept.url"
              target="_blank"
              rel="noopener"
              class="text-ink-dim hover:text-dino mt-1 inline-block text-xs underline underline-offset-4"
            >
              {{ t('equivalences.sourcePrefix') }}: {{ concept.source }}
            </a>
          </div>
        </article>
      </div>
    </section>

    <section v-if="worldData.length" class="mt-16">
      <h2 class="font-display text-ink text-2xl font-bold tracking-tight sm:text-4xl">
        {{ t('econ101.worldTitle') }}
      </h2>
      <p class="text-ink-dim mt-3 text-lg leading-relaxed">
        {{ t('econ101.worldIntro') }}
      </p>
      <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SpotlightCard
          v-for="stat in worldData"
          :key="stat.key"
          class="glass !rounded-3xl !p-6"
          spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
        >
          <p class="tabular font-display text-alert text-3xl font-bold">{{ stat.value }}</p>
          <p class="text-ink mt-2 leading-relaxed">{{ stat.label }}</p>
          <p v-if="stat.note" class="text-ink-dim mt-2 text-sm leading-relaxed">{{ stat.note }}</p>
          <a
            :href="stat.url"
            target="_blank"
            rel="noopener"
            class="text-ink-dim hover:text-dino mt-2 inline-block text-xs underline underline-offset-4"
          >
            {{ t('equivalences.sourcePrefix') }}: {{ stat.source }}
          </a>
        </SpotlightCard>
      </div>
    </section>

    <SignaturePhrase :phrase="t('signature.economics')" />

    <NotaMetodologia :nota="t('econ101.methodNote')" />
  </div>
</template>
