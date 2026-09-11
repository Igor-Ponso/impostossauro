<script setup lang="ts">
/** Fechar fica no navegador, como o tema: preferência funcional, sem consentimento a pedir. */
const CHAVE = 'impostossauro-beta-visto';
const REPOSITORIO = 'https://github.com/Igor-Ponso/impostossauro';

const { t } = useI18n();
const visivel = ref(true);

onMounted(() => {
  try {
    visivel.value = localStorage.getItem(CHAVE) !== '1';
  } catch {
    visivel.value = true;
  }
});

function fechar() {
  visivel.value = false;
  try {
    localStorage.setItem(CHAVE, '1');
  } catch {
    /* navegador sem armazenamento: o aviso volta na próxima visita */
  }
}
</script>

<template>
  <div
    v-if="visivel"
    role="region"
    :aria-label="t('beta.label')"
    class="border-line bg-surface border-b px-4"
  >
    <div class="mx-auto flex max-w-6xl items-start gap-3 py-3 sm:items-center">
      <span class="bg-money text-abyss mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-xs font-bold tracking-wider uppercase sm:mt-0">
        {{ t('beta.label') }}
      </span>
      <p class="text-ink flex-1 text-sm leading-snug">
        {{ t('beta.text') }}
        <a
          :href="`${REPOSITORIO}#o-que-vem-por-aí`"
          target="_blank"
          rel="noopener"
          class="text-dino underline underline-offset-4"
          >{{ t('beta.roadmap') }}</a
        >. {{ t('beta.textIssue') }}
        <a
          :href="`${REPOSITORIO}/issues/new`"
          target="_blank"
          rel="noopener"
          class="text-dino underline underline-offset-4"
          >{{ t('beta.issue') }}</a
        >.
      </p>
      <button
        type="button"
        class="border-control text-ink-dim hover:text-ink flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border text-lg leading-none"
        :aria-label="t('beta.close')"
        @click="fechar"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  </div>
</template>
