<script setup lang="ts">
  import PageBlock from '@/components/PageBlock/PageBlock.vue';
  import i18n from '@/plugins/i18n';
</script>
<template>
  <PageBlock />
  <PageBlock>
    <StackL justify-evenly full-height center>
      <TextL tag="h1" big class="text-black">
        {{ i18n.global.t('about_us.title') }}
      </TextL>
      <ClusterL bigger class="justify-center">
        <img
          src="../../assets/images/about_us/robson.jpeg"
          alt=""
          style="width: 25%"
        />
        <StackL width="75%" center>
          <TextL tag="p" justify medium class="text-black">
            {{ i18n.global.t('about_us.intro') }}
          </TextL>
          <TextL tag="p" justify medium class="text-black">
            {{ i18n.global.t('about_us.mission') }}
          </TextL>
          <TextL tag="p" justify medium class="text-black">
            {{ i18n.global.t('about_us.relationship') }}
          </TextL>
        </StackL>
      </ClusterL>
    </StackL>
  </PageBlock>
</template>
