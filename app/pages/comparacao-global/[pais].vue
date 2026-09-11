<script setup lang="ts">
import world from '~/data/world.json';
import { paisPorSlug, type PaisMundo } from '~/utils/mundo';

/**
 * O slug é um só nos dois idiomas, derivado do nome em português: traduzir
 * quebraria link já compartilhado.
 */
/** Trocar de país é outra rota com o mesmo componente: sem chave própria a página não remonta. */
definePageMeta({ key: (rota) => rota.fullPath });

const route = useRoute();

const achado = paisPorSlug(String(route.params.pais), world.paises as PaisMundo[]);
if (!achado || achado.iso === 'BRA') {
  throw createError({ statusCode: 404, statusMessage: 'Pais fora do grupo dos 30' });
}
const iso = achado.iso;
</script>

<template>
  <ComparacaoGlobal :pais-inicial="iso" />
</template>
