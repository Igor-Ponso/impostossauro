export interface PromiseCase {
  id: string;
  layer: 'tributo' | 'gasto';
  promise: { legalText: string; [k: string]: unknown };
  /** 'primaria' = o documento foi aberto e o texto conferido. */
  verified: 'primaria' | 'secundaria';
  [k: string]: unknown;
}

/** Conferido não basta: sem o artigo transcrito a promessa não tem lastro e não publica. */
export function casosPublicaveis(cases: PromiseCase[]): PromiseCase[] {
  return cases.filter(
    (caso) => caso.verified === 'primaria' && caso.promise.legalText.trim().length > 0,
  );
}
