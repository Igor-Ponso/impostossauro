<script setup lang="ts">
import purchasingPt from '~/data/purchasing-power.json';
import taxData from '~/data/tax-data.json';

const { t, locale } = useI18n();
const { target, inView } = useInView(0.2);

/** Este dado não tem prosa traduzível por caminho — o texto todo vem do i18n. */
const cesta = purchasingPt;
const anos = cesta.years;

const num = (v: number, casas = 0) =>
  v.toLocaleString(locale.value, { minimumFractionDigits: casas, maximumFractionDigits: casas });

/* ---- peça 1: a nota que encolhe ------------------------------------------ */

const ANO_BASE = anos[0]!.year;
const ANO_FIM = anos.at(-1)!.year;

/** O IPCA de um ano corrige o ano seguinte: o acúmulo começa em ANO_BASE + 1. */
const fatorInflacao = taxData.ipcaSeries
  .filter((item) => item.year > ANO_BASE && item.year <= ANO_FIM)
  .reduce((fator, item) => fator * (1 + item.pct / 100), 1);
const sobraDaNota = 100 / fatorInflacao;

/* ---- peça 2: a cesta em horas de trabalho -------------------------------- */

const maisHoras = [...anos].sort((a, b) => b.workHours - a.workHours)[0]!;
const menosHoras = [...anos].sort((a, b) => a.workHours - b.workHours)[0]!;
const primeiro = anos[0]!;
const ultimo = anos.at(-1)!;

const larguraDaBarra = (horas: number) => (horas / maisHoras.workHours) * 100;
const corDaBarra = (ano: (typeof anos)[number]) => {
  if (ano.year === maisHoras.year) return 'var(--color-alert)';
  if (ano.year === menosHoras.year) return 'var(--color-chart-visible)';
  return 'var(--color-ink-dim)';
};

const antesDaPandemia = anos.find((a) => a.year === PANDEMIA.from - 1);
const fimDaPandemia = anos.find((a) => a.year === PANDEMIA.to);
const saltoNaPandemia =
  antesDaPandemia && fimDaPandemia ? fimDaPandemia.workHours - antesDaPandemia.workHours : 0;

const emFoco = ref<(typeof anos)[number] | null>(null);
</script>

