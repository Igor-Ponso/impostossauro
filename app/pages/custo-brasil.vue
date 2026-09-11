<script setup lang="ts">
import businessPt from '~/data/business.json';
import companiesPt from '~/data/companies.json';

const SpotlightCard = defineAsyncComponent(
  () => import('~/components/vb/SpotlightCard/SpotlightCard.vue'),
);
const { formatDinheiroInteiro, prefixo, campoNaMoeda, limiteNaMoeda } = useMoeda();


const { t, locale } = useI18n();

const business = dadoNoIdioma('business.json', businessPt, locale.value);
const companies = dadoNoIdioma('companies.json', companiesPt, locale.value);

interface DvaEntry {
  company: string;
  year: string;
  govSharePct: number;
  laborSharePct: number;
  otherSharePct: number;
  profitSharePct: number;
  note?: string;
  source: string;
  url: string;
}

interface SmallBusinessStat {
  key: string;
  value: string;
  label: string;
  source: string;
  url: string;
}

const dva = companies.dva as DvaEntry[];
const sectorMargin = companies.sectorMargin as { finding: string; source: string; url: string } | undefined;
const smallBusiness = companies.smallBusiness as SmallBusinessStat[];
const showProfit = computed(
  () => companies.companies.length > 0 || dva.length > 0 || smallBusiness.length > 0,
);

usePaginaSeo({ titulo: t('business.pageTitle'), descricao: t('business.tldr') });

const salary = ref(5000);
const salarioNaTela = campoNaMoeda(salary);
const breakdown = computed(() => employerCost(salary.value || 0));
const animatedTotal = useAnimatedNumber(computed(() => breakdown.value.total));

const statsReveal = useInView(0.2);
const revenueReveal = useInView(0.25);

