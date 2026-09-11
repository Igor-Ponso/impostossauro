<script setup lang="ts">
import postsPt from '~/data/commissioned-posts.json';
const SpotlightCard = defineAsyncComponent(
  () => import('~/components/vb/SpotlightCard/SpotlightCard.vue'),
);

/**
 * Tudo sai de uma tabela só, o anexo da Lei 15.141/2025. Faixas, totais e vão
 * são contados do dado (`tests/cargosComissionados.spec.ts` cobra isso).
 * As barras não passam pelo `inView`: dado não atravessa um estado errado.
 */
const { t, locale } = useI18n();
const { converter, prefixo } = useMoeda();
const { target, inView } = useInView(0.15);

const dados = dadoNoIdioma('commissioned-posts.json', postsPt, locale.value);

const brl = (v: number) =>
  converter(v).toLocaleString(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (v: number, casas = 0) =>
  v.toLocaleString(locale.value, { minimumFractionDigits: casas, maximumFractionDigits: casas });

const niveis = dados.levels.map((n) => ({
  ...n,
  reajuste: n.to / n.from - 1,
  salto: n.to - n.from,
}));

const teto = Math.max(...niveis.map((n) => n.to));
const topo = niveis[0]!;
const base = niveis.at(-1)!;

const vezes = topo.salto / base.salto;

/** Os cortes caem nos vãos da tabela: os degraus são 30%, 23%, 17% e 9%. */
const faixaDoNivel = (r: number) => (r >= 0.29 ? 'topo' : r >= 0.16 ? 'alta' : 'base');
const quantosNaFaixa = (faixa: string) => niveis.filter((n) => faixaDoNivel(n.reajuste) === faixa).length;
const noTopo = quantosNaFaixa('topo') + quantosNaFaixa('alta');
const naBase = quantosNaFaixa('base');

const corDaFaixa = (r: number) =>
  ({ topo: 'var(--color-alert)', alta: 'var(--color-money)', base: 'var(--color-ink-dim)' })[
    faixaDoNivel(r)
  ]!;

const vao = Math.min(...niveis.slice(0, 5).map((n) => n.reajuste))
  / Math.max(...niveis.slice(5).map((n) => n.reajuste));
</script>

<template>
  <section ref="target" class="reveal" :class="{ in: inView }">
    <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
      {{ t('commissioned.kicker') }}
    </p>
    <h2 class="font-display text-ink mt-3 text-2xl font-bold tracking-tight  sm:text-4xl">
      {{ dados.title }}
    </h2>
    <p class="text-ink-dim mt-4 text-base leading-relaxed">{{ dados.intro }}</p>

    <SpotlightCard
      class="glass mt-8 !rounded-3xl !p-5 sm:!p-7"
      spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
    >
      <p class="font-display text-ink text-sm font-bold">{{ dados.constitution.legalArticle }}</p>
      <blockquote class="border-money/50 text-ink-dim mt-3 border-l-2 pl-4 text-sm leading-relaxed italic">
        “{{ dados.constitution.legalText }}”
      </blockquote>
      <a
        :href="dados.constitution.url"
        target="_blank"
        rel="noopener"
        class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4"
      >{{ dados.constitution.source }}</a>
    </SpotlightCard>

    <div class="glass mt-6 rounded-3xl p-5 sm:p-7">
      <h3 class="font-display text-ink text-lg font-bold sm:text-xl">
        {{ t('commissioned.tableTitle') }}
      </h3>
      <p class="text-ink-dim mt-1 text-xs leading-relaxed">
        {{ t('commissioned.tableLegend', { from: dados.law.fromLabel, to: dados.law.toLabel }) }}
      </p>

      <ul class="mt-6 space-y-1.5">
        <li
          v-for="nivel in niveis"
          :key="nivel.level"
          class="grid grid-cols-[58px_1fr_58px] items-center gap-2 sm:grid-cols-[70px_1fr_128px_66px] sm:gap-4"
        >
          <span class="tabular text-ink-dim text-xs sm:text-sm">{{ nivel.level }}</span>

          <span class="bg-line/40 block h-5 w-full rounded-r-md">
            <span
              class="block h-full rounded-r-md"
              :style="{ width: `${(nivel.to / teto) * 100}%`, background: corDaFaixa(nivel.reajuste) }"
            />
          </span>

          <span class="tabular text-ink hidden text-right text-xs font-semibold sm:block sm:text-sm">
            {{ brl(nivel.to) }}
          </span>

          <span
            class="tabular shrink-0 text-right text-xs font-bold sm:text-sm"
            :style="{ color: corDaFaixa(nivel.reajuste) }"
          >
            +{{ pct(nivel.reajuste * 100, 1) }}%
          </span>
        </li>
      </ul>

      <p class="text-ink-dim mt-5 text-sm leading-relaxed">
        {{ t('commissioned.tiers', { high: noTopo, low: naBase, gap: pct(vao, 1) }) }}
      </p>
      <a
        :href="dados.law.url"
        target="_blank"
        rel="noopener"
        class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4"
      >{{ dados.law.legalArticle }} — {{ dados.law.where }}</a>
    </div>

    <div class="border-alert/30 bg-alert/5 mt-6 rounded-3xl border p-6 sm:p-9">
      <h3 class="font-display text-alert text-lg font-bold sm:text-xl">{{ dados.gap.title }}</h3>

      <p class="tabular font-display text-alert mt-5 text-6xl leading-none font-bold sm:text-8xl">
        {{ pct(vezes, 0) }}×
      </p>
      <p class="font-display text-ink mt-3 text-base font-bold sm:text-lg">
        {{ t('commissioned.gapHeadline') }}
      </p>

      <div class="border-line mt-7 grid gap-6 border-t pt-6 sm:grid-cols-2">
        <div>
          <p class="tabular font-display text-alert text-2xl font-bold sm:text-3xl">
            {{ prefixo }}{{ brl(topo.salto) }}
          </p>
          <p class="text-ink-dim mt-1 text-sm">{{ topo.level }} — {{ dados.gap.topLabel }}</p>
        </div>
        <div>
          <p class="tabular font-display text-ink-dim text-2xl font-bold sm:text-3xl">
            {{ prefixo }}{{ brl(base.salto) }}
          </p>
          <p class="text-ink-dim mt-1 text-sm">{{ base.level }} — {{ dados.gap.bottomLabel }}</p>
        </div>
      </div>

      <p class="text-ink-dim mt-6 text-sm leading-relaxed">{{ dados.gap.note }}</p>
    </div>

    <SpotlightCard
      class="glass mt-6 !rounded-3xl !p-5 sm:!p-7"
      spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
    >
      <h3 class="font-display text-ink text-lg font-bold sm:text-xl">{{ dados.fce.title }}</h3>
      <p class="text-ink-dim mt-3 text-sm leading-relaxed sm:text-base">{{ dados.fce.body }}</p>
    </SpotlightCard>

    <SpotlightCard
      class="glass mt-6 !rounded-3xl !p-5 sm:!p-7"
      spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
    >
      <h3 class="font-display text-ink text-lg font-bold sm:text-xl">{{ dados.minimumWage.title }}</h3>
      <div class="mt-5 flex flex-wrap items-baseline gap-4 sm:gap-6">
        <p class="tabular font-display text-ink-dim text-2xl font-bold sm:text-3xl">
          {{ prefixo }}{{ brl(dados.minimumWage.fromBrl) }}
        </p>
        <span aria-hidden="true" class="text-ink-dim">→</span>
        <p class="tabular font-display text-money text-3xl font-bold sm:text-4xl">
          {{ prefixo }}{{ brl(dados.minimumWage.toBrl) }}
        </p>
        <p class="tabular text-money text-sm font-semibold">+{{ pct(dados.minimumWage.pct, 2) }}%</p>
      </div>
      <p class="text-ink-dim mt-4 text-sm leading-relaxed">{{ dados.minimumWage.body }}</p>
      <a
        :href="dados.minimumWage.url"
        target="_blank"
        rel="noopener"
        class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4"
      >{{ dados.minimumWage.source }}</a>
    </SpotlightCard>

    <div class="border-alert/30 bg-alert/5 mt-6 rounded-3xl border p-6 sm:p-7">
      <p class="text-alert text-lg leading-relaxed font-bold sm:text-xl">{{ dados.question }}</p>
    </div>
  </section>
</template>
