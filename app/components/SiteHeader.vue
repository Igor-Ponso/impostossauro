<script setup lang="ts">
const GlassSurface = defineAsyncComponent(
  () => import("~/components/vb/GlassSurface/GlassSurface.vue"),
);

const { t } = useI18n();
const route = useRoute();

const toque = useAparelhoDeToque();

const rolou = ref(false);
function aoRolar() {
  rolou.value = window.scrollY > 8;
}

/** `GlassSurface` exige altura em pixel: com `height=100%` colapsa para 16px. Por isso a barra é medida. */
const barra = ref<HTMLElement | null>(null);
const alturaBarra = ref(56);

function medir() {
  if (barra.value)
    alturaBarra.value = Math.round(barra.value.getBoundingClientRect().height);
}

onMounted(() => {
  aoRolar();
  medir();
  window.addEventListener("scroll", aoRolar, { passive: true });
  window.addEventListener("resize", medir, { passive: true });
});
onUnmounted(() => {
  window.removeEventListener("scroll", aoRolar);
  window.removeEventListener("resize", medir);
});

const open = ref(false);
const painel = ref<HTMLElement | null>(null);
const botao = ref<HTMLElement | null>(null);

const grupos = navGroups;

const caminhos: Record<string, string> = Object.fromEntries(
  navEntries.map((entrada) => [entrada.key, entrada.path]),
);

watch(
  () => route.fullPath,
  () => (open.value = false),
);

watch(open, (aberto) => {
  document.body.style.overflow = aberto ? "hidden" : "";
  if (aberto) nextTick(() => painel.value?.querySelector("a")?.focus());
  else botao.value?.focus();
});

onUnmounted(() => {
  document.body.style.overflow = "";
});

function aoTeclar(event: KeyboardEvent) {
  if (event.key === "Escape") {
    open.value = false;
  }
  if (open.value && event.key === "Tab") {
    const controles = Array.from(
      (event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>(
        "a, button",
      ),
    );
    const primeiro = controles[0];
    const ultimo = controles.at(-1);
    if (event.shiftKey && document.activeElement === primeiro) {
      event.preventDefault();
      ultimo?.focus();
    } else if (!event.shiftKey && document.activeElement === ultimo) {
      event.preventDefault();
      primeiro?.focus();
    }
  }
}
</script>

<template>
  <header
    class="sticky top-0 z-50 transition-[padding] duration-300"
    :class="rolou ? 'cerca px-3 pt-3' : ''"
    @keydown="aoTeclar"
  >
    <div
      v-if="open"
      aria-hidden="true"
      class="fixed inset-0 z-[5]"
      @click="open = false"
    />
    <!--
      Camada atrás da barra, não invólucro: o `GlassSurface` centraliza o conteúdo num flex que a quebraria.
      `ClientOnly` porque ele gera o id do filtro SVG com `Math.random()`, o que diverge na hidratação.
      `blur` amacia o mapa de deslocamento; `displace` é o gaussiano real; os offsets R/G/B fazem o efeito.
    -->
    <ClientOnly>
      <GlassSurface
        v-if="!toque"
        v-show="rolou"
        aria-hidden="true"
        class="pointer-events-none"
        :style="{
          position: 'absolute',
          left: '0.75rem',
          top: '0.75rem',
          zIndex: 1,
        }"
        width="calc(100% - 1.5rem)"
        :height="alturaBarra"
        :border-radius="18"
        :border-width="0.07"
        :blur="13"
        :background-opacity="0.36"
        :brightness="50"
        :displace="2.2"
        :distortion-scale="-180"
        :red-offset="0"
        :green-offset="10"
        :blue-offset="20"
        :saturation="1"
        :opacity="0.93"
      />
    </ClientOnly>
    <div
      v-show="rolou"
      aria-hidden="true"
      class="tela-tubo pointer-events-none absolute inset-x-3 top-3 z-[2] rounded-[18px]"
      :class="{ 'cerca-vidro border-line border': toque }"
      :style="{ height: `${alturaBarra}px` }"
    />
    <nav
      ref="barra"
      class="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 transition-[padding] duration-300"
      :class="rolou ? 'py-2.5' : 'py-3'"
    >
      <NuxtLink
        :to="$localePath('/')"
        :aria-label="t('nav.home') + ' · Impostossauro'"
        class="flex items-center gap-2"
      >
        <DinoMascot mood="happy" compact class="w-9" />
        <!-- Abaixo de 420px o cabeçalho não cabe com a palavra; fica só o mascote. -->
        <span
          class="font-display text-ink hidden overflow-hidden text-lg whitespace-nowrap tracking-tight transition-all duration-300 ease-out min-[420px]:inline-block"
          :class="rolou ? 'max-w-0 opacity-0' : 'max-w-[12rem] opacity-100'"
        >
          Impostossauro
        </span>
      </NuxtLink>

      <div class="flex items-center gap-1 sm:gap-3">
        <MoedaToggle />
        <LangSwitcher />
        <ThemeToggle />
        <button
          ref="botao"
          type="button"
          class="bg-dino text-abyss rounded-lg px-4 py-2 text-sm font-bold"
          :aria-expanded="open"
          aria-controls="painel-navegacao"
          @click="open = !open"
        >
          {{ open ? t("nav.close") : t("nav.menu") }}
        </button>
      </div>
    </nav>

    <!--
      `<Transition>` do Vue, não menu pronto do vue-bits: este tem trava de rolagem,
      devolução de foco, Escape e `aria-expanded`.
    -->
    <Transition name="painel">
      <div
        v-show="open"
        id="painel-navegacao"
        ref="painel"
        class="border-line bg-surface relative z-10 mt-2 max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain rounded-3xl border"
      >
        <div
          class="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div
            v-for="(grupo, indice) in grupos"
            :key="grupo.key"
            class="painel-grupo"
            :style="{ transitionDelay: `${80 + indice * 55}ms` }"
          >
            <p
              class="text-ink-dim mb-3 text-xs font-bold tracking-widest uppercase"
            >
              {{ t(`nav.groups.${grupo.key}`) }}
            </p>
            <NuxtLink
              v-for="item in grupo.items"
              :key="item"
              :to="$localePath(caminhos[item]!)"
              class="border-line hover:border-dino mb-3 block border-l-2 pl-3"
              :aria-current="
                route.path.replace(/\/$/, '') === $localePath(caminhos[item]!)
                  ? 'page'
                  : undefined
              "
            >
              <span class="text-ink block text-sm font-bold">{{
                t(`nav.${item}`)
              }}</span>
              <span class="text-ink-dim block text-xs">{{
                t(`nav.hints.${item}`)
              }}</span>
            </NuxtLink>
          </div>
        </div>
        <div
          class="border-line mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 border-t px-4 py-4"
        >
          <NuxtLink
            v-for="pagina in paginasLegais"
            :key="pagina.key"
            :to="$localePath(pagina.path)"
            class="text-ink-dim hover:text-ink text-sm underline underline-offset-4"
          >
            {{ t(`footer.${pagina.key}`) }}
          </NuxtLink>
          <ContadorDeVisitas :key="route.path" />
        </div>
      </div>
    </Transition>
  </header>
</template>
