<script setup lang="ts">
import worldData from '~/data/world.json';
import type { Texto } from '~/utils/secoesCompletas';

const props = defineProps<{ chave: string; fundo: boolean }>();

const { t, locale } = useI18n();
const { target, inView } = useInView(0.2);

/**
 * Os raios são WebGL: montam e desmontam ao entrar e sair da tela (o componente
 * chama `loseContext()` ao desmontar; o navegador derruba contextos por volta
 * de dezesseis). `useInView` é de uma via só, por isso o observador próprio abaixo.
 */
const SideRays = defineAsyncComponent(() => import('~/components/vb/SideRays/SideRays.vue'));

// `vb/` não é auto-importado pelo Nuxt.
const SpotlightCard = defineAsyncComponent(
  () => import('~/components/vb/SpotlightCard/SpotlightCard.vue'),
);

// `BorderGlow` não é WebGL (não conta contexto) e recebe cor sólida, não token de tema.
const BorderGlow = defineAsyncComponent(
  () => import('~/components/vb/BorderGlow/BorderGlow.vue'),
);

const { theme: temaAtual } = useTheme();
const toque = useAparelhoDeToque();
const fundoDaSecao = computed(() => (temaAtual.value === 'light' ? '#dfe6d5' : '#0e1410'));


const raiosNaTela = ref(false);
const podeRaios = ref(false);
let observadorDosRaios: IntersectionObserver | null = null;

onMounted(() => {
  if (!props.fundo || toque.value) return;
  const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  try {
    podeRaios.value = !semMovimento && !!document.createElement('canvas').getContext('webgl2');
  } catch {
    podeRaios.value = false;
  }
  if (!podeRaios.value) return;

  const elemento = target.value instanceof Element ? target.value : (target.value as { $el?: Element } | null)?.$el;
  if (!(elemento instanceof Element)) return;
  observadorDosRaios = new IntersectionObserver(
    (entradas) => { raiosNaTela.value = entradas.some((e) => e.isIntersecting); },
    { rootMargin: '150px 0px' },
  );
  observadorDosRaios.observe(elemento);
});

onUnmounted(() => observadorDosRaios?.disconnect());

const intro = introDaPagina(props.chave);
const caminho = navEntries.find((e) => e.key === props.chave)?.path;
if (!caminho) throw new Error(`PageIntro: a pagina "${props.chave}" nao esta em navEntries`);

const ordemPaginas = navGroups.flatMap((g) => g.items);
const posicao = ordemPaginas.indexOf(props.chave);
if (posicao === -1) throw new Error(`PageIntro: a pagina "${props.chave}" nao esta em navGroups`);
const numeroSecao = String(posicao + 1).padStart(2, '0');

const grupo = navGroups.find((g) => g.items.includes(props.chave));
if (!grupo) throw new Error(`PageIntro: a pagina "${props.chave}" nao esta em navGroups`);
const grupoChave = grupo.key;

// `secoesCompletasDe(locale)`: há valor com número formatado, e "R$ 8.475,55" na rota em inglês é outro número.
const secao = computed(() => secoesCompletasDe(locale.value)[props.chave]);
const numeroCartoes = computed(() => secao.value?.numeros?.length ?? 0);

function nomeDoPais(iso: string): string {
  if (locale.value.startsWith('en')) {
    const nomeEn = (worldData.nomesEn as Record<string, string>)[iso];
    if (nomeEn) return nomeEn;
  }
  return worldData.paises.find((p) => p.iso === iso)?.nome ?? iso;
}

/**
 * `t()` não formata número. Só os não inteiros passam por `toLocaleString`:
 * um ano como 2025 viraria "2.025".
 */
function resolverValores(valores: Record<string, string | number> | undefined): Record<string, string> {
  const saida: Record<string, string> = {};
  for (const [chave, valor] of Object.entries(valores ?? {})) {
    saida[chave] = typeof valor === 'number' && !Number.isInteger(valor)
      ? valor.toLocaleString(locale.value)
      : String(valor);
  }
  return saida;
}

function resolverTexto(item: Texto | undefined): { texto: string; atribuicao?: string } | null {
  if (!item) return null;
  if ('literal' in item) return { texto: item.literal, atribuicao: item.atribuicao };
  const valores = resolverValores(item.valores);
  if (item.paisIso) valores.pais = nomeDoPais(item.paisIso);
  return { texto: t(item.chave, valores), atribuicao: item.atribuicao };
}

function classeDaConclusao(indice: number, total: number): string {
  if (indice === total - 1) return 'text-alert font-bold';
  if (indice === 0) return 'text-ink font-bold';
  return 'text-ink-dim font-normal';
}
</script>

