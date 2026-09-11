<script setup lang="ts">
import taxData from "~/data/tax-data.json";
// Importados à mão: o auto-import do Nuxt os batizaria de `VbDarkVeilDarkVeil`.
// Estáticos: o `DarkVeil` monta na troca de tema, e baixar o chunk ali trava a animação.
import DarkVeil from "~/components/vb/DarkVeil/DarkVeil.vue";
import DotField from "~/components/vb/DotField/DotField.vue";

// `defineAsyncComponent`, não o prefixo `Lazy`: o `Lazy` só vale para componente
// auto-importado, e `vb/` não é.
const DecryptedText = defineAsyncComponent(
  () => import("~/components/vb/DecryptedText/DecryptedText.vue"),
);
const SpotlightCard = defineAsyncComponent(
  () => import("~/components/vb/SpotlightCard/SpotlightCard.vue"),
);

const { formatDinheiro, formatDinheiroInteiro } = useMoeda();

const { t } = useI18n();
const { amount, perSecond, sinceArrival, year } = useTaxClock();

usePaginaSeo({ titulo: t("hero.pageTitle"), descricao: t("hero.description") });

const { theme } = useTheme();

// Com movimento reduzido o fundo não monta: é um laço de requestAnimationFrame
// sobre WebGL, não uma animação que se pausa.
const semMovimento = ref(false);

// Alfa contida de propósito: acima disto um ponto atrás de uma letra derruba o
// contraste do texto para menos de 4,5:1.
const pontos = computed(() =>
  theme.value === "light"
    ? {
        de: "rgba(9, 74, 36, 0.30)",
        para: "rgba(40, 96, 62, 0.22)",
        brilho: "#dfe6d5",
      }
    : {
        de: "rgba(74, 222, 128, 0.34)",
        para: "rgba(110, 200, 150, 0.26)",
        brilho: "#14110E",
      },
);

/**
 * Sem WebGL 2 o `ogl` estoura na hidratação (`this.gl.renderer = this` com `gl`
 * nulo) e o Vue troca a página inteira pela tela de erro. A guarda fica aqui,
 * não em `vb/`, que é código de terceiro. WebGL 2: os shaders são `#version 300 es`.
 */
const temWebGL = ref(false);

// Fora da tela os dois canvases WebGL continuariam rodando requestAnimationFrame.
const heroiNaTela = ref(true);
let observadorDoHeroi: IntersectionObserver | null = null;

onMounted(() => {
  semMovimento.value = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (semMovimento.value) return;
  try {
    temWebGL.value = !!document.createElement("canvas").getContext("webgl2");
  } catch {
    temWebGL.value = false;
  }

  const secao = document.querySelector("section.mesh-claro");
  if (secao) {
    observadorDoHeroi = new IntersectionObserver(
      (entradas) => {
        heroiNaTela.value = entradas.some((e) => e.isIntersecting);
      },
      { rootMargin: "120px 0px" },
    );
    observadorDoHeroi.observe(secao);
  }
});

onUnmounted(() => observadorDoHeroi?.disconnect());

const equivalences = computed(() =>
  // A chave fica fora de `dados`: dentro, o `v-bind` a espalharia por cima do
  // `:key` e ela vazaria para o DOM.
  Object.entries(taxData.referenceCosts).slice(0, 3).map(([chave, cost]) => ({
    chave,
    dados: {
      artwork: arteEquivalencia(chave),
      count: howMany(amount.value, cost.unitCost),
      label: t(`equivalences.items.${chave}.label`),
      description: t(`equivalences.items.${chave}.description`),
      source: cost.source,
      url: cost.url,
    },
  })),
);

const porQueExiste = useInView(0.25);
const fiveMonthsHeader = useInView(0.3);
const equivalencesHeader = useInView(0.2);
const closingReveal = useInView(0.35);
</script>

