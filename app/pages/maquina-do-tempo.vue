<script setup lang="ts">
import historicalPt from '~/data/historical.json';
import socialHistoryPt from '~/data/social-history.json';
import taxDataPt from '~/data/tax-data.json';

const SpotlightCard = defineAsyncComponent(
  () => import('~/components/vb/SpotlightCard/SpotlightCard.vue'),
);
const { formatDinheiro, formatDinheiroCompacto, formatDinheiroInteiro } = useMoeda();


const { t, locale } = useI18n();

const historical = dadoNoIdioma('historical.json', historicalPt, locale.value);
const socialHistory = dadoNoIdioma('social-history.json', socialHistoryPt, locale.value);
const taxData = dadoNoIdioma('tax-data.json', taxDataPt, locale.value);
const showHistorical = historical.burdenMilestones.length >= 2;
const showIndicators = socialHistory.indicators.length >= 1;

usePaginaSeo({ titulo: t('timeMachine.pageTitle'), descricao: t('timeMachine.tldr') });

const shareText = computed(() =>
  t('share.timeMachineText', {
    total: formatDinheiroCompacto(total.value),
    start: startYear.value,
    end: endYear.value,
  }),
);

const MIN_YEAR = 2010;
const MAX_YEAR = taxData.currentYear.year;

const filled = fillRevenueSeries(taxData.revenueSeries, taxData.currentYear);

const startYear = ref(2023);
const endYear = ref(MAX_YEAR);
const anos = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i);

type Preset = { key: string; start: number; end: number };
const presets: Preset[] = [
  { key: 'dilma', start: 2011, end: 2016 },
  { key: 'temer', start: 2016, end: 2018 },
  { key: 'bolsonaro', start: 2019, end: 2022 },
  { key: 'lula3', start: 2023, end: 2026 },
  { key: 'all', start: MIN_YEAR, end: MAX_YEAR },
];

const activePreset = computed(
  () =>
    presets.find(
      (preset) => preset.start === startYear.value && preset.end === endYear.value,
    )?.key ?? null,
);

const dossies = computed(() => {
  const mandatos = presets.filter((preset) => preset.key !== 'all');
  if (activePreset.value === 'all') return mandatos.map((m) => m.key);
  if (activePreset.value) return [activePreset.value];
  return mandatos
    .filter((m) => m.end >= startYear.value && m.start <= endYear.value)
    .map((m) => m.key);
});

function applyPreset(preset: Preset) {
  startYear.value = preset.start;
  endYear.value = preset.end;
}

watch([startYear, endYear], () => {
  if (startYear.value > endYear.value) {
    [startYear.value, endYear.value] = [endYear.value, startYear.value];
  }
});

const instanteInicial = useState('maquina-tempo-instante', () => Date.now());
const now = ref(new Date(instanteInicial.value));
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  now.value = new Date();
  timer = setInterval(() => {
    now.value = new Date();
  }, 1000);
});
onUnmounted(() => clearInterval(timer));

const total = computed(() => sumPeriod(filled, startYear.value, endYear.value, now.value));
const animatedTotal = useAnimatedNumber(total, 700);

const daysInPeriod = computed(() => {
  const start = new Date(startYear.value, 0, 1);
  const end = endYear.value >= now.value.getFullYear() ? now.value : new Date(endYear.value + 1, 0, 1);
  return Math.max(1, (end.getTime() - start.getTime()) / 86_400_000);
});
const perDay = computed(() => total.value / daysInPeriod.value);

const hasApproximation = computed(() =>
  periodHasApproximation(filled, startYear.value, endYear.value),
);

/** A série do IPCA vai até 2025, daí o teto. */
const inflation = computed(() =>
  inflationFactor(taxData.ipcaSeries, startYear.value, Math.min(endYear.value, 2025)),
);
const erodedValue = computed(() => 1000 / inflation.value);

const equivalences = computed(() =>
  Object.entries(taxData.referenceCosts).map(([key, cost]) => ({
    key,
    dados: {
    artwork: arteEquivalencia(key),
    count: howMany(total.value, cost.unitCost),
    label: t(`equivalences.items.${key}.label`),
    description: t(`equivalences.items.${key}.description`),
    source: cost.source,
    url: cost.url,
    },
  })),
);

