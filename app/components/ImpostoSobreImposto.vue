<script setup lang="ts">
import dado from '~/data/imposto-sobre-imposto.json';

/**
 * Três blocos, nesta ordem: o imposto que entra na própria base (a conta que o
 * leitor refaz), as atividades que a lei mantém sem direito a crédito, e a
 * emenda que manda acabar com isso. Nenhuma conta é digitada: sai da alíquota.
 */
const { t, locale } = useI18n();

const reveal = useInView(0.15);
const casosReveal = useInView(0.15);

const { price, rate } = dado.porDentro.example;

const imposto = computed(() => (price * rate) / 100);
const mercadoria = computed(() => price - imposto.value);

/** A alíquota que de fato incide sobre a mercadoria: a / (100 - a). */
const efetiva = (anunciada: number) => (anunciada / (100 - anunciada)) * 100;

const linhas = computed(() => dado.porDentro.rates.map((a) => ({
  anunciada: a,
  real: efetiva(a),
  destaque: a === rate,
})));

const pct = (v: number) => v.toLocaleString(locale.value, {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
});

/**
 * A nota fica em real nas duas rotas: aqui o valor é a régua da conta, não uma
 * medida a converter. Mesma razão de `PoderDeCompra.vue` (ver dinheiroNoFunil).
 */
const num = (v: number) => v.toLocaleString(locale.value, {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
});
</script>

