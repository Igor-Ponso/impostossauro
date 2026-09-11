<script setup lang="ts">
import contrastsDataPt from '~/data/contrasts.json';
import governmentsPt from '~/data/governments.json';

const props = defineProps<{ governmentKey: string }>();

const { t, locale } = useI18n();

const contrastsData = dadoNoIdioma('contrasts.json', contrastsDataPt, locale.value);
const governments = dadoNoIdioma('governments.json', governmentsPt, locale.value);

const government = computed(
  () => governments.governments.find((entry) => entry.key === props.governmentKey) ?? null,
);

interface Contrast {
  key: string;
  governmentKey: string;
  quote: {
    text: string;
    speaker: string;
    role?: string;
    date?: string;
    occasion?: string;
    paraphrase?: boolean;
    source: string;
    url: string;
  };
  receipts: {
    value: string;
    label: string;
    period?: string;
    source: string;
    url: string;
    direction?: 'up' | 'down' | 'flat';
  }[];
  question?: string;
}

const contrasts = computed(() =>
  (contrastsData.contrasts as Contrast[]).filter(
    (entry) => entry.governmentKey === props.governmentKey,
  ),
);
const { target, inView } = useInView(0.15);
</script>

<template>
  <section v-if="government" ref="target" class="mt-14">
    <div class="reveal" :class="{ in: inView }">
      <p class="text-alert text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t('dossier.kicker') }}
      </p>
      <h2 class="font-display text-ink mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
        {{ government.fullName }}
      </h2>
      <p class="text-ink-dim mt-2 text-lg">
        {{ government.party }} · {{ government.period }}
      </p>
    </div>

    <div class="mt-8 space-y-5">
      <div
        class="glass reveal rounded-3xl p-6 sm:p-7"
        :class="{ in: inView }"
        style="transition-delay: 100ms"
      >
        <h3 class="font-display text-dino text-lg font-bold tracking-wide uppercase">
          {{ t('dossier.promised') }}
        </h3>
        <ul class="mt-5 space-y-5">
          <li v-for="promise in government.promises" :key="promise.quote">
            <!-- Paráfrase nunca sai entre aspas: aspas prometem fala literal. -->
            <blockquote class="text-ink border-dino/40 border-l-2 pl-4 text-lg leading-snug font-semibold">
              {{ 'paraphrase' in promise && promise.paraphrase ? promise.quote : `“${promise.quote}”` }}
            </blockquote>
            <p class="text-ink-dim mt-2 pl-4 text-sm">
              <template v-if="'paraphrase' in promise && promise.paraphrase">{{ t('dossier.paraphrase') }} · </template>{{ promise.context }} ·
              <a
                :href="promise.url"
                target="_blank"
                rel="noopener"
                class="text-dino underline underline-offset-4"
                >{{ promise.source }}</a
              >
            </p>
          </li>
        </ul>
      </div>

      <div
        class="glass reveal rounded-3xl p-6 sm:p-7"
        :class="{ in: inView }"
        style="transition-delay: 200ms"
      >
        <h3 class="font-display text-alert text-lg font-bold tracking-wide uppercase">
          {{ t('dossier.numbers') }}
        </h3>
        <ul class="mt-5 space-y-4">
          <li v-for="outcome in government.outcomes" :key="outcome.label">
            <p class="text-ink font-semibold">{{ outcome.label }}</p>
            <p class="tabular text-alert text-lg font-bold">{{ outcome.value }}</p>
            <!-- `note` declara divergência conhecida da fonte, no mesmo peso do número. -->
            <p v-if="'note' in outcome && outcome.note" class="text-ink-dim mt-1 text-xs leading-relaxed">
              {{ outcome.note }}
              <a
                v-if="'noteUrl' in outcome && outcome.noteUrl"
                :href="outcome.noteUrl"
                target="_blank"
                rel="noopener"
                class="hover:text-dino underline underline-offset-4"
                >{{ t('equivalences.sourcePrefix') }}</a
              >
            </p>
            <a
              :href="outcome.url"
              target="_blank"
              rel="noopener"
              class="text-ink-dim hover:text-dino mt-1 inline-block text-xs underline underline-offset-4"
              >{{ outcome.source }}</a
            >
          </li>
        </ul>
      </div>
    </div>

    <div
      v-if="government.excuse"
      class="border-money/30 bg-money/5 reveal mt-5 rounded-3xl border p-6 sm:p-7"
      :class="{ in: inView }"
      style="transition-delay: 300ms"
    >
      <h3 class="font-display text-money text-lg font-bold tracking-wide uppercase">
        {{ t('dossier.excuse') }}
      </h3>
      <blockquote class="text-ink mt-3 text-lg leading-snug font-semibold">
        {{ 'paraphrase' in government.excuse && government.excuse.paraphrase ? government.excuse.quote : `“${government.excuse.quote}”` }}
      </blockquote>
      <p class="text-ink-dim mt-2 text-sm">
        <template v-if="'paraphrase' in government.excuse && government.excuse.paraphrase">{{ t('dossier.paraphrase') }} · </template>{{ government.excuse.context }} ·
        <a
          :href="government.excuse.url"
          target="_blank"
          rel="noopener"
          class="text-dino underline underline-offset-4"
          >{{ government.excuse.source }}</a
        >
      </p>
    </div>

    <div v-if="contrasts.length" class="mt-8 space-y-6">
      <QuoteContrast
        v-for="contrast in contrasts"
        :key="contrast.key"
        :quote="contrast.quote"
        :receipts="contrast.receipts"
        :question="contrast.question"
      />
    </div>

    <p class="text-ink mt-8 text-lg leading-relaxed font-semibold italic">
      {{ t('dossier.question') }}
    </p>
    <p class="text-ink-dim mt-2 text-xs">{{ t('dossier.note') }}</p>
  </section>
</template>
