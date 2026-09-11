<script setup lang="ts">
import type { PromiseCase } from '~/utils/promises';
const SpotlightCard = defineAsyncComponent(
  () => import('~/components/vb/SpotlightCard/SpotlightCard.vue'),
);

interface Caso extends PromiseCase {
  government: { label: string; period: string; note?: string };
  tribute: {
    name: string;
    acronym: string;
    law: { type: string; number: string; year: number; date?: string; url: string };
  };
  promise: {
    legalArticle: string;
    legalText: string;
    deadlineArticle?: string;
    deadlineText?: string;
    quote?: {
      text: string;
      speaker: string;
      role?: string;
      date?: string;
      source: string;
      url: string;
    };
    source: string;
    url: string;
  };
  collected: {
    amount: string;
    period: string;
    months?: number;
    lastYear?: string;
    source: string;
    url: string;
    note?: string;
  };
  outcome: {
    indicator: string;
    legalArticle?: string;
    legalText?: string;
    split?: { destino: string; aliquota?: string; fatia: string }[];
    source: string;
    url: string;
  };
  loophole?: {
    name: string;
    explanation: string;
    amendments?: { number: string; year: number; url: string }[];
    source: string;
    url: string;
  };
  end?: { text: string; source: string; url: string };
  question: string;
}

const props = defineProps<{ caso: PromiseCase }>();

const { t } = useI18n();
const { target, inView } = useInView(0.15);

/** `promises.ts` só garante `verified` e `legalText`; o resto da forma vem de `promises.json`. */
const caso = computed(() => props.caso as unknown as Caso);

const nameParts = computed(() => {
  const partes = caso.value.tribute.name.split(/(provis[oó]ria)/gi).filter(Boolean);
  return partes.map((texto) => ({ texto, destaque: /^provis[oó]ria$/i.test(texto) }));
});
</script>

