/** Fonte unica das rotas: o rodape (`app.vue`) e o painel (`SiteHeader.vue`) derivam daqui. */
export interface NavEntry {
  key: string;
  path: string;
}

export const navEntries: NavEntry[] = [
  { key: 'journey', path: '/jornada' },
  { key: 'calculator', path: '/calculadora' },
  { key: 'timeMachine', path: '/maquina-do-tempo' },
  { key: 'inflation', path: '/inflacao' },
  { key: 'fallacies', path: '/falacias' },
  { key: 'economics', path: '/economia-101' },
  { key: 'business', path: '/custo-brasil' },
  { key: 'publicMachine', path: '/maquina-publica' },
  { key: 'spending', path: '/eles-gastaram' },
  { key: 'manifesto', path: '/manifesto' },
  { key: 'methodology', path: '/metodologia' },
  { key: 'promises', path: '/prometeram' },
  { key: 'world', path: '/comparacao-global' },
  { key: 'whatItBuys', path: '/o-que-dava-para-comprar' },
];

/** Fora dos grupos e da home: rótulo em `footer.*`, listadas no painel e no rodapé. */
export const paginasLegais: NavEntry[] = [
  { key: 'privacy', path: '/privacidade' },
  { key: 'terms', path: '/termos' },
];

export interface NavGroup {
  key: string;
  items: string[];
}

/** Toda página de `navEntries` aparece aqui uma vez só (`tests/navegacaoGrupos.spec.ts`). */
export const navGroups: NavGroup[] = [
  { key: 'youPay', items: ['calculator', 'journey', 'inflation'] },
  { key: 'whereItGoes', items: ['spending', 'publicMachine', 'business'] },
  { key: 'whatTheySay', items: ['timeMachine', 'fallacies', 'promises'] },
  { key: 'understand', items: ['economics', 'world', 'manifesto', 'methodology'] },
  { key: 'closing', items: ['whatItBuys'] },
];
