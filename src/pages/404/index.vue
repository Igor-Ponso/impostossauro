<script lang="ts" setup>
  import { pages } from '@/api/paths';
  import page_not_found from '@/assets/svgs/page_not_found.svg';
</script>
<!-- TODO: Fix that SVG for better responsiveness -->

<template>
  <v-container id="page-not-found">
    <ClusterL center no-gap>
      <img :src="page_not_found" />
      <StackL no-gap class="page-not-found__footer">
        <TextL tag="h1" bold bigger ellipsis>
          {{ $t('page_404.not_found_message') }}
        </TextL>
        <v-btn
          color="blue-grey"
          class="white--text"
          prepend-icon="mdi-home"
          @click="$router.push(pages.home)"
        >
          {{ $t('page_404.btn.home') }}
        </v-btn>
      </StackL>
    </ClusterL>
  </v-container>
</template>

<style lang="stylus" scoped>
  img
    height 100%
    max-width 900px
  .page-not-found__footer
    position absolute
    bottom 60px
</style>

<route lang="yaml">
meta:
  layout: noShell
</route>
