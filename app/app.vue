<script setup lang="ts">
const { t, locale } = useI18n();
const route = useRoute();

useHead({
  htmlAttrs: { lang: () => locale.value === 'en' ? 'en-US' : 'pt-BR' },
  titleTemplate: (chunk) => (chunk && chunk !== 'Impostossauro' ? `${chunk} · Impostossauro` : 'Impostossauro'),
});

const isEmbed = computed(() => route.path.includes('/embed/'));

const navItems = navEntries;
const { moeda, cambio } = useMoeda();
const notaCambio = computed(() => t('moeda.nota', {
  taxa: cambio.usdBrl.toLocaleString(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
  data: new Date(`${cambio.data}T12:00:00Z`).toLocaleDateString(locale.value, { timeZone: 'UTC' }),
}));
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <NuxtRouteAnnouncer />
    <a v-if="!isEmbed" href="#conteudo" class="skip-link">{{ t('accessibility.skip') }}</a>
    <SiteHeader v-if="!isEmbed" />
    <AvisoBeta v-if="!isEmbed" />

    <main id="conteudo" tabindex="-1" class="flex-1 overflow-x-clip">
      <!--
        `page-key` nunca vem de `useRoute()`: ela só sincroniza em `page:finish`, que a
        chave parada impedia. A moeda também não entra aqui: remontar joga quem está
        lendo de volta ao topo. Tela que precisa da moeda lê o dado dentro de `computed`.
      -->
      <NuxtPage />
    </main>

    <footer v-if="!isEmbed" class="border-line border-t">
      <div
        class="text-ink-dim mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 leading-relaxed"
      >
        <nav :aria-label="t('accessibility.footerNav')" class="flex flex-wrap gap-x-5 gap-y-1 text-base">
          <NuxtLink
            v-for="item in navItems"
            :key="item.key"
            :to="$localePath(item.path)"
            class="hover:text-ink underline underline-offset-4"
          >
            {{ t(`nav.${item.key}`) }}
          </NuxtLink>
        </nav>
        <p class="text-base">{{ t('footer.disclaimer') }}</p>
        <p class="text-base">
          {{ t('footer.openSource') }}
          <a
            href="https://github.com/Igor-Ponso/impostossauro"
            target="_blank"
            rel="noopener"
            class="hover:text-ink underline underline-offset-4"
            >GitHub</a
          >.
          <template v-for="(pagina, indice) in paginasLegais" :key="pagina.key">
            <span v-if="indice" aria-hidden="true"> · </span>
            <NuxtLink :to="$localePath(pagina.path)" class="hover:text-ink underline underline-offset-4">
              {{ t(`footer.${pagina.key}`) }}
            </NuxtLink>
          </template>
        </p>
        <p v-if="moeda === 'USD'" class="text-sm">
          {{ notaCambio }}
          <a :href="cambio.url" target="_blank" rel="noopener" class="hover:text-ink underline underline-offset-4">{{ cambio.source }}</a>.
        </p>
      </div>
    </footer>
  </div>
</template>
