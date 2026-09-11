<script setup lang="ts">
interface Passo {
  date: string;
  text: string;
  source: string;
  url: string;
}
interface Caso {
  key: string;
  government: { key: string; name: string; party: string; period: string };
  justification: {
    quote?: string;
    paraphrase: string;
    speaker: string;
    role?: string;
    date: string;
    source: string;
    url: string;
  };
  measure: {
    name: string;
    legalArticle: string;
    legalText?: string;
    legalNote?: string;
    changes?: Array<{ item: string; from: string; to: string; unit: string }>;
    expected?: string;
    source: string;
    url: string;
  };
  outcome: {
    indicator: string;
    headline: string;
    headlineLabel: string;
    steps: Passo[];
  };
  question: string;
}

const props = defineProps<{ caso: Caso }>();

const { t } = useI18n();
const { target, inView } = useInView(0.15);

const caso = computed(() => props.caso);

const corDoNo = (indice: number, total: number) =>
  indice === total - 1 ? 'var(--color-alert)' : 'var(--color-ink-dim)';
</script>

<template>
  <article
    ref="target"
    class="glass reveal rounded-3xl p-5 sm:p-8"
    :class="{ in: inView }"
  >
    <header>
      <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t('justifications.caseKicker') }}
      </p>
      <h3 class="font-display text-ink mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
        {{ caso.measure.name }}
      </h3>
      <p class="text-ink-dim mt-2 text-sm">
        {{ caso.government.name }} · {{ caso.government.party }} · {{ caso.government.period }}
      </p>
    </header>

    <section class="mt-8">
      <p class="text-money text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t('justifications.actJustification') }}
      </p>
      <blockquote
        v-if="caso.justification.quote"
        class="border-money/50 text-ink mt-3 border-l-2 pl-4 text-lg leading-snug font-semibold sm:text-xl"
      >
        “{{ caso.justification.quote }}”
      </blockquote>
      <p class="text-ink-dim mt-3 text-base leading-relaxed">
        {{ caso.justification.paraphrase }}
      </p>
      <p class="text-ink-dim mt-2 text-xs">
        {{ caso.justification.speaker
        }}<template v-if="caso.justification.role">, {{ caso.justification.role }}</template>
        · {{ caso.justification.date }} ·
        <a
          :href="caso.justification.url"
          target="_blank"
          rel="noopener"
          class="hover:text-dino underline underline-offset-4"
          >{{ caso.justification.source }}</a
        >
      </p>
    </section>

    <section class="border-line mt-8 border-t pt-8">
      <p class="text-money text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t('justifications.actMeasure') }}
      </p>
      <p class="font-display text-ink mt-3 text-lg font-bold">{{ caso.measure.legalArticle }}</p>

      <blockquote
        v-if="caso.measure.legalText"
        class="border-line text-ink-dim mt-3 border-l-2 pl-4 text-sm leading-relaxed italic"
      >
        “{{ caso.measure.legalText }}”
      </blockquote>
      <p v-if="caso.measure.legalNote" class="text-alert mt-3 text-sm leading-relaxed font-semibold">
        {{ caso.measure.legalNote }}
      </p>

      <div
        v-if="caso.measure.changes?.length"
        class="mt-5 grid gap-3"
        :class="caso.measure.changes.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'"
      >
        <div v-for="mudanca in caso.measure.changes" :key="mudanca.item" class="bg-card/60 border-line rounded-2xl border p-4">
          <p class="text-ink-dim text-xs">{{ mudanca.item }}</p>
          <p class="tabular font-display mt-1 text-base font-bold">
            <span class="text-ink-dim line-through">{{ mudanca.from }}</span>
            <span class="text-alert ml-2">{{ mudanca.to }}</span>
          </p>
          <p class="text-ink-dim mt-1 text-xs">{{ mudanca.unit }}</p>
        </div>
      </div>

      <p v-if="caso.measure.expected" class="text-ink-dim mt-4 text-sm">
        {{ t('justifications.expectedLabel') }}
        <b class="tabular text-ink">{{ caso.measure.expected }}</b>
      </p>
      <p class="text-ink-dim mt-2 text-xs">
        <a :href="caso.measure.url" target="_blank" rel="noopener" class="hover:text-dino underline underline-offset-4">
          {{ caso.measure.source }}
        </a>
      </p>
    </section>

    <section class="border-line mt-8 border-t pt-8">
      <p class="text-alert text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t('justifications.actOutcome') }}
      </p>
      <p class="text-ink-dim mt-3 text-sm">{{ caso.outcome.indicator }}</p>

      <p class="tabular font-display text-alert mt-4 text-4xl leading-none font-bold sm:text-6xl">
        {{ caso.outcome.headline }}
      </p>
      <p class="text-ink-dim mt-2 text-sm">{{ caso.outcome.headlineLabel }}</p>

      <!-- O respiro (`pb-6`) fica na coluna de texto, nunca na <li>: na linha, o trilho se parte entre os passos. -->
      <ol class="mt-7">
        <li
          v-for="(passo, indice) in caso.outcome.steps"
          :key="passo.date + indice"
          class="grid grid-cols-[18px_1fr] gap-4 sm:grid-cols-[22px_1fr] sm:gap-5"
        >
          <div class="relative flex flex-col items-center pt-1">
            <span
              v-if="indice < caso.outcome.steps.length - 1"
              aria-hidden="true"
              class="bg-line absolute top-3 bottom-0 left-1/2 w-px -translate-x-1/2"
            />
            <span
              aria-hidden="true"
              class="relative h-2.5 w-2.5 shrink-0 rounded-full"
              :style="{ background: corDoNo(indice, caso.outcome.steps.length) }"
            />
          </div>
          <div :class="indice === caso.outcome.steps.length - 1 ? 'pb-0' : 'pb-6'">
            <p class="tabular text-ink text-xs font-bold tracking-wider uppercase">{{ passo.date }}</p>
            <p
              class="mt-1 text-base leading-relaxed"
              :class="indice === caso.outcome.steps.length - 1 ? 'text-ink font-semibold' : 'text-ink-dim'"
            >
              {{ passo.text }}
            </p>
            <a
              :href="passo.url"
              target="_blank"
              rel="noopener"
              class="text-ink-dim hover:text-dino mt-1 inline-block text-xs underline underline-offset-4"
            >
              {{ passo.source }}
            </a>
          </div>
        </li>
      </ol>
    </section>

    <div class="border-alert/30 bg-alert/5 mt-8 rounded-3xl border p-6 sm:p-7">
      <p class="text-alert text-lg leading-relaxed font-bold sm:text-xl">{{ caso.question }}</p>
    </div>
  </article>
</template>
