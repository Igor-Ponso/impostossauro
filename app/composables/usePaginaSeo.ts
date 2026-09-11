/**
 * Título, descrição e cartão social de uma página, num lugar só. A descrição é
 * o resumo que a própria página já publica; nada de texto novo para o robô.
 */
export function usePaginaSeo(opcoes: { titulo: MaybeRefOrGetter<string>; descricao: MaybeRefOrGetter<string>; imagem?: string; caminho?: MaybeRefOrGetter<string> }) {
  const { siteUrl } = useRuntimeConfig().public;
  const route = useRoute();
  const { locale } = useI18n();
  const raiz = siteUrl.replace(/\/$/, '');
  const imagem = `${raiz}/og/${opcoes.imagem ?? 'og-home.png'}`;
  const titulo = computed(() => toValue(opcoes.titulo).replace(/\s+[—·|]\s+Impostossauro$/, ''));
  const descricao = computed(() => toValue(opcoes.descricao));
  const caminho = computed(() => toValue(opcoes.caminho) ?? route.path);
  const url = computed(() => `${raiz}${caminho.value.replace(/\/$/, '')}/`);
  const semIdioma = computed(() => caminho.value.replace(/^\/en(?=\/|$)/, '').replace(/\/$/, ''));

  useHead({
    title: () => titulo.value,
    link: () => [
      { rel: 'canonical', href: url.value },
      { rel: 'alternate', hreflang: 'pt-BR', href: `${raiz}${semIdioma.value}/` },
      { rel: 'alternate', hreflang: 'en', href: `${raiz}/en${semIdioma.value}/` },
      { rel: 'alternate', hreflang: 'x-default', href: `${raiz}${semIdioma.value}/` },
    ],
  });
  useSeoMeta({
    description: () => descricao.value,
    ogTitle: () => titulo.value === 'Impostossauro' ? titulo.value : `${titulo.value} · Impostossauro`,
    ogDescription: () => descricao.value,
    ogImage: imagem,
    ogUrl: () => url.value,
    ogLocale: () => locale.value === 'en' ? 'en_US' : 'pt_BR',
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: () => titulo.value,
    twitterCard: 'summary_large_image',
    twitterTitle: () => titulo.value === 'Impostossauro' ? titulo.value : `${titulo.value} · Impostossauro`,
    twitterDescription: () => descricao.value,
    twitterImage: imagem,
  });
}
