<script setup lang="ts">
import econPt from '~/data/economia101.json';
import { indicadoresMundo } from '~/utils/indicadoresMundo';
import worldPt from '~/data/world.json';
import { bandeiraDe } from '~/utils/bandeiras';
import {
  posicaoNoRanking, slugDoPais, vereditoDe, type PaisMundo,
} from '~/utils/mundo';

/**
 * Corpo da página num componente porque duas rotas o montam: `/comparacao-global`
 * (abre com a Suíça) e `/comparacao-global/<pais>` (link compartilhado cai na página inteira).
 */
const props = defineProps<{
  paisInicial?: string;
}>();

const { t, locale } = useI18n();

const world = dadoNoIdioma('world.json', worldPt, locale.value);
const econ = dadoNoIdioma('economia101.json', econPt, locale.value);
const localePath = useLocalePath();
const router = useRouter();


const cargaReveal = useInView(0.2);
const irbesReveal = useInView(0.2);

const paises = world.paises;
/** `nomesEn` vem da própria resposta do Banco Mundial, não de lista à mão. */
const nomes = computed<Record<string, string>>(() =>
  locale.value.startsWith('en') && world.nomesEn
    ? { ...Object.fromEntries(paises.map((p) => [p.iso, p.nome])), ...world.nomesEn }
    : Object.fromEntries(paises.map((p) => [p.iso, p.nome])),
);
const brasil = paises.find((p) => p.iso === 'BRA')!;

const oponente = ref<PaisMundo>(
  (paises as PaisMundo[]).find((p) => p.iso === props.paisInicial && p.iso !== 'BRA')
  ?? (paises as PaisMundo[]).find((p) => p.iso === 'CHE')!,
);

const paisNaUrl = ref(Boolean(props.paisInicial));
// A seleção muda a URL sem remontar o duelo. A troca de idioma deve acompanhá-la.
const comparacaoSelecionada = useState<string | null>('comparacao-selecionada', () => null);
onUnmounted(() => { comparacaoSelecionada.value = null; });
usePaginaSeo({
  titulo: () => paisNaUrl.value ? t('world.countryTitle', { country: nomes.value[oponente.value.iso] }) : t('world.pageTitle'),
  descricao: () => paisNaUrl.value ? t('world.countryDescription', { country: nomes.value[oponente.value.iso] }) : t('world.tldr'),
  caminho: () => localePath(paisNaUrl.value ? `/comparacao-global/${slugDoPais(oponente.value.nome)}` : '/comparacao-global'),
});

/** `history.replaceState`, não `router.replace`: o segundo remonta a página e mata a animação do duelo. */
function escolher(pais: PaisMundo) {
  if (pais.iso === 'BRA') return;
  oponente.value = pais;
  paisNaUrl.value = true;
  comparacaoSelecionada.value = `/comparacao-global/${slugDoPais(pais.nome)}`;
  if (!import.meta.client) return;
  const destino = router.resolve(localePath(`/comparacao-global/${slugDoPais(pais.nome)}`));
  history.replaceState(history.state, '', destino.href);
}

const porCarga = [...paises].sort((a, b) => b.carga - a.carga);
const maiorCarga = porCarga[0]!.carga;
const posicaoCarga = posicaoNoRanking(
  brasil.carga,
  paises.map((p) => p.carga),
  'maiorMelhor',
);
const cobramMais = paises.filter((p) => p.carga > brasil.carga).length;
const mediaCarga = paises.reduce((soma, p) => soma + p.carga, 0) / paises.length;

const indicadores = indicadoresMundo;
const seleciona = (ids: string[]) => indicadores.filter((ind) => ids.includes(ind.id));
const resultados = seleciona(['vida', 'homicidios', 'saneamento']);
const insumos = seleciona(['educacaoGasto', 'saudeGasto']);

interface WorldStat {
  key: string;
  value: string;
  label: string;
  note?: string;
  source: string;
  url: string;
}

