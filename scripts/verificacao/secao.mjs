/**
 * Captura UMA seção de uma página, rolando até ela de verdade, via CDP.
 *
 * Captura de página inteira mente aqui: o `useInView` usa `rootMargin` negativo
 * no rodapé (numa janela alta as seções do fim saem em branco), o
 * `--virtual-time-budget` congela animação no meio, e janela alta estica o
 * `min-h-screen` do herói.
 *
 * uso:
 *   CHROME=".../chrome-headless-shell"
 *   "$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
 *     --remote-debugging-port=9222 --user-data-dir=/tmp/cdp about:blank &
 *   node scripts/verificacao/secao.mjs <url> <seletor|texto> <saida.png> [largura] [altura]
 */
const [url, alvo, saida, larg = '1280', alt = '950'] = process.argv.slice(2);
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
  width: +larg, height: +alt, deviceScaleFactor: 1, mobile: +larg < 500,
});
await cmd('Page.navigate', { url });
await new Promise((r) => setTimeout(r, 2500));

// `scroll-behavior: smooth` anima o scroll: ler cedo devolve posição errada.
await js(`(async () => {
  const dorme = (ms) => new Promise((r) => setTimeout(r, ms));
  const passo = window.innerHeight / 2;
  for (let y = 0; y <= document.body.scrollHeight; y += passo) {
    window.scrollTo({ top: y, behavior: 'instant' });
    await dorme(90);
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
  await dorme(400);
  return document.body.scrollHeight;
})()`);

const caixa = await js(`(() => {
  const alvo = ${JSON.stringify(alvo)};
  // O menor que contém o texto; senão um trecho de card casa com a <section> inteira.
  const el = document.querySelector(alvo)
    || [...document.querySelectorAll('section, article, div')]
      .filter((n) => n.textContent.includes(alvo))
      .sort((a, b) => a.getBoundingClientRect().height - b.getBoundingClientRect().height)[0];
  const peca = el && el.getBoundingClientRect().height < 320 ? (el.closest('.glass') ?? el) : el;
  if (!peca) return null;
  const r = peca.getBoundingClientRect();
  return { x: 0, y: r.top + window.scrollY, width: document.documentElement.clientWidth, height: r.height };
})()`);
if (!caixa) { console.error('nao achei o alvo'); process.exit(1); }

const png = await cmd('Page.captureScreenshot', {
  format: 'png', captureBeyondViewport: true,
  clip: { ...caixa, scale: 1 },
});
const { writeFileSync } = await import('node:fs');
writeFileSync(saida, Buffer.from(png.data, 'base64'));
console.log(`${saida}  ${Math.round(caixa.width)}x${Math.round(caixa.height)}  em y=${Math.round(caixa.y)}`);
ws.close();
process.exit(0);