<template>
  <section ref="target" class="reveal" :class="{ in: inView }">
    <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
      {{ t('purchasingPower.kicker') }}
    </p>
    <h2 class="font-display text-ink mt-3 text-2xl font-bold tracking-tight sm:text-4xl">
      {{ t('purchasingPower.title') }}
    </h2>
    <p class="text-ink-dim mt-4 text-lg leading-relaxed">
      {{ t('purchasingPower.intro') }}
    </p>

    <div class="glass mt-8 rounded-3xl p-5 sm:p-7">
      <h3 class="font-display text-ink text-xl font-bold sm:text-2xl">
        {{ t('purchasingPower.noteTitle', { year: ANO_BASE }) }}
      </h3>

      <div class="mt-6 flex flex-wrap items-end gap-6 sm:gap-10">
        <div class="w-40 sm:w-56">
          <p class="text-ink-dim text-xs font-semibold tracking-wider uppercase">
            {{ t('purchasingPower.noteThen', { year: ANO_BASE }) }}
          </p>
          <NotaIlustrada class="mt-3" />
          <p class="tabular font-display text-money mt-3 text-2xl font-bold sm:text-3xl">R$ 100,00</p>
        </div>

        <div class="w-40 sm:w-56">
          <p class="text-ink-dim text-xs font-semibold tracking-wider uppercase">
            {{ t('purchasingPower.noteNow', { year: ANO_FIM }) }}
          </p>
          <NotaIlustrada :remaining="sobraDaNota" :animate="inView" class="mt-3" />
          <p class="tabular font-display text-alert mt-3 text-2xl font-bold sm:text-3xl">
            R$ {{ num(sobraDaNota, 2) }}
          </p>
        </div>
      </div>

      <p class="text-ink-dim mt-5 text-sm leading-relaxed">
        {{
          t('purchasingPower.noteLegend', {
            first: ANO_BASE,
            last: ANO_FIM,
            left: num(sobraDaNota, 2),
            lost: num(100 - sobraDaNota, 2),
          })
        }}
        <a
          :href="taxData.ipcaSource.url"
          target="_blank"
          rel="noopener"
          class="text-dino underline underline-offset-4"
          >{{ taxData.ipcaSource.source }}</a
        >
      </p>
    </div>

    <div class="glass mt-6 rounded-3xl p-5 sm:p-7">
      <h3 class="font-display text-ink text-xl font-bold sm:text-2xl">
        {{ t('purchasingPower.hoursTitle') }}
      </h3>
      <p class="text-ink-dim mt-2 text-sm leading-relaxed sm:text-base">
        {{ t('purchasingPower.hoursIntro') }}
      </p>

      <ul class="mt-6 space-y-1.5">
        <li
          v-for="ano in anos"
          :key="ano.year"
          class="grid grid-cols-[46px_1fr] items-center gap-3 sm:grid-cols-[54px_1fr] sm:gap-4"
        >
          <span
            class="tabular text-xs sm:text-sm"
            :class="naPandemia(ano.year) ? 'text-alert font-semibold' : 'text-ink-dim'"
          >{{ ano.year }}</span>
          <button
            type="button"
            class="focus-visible:outline-dino group relative flex h-7 w-full items-center rounded-r-md text-left outline-none focus-visible:outline-2"
            :aria-label="
              t('purchasingPower.barLabel', {
                year: ano.year,
                hours: ano.workLabel,
                pct: num(ano.pctNetMinimumWage, 1),
                brl: num(ano.brl, 2),
              })
            "
            @mouseenter="emFoco = ano"
            @mouseleave="emFoco = null"
            @focus="emFoco = ano"
            @blur="emFoco = null"
            @click="emFoco = emFoco?.year === ano.year ? null : ano"
          >
            <span
              class="h-full rounded-r-md transition-[width] duration-700"
              :style="{
                width: inView ? `${larguraDaBarra(ano.workHours)}%` : '0%',
                background: corDaBarra(ano),
                opacity: emFoco && emFoco.year !== ano.year ? 0.45 : 1,
              }"
            />
            <span class="tabular text-ink ml-3 shrink-0 text-xs font-bold sm:text-sm">
              {{ ano.workLabel }}
            </span>
          </button>
        </li>
      </ul>

      <div aria-live="polite" class="mt-4 min-h-10 text-sm">
        <template v-if="emFoco">
          <span class="tabular text-ink font-bold">{{ emFoco.year }}</span>
          <span class="text-ink-dim ml-3">
            {{
              t('purchasingPower.readout', {
                hours: emFoco.workLabel,
                pct: num(emFoco.pctNetMinimumWage, 1),
                brl: num(emFoco.brl, 2),
              })
            }}
          </span>
        </template>
        <span v-else class="text-ink-dim text-xs">{{ t('purchasingPower.hint') }}</span>
      </div>

      <div class="border-alert/30 bg-alert/5 mt-6 rounded-3xl border p-5 sm:p-6">
        <p class="text-alert text-lg leading-relaxed font-bold sm:text-xl">
          {{
            t('purchasingPower.punch', {
              bestYear: menosHoras.year,
              bestHours: menosHoras.workLabel,
              worstYear: maisHoras.year,
              worstHours: maisHoras.workLabel,
              lastYear: ultimo.year,
              lastHours: ultimo.workLabel,
              firstYear: primeiro.year,
              firstHours: primeiro.workLabel,
            })
          }}
        </p>
      </div>

      <p
        v-if="antesDaPandemia && fimDaPandemia"
        class="border-alert/30 bg-alert/5 text-ink mt-6 rounded-2xl border p-4 text-sm leading-relaxed"
      >
        <span class="text-alert font-semibold">{{ t('pandemia.label') }}</span>
        {{ t('pandemia.basketNote', {
          before: antesDaPandemia.workLabel,
          after: fimDaPandemia.workLabel,
          jump: num(saltoNaPandemia, 0),
          worstYear: maisHoras.year,
          worstHours: maisHoras.workLabel,
        }) }}
      </p>

      <p class="text-ink-dim mt-4 text-xs leading-relaxed">
        {{ t('purchasingPower.note') }}
        <a :href="cesta.url" target="_blank" rel="noopener" class="text-dino underline underline-offset-4">
          {{ cesta.source }}
        </a>
      </p>
    </div>
  </section>
</template>
