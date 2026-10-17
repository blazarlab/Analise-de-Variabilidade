'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

const listeners = new Map();
const elements = new Map();
const downloads = [];
let lastBlob = null;
class MockBlob { constructor(parts, options = {}) { this.parts = parts; this.type = options.type || ''; } }
function element(id) {
  if (!elements.has(id)) {
    const classes = new Set();
    elements.set(id, {
      id, textContent: '', innerHTML: '', dataset: {}, attrs: {},
      classList: { toggle(name, force) { if (force === undefined ? !classes.has(name) : force) classes.add(name); else classes.delete(name); return classes.has(name); }, add(name) { classes.add(name); }, remove(name) { classes.delete(name); }, contains(name) { return classes.has(name); } },
      addEventListener(event, fn) { const key = `${id}:${event}`; if (!listeners.has(key)) listeners.set(key, []); listeners.get(key).push(fn); },
      click() {},
      setAttribute(name, value) { this.attrs[name] = String(value); },
      getAttribute(name) { return this.attrs[name] || null; },
      closest(selector) { if (!this._nearest) this._nearest = {selector, hidden:false, parentElement:{querySelector:()=>null,insertBefore(){},querySelectorAll:()=>[]}, querySelector:()=>null, querySelectorAll:()=>[], insertAdjacentElement(){}, classList:{add(){},remove(){},toggle(){}}}; return this._nearest; },
      querySelectorAll() { return []; },
      querySelector() { return null; },
      scrollIntoView() {}
    });
  }
  return elements.get(id);
}
const scenarioButtons = ['smooth', 'flares', 'multiscale'].map(key => Object.assign(element(`scenario-${key}`), { dataset: { scenario: key } }));
const jumpLinks = ['smooth', 'flares', 'multiscale'].map(key => Object.assign(element(`jump-${key}`), { dataset: { jumpScenario: key } }));
const nav = Object.assign(element('siteNav'), { querySelectorAll: () => [] });
const themeButtons = ['light', 'dark'].map(theme => Object.assign(element(`theme-${theme}`), { dataset: { themeChoice: theme } }));
const savedPreferences = new Map();
const doc = {
  readyState: 'complete',
  body: { appendChild() {} },
  createElement(tag) { return { tagName: tag.toUpperCase(), href: '', download: '', textContent: '', innerHTML: '', style: {}, className: '', setAttribute() {}, addEventListener() {}, appendChild() {}, click() { downloads.push({ href: this.href, download: this.download }); }, remove() {} }; },
  documentElement: Object.assign(element('html'), { classList: element('html').classList }),
  getElementById: element,
  querySelector(selector) { if (selector === 'meta[name="theme-color"]') return element('theme-color-meta'); return null; },
  querySelectorAll(selector) {
    if (selector === '[data-theme-choice]') return themeButtons;
    if (selector === '[data-scenario]') return scenarioButtons;
    if (selector === '[data-jump-scenario]') return jumpLinks;
    return [];
  },
  addEventListener() {}
};
const context = {
  document: doc,
  window: { matchMedia: () => ({ matches: false }), innerWidth: Number(process.env.VIEWPORT_WIDTH || 1280), addEventListener() {}, setTimeout(callback) { callback(); }, localStorage: { getItem(key) { return savedPreferences.get(key) || null; }, setItem(key, value) { savedPreferences.set(key, value); } } },
  Blob: MockBlob,
  URL: { createObjectURL(blob) { lastBlob = blob; return 'blob:blazarlab-test'; }, revokeObjectURL() {} },
  history: { replaceState() {} },
  console,
  Number, Math, Map, Set, Object, Array, String, Boolean, Date,
  Intl, JSON,
};
const source = fs.readFileSync(path.join(__dirname, '..', 'blazarlab.js'), 'utf8');
vm.runInNewContext(source, context, { filename: 'blazarlab.js', timeout: 10000 });

