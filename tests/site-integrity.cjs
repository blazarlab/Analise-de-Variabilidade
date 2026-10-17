#!/usr/bin/env node
'use strict';
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'blazarlab.js'),'utf8');
const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
const version=fs.readFileSync(path.join(root,'VERSION'),'utf8').trim();
assert.match(html,/A variabilidade conta <br\/> uma história/,'o título deve manter espaços quando a quebra é ocultada no celular');
const required=['sampenPlot','fisherPlot','msePlot','sampenBandMeanPlot','sampenClassDistPlot','sampenModPlot','sampenRobustPlot','sampenSensitivityPlot','fisherPopulationPlot','mseBandScalePlot','ciSampEnPlot'];
const ids=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
const duplicateIds=ids.filter((id,index)=>ids.indexOf(id)!==index);
assert.deepEqual([...new Set(duplicateIds)],[],'IDs HTML devem ser únicos');
const idSet=new Set(ids);
for(const m of html.matchAll(/\bhref=["']#([^"']+)["']/g)) assert.ok(idSet.has(m[1]),`âncora interna quebrada: #${m[1]}`);
for(const m of html.matchAll(/data-focus-chart=["']([^"']+)["']/g)) assert.ok(idSet.has(m[1]),`atalho de gráfico quebrado: ${m[1]}`);
for(const tag of html.matchAll(/<svg\b[^>]*>/gi)) assert.ok([...tag[0].matchAll(/\bviewbox\s*=/gi)].length<=1,'um SVG não deve repetir viewBox em grafias diferentes');
for(const id of required) assert.match(html,new RegExp('id=["\\\']'+id+'["\\\']'),`faltou painel ${id}`);
assert.ok(fs.existsSync(path.join(root,'assets','social-preview.svg')),'prévia social local deve existir');
assert.doesNotMatch(html,/documentos enviados|resumos enviados para esta construção/i,'texto interno não deve vazar para público');
assert.match(html,/data-theme-choice="light"/,'controle do tema claro deve existir');
assert.match(html,/data-theme-choice="dark"/,'controle do tema escuro deve existir');
assert.match(html,/aria-label="Ativar tema claro"/,'tema claro deve ter nome acessível');
assert.match(html,/aria-label="Ativar tema escuro"/,'tema escuro deve ter nome acessível');
assert.doesNotMatch(html,/CITAÇÃO DO PROJETO|Como citar o BlazarLab|URL_DO_REPOSITORIO_A_CONFIRMAR|Substitua o endereço placeholder/i,'a citação provisória deve ser removida do site');
assert.doesNotMatch(html,/abstract-card-joint|TRABALHO CONJUNTO|Entropy-based complexity of blazar radio variability/i,'o cartão de manuscrito conjunto deve ser removido');
assert.match(js,/function initThemeSwitcher/,'alternância de tema deve ser inicializada');
assert.match(js,/blazarlab-theme/,'preferência de tema deve ser persistida');
assert.match(css,/html\[data-theme=\"light\"\]/,'estilos do tema claro devem existir');
assert.match(js,/function initializeChartInteractions/,'controlador de interação deve existir');

assert.match(js,/const isLightTheme = document\.documentElement\.dataset\.theme === 'light'/,'exportação PNG deve detectar o tema ativo no clique');
assert.match(js,/background: '#FFFFFF'/,'exportação PNG clara deve usar fundo claro');
assert.match(js,/background: '#101A2B'/,'exportação PNG escura deve manter fundo escuro');
assert.match(js,/context\.fillStyle = palette\.background/,'o canvas deve usar o fundo correspondente ao tema');
assert.match(js,/const lightTextColors = new Map/,'exportação clara deve adaptar texto explícito que era branco');
assert.match(js,/const updatedStyle = inlineStyle\.replace/,'exportação clara deve tratar cores explícitas de estilos inline');
assert.match(js,/const svgText = new XMLSerializer\(\)\.serializeToString\(clone\)/,'a exportação deve serializar a cópia do SVG');
assert.match(js,/\.plot-label \{ font-family: Arial, sans-serif; font-size: 13px; fill: \${palette\.label}; \}/,'rótulos SVG devem acompanhar a paleta de exportação');

assert.match(js,/function computeSensitivityCells/,'cálculo da sensibilidade m×r deve existir');
assert.match(css,/@media\s*\(max-width:\s*599px\)/,'CSS móvel deve existir');
assert.match(css,/\.chart-frame-scrollwide/,'matrizes extensas devem ter contêiner rolável');
assert.match(css,/\.method-question\{font:700 19px\/1\.35 var\(--serif\);color:#f0f3ff/,'hierarquia tipográfica das perguntas científicas deve estar preservada');
if(version.startsWith('1.5.') || version.startsWith('1.4.') || version.startsWith('1.3.')){
  assert.equal(version,'1.3.19','a versão deve ser identificada corretamente');
  for(const id of ['activeBandSelector','sampenBandHeatmapPlot','fisherBandTrajectoryPlot','bandScaleHeatmapPlot']) assert.match(html,new RegExp('id=["\\\']'+id+'["\\\']'),`funcionalidade V1.3 ausente: ${id}`);
  assert.match(js,/function drawBandScaleHeatmap/);assert.match(js,/function drawFisherBandTrajectory/);assert.match(js,/function drawSampenSourceBandHeatmap/);
  assert.doesNotMatch(html,/Baixar CSV|Exportar dados demonstrativos/i,'a exportação CSV não deve aparecer no site público');
  assert.match(html,/class="relation-cards"/,'as associações devem aparecer em cartões independentes');
  assert.equal((html.match(/class="relation-stat-card /g)||[]).length,3,'devem ser apresentadas três associações em cartões equilibrados');
  assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/,'seletor de métodos deve distribuir as três opções');
  assert.match(js,/async function toggleChartFullscreen/,'tela cheia deve usar controlador único');
  assert.doesNotMatch(js,/delete svg\.dataset\.chartControlsReady/,'resize não deve forçar reinicialização de controles');
  const resizeStart=js.indexOf('let resizeTimer=null;');
  const resizeEnd=js.indexOf('\n  }\n\n  if (document.readyState',resizeStart);
  assert.ok(resizeStart>=0&&resizeEnd>resizeStart,'handler de resize deve existir');
  assert.doesNotMatch(js.slice(resizeStart,resizeEnd),/initializeChartInteractions\(\)/,'resize não deve recriar barras e listeners');
  assert.ok(fs.existsSync(path.join(root,'tests','fullscreen-regression.cjs')),'teste de regressão de tela cheia deve ser distribuído com o site');
}else{
  assert.equal(version,'1.2.5');
  assert.doesNotMatch(html,/id=["\\\']activeBandSelector["\\\']/,'a seleção sincronizada fica para V1.3');
}
console.log(`OK: integridade estática BlazarLab ${version}; HTML, referências de interface, CSS móvel e funções científicas essenciais.`);
