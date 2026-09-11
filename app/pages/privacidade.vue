<script setup lang="ts">
const { t } = useI18n();

usePaginaSeo({ titulo: t("privacy.pageTitle"), descricao: t("privacy.title") });

const LINKS = {
  pagesDoc:
    "https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages",
  githubPolicy:
    "https://docs.github.com/pt/site-policy/privacy-policies/github-general-privacy-statement",
  counter: "https://github.com/antonkomarev/github-profile-views-counter",
  camo: "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-anonymized-urls",
  anpd: "https://www.gov.br/anpd/pt-br",
};
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-12 sm:py-16">
    <header class="space-y-5">
      <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t("privacy.kicker") }}
      </p>
      <h1
        class="font-display text-ink text-4xl font-bold tracking-tight md:text-6xl"
      >
        {{ t("privacy.title") }}
      </h1>
      <p class="text-ink-dim text-lg leading-relaxed">
        {{ t("privacy.intro") }}
      </p>
      <p class="text-ink-dim text-sm">{{ t("privacy.updated") }}</p>
    </header>

    <div class="mt-12 space-y-6">
      <section class="glass rounded-3xl p-6 sm:p-8">
        <h2 class="font-display text-ink text-xl font-bold sm:text-2xl">
          {{ t("privacy.collected.title") }}
        </h2>
        <p class="text-ink-dim mt-3 leading-relaxed">
          {{ t("privacy.collected.p1") }}
        </p>
        <p class="text-ink mt-3 leading-relaxed font-semibold">
          {{ t("privacy.collected.p2") }}
        </p>
      </section>

      <section class="glass rounded-3xl p-6 sm:p-8">
        <h2 class="font-display text-ink text-xl font-bold sm:text-2xl">
          {{ t("privacy.local.title") }}
        </h2>
        <p class="text-ink-dim mt-3 leading-relaxed">
          {{ t("privacy.local.p1") }}
        </p>
      </section>

      <section class="glass rounded-3xl p-6 sm:p-8">
        <h2 class="font-display text-ink text-xl font-bold sm:text-2xl">
          {{ t("privacy.hosting.title") }}
        </h2>
        <p class="text-ink-dim mt-3 leading-relaxed">
          {{ t("privacy.hosting.p1") }}
        </p>
        <ul class="text-ink-dim mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <li>
            <a
              :href="LINKS.pagesDoc"
              target="_blank"
              rel="noopener"
              class="hover:text-dino underline underline-offset-4"
              >{{ t("privacy.hosting.docLink") }}</a
            >
          </li>
          <li>
            <a
              :href="LINKS.githubPolicy"
              target="_blank"
              rel="noopener"
              class="hover:text-dino underline underline-offset-4"
              >{{ t("privacy.hosting.policyLink") }}</a
            >
          </li>
        </ul>
      </section>

      <section class="glass rounded-3xl p-6 sm:p-8">
        <h2 class="font-display text-ink text-xl font-bold sm:text-2xl">
          {{ t("privacy.analytics.title") }}
        </h2>
        <p class="text-ink-dim mt-3 leading-relaxed">
          {{ t("privacy.analytics.on1") }}
        </p>
        <p class="text-ink-dim mt-3 leading-relaxed">
          {{ t("privacy.analytics.on2") }}
        </p>
        <ul class="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <li>
            <a
              :href="LINKS.counter"
              target="_blank"
              rel="noopener"
              class="text-ink-dim hover:text-dino underline underline-offset-4"
              >{{ t("privacy.analytics.link") }}</a
            >
          </li>
          <li>
            <a
              :href="LINKS.camo"
              target="_blank"
              rel="noopener"
              class="text-ink-dim hover:text-dino underline underline-offset-4"
              >{{ t("privacy.analytics.camoLink") }}</a
            >
          </li>
        </ul>
      </section>

      <section class="glass rounded-3xl p-6 sm:p-8">
        <h2 class="font-display text-ink text-xl font-bold sm:text-2xl">
          {{ t("privacy.external.title") }}
        </h2>
        <p class="text-ink-dim mt-3 leading-relaxed">
          {{ t("privacy.external.p1") }}
        </p>
      </section>

      <section class="glass rounded-3xl p-6 sm:p-8">
        <h2 class="font-display text-ink text-xl font-bold sm:text-2xl">
          {{ t("privacy.rights.title") }}
        </h2>
        <p class="text-ink-dim mt-3 leading-relaxed">
          {{ t("privacy.rights.p1") }}
          <a
            :href="LINKS.anpd"
            target="_blank"
            rel="noopener"
            class="text-dino underline underline-offset-4"
            >{{ t("privacy.rights.link") }}</a
          >.
        </p>
      </section>

      <section class="glass rounded-3xl p-6 sm:p-8">
        <h2 class="font-display text-ink text-xl font-bold sm:text-2xl">
          {{ t("privacy.changes.title") }}
        </h2>
        <p class="text-ink-dim mt-3 leading-relaxed">
          {{ t("privacy.changes.p1") }}
        </p>
      </section>
    </div>
  </div>
</template>
