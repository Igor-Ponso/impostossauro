import tailwindcss from '@tailwindcss/vite';
import world from './app/data/world.json';
import { slugDoPais } from './app/utils/mundo';

// No GitHub Pages o site vive em /impostossauro/ — o workflow de deploy
// define NUXT_APP_BASE_URL; localmente o padrão continua sendo '/'.
const baseURL = process.env.NUXT_APP_BASE_URL || '/';
const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://igor-ponso.github.io/impostossauro';

// O rastreador do Nitro só acha rota por link no HTML, e a lista de países é
// botão que troca o duelo sem navegar: as rotas por país precisam ser declaradas.
const rotasPorPais = world.paises
  .filter((p) => p.iso !== 'BRA')
  .flatMap((p) => {
    const slug = slugDoPais(p.nome);
    return [`/comparacao-global/${slug}`, `/en/comparacao-global/${slug}`];
  });

export default defineNuxtConfig({
  compatibilityDate: '2026-08-15',
  devtools: { enabled: false },

  modules: ['@nuxtjs/i18n', '@pinia/nuxt', '@nuxt/eslint'],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  i18n: {
    defaultLocale: 'pt-BR',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: false,
    locales: [
      { code: 'pt-BR', language: 'pt-BR', name: 'Português (Brasil)', file: 'pt-BR.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
    baseUrl: siteUrl,
  },

  nitro: {
    prerender: { routes: rotasPorPais },
  },

  runtimeConfig: {
    public: {
      siteUrl,
    },
  },

  app: {
    baseURL,
    head: {
      htmlAttrs: { lang: 'pt-BR' },
      title: 'Impostossauro',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Quanto imposto o brasileiro já pagou este ano, em tempo real, e o que poderia ter sido feito com esse dinheiro. Cada número com fonte.',
        },
        { name: 'theme-color', content: '#070b09' },
        { property: 'og:title', content: 'Impostossauro' },
        {
          property: 'og:description',
          content:
            'Impostos cobrados, serviços que não chegam e o custo da máquina pública. Uma denúncia independente, com fontes.',
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: `${siteUrl}/og/og-home.png` },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: `${siteUrl}/og/og-home.png` },
        { name: 'referrer', content: 'strict-origin-when-cross-origin' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: `${baseURL}favicon-32.png` },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: `${baseURL}favicon-32.png` },
        { rel: 'apple-touch-icon', sizes: '180x180', href: `${baseURL}apple-touch-icon.png` },
        { rel: 'manifest', href: `${baseURL}site.webmanifest` },
      ],
      script: [
        {
          // Roda antes da primeira pintura. O tema, para não piscar branco: a
          // chave repete a de utils/theme.ts porque o bundle ainda não existe
          // (theme.spec.ts trava as duas). A classe `js` liga a animação de
          // entrada: sem ela o `.reveal` fica visível (ver main.css).
          innerHTML:
            "(function(){try{if(localStorage.getItem('impostossauro-tema')==='light'){document.documentElement.dataset.theme='light'}}catch(e){}document.documentElement.classList.add('js')})()",
          tagPosition: 'head',
        },
      ],
    },
  },
});