<template>
  <SpotlightCard
    ref="target"
    class="glass reveal overflow-hidden !rounded-3xl !p-6"
    :class="{ in: inView }"
    spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
  >
    <div class="border-line border-b p-6 sm:p-8">
      <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t('promiseContrast.promiseLabel') }}
      </p>
      <p class="text-ink-dim mt-2 text-xs">{{ caso.government.label }} · {{ caso.government.period }}</p>
      <h3 class="font-display text-ink mt-3 text-2xl leading-snug font-bold sm:text-3xl">{{ caso.tribute.acronym }}</h3>
      <p class="text-ink mt-1 leading-snug">
        <span v-for="(parte, i) in nameParts" :key="i" :class="parte.destaque ? 'text-alert font-semibold' : ''">{{
          parte.texto
        }}</span>
      </p>
      <p class="text-ink-dim mt-1 text-sm">
        <a :href="caso.tribute.law.url" target="_blank" rel="noopener" class="text-dino underline underline-offset-4">
          {{ caso.tribute.law.type }} {{ caso.tribute.law.number }}/{{ caso.tribute.law.year
          }}<template v-if="caso.tribute.law.date">, de {{ caso.tribute.law.date }}</template>
        </a>
      </p>

      <blockquote class="border-dino/40 text-ink mt-5 border-l-4 pl-4 leading-relaxed italic">
        “{{ caso.promise.legalText }}”
      </blockquote>
      <p class="text-ink-dim mt-1 text-xs">{{ caso.promise.legalArticle }}</p>

      <template v-if="caso.promise.deadlineText">
        <p class="text-ink-dim mt-4 text-xs font-semibold tracking-[0.18em] uppercase">
          {{ t('promiseContrast.deadlinePromised') }}
        </p>
        <blockquote class="border-dino/40 text-ink mt-2 border-l-4 pl-4 leading-relaxed italic">
          “{{ caso.promise.deadlineText }}”
        </blockquote>
        <p class="text-ink-dim mt-1 text-xs">{{ caso.promise.deadlineArticle }}</p>
      </template>

      <p class="text-ink-dim mt-3 text-xs">
        {{ t('equivalences.sourcePrefix') }}:
        <a
          :href="caso.promise.url"
          target="_blank"
          rel="noopener"
          class="hover:text-dino underline underline-offset-4"
          >{{ caso.promise.source }}</a
        >
      </p>

      <div v-if="caso.promise.quote" class="border-line bg-abyss/40 mt-5 rounded-2xl border p-4">
        <p class="text-ink font-semibold italic">“{{ caso.promise.quote.text }}”</p>
        <p class="text-ink-dim mt-1 text-xs">
          {{ caso.promise.quote.speaker }}<template v-if="caso.promise.quote.role">, {{ caso.promise.quote.role }}</template>
          ·
          <a
            :href="caso.promise.quote.url"
            target="_blank"
            rel="noopener"
            class="hover:text-dino underline underline-offset-4"
            >{{ caso.promise.quote.source }}</a
          >
        </p>
      </div>
    </div>

    <div class="bg-abyss/40 border-line border-b p-6 sm:p-8">
      <p class="text-money text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t('promiseContrast.collectedLabel') }}
      </p>
      <p class="tabular font-display text-money mt-3 text-3xl font-bold sm:text-4xl">
        {{ caso.collected.amount }}
      </p>
      <p class="text-ink mt-1">
        {{ caso.collected.period }}
        <template v-if="caso.collected.months"> · {{ caso.collected.months }} {{ t('promiseContrast.months') }}</template>
      </p>
      <p v-if="caso.collected.lastYear" class="text-ink-dim mt-1 text-sm">{{ caso.collected.lastYear }}</p>
      <p class="text-ink-dim mt-3 text-xs">
        {{ t('equivalences.sourcePrefix') }}:
        <a
          :href="caso.collected.url"
          target="_blank"
          rel="noopener"
          class="hover:text-dino underline underline-offset-4"
          >{{ caso.collected.source }}</a
        >
      </p>
      <p v-if="caso.collected.note" class="text-ink-dim mt-1 text-xs italic">{{ caso.collected.note }}</p>
    </div>

    <div class="border-line border-b p-6 sm:p-8">
      <p class="text-alert text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t('promiseContrast.outcomeLabel') }}
      </p>
      <p class="text-ink mt-3 leading-relaxed font-semibold">{{ caso.outcome.indicator }}</p>

      <blockquote
        v-if="caso.outcome.legalText"
        class="border-alert/40 text-ink mt-4 border-l-4 pl-4 leading-relaxed italic"
      >
        “{{ caso.outcome.legalText }}”
      </blockquote>
      <p v-if="caso.outcome.legalArticle" class="text-ink-dim mt-1 text-xs">{{ caso.outcome.legalArticle }}</p>

      <div
        v-if="caso.outcome.split?.length"
        class="mt-5 grid gap-4"
        :class="caso.outcome.split.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'"
      >
        <div v-for="fatia in caso.outcome.split" :key="fatia.destino" class="bg-abyss/60 border-line rounded-2xl border p-4">
          <p class="tabular font-display text-ink text-2xl font-bold">{{ fatia.fatia }}</p>
          <p class="text-ink-dim mt-1 text-sm">{{ fatia.destino }}</p>
          <p v-if="fatia.aliquota" class="text-ink-dim mt-1 text-xs">
            {{ t('promiseContrast.rate') }}: {{ fatia.aliquota }}
          </p>
        </div>
      </div>

      <p class="text-ink-dim mt-3 text-xs">
        {{ t('equivalences.sourcePrefix') }}:
        <a
          :href="caso.outcome.url"
          target="_blank"
          rel="noopener"
          class="hover:text-dino underline underline-offset-4"
          >{{ caso.outcome.source }}</a
        >
      </p>
    </div>

    <div v-if="caso.loophole" class="border-alert/30 bg-alert/5 border-line border-b p-6 sm:p-8">
      <p class="text-alert text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t('promiseContrast.loopholeLabel') }}
      </p>
      <h4 class="font-display text-ink mt-2 text-lg font-bold">{{ caso.loophole.name }}</h4>
      <p class="text-ink mt-2 leading-relaxed">{{ caso.loophole.explanation }}</p>
      <ul v-if="caso.loophole.amendments?.length" class="mt-3 flex flex-wrap gap-2">
        <li v-for="emenda in caso.loophole.amendments" :key="emenda.number">
          <a
            :href="emenda.url"
            target="_blank"
            rel="noopener"
            class="glass text-ink-dim hover:text-dino rounded-full px-3 py-1 text-xs underline underline-offset-4"
            >EC {{ emenda.number }}/{{ emenda.year }}</a
          >
        </li>
      </ul>
      <p class="text-ink-dim mt-3 text-xs">
        {{ t('equivalences.sourcePrefix') }}:
        <a
          :href="caso.loophole.url"
          target="_blank"
          rel="noopener"
          class="hover:text-dino underline underline-offset-4"
          >{{ caso.loophole.source }}</a
        >
      </p>
    </div>

    <p v-if="caso.end" class="border-line border-b p-6 text-sm leading-relaxed sm:p-8">
      <span class="text-ink-dim">{{ caso.end.text }}</span>
      <a :href="caso.end.url" target="_blank" rel="noopener" class="text-dino ml-2 underline underline-offset-4">{{
        caso.end.source
      }}</a>
    </p>

    <div class="bg-abyss/40 p-6 sm:p-8">
      <p class="text-ink text-lg leading-relaxed font-semibold italic">{{ caso.question }}</p>
    </div>
  </SpotlightCard>
</template>