const stats = (econ.worldData ?? []) as WorldStat[];
const acha = (key: string) => stats.find((stat) => stat.key === key)!;
const piores = ['iva', 'hours', 'consumption'].map(acha);
const oecd = acha('oecd');

/**
 * Sem número de fora: a comparação com a América Latina (Economia 101) traria
 * uma terceira carga do Brasil a uma página que já declara duas.
 */
const cobramMenos = porCarga.filter((p) => p.carga < brasil.carga);
/** A Irlanda fica de fora: ela é nomeada logo em seguida, como a menor do grupo. */
const exemplosCobramMenos = computed(() =>
  ['CHE', 'USA', 'CAN', 'AUS'].map((iso) => nomes.value[iso]!),
);

const porIrbes = [...paises].sort((a, b) => a.posicao - b.posicao);
const topo = porIrbes.slice(0, 3);
const idhPiorDosOutros = Math.min(...paises.filter((p) => p.iso !== 'BRA').map((p) => p.idh));
const paisIdhPior = paises.find((p) => p.idh === idhPiorDosOutros)!;

const num = (valor: number, min = 1, max = 1) =>
  valor.toLocaleString(locale.value, { minimumFractionDigits: min, maximumFractionDigits: max });

/** Data crua do JSON, sem passar por Date: '2025-05-06' vira 06/05/2025. */
const publicado = world.irbes.publicado.split('-').reverse().join('/');

const ressalvas = computed(() => [
  {
    title: t('world.hiddenNotTopTitle'),
    text: t('world.hiddenNotTopText', {
      pos: posicaoCarga,
      total: paises.length,
      acima: cobramMais,
      media: num(mediaCarga, 2, 2),
      brasil: num(brasil.carga, 2, 2),
    }),
    source: world.irbes.fonte,
    url: world.irbes.url,
  },
  {
    title: t('world.hiddenGroupTitle'),
    text: t('world.hiddenGroupText', {
      abaixo: cobramMenos.length,
      exemplos: new Intl.ListFormat(locale.value, { type: 'conjunction' })
        .format(exemplosCobramMenos.value),
      menor: num(porCarga[porCarga.length - 1]!.carga, 1, 1),
      paisMenor: nomes.value[porCarga[porCarga.length - 1]!.iso]!,
    }),
    source: world.irbes.fonte,
    url: world.irbes.url,
  },
  {
    title: t('world.hiddenTwoNumbersTitle'),
    text: t('world.hiddenTwoNumbersText', {
      ibpt: num(brasil.carga, 2, 2),
      oecd: oecd.value,
      fonte: oecd.source,
    }),
    source: world.irbes.fonte,
    url: world.irbes.url,
  },
]);

