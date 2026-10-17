#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const js = fs.readFileSync(path.join(root, 'blazarlab.js'), 'utf8');

// Guard the regression that previously cleared chartControlsReady and then created
// a second toolbar/listener set after each resize (fullscreen also emits resize).
assert.doesNotMatch(js, /delete\s+svg\.dataset\.chartControlsReady/, 'resize must not clear the idempotency marker');
const resizeStart = js.indexOf('let resizeTimer=null;');
const resizeEnd = js.indexOf('\n  }\n\n  if (document.readyState', resizeStart);
assert.ok(resizeStart >= 0 && resizeEnd > resizeStart, 'resize handler must be discoverable');
const resizeHandler = js.slice(resizeStart, resizeEnd);
assert.match(resizeHandler, /if\(nextCompact===compactViewport\)return;/, 'regular resize/fullscreen should not redraw charts');
assert.doesNotMatch(resizeHandler, /initializeChartInteractions\(\)/, 'resize must not rebuild toolbars and listeners');
assert.match(js, /svg\.dataset\.chartControlsReady==='true'\)return/, 'chart-control initialization must remain idempotent');

// Exercise the fullscreen controller with a tiny DOM substitute: enter/exit,
// switch between chart targets, and fallback behavior when the API is unavailable.
const marker = '  async function toggleChartFullscreen(target){';
const start = js.indexOf(marker);
assert.ok(start >= 0, 'fullscreen controller must exist');
const open = js.indexOf('{', start);
let depth = 0, end = -1;
for (let i = open; i < js.length; i += 1) {
  if (js[i] === '{') depth += 1;
  if (js[i] === '}') depth -= 1;
  if (depth === 0) { end = i + 1; break; }
}
assert.ok(end > open, 'fullscreen controller should be extractable');
const functionSource = js.slice(start, end).replace(/^  /gm, '');
const makeTarget = (name, doc, options = {}) => {
  const classes = new Set();
  return {
    name,
    classList: {
      add(value) { classes.add(value); },
      remove(value) { classes.delete(value); },
      contains(value) { return classes.has(value); }
    },
    async requestFullscreen() {
      if (options.failRequest) throw new Error('simulated fullscreen denial');
      doc.fullscreenElement = this;
    }
  };
};
const doc = {
  fullscreenElement: null,
  fallbacks: [],
  async exitFullscreen() { this.fullscreenElement = null; },
  querySelectorAll(selector) { return selector === '.is-fullscreen-fallback' ? this.fallbacks.filter(item => item.classList.contains('is-fullscreen-fallback')) : []; }
};
const toggle = new Function('document', `${functionSource}; return toggleChartFullscreen;`)(doc);
(async () => {
  const first = makeTarget('first', doc);
  const second = makeTarget('second', doc);
  await toggle(first);
  assert.equal(doc.fullscreenElement, first, 'first chart should enter native fullscreen');
  await toggle(first);
  assert.equal(doc.fullscreenElement, null, 'clicking the active chart should exit fullscreen');
  await toggle(first);
  await toggle(second);
  assert.equal(doc.fullscreenElement, second, 'switching charts should activate only the requested target');
  assert.equal(first.classList.contains('is-fullscreen-fallback'), false, 'old target must not remain in fallback fullscreen');
  await toggle(second);
  const denied = makeTarget('denied', doc, { failRequest: true });
  await toggle(denied);
  assert.equal(denied.classList.contains('is-fullscreen-fallback'), true, 'denied native fullscreen should use the fallback');
  await toggle(denied);
  assert.equal(denied.classList.contains('is-fullscreen-fallback'), false, 'clicking fallback fullscreen should exit it');
  console.log('OK: regressão de fullscreen, estado idempotente dos controles e fallback simulados.');
})().catch(error => { console.error(error); process.exitCode = 1; });