assert.equal(element('html').getAttribute('data-theme'), 'dark', 'o tema escuro atual deve ser o padrão');
assert.equal(element('theme-dark').getAttribute('aria-pressed'), 'true', 'o botão escuro deve ser anunciado como selecionado');
const chooseLightTheme = listeners.get('theme-light:click');
assert.ok(chooseLightTheme && chooseLightTheme.length, 'o botão de tema claro deve ter ação');
chooseLightTheme[0]();
assert.equal(element('html').getAttribute('data-theme'), 'light', 'clicar no sol deve ativar o tema claro');
assert.equal(element('theme-light').getAttribute('aria-pressed'), 'true', 'o tema claro deve atualizar seu estado acessível');
assert.equal(element('theme-dark').getAttribute('aria-pressed'), 'false', 'o tema escuro deve perder o estado selecionado');
assert.equal(savedPreferences.get('blazarlab-theme'), 'light', 'a escolha do tema deve ficar salva');

for (const id of ['scenarioStatus', 'scenarioDescription', 'lightcurvePlot', 'sampenPlot', 'fisherPlot', 'msePlot', 'sampenValue', 'sampenCounts', 'shannonValue', 'fisherValue', 'ciValue', 'scaleValues']) {
  assert.ok(element(id).innerHTML || element(id).textContent, `${id} deve ser preenchido na inicialização`);
}
assert.match(element('lightcurvePlot').innerHTML, /<path/);
assert.match(element('msePlot').innerHTML, /<path/);
assert.ok((element('msePlot').innerHTML.match(/<path/g) || []).length >= 1, 'MSE-WPE deve mostrar a curva efetivamente calculada sem perfis interpolados.');
assert.doesNotMatch(element('msePlot').innerHTML, /stroke-dasharray=\"7 5\"/, 'a curva introdutória não deve sugerir perfis interpolados.');
for (const id of ['multibandCurvePlot','sampenBandMeanPlot','sampenClassDistPlot','sampenModPlot','sampenRobustPlot','sampenSensitivityPlot','fisherPopulationPlot','fisherMetricPlot','mseBandScalePlot','ciBandMeanPlot','ciClassDistPlot','ciMetricPlot','ciSampEnPlot','sampenBandHeatmapPlot','fisherBandTrajectoryPlot','bandScaleHeatmapPlot']) {
  assert.ok(element(id).innerHTML, `${id} deve ser calculado na inicialização`);
}
assert.match(element('bandToggleLegend').innerHTML, /data-band-toggle=\"7\"/, 'a galeria deve incluir as oito bandas energéticas.');
assert.ok(element('ciSampEnPlot').innerHTML.length > 500, 'CI × SampEn deve mostrar o gráfico demonstrativo.');
assert.match(element('fisherBandFilter').innerHTML, /Todas as bandas/, 'o plano Fisher-Shannon deve oferecer filtro de banda.');
assert.match(element('sampenSensitivityPlot').innerHTML, /SampEn=/, 'o mapa m×r deve expor valores calculados via tooltips.');
assert.match(element('scaleValues').innerHTML, /τ = 8/);
const initial = element('sampenValue').textContent;
const flareClick = listeners.get('scenario-flares:click');
assert.ok(flareClick && flareClick.length, 'seletor de cenário deve ter callback');
flareClick[0]();
assert.match(element('scenarioStatus').textContent, /BL LAC/);
assert.match(element('multibandSource').value, /BLLac/);
assert.notEqual(element('sampenValue').textContent, initial, 'trocar cenário deve recalcular a SampEn demonstrativa');
const multiClick = listeners.get('scenario-multiscale:click');
assert.ok(multiClick && multiClick.length);
multiClick[0]();
assert.match(element('scenarioStatus').textContent, /AGN/);
assert.match(element('multibandSource').value, /AGN/);
assert.equal(element('scaleValues').innerHTML.match(/class="scale-pill"/g)?.length, 8, 'devem ser apresentadas oito escalas');

// Sensitivity modes and the all-band view must render without replacing invalid estimates with numbers.
const sensitivityModeChange = listeners.get('sensitivityMode:change');
assert.ok(sensitivityModeChange && sensitivityModeChange.length, 'mapa m×r deve permitir trocar modo');
element('sensitivityMode').value = 'difference'; sensitivityModeChange[0]();
assert.match(element('sensitivityLegend').innerHTML, /Diferença em relação ao padrão/);
const sensitivityBandChange = listeners.get('sensitivityBand:change');
assert.ok(sensitivityBandChange && sensitivityBandChange.length, 'mapa m×r deve permitir selecionar bandas');
element('sensitivityBand').value = 'all'; sensitivityBandChange[0]();
assert.equal((element('sensitivityAllBands').innerHTML.match(/class=\"sensitivity-mini-map\"/g) || []).length, 8, 'visão conjunta deve conter oito mapas');
element('sensitivityBand').value = '2'; sensitivityBandChange[0]();
const viewportWidth = Number(process.env.VIEWPORT_WIDTH || 1280);
const siteHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
if (viewportWidth < 600) {
  assert.match(element('multibandCurvePlot').getAttribute('viewBox') || '', /^0 0 420 /, 'curva multibanda deve usar geometria móvel');
  assert.match(element('sampenSensitivityPlot').getAttribute('viewBox') || '', /^0 0 430 /, 'mapa m×r deve usar geometria móvel com as dez tolerâncias previstas');
  if (siteHtml.includes('id="bandScaleHeatmapPlot"')) assert.match(element('bandScaleHeatmapPlot').getAttribute('viewBox') || '', /^0 0 420 /, 'heatmap WPE deve usar geometria móvel');
}


if (siteHtml.includes('id="activeBandSelector"')) {
  const bandChange = listeners.get('activeBandSelector:change');
  assert.ok(bandChange && bandChange.length, 'a V1.3 deve sincronizar a banda em foco');
  element('activeBandSelector').value = '5'; bandChange[0]();
  assert.match(element('scenarioStatus').textContent, /75–100 KEV/, 'a banda selecionada deve atualizar a mesma série demonstrativa');
  assert.equal(element('sensitivityBand').value, '5', 'a sensibilidade deve acompanhar a banda em foco');
  assert.ok(element('fisherBandTrajectoryPlot').innerHTML.includes('BANDA EM FOCO'), 'a trajetória Fisher–Shannon deve destacar a banda ativa');
  const heatmapClick = listeners.get('bandScaleHeatmapPlot:click');
  assert.ok(heatmapClick && heatmapClick.length, 'heatmap banda × escala deve ter interação');
  const fakeScaleCell = { dataset: { bandSelect: '4', scaleSelect: '6' } };
  heatmapClick[0]({ type: 'click', target: { closest: () => fakeScaleCell } });
  assert.equal(element('activeBandSelector').value, '4', 'clicar no heatmap deve focar a banda selecionada');
  assert.equal(element('sensitivityBand').value, '4', 'a banda selecionada deve sincronizar o mapa m×r');
  assert.equal(element('fisherBandFilter').value, '4', 'a banda selecionada deve sincronizar Fisher–Shannon');
  assert.match(element('mseBandScalePlot').innerHTML, /τ em foco = 6/, 'clicar numa célula deve focar a escala temporal no gráfico WPE');
  const sourceHeatClick = listeners.get('sampenBandHeatmapPlot:click');
  assert.ok(sourceHeatClick && sourceHeatClick.length, 'heatmap fonte × banda deve ter interação');
  const fakeSourceCell = { dataset: { sourceSelect: 'FSRQ-S04', bandSelect: '5' } };
  sourceHeatClick[0]({ type: 'click', target: { closest: () => fakeSourceCell } });
  assert.equal(element('multibandSource').value, 'FSRQ-S04', 'célula deve selecionar a fonte correta');
  assert.equal(element('activeBandSelector').value, '5', 'célula deve selecionar a banda correta');
  assert.equal(element('sensitivityBand').value, '5', 'seleção da galeria deve sincronizar SampEn');
  assert.equal(element('fisherBandFilter').value, '5', 'seleção da galeria deve sincronizar Fisher–Shannon');
  const trajectoryKeydown = listeners.get('fisherBandTrajectoryPlot:keydown');
  assert.ok(trajectoryKeydown && trajectoryKeydown.length, 'trajetória Fisher–Shannon deve suportar teclado');
  const fakeTrajectoryPoint = { dataset: { bandSelect: '1' } };
  trajectoryKeydown[0]({ type: 'keydown', key: 'Enter', preventDefault() {}, target: { closest: () => fakeTrajectoryPoint } });
  assert.equal(element('activeBandSelector').value, '1', 'teclado na trajetória deve selecionar a banda');
}

console.log('OK: inicialização, três métodos, galeria multibanda, mapa m×r, sincronização interativa.');
console.log(`SampEn inicial: ${initial}; cenário C: ${element('sampenValue').textContent}; CI cenário C: ${element('ciValue').textContent}.`);
