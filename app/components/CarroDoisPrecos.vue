<script setup lang="ts">
import dado from '~/data/carro-dois-precos.json';
import cambio from '~/data/cambio.json';

/**
 * O mesmo carro, da mesma fábrica, com duas etiquetas. Nenhum número é digitado
 * na tela: o tributo sai da carga sobre o preço brasileiro, e a conversão sai da
 * PTAX do Banco Central que o site já publica.
 *
 * Cada preço fica na moeda em que a fonte o publicou — por isso esta tela está
 * em `TELAS_EM_REAL` (mesma razão de `OQueDavaParaComprar.vue`).
 */
const { t, locale } = useI18n();

const reveal = useInView(0.15);

const { brasil, paraguai, carga, imunidade } = dado;

const paraguaiEmReal = computed(() => paraguai.preco * cambio.usdBrl);
const tributo = computed(() => (brasil.preco * carga.pct) / 100);
const brasilSemTributo = computed(() => brasil.preco - tributo.value);
/** O que sobra depois de tirar o tributo: se for pequeno, o tributo explica tudo. */
const sobra = computed(() => brasilSemTributo.value - paraguaiEmReal.value);
const explicado = computed(
  () => (tributo.value / (brasil.preco - paraguaiEmReal.value)) * 100,
);

const num = (v: number, casas = 2) => v.toLocaleString(locale.value, {
  minimumFractionDigits: casas, maximumFractionDigits: casas,
});
</script>

