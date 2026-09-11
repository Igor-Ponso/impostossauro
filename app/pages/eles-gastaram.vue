<script setup lang="ts">
import dados from '~/data/spending.json';

const { t, locale } = useI18n();
const { formatDinheiroCompacto } = useMoeda();
usePaginaSeo({ titulo: t('spending.pageTitle'), descricao: t('spending.tldr') });
const casos = ['stalled', 'dnit', 'fiscobras', 'bridge'] as const;
const valores = computed(() => ({
  stalled: dados.stalled.stopped.toLocaleString(locale.value),
  dnit: formatDinheiroCompacto(dados.dnit.savedBrl),
  fiscobras: `${dados.fiscobras.seriousIndications} / ${dados.fiscobras.audited}`,
  bridge: formatDinheiroCompacto(dados.bridge.reportedBrl),
}));
const secoes = ['casos', 'publicidade', 'fundos', 'cargos', 'folha', 'estatais', 'cartao'];
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-12 sm:py-16">
    <header class="max-w-3xl space-y-5">
      <p class="text-dino text-sm font-semibold tracking-[0.18em] uppercase">{{ t('spending.kicker') }}</p>
      <h1 class="font-display text-ink text-4xl leading-tight  md:text-6xl">{{ t('spending.title') }}</h1>
      <p class="text-ink-dim text-lg leading-relaxed">{{ t('spending.intro') }}</p>
      <TldrBadge :text="t('spending.tldr')" />
    </header>
    <nav :aria-label="t('spending.contents')" class="border-line my-8 flex flex-wrap gap-2 border-y py-4">
      <a v-for="secao in secoes" :key="secao" :href="`#${secao}`" class="botao-secundario">{{ t(`spending.sections.${secao}`) }}</a>
    </nav>
    <section id="casos" class="scroll-mt-24">
      <h2 class="font-display text-ink text-2xl sm:text-3xl">{{ t('spending.casesTitle') }}</h2>
      <p class="text-ink-dim mt-3 text-sm leading-relaxed">{{ t('spending.scope') }}</p>
      <div class="mt-8 grid items-start gap-6 lg:grid-cols-2">
        <article v-for="caso in casos" :id="caso" :key="caso" class="border-line bg-card min-w-0 scroll-mt-24 rounded-3xl border p-6 sm:p-8">
          <p class="text-dino text-xs font-bold tracking-wider uppercase">{{ t(`spending.cases.${caso}.category`) }}</p>
          <h3 class="font-display text-ink mt-3 text-xl leading-snug sm:text-2xl">{{ t(`spending.cases.${caso}.title`) }}</h3>
          <p class="font-display tabular text-money mt-6 text-4xl sm:text-5xl">{{ valores[caso] }}</p>
          <p class="text-ink mt-2 font-bold">{{ t(`spending.cases.${caso}.metric`) }}</p>
          <p class="text-ink-dim mt-5 leading-relaxed">{{ t(`spending.cases.${caso}.body`) }}</p>
          <p class="border-line text-ink mt-5 border-t pt-4 text-sm leading-relaxed">{{ t(`spending.cases.${caso}.ruler`) }}</p>
          <ul class="text-ink-dim mt-4 space-y-3 text-xs">
            <li><a :href="dados[caso].url" target="_blank" rel="noopener" class="hover:text-dino underline underline-offset-4">{{ dados[caso].source }}</a></li>
            <li v-if="caso === 'bridge'"><a :href="dados.bridge.technical.url" target="_blank" rel="noopener" class="hover:text-dino underline underline-offset-4">{{ dados.bridge.technical.source }}</a></li>
          </ul>
        </article>
      </div>
    </section>
    <section id="publicidade" class="mt-16 scroll-mt-24"><LazyPublicidadeOficial hydrate-on-visible /></section>
    <section id="fundos" class="mt-16 scroll-mt-24"><LazyFundosPartidarios hydrate-on-visible /></section>
    <section id="cargos" class="mt-16 scroll-mt-24"><LazyCargosComissionados hydrate-on-visible /></section>
    <section id="folha" class="mt-16 scroll-mt-24"><LazyFolhaFederal hydrate-on-visible /></section>
    <section id="estatais" class="mt-16 scroll-mt-24"><LazyEstataisFederais hydrate-on-visible /></section>
    <section id="cartao" class="mt-16 scroll-mt-24"><LazyCartaoCorporativo hydrate-on-visible /></section>
    <div class="border-line mt-16 flex flex-wrap items-center justify-between gap-4 border-t pt-8">
      <NuxtLink :to="$localePath('/maquina-publica')" class="text-dino underline underline-offset-4">{{ t('spending.mapLink') }}</NuxtLink>
      <ShareRow :text="t('spending.share')" />
    </div>
    <SignaturePhrase :phrase="t('spending.conclusion')" />
  </div>
</template>