<template>
  <section ref="target" class="relative overflow-hidden" :class="fundo ? 'border-line bg-surface border-y' : ''">
    <div
      aria-hidden="true"
      class="float-glow bg-dino/10 pointer-events-none absolute h-72 w-72 rounded-full blur-3xl sm:h-80 sm:w-80"
      :class="fundo ? '-top-24 right-[-10%]' : '-bottom-24 left-[-10%]'"
    />

    <ClientOnly>
      <!--
        A máscara confina o feixe ao canto superior direito, mais apertada no celular:
        sobre a coluna de texto o parágrafo cai abaixo do piso de contraste 4,5:1.
      -->
      <div
        v-if="!toque && fundo && podeRaios && raiosNaTela"
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 mask-[radial-gradient(72%_50%_at_100%_0%,black_0%,black_10%,transparent_50%)] sm:mask-[radial-gradient(96%_78%_at_100%_0%,black_0%,black_18%,transparent_58%)]"
      >
        <SideRays
          origin="top-right"
          ray-color1="#27ff64"
          ray-color2="#a8ffb6"
          :speed="2.5"
          :intensity="2.4"
          :spread="2"
          :tilt="0"
          :saturation="1.5"
          :blend="0.75"
          :falloff="1.6"
          :opacity="1"
        />
      </div>
    </ClientOnly>

    <div
      class="reveal mx-auto grid max-w-6xl grid-cols-[52px_1fr] gap-5 px-4 py-14 sm:grid-cols-[88px_1fr] sm:gap-10 sm:py-20"
      :class="{ in: inView }"
    >
      <div class="border-line flex flex-col items-end border-r pr-3 sm:pr-4">
        <p aria-hidden="true" class="font-display text-ink-dim tabular text-2xl leading-none sm:text-4xl">
          {{ numeroSecao }}
        </p>
        <p
          aria-hidden="true"
          class="text-ink-dim mt-4 rotate-180 text-xs font-semibold tracking-[0.2em] uppercase [writing-mode:vertical-rl]"
        >
          {{ t(`nav.groups.${grupoChave}`) }}
        </p>
      </div>

      <div class="relative min-w-0">
        <p class="text-dino text-sm font-semibold tracking-[0.2em] uppercase sm:text-base">
          {{ t(intro.kicker) }}
        </p>

        <h3 class="font-display text-ink mt-4 text-2xl font-bold  sm:text-3xl">
          {{ t(intro.title) }}
        </h3>
        <!-- Sobre os raios, `ink-dim` fica abaixo do piso de contraste 4,5:1. -->
        <p class="mt-5 text-base leading-relaxed" :class="fundo ? 'text-ink' : 'text-ink-dim'">
          {{ t(intro.paragrafo) }}
        </p>

        <div
          v-if="numeroCartoes"
          class="mt-10 grid gap-4"
          :class="numeroCartoes === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'"
        >
          <div
            v-for="(numero, indice) in secao!.numeros"
            :key="numero.origem"
            class="reveal h-full min-w-0"
            :class="{ in: inView }"
            :style="{ transitionDelay: `${indice * 120}ms` }"
          >
            <!--
              `GlassSurface` não entra aqui: o `backdrop-filter` com filtro SVG, em 34
              cartões, levou o quadro a 388 ms. O vidro caro fica só onde há um.
            -->
            <SpotlightCard
              class="glass h-full !rounded-3xl !p-6"
              spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
            >
              <p class="tabular font-display text-money break-words text-2xl font-bold sm:text-3xl">
              {{ numero.valor }}
            </p>
            <p v-if="numero.legenda" class="text-ink-dim mt-2 text-base leading-relaxed">
              {{ resolverTexto(numero.legenda)!.texto }}
            </p>
            <p v-for="(nota, indiceNota) in numero.notas ?? []" :key="indiceNota" class="text-ink-dim mt-2 text-xs leading-relaxed">
              {{ resolverTexto(nota)!.texto }}
              <template v-if="resolverTexto(nota)!.atribuicao"> — {{ resolverTexto(nota)!.atribuicao }}</template>
            </p>
            <a
              :href="numero.fonte.url"
              target="_blank"
              rel="noopener"
              class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4"
            >
              {{ numero.fonte.label }}
            </a>
            </SpotlightCard>
          </div>
        </div>

        <p v-if="secao?.subtema" class="font-display text-ink mt-10 text-xl leading-snug font-bold sm:text-2xl">
          {{ resolverTexto(secao.subtema)!.texto }}
        </p>

        <FederalRevenueChart v-if="chave === 'methodology'" class="mt-10" />
        <ClientOnly v-else-if="secao?.conclusao?.length">
          <BorderGlow
            class-name="mt-10"
            :background-color="fundoDaSecao"
            :border-radius="24"
            :edge-sensitivity="34"
            :glow-radius="46"
            :glow-intensity="1.1"
            :cone-spread="28"
            :colors="['#f87171', '#fbbf24', '#f87171']"
          >
            <div class="p-6 sm:p-8">
          <p
            v-for="(item, indice) in secao.conclusao"
            :key="indice"
            class="text-lg leading-relaxed sm:text-xl"
            :class="[classeDaConclusao(indice, secao.conclusao.length), indice > 0 ? 'mt-3' : '']"
          >
            {{ resolverTexto(item)!.texto }}
            <template v-if="resolverTexto(item)!.atribuicao">
              <span class="text-ink-dim text-sm font-normal"> — {{ resolverTexto(item)!.atribuicao }}</span>
            </template>
          </p>
            </div>
          </BorderGlow>
          <template #fallback>
            <div class="border-alert/30 bg-alert/5 mt-10 rounded-3xl border p-6 sm:p-8">
              <p
                v-for="(item, indice) in secao!.conclusao"
                :key="indice"
                class="text-lg leading-relaxed sm:text-xl"
                :class="[classeDaConclusao(indice, secao!.conclusao!.length), indice > 0 ? 'mt-3' : '']"
              >
                {{ resolverTexto(item)!.texto }}
              </p>
            </div>
          </template>
        </ClientOnly>

        <ul v-if="secao?.fontes?.length" class="text-ink-dim mt-8 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <li v-for="fonte in secao.fontes" :key="fonte.url">
            <a :href="fonte.url" target="_blank" rel="noopener" class="hover:text-ink underline underline-offset-4">{{
              fonte.label
            }}</a>
          </li>
        </ul>

        <NuxtLink
          :to="$localePath(caminho)"
          class="bg-dino text-abyss hover:bg-dino-belly focus-visible:outline-ink mt-8 inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {{ t(`nav.${chave}`) }} <span aria-hidden="true">→</span>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
