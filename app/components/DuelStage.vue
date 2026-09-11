<script setup lang="ts">
import { indicadoresMundo } from '~/utils/indicadoresMundo';
import worldPt from '~/data/world.json';
import { BANDEIRAS, bandeiraDe } from '~/utils/bandeiras';
import {
  brasilVence, movimentoDe, movimentoNoIdioma, vereditoDe, type PaisMundo,
} from '~/utils/mundo';

/** Atos: 1 VS, 2 silhueta, 3 cor de volta, 4 menu, 5 dados. */
const props = defineProps<{ oponente: PaisMundo }>();

const { t, locale } = useI18n();

const world = dadoNoIdioma('world.json', worldPt, locale.value);

const brasil = (world.paises as PaisMundo[]).find((p) => p.iso === 'BRA')!;
const indicadores = indicadoresMundo;
/** Só os de resultado disputam. Gasto é insumo, e cobrar menos não é vencer. */
const resultados = indicadores.filter((ind) => ind.tipo === 'resultado');
const vida = indicadores.find((ind) => ind.id === 'vida')!;
const pib = indicadores.find((ind) => ind.id === 'pibPorHabitante')!;

const nomeDe = (p: PaisMundo) => (locale.value.startsWith('en')
  ? (world.nomesEn as Record<string, string>)[p.iso] ?? p.nome
  : p.nome);
const nomeOp = computed(() => nomeDe(props.oponente));
const pibDe = (iso: string) => (pib.valores as Record<string, number>)[iso] ?? 0;

const fmt = (v: number, casas = 1) => v.toLocaleString(locale.value, {
  minimumFractionDigits: casas, maximumFractionDigits: casas,
});
const inteiro = (v: number) => Math.round(v).toLocaleString(locale.value);

