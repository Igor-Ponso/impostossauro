<script setup lang="ts">
import taxDataPt from '~/data/tax-data.json';
import whatItBuysPt from '~/data/what-it-buys.json';

const { t, locale } = useI18n();
const { formatDinheiroCompacto, formatCount } = useMoeda();

const dados = dadoNoIdioma('what-it-buys.json', whatItBuysPt, locale.value);
const taxData = dadoNoIdioma('tax-data.json', taxDataPt, locale.value);

const total = taxData.currentYear.totalBillions * 1e9;
const num = (v: number, casas = 1) =>
  v.toLocaleString(locale.value, { minimumFractionDigits: casas, maximumFractionDigits: casas });

const pilha = dados.physical.find((p) => p.key === 'pilhaMoedas')!;
const km = ((total / pilha.inputs.unitValueBrl) * pilha.inputs.unitMm) / 1e6;
const idas = km / pilha.compare.km;
</script>

<template>
  <section class="mt-10 overflow-hidden rounded-[2rem] bg-[#151035] text-white shadow-xl">
    <div class="relative isolate">
      <Art id="compras-cosmos" loading="eager" class="w-full" />
      <div class="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-[#151035]/90 via-[#151035]/20 to-transparent sm:block" aria-hidden="true" />
      <div class="relative px-6 py-8 sm:absolute sm:inset-0 sm:flex sm:max-w-[62%] sm:flex-col sm:justify-center sm:p-9 lg:p-12">
        <p class="max-w-lg text-sm leading-relaxed text-indigo-100 sm:text-base">
          {{ t('whatItBuys.heroLead', { total: formatDinheiroCompacto(total) }) }}
        </p>
        <p class="tabular font-display mt-5 text-[clamp(2.5rem,5vw,4.5rem)] leading-none font-bold tracking-tight text-[#ffe082]">
          {{ formatCount(Math.round(km)) }} <span class="text-2xl lg:text-4xl">km</span>
        </p>
        <p class="font-display mt-4 max-w-md text-xl font-bold text-white lg:text-3xl">
          {{ t('whatItBuys.heroMoon', { trips: num(idas) }) }}
        </p>
      </div>
    </div>
    <div class="border-t border-white/15 px-6 py-7 sm:px-10">
      <p class="max-w-4xl text-lg leading-relaxed font-semibold text-[#ffe082] sm:text-2xl">{{ t('whatItBuys.heroPunch') }}</p>
    </div>
  </section>
</template>
