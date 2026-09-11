<script setup lang="ts">
import taxDataPt from '~/data/tax-data.json';
import whatItBuysPt from '~/data/what-it-buys.json';

const BorderGlow = defineAsyncComponent(
  () => import('~/components/vb/BorderGlow/BorderGlow.vue'),
);

const { theme: temaDoSite } = useTheme();
const fundoDoCartao = computed(() => (temaDoSite.value === 'light' ? '#dfe6d5' : '#121a15'));

/**
 * `provenance` do preço: oficial (órgão publicou), pago (há registro do pagamento),
 * mercado (valor numa data), estimativa (conta de terceiro nunca confirmada).
 */
const { t, locale } = useI18n();
const { formatDinheiro, formatDinheiroCompacto, formatCount } = useMoeda();

const dados = dadoNoIdioma('what-it-buys.json', whatItBuysPt, locale.value);
const taxData = dadoNoIdioma('tax-data.json', taxDataPt, locale.value);

const total = taxData.currentYear.totalBillions * 1e9;

const num = (valor: number, casas = 0) =>
  valor.toLocaleString(locale.value, { minimumFractionDigits: casas, maximumFractionDigits: casas });

/** Abaixo de dez, arredondar para inteiro apagaria o dado: 4,3 Disneys vira 4. */
const contagem = (valor: number) => (valor < 10 ? num(valor, 1) : formatCount(Math.round(valor)));

const emReais = (amount: { value: number; currency: string }) => {
  if (amount.currency === 'BRL') return amount.value;
  return amount.value * (amount.currency === 'USD' ? dados.fx.usdBrl : dados.fx.eurBrl);
};

/** O preço sai na moeda em que a fonte publicou; o em real segue a escolha do leitor. */
const SIMBOLO: Record<string, string> = { BRL: 'R$', USD: 'US$', EUR: '€' };

interface Linha {
  key: string;
  label: string;
  detail: string;
  count: number;
  price: string;
  year: number;
  provenance: string;
  source: string;
  url: string;
}

const social = computed<Linha[]>(() =>
  Object.entries(taxData.referenceCosts)
    .sort(([, a], [, b]) => b.unitCost - a.unitCost)
    .map(([key, custo]) => ({
      key,
      label: t(`equivalences.items.${key}.label`),
      detail: custo.description,
      count: total / custo.unitCost,
      price: formatDinheiro(custo.unitCost),
      year: 0,
      provenance: 'oficial',
      source: custo.source,
      url: custo.url,
    })),
);

/**
 * Ordena só na exibição: o array do JSON não se reordena, porque o overlay em
 * inglês é indexado por posição (`tests/oQueDavaParaComprar.spec.ts`).
 */
const daFamilia = (familia: string) =>
  dados.items
    .filter((item) => item.family === familia)
    .slice()
    .sort((a, b) => emReais(b.amount) - emReais(a.amount))
    .map<Linha>((item) => ({
      key: item.key,
      label: item.label,
      detail: item.detail,
      count: total / emReais(item.amount),
      price: naMoedaEscolhida(`${SIMBOLO[item.amount.currency]} ${num(item.amount.value / (item.amount.value >= 1e9 ? 1e9 : 1e6), 1)} ${
        item.amount.value >= 1e9 ? t('units.billions') : t('units.millions')
      }`),
      year: item.amount.year,
      provenance: item.provenance,
      source: item.source,
      url: item.url,
    }));

const blocos = computed(() => [
  { key: 'social', titulo: dados.families.social, linhas: social.value },
  { key: 'brasil', titulo: dados.families.brasil, linhas: daFamilia('brasil') },
  { key: 'mundo', titulo: dados.families.mundo, linhas: daFamilia('mundo') },
]);

/**
 * O número nasce no valor final, sem contagem: dado não passa por estado errado.
 * Um observador para a peça inteira — `:ref` de `useInView` dentro de `v-for` não funciona.
 */
const { target, inView } = useInView(0.1);

/* ---- a família física ----------------------------------------------------- */

