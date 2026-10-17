#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'blazarlab.js'), 'utf8');
const version = fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim();
assert.equal(version, '1.3.19');

// Keyboard and navigation semantics.
assert.match(html, /<button[^>]*aria-expanded="false"[^>]*id="navToggle"/);
assert.match(html, /<b class="sr-only">Abrir navegação<\/b>/);
assert.match(js, /label\.textContent = opened \? 'Fechar navegação' : 'Abrir navegação'/);
assert.match(js, /event\.key === 'Escape' && nav\.classList\.contains\('is-open'\)/);
assert.match(js, /closeNavigation\(true\)/);

// Visible focus, touch targets and narrow-screen header behavior.
assert.match(css, /:where\(a,button,input,select,textarea,summary,\[tabindex\]\):focus-visible/);
assert.match(css, /@media\(max-width:480px\)/);
assert.match(css, /grid-template-columns:minmax\(0,1fr\) auto auto/);
assert.match(css, /\.theme-button\{width:44px;height:44px;min-width:44px;min-height:44px\}/);
assert.match(css, /\.hero h1 br\{display:none\}/);
assert.match(css, /prefers-reduced-motion:reduce/);
assert.doesNotMatch(css, /transform:none!important\}\s*\n\s*\/\* Matrices/, 'redução de movimento não deve anular transforms estruturais, como o skip link');
assert.match(css, /\.sensitivity-mini-grid\{width:100%;min-width:0;grid-template-columns:repeat\(10,minmax\(38px,1fr\)\);max-width:100%;overflow-x:auto;/);
assert.match(js, /const LIGHT_CHART_COLORS = \{/);
assert.match(js, /function chartDisplayColor\(color\)/);
assert.match(js, /initThemeSwitcher\(\(\) => \{/);
assert.match(js, /renderActiveDemo\(\);\s*renderClassLegends\(\);/);

// Tables have semantic captions, named scroll regions, and keyboard access.
assert.match(js, /<caption class="sr-only">\$\{escapeXML\(tableCaption\)\}<\/caption>/);
assert.match(js, /role="region" tabindex="0" aria-label="Tabela de dados:/);
assert.match(js, /<th scope="row">/);
assert.match(js, /svg\.setAttribute\('role', interactiveChildren \? 'group' : 'img'\)/);

// Interactive heatmaps reduce tab stops and support arrow-key navigation.
assert.match(js, /data-source-row="\$\{ri\}"/);
assert.match(js, /data-sens-cell-index="\$\{cellIndex\}"/);
assert.match(js, /data-fisher-band-index="\$\{i\}"/);
assert.match(js, /if\(event\.target!==svg\)return/);
assert.match(js, /if\(event\.key==='ArrowLeft'\)c=Math\.max\(0,c-1\)/);
assert.match(js, /if\(event\.key==='ArrowDown'\)band=Math\.min\(ENERGY_BANDS\.length-1,band\+1\)/);
assert.match(js, /if\(event\.key==='ArrowDown'\)r=Math\.min\(rows-1,r\+1\)/);
assert.match(js, /motionPreference\.addEventListener\('change', syncMotionPreference\)/);

console.log('OK: acessibilidade estrutural, navegação por teclado, tabelas semânticas e estilos responsivos BlazarLab 1.3.19.');
