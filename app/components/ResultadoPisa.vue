<script setup lang="ts">
import pisa from '~/data/pisa.json';

/**
 * Fecha o bloco de insumos: quanto o país aplica em educação, e quanto do
 * aprendizado chega ao aluno. Os dois lados vêm de fontes independentes — o
 * gasto do Banco Mundial, o aprendizado da própria OCDE.
 */
const { t, locale } = useI18n();

const reveal = useInView(0.2);

const pct = (v: number) => v.toLocaleString(locale.value, {
  minimumFractionDigits: 0, maximumFractionDigits: 1,
});

const rotulo = (key: string) => t(`world.pisa${key.charAt(0).toUpperCase()}${key.slice(1)}`);

const grupos = [
  { titulo: 'world.pisaBaselineTitle', linhas: pisa.baseline },
  { titulo: 'world.pisaTopTitle', linhas: pisa.top },
];
</script>

<template>
  <div
    :ref="reveal.target"
    class="reveal mt-8"
    :class="{ in: reveal.inView.value }"
  >
    <h3 class="font-display text-ink text-xl font-bold tracking-tight sm:text-2xl">
      {{ t('world.pisaTitle') }}
    </h3>
    <p class="text-ink-dim mt-2 leading-relaxed">
      {{ t('world.pisaIntro') }}
    </p>
    <p class="text-ink mt-3 text-sm leading-relaxed">
      {{ t('world.pisaSpending', { pct: pct(pisa.spending.pctGdp), ano: pisa.spending.year }) }}
    </p>

    <div class="mt-6 grid gap-4 sm:grid-cols-2">
      <section
        v-for="grupo in grupos"
        :key="grupo.titulo"
        class="glass rounded-3xl p-5 sm:p-6"
      >
        <h4 class="font-display text-ink text-sm font-bold tracking-wide uppercase">
          {{ t(grupo.titulo) }}
        </h4>

        <div
          v-for="linha in grupo.linhas"
          :key="linha.key"
          class="mt-5 first:mt-4"
        >
          <p class="text-ink-dim text-xs">{{ rotulo(linha.key) }}</p>

          <div class="mt-2 flex items-center gap-3">
            <span class="text-ink-dim w-24 shrink-0 text-xs">{{ t('world.pisaBrazil') }}</span>
            <span class="h-2 flex-1 overflow-hidden rounded-full" style="background: var(--color-line)">
              <span
                class="block h-full rounded-full"
                :style="{ width: `${linha.brazil}%`, background: 'var(--color-alert)' }"
              />
            </span>
            <span class="tabular font-display text-ink w-12 shrink-0 text-right text-base">
              {{ pct(linha.brazil) }}%
            </span>
          </div>

          <div class="mt-1.5 flex items-center gap-3">
            <span class="text-ink-dim w-24 shrink-0 text-xs">{{ t('world.pisaOecd') }}</span>
            <span class="h-2 flex-1 overflow-hidden rounded-full" style="background: var(--color-line)">
              <span
                class="block h-full rounded-full"
                :style="{ width: `${linha.oecd}%`, background: 'var(--color-ink-dim)' }"
              />
            </span>
            <span class="tabular text-ink-dim w-12 shrink-0 text-right text-base">
              {{ pct(linha.oecd) }}%
            </span>
          </div>
        </div>
      </section>
    </div>

    <p class="text-ink-dim mt-4 text-sm leading-relaxed">
      {{ t('world.pisaLeaders', { share: pisa.leaders.share }) }}
    </p>

    <p class="font-display text-ink mt-6 text-lg leading-snug font-bold sm:text-xl">
      {{ t('world.pisaPunch') }}
    </p>
    <p class="text-ink-dim mt-2 leading-relaxed">
      {{ t('world.pisaQuestion') }}
    </p>

    <p class="text-ink-dim mt-4 text-xs leading-relaxed">
      {{ t('world.pisaSourcePrefix') }}:
      <a
        class="hover:text-dino underline underline-offset-4"
        :href="pisa.url"
        target="_blank"
        rel="noopener"
      >{{ pisa.source }}</a>
      ·
      <a
        class="hover:text-dino underline underline-offset-4"
        :href="pisa.spending.url"
        target="_blank"
        rel="noopener"
      >{{ pisa.spending.source }}</a>
    </p>
  </div>
</template>
