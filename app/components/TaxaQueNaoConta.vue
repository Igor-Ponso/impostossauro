<script setup lang="ts">
import unemploymentPt from '~/data/unemployment.json';
const SpotlightCard = defineAsyncComponent(
  () => import('~/components/vb/SpotlightCard/SpotlightCard.vue'),
);

const { t, locale } = useI18n();
const { target, inView } = useInView(0.15);

const dados = dadoNoIdioma('unemployment.json', unemploymentPt, locale.value);
const num = (v: number, casas = 1) =>
  v.toLocaleString(locale.value, { minimumFractionDigits: casas, maximumFractionDigits: casas });
const inteiro = (v: number) => v.toLocaleString(locale.value, { maximumFractionDigits: 0 });

/** A largura da barra é o dado: nasce no valor final, nunca animada a partir de 0%. */
const maiorExcedente = Math.max(...dados.states.rows.map((r) => r.surplus));
const larguraDaBarra = (v: number) => (v / maiorExcedente) * 100;
const maiorFaixa = Math.max(...dados.ghani.breakdown.map((f) => f.value));
</script>

<template>
  <section ref="target" class="reveal" :class="{ in: inView }">
    <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
      {{ t('unemployment.kicker') }}
    </p>
    <h2 class="font-display text-ink mt-3 text-2xl font-bold tracking-tight  sm:text-4xl">
      {{ dados.duel.question }}
    </h2>

    <div class="mt-8 grid gap-4 sm:grid-cols-3">
      <SpotlightCard
        class="glass !rounded-3xl !p-5 sm:!p-6"
        spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
      >
        <p class="tabular font-display text-dino text-4xl leading-none font-bold sm:text-5xl">
          {{ num(dados.headline.rate) }}%
        </p>
        <p class="text-ink-dim mt-3 text-sm leading-relaxed">{{ dados.headline.label }}</p>
        <a :href="dados.headline.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4">
          {{ dados.headline.source }}
        </a>
      </SpotlightCard>
      <div
        v-for="item in dados.whatItMisses.slice(0, 2)"
        :key="item.key"
        class="glass rounded-3xl p-5 sm:p-6"
      >
        <p class="tabular font-display text-alert text-4xl leading-none font-bold sm:text-5xl">
          {{ num(item.value) }}<span class="text-ink-dim ml-2 text-xl sm:text-2xl">{{ item.unit }}</span>
        </p>
        <p class="text-ink-dim mt-3 text-sm leading-relaxed">{{ item.label }}</p>
        <a :href="item.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4">
          {{ item.source }}
        </a>
      </div>
    </div>

    <div class="glass mt-6 rounded-3xl p-6 sm:p-9">
      <div class="grid gap-8 sm:grid-cols-2 sm:gap-10">
        <div>
          <p class="tabular font-display text-alert text-5xl leading-none font-bold sm:text-7xl">
            {{ num(dados.duel.left.value) }}<span class="text-ink-dim ml-2 text-2xl sm:text-4xl">{{ dados.duel.left.unit }}</span>
          </p>
          <p class="font-display text-ink mt-3 text-lg font-bold sm:text-xl">{{ dados.duel.left.label }}</p>
          <p class="text-ink-dim mt-1 text-xs">{{ dados.duel.left.note }}</p>
        </div>
        <div class="border-line sm:border-l sm:pl-10">
          <p class="tabular font-display text-dino text-5xl leading-none font-bold sm:text-7xl">
            {{ num(dados.duel.right.value) }}<span class="text-ink-dim ml-2 text-2xl sm:text-4xl">{{ dados.duel.right.unit }}</span>
          </p>
          <p class="font-display text-ink mt-3 text-lg font-bold sm:text-xl">{{ dados.duel.right.label }}</p>
          <p class="text-ink-dim mt-1 text-xs">{{ dados.duel.right.note }}</p>
        </div>
      </div>
      <p class="border-line text-ink-dim mt-6 border-t pt-4 text-xs leading-relaxed">{{ dados.duel.note }}</p>
    </div>

    <div class="glass mt-6 rounded-3xl p-5 sm:p-7">
      <h3 class="font-display text-ink text-lg font-bold sm:text-xl">{{ dados.states.title }}</h3>
      <p class="text-ink-dim mt-1 text-xs tracking-wider uppercase">
        {{ dados.states.period }} · {{ dados.states.unit }}
      </p>

      <ul class="mt-5 space-y-2">
        <li
          v-for="linha in dados.states.rows"
          :key="linha.uf"
          class="grid grid-cols-[86px_1fr_auto] items-center gap-3 sm:grid-cols-[132px_1fr_auto] sm:gap-4"
        >
          <span class="text-ink truncate text-xs sm:text-sm">{{ linha.uf }}</span>
          <span class="bg-line/40 h-4 w-full overflow-hidden rounded-r-md">
            <span
              class="bg-alert/80 block h-full rounded-r-md"
              :style="{ width: `${larguraDaBarra(linha.surplus)}%` }"
            />
          </span>
          <span class="tabular text-alert shrink-0 text-xs font-bold sm:text-sm">{{ inteiro(linha.surplus) }}</span>
        </li>
      </ul>

      <p class="text-ink-dim mt-5 text-sm leading-relaxed">{{ dados.states.extra }}</p>
      <a :href="dados.states.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4">
        {{ dados.states.source }}
      </a>
    </div>

    <div class="mt-6 grid gap-4 sm:grid-cols-2">
      <SpotlightCard
        class="glass !rounded-3xl !p-5 sm:!p-6"
        spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
      >
        <p class="tabular font-display text-alert text-3xl leading-none font-bold sm:text-4xl">
          {{ num(dados.whatItMisses[2]!.value) }}{{ dados.whatItMisses[2]!.unit }}
        </p>
        <p class="text-ink-dim mt-3 text-sm leading-relaxed">{{ dados.whatItMisses[2]!.label }}</p>
        <a :href="dados.whatItMisses[2]!.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4">
          {{ dados.whatItMisses[2]!.source }}
        </a>
      </SpotlightCard>
      <SpotlightCard
        class="glass !rounded-3xl !p-5 sm:!p-6"
        spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
      >
        <p class="tabular font-display text-money text-3xl leading-none font-bold sm:text-4xl">
          {{ num(dados.bpc.value) }} <span class="text-ink-dim text-xl">{{ dados.bpc.unit }}</span>
        </p>
        <p class="text-ink-dim mt-3 text-sm leading-relaxed">{{ dados.bpc.label }}</p>
        <!-- o estoque vem da tabela do BEPS; o crescimento e de terceiro, e o credito vai junto -->
        <p class="text-ink-dim mt-2 text-sm leading-relaxed">{{ dados.bpc.growth.text }}</p>
        <div class="text-ink-dim mt-3 flex flex-col gap-1 text-xs">
          <a :href="dados.bpc.url" target="_blank" rel="noopener" class="hover:text-dino underline underline-offset-4">
            {{ dados.bpc.source }}
          </a>
          <a :href="dados.bpc.growth.url" target="_blank" rel="noopener" class="hover:text-dino underline underline-offset-4">
            {{ dados.bpc.growth.source }}
          </a>
        </div>
      </SpotlightCard>
    </div>

    <div class="border-money/30 bg-money/5 mt-6 rounded-3xl border p-5 sm:p-7">
      <h3 class="font-display text-money text-lg font-bold sm:text-xl">{{ dados.disincentive.title }}</h3>
      <p class="text-ink mt-3 leading-relaxed">{{ dados.disincentive.body }}</p>
      <ul class="text-ink-dim mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs">
        <li v-for="fonte in dados.disincentive.sources" :key="fonte.url">
          <a :href="fonte.url" target="_blank" rel="noopener" class="hover:text-dino underline underline-offset-4">{{ fonte.label }}</a>
        </li>
      </ul>
    </div>

    <div class="glass mt-6 rounded-3xl p-5 sm:p-7">
      <h3 class="font-display text-ink text-lg font-bold sm:text-xl">{{ dados.ghani.title }}</h3>
      <p class="text-ink-dim mt-3 text-sm leading-relaxed sm:text-base">{{ dados.ghani.body }}</p>

      <ul class="mt-5 space-y-2">
        <li
          v-for="faixa in dados.ghani.breakdown"
          :key="faixa.faixa"
          class="grid grid-cols-[104px_1fr_auto] items-center gap-3 sm:grid-cols-[150px_1fr_auto] sm:gap-4"
        >
          <span class="text-ink-dim truncate text-xs sm:text-sm">{{ faixa.faixa }}</span>
          <span class="bg-line/40 h-3 w-full overflow-hidden rounded-r-md">
            <span
              class="bg-ink-dim/70 block h-full rounded-r-md"
              :style="{ width: `${(faixa.value / maiorFaixa) * 100}%` }"
            />
          </span>
          <span class="tabular text-ink shrink-0 text-xs font-bold">{{ num(faixa.value) }} mi</span>
        </li>
      </ul>

      <p class="text-ink mt-5 text-sm leading-relaxed">{{ dados.ghani.caveat }}</p>
      <div class="text-ink-dim mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs">
        <a :href="dados.ghani.url" target="_blank" rel="noopener" class="hover:text-dino underline underline-offset-4">{{ dados.ghani.source }}</a>
        <a :href="dados.ghani.breakdownUrl" target="_blank" rel="noopener" class="hover:text-dino underline underline-offset-4">{{ dados.ghani.breakdownSource }}</a>
      </div>
    </div>

    <div class="border-alert/30 bg-alert/5 mt-6 rounded-3xl border p-5 sm:p-7">
      <h3 class="font-display text-alert text-lg font-bold sm:text-xl">{{ dados.participation.title }}</h3>
      <p class="text-ink mt-3 leading-relaxed">{{ dados.participation.body }}</p>
      <a :href="dados.participation.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4">
        {{ dados.participation.source }}
      </a>
    </div>

    <SpotlightCard
      class="glass mt-6 !rounded-3xl !p-5 sm:!p-7"
      spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
    >
      <h3 class="font-display text-ink text-lg font-bold sm:text-xl">{{ dados.cost.title }}</h3>
      <div class="mt-5 flex flex-wrap items-end gap-8 sm:gap-12">
        <div>
          <p class="tabular font-display text-money text-4xl leading-none font-bold sm:text-5xl">
            {{ num(dados.cost.bolsaFamilia) }}
          </p>
          <p class="text-ink-dim mt-2 text-sm">Bolsa Família · {{ dados.cost.unit }}</p>
        </div>
        <div>
          <p class="tabular font-display text-money text-4xl leading-none font-bold sm:text-5xl">
            {{ num(dados.cost.bpc) }}
          </p>
          <p class="text-ink-dim mt-2 text-sm">BPC · {{ dados.cost.unit }}</p>
        </div>
      </div>
      <p class="text-ink-dim mt-5 text-sm leading-relaxed">{{ dados.cost.body }}</p>
      <a :href="dados.cost.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4">
        {{ dados.cost.source }}
      </a>
    </SpotlightCard>

    <div class="border-alert/30 bg-alert/5 mt-6 rounded-3xl border p-6 sm:p-7">
      <p class="text-alert text-lg leading-relaxed font-bold sm:text-xl">{{ dados.question }}</p>
    </div>
  </section>
</template>
