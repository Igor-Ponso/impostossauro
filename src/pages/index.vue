<script setup lang="ts">
  import { pages } from '@/api/paths';

  /**
   * First page after App->router-view.
   * @name 'IndexPage'
   * @version 1.0.0
   */

  const router = useRouter();
  onMounted(() => {
    router.push(pages.home);
  });
</script>

<template>
  <router-view />
</template>

<route lang="yaml">
meta:
  layout: default
</route>
