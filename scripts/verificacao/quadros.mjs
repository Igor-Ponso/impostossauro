/**
 * Mede o tempo de quadro ao rolar sobre UMA seção, com toque emulado, via CDP.
 * Compara a página como está com a mesma página sem `backdrop-filter` de filtro
 * SVG, para separar o custo desse efeito do resto.
 *
 * uso (o Chrome sobe como em secao.mjs, na porta 9222):
 *   node scripts/verificacao/quadros.mjs <url> <seletor|texto> [largura] [altura]
 */
const [url, alvo, larg = '390', alt = '844'] = process.argv.slice(2);
const PORTA = 9222;

const cdp = await (async () => {
  for (let i = 0; i < 40; i++) {
    try {
      const lista = await (await fetch(`http://127.0.0.1:${PORTA}/json/list`)).json();
      const alvoPagina = lista.find((t) => t.type === 'page');
      if (alvoPagina) return alvoPagina.webSocketDebuggerUrl;
    } catch { /* ainda subindo */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('chrome nao respondeu na porta de depuracao');
})();

const ws = new WebSocket(cdp);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pendentes = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pendentes.has(m.id)) pendentes.get(m.id)(m.result ?? m.error);
};
const cmd = (method, params = {}) =>
  new Promise((r) => { const n = ++id; pendentes.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
const js = (expr) =>
  cmd('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
    .then((r) => r?.result?.value);

await cmd('Page.enable');
await cmd('Emulation.setDeviceMetricsOverride', {
  width: +larg, height: +alt, deviceScaleFactor: 2, mobile: true,
});
await cmd('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await cmd('Emulation.setEmulatedMedia', {
  features: [{ name: 'pointer', value: 'coarse' }, { name: 'hover', value: 'none' }],
});
await cmd('Page.navigate', { url });
await new Promise((r) => setTimeout(r, 3000));

// Rola tudo para hidratar os componentes `hydrate-on-visible`.
await js(`(async () => {
  const dorme = (ms) => new Promise((r) => setTimeout(r, ms));
  const passo = window.innerHeight / 2;
  for (let y = 0; y <= document.body.scrollHeight; y += passo) {
    window.scrollTo({ top: y, behavior: 'instant' });
    await dorme(120);
  }
  await dorme(600);
})()`);

const topo = await js(`(() => {
  const alvo = ${JSON.stringify(alvo)};
  const el = document.querySelector(alvo)
    || [...document.querySelectorAll('section, article, div')]
      .filter((n) => n.textContent.includes(alvo))
      .sort((a, b) => a.getBoundingClientRect().height - b.getBoundingClientRect().height)[0];
  if (!el) return null;
  const secao = el.closest('section') ?? el;
  return secao.getBoundingClientRect().top + window.scrollY;
})()`);
if (topo === null) { console.error('nao achei o alvo'); process.exit(1); }

const medir = (rotulo) => js(`(async () => {
  const inicio = ${topo} - window.innerHeight * 0.6;
  window.scrollTo({ top: inicio, behavior: 'instant' });
  await new Promise((r) => setTimeout(r, 800));
  const deltas = [];
  let anterior = performance.now();
  let y = inicio;
  let sentido = 1;
  await new Promise((fim) => {
    const passo = () => {
      const agora = performance.now();
      deltas.push(agora - anterior);
      anterior = agora;
      y += 24 * sentido;
      if (y > inicio + window.innerHeight * 0.8 || y < inicio) sentido *= -1;
      window.scrollTo({ top: y, behavior: 'instant' });
      if (deltas.length < 240) requestAnimationFrame(passo); else fim();
    };
    requestAnimationFrame(passo);
  });
  deltas.shift();
  const ordenado = [...deltas].sort((a, b) => a - b);
  const q = (p) => ordenado[Math.floor(ordenado.length * p)].toFixed(1);
  return {
    rotulo: ${JSON.stringify(rotulo)},
    quadros: deltas.length,
    p50: q(0.5), p95: q(0.95), max: ordenado.at(-1).toFixed(1),
    acimaDe33ms: deltas.filter((d) => d > 33).length,
  };
})()`);

const filtrosSvg = await js(`[...document.querySelectorAll('*')]
  .filter((n) => getComputedStyle(n).backdropFilter.includes('url(')).length`);
const comoEsta = await medir('como esta');

await js(`[...document.querySelectorAll('*')]
  .filter((n) => getComputedStyle(n).backdropFilter.includes('url('))
  .forEach((n) => { n.style.setProperty('backdrop-filter', 'none', 'important'); })`);
const semFiltroSvg = await medir('sem backdrop-filter de filtro SVG');

await js(`[...document.querySelectorAll('*')]
  .filter((n) => getComputedStyle(n).backdropFilter !== 'none')
  .forEach((n) => { n.style.setProperty('backdrop-filter', 'none', 'important'); })`);
const semNenhum = await medir('sem backdrop-filter nenhum');

console.log(`elementos com backdrop-filter de filtro SVG na pagina: ${filtrosSvg}`);
for (const r of [comoEsta, semFiltroSvg, semNenhum]) {
  console.log(`${r.rotulo.padEnd(42)} p50 ${r.p50} ms · p95 ${r.p95} ms · max ${r.max} ms · >33ms: ${r.acimaDe33ms}/${r.quadros}`);
}
ws.close();
process.exit(0);
