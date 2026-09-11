<script setup lang="ts">
import dado from '~/data/renda-minima.json';

/**
 * Quem está no fim da fila da peça anterior. O Estado define em lei quanto é
 * pouco demais para viver, paga a diferença, e depois escreve outra lei para
 * devolver o imposto a essas mesmas famílias. Os dois textos são a prova.
 */
const { t, locale } = useI18n();

const reveal = useInView(0.15);

/**
 * Valores em real nas duas rotas: são o piso definido pela lei brasileira, não
 * uma medida a converter. Mesma razão de `PoderDeCompra.vue`.
 */
const num = (v: number) => v.toLocaleString(locale.value, {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
});

const { elegibilidade, beneficios } = dado.programa;

/**
 * O texto da lei mora aqui, e não no JSON de dado, por duas razões: ele fica em
 * português nas duas rotas (é a prova, não a prosa) e a quantia dentro dele não
 * pode passar pelo funil de moeda — converter a citação a tornaria falsa.
 * Esta tela está em `TELAS_EM_REAL` justamente por isso.
 */
const LEI = {
  elegibilidade: 'São elegíveis ao Programa Bolsa Família as famílias […] cuja renda familiar per capita mensal seja igual ou inferior a R$ 218,00 (duzentos e dezoito reais).',
  objetivo: 'combater a fome, por meio da transferência direta de renda às famílias beneficiárias.',
  cashback: 'Serão devolvidos […] para pessoas físicas que forem integrantes de famílias de baixa renda: I - a CBS, pela União; e II - o IBS, pelos Estados, pelo Distrito Federal e pelos Municípios.',
  cesta: 'Ficam reduzidas a zero as alíquotas do IBS e da CBS incidentes sobre as vendas de produtos destinados à alimentação humana […] que compõem a Cesta Básica Nacional de Alimentos.',
} as const;
</script>

<template>
  <section :ref="reveal.target" class="mt-16">
    <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
      {{ t('econ101.floorKicker') }}
    </p>
    <h2 class="font-display text-ink mt-3 text-2xl font-bold tracking-tight sm:text-4xl">
      {{ t('econ101.floorTitle') }}
    </h2>
    <p class="text-ink mt-4 text-lg leading-relaxed sm:text-xl">
      {{ t('econ101.floorLead') }}
    </p>

    <!-- 1. O Estado define o piso. -->
    <blockquote class="border-dino/40 text-ink mt-6 border-l-4 pl-4 leading-relaxed italic">
      “{{ LEI.elegibilidade }}”
    </blockquote>
    <p class="text-ink-dim mt-1 text-xs">
      {{ dado.programa.label }} · {{ elegibilidade.article }}
    </p>

    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <article
        class="glass reveal rounded-3xl p-5 sm:p-6"
        :class="{ in: reveal.inView.value }"
      >
        <p class="text-ink-dim text-xs leading-relaxed">{{ t('econ101.floorLineLabel') }}</p>
        <p class="tabular font-display text-alert mt-2 text-3xl font-bold">R$ {{ num(elegibilidade.valor) }}</p>
        <p class="text-ink-dim mt-1 text-xs">{{ t('econ101.floorPerPerson') }}</p>
      </article>

      <article
        v-for="(b, index) in beneficios"
        :key="b.key"
        class="glass reveal rounded-3xl p-5 sm:p-6"
        :class="{ in: reveal.inView.value }"
        :style="{ transitionDelay: `${(index + 1) * 80}ms` }"
      >
        <p class="text-ink-dim text-xs leading-relaxed">{{ t(`econ101.floorBenefits.${b.key}`) }}</p>
        <p class="tabular font-display text-ink mt-2 text-3xl font-bold">R$ {{ num(b.valor) }}</p>
        <p class="text-ink-dim mt-1 text-xs">{{ b.article }}</p>
      </article>
    </div>

    <p class="text-ink mt-6 leading-relaxed">
      {{ t('econ101.floorPurpose') }}
    </p>
    <blockquote class="border-dino/40 text-ink mt-4 border-l-4 pl-4 leading-relaxed italic">
      “{{ LEI.objetivo }}”
    </blockquote>
    <p class="text-ink-dim mt-1 text-xs">
      {{ dado.programa.label }} · {{ dado.programa.objetivo.article }}
    </p>

    <!-- 2. E outra lei manda devolver o imposto a essas famílias. -->
    <h3 class="font-display text-ink mt-12 text-xl font-bold tracking-tight sm:text-2xl">
      {{ t('econ101.floorGiveBackTitle') }}
    </h3>
    <p class="text-ink-dim mt-3 leading-relaxed">
      {{ t('econ101.floorGiveBackLead') }}
    </p>

    <blockquote class="border-dino/40 text-ink mt-5 border-l-4 pl-4 leading-relaxed italic">
      “{{ LEI.cashback }}”
    </blockquote>
    <p class="text-ink-dim mt-1 text-xs">
      {{ dado.devolucao.label }} · {{ dado.devolucao.cashback.article }}
    </p>

    <blockquote class="border-dino/40 text-ink mt-5 border-l-4 pl-4 leading-relaxed italic">
      “{{ LEI.cesta }}”
    </blockquote>
    <p class="text-ink-dim mt-1 text-xs">
      {{ dado.devolucao.label }} · {{ dado.devolucao.cesta.article }}
    </p>

    <!-- A ressalva é do dado, não defesa de ninguém: sem ela o leitor não sabe
         que a alíquota zero e a devolução existem, e o número engana. -->
    <p class="text-ink-dim mt-5 text-sm leading-relaxed">
      {{ t('econ101.floorCaveat') }}
    </p>

    <p class="font-display text-ink mt-8 text-lg leading-snug font-bold sm:text-xl">
      {{ t('econ101.floorQuestion') }}
    </p>

    <p class="text-ink-dim mt-4 text-xs leading-relaxed">
      {{ t('equivalences.sourcePrefix') }}:
      <a
        class="hover:text-dino underline underline-offset-4"
        :href="dado.programa.url"
        target="_blank"
        rel="noopener"
      >{{ dado.programa.label }}</a>
      <span aria-hidden="true"> · </span>
      <a
        class="hover:text-dino underline underline-offset-4"
        :href="dado.devolucao.url"
        target="_blank"
        rel="noopener"
      >{{ dado.devolucao.label }}</a>
    </p>
  </section>
</template>