const distanciaKm = (peca: (typeof dados.physical)[number]) => {
  const unidades = total / peca.inputs.unitValueBrl;
  return (unidades * peca.inputs.unitMm) / 1e6;
};
/** g → t é /1e6, uma vez só; dividir de novo por mil publicaria 28.721 t onde são 28.721.000 t. */
const pesoToneladas = (peca: (typeof dados.physical)[number]) =>
  ((total / peca.inputs.unitValueBrl) * peca.inputs.unitG) / 1e6;

const distancias = computed(() =>
  dados.physical
    .filter((peca) => peca.unit === 'km')
    .map((peca) => {
      const km = distanciaKm(peca);
      return { ...peca, km, idas: km / peca.compare.km };
    }),
);
const peso = computed(() => dados.physical.find((peca) => peca.unit === 't'));
const pilha = computed(() => distancias.value.find((peca) => peca.key === 'pilhaMoedas'));
const circunferencia = Math.PI * dados.earth.equatorialDiameterKm;

const voltasNaTerra = computed(() => {
  return pilha.value ? pilha.value.km / circunferencia : 0;
});

const fisicoReveal = useInView(0.2);
</script>

<template>
  <section ref="target" class="relative">
    <div class="bg-abyss/85 border-line sticky top-0 z-20 -mx-4 border-y px-4 py-3 backdrop-blur">
      <div class="mx-auto flex max-w-6xl flex-wrap items-baseline gap-x-4 gap-y-1">
        <p class="tabular font-display text-money shrink-0 text-xl leading-none font-bold sm:text-2xl">
          {{ formatDinheiroCompacto(total) }}
        </p>
        <p class="text-ink-dim min-w-0 text-xs sm:text-sm">
          {{ t('whatItBuys.stickyLabel', { year: taxData.currentYear.year }) }}
        </p>
      </div>
    </div>

    <div
      v-for="bloco in blocos"
      :key="bloco.key"
      class="mt-14 sm:mt-20"
    >
      <h3 class="font-display text-ink text-2xl font-bold tracking-tight sm:text-3xl">
        {{ bloco.titulo }}
      </h3>

      <Art v-if="arteCatalogo[`compras-${bloco.key}`]" :id="`compras-${bloco.key}`" class="mt-6 aspect-[2/1] w-full rounded-3xl object-cover" />

      <ul class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <li
          v-for="(linha, posicao) in bloco.linhas"
          :key="linha.key"
          class="reveal min-w-0"
          :class="{ in: inView }"
          :style="{ transitionDelay: `${Math.min(posicao * 70, 560)}ms` }"
        >
          <ClientOnly>
            <BorderGlow
              class-name="h-full"
              :background-color="fundoDoCartao"
              :border-radius="24"
              :edge-sensitivity="32"
              :glow-radius="42"
              :glow-intensity="1"
              :cone-spread="26"
              :colors="['#4ade80', '#fbbf24', '#bbf7d0']"
            >
              <div class="flex h-full min-w-0 flex-col p-5 sm:p-6">
          <p class="tabular font-display text-dino text-3xl leading-none font-bold break-words sm:text-4xl">
            {{ contagem(linha.count) }}<span class="text-ink-dim text-xl sm:text-2xl">×</span>
          </p>
          <h4 class="text-ink mt-3 text-lg leading-snug font-semibold">{{ linha.label }}</h4>

          <p class="mt-3 flex flex-wrap items-center gap-2">
            <span class="tabular text-ink-dim text-sm">
              {{ linha.price }}<template v-if="linha.year"> · {{ linha.year }}</template>
            </span>
            <span
              class="rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold tracking-wider uppercase"
              :class="{
                'border-dino/40 text-dino': linha.provenance === 'oficial',
                'border-ink-dim/40 text-ink': linha.provenance === 'pago',
                'border-money/40 text-money': linha.provenance === 'mercado',
                'border-alert/40 text-alert': linha.provenance === 'estimativa',
              }"
            >
              {{ t(`whatItBuys.provenance.${linha.provenance}`) }}
            </span>
          </p>

          <p class="text-ink-dim mt-3 text-sm leading-relaxed">{{ linha.detail }}</p>
          <a
            :href="linha.url"
            target="_blank"
            rel="noopener"
            class="text-ink-dim hover:text-dino mt-auto pt-4 text-xs underline underline-offset-4"
          >
            {{ linha.source }}
          </a>
              </div>
            </BorderGlow>

            <template #fallback>
              <div class="glass flex h-full min-w-0 flex-col rounded-3xl p-5 sm:p-6">
          <p class="tabular font-display text-dino text-3xl leading-none font-bold break-words sm:text-4xl">
            {{ contagem(linha.count) }}<span class="text-ink-dim text-xl sm:text-2xl">×</span>
          </p>
          <h4 class="text-ink mt-3 text-lg leading-snug font-semibold">{{ linha.label }}</h4>

          <p class="mt-3 flex flex-wrap items-center gap-2">
            <span class="tabular text-ink-dim text-sm">
              {{ linha.price }}<template v-if="linha.year"> · {{ linha.year }}</template>
            </span>
            <span
              class="rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold tracking-wider uppercase"
              :class="{
                'border-dino/40 text-dino': linha.provenance === 'oficial',
                'border-ink-dim/40 text-ink': linha.provenance === 'pago',
                'border-money/40 text-money': linha.provenance === 'mercado',
                'border-alert/40 text-alert': linha.provenance === 'estimativa',
              }"
            >
              {{ t(`whatItBuys.provenance.${linha.provenance}`) }}
            </span>
          </p>

          <p class="text-ink-dim mt-3 text-sm leading-relaxed">{{ linha.detail }}</p>
          <a
            :href="linha.url"
            target="_blank"
            rel="noopener"
            class="text-ink-dim hover:text-dino mt-auto pt-4 text-xs underline underline-offset-4"
          >
            {{ linha.source }}
          </a>
              </div>
            </template>
          </ClientOnly>
        </li>
      </ul>
    </div>

    <div :ref="fisicoReveal.target" class="reveal mt-16 sm:mt-24" :class="{ in: fisicoReveal.inView.value }">
      <h3 class="font-display text-ink text-2xl font-bold tracking-tight sm:text-3xl">
        {{ t('whatItBuys.physicalTitle') }}
      </h3>
      <p class="text-ink-dim mt-4 text-base leading-relaxed">
        {{ t('whatItBuys.physicalIntro') }}
      </p>

      <div class="mt-8 space-y-6">
        <article class="glass grid items-center gap-6 rounded-3xl p-5 sm:p-8 lg:grid-cols-2 lg:gap-10">
          <Art v-if="arteCatalogo['escala-lua']" id="escala-lua" sizes="(min-width: 1152px) 490px, (min-width: 1024px) 43vw, 90vw" class="w-full rounded-2xl" />
          <div class="min-w-0">
            <h4 class="font-display text-ink text-xl font-bold sm:text-2xl">{{ t('whatItBuys.moonTitle') }}</h4>
            <p v-if="pilha" class="text-ink-dim mt-3 text-sm leading-relaxed">{{ t('whatItBuys.moonReference', { distance: formatCount(pilha.compare.km) }) }}</p>
            <dl class="divide-line mt-5 divide-y">
              <div v-for="peca in distancias" :key="peca.key" class="py-4 first:pt-0">
                <dt class="text-ink text-sm font-semibold">{{ t(peca.key === 'pilhaMoedas' ? 'whatItBuys.moonCoins' : 'whatItBuys.moonNotes') }}</dt>
                <dd class="tabular font-display text-money mt-2 text-2xl font-bold sm:text-3xl">{{ t('whatItBuys.moonResult', { trips: num(peca.idas, 1) }) }}</dd>
                <dd class="tabular text-ink-dim mt-1 text-sm">{{ formatCount(Math.round(peca.km)) }} km</dd>
                <dd class="mt-2"><a :href="peca.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino text-xs underline underline-offset-4">{{ t(peca.key === 'pilhaMoedas' ? 'whatItBuys.coinsSource' : 'whatItBuys.notesSource') }}</a></dd>
              </div>
            </dl>
            <a v-if="pilha?.urlCompare" :href="pilha.urlCompare" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino text-xs underline underline-offset-4">{{ t('whatItBuys.moonSource') }}</a>
          </div>
        </article>

        <article v-if="pilha" class="glass grid items-center gap-6 rounded-3xl p-5 sm:p-8 lg:grid-cols-2 lg:gap-10">
          <Art v-if="arteCatalogo['escala-terra']" id="escala-terra" sizes="(min-width: 1152px) 490px, (min-width: 1024px) 43vw, 90vw" class="w-full rounded-2xl lg:col-start-2 lg:row-start-1" />
          <div class="min-w-0 lg:col-start-1 lg:row-start-1">
            <h4 class="font-display text-ink text-xl font-bold sm:text-2xl">{{ t('whatItBuys.earthTitle') }}</h4>
            <p class="tabular font-display text-money mt-5 text-5xl font-bold sm:text-6xl">{{ formatCount(Math.round(voltasNaTerra)) }}</p>
            <p class="text-ink mt-2 text-lg font-semibold">{{ t('whatItBuys.earthLaps') }}</p>
            <p class="text-ink-dim mt-4 text-sm leading-relaxed">{{ t('whatItBuys.earthCalculation', { distance: formatCount(Math.round(pilha.km)), circumference: formatCount(Math.round(circunferencia)) }) }}</p>
            <p class="text-ink-dim mt-3 text-xs leading-relaxed">{{ dados.earth.note }}</p>
            <div class="mt-4 space-y-2 text-xs">
              <a :href="pilha.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino block underline underline-offset-4">{{ t('whatItBuys.coinsSource') }}</a>
              <a :href="dados.earth.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino block underline underline-offset-4">{{ dados.earth.source }}</a>
            </div>
          </div>
        </article>

        <article v-if="peso" class="glass grid items-center gap-6 rounded-3xl p-5 sm:p-8 lg:grid-cols-2 lg:gap-10">
          <Art v-if="arteCatalogo['escala-peso']" id="escala-peso" sizes="(min-width: 1152px) 490px, (min-width: 1024px) 43vw, 90vw" class="w-full rounded-2xl" />
          <div class="min-w-0">
            <h4 class="font-display text-ink text-xl font-bold sm:text-2xl">{{ t('whatItBuys.weightTitle') }}</h4>
            <p class="tabular font-display text-money mt-5 text-3xl font-bold break-words sm:text-4xl">{{ formatCount(Math.round(pesoToneladas(peso))) }} t</p>
            <p class="text-ink mt-3 text-lg leading-relaxed font-semibold">{{ t('whatItBuys.weightComparison', { towers: formatCount(Math.round(pesoToneladas(peso) / dados.weightReference.tonnes)) }) }}</p>
            <p class="text-ink-dim mt-4 text-sm leading-relaxed">{{ t('whatItBuys.weightCalculation', { tonnes: formatCount(Math.round(pesoToneladas(peso))), unit: formatCount(dados.weightReference.tonnes) }) }}</p>
            <div class="mt-4 space-y-2 text-xs">
              <a :href="peso.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino block underline underline-offset-4">{{ peso.source }}</a>
              <a :href="dados.weightReference.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino block underline underline-offset-4">{{ t('whatItBuys.weightSource') }}</a>
            </div>
          </div>
        </article>
      </div>
    </div>

    <div class="border-alert/30 bg-alert/5 mt-12 rounded-3xl border p-6 sm:p-7">
      <p class="text-alert text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t('whatItBuys.caveatKicker') }}
      </p>
      <p class="text-ink mt-3 text-base leading-relaxed">{{ dados.caveat }}</p>
    </div>

    <p class="text-ink-dim mt-6 text-sm leading-relaxed">{{ dados.disclaimer }}</p>
    <p class="text-ink-dim mt-3 text-xs leading-relaxed">
      {{ dados.fx.note }}
      <a :href="dados.fx.url" target="_blank" rel="noopener" class="text-dino underline underline-offset-4">
        {{ dados.fx.source }}
      </a>
    </p>
  </section>
</template>