function luz(hex: string) {
  const cheio = hex.length === 4
    ? hex.slice(1).split('').map((c) => c + c).join('')
    : hex.slice(1);
  const n = Number.parseInt(cheio, 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}
const corOp = computed(() => {
  const fills = (BANDEIRAS[props.oponente.iso] ?? '')
    .match(/#[0-9a-f]{6}|#[0-9a-f]{3}/gi) ?? [];
  return fills.find((c) => luz(c) > 0.12 && luz(c) < 0.86) ?? '#4a5568';
});

const palco = ref<HTMLElement | null>(null);
const ato = ref(1);
const rodar = ref(false);
const deslocs = ref<string[]>([]);
const linhaMovimento = ref('');
const linhaEfeito = ref('');
const linhaFala = ref('');

/** 13 graus enquanto é espetáculo, 0 quando vira dado. */
const anguloGraus = ref(13);
const incl = () => Math.tan((anguloGraus.value * Math.PI) / 180);

function alinhar() {
  const el = palco.value;
  if (!el) return;
  const r = el.getBoundingClientRect();
  deslocs.value = [...el.querySelectorAll<HTMLElement>('.duel-lin')].map((lin) => {
    const c = lin.getBoundingClientRect();
    const centro = c.top - r.top + c.height / 2;
    return `${(-(centro - r.height / 2) * incl()).toFixed(1)}px`;
  });
}

let cronos: ReturnType<typeof setTimeout>[] = [];
const daqui = (ms: number, fn: () => void) => { cronos.push(setTimeout(fn, ms)); };
function limpar() {
  for (const c of cronos) clearTimeout(c);
  cronos = [];
  linhaMovimento.value = '';
  linhaEfeito.value = '';
  linhaFala.value = '';
}

const CURSOR = '<span class="f-cursor"></span>';
const reduzido = () => import.meta.client
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * As falas vêm com [b]...[/b] porque o plugin do i18n recusa HTML na mensagem;
 * o marcador mantém a frase inteira traduzível.
 */
function comNegrito(txt: string): string {
  return txt.replace(/\[b\]/g, '<b>').replace(/\[\/b\]/g, '</b>');
}

function digitar(alvo: Ref<string>, html: string, atraso = 60) {
  if (reduzido()) { alvo.value = html; return; }
  const partes = html.split(/(<[^>]+>)/);
  let saida = '';
  let i = 0;
  let j = 0;
  alvo.value = CURSOR;
  const passo = () => {
    const parte = partes[i];
    if (parte === undefined) { alvo.value = saida; return; }
    if (parte.startsWith('<')) { saida += parte; i += 1; j = 0; }
    else if (j < parte.length) { saida += parte[j]; j += 1; }
    else { i += 1; j = 0; }
    alvo.value = saida + CURSOR;
    daqui(14, passo);
  };
  daqui(atraso, passo);
}

function mostrarDados() {
  ato.value = 5;
  anguloGraus.value = 0;
  alinhar();

  const g = movimentoDe(props.oponente, resultados);
  if (g) {
    digitar(linhaMovimento, comNegrito(t('duel.usedMove', {
      pais: nomeOp.value,
      movimento: movimentoNoIdioma(resultados.find((i) => i.id === g.id)!, locale.value),
    })));
    daqui(700, () => {
      linhaEfeito.value = g.razao >= 3 ? t('duel.superEffective') : t('duel.effective');
      const ver = vereditoDe(brasil, props.oponente, vida);
      if (ver.anosAMais !== null) {
        digitar(linhaFala, comNegrito(t(ver.cobraMenos ? 'duel.verdictLess' : 'duel.verdictMore', {
          pontos: fmt(Math.abs(ver.difCarga)),
          anos: fmt(ver.anosAMais),
        })), 260);
      }
    });
  }

  const vencidas = resultados.filter((ind) => brasilVence(ind, props.oponente));
  if (vencidas.length > 0) {
    daqui(1500, () => {
      const movimentos = vencidas.map((ind) => movimentoNoIdioma(ind, locale.value)).reduce((txt, nome, i, arr) =>
        i === 0 ? nome : `${txt}${i === arr.length - 1 ? t('duel.and') : ', '}${nome}`, '');
      linhaEfeito.value += `  ${t('duel.brazilResisted', { movimentos })}`;
    });
  }
}

function comecar() {
  limpar();
  rodar.value = false;
  if (reduzido()) { mostrarDados(); return; }

  ato.value = 1;
  anguloGraus.value = 13;
  alinhar();
  rodar.value = true;
  daqui(1150, () => { rodar.value = false; ato.value = 2; });
  daqui(1900, () => { ato.value = 3; });
  daqui(2250, () => { digitar(linhaMovimento, t('duel.started')); });
  daqui(3000, () => { ato.value = 4; });
  daqui(4150, () => { limpar(); mostrarDados(); });
}

function pular() {
  limpar();
  rodar.value = false;
  mostrarDados();
}

watch(() => props.oponente, () => { comecar(); });

/** O duelo fica abaixo do ranking: só começa quando o leitor chega nele. */
const { target: alvo, inView: visivel } = useInView(0.15);
watch(visivel, (agora) => { if (agora) comecar(); });

let olho: ResizeObserver | null = null;
onMounted(() => {
  alvo.value = palco.value;
  alinhar();
  if (window.ResizeObserver && palco.value) {
    olho = new ResizeObserver(() => alinhar());
    olho.observe(palco.value);
  }
  // A fonte pixel muda a altura das linhas ao carregar; o alinhamento medido antes fica errado.
  document.fonts?.ready.then(alinhar);
});
onBeforeUnmount(() => {
  for (const c of cronos) clearTimeout(c);
  olho?.disconnect();
});
</script>

<template>
  <div
    ref="palco"
    class="fusao"
    :class="{ rodar }"
    :data-ato="ato"
    :style="{ '--o1': corOp, '--o2': `color-mix(in srgb, ${corOp} 55%, #000)` }"
  >
    <div class="f-corte">
      <div class="f-metade esq" />
      <div class="f-metade dir" />
      <div class="f-slash" />
    </div>

    <div class="f-intro">
      <div class="lado">
        <p class="f-rot">{{ t('duel.charges') }}</p>
        <p class="f-pais">{{ nomeDe(brasil) }}</p>
        <p class="f-carga tabular">{{ fmt(brasil.carga, 2) }}%</p>
        <p class="f-pib tabular">
          {{ t('duel.gdpPerCapita', { valor: inteiro(pibDe('BRA')) }) }}
        </p>
      </div>
      <div class="lado d">
        <p class="f-rot">{{ t('duel.charges') }}</p>
        <p class="f-pais">{{ nomeOp }}</p>
        <p class="f-carga tabular">{{ fmt(oponente.carga, 2) }}%</p>
        <p class="f-pib tabular">
          {{ t('duel.gdpPerCapita', { valor: inteiro(pibDe(oponente.iso)) }) }}
        </p>
      </div>
    </div>

    <div class="f-arena">
      <div class="f-lutador op">
        <!-- eslint-disable-next-line vue/no-v-html -- SVG nosso, de utils/bandeiras -->
        <span class="f-flag" v-html="bandeiraDe(oponente.iso)" />
        <p class="f-plate">
          {{ nomeOp }}
          <span class="tabular">{{ fmt(oponente.carga, 2) }}% &middot; US$ {{ inteiro(pibDe(oponente.iso)) }}</span>
        </p>
      </div>

      <div class="f-linhas">
        <DuelBar
          v-for="(ind, i) in resultados"
          :key="ind.id"
          :indicador="ind"
          :oponente="oponente"
          :desloc="deslocs[i] ?? '0px'"
        />
      </div>

      <div class="f-lutador br">
        <!-- eslint-disable-next-line vue/no-v-html -- SVG nosso, de utils/bandeiras -->
        <span class="f-flag" v-html="bandeiraDe('BRA')" />
        <p class="f-plate">
          {{ nomeDe(brasil) }}
          <span class="tabular">{{ fmt(brasil.carga, 2) }}% &middot; US$ {{ inteiro(pibDe('BRA')) }}</span>
        </p>
      </div>

      <div class="f-caixa">
        <template v-if="ato === 4">
          <div class="f-menu">
            <span class="f-item sel">{{ t('duel.menuCompare') }}</span>
            <span class="f-item">{{ t('duel.menuSwap') }}</span>
            <span class="f-item">{{ t('duel.menuSources') }}</span>
            <span class="f-item">{{ t('duel.menuHidden') }}</span>
          </div>
        </template>
        <template v-else>
          <!-- eslint-disable-next-line vue/no-v-html -- texto nosso, do arquivo de tradução -->
          <p class="f-movimento" v-html="linhaMovimento" />
          <p class="f-efeito">{{ linhaEfeito }}</p>
          <!-- eslint-disable-next-line vue/no-v-html -- texto nosso, do arquivo de tradução -->
          <p class="f-fala" v-html="linhaFala" />
        </template>
      </div>
    </div>

    <div class="f-vs">VS</div>

    <button v-if="ato !== 5" class="f-pular" type="button" @click="pular">
      {{ t('duel.skip') }}
    </button>
  </div>
</template>

<style scoped>
/* Altura fixa: .f-arena é absoluta e não empurra a altura do pai, e item flex
 * tem min-height:auto, logo não encolhe abaixo do conteúdo. */
.fusao {
  width: 100%; height: 668px; position: relative;
  overflow: hidden; border-radius: 10px; background: #05080a;
  transition: filter .75s ease;
  --ang: -13deg;
}
.fusao[data-ato="2"] { filter: grayscale(1) contrast(1.7) brightness(.62); }
/* Ângulo zero nos dados: inclinado, o trilho é mais largo em cima que embaixo,
 * e a mesma porcentagem vira comprimentos diferentes conforme a linha. */
.fusao[data-ato="5"] { --ang: 0deg; }

/* Metades e lâmina no mesmo envoltório inclinado: clip-path em porcentagem e
 * skewX divergem entre si. O inset negativo cobre os cantos que a inclinação
 * descobre. */
.f-corte {
  position: absolute; inset: -14% -34%; transform: skewX(var(--ang));
  z-index: 1; overflow: hidden;
  transition: transform .7s cubic-bezier(.35,.85,.3,1);
}
.f-metade { position: absolute; top: 0; height: 100%; width: 50%; }
.f-metade.esq { left: 0; background: linear-gradient(115deg, var(--c1,#009739) 0%, var(--c2,#04591f) 88%); }
.f-metade.dir { left: 50%; background: linear-gradient(295deg, var(--o1,#d52b1e) 0%, var(--o2,#7d1710) 88%); }
.f-metade::after {
  content: ''; position: absolute; inset: 0; background: #05080a;
  opacity: 0; transition: opacity .5s ease;
}
.fusao:not([data-ato="1"]) .f-metade::after { opacity: .76; }
.f-slash {
  position: absolute; left: 50%; top: 0; width: 4px; height: 100%;
  background: linear-gradient(#fff0, #ffffffdd 14%, #ffffffdd 86%, #fff0);
  transform: translateX(-50%); z-index: 4;
}

.f-vs {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%);
  z-index: 7; font-family: var(--font-display); font-size: clamp(56px,11vw,92px);
  color: #fff; letter-spacing: -.04em;
  text-shadow: 0 0 30px rgb(255 255 255 / .5), 0 5px 0 rgb(0 0 0 / .55);
  transition: opacity .3s ease, transform .4s ease; pointer-events: none;
}
.fusao:not([data-ato="1"]) .f-vs { opacity: 0; transform: translate(-50%,-50%) scale(.72); }

.f-intro {
  position: absolute; inset: 0; z-index: 5; display: flex; align-items: center;
  justify-content: space-between; padding: 0 26px;
  transition: opacity .34s ease, transform .45s ease;
}
.fusao:not([data-ato="1"]) .f-intro { opacity: 0; transform: translateY(-14px); pointer-events: none; }
.f-intro .lado { max-width: 42%; }
.f-intro .lado.d { text-align: right; }
.f-rot { font-size: 11px; letter-spacing: .2em; text-transform: uppercase; color: #ffffffb5; margin: 0 0 5px; }
.f-pais {
  font-family: var(--font-display); font-size: clamp(26px,5vw,42px); color: #fff;
  line-height: .98; margin: 0; text-shadow: 0 3px 16px #0009; letter-spacing: -.02em;
}
.f-carga { font-family: var(--font-display); font-size: clamp(19px,3.6vw,29px); color: #ffffffe6; margin: 7px 0 0; }
.f-pib { font-size: 13px; color: #ffffffab; margin: 5px 0 0; }

.f-arena {
  position: absolute; inset: 0; z-index: 5; padding: 11px 13px 9px;
  display: flex; flex-direction: column; opacity: 0; pointer-events: none;
  transition: opacity .3s ease;
}
.fusao:not([data-ato="1"]) .f-arena { opacity: 1; pointer-events: auto; }
.f-lutador { display: flex; align-items: center; gap: 8px; transition: transform .55s cubic-bezier(.2,.85,.3,1); }
.f-lutador.op { align-self: flex-end; flex-direction: row-reverse; }
.fusao[data-ato="1"] .f-lutador.op { transform: translateX(150%); }
.fusao[data-ato="1"] .f-lutador.br { transform: translateX(-150%); }
.f-flag {
  width: 34px; height: 34px; border-radius: 3px; overflow: hidden;
  flex: 0 0 34px; border: 1px solid #ffffff45; background: #000;
}
.f-flag :deep(svg) { width: 100%; height: 100%; display: block; }
.f-plate { font-family: var(--fonte-pixel); font-size: 11px; line-height: 1.7; color: #fff; text-shadow: 1px 1px 0 #000a; }
.f-plate span { display: block; font-size: 8.5px; color: #ffffffab; margin-top: 2px; }
.f-lutador.op .f-plate { text-align: right; }

.f-linhas {
  flex: 1; display: flex; flex-direction: column; justify-content: center;
  gap: 11px; margin: 4px 0; opacity: 0; transition: opacity .35s ease;
}
.fusao[data-ato="5"] .f-linhas { opacity: 1; }
/* Em zero até os dados entrarem; senão a barra já apareceria cheia. */
.fusao:not([data-ato="5"]) :deep(.duel-fill) { width: 0 !important; }

/* Altura fixa, não mínima: o texto digitado não pode mover o layout depois
 * que alinhar() mediu as linhas. */
.f-caixa {
  position: relative; background: #e9f2e4; border: 3px solid #16240f;
  border-radius: 4px; padding: 11px 14px; height: 116px; flex: 0 0 116px;
  overflow: hidden; box-shadow: 0 3px 0 #00000066, inset 0 0 0 2px #7d9476;
}
.f-movimento { font-family: var(--fonte-pixel); font-size: 12.5px; line-height: 1.8; color: #16240f; margin: 0 0 3px; }
.f-efeito { font-family: var(--fonte-pixel); font-size: 10.5px; color: #8a2a12; margin: 0 0 5px; }
.f-fala { font-family: var(--fonte-pixel); font-size: 10.5px; line-height: 1.95; color: #16240f; margin: 0; }
.f-movimento :deep(b), .f-fala :deep(b) { color: #0c4a22; }
.f-menu {
  display: grid; grid-template-columns: 1fr 1fr; gap: 3px 14px;
  font-family: var(--fonte-pixel); font-size: 11px; line-height: 2; color: #16240f;
}
.f-item { position: relative; padding-left: 16px; }
.f-item.sel::before { content: '\25B6'; position: absolute; left: 0; top: 0; animation: cursorPisca .38s steps(1) 3; }
@keyframes cursorPisca { 50% { opacity: .15; } }
:deep(.f-cursor) {
  display: inline-block; width: 5px; height: 10px; background: #16240f;
  margin-left: 3px; animation: pisca .7s steps(1) infinite; vertical-align: -1px;
}
@keyframes pisca { 50% { opacity: 0; } }

.f-pular {
  position: absolute; right: 10px; bottom: 10px; z-index: 9;
  font-family: var(--fonte-pixel); font-size: 9px; padding: 8px 11px;
  border-radius: 3px; border: 2px solid #ffffff5c; background: #05080ab8;
  color: #fff; cursor: pointer;
}
.f-pular:hover { border-color: #fff; }
.f-pular:focus-visible { outline: 2px solid #ffd76a; outline-offset: 2px; }

.fusao.rodar .f-metade.esq { animation: fSlamE .48s cubic-bezier(.15,.85,.3,1) both; }
.fusao.rodar .f-metade.dir { animation: fSlamD .48s cubic-bezier(.15,.85,.3,1) both; }
.fusao.rodar .f-vs { animation: fVs .42s .3s cubic-bezier(.2,1.5,.4,1) both; }
@keyframes fSlamE { from { transform: translateX(-100%); } to { transform: none; } }
@keyframes fSlamD { from { transform: translateX(100%); } to { transform: none; } }
@keyframes fVs {
  0% { opacity: 0; transform: translate(-50%,-50%) scale(3.4); }
  100% { opacity: 1; transform: translate(-50%,-50%) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .fusao.rodar *, .f-item.sel::before, :deep(.f-cursor) { animation: none !important; }
  .fusao, .f-corte, .f-vs, .f-intro, .f-arena, .f-lutador, .f-linhas { transition: none !important; }
}
@media (max-width: 640px) {
  .fusao { height: 728px; }
  .f-caixa { height: 176px; flex-basis: 176px; }
}
</style>
