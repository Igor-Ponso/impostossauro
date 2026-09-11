<script setup lang="ts">
import { contadorDeVisitasCamo } from '~/utils/contadorDeVisitas';

const { t, locale } = useI18n();
const indisponivel = ref(false);
const src = ref('');

onMounted(() => {
  // Um valor descartável por entrada evita o cache de imagens da mesma aba.
  // Gerar só no cliente evita duas requisições entre HTML inicial e hidratação.
  // O valor não é salvo nem identifica um visitante.
  const acesso = Math.random().toString(36).slice(2);
  src.value = `${contadorDeVisitasCamo[locale.value === 'en' ? 'en' : 'pt-BR']}?acesso=${acesso}`;
});
</script>

<template>
  <div id="contador-de-acessos" class="flex min-h-5 shrink-0 items-center">
    <!-- Carrega ao entrar na home; abrir ou fechar o menu não remonta a imagem. -->
    <img
      v-if="src"
      v-show="!indisponivel"
      :src="src"
      :alt="t('footer.visitsAlt')"
      loading="eager"
      referrerpolicy="no-referrer"
      class="h-5 w-auto max-w-full"
      @load="indisponivel = false"
      @error="indisponivel = true"
    >
    <p v-if="indisponivel" role="status" class="text-sm">
      {{ t('footer.visitsUnavailable') }}
    </p>
    <p v-else-if="!src" role="status" class="text-sm">{{ t('footer.visitsLoading') }}</p>
  </div>
</template>