</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-12 sm:py-16">
    <header class="max-w-3xl space-y-4">
      <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t('timeMachine.kicker') }}
      </p>
      <h1 class="font-display text-ink text-4xl font-bold tracking-tight  md:text-6xl">
        {{ t('timeMachine.title') }}
      </h1>
      <p class="text-ink-dim text-lg leading-relaxed">
        {{ t('timeMachine.intro') }}
      </p>
      <TldrBadge :text="t('timeMachine.tldr')" />
    </header>

    <div class="glass mt-10 space-y-6 rounded-3xl p-6 sm:p-7">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="preset in presets"
          :key="preset.key"
          type="button"
          class="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
          :class="
            activePreset === preset.key
              ? 'bg-dino text-abyss'
              : 'bg-abyss/60 text-ink-dim hover:text-ink border-control border'
          "
          @click="applyPreset(preset)"
        >
          {{ t(`timeMachine.presets.${preset.key}`) }}
        </button>
      </div>

      <div class="flex flex-wrap items-end gap-4">
        <label class="text-ink text-sm font-semibold">
          <span class="block">{{ t('timeMachine.rangeStart') }}</span>
          <select
            v-model.number="startYear"
            class="border-control bg-abyss/70 text-ink focus:border-dino tabular mt-2 block rounded-xl border px-4 py-2.5 outline-none"
          >
            <option v-for="ano in anos" :key="ano" :value="ano">{{ ano }}</option>
          </select>
        </label>
        <label class="text-ink text-sm font-semibold">
          <span class="block">{{ t('timeMachine.rangeEnd') }}</span>
          <select
            v-model.number="endYear"
            class="border-control bg-abyss/70 text-ink focus:border-dino tabular mt-2 block rounded-xl border px-4 py-2.5 outline-none"
          >
            <option v-for="ano in anos" :key="ano" :value="ano">{{ ano }}</option>
          </select>
        </label>
        <p class="text-ink-dim basis-full text-sm leading-relaxed sm:basis-auto sm:pb-2.5">
          {{ t('timeMachine.rangeHint', { year: MIN_YEAR }) }}
        </p>
      </div>
    </div>

    <div class="mt-10 space-y-6">
        <div class="glass rounded-3xl p-6 sm:p-8">
          <p class="text-ink-dim text-sm">
            {{ t('timeMachine.totalLabel', { start: startYear, end: endYear }) }}
          </p>
          <p
            class="tabular font-display text-money mt-2 font-bold tracking-tight break-words text-[clamp(1.35rem,3.4vw,2.8rem)] leading-none"
          >
            {{ formatDinheiro(animatedTotal) }}
          </p>
          <p class="font-display text-ink mt-2 text-lg font-bold sm:text-xl">
            = {{ formatDinheiroCompacto(total) }}
          </p>
          <p class="text-ink-dim mt-3 text-sm">
            {{ t('timeMachine.perDay', { value: formatDinheiroCompacto(perDay) }) }}
          </p>
          <p v-if="hasApproximation" class="text-ink-dim mt-2 text-xs">
            {{ t('timeMachine.approxNote') }}
          </p>
          <div class="mt-5">
            <ShareRow :text="shareText" />
          </div>
        </div>

        <div class="glass rounded-3xl p-6 sm:p-8">
          <h2 class="font-display text-ink text-xl font-bold sm:text-2xl">
            {{ t('timeMachine.inflationTitle') }}
          </h2>
          <p class="text-ink-dim mt-3 leading-relaxed">
            {{
              t('timeMachine.inflationLine', {
                start: startYear,
                pct: ((inflation - 1) * 100).toLocaleString($i18n.locale, { maximumFractionDigits: 1 }),
              })
            }}
          </p>
          <div class="mt-5 flex flex-wrap items-center gap-4">
            <div class="bg-abyss/60 border-line rounded-2xl border px-5 py-3">
              <p class="text-ink-dim text-xs">{{ t('timeMachine.inflationThen', { year: startYear }) }}</p>
              <p class="tabular text-ink text-2xl font-bold">R$ 1.000</p>
            </div>
            <span class="text-ink-dim text-2xl" aria-hidden="true">→</span>
            <div class="bg-abyss/60 border-alert/40 rounded-2xl border px-5 py-3">
              <p class="text-ink-dim text-xs">{{ t('timeMachine.inflationNow') }}</p>
              <p class="tabular text-alert text-2xl font-bold">
                {{ formatDinheiroInteiro(erodedValue) }}
              </p>
            </div>
          </div>
          <p class="text-ink-dim mt-4 text-xs leading-relaxed">
            {{ t('timeMachine.inflationSource') }}
            <a
              :href="taxData.ipcaSource.url"
              target="_blank"
              rel="noopener"
              class="text-dino underline underline-offset-4"
              >{{ taxData.ipcaSource.source }}</a
            >.
          </p>
        </div>
    </div>

    <section class="mt-14">
      <h2 class="font-display text-ink text-2xl font-bold tracking-tight sm:text-4xl">
        {{ t('timeMachine.equivalencesTitle') }}
      </h2>
      <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <EquivalenceCard v-for="item in equivalences" :key="item.key" v-bind="item.dados" />
      </div>
    </section>

    <MandateDossier
      v-for="(chave, indice) in dossies"
      :key="chave"
      :government-key="chave"
      :class="indice ? 'mt-10' : ''"
    />

    <section v-if="showHistorical" class="mt-16">
      <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t('burden.kicker') }}
      </p>
      <h2 class="font-display text-ink mt-3 text-2xl font-bold tracking-tight sm:text-4xl">
        {{ t('burden.sectionTitle') }}
      </h2>
      <p class="text-ink-dim mt-3 text-lg leading-relaxed">
        {{ t('burden.sectionIntro') }}
      </p>
      <div class="mt-8">
        <BurdenChart />
      </div>
      <div v-if="historical.eras.length" class="mt-6 grid gap-4 sm:grid-cols-2">
        <SpotlightCard
          v-for="era in historical.eras"
          :key="era.period"
          class="glass !rounded-2xl !p-5"
          spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
        >
          <p class="font-display text-ink font-bold">{{ era.period }}</p>
          <p class="text-ink-dim mt-1 text-sm leading-relaxed">{{ era.note }}</p>
          <a :href="era.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-2 inline-block text-xs underline underline-offset-4">
            {{ t('equivalences.sourcePrefix') }}: {{ era.source }}
          </a>
        </SpotlightCard>
      </div>
      <div v-if="historical.empire" class="border-money/30 bg-money/5 mt-6 rounded-3xl border p-6">
        <p class="text-money text-xs font-semibold tracking-[0.18em] uppercase">{{ t('burden.empireKicker') }}</p>
        <p class="text-ink mt-2 leading-relaxed">{{ historical.empire.finding }}</p>
        <a :href="historical.empire.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-2 inline-block text-xs underline underline-offset-4">
          {{ t('equivalences.sourcePrefix') }}: {{ historical.empire.source }}
        </a>
      </div>
      <!--
        Depois do card do Império de propósito: ele avisa que não há % do PIB
        para o século XIX, e a peça abaixo usa outra régua.
      -->
      <ImperioComposicao v-if="historical.empire?.milestones?.length" class="mt-10" />

      <div v-if="historical.tiradentes" class="border-alert/30 bg-alert/5 mt-6 rounded-3xl border p-6 sm:p-8">
        <p class="text-alert text-xs font-semibold tracking-[0.18em] uppercase">{{ t('burden.tiradentesKicker') }}</p>
        <p class="font-display text-ink mt-3 text-xl leading-snug font-bold sm:text-2xl">
          {{ historical.tiradentes.headline }}
        </p>
        <p class="text-ink mt-3 leading-relaxed">{{ historical.tiradentes.finding }}</p>
        <p class="text-ink-dim mt-3 text-sm leading-relaxed">{{ historical.tiradentes.caveat }}</p>
        <a :href="historical.tiradentes.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-2 inline-block text-xs underline underline-offset-4">
          {{ t('equivalences.sourcePrefix') }}: {{ historical.tiradentes.source }}
        </a>
      </div>

      <!--
        Mede tolerância, não sugere ação: o desfecho é a normalização, e a
        violência histórica não é o clímax.
      -->
      <SpotlightCard
        v-if="historical.tenthPenny"
        class="glass mt-6 !rounded-3xl !p-6 sm:!p-8"
        spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
      >
        <p class="text-money text-xs font-semibold tracking-[0.18em] uppercase">
          {{ t('burden.tenthPennyKicker') }}
        </p>
        <p class="font-display text-ink mt-3 text-xl leading-snug font-bold sm:text-2xl">
          {{ historical.tenthPenny.headline }}
        </p>
        <p class="text-ink mt-3 leading-relaxed">{{ historical.tenthPenny.finding }}</p>
        <p class="text-ink-dim mt-3 text-sm leading-relaxed">{{ historical.tenthPenny.caveat }}</p>
        <p class="font-display text-money mt-5 text-lg leading-snug font-bold sm:text-xl">
          {{ historical.tenthPenny.closing }}
        </p>
        <a :href="historical.tenthPenny.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4">
          {{ t('equivalences.sourcePrefix') }}: {{ historical.tenthPenny.source }}
        </a>
      </SpotlightCard>
    </section>

    <section v-if="showIndicators" class="mt-16">
      <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t('indicators.kicker') }}
      </p>
      <h2 class="font-display text-ink mt-3 text-2xl font-bold tracking-tight sm:text-4xl">
        {{ t('indicators.title') }}
      </h2>
      <p class="text-ink-dim mt-3 text-lg leading-relaxed">
        {{ t('indicators.intro') }}
      </p>
      <div class="mt-8">
        <SocialIndicators />
      </div>
    </section>

    <SignaturePhrase :phrase="t('signature.timeMachine')" />

    <NotaMetodologia :nota="t('timeMachine.methodNote')" />
  </div>
</template>
