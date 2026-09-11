<script setup lang="ts">
import { Check, Copy, Share2 } from '@lucide/vue';

const props = defineProps<{ text: string }>();

const { t } = useI18n();
const route = useRoute();
const { siteUrl } = useRuntimeConfig().public;

const pageUrl = computed(() => `${siteUrl.replace(/\/$/, '')}${route.path}`);
const fullMessage = computed(() => `${props.text}\n${pageUrl.value}`);

const whatsappHref = computed(
  () => `https://wa.me/?text=${encodeURIComponent(fullMessage.value)}`,
);
const twitterHref = computed(
  () =>
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(props.text)}&url=${encodeURIComponent(pageUrl.value)}`,
);

const canNativeShare = ref(false);
onMounted(() => {
  canNativeShare.value = typeof navigator !== 'undefined' && !!navigator.share;
});

async function nativeShare() {
  try {
    await navigator.share({ text: props.text, url: pageUrl.value });
  } catch {
    /* usuário cancelou */
  }
}

const copied = ref(false);
const failed = ref(false);
const copyTarget = ref<'message' | 'instagram'>('message');
let timer: ReturnType<typeof setTimeout> | undefined;
async function copyMessage(target: 'message' | 'instagram' = 'message') {
  clearTimeout(timer);
  copyTarget.value = target;
  copied.value = false;
  failed.value = false;
  try {
    await navigator.clipboard.writeText(fullMessage.value);
    copied.value = true;
    if (target === 'message') {
      timer = setTimeout(() => (copied.value = false), 2000);
    }
  } catch {
    failed.value = true;
  }
}
onUnmounted(() => clearTimeout(timer));
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <span class="text-ink-dim mr-1 text-sm font-semibold tracking-wider uppercase sm:text-base">
      {{ t('share.label') }}
    </span>
    <a
      :href="whatsappHref"
      target="_blank"
      rel="noopener"
      class="botao-secundario"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" class="size-4 shrink-0">
        <path d="M20.52 3.48A11.86 11.86 0 0 0 12.05 0C5.47 0 .12 5.35.11 11.93c0 2.1.55 4.15 1.6 5.96L0 24l6.27-1.64a11.93 11.93 0 0 0 5.78 1.47h.01c6.58 0 11.93-5.35 11.94-11.93a11.86 11.86 0 0 0-3.48-8.42ZM12.05 21.81a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.72.97.99-3.63-.24-.37a9.9 9.9 0 0 1-1.52-5.26c0-5.47 4.45-9.92 9.92-9.92a9.85 9.85 0 0 1 7.01 2.91A9.85 9.85 0 0 1 22 11.94c0 5.47-4.45 9.92-9.95 9.87Zm5.44-7.43c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.09 4.49.71.31 1.27.49 1.7.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
      </svg>
      WhatsApp
    </a>
    <a
      :href="twitterHref"
      target="_blank"
      rel="noopener"
      class="botao-secundario"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" class="size-4 shrink-0">
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.64 7.584H.47l8.6-9.835L0 1.154h7.594l5.243 6.932 6.064-6.933Zm-1.29 19.49h2.039L6.487 3.24H4.3l13.31 17.403Z" />
      </svg>
      X
    </a>
    <button
      type="button"
      class="botao-secundario"
      :title="t('share.instagramHint')"
      @click="copyMessage('instagram')"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false" class="size-4 shrink-0">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
      Instagram
    </button>
    <button
      type="button"
      class="botao-secundario"
      @click="copyMessage()"
    >
      <Check v-if="copied" aria-hidden="true" focusable="false" class="size-4 shrink-0" />
      <Copy v-else aria-hidden="true" focusable="false" class="size-4 shrink-0" />
      {{ copied ? t('share.copied') : t('share.copy') }}
    </button>
    <button
      v-if="canNativeShare"
      type="button"
      class="botao-secundario"
      @click="nativeShare"
    >
      <Share2 aria-hidden="true" focusable="false" class="size-4 shrink-0" />
      {{ t('share.native') }}
    </button>
    <p role="status" class="text-ink-dim basis-full text-sm">
      {{ copied ? t(copyTarget === 'instagram' ? 'share.instagramCopied' : 'share.copied') : failed ? t('share.failed') : '' }}
      <a
        v-if="copyTarget === 'instagram' && (copied || failed)"
        href="https://www.instagram.com/"
        target="_blank"
        rel="noopener noreferrer"
        class="text-ink ml-1 font-semibold underline underline-offset-4"
      >{{ t('share.openInstagram') }}</a>
    </p>
    <input v-if="failed" :value="fullMessage" readonly :aria-label="t('share.copy')" class="border-control text-ink w-full rounded-lg border p-2" @focus="($event.target as HTMLInputElement).select()">
  </div>
</template>
