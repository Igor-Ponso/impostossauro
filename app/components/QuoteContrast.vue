<script setup lang="ts">

const SpotlightCard = defineAsyncComponent(
  () => import('~/components/vb/SpotlightCard/SpotlightCard.vue'),
);
interface Receipt {
  value: string;
  label: string;
  /** Trecho literal do `label` a marcar; se não for substring dele, nada é marcado. */
  highlight?: string;
  period?: string;
  source: string;
  url: string;
  direction?: 'up' | 'down' | 'flat';
}

interface ContrastQuote {
  text: string;
  speaker: string;
  role?: string;
  date?: string;
  occasion?: string;
  /** Resumo do veículo, não fala literal: sai sem aspas e com o aviso. */
  paraphrase?: boolean;
  source: string;
  url: string;
}

const props = defineProps<{
  quote: ContrastQuote;
  receipts: Receipt[];
  question?: string;
}>();

const { t } = useI18n();
const { target, inView } = useInView(0.15);

const arrow = (direction?: string) =>
  direction === 'up' ? '↑' : direction === 'down' ? '↓' : '';
const arrowClass = (direction?: string) =>
  direction === 'up' ? 'text-alert' : direction === 'down' ? 'text-chart-visible' : 'text-ink';

/** Split em vez de `v-html`: texto vindo de JSON de dado nunca vira HTML. */
function pedacos(recibo: Receipt): { texto: string; marcado: boolean }[] {
  if (!recibo.highlight) return [{ texto: recibo.label, marcado: false }];
  const corte = recibo.label.indexOf(recibo.highlight);
  if (corte < 0) return [{ texto: recibo.label, marcado: false }];
  return [
    { texto: recibo.label.slice(0, corte), marcado: false },
    { texto: recibo.highlight, marcado: true },
    { texto: recibo.label.slice(corte + recibo.highlight.length), marcado: false },
  ].filter((p) => p.texto.length > 0);
}

const meta = computed(() =>
  [props.quote.paraphrase ? t('dossier.paraphrase') : '', props.quote.role, props.quote.occasion, props.quote.date].filter(Boolean).join(' · '),
);
</script>

<template>
  <SpotlightCard
    ref="target"
    class="glass reveal overflow-hidden !rounded-3xl !p-6"
    :class="{ in: inView }"
    spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
  >
    <div class="border-line relative border-b p-6 sm:p-8">
      <span
        class="font-display text-dino/15 pointer-events-none absolute -top-4 left-3 text-[7rem] leading-none select-none"
        aria-hidden="true"
        >“</span
      >
      <p class="text-dino relative text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t('contrast.kicker') }}
      </p>
      <blockquote class="font-display text-ink relative mt-4 text-xl leading-snug font-bold  sm:text-2xl">
        {{ quote.paraphrase ? quote.text : `“${quote.text}”` }}
      </blockquote>
      <p class="text-ink relative mt-4 font-semibold">
        {{ quote.speaker }}
      </p>
      <p class="text-ink-dim relative text-sm">
        <template v-if="meta">{{ meta }} · </template>
        <a :href="quote.url" target="_blank" rel="noopener" class="text-dino underline underline-offset-4">
          {{ quote.source }}
        </a>
      </p>
    </div>

    <div class="bg-abyss/40 p-6 sm:p-8">
      <p class="text-alert text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t('contrast.receipts') }}
      </p>
      <div class="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <div v-for="receipt in receipts" :key="receipt.label">
          <p class="tabular font-display text-2xl font-bold" :class="arrowClass(receipt.direction)">
            <span v-if="arrow(receipt.direction)" aria-hidden="true">{{ arrow(receipt.direction) }} </span>{{ receipt.value }}
          </p>
          <p class="text-ink mt-1 leading-snug">
            <template v-for="(pedaco, i) in pedacos(receipt)" :key="i"><span
              v-if="pedaco.marcado"
              class="marca-texto text-alert -mx-0.5 px-1 font-semibold"
            >{{ pedaco.texto }}</span><template v-else>{{ pedaco.texto }}</template></template>
          </p>
          <p class="text-ink-dim mt-1 text-xs">
            <template v-if="receipt.period">{{ receipt.period }} · </template>
            <a :href="receipt.url" target="_blank" rel="noopener" class="hover:text-dino underline underline-offset-4">
              {{ receipt.source }}
            </a>
          </p>
        </div>
      </div>
      <p v-if="question" class="text-ink mt-6 text-lg leading-relaxed font-semibold italic">
        {{ question }}
      </p>
    </div>
  </SpotlightCard>
</template>
