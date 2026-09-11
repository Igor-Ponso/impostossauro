# Ilustrações raster

Pipeline de exportação das ilustrações do site. Os originais em PNG ficam em
`artwork/originals/`; `artwork/status.json` registra o que está pronto e o que
ainda falta.

`npm run art:build` não desenha nada e não chama serviço externo. Ele verifica
quais originais existem e prepara, a partir deles: WebP em até 1600 px, versões
de 640 px, metadados, descrições em PT e EN, ícones PNG e quatro cartões sociais.

Na jornada, preserva até 3072 px do original, sem ampliação, e exporta variantes
de 640, 960, 1280 e 2048 px quando menores que o original. O catálogo registra as
larguras disponíveis em `sources`, e `Art.vue` usa essa lista no `srcset`.

Original pendente não bloqueia a exportação dos prontos: o catálogo aponta
explicitamente para a versão anterior quando ela existe, e uma cena nova sem
arquivo não entra no catálogo nem no HTML. `Art.vue` usa o campo `file`, sem
presumir extensão e sem gerar `srcset` para SVG.

`Art.vue` fornece dimensões, `srcset`, carregamento e texto alternativo. O `sizes`
precisa refletir o tamanho visual quando a peça ocupa uma coluna estreita.
`app.baseURL` é respeitado para publicação em subdiretório.

Nota, calendário e Laffer preservam os cálculos em Vue: a ilustração é editorial e
não carrega escala quantitativa própria. Números e traduções vêm do site.

Os testes verificam cobertura do catálogo, dimensões reais, versões responsivas,
descrições e tamanhos de publicação. A revisão manual cobre PT/EN, celular e
desktop, tema claro e escuro, e as interações dos gráficos.