const vida = indicadores.find((ind) => ind.id === 'vida')!;
const fraseDoDuelo = computed(() => {
  const ver = vereditoDe(brasil, oponente.value, vida);
  if (ver.anosAMais === null) return t('signature.world');
  return t(ver.cobraMenos ? 'signature.worldDuelLess' : 'signature.worldDuelMore', {
    pais: nomes.value[oponente.value.iso]!,
    pontos: num(Math.abs(ver.difCarga)),
    anos: num(ver.anosAMais),
  });
});
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-12 sm:py-16">
    <header class="max-w-3xl space-y-4">
      <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t('world.kicker') }}
      </p>
      <h1 class="font-display text-ink text-4xl font-bold tracking-tight  md:text-6xl">
        {{ t('world.title') }}
      </h1>
      <p class="text-ink-dim text-lg leading-relaxed">
        {{ t('world.intro') }}
      </p>
      <TldrBadge :text="t('world.tldr')" />
    </header>

    <HiddenTruth :points="ressalvas" />

    <section :ref="cargaReveal.target" class="mt-16">
      <h2 class="font-display text-ink text-2xl font-bold tracking-tight sm:text-4xl">
        {{ t('world.payTitle') }}
      </h2>
      <p class="text-ink-dim mt-3 text-lg leading-relaxed">
        {{ t('world.payIntro') }}
      </p>

      <div class="mt-8 grid gap-4 sm:grid-cols-3">
        <article class="glass rounded-3xl p-6">
          <p class="tabular font-display text-money text-3xl font-bold sm:text-4xl">
            {{ num(brasil.carga, 2, 2) }}%
          </p>
          <p class="text-ink mt-2 leading-relaxed">{{ t('world.payBrazil') }}</p>
        </article>
        <article class="glass rounded-3xl p-6">
          <p class="tabular font-display text-ink text-3xl font-bold sm:text-4xl">
            {{ num(mediaCarga, 2, 2) }}%
          </p>
          <p class="text-ink mt-2 leading-relaxed">{{ t('world.payAverage') }}</p>
        </article>
        <article class="glass rounded-3xl p-6">
          <p class="tabular font-display text-ink text-3xl font-bold sm:text-4xl">
            {{ cobramMais }}
          </p>
          <p class="text-ink mt-2 leading-relaxed">{{ t('world.payAbove') }}</p>
        </article>
      </div>

      <p class="text-dino mt-8 flex items-center gap-2 text-sm font-semibold">
        <span aria-hidden="true" class="seta">&#9654;</span>
        {{ t('world.payPick') }}
      </p>

      <ol
        class="glass reveal mt-3 grid gap-x-8 gap-y-1 rounded-3xl p-4 sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-[repeat(15,minmax(0,1fr))] sm:p-6"
        :class="{ in: cargaReveal.inView.value }"
      >
        <li v-for="(pais, index) in porCarga" :key="pais.iso">
          <component
            :is="pais.iso === 'BRA' ? 'div' : 'button'"
            :type="pais.iso === 'BRA' ? undefined : 'button'"
            :aria-pressed="pais.iso === 'BRA' ? undefined : pais.iso === oponente.iso"
            class="linha gap-2 sm:gap-3"
            :class="{ sel: pais.iso === oponente.iso, br: pais.iso === 'BRA' }"
            @click="escolher(pais)"
          >
            <span class="tabular text-ink-dim w-5 shrink-0 text-right text-xs">{{ index + 1 }}</span>
            <span
              class="nome flex w-36 shrink-0 items-center gap-2 text-sm sm:w-40"
              :class="pais.iso === 'BRA' ? 'text-money font-bold' : 'text-ink'"
            >
              <!-- eslint-disable-next-line vue/no-v-html -- SVG nosso, de utils/bandeiras -->
              <span class="bandeira shrink-0" v-html="bandeiraDe(pais.iso)" />
              <span class="truncate">{{ nomes[pais.iso] }}</span>
            </span>
            <span class="bg-line/40 h-2 flex-1 overflow-hidden rounded-full">
              <span
                class="block h-full rounded-full"
                :class="pais.iso === 'BRA' ? 'bg-money' : 'bg-dino/50'"
                :style="{ width: `${(pais.carga / maiorCarga) * 100}%` }"
              />
            </span>
            <span
              class="tabular w-12 shrink-0 text-right text-sm"
              :class="pais.iso === 'BRA' ? 'text-money font-bold' : 'text-ink-dim'"
            >
              {{ num(pais.carga, 1, 2) }}%
            </span>
            <span class="emduelo text-dino hidden shrink-0 text-xs font-semibold sm:block sm:w-16">
              {{ pais.iso === oponente.iso ? t('world.inDuel') : '' }}
            </span>
          </component>
        </li>
      </ol>

      <p class="text-ink-dim mt-4 text-sm leading-relaxed">
        {{ t('world.payMethod') }} {{ world.irbes.fonteCargaPorPais.BRA }}
        <a
          :href="world.irbes.url"
          target="_blank"
          rel="noopener"
          class="text-dino ml-1 underline underline-offset-4"
        >
          {{ world.irbes.fonte }}
        </a>
      </p>
    </section>

    <section class="mt-16">
      <DuelStage :oponente="oponente" />
      <!-- A única declaração de fonte dos seis índices do duelo na página. -->
      <p class="text-ink-dim mt-3 text-xs leading-relaxed">
        {{ t('duel.sourceNote') }}
        <a
          class="hover:text-dino underline underline-offset-4"
          href="https://data.worldbank.org"
          target="_blank"
          rel="noopener"
        >Banco Mundial</a>{{ t('duel.sourceYears') }}
      </p>
    </section>

    <section class="mt-16">
      <h2 class="font-display text-ink text-2xl font-bold tracking-tight sm:text-4xl">
        {{ t('world.receiveTitle') }}
      </h2>
      <p class="text-ink mt-4 text-lg leading-relaxed">
        {{ t('world.receiveIntro') }}
      </p>

      <h3 class="font-display text-ink mt-10 text-xl font-bold tracking-tight sm:text-2xl">
        {{ t('world.outcomesTitle') }}
      </h3>
      <p class="text-ink-dim mt-2 leading-relaxed">
        {{ t('world.outcomesIntro') }}
      </p>
      <div class="mt-6 grid gap-4 sm:grid-cols-2">
        <WorldCompare
          v-for="ind in resultados"
          :key="ind.id"
          :indicador="ind"
          :nomes="nomes"
        />
      </div>

      <h3 class="font-display text-ink mt-12 text-xl font-bold tracking-tight sm:text-2xl">
        {{ t('world.inputsTitle') }}
      </h3>
      <p class="text-ink-dim mt-2 leading-relaxed">
        {{ t('world.inputsIntro') }}
      </p>
      <div class="mt-6 grid gap-4 sm:grid-cols-2">
        <WorldCompare
          v-for="ind in insumos"
          :key="ind.id"
          :indicador="ind"
          :nomes="nomes"
          insumo
        />
      </div>
      <p class="text-ink-dim mt-4 text-sm leading-relaxed">
        {{ t('world.inputsCaveat') }}
      </p>
    </section>

    <section class="mt-16">
      <h2 class="font-display text-ink text-2xl font-bold tracking-tight sm:text-4xl">
        {{ t('world.worstTitle') }}
      </h2>
      <p class="text-ink-dim mt-3 text-lg leading-relaxed">
        {{ t('world.worstIntro') }}
      </p>
      <div class="mt-8 grid gap-4 lg:grid-cols-3">
        <article
          v-for="stat in piores"
          :key="stat.key"
          class="border-alert/30 bg-alert/5 rounded-3xl border p-6"
        >
          <p class="tabular font-display text-alert text-3xl font-bold">{{ stat.value }}</p>
          <p class="text-ink mt-2 leading-relaxed">{{ stat.label }}</p>
          <p v-if="stat.note" class="text-ink-dim mt-2 text-sm leading-relaxed">{{ stat.note }}</p>
          <a
            :href="stat.url"
            target="_blank"
            rel="noopener"
            class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4"
          >
            {{ t('equivalences.sourcePrefix') }}: {{ stat.source }}
          </a>
        </article>
      </div>
    </section>

    <section :ref="irbesReveal.target" class="mt-16">
      <h2 class="font-display text-ink text-2xl font-bold tracking-tight sm:text-4xl">
        {{ t('world.irbesTitle') }}
      </h2>
      <p class="text-ink-dim mt-3 text-lg leading-relaxed">
        {{ t('world.irbesIntro') }}
      </p>

      <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article
          v-for="(pais, index) in topo"
          :key="pais.iso"
          class="glass reveal rounded-3xl p-6"
          :class="{ in: irbesReveal.inView.value }"
          :style="{ transitionDelay: `${index * 100}ms` }"
        >
          <p class="text-ink-dim text-xs font-semibold tracking-[0.18em] uppercase">
            {{ t('world.rank', { pos: pais.posicao, total: paises.length }) }}
          </p>
          <p class="font-display text-ink mt-2 text-lg font-bold">{{ nomes[pais.iso] }}</p>
          <p class="tabular font-display text-chart-visible mt-1 text-2xl font-bold">
            {{ num(pais.irbes, 2, 2) }}
          </p>
          <p class="text-ink-dim tabular mt-2 text-xs leading-relaxed">
            {{ t('world.irbesCard', { carga: num(pais.carga, 1, 2), idh: num(pais.idh, 3, 3) }) }}
          </p>
        </article>

        <article
          class="border-alert/30 bg-alert/5 reveal rounded-3xl border p-6"
          :class="{ in: irbesReveal.inView.value }"
          style="transition-delay: 300ms"
        >
          <p class="text-alert text-xs font-semibold tracking-[0.18em] uppercase">
            {{ t('world.rank', { pos: brasil.posicao, total: paises.length }) }}
          </p>
          <p class="font-display text-ink mt-2 text-lg font-bold">{{ nomes[brasil.iso] }}</p>
          <p class="tabular font-display text-alert mt-1 text-2xl font-bold">
            {{ num(brasil.irbes, 2, 2) }}
          </p>
          <p class="text-ink-dim tabular mt-2 text-xs leading-relaxed">
            {{
              t('world.irbesCard', { carga: num(brasil.carga, 1, 2), idh: num(brasil.idh, 3, 3) })
            }}
          </p>
        </article>
      </div>

      <article class="glass mt-6 rounded-3xl p-6 sm:p-8">
        <p class="font-display text-ink font-bold">{{ t('world.irbesMethodTitle') }}</p>
        <p class="text-ink-dim mt-3 leading-relaxed">{{ world.irbes.metodologia }}</p>
        <p class="text-ink-dim mt-3 leading-relaxed">
          {{
            t('world.irbesAuthors', {
              edicao: world.irbes.edicao,
              publicado,
              ano: world.irbes.anoBase,
              autores: world.irbes.autores.join(', '),
            })
          }}
        </p>
        <p class="text-ink-dim mt-3 leading-relaxed">
          {{
            t('world.irbesIdh', {
              brasil: num(brasil.idh, 3, 3),
              pais: nomes[paisIdhPior.iso],
              idh: num(idhPiorDosOutros, 3, 3),
            })
          }}
        </p>
        <a
          :href="world.irbes.url"
          target="_blank"
          rel="noopener"
          class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4"
        >
          {{ t('equivalences.sourcePrefix') }}: {{ world.irbes.fonte }}
        </a>
      </article>
    </section>

    <SignaturePhrase :phrase="fraseDoDuelo" />

    <NotaMetodologia :nota="t('world.methodNote')" />
  </div>
