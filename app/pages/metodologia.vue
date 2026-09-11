<script setup lang="ts">
import payrollData from '~/data/payroll-2026.json';
import taxDataPt from '~/data/tax-data.json';
const { formatDinheiro, formatDinheiroInteiro } = useMoeda();


const { t, locale } = useI18n();

const taxData = dadoNoIdioma('tax-data.json', taxDataPt, locale.value);
const payroll = dadoNaMoeda('payroll-2026.json', payrollData);

usePaginaSeo({ titulo: t('methodology.title'), descricao: t('methodology.intro') });

/** `computed`, não constante: o texto do dado muda com a moeda escolhida. */
const costs = computed(() => Object.entries(taxData.referenceCosts).map(([key, cost]) => ({
  key,
  ...cost,
})));

const inssBrackets = computed(() => payroll.tables.inss.brackets);
const payrollSources = computed(() => payroll.sources);

/**
 * A definição da série vem do JSON, não de chave de i18n: prosa duplicada
 * acaba publicando números diferentes em duas telas.
 */
const serieFederal = computed(() => taxData.federalRevenueDefinition);
const anosDesenhados = anosDaReguaCompleta(taxData.federalRevenueSeries);
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-12 px-4 py-16">
    <header class="max-w-3xl space-y-3">
      <h1 class="text-ink text-3xl font-extrabold md:text-5xl">
        {{ t('methodology.title') }}
      </h1>
      <p class="text-ink-dim text-lg leading-relaxed">
        {{ t('methodology.intro') }}
      </p>
    </header>

    <section class="max-w-3xl space-y-3">
      <h2 class="text-ink text-2xl font-bold">{{ t('methodology.counter.title') }}</h2>
      <p class="text-ink-dim leading-relaxed">{{ t('methodology.counter.body') }}</p>
      <p class="bg-card border-line text-ink rounded-xl border p-4 font-mono text-sm">
        {{ t('methodology.counter.formula') }}
      </p>
      <p class="text-ink-dim text-sm leading-relaxed">
        {{ t('methodology.counter.currentBasis') }}:
        {{ taxData.currentYear.basis }}
        (<a
          :href="taxData.currentYear.url"
          target="_blank"
          rel="noopener"
          class="text-dino underline underline-offset-4"
          >{{ taxData.currentYear.source }}</a
        >)
      </p>
    </section>

    <section class="max-w-3xl space-y-3">
      <h2 class="text-ink text-2xl font-bold">{{ t('federalRevenueChart.title') }}</h2>
      <p class="text-ink leading-relaxed">{{ serieFederal.metric }}</p>
      <p class="text-ink-dim leading-relaxed">{{ serieFederal.includes }}</p>

      <dl class="text-ink-dim space-y-3 leading-relaxed">
        <div v-for="(texto, regua) in serieFederal.rulers" :key="regua">
          <dt class="text-ink font-mono text-sm font-bold">{{ regua }}</dt>
          <dd class="mt-1 text-sm">{{ texto }}</dd>
        </div>
      </dl>

      <p class="text-ink-dim text-sm leading-relaxed">{{ serieFederal.note }}</p>

      <p class="text-ink-dim text-sm leading-relaxed">
        {{ t('federalRevenueChart.rulerText', { firstYear: anosDesenhados[0]?.year }) }}
      </p>

      <p class="text-ink-dim text-sm">
        <a
          :href="serieFederal.url"
          target="_blank"
          rel="noopener"
          class="text-dino underline underline-offset-4"
          >{{ serieFederal.source }}</a
        >
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="text-ink text-2xl font-bold">{{ t('methodology.costs.title') }}</h2>
      <p class="text-ink-dim leading-relaxed">{{ t('methodology.costs.body') }}</p>
      <div class="border-line overflow-x-auto rounded-xl border">
        <table class="w-full text-left text-sm">
          <thead class="bg-card text-ink">
            <tr>
              <th class="px-4 py-3 font-semibold">{{ t('methodology.costs.item') }}</th>
              <th class="px-4 py-3 font-semibold">{{ t('methodology.costs.cost') }}</th>
              <th class="px-4 py-3 font-semibold">{{ t('methodology.costs.source') }}</th>
            </tr>
          </thead>
          <tbody class="text-ink-dim">
            <tr v-for="cost in costs" :key="cost.key" class="border-line border-t">
              <td class="px-4 py-3">{{ cost.description }}</td>
              <td class="tabular px-4 py-3">{{ formatDinheiroInteiro(cost.unitCost) }}</td>
              <td class="px-4 py-3">
                <a
                  :href="cost.url"
                  target="_blank"
                  rel="noopener"
                  class="text-dino underline underline-offset-4"
                  >{{ cost.source }}</a
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="text-ink text-2xl font-bold">{{ t('methodology.payroll.title') }}</h2>
      <p class="text-ink-dim leading-relaxed">{{ t('methodology.payroll.body') }}</p>
      <div class="border-line overflow-x-auto rounded-xl border">
        <table class="w-full text-left text-sm">
          <thead class="bg-card text-ink">
            <tr>
              <th class="px-4 py-3 font-semibold">{{ t('methodology.payroll.bracket') }}</th>
              <th class="px-4 py-3 font-semibold">{{ t('methodology.payroll.rate') }}</th>
            </tr>
          </thead>
          <tbody class="text-ink-dim">
            <tr
              v-for="(bracket, index) in inssBrackets"
              :key="bracket.upTo"
              class="border-line border-t"
            >
              <td class="tabular px-4 py-3">
                {{ index === 0 ? t('methodology.payroll.upTo', { value: formatDinheiro(bracket.upTo) }) : `${formatDinheiro(inssBrackets[index - 1]!.upTo)} – ${formatDinheiro(bracket.upTo)}` }}
              </td>
              <td class="tabular px-4 py-3">{{ bracket.ratePct }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-ink-dim text-sm leading-relaxed">{{ t('methodology.payroll.irrfNote') }}</p>
      <ul class="text-ink-dim list-disc space-y-1 pl-5 text-sm leading-relaxed">
        <li v-for="source in payrollSources" :key="source.url">
          <a
            :href="source.url"
            target="_blank"
            rel="noopener"
            class="text-dino underline underline-offset-4"
            >{{ source.label }}</a
          >
        </li>
      </ul>
    </section>

    <section class="max-w-3xl space-y-3">
      <h2 class="text-ink text-2xl font-bold">{{ t('methodology.timeMachine.title') }}</h2>
      <p class="text-ink-dim leading-relaxed">{{ t('methodology.timeMachine.body') }}</p>
    </section>

    <section class="max-w-3xl space-y-3">
      <h2 class="text-ink text-2xl font-bold">{{ t('methodology.limits.title') }}</h2>
      <ul class="text-ink-dim list-disc space-y-2 pl-5 leading-relaxed">
        <li v-for="index in 3" :key="index">{{ t(`methodology.limits.item${index}`) }}</li>
      </ul>
    </section>

    <section class="max-w-3xl space-y-3">
      <h2 class="text-ink text-2xl font-bold">{{ t('methodology.archive.title') }}</h2>
      <i18n-t keypath="methodology.archive.body" tag="p" class="text-ink-dim leading-relaxed">
        <template #link>
          <a
            href="https://github.com/Igor-Ponso/impostossauro/blob/dev/app/data/arquivos.json"
            target="_blank"
            rel="noopener"
            class="text-dino underline underline-offset-4"
            >{{ t('methodology.archive.link') }}</a
          >
        </template>
      </i18n-t>
    </section>

    <section class="max-w-3xl space-y-3">
      <h2 class="text-ink text-2xl font-bold">{{ t('methodology.open.title') }}</h2>
      <i18n-t keypath="methodology.open.body" tag="p" class="text-ink-dim leading-relaxed">
        <template #link>
          <a
            href="https://github.com/Igor-Ponso/impostossauro"
            target="_blank"
            rel="noopener"
            class="text-dino underline underline-offset-4"
            >GitHub</a
          >
        </template>
      </i18n-t>
    </section>

    <SignaturePhrase :phrase="t('signature.methodology')" />
  </div>
</template>