<template>
  <section :ref="reveal.target" class="mt-16">
    <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
      {{ t('econ101.cascadeKicker') }}
    </p>
    <h2 class="font-display text-ink mt-3 text-2xl font-bold tracking-tight sm:text-4xl">
      {{ t('econ101.cascadeTitle') }}
    </h2>
    <p class="text-ink mt-4 text-lg leading-relaxed sm:text-xl">
      {{ t('econ101.cascadeLead') }}
    </p>

    <!-- 1. O imposto dentro da própria base. -->
    <h3 class="font-display text-ink mt-10 text-xl font-bold tracking-tight sm:text-2xl">
      {{ t('econ101.insideTitle') }}
    </h3>
    <p class="text-ink-dim mt-3 leading-relaxed">
      {{ t('econ101.insideLead') }}
    </p>

    <!-- Texto de lei fica em português nas duas rotas: é a prova, não a prosa. -->
    <blockquote class="border-dino/40 text-ink mt-5 border-l-4 pl-4 leading-relaxed italic">
      “{{ dado.porDentro.law.text }}”
    </blockquote>
    <p class="text-ink-dim mt-1 text-xs">
      {{ dado.porDentro.law.label }} · {{ dado.porDentro.law.article }}
    </p>

    <div class="mt-6 grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <article
        class="glass reveal rounded-3xl p-6 sm:p-7"
        :class="{ in: reveal.inView.value }"
      >
        <h4 class="font-display text-ink text-lg font-bold">
          {{ t('econ101.insideWalkTitle') }}
        </h4>
        <dl class="mt-4 space-y-3">
          <div class="flex items-baseline justify-between gap-3">
            <dt class="text-ink-dim text-sm">{{ t('econ101.insideTag') }}</dt>
            <dd class="tabular font-display text-ink text-lg">R$ {{ num(price) }}</dd>
          </div>
          <div class="flex items-baseline justify-between gap-3">
            <dt class="text-ink-dim text-sm">{{ t('econ101.insideTax', { rate: pct(rate) }) }}</dt>
            <dd class="tabular font-display text-alert text-lg">R$ {{ num(imposto) }}</dd>
          </div>
          <div class="border-line flex items-baseline justify-between gap-3 border-t pt-3">
            <dt class="text-ink-dim text-sm">{{ t('econ101.insideGoods') }}</dt>
            <dd class="tabular font-display text-ink text-lg">R$ {{ num(mercadoria) }}</dd>
          </div>
        </dl>
        <div class="border-line mt-4 border-t pt-4">
          <p class="tabular font-display text-alert text-3xl font-bold">
            {{ pct(efetiva(rate)) }}%
          </p>
          <p class="text-ink mt-1 text-sm leading-relaxed">
            {{ t('econ101.insideResult', { rate: pct(rate) }) }}
          </p>
        </div>
      </article>

      <article
        class="glass reveal rounded-3xl p-6 sm:p-7"
        :class="{ in: reveal.inView.value }"
        :style="{ transitionDelay: '100ms' }"
      >
        <h4 class="font-display text-ink text-lg font-bold">
          {{ t('econ101.insideTableTitle') }}
        </h4>
        <table class="mt-4 w-full text-sm">
          <thead>
            <tr class="text-ink-dim text-left text-xs tracking-wider uppercase">
              <th scope="col" class="pb-2 font-semibold">{{ t('econ101.insideAnnounced') }}</th>
              <th scope="col" class="pb-2 text-right font-semibold">{{ t('econ101.insideReal') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="linha in linhas"
              :key="linha.anunciada"
              class="border-line border-t"
            >
              <td class="tabular text-ink py-2.5">{{ pct(linha.anunciada) }}%</td>
              <td
                class="tabular font-display py-2.5 text-right text-lg"
                :class="linha.destaque ? 'text-alert font-bold' : 'text-ink'"
              >{{ pct(linha.real) }}%</td>
            </tr>
          </tbody>
        </table>
        <p class="text-ink-dim mt-4 text-xs leading-relaxed">
          {{ t('econ101.insideTableNote') }}
        </p>
      </article>
    </div>

    <!-- 2. Onde a cascata acontece de verdade: sem crédito, o imposto anterior vira custo. -->
    <h3 class="font-display text-ink mt-12 text-xl font-bold tracking-tight sm:text-2xl">
      {{ t('econ101.cascadeWhereTitle') }}
    </h3>
    <p class="text-ink-dim mt-3 leading-relaxed">
      {{ t('econ101.cascadeWhereLead') }}
    </p>

    <blockquote class="border-dino/40 text-ink mt-5 border-l-4 pl-4 leading-relaxed italic">
      “{{ dado.cumulativo.law.text }}”
    </blockquote>
    <p class="text-ink-dim mt-1 text-xs">
      {{ dado.cumulativo.law.label }} · {{ dado.cumulativo.law.article }}
    </p>

    <ul :ref="casosReveal.target" class="mt-6 grid gap-3 sm:grid-cols-2">
      <li
        v-for="(caso, index) in dado.cumulativo.casos"
        :key="caso.key"
        class="glass reveal flex items-baseline gap-3 rounded-2xl p-4"
        :class="{ in: casosReveal.inView.value }"
        :style="{ transitionDelay: `${index * 60}ms` }"
      >
        <span class="tabular text-ink-dim shrink-0 text-xs font-semibold">{{ caso.inciso }}</span>
        <span class="text-ink text-sm leading-relaxed">{{ t(`econ101.cascadeCases.${caso.key}`) }}</span>
      </li>
    </ul>

    <p class="text-ink-dim mt-4 text-sm leading-relaxed">
      {{ t('econ101.cascadeWhereNote') }}
    </p>

    <!-- 3. A prova de que o problema existe: emendaram a Constituição para resolvê-lo. -->
    <h3 class="font-display text-ink mt-12 text-xl font-bold tracking-tight sm:text-2xl">
      {{ t('econ101.cascadeFixTitle') }}
    </h3>
    <p class="text-ink-dim mt-3 leading-relaxed">
      {{ t('econ101.cascadeFixLead') }}
    </p>

    <blockquote class="border-dino/40 text-ink mt-5 border-l-4 pl-4 leading-relaxed italic">
      “{{ dado.reforma.law.text }}”
    </blockquote>
    <p class="text-ink-dim mt-1 text-xs">
      {{ dado.reforma.law.label }} · {{ dado.reforma.law.article }}
    </p>

    <p class="font-display text-ink mt-8 text-lg leading-snug font-bold sm:text-xl">
      {{ t('econ101.cascadeQuestion') }}
    </p>

    <p class="text-ink-dim mt-4 text-xs leading-relaxed">
      {{ t('equivalences.sourcePrefix') }}:
      <template
        v-for="(bloco, index) in [dado.porDentro.law, dado.cumulativo.law, dado.reforma.law]"
        :key="bloco.url"
      >
        <span v-if="index > 0" aria-hidden="true"> · </span>
        <a
          class="hover:text-dino underline underline-offset-4"
          :href="bloco.url"
          target="_blank"
          rel="noopener"
        >{{ bloco.label }}</a>
      </template>
    </p>
  </section>
</template>
