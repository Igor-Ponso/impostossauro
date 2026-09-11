/**
 * Todo gráfico que cruze 2020-2021 leva a marca, e a janela nasce só aqui.
 * A marca demarca o período e publica o que aconteceu com aquele indicador,
 * lido da própria série; nunca a mesma frase carimbada em toda janela.
 */
export const PANDEMIA = { from: 2020, to: 2021 } as const;

export function naPandemia(ano: number): boolean {
  return ano >= PANDEMIA.from && ano <= PANDEMIA.to;
}