</template>

<style scoped>
/* Borda esquerda sempre presente (transparente) para o selecionado não deslocar a linha. */
.linha {
  display: flex; align-items: center; width: 100%; text-align: left;
  border-left: 2px solid transparent; border-radius: 8px;
  padding: 5px 6px; background: none;
  transition: background-color .15s ease, border-color .15s ease;
}
button.linha { cursor: pointer; }
button.linha:hover {
  background: color-mix(in oklab, var(--color-dino) 12%, transparent);
}
button.linha:hover .nome { color: var(--color-dino); }
button.linha:focus-visible { outline: 2px solid var(--color-dino); outline-offset: 2px; }
.linha.sel {
  border-left-color: var(--color-dino);
  background: color-mix(in oklab, var(--color-dino) 16%, transparent);
}
.linha.sel .nome { color: var(--color-dino); font-weight: 700; }
.linha.sel > span { color: var(--color-ink); }
.emduelo { line-height: 1.2; }
.seta { font-size: 10px; }

@media (prefers-reduced-motion: reduce) {
  .linha { transition: none; }
}

.bandeira {
  display: block; width: 22px; height: 15px; border-radius: 2px;
  overflow: hidden; box-shadow: 0 0 0 1px rgb(0 0 0 / 0.12);
}
.bandeira :deep(svg) { display: block; width: 100%; height: 100%; }
</style>