<template>
  <section :ref="reveal.target" class="mt-16">
    <div class="grid items-center gap-8 lg:grid-cols-2">
      <div class="min-w-0">
        <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
          {{ t('econ101.carKicker') }}
        </p>
        <h2 class="font-display text-ink mt-3 text-2xl font-bold tracking-tight sm:text-4xl">
          {{ t('econ101.carTitle') }}
        </h2>
        <p class="text-ink mt-4 text-lg leading-relaxed sm:text-xl">
          {{ t('econ101.carLead', { modelo: dado.modelo }) }}
        </p>
      </div>
      <Art id="carro-dois-precos" sizes="(min-width: 1152px) 544px, (min-width: 1024px) calc((100vw - 64px) / 2), calc(100vw - 32px)" class="w-full rounded-3xl" />
    </div>

    <div class="mt-8 grid gap-4 sm:grid-cols-2">
      <article class="glass reveal rounded-3xl p-6 sm:p-7" :class="{ in: reveal.inView.value }">
        <p class="text-ink-dim text-xs font-semibold tracking-wider uppercase">
          {{ t('econ101.carHere') }}
        </p>
        <p class="tabular font-display text-alert mt-2 text-3xl font-bold sm:text-4xl">
          R$ {{ num(brasil.preco, 0) }}
        </p>
        <p class="text-ink-dim mt-2 text-xs leading-relaxed">{{ brasil.versao }}</p>
        <a
          class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4"
          :href="brasil.url" target="_blank" rel="noopener"
        >{{ brasil.source }}</a>
      </article>

      <article
        class="glass reveal rounded-3xl p-6 sm:p-7"
        :class="{ in: reveal.inView.value }"
        :style="{ transitionDelay: '90ms' }"
      >
        <p class="text-ink-dim text-xs font-semibold tracking-wider uppercase">
          {{ t('econ101.carThere') }}
        </p>
        <p class="tabular font-display text-ink mt-2 text-3xl font-bold sm:text-4xl">
          US$ {{ num(paraguai.preco, 0) }}
        </p>
        <p class="text-ink mt-1 text-sm">
          {{ t('econ101.carConverted', { valor: `R$ ${num(paraguaiEmReal, 0)}` }) }}
        </p>
        <p class="text-ink-dim mt-2 text-xs leading-relaxed">{{ paraguai.versao }}</p>
        <a
          class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4"
          :href="paraguai.url" target="_blank" rel="noopener"
        >{{ paraguai.source }}</a>
      </article>
    </div>

    <!-- O corte: tirar o tributo do preço brasileiro e comparar de novo. -->
    <h3 class="font-display text-ink mt-12 text-xl font-bold tracking-tight sm:text-2xl">
      {{ t('econ101.carCutTitle') }}
    </h3>
    <p class="text-ink-dim mt-3 leading-relaxed">
      {{ t('econ101.carCutLead', { pct: num(carga.pct) }) }}
      <a
        class="hover:text-dino underline underline-offset-4"
        :href="carga.url" target="_blank" rel="noopener"
      >{{ carga.source }}</a>
    </p>

    <div class="glass reveal mt-6 rounded-3xl p-6 sm:p-8" :class="{ in: reveal.inView.value }">
      <dl class="space-y-3">
        <div class="flex items-baseline justify-between gap-3">
          <dt class="text-ink-dim text-sm">{{ t('econ101.carRowBr') }}</dt>
          <dd class="tabular font-display text-ink text-lg">R$ {{ num(brasil.preco) }}</dd>
        </div>
        <div class="flex items-baseline justify-between gap-3">
          <dt class="text-ink-dim text-sm">{{ t('econ101.carRowTax', { pct: num(carga.pct) }) }}</dt>
          <dd class="tabular font-display text-alert text-lg">− R$ {{ num(tributo) }}</dd>
        </div>
        <div class="border-line flex items-baseline justify-between gap-3 border-t pt-3">
          <dt class="text-ink text-sm font-semibold">{{ t('econ101.carRowNet') }}</dt>
          <dd class="tabular font-display text-ink text-xl font-bold">R$ {{ num(brasilSemTributo) }}</dd>
        </div>
        <div class="flex items-baseline justify-between gap-3">
          <dt class="text-ink text-sm font-semibold">{{ t('econ101.carRowPy') }}</dt>
          <dd class="tabular font-display text-ink text-xl font-bold">R$ {{ num(paraguaiEmReal) }}</dd>
        </div>
        <div class="border-line flex items-baseline justify-between gap-3 border-t pt-3">
          <dt class="text-ink-dim text-sm">{{ t('econ101.carRowLeft') }}</dt>
          <dd class="tabular font-display text-money text-lg">R$ {{ num(sobra) }}</dd>
        </div>
      </dl>

      <p class="font-display text-ink mt-6 text-lg leading-snug font-bold sm:text-xl">
        {{ t('econ101.carPunch', { pct: num(explicado, 0) }) }}
      </p>
    </div>

    <!-- A ressalva que a peça precisa carregar: imunidade de exportação é regra
         universal, e é justamente ela que torna a comparação possível. -->
    <h3 class="font-display text-ink mt-12 text-xl font-bold tracking-tight sm:text-2xl">
      {{ t('econ101.carWhyTitle') }}
    </h3>
    <p class="text-ink-dim mt-3 leading-relaxed">
      {{ t('econ101.carWhyLead') }}
    </p>
    <blockquote class="border-dino/40 text-ink mt-5 border-l-4 pl-4 leading-relaxed italic">
      “{{ imunidade.text }}”
    </blockquote>
    <p class="text-ink-dim mt-1 text-xs">
      {{ imunidade.label }} · {{ imunidade.article }}
    </p>
    <p class="text-ink-dim mt-4 text-sm leading-relaxed">
      {{ t('econ101.carWhyNote') }}
    </p>

    <p class="text-ink-dim mt-4 text-sm leading-relaxed">
      {{ t('econ101.carCaveat', { data: brasil.consultaEm, ptax: num(cambio.usdBrl, 4), ptaxData: cambio.data }) }}
    </p>

    <p class="font-display text-ink mt-8 text-lg leading-snug font-bold sm:text-xl">
      {{ t('econ101.carQuestion') }}
    </p>

    <p class="text-ink-dim mt-4 text-xs leading-relaxed">
      {{ t('equivalences.sourcePrefix') }}:
      <a class="hover:text-dino underline underline-offset-4" :href="brasil.url" target="_blank" rel="noopener">{{ brasil.source }}</a>
      <span aria-hidden="true"> · </span>
      <a class="hover:text-dino underline underline-offset-4" :href="paraguai.url" target="_blank" rel="noopener">{{ paraguai.source }}</a>
      <span aria-hidden="true"> · </span>
      <a class="hover:text-dino underline underline-offset-4" :href="carga.url" target="_blank" rel="noopener">{{ carga.source }}</a>
      <span aria-hidden="true"> · </span>
      <a class="hover:text-dino underline underline-offset-4" :href="cambio.url" target="_blank" rel="noopener">{{ cambio.source }}</a>
    </p>
  </section>
</template>
