<script setup lang="ts">
import { podeMostrarBolinhas } from '~/utils/bolinhas';

/**
 * `Ballpit` puxa `three` e `gsap` (~186 KB): só monta quando a seção aparece
 * e desmonta ao sair, liberando o contexto WebGL.
 */
const Ballpit = defineAsyncComponent(() => import('~/components/vb/Ballpit/Ballpit.vue'));
const GlassSurface = defineAsyncComponent(
  () => import('~/components/vb/GlassSurface/GlassSurface.vue'),
);

const LINK_CAFE = 'https://buymeacoffee.com/igorponso';

const { t } = useI18n();
const { target, inView } = useInView(0.2);

const CORES = [0x4ade80, 0xbbf7d0, 0xeaf2e6, 0x16a34a, 0x141d18];

const naTela = ref(false);
const podeBolinhas = ref(false);
const toque = useAparelhoDeToque();
let observador: IntersectionObserver | null = null;

/**
 * Sem bolinhas em tela estreita ou de toque: 100 esferas com física em WebGL
 * travam celular, e a bolinha segue o cursor, que o toque não tem.
 */
onMounted(() => {
  if (toque.value) return;
  let temWebGL2 = false;
  try {
    temWebGL2 = !!document.createElement('canvas').getContext('webgl2');
  } catch {
    temWebGL2 = false;
  }
  podeBolinhas.value = podeMostrarBolinhas({
    semMovimento: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    ponteiroGrosso: window.matchMedia('(pointer: coarse)').matches,
    largura: window.innerWidth,
    temWebGL2,
  });
  if (!podeBolinhas.value) return;

  const elemento = target.value instanceof Element
    ? target.value
    : (target.value as { $el?: Element } | null)?.$el;
  if (!(elemento instanceof Element)) return;
  observador = new IntersectionObserver(
    (entradas) => { naTela.value = entradas.some((e) => e.isIntersecting); },
    { rootMargin: '200px 0px' },
  );
  observador.observe(elemento);
});

onUnmounted(() => observador?.disconnect());
</script>

<template>
  <section
    ref="target"
    class="reveal border-line relative mt-20 overflow-hidden rounded-3xl border sm:mt-28"
    :class="{ in: inView }"
  >
    <ClientOnly>
      <div v-if="!toque && podeBolinhas && naTela" aria-hidden="true" class="pointer-events-none absolute inset-0">
        <Ballpit
          :count="40"
          :gravity="0.3"
          :friction="0.998"
          :wall-bounce="0.95"
          :follow-cursor="true"
          :colors="CORES"
          :ambient-intensity="0.9"
          :light-intensity="180"
        />
      </div>
    </ClientOnly>

    <div class="pointer-events-none relative flex min-h-[22rem] flex-col items-center justify-center px-6 py-16 sm:min-h-[26rem] sm:py-24">
      <!-- `vidro-sem-halo` (main.css) apaga o brilho branco que o GlassSurface fixa no código. -->
      <ClientOnly>
        <GlassSurface
          v-if="!toque"
          class-name="vidro-sem-halo pointer-events-auto"
          width="fit-content"
          height="auto"
          :border-radius="999"
          :border-width="0.07"
          :blur="18"
          :background-opacity="0.08"
          :brightness="50"
          :displace="6"
          :distortion-scale="0"
          :red-offset="0"
          :green-offset="0"
          :blue-offset="0"
          :saturation="0"
          :opacity="1"
        >
          <span class="flex flex-col items-center gap-4 px-7 py-5 sm:flex-row sm:gap-6 sm:px-9">
            <span class="font-display text-ink text-lg font-bold  sm:text-xl">
              {{ t('coffee.line') }}
            </span>
            <a
              :href="LINK_CAFE"
              target="_blank"
              rel="noopener"
              class="bg-money text-abyss hover:bg-money/85 focus-visible:outline-ink inline-flex w-fit shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {{ t('coffee.cta') }} <span aria-hidden="true">→</span>
            </a>
          </span>
        </GlassSurface>
        <div v-else class="glass pointer-events-auto flex flex-col items-center gap-4 rounded-full px-7 py-5 sm:flex-row sm:gap-6 sm:px-9">
          <span class="font-display text-ink text-lg font-bold  sm:text-xl">
            {{ t('coffee.line') }}
          </span>
          <a
            :href="LINK_CAFE"
            target="_blank"
            rel="noopener"
            class="bg-money text-abyss hover:bg-money/85 focus-visible:outline-ink inline-flex w-fit shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {{ t('coffee.cta') }} <span aria-hidden="true">→</span>
          </a>
        </div>

        <template #fallback>
          <div class="glass pointer-events-auto flex flex-col items-center gap-4 rounded-full px-7 py-5 sm:flex-row sm:gap-6 sm:px-9">
            <span class="font-display text-ink text-lg font-bold  sm:text-xl">
              {{ t('coffee.line') }}
            </span>
            <a
              :href="LINK_CAFE"
              target="_blank"
              rel="noopener"
              class="bg-money text-abyss inline-flex w-fit shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold"
            >
              {{ t('coffee.cta') }} <span aria-hidden="true">→</span>
            </a>
          </div>
        </template>
      </ClientOnly>
    </div>
  </section>
</template>
