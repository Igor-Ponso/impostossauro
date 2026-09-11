# Impostossauro

**Quanto o Brasil arrecada, para onde o dinheiro vai e o que os documentos
oficiais registram sobre isso.**

O site estima a arrecadação brasileira, calcula a carga sobre o salário e reúne
casos sobre o destino do dinheiro público. Cada número traz a fonte ao lado, com
link para o documento e cópia arquivada.

A posição editorial do projeto e seus critérios de publicação estão no
[manifesto](https://igor-ponso.github.io/impostossauro/manifesto) e nos
[termos de uso](https://igor-ponso.github.io/impostossauro/termos).

**No ar:** <https://igor-ponso.github.io/impostossauro>

## O que o site tem

Na abertura, o **contador vivo**: a arrecadação do ano correndo por segundo, e
quanto ela já somou desde que você abriu a página — convertida em coisas
concretas, com o custo unitário e a fonte oficial ao lado de cada equivalência.
A calculadora resumida vem logo depois. O conteúdo se distribui em quatorze
páginas, além da privacidade e dos termos.

**O que você paga**

- **A Jornada** — a tributação do mesmo dinheiro em seis etapas: antes de o
  salário existir, no holerite, na compra, na poupança, na casa e na herança.
- **A Calculadora** — quanto do seu salário vai embora por ano, contando o que
  aparece no holerite e o que vem embutido no preço. E em que dia do ano você
  para de trabalhar para o governo.
- **Inflação** — o imposto que ninguém votou, e o imposto cobrado sobre ele.

**Para onde vai**

- **Eles Gastaram** — obras paralisadas, orçamentos corrigidos pelo TCU e
  despesas com publicidade, fundos, cargos, folha, estatais e cartão
  corporativo. Cada caso distingue despesa, orçamento, indício e entrega.
- **A Máquina Pública** — o mapa dos 27 estados: quanto cada um manda para
  Brasília e quanto volta, ano a ano, com as duas metades da conta em fonte
  primária.
- **Custo Brasil** — o que custa produzir qualquer coisa aqui, do encargo sobre
  a folha à margem que sobra para a empresa.

**O que eles dizem**

- **A Máquina do Tempo** — o discurso de cada governo ao lado dos números do
  próprio período.
- **Falácias** — as desculpas recorrentes da política brasileira, cada uma com a
  conta que a desmente.
- **Prometeram** — o que se disse que o imposto novo ia resolver, ao lado do que
  aconteceu depois.

**Para entender**

- **Economia 101** — os conceitos que explicam por que aumentar imposto nem
  sempre aumenta arrecadação.
- **O Brasil no Mundo** — quanto os outros países cobram e o que entregam em
  troca, na mesma régua.
- **Metodologia aberta** — todas as fontes, fórmulas e limitações em
  [`/metodologia`](https://igor-ponso.github.io/impostossauro/metodologia).

**O fecho**

- **O que dava para comprar?** — o tamanho de um ano de imposto, em coisas com
  preço. Cada item traz o preço, a fonte e a **procedência** dele: se alguém
  pagou aquilo, se é valor de mercado numa data, ou se é estimativa de terceiro
  que o dono do número nunca confirmou.

## Como os dados são tratados

Os dados ficam em [`app/data/`](app/data), cada entrada com `source` e `url`. As
fontes primárias são Receita Federal, Tesouro Nacional (SICONFI), IBGE, Banco
Central, FNDE, Ministério da Saúde, DIEESE e Impostômetro/ACSP.

Cada fonte tem uma cópia arquivada na Wayback Machine, listada em
[`app/data/arquivos.json`](app/data/arquivos.json): página oficial sai do ar e
matéria é editada, e a cópia registra o que a fonte dizia quando o número entrou.

Citação entre aspas é transcrição do documento. Paráfrase é marcada como
paráfrase e aparece sem aspas.

Correções publicadas ficam na errata, dentro dos
[termos de uso](app/data/errata.json).

## Achou um número errado?

**Abra uma [issue](https://github.com/Igor-Ponso/impostossauro/issues/new) com a
fonte.** Correção documentada é a contribuição mais valiosa que este projeto pode
receber. Informe o endereço da página e o documento que sustenta a correção; não
publique dados pessoais.

## Rodando o projeto

```bash
npm ci            # instalar exatamente o que está no lock
npm run dev       # desenvolvimento em http://localhost:3000
npm run generate  # build estático em .output/public
npm test          # testes unitários
npm run lint      # lint
npm run typecheck # tipos de Vue/TypeScript
npm run verify:publication # links internos, SEO e sitemap depois de generate
npm run cambio    # atualiza a cotação do dia em app/data/cambio.json
npm run arquivar  # garante cópia de cada fonte na Wayback Machine
```

A versão do Node fica no [`.nvmrc`](.nvmrc) e é a mesma da integração contínua —
rode `nvm use` antes de começar.

## Como é feito

[Nuxt 4](https://nuxt.com) (Vue 3.5, Vite) com geração estática ·
[Tailwind CSS 4](https://tailwindcss.com) ·
[@nuxtjs/i18n](https://i18n.nuxtjs.org) em pt-BR e en ·
[Pinia](https://pinia.vuejs.org) ·
[Vitest](https://vitest.dev) e [ESLint](https://eslint.nuxt.com).

Sem biblioteca de componentes: a interface é própria.

A publicação é feita pelo GitHub Pages, a partir da branch `dev`, depois de lint,
testes, verificação de tipos, geração estática e auditoria de links.

## O que vem por aí

- **Arte própria em tudo.** Substituir os elementos visuais genéricos por
  ilustrações na identidade do site.
- **Comparador de governos.** Dois períodos lado a lado, com os mesmos
  indicadores e a mesma régua para ambos.
- **Disse × Votou.** Cruzar o discurso com o registro de votação nominal da
  Câmara e do Senado.
- **Mais casos em Eles Gastaram.** Ampliar a seleção com contratos, pagamentos e
  resultados documentados, sem confundir orçamento com despesa efetiva.

## Créditos e licença

Geometria do mapa do Brasil: [@svg-maps/brazil](https://github.com/VictorCazanave/svg-maps)
de Victor Cazanave, sob CC-BY-4.0.

Código sob [MIT](LICENSE). Os dados são públicos e de suas respectivas fontes,
citadas em cada número.