<template>
  <div>
    <section
      class="mesh-claro grain relative flex min-h-[92svh] flex-col items-center justify-center gap-8 px-4 py-20 text-center"
    >
      <!--
        As camadas sobem por trás do cabeçalho (`--altura-cabecalho`): paradas
        na borda da seção desenhavam uma emenda que lia como barra preta. O véu
        só existe no tema escuro: sob o claro o contador cai a 1:1 de contraste.
      -->
      <div
        v-if="!semMovimento && temWebGL && theme === 'dark' && heroiNaTela"
        aria-hidden="true"
        class="pointer-events-none absolute inset-x-0 bottom-0 -z-10"
        :style="{ top: 'calc(var(--altura-cabecalho) * -1)' }"
      >
        <DarkVeil
          :speed="0.5"
          :hue-shift="150"
          :noise-intensity="0"
          :scanline-intensity="0"
          :scanline-frequency="0.5"
          :warp-amount="0"
        />
      </div>

      <!--
        `pointer-events-none` não atrapalha a grade: ela escuta o cursor na
        `window`. A máscara apaga os pontos no rodapé: atrás da seta "Role para
        conhecer" eles derrubavam o contraste para 3,65:1 (piso 4,5).
      -->
      <div
        v-if="!semMovimento && heroiNaTela"
        aria-hidden="true"
        class="pointer-events-none absolute inset-x-0 bottom-0 -z-10 mask-[linear-gradient(to_bottom,black_0%,black_76%,transparent_94%)]"
        :style="{ top: 'calc(var(--altura-cabecalho) * -1)' }"
      >
        <ClientOnly>
          <DotField
            :gradient-from="pontos.de"
            :gradient-to="pontos.para"
            :glow-color="pontos.brilho"
          />
        </ClientOnly>
      </div>
      <!--
        O véu de leitura nasce do bloco (`.heroi-bloco`), não do herói: em
        porcentagem do herói ele não acompanha o bloco quando a largura muda.
      -->
      <div class="heroi-bloco relative flex flex-col items-center gap-8">
        <h1 class="sr-only">{{ t("hero.pageTitle") }}</h1>
        <!--
        `text-ink`, não `text-ink-dim`: o dim ficava em 4,49:1 sobre um fundo
        que anda (piso 4,50). O ponto é inline, não item de flex: no celular,
        com a frase em duas linhas, ele ficava solto na margem.
      -->
        <p
          class="text-ink text-center text-base font-semibold tracking-[0.18em] uppercase sm:text-lg"
        >
          <span
            class="bg-dino mr-2.5 inline-block h-2.5 w-2.5 translate-y-[-0.1em] animate-pulse rounded-full align-middle"
            aria-hidden="true"
          />
          {{ t("hero.kicker", { year }) }}
        </p>
        <ClientOnly>
          <TaxCounter :amount="amount" :per-second="perSecond" nota />
          <template #fallback>
            <TaxCounter :amount="0" />
          </template>
        </ClientOnly>
        <p class="text-ink text-lg leading-relaxed md:text-2xl">
          {{ t("hero.perSecond", { value: formatDinheiroInteiro(perSecond) }) }}
        </p>
        <p class="text-ink text-lg leading-relaxed md:text-2xl">
          {{ t("hero.sinceArrival") }}
          <ClientOnly>
            <span class="tabular text-money font-bold">{{
              formatDinheiro(sinceArrival)
            }}</span>
            <template #fallback>
              <!-- Pelo formatador também: escrito à mão, o zero sairia
               "R$ 0,00" na rota em inglês, onde é "R$0.00". -->
              <span class="tabular text-money font-bold">{{
                formatDinheiro(0)
              }}</span>
            </template>
          </ClientOnly>
        </p>

        <p
          id="nota-estimativa"
          class="text-ink-dim mx-auto scroll-mt-24 text-center text-sm leading-relaxed"
        >
          <span class="text-alert font-bold" aria-hidden="true">*</span>
          {{ t("hero.estimateNote") }}
          <NuxtLink
            :to="$localePath('/metodologia')"
            class="hover:text-dino underline underline-offset-4"
            >{{ t("hero.estimateLink") }}</NuxtLink
          >.
        </p>
      </div>

      <a
        href="#sua-conta"
        class="heroi-rodape text-ink-dim hover:text-ink absolute bottom-6 flex flex-col items-center gap-1 text-base transition-colors"
      >
        {{ t("hero.scroll") }}
        <span aria-hidden="true" class="animate-bounce text-lg">↓</span>
      </a>
    </section>

    <CalculadoraInicio />

    <section
      id="por-que-existe"
      class="mx-auto flex max-w-6xl scroll-mt-20 flex-col justify-center px-4 py-16 sm:py-24"
    >
      <SpotlightCard
        :ref="porQueExiste.target"
        class="border-line bg-card/40 reveal p-8 sm:p-12"
        :class="{ in: porQueExiste.inView.value }"
        spotlight-color="color-mix(in oklab, var(--color-dino) 16%, transparent)"
      >
        <div class="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,.7fr)]">
          <div>
            <p
              class="font-display text-ink flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl"
            >
              Impostossauro
            </p>
            <p
              class="text-dino mt-5 text-sm font-semibold tracking-[0.2em] uppercase sm:text-base"
            >
              <ClientOnly>
                <DecryptedText
                  :text="t('manifesto.kicker')"
                  animate-on="view"
                  :speed="52"
                  :max-iterations="16"
                  sequential
                  reveal-direction="start"
                  class-name="text-dino"
                  encrypted-class-name="text-dino/40"
                />
                <template #fallback>{{ t("manifesto.kicker") }}</template>
              </ClientOnly>
            </p>
            <h2
              class="font-display text-ink mt-3 text-3xl font-bold tracking-tight  sm:text-5xl"
            >
              {{ t("manifesto.title") }}
            </h2>
            <p
              class="text-alert mt-6 text-xl leading-snug font-bold sm:text-2xl"
            >
              {{ t("manifesto.tldr") }}
            </p>
            <p class="text-ink-dim mt-6 text-lg leading-relaxed">
              {{ t("manifesto.intro") }}
            </p>
          </div>
          <!-- ART: impostossauro-cidade · 1:1 · abertura editorial após a calculadora -->
          <Art id="impostossauro-cidade" sizes="(min-width: 1024px) 440px, 90vw" class="mx-auto w-full max-w-[560px] rounded-3xl" />
        </div>

        <div class="border-line mt-10 border-t pt-8">
          <p class="text-ink font-display text-lg font-bold sm:text-xl">
            {{ t("manifesto.rules.title") }}
          </p>
          <ul class="mt-5 grid gap-4 sm:grid-cols-3">
            <li
              v-for="(regra, indice) in ['rule1', 'rule2', 'rule3']"
              :key="regra"
            >
              <SpotlightCard
                class="border-line bg-card/50 h-full p-5"
                spotlight-color="color-mix(in oklab, var(--color-dino) 22%, transparent)"
              >
                <p
                  aria-hidden="true"
                  class="font-display text-dino tabular text-sm font-bold"
                >
                  {{ String(indice + 1).padStart(2, "0") }}
                </p>
                <p class="text-ink-dim mt-2 text-sm leading-relaxed">
                  {{ t(`manifesto.rules.${regra}`) }}
                </p>
              </SpotlightCard>
            </li>
          </ul>
        </div>

        <NuxtLink
          :to="$localePath('/manifesto')"
          class="bg-dino text-abyss hover:bg-dino-belly focus-visible:outline-ink mt-8 inline-flex w-fit items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {{ t("manifesto.readCta") }} <span aria-hidden="true">→</span>
        </NuxtLink>
      </SpotlightCard>
    </section>

    <LazyWageGap hydrate-on-visible />

    <section id="cinco-meses" class="mx-auto max-w-6xl px-4 py-20 sm:py-28">
      <div
        :ref="fiveMonthsHeader.target"
        class="reveal"
        :class="{ in: fiveMonthsHeader.inView.value }"
      >
        <p
          class="text-dino text-sm font-semibold tracking-[0.2em] uppercase sm:text-base"
        >
          {{ t("fiveMonths.kicker") }}
        </p>
        <h2
          class="font-display text-ink mt-3 text-3xl font-bold tracking-tight  sm:text-5xl"
        >
          {{ t("fiveMonths.title") }}
        </h2>
        <p class="text-ink-dim mt-4 text-lg leading-relaxed">
          {{ t("fiveMonths.subtitle") }}
        </p>
      </div>
      <div class="mt-10">
        <LazyFiveMonthsBar hydrate-on-visible />
      </div>
    </section>

    <section class="mx-auto max-w-6xl px-4 py-20 sm:py-28">
      <div
        :ref="equivalencesHeader.target"
        class="reveal"
        :class="{ in: equivalencesHeader.inView.value }"
      >
        <p
          class="text-dino text-sm font-semibold tracking-[0.2em] uppercase sm:text-base"
        >
          {{ t("equivalences.kicker") }}
        </p>
        <h2
          class="font-display text-ink mt-3 text-3xl font-bold tracking-tight  sm:text-5xl"
        >
          {{ t("equivalences.title") }}
        </h2>
        <p class="text-ink-dim mt-4 text-lg">
          {{ t("equivalences.subtitle", { year }) }}
        </p>
      </div>
      <div class="mt-10 space-y-6">
        <LazyEquivalenceCard
          v-for="(item, index) in equivalences"
          :key="item.chave"
          v-bind="item.dados"
          horizontal
          :reverse="index % 2 === 1"
          hydrate-on-visible
        />
      </div>
      <LazyNotaMetodologia hydrate-on-visible :nota="t('equivalences.note')" />
      <NuxtLink :to="$localePath('/o-que-dava-para-comprar')" class="text-dino mt-5 inline-flex items-center gap-2 underline underline-offset-4">{{ t('homeCalculator.equivalences') }} →</NuxtLink>
    </section>

    <LazyHomeDoors hydrate-on-visible />

    <section class="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
      <div
        :ref="closingReveal.target"
        class="reveal"
        :class="{ in: closingReveal.inView.value }"
      >
        <h2
          class="font-display text-ink text-3xl font-bold tracking-tight  sm:text-5xl"
        >
          {{ t("closing.title") }}
        </h2>
        <p class="text-ink-dim mx-auto mt-5 text-lg leading-relaxed">
          {{ t("closing.body") }}
        </p>
        <div class="mt-6 flex flex-col items-center gap-6">
          <NuxtLink
            :to="$localePath('/eles-gastaram')"
            class="bg-dino text-abyss inline-block rounded-full px-7 py-3.5 text-sm font-bold shadow-[0_0_40px_color-mix(in_oklab,var(--color-dino)_30%,transparent)] transition-transform hover:scale-105"
          >
            {{ t("closing.cta") }}
          </NuxtLink>
        </div>
      </div>
    </section>

    <div class="mx-auto max-w-6xl px-4 pb-20">
      <LazySignaturePhrase hydrate-on-visible :phrase="t('signature.home')" />

      <LazySecaoCafe hydrate-on-visible />
    </div>
  </div>
</template>