const visibleStats = computed(() =>
  business.stats.filter((stat) => stat.value !== 'em conferência'),
);
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-12 sm:py-16">
    <header class="max-w-3xl space-y-4">
      <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t('business.kicker') }}
      </p>
      <h1 class="font-display text-ink text-4xl font-bold tracking-tight  md:text-6xl">
        {{ t('business.title') }}
      </h1>
      <p class="text-ink-dim text-lg leading-relaxed">
        {{ t('business.intro') }}
      </p>
      <TldrBadge :text="t('business.tldr')" />
    </header>

    <section class="mt-12">
      <h2 class="font-display text-ink text-2xl font-bold tracking-tight sm:text-4xl">
        {{ t('business.ghost.title') }}
      </h2>
      <p class="text-ink-dim mt-3 text-lg leading-relaxed">
        {{ t('business.ghost.intro') }}
      </p>

      <div class="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
        <form class="glass space-y-5 rounded-3xl p-6 sm:p-7" @submit.prevent>
          <label for="salary" class="text-ink block text-sm font-semibold">
            {{ t('business.ghost.salaryLabel') }}
          </label>
          <div
            class="border-line bg-abyss/70 focus-within:border-dino flex items-center gap-2 rounded-xl border px-4 py-3"
          >
            <span class="text-ink-dim font-medium">{{ prefixo.trim() }}</span>
            <input
              id="salary"
              v-model.number="salarioNaTela"
              type="number"
              min="0"
              :step="limiteNaMoeda(500)"
              inputmode="decimal"
              class="text-ink w-full bg-transparent text-xl font-semibold outline-none"
            >
          </div>
          <input
            v-model.number="salarioNaTela"
            type="range"
            min="0"
            :max="limiteNaMoeda(30000)"
            :step="limiteNaMoeda(500)"
            class="accent-dino w-full"
            :aria-label="t('business.ghost.salaryLabel')"
          >
          <div class="space-y-2 pt-2">
            <p class="text-ink-dim text-xs font-semibold tracking-wider uppercase">
              {{ t('business.ghost.chargesTitle') }}
            </p>
            <div class="flex flex-wrap gap-2">
              <a
                v-for="charge in business.employerCharges"
                :key="charge.name"
                :href="charge.url"
                target="_blank"
                rel="noopener"
                class="glass hover:border-alert/60 rounded-full px-3 py-1.5 text-xs transition-colors"
              >
                <span class="text-ink font-semibold">{{ charge.name }}</span>
                <span class="tabular text-alert ml-1 font-bold">{{ charge.rate }}</span>
              </a>
            </div>
          </div>
        </form>

        <div class="space-y-4">
          <div class="glass rounded-3xl p-6 sm:p-8">
            <p class="text-ink-dim text-sm">
              {{ t('business.ghost.resultLabel', { salary: formatDinheiroInteiro(breakdown.salary) }) }}
            </p>
            <p class="tabular font-display text-money mt-2 text-4xl font-bold sm:text-5xl">
              {{ formatDinheiroInteiro(animatedTotal) }}
            </p>
            <p class="text-ink-dim mt-1 text-sm">
              {{ t('business.ghost.multiplier', { mult: breakdown.multiplier.toLocaleString($i18n.locale, { maximumFractionDigits: 2 }) }) }}
            </p>

            <div class="border-line mt-6 flex h-10 w-full overflow-hidden rounded-xl border">
              <div
                class="bg-dino flex items-center justify-center text-xs font-bold"
                :style="{ width: `${(breakdown.salary / breakdown.total) * 100}%` }"
              >
                <span class="text-abyss px-1">{{ t('business.ghost.segSalary') }}</span>
              </div>
              <div
                class="bg-money flex items-center justify-center text-xs font-bold"
                :style="{ width: `${(breakdown.provisions / breakdown.total) * 100}%` }"
              >
                <span class="text-abyss hidden px-1 sm:block">{{ t('business.ghost.segProvisions') }}</span>
              </div>
              <div
                class="bg-alert/80 flex items-center justify-center text-xs font-bold"
                :style="{ width: `${(breakdown.charges / breakdown.total) * 100}%` }"
              >
                <span class="text-abyss px-1">{{ t('business.ghost.segCharges') }}</span>
              </div>
            </div>
            <div class="text-ink-dim mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs">
              <span>{{ t('business.ghost.segSalary') }}: <b class="tabular text-ink">{{ formatDinheiroInteiro(breakdown.salary) }}</b></span>
              <span>{{ t('business.ghost.segProvisions') }}: <b class="tabular text-ink">{{ formatDinheiroInteiro(breakdown.provisions) }}</b></span>
              <span>{{ t('business.ghost.segCharges') }}: <b class="tabular text-ink">{{ formatDinheiroInteiro(breakdown.charges) }}</b></span>
            </div>
          </div>

          <SpotlightCard
            class="glass !rounded-3xl !p-6"
            spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
          >
            <p class="text-ink leading-relaxed">
              {{ t('business.ghost.rangeNote', { pastore: business.multiplier.pastore, fgv: business.multiplier.fgvCni }) }}
            </p>
            <ul class="text-ink-dim mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
              <li v-for="source in business.multiplier.sources" :key="source.url">
                <a :href="source.url" target="_blank" rel="noopener" class="hover:text-ink underline underline-offset-4">
                  {{ source.label }}
                </a>
              </li>
            </ul>
          </SpotlightCard>
        </div>
      </div>
    </section>

    <section :ref="revenueReveal.target" class="reveal mt-16" :class="{ in: revenueReveal.inView.value }">
      <h2 class="font-display text-ink text-2xl font-bold tracking-tight sm:text-4xl">
        {{ t('business.revenue.title') }}
      </h2>
      <p class="text-ink-dim mt-3 text-lg leading-relaxed">
        {{ t('business.revenue.intro') }}
      </p>
      <div class="mt-6 flex flex-wrap gap-2">
        <a
          v-for="tax in business.revenueTaxes"
          :key="tax.name"
          :href="tax.url"
          target="_blank"
          rel="noopener"
          class="glass hover:border-alert/60 rounded-full px-4 py-2 text-sm transition-colors"
        >
          <span class="text-ink font-semibold">{{ tax.name }}</span>
          <span class="tabular text-alert ml-1.5 font-bold">{{ tax.rate }}</span>
        </a>
      </div>
      <p class="text-ink-dim mt-4 text-sm leading-relaxed">
        {{ t('business.revenue.note') }}
      </p>
    </section>

    <section v-if="showProfit" class="mt-16">
      <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t('profit.kicker') }}
      </p>
      <h2 class="font-display text-ink mt-3 text-2xl font-bold tracking-tight sm:text-4xl">
        {{ t('profit.title') }}
      </h2>
      <p class="text-ink mt-4 text-lg leading-relaxed">
        {{ t('profit.intro') }}
      </p>
      <!-- ART: custo-margem · metáfora ilustrativa; as barras abaixo mantêm os dados -->
      <Art id="custo-margem" class="mx-auto mt-6 w-full max-w-xl" />
      <div class="mt-8">
        <ProfitReality />
      </div>

      <div v-if="sectorMargin" class="border-money/30 bg-money/5 mt-6 rounded-3xl border p-6 sm:p-7">
        <p class="font-display text-ink text-lg leading-snug font-bold sm:text-xl">
          {{ sectorMargin.finding }}
        </p>
        <a :href="sectorMargin.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-2 inline-block text-xs underline underline-offset-4">
          {{ t('equivalences.sourcePrefix') }}: {{ sectorMargin.source }}
        </a>
      </div>

      <template v-if="dva.length">
        <h3 class="font-display text-ink mt-12 text-xl font-bold tracking-tight sm:text-3xl">
          {{ t('profit.dvaTitle') }}
        </h3>
        <p class="text-ink-dim mt-2 leading-relaxed">
          {{ t('profit.dvaIntro') }}
        </p>
        <div class="mt-6 grid gap-4 sm:grid-cols-2">
          <SpotlightCard
            v-for="entry in dva"
            :key="entry.company"
            class="glass !rounded-3xl !p-5 sm:!p-6"
            spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
          >
            <p class="font-display text-ink font-bold">{{ entry.company }} · {{ entry.year }}</p>
            <div class="border-line mt-4 flex h-9 w-full overflow-hidden rounded-xl border">
              <div
                class="bg-alert/70 flex items-center justify-center text-xs font-bold"
                :style="{ width: `${entry.govSharePct}%` }"
              >
                <span class="text-abyss tabular">{{ entry.govSharePct.toLocaleString($i18n.locale) }}%</span>
              </div>
              <div class="bg-dino/50" :style="{ width: `${entry.laborSharePct}%` }" />
              <div class="bg-ink/20" :style="{ width: `${entry.otherSharePct}%` }" />
              <div class="bg-money/80" :style="{ width: `${entry.profitSharePct}%` }" />
            </div>
            <ul class="text-ink-dim mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <li><span class="bg-alert/70 mr-1 inline-block h-2 w-2 rounded-full" />{{ t('profit.dvaGov') }}: <b class="tabular text-ink">{{ entry.govSharePct.toLocaleString($i18n.locale) }}%</b></li>
              <li><span class="bg-dino/50 mr-1 inline-block h-2 w-2 rounded-full" />{{ t('profit.dvaLabor') }}: <b class="tabular text-ink">{{ entry.laborSharePct.toLocaleString($i18n.locale) }}%</b></li>
              <li><span class="bg-ink/20 mr-1 inline-block h-2 w-2 rounded-full" />{{ t('profit.dvaOther') }}: <b class="tabular text-ink">{{ entry.otherSharePct.toLocaleString($i18n.locale) }}%</b></li>
              <li><span class="bg-money/80 mr-1 inline-block h-2 w-2 rounded-full" />{{ t('profit.dvaProfit') }}: <b class="tabular text-ink">{{ entry.profitSharePct.toLocaleString($i18n.locale) }}%</b></li>
            </ul>
            <p v-if="entry.note" class="text-ink mt-3 text-sm leading-relaxed">{{ entry.note }}</p>
            <a :href="entry.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-2 inline-block text-xs underline underline-offset-4">
              {{ t('equivalences.sourcePrefix') }}: {{ entry.source }}
            </a>
          </SpotlightCard>
        </div>
      </template>

      <template v-if="smallBusiness.length">
        <h3 class="font-display text-ink mt-12 text-xl font-bold tracking-tight sm:text-3xl">
          {{ t('profit.smallTitle') }}
        </h3>
        <p class="text-ink-dim mt-2 leading-relaxed">
          {{ t('profit.smallIntro') }}
        </p>
        <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SpotlightCard
            v-for="item in smallBusiness"
            :key="item.key"
            class="glass !rounded-3xl !p-5"
            spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
          >
            <p class="tabular font-display text-alert text-3xl font-bold">{{ item.value }}</p>
            <p class="text-ink mt-2 leading-relaxed">{{ item.label }}</p>
            <a :href="item.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-2 inline-block text-xs underline underline-offset-4">
              {{ t('equivalences.sourcePrefix') }}: {{ item.source }}
            </a>
          </SpotlightCard>
        </div>
      </template>
    </section>

    <section :ref="statsReveal.target" class="mt-16">
      <h2 class="font-display text-ink text-2xl font-bold tracking-tight sm:text-4xl">
        {{ t('business.stats.title') }}
      </h2>
      <div class="mt-8 grid gap-4 sm:grid-cols-2">
        <article
          v-for="(stat, index) in visibleStats"
          :key="stat.key"
          class="glass reveal rounded-3xl p-6"
          :class="{ in: statsReveal.inView.value }"
          :style="{ transitionDelay: `${index * 100}ms` }"
        >
          <p class="tabular font-display text-alert text-3xl font-bold sm:text-4xl">
            {{ stat.value }}
          </p>
          <p class="text-ink mt-2 leading-relaxed">{{ stat.detail }}</p>
          <a
            :href="stat.url"
            target="_blank"
            rel="noopener"
            class="text-ink-dim hover:text-dino mt-2 inline-block text-xs underline underline-offset-4"
          >
            {{ t('equivalences.sourcePrefix') }}: {{ stat.source }}
          </a>
        </article>
      </div>
      <div class="border-alert/30 bg-alert/5 mt-8 rounded-3xl border p-6 sm:p-8">
        <p class="font-display text-ink text-xl leading-snug font-bold sm:text-2xl">
          {{ t('business.stats.punch') }}
        </p>
        <p class="font-display text-money mt-4 text-xl leading-snug font-bold sm:text-2xl">
          “{{ t('journey.finale') }}”
        </p>
        <div class="mt-5">

          <QuemEmpregaFecha class="mt-16" />

          <TarifaImportacao class="mt-16" />
          <ShareRow :text="t('share.businessText')" />
        </div>
      </div>
    </section>

    <NotaMetodologia :nota="t('business.methodNote')" />
  </div>
</template>
