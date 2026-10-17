'use strict';

(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const EMBEDDING_SAMPEN = 2;
  const WPE_DIMENSION = 4;
  const SCALES = 8;
  const scenarioInfo = {
    smooth: {
      key: 'smooth', letter: 'A', title: 'Variação suave', status: 'CENÁRIO A · VARIAÇÃO SUAVE',
      description: 'Uma oscilação gradual com ruído moderado — um exemplo didático de variação relativamente suave.',
      color: '#9697ff', css: 'purple'
    },
    flares: {
      key: 'flares', letter: 'B', title: 'Surtos localizados', status: 'CENÁRIO B · SURTOS LOCALIZADOS',
      description: 'Uma série com excursões concentradas sobre um fundo mais brando — um exemplo sintético de picos de amplitude.',
      color: '#f4bd79', css: 'amber'
    },
    multiscale: {
      key: 'multiscale', letter: 'C', title: 'Estrutura multiescala', status: 'CENÁRIO C · ESTRUTURA MULTIESCALA',
      description: 'Oscilações lentas e rápidas se sobrepõem, acompanhadas por ruído determinístico — uma demonstração de ritmos temporais combinados.',
      color: '#61dcc7', css: 'teal'
    }
  };

  function seededNoise(seed) {
    let state = seed >>> 0;
    return () => {
      state = (1664525 * state + 1013904223) >>> 0;
      return (state / 4294967296) * 2 - 1;
    };
  }

  function mean(values) { return values.reduce((a, b) => a + b, 0) / values.length; }
  function standardDeviation(values) {
    if (values.length < 2) return 0;
    const m = mean(values);
    return Math.sqrt(values.reduce((sum, value) => sum + (value - m) ** 2, 0) / values.length);
  }
  function format(value, digits = 3) {
    if (!Number.isFinite(value)) return '—';
    return value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }
  function formatInteger(value) { return Math.round(value).toLocaleString('pt-BR'); }
  const LIGHT_CHART_COLORS = {
    '#9697ff':'#5B21B6', '#b48cf2':'#6D28D9', '#d58ac7':'#9D174D',
    '#f4bd79':'#92400E', '#d9dc82':'#68720A', '#61dcc7':'#047857',
    '#61b9df':'#0369A1', '#8399ff':'#3730A3', '#7c83ff':'#5B21B6',
    '#53d6bf':'#047857', '#f3b66e':'#92400E', '#bca7ff':'#6D28D9',
    '#aab8d2':'#475569', '#e8efff':'#334155', '#eaf2ff':'#334155'
  };
  function chartDisplayColor(color) {
    const normalized = String(color || '').toLowerCase();
    return document.documentElement.dataset.theme === 'light' ? (LIGHT_CHART_COLORS[normalized] || color) : color;
  }
  function chartForegroundColor() {
    return document.documentElement.dataset.theme === 'light' ? '#0F172A' : '#EDF2FF';
  }
  function escapeXML(value) {
    return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
  }
  const chartTableData = new Map();
  function isCompactViewport(target) {
    if (typeof window === 'undefined') return false;
    const svg = typeof target === 'string' ? document.getElementById(target) : target;
    const frame = svg?.closest?.('.chart-frame');
    const measuredWidth = Number(frame?.clientWidth || svg?.parentElement?.clientWidth || window.innerWidth || 1280);
    return measuredWidth < 900;
  }
  function plotGeometry(svgId, width, height, margin, options = {}) {
    const compact = isCompactViewport(svgId);
    let geometry = compact ? {
      width: 420,
      height: Math.max(330, Math.min(390, Math.round(height * 1.12))),
      margin: { top: 25, right: 32, bottom: 78, left: options.left || 74 }
    } : { width, height, margin };
    if (compact && svgId === 'sampenPlot') {
      geometry = { width: 420, height: 430, margin: { top: 58, right: 28, bottom: 43, left: options.left || 62 } };
    } else if (compact && svgId === 'sampenSensitivityPlot') {
      // Keep all ten tolerance columns visible on phones instead of forcing a
      // horizontal crop that hides the right-hand half of the heatmap.
      geometry = { width: 430, height: 350, margin: { top: 45, right: 8, bottom: 42, left: options.left || 62 } };
    }
    const svg = document.getElementById(svgId);
    if (svg) {
      svg.dataset.renderViewBox = `0 0 ${geometry.width} ${geometry.height}`;
      svg.dataset.geometryMode = String(compact);
      svg.classList.toggle('mobile-plot-svg', compact);
      svg.classList.toggle('wide-data-svg', Boolean(options.wide));
    }
    return geometry;
  }
  function setChartTableData(id, headers, rows, caption = 'Valores da demonstração') {
    const previous = chartTableData.get(id);
    chartTableData.set(id, { headers, rows, caption, revision: (previous?.revision || 0) + 1 });
    renderChartTable(id);
  }
  function chartTitleFor(svg) {
    const card = svg?.closest?.('.multiband-chart-card,.demo-panel,.demo-primary-chart,.multiband-source-panel,article,section');
    return card?.querySelector?.('.chart-head h3, h3')?.textContent?.trim() || svg?.getAttribute?.('aria-label') || 'gráfico científico';
  }
  function renderChartTable(id) {
    const holder = document.getElementById(`${id}-table`);
    const data = chartTableData.get(id);
    if (!holder || !data) return;
    const disclosure = holder.closest?.('details');
    // Não criar centenas de elementos de tabela antes de o usuário pedir os dados.
    if (disclosure && !disclosure.open) return;
    if (holder.dataset?.renderedRevision === String(data.revision || 0)) return;
    const title = holder.chartTitle || 'gráfico científico';
    const tableCaption = `${title}. ${data.caption}${data.rows.length > 2000 ? ` Mostrando 2.000 de ${formatInteger(data.rows.length)} linhas.` : ''}`;
    const head = `<thead><tr>${data.headers.map(h => `<th scope="col">${escapeXML(h)}</th>`).join('')}</tr></thead>`;
    const body = `<tbody>${data.rows.slice(0, 2000).map(row => `<tr>${row.map((value, index) => index === 0 ? `<th scope="row">${escapeXML(value == null ? '—' : value)}</th>` : `<td>${escapeXML(value == null ? '—' : value)}</td>`).join('')}</tr>`).join('')}</tbody>`;
    holder.innerHTML = `<p class="table-caption">${escapeXML(data.caption)}${data.rows.length > 2000 ? ` · mostrando 2.000 de ${formatInteger(data.rows.length)} linhas` : ''}</p><div class="accessible-table-scroll" role="region" tabindex="0" aria-label="Tabela de dados: ${escapeXML(title)}"><table><caption class="sr-only">${escapeXML(tableCaption)}</caption>${head}${body}</table></div>`;
    if (holder.dataset) holder.dataset.renderedRevision = String(data.revision || 0);
  }
  function ensureChartTable(svg) {
    if (!svg || svg.dataset.chartTableReady === 'true') return;
    const frame = svg.closest?.('.chart-frame');
    if (!frame) return;
    const title = chartTitleFor(svg);
    const interactiveChildren = svg.querySelector?.('[role="button"], [tabindex="0"]');
    svg.setAttribute('role', interactiveChildren ? 'group' : 'img');
    if (!svg.getAttribute('aria-label')) svg.setAttribute('aria-label', title);
    const description = frame.parentElement?.querySelector?.('.chart-explanation, .chart-intro');
    if (description) {
      if (!description.id) description.id = `${svg.id}-description`;
      const describedBy = new Set((svg.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
      describedBy.add(description.id);
      svg.setAttribute('aria-describedby', [...describedBy].join(' '));
    }
    const details = document.createElement('details');
    details.className = 'chart-data-details';
    const summary = document.createElement('summary'); summary.textContent = 'Consultar os dados em tabela';
    summary.setAttribute('aria-controls', `${svg.id}-table`);
    details.addEventListener?.('toggle', () => { if (details.open) renderChartTable(svg.id); });
    details.appendChild(summary);
    const holder = document.createElement('div'); holder.id = `${svg.id}-table`; holder.className = 'chart-data-table'; holder.chartTitle = title; details.appendChild(holder);
    frame.insertAdjacentElement('afterend', details);
    svg.dataset.chartTableReady = 'true';
    if (!chartTableData.has(svg.id)) {
      const titles = Array.from(svg.querySelectorAll('circle,rect,path')).map((el) => el.querySelector('title')?.textContent?.trim()).filter(Boolean);
      const labels = Array.from(svg.querySelectorAll('text.plot-label')).map(el => el.textContent.trim()).filter(Boolean);
      const rows = titles.length ? titles.map((t, i) => [i + 1, t]) : labels.map((t, i) => [i + 1, t]);
      chartTableData.set(svg.id, { headers: ['Item', 'Descrição'], rows, caption: 'Descrições dos elementos apresentados no gráfico; a tabela complementa a leitura visual.', revision: 1 });
    }
    renderChartTable(svg.id);
  }
  function setSvg(id, content) {
    const svg = document.getElementById(id);
    if (!svg) return;
    if (svg.dataset?.pendingPopulationMetrics === 'true') {
      delete svg.dataset.pendingPopulationMetrics;
      svg.removeAttribute?.('aria-busy');
    }
    svg.innerHTML = content;
    const renderBox = svg.dataset?.renderViewBox;
    if (renderBox) {
      svg.setAttribute('viewBox', renderBox);
      svg.dataset.baseViewBox = renderBox;
      if (svg.dataset.chartControlsReady === 'true') {
        const armed = svg.dataset.zoomArmed === 'true';
        svg.classList.toggle('is-armed', armed);
        const toolbarButton = svg.closest?.('.chart-frame')?.parentElement?.querySelector?.('.chart-tool-activate');
        if (toolbarButton) { toolbarButton.setAttribute('aria-pressed', String(armed)); toolbarButton.textContent = armed ? 'Zoom ativo' : 'Ativar zoom'; }
      }
    }
    svg.classList.toggle('mobile-plot-svg', isCompactViewport(svg));
    renderChartTable(id);
  }
  function plotFrame(width, height, margin, xTicks, yTicks, xLabel, yLabel, xScale, yScale) {
    const parts = [];
    xTicks.forEach(tick => {
      const x = xScale(tick.value);
      parts.push(`<line class="plot-grid" x1="${x}" y1="${margin.top}" x2="${x}" y2="${height - margin.bottom}"/>`);
      const dense = xTicks.length >= 7 ? ' plot-label-dense' : '';
      parts.push(`<text class="plot-label${dense}" x="${x}" y="${height - margin.bottom + 18}" text-anchor="middle">${escapeXML(tick.label)}</text>`);
    });
    yTicks.forEach(tick => {
      const y = yScale(tick.value);
      parts.push(`<line class="plot-grid" x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}"/>`);
      parts.push(`<text class="plot-label" x="${margin.left - 9}" y="${y + 3.5}" text-anchor="end">${escapeXML(tick.label)}</text>`);
    });
    parts.push(`<line class="plot-axis" x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}"/>`);
    parts.push(`<line class="plot-axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}"/>`);
    parts.push(`<text class="plot-axis-title" x="${(margin.left + width - margin.right) / 2}" y="${height - 8}" text-anchor="middle">${escapeXML(xLabel)}</text>`);
    parts.push(`<text class="plot-axis-title" transform="translate(13 ${(height - margin.bottom + margin.top) / 2}) rotate(-90)" text-anchor="middle">${escapeXML(yLabel)}</text>`);
    return parts.join('');
  }

  function makeLinePath(values, xScale, yScale, startIndex = 0, endIndex = values.length - 1) {
    let path = '';
    for (let i = startIndex; i <= endIndex; i += 1) {
      const command = i === startIndex ? 'M' : 'L';
      path += `${command}${xScale(i).toFixed(2)},${yScale(values[i]).toFixed(2)} `;
    }
    return path.trim();
  }

  function calculateSampEn(series, m = EMBEDDING_SAMPEN, rFactor = 0.2) {
    const n = series.length;
    const sigma = standardDeviation(series);
    const tolerance = rFactor * sigma;
    const templateCount = n - m;
    if (templateCount < 2 || !Number.isFinite(tolerance) || tolerance <= 0) {
      return { value: null, A: 0, B: 0, sigma, tolerance, templateCount, exampleB: null, exampleA: null,
        status: 'A série não tem variação suficiente.' };
    }
    let B = 0, A = 0, exampleB = null, exampleA = null;
    for (let i = 0; i < templateCount; i += 1) {
      for (let j = i + 1; j < templateCount; j += 1) {
        let matchesM = true;
        for (let k = 0; k < m; k += 1) {
          if (Math.abs(series[i + k] - series[j + k]) > tolerance) { matchesM = false; break; }
        }
        if (!matchesM) continue;
        B += 1;
        if (!exampleB) exampleB = { i, j };
        if (Math.abs(series[i + m] - series[j + m]) <= tolerance) {
          A += 1;
          if (!exampleA) exampleA = { i, j };
        }
      }
    }
    const value = (A > 0 && B > 0) ? -Math.log(A / B) : null;
    return { value, A, B, sigma, tolerance, templateCount, exampleB, exampleA,
      status: value === null ? 'Não há pares de extensão suficiente para estimar a SampEn com estes parâmetros.' : 'Estimativa sintética calculada.' };
  }

  function fisherShannonKDE(series) {
    const n = series.length;
    const sd = standardDeviation(series);
    if (!n || !Number.isFinite(sd) || sd <= 0) return { H: null, fisher: null };
    const sorted = [...series].sort((a, b) => a - b);
    const q1 = sorted[Math.floor((n - 1) * 0.25)];
    const q3 = sorted[Math.floor((n - 1) * 0.75)];
    const iqr = q3 - q1;
    const robustSd = iqr > 0 ? Math.min(sd, iqr / 1.349) : sd;
    const bandwidth = Math.max(1e-4, 0.9 * robustSd * Math.pow(n, -0.2));
    const minX = sorted[0] - 3.5 * bandwidth;
    const maxX = sorted[n - 1] + 3.5 * bandwidth;
    const count = 241;
    const step = (maxX - minX) / (count - 1);
    const density = new Array(count).fill(0);
    const derivative = new Array(count).fill(0);
    const invSqrt2Pi = 1 / Math.sqrt(2 * Math.PI);
    for (let i = 0; i < count; i += 1) {
      const x = minX + i * step;
      let f = 0;
      let df = 0;
      for (const sample of series) {
        const z = (x - sample) / bandwidth;
        const kernel = invSqrt2Pi * Math.exp(-0.5 * z * z);
        f += kernel / bandwidth;
        df += -z * kernel / (bandwidth * bandwidth);
      }
      density[i] = f / n;
      derivative[i] = df / n;
    }
    // Normalize the numerical density, and its derivative, to account for finite grid edges.
    let integral = 0;
    for (let i = 0; i < count - 1; i += 1) integral += (density[i] + density[i + 1]) * step / 2;
    if (!Number.isFinite(integral) || integral <= 0) return { H: null, fisher: null };
    for (let i = 0; i < count; i += 1) { density[i] /= integral; derivative[i] /= integral; }
    let H = 0;
    let fisher = 0;
    for (let i = 0; i < count - 1; i += 1) {
      const f0 = Math.max(density[i], 1e-14);
      const f1 = Math.max(density[i + 1], 1e-14);
      const d0 = derivative[i];
      const d1 = derivative[i + 1];
      const h0 = -f0 * Math.log(f0);
      const h1 = -f1 * Math.log(f1);
      const j0 = d0 * d0 / f0;
      const j1 = d1 * d1 / f1;
      H += (h0 + h1) * step / 2;
      fisher += (j0 + j1) * step / 2;
    }
    return { H, fisher, density, minX, maxX, bandwidth };
  }

  function ordinalPattern(values) {
    return values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value || a.index - b.index).map(point => point.index).join('');
  }

  function weightedPermutationEntropy(series, dimension = WPE_DIMENSION, delay = 1) {
    const patternWeights = new Map();
    const totalLength = series.length - (dimension - 1) * delay;
    if (totalLength <= 0) return { value: null, count: 0 };
    let totalWeight = 0;
    for (let i = 0; i < totalLength; i += 1) {
      const vector = [];
      for (let k = 0; k < dimension; k += 1) vector.push(series[i + k * delay]);
      const localMean = mean(vector);
      const weight = vector.reduce((sum, value) => sum + (value - localMean) ** 2, 0) / dimension;
      const key = ordinalPattern(vector);
      patternWeights.set(key, (patternWeights.get(key) || 0) + weight);
      totalWeight += weight;
    }
    if (totalWeight <= Number.EPSILON) return { value: 0, count: totalLength };
    let entropy = 0;
    for (const weight of patternWeights.values()) {
      const p = weight / totalWeight;
      if (p > 0) entropy -= p * Math.log(p);
    }
    return { value: entropy, count: totalLength, distinctPatterns: patternWeights.size };
  }

  function coarseGrain(series, scale) {
    const count = Math.floor(series.length / scale);
    const result = [];
    for (let j = 0; j < count; j += 1) {
      let sum = 0;
      for (let k = 0; k < scale; k += 1) sum += series[j * scale + k];
      result.push(sum / scale);
    }
    return result;
  }

  function calculateMSE(series) {
    const points = [];
    let CI = 0;
    for (let scale = 1; scale <= SCALES; scale += 1) {
      const coarse = coarseGrain(series, scale);
      const wpe = weightedPermutationEntropy(coarse, WPE_DIMENSION, 1);
      const value = Number.isFinite(wpe.value) ? wpe.value : 0;
      points.push({ scale, value, n: coarse.length, patterns: wpe.distinctPatterns || 0 });
      CI += value;
    }
    return { points, CI, maxPerScale: Math.log(factorial(WPE_DIMENSION)), maxCI: SCALES * Math.log(factorial(WPE_DIMENSION)) };
  }
  function factorial(n) { let result = 1; for (let i = 2; i <= n; i += 1) result *= i; return result; }


  function drawLightcurve(item) {
    const g = plotGeometry('lightcurvePlot', 900, 290, { top: 18, right: 22, bottom: 42, left: 52 });
    const { width, height, margin } = g;
    const values = item.series;
    let min = Math.min(...values), max = Math.max(...values);
    if (Math.abs(max - min) < 1e-9) { min -= 1; max += 1; }
    const pad = (max - min) * 0.1;
    min -= pad; max += pad;
    const x = i => margin.left + i / (values.length - 1) * (width - margin.left - margin.right);
    const y = value => height - margin.bottom - (value - min) / (max - min) * (height - margin.top - margin.bottom);
    const yTicks = Array.from({ length: 5 }, (_, i) => { const value = min + (max - min) * i / 4; return { value, label: format(value, 2) }; });
    const ticks = [0, Math.round((values.length - 1) * .25), Math.round((values.length - 1) * .5), Math.round((values.length - 1) * .75), values.length - 1];
    const xTicks = [...new Set(ticks)].map(value => ({ value, label: String(value) }));
    let content = plotFrame(width, height, margin, xTicks, yTicks, 'Índice temporal sintético', 'Fluxo relativo', x, y);
    content += `<path class="plot-line plot-line-${item.css || 'purple'}" style="stroke:${chartDisplayColor(item.color || '#9697ff')}" d="${makeLinePath(values, x, y)}"/>`;
    const stride = Math.max(1, Math.floor(values.length / 18));
    for (let i = 0; i < values.length; i += stride) content += `<circle class="plot-point" cx="${x(i)}" cy="${y(values[i])}" r="2.7" fill="${chartDisplayColor(item.color || '#9697ff')}"><title>Índice ${i}; fluxo relativo ${format(values[i], 4)}</title></circle>`;
    content += `<text class="plot-label" x="${width - margin.right}" y="${margin.top + 2}" text-anchor="end">${escapeXML(item.sourceName || `SÉRIE SINTÉTICA ${item.letter || ''}`)}</text>`;
    setChartTableData('lightcurvePlot', ['Índice temporal', 'Fluxo relativo'], values.map((v, i) => [i, format(v, 6)]), 'Série sintética efetivamente usada nas três lentes.');
    setSvg('lightcurvePlot', content);
    const range = document.getElementById('lightcurveRange');
    if (range) range.textContent = `${formatInteger(values.length)} pontos · faixa ${format(min + pad, 2)} a ${format(max - pad, 2)}`;
  }
  function drawSampEn(item) {
    const result = item.sampen, values = item.series || [];
    const g = plotGeometry('sampenPlot', 900, 370, { top: 38, right: 24, bottom: 28, left: 58 }, { left: 62 });
    const { width, height, margin } = g;
    const content = [];
    const topY = margin.top, curveBottom = Math.min(188, height * 0.49), curveH = curveBottom - topY;
    const minV = Math.min(...values), maxV = Math.max(...values), pad = Math.max((maxV-minV)*.12, 1e-3);
    const lo = minV-pad, hi = maxV+pad;
    const x = i => margin.left + i/Math.max(1,values.length-1)*(width-margin.left-margin.right);
    const y = v => curveBottom - (v-lo)/(hi-lo||1)*curveH;
    [0,.5,1].forEach(t=>{
      const yy=topY+t*curveH;
      content.push(`<line class="plot-grid" x1="${margin.left}" y1="${yy}" x2="${width-margin.right}" y2="${yy}"/>`);
    });
    const seriesPath=values.map((v,i)=>`${i?'L':'M'}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(' ');
    content.push(`<path d="${seriesPath}" fill="none" stroke="#aab8d2" stroke-width="1.35" opacity=".84"/>`);
    const exampleA=result.exampleA, exampleB=result.exampleB;
    const addPair=(pair,length,color,label,yLabel)=>{
      if(!pair)return;
      const displayColor=chartDisplayColor(color);
      for(const index of [pair.i,pair.j]){
        const end=Math.min(values.length-1,index+length-1);
        const segment=values.slice(index,end+1).map((v,k)=>`${k?'L':'M'}${x(index+k).toFixed(2)},${y(v).toFixed(2)}`).join(' ');
        const x0=x(index),x1=x(end),rectY=topY+4;
        content.push(`<rect x="${x0-2}" y="${rectY}" width="${Math.max(4,x1-x0+4)}" height="${curveH-8}" rx="3" fill="${displayColor}" opacity=".12"/>`);
        content.push(`<path d="${segment}" fill="none" stroke="${displayColor}" stroke-width="3.2" stroke-linecap="round"><title>${label}: trecho ${index} até ${end}</title></path>`);
        content.push(`<circle cx="${x(index)}" cy="${y(values[index])}" r="4.2" fill="${displayColor}" stroke="${chartForegroundColor()}" stroke-width="1.1"><title>${label}, início ${index}</title></circle>`);
      }
      const mid=(x(pair.i)+x(pair.j))/2;
      const labelPadding = compactLens ? 88 : 40;
      content.push(`<path d="M${x(pair.i)} ${yLabel+3} V${topY+1} M${x(pair.j)} ${yLabel+3} V${topY+1}" stroke="${displayColor}" stroke-dasharray="3 3" opacity=".82"/>`);
      content.push(`<text class="plot-label" x="${Math.max(margin.left+labelPadding,Math.min(width-margin.right-labelPadding,mid))}" y="${yLabel}" text-anchor="middle" style="fill:${displayColor};font-weight:750">${label}</text>`);
    };
    const compactLens = isCompactViewport('sampenPlot');
    addPair(exampleB, Math.max(1,item.sampenM||EMBEDDING_SAMPEN), '#bca7ff', compactLens ? `B · coincide em m=${item.sampenM||EMBEDDING_SAMPEN}` : `B: padrões que coincidem em m=${item.sampenM||EMBEDDING_SAMPEN}`, compactLens ? topY-35 : topY-12);
    addPair(exampleA, Math.max(2,(item.sampenM||EMBEDDING_SAMPEN)+1), '#61dcc7', compactLens ? `A · coincide em m+1` : `A: pares que também coincidem em m+1`, compactLens ? topY-14 : topY+13);
    const axisY=curveBottom+8;
    content.push(`<line class="plot-axis" x1="${margin.left}" y1="${axisY}" x2="${width-margin.right}" y2="${axisY}"/>`);
    [0,Math.round((values.length-1)*.25),Math.round((values.length-1)*.5),Math.round((values.length-1)*.75),values.length-1].forEach(i=>content.push(`<text class="plot-label plot-label-dense" x="${x(i)}" y="${axisY+14}" text-anchor="middle">${i}</text>`));
    content.push(`<text class="plot-axis-title" x="${(width+margin.left-margin.right)/2}" y="${axisY+31}" text-anchor="middle">${compactLens ? 'Índice temporal · trechos exemplificados' : 'Índice temporal · trechos coloridos mostram exemplos reais da série sintética'}</text>`);
    const barsTop=axisY+48, barsH=Math.max(35,height-barsTop-55), barMax=Math.max(1,result.B), barWidth=(width-margin.left-margin.right)*.28;
    const barXs=[margin.left+(width-margin.left-margin.right)*.08,margin.left+(width-margin.left-margin.right)*.58];
    const counts=[result.B,result.A], labels=compactLens?[`B · pares em m`,`A · pares em m+1`]:[`B · pares semelhantes em m`, `A · pares semelhantes em m+1`], colors=['#bca7ff','#61dcc7'];
    counts.forEach((value,i)=>{
      const frac=barMax?value/barMax:0,top=barsTop+barsH*(1-frac);
      content.push(`<rect x="${barXs[i]}" y="${top}" width="${barWidth}" height="${Math.max(1,barsH*frac)}" rx="4" fill="${chartDisplayColor(colors[i])}" opacity=".88"><title>${labels[i]}: ${formatInteger(value)}</title></rect>`);
      content.push(`<text class="plot-label" x="${barXs[i]+barWidth/2}" y="${barsTop-5}" text-anchor="middle">${labels[i]}</text>`);
      content.push(`<text class="plot-tooltip" x="${barXs[i]+barWidth/2}" y="${Math.max(barsTop+15,top-5)}" text-anchor="middle">${formatInteger(value)}</text>`);
    });
    const formula = result.value === null ? 'SampEn indefinida: A = 0 ou B = 0' : `SampEn = −ln(A/B) = −ln(${formatInteger(result.A)}/${formatInteger(result.B)}) = ${format(result.value, 3)}`;
    content.push(`<text class="plot-axis-title" x="${width/2}" y="${height-8}" text-anchor="middle">${escapeXML(formula)}</text>`);
    setChartTableData('sampenPlot', ['Contagem','Pares','Interpretação'], [
      ['B',formatInteger(result.B),'Pares de padrões semelhantes com comprimento m'],
      ['A',formatInteger(result.A),'Pares de B que também coincidem em m+1'],
      ['SampEn',result.value===null?'indefinida':format(result.value,6),formula],
      ['Exemplo B',result.exampleB?`${result.exampleB.i}; ${result.exampleB.j}`:'não disponível','Índices iniciais de um par coincidente em m'],
      ['Exemplo A',result.exampleA?`${result.exampleA.i}; ${result.exampleA.j}`:'não disponível','Índices iniciais de um par coincidente em m+1']
    ], 'Contagens e pares calculados diretamente na série sintética ativa; os trechos realçados são exemplos ilustrativos, não todos os pares contados.');
    setSvg('sampenPlot', content.join(''));
    const val=document.getElementById('sampenValue'); if (val) val.textContent=result.value===null?'indefinida':format(result.value,3);
    const countsEl=document.getElementById('sampenCounts'); if(countsEl) countsEl.textContent=`${formatInteger(result.B)} / ${formatInteger(result.A)}`;
    const explanation=document.getElementById('sampenExplanation');
    if(explanation) explanation.textContent=result.value===null
      ? `${result.status} A SampEn não é definida quando A ou B é zero; nenhum valor artificial é usado.`
      : `Na série sintética ativa, m=${item.sampenM||EMBEDDING_SAMPEN} e r=${(item.rFactor??.2).toLocaleString('pt-BR',{maximumFractionDigits:2})}σ. B conta pares semelhantes em m; A conta os pares que também coincidem em m+1. O valor é calculado por −ln(A/B).`;
  }

  function setPopulationPending(svgId, message = 'Calculando indicadores populacionais…') {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    setSvg(svgId, `<text class="plot-label" x="50%" y="50%" text-anchor="middle">${escapeXML(message)}</text>`);
    svg.dataset.pendingPopulationMetrics = 'true';
    svg.setAttribute('aria-busy', 'true');
  }

  function drawFisherPlane(currentRow) {
    if (!populationMetricsFinished) { setPopulationPending('fisherPlot'); return; }
    const band = activeBandIndex();
    const rows = MULTIBAND.rows.filter(row => row.bandIndex === band);
    const selected = currentRow || activeBandRow();
    drawScatter('fisherPlot', rows,
      row => row.fisherShannon?.H,
      row => row.fisherShannon?.fisher,
      'Entropia de Shannon H (nats)', 'Informação de Fisher I_F (escala log)',
      { logY: true, width: 600, height: 290, margin: { top: 20, right: 16, bottom: 72, left: 76 }, xDigits: 2, yDigits: 2, selectedPoint: selected, selectedKey: `${selected?.source}|${selected?.bandIndex}`, annotateSelected: true });
    const shannon=document.getElementById('shannonValue'); if (shannon) shannon.textContent = format(selected?.fisherShannon?.H, 3);
    const fisher=document.getElementById('fisherValue'); if (fisher) fisher.textContent = format(selected?.fisherShannon?.fisher, 3);
    const expl=document.querySelector('#fisherPlot')?.closest('.demo-panel')?.querySelector('.chart-explanation');
    if (expl && selected) expl.textContent = `${selected.source} · ${selected.band}. O ponto destacado é a série em foco; os demais pontos comparam as fontes sintéticas na mesma banda. H e I_F são estimativas KDE didáticas.`;
  }
  function drawMSE(item) {
    const points = item.mse.points;
    const g = plotGeometry('msePlot', 900, 270, { top: 19, right: 24, bottom: 44, left: 56 });
    const { width, height, margin } = g;
    const maxValue = Math.max(...points.map(p => p.value), item.mse.maxPerScale * 1.05, 1);
    const x = value => margin.left + (value - 1) / (SCALES - 1) * (width - margin.left - margin.right);
    const y = value => height - margin.bottom - value / maxValue * (height - margin.top - margin.bottom);
    const xTicks = points.map(p => ({ value: p.scale, label: String(p.scale) }));
    const yTicks = Array.from({ length: 5 }, (_, i) => ({ value: maxValue * i / 4, label: format(maxValue * i / 4, 2) }));
    const content = [plotFrame(width, height, margin, xTicks, yTicks, 'Escala temporal τ', 'WPE (nats; d = 4)', x, y)];
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.scale).toFixed(2)},${y(p.value).toFixed(2)}`).join(' ');
    content.push(`<path class="plot-line plot-line-amber" d="${path}" fill="none" stroke="#f4bd79" stroke-width="2.6"/>`);
    points.forEach(p => {
      content.push(`<circle class="plot-point" cx="${x(p.scale)}" cy="${y(p.value)}" r="4.2" fill="${chartDisplayColor('#f4bd79')}"><title>Escala τ=${p.scale}; WPE=${format(p.value, 4)}; N_coarse=${p.n}</title></circle>`);
      content.push(`<text class="plot-label" x="${x(p.scale)}" y="${y(p.value) - 10}" text-anchor="middle">${format(p.value, 2)}</text>`);
    });
    setChartTableData('msePlot', ['Escala τ', 'WPE (nats)', 'N após agregação', 'Padrões ordinais distintos'], points.map(p => [p.scale, format(p.value, 6), p.n, p.patterns]), 'WPE calculada do cenário sintético ativo; o CI é a soma destes oito valores.');
    setSvg('msePlot', content.join(''));
    const ci=document.getElementById('ciValue'); if (ci) ci.textContent = format(item.mse.CI, 3);
    const scales=document.getElementById('scaleValues'); if (scales) scales.innerHTML = points.map(p => `<div class="scale-pill"><span>τ = ${p.scale}</span><strong>${format(p.value, 2)}</strong></div>`).join('');
  }
  const ENERGY_BANDS = [
    { name: '14–20 keV', short: '14–20', color: '#9697ff' },
    { name: '20–24 keV', short: '20–24', color: '#b48cf2' },
    { name: '24–35 keV', short: '24–35', color: '#d58ac7' },
    { name: '35–50 keV', short: '35–50', color: '#f4bd79' },
    { name: '50–75 keV', short: '50–75', color: '#d9dc82' },
    { name: '75–100 keV', short: '75–100', color: '#61dcc7' },
    { name: '100–150 keV', short: '100–150', color: '#61b9df' },
    { name: '150–195 keV', short: '150–195', color: '#8399ff' }
  ];
  const SYNTHETIC_CLASSES = [
    { key: 'FSRQ', label: 'FSRQ · sintético', color: '#9697ff', amplitude: 0.72, noise: 0.26, mode: 'smooth' },
    { key: 'BL Lac', label: 'BL Lac · sintético', color: '#f4bd79', amplitude: 1.12, noise: 0.13, mode: 'flares' },
    { key: 'AGN', label: 'AGN · sintético', color: '#61dcc7', amplitude: 0.88, noise: 0.30, mode: 'multiscale' }
  ];
  const MULTIBAND_N = 144;

  function median(values) {
    if (!values.length) return NaN;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  }

  function generateMultibandCurve(classDef, sourceNumber, bandIndex) {
    const seed = 3719 + SYNTHETIC_CLASSES.findIndex(c => c.key === classDef.key) * 100003 + sourceNumber * 1009 + bandIndex * 7919;
    const noise = seededNoise(seed);
    const baseline = (3.2 + bandIndex * 0.31) * (0.93 + sourceNumber * 0.018);
    const amplitude = classDef.amplitude * (0.83 + sourceNumber * 0.035) * (0.76 + bandIndex * 0.072);
    const phase = sourceNumber * 0.39 + bandIndex * 0.22;
    const flux = [];
    const errors = [];
    for (let t = 0; t < MULTIBAND_N; t += 1) {
      let structure;
      if (classDef.mode === 'smooth') {
        structure = 0.78 * Math.sin(2 * Math.PI * t / (39 + sourceNumber) + phase)
          + 0.34 * Math.sin(2 * Math.PI * t / (13.5 + bandIndex * 0.45) + phase * 0.6)
          + classDef.noise * noise();
      } else if (classDef.mode === 'flares') {
        const flare = (center, width, height) => height * Math.exp(-0.5 * ((t - center) / width) ** 2);
        const offset = (sourceNumber % 3) * 3;
        structure = 0.18 * Math.sin(2 * Math.PI * t / 55 + phase)
          + flare(23 + offset, 2.5 + (sourceNumber % 2) * 0.4, 1.55)
          + flare(65 + offset, 3.2, 1.25)
          + flare(108 + offset, 2.8, 1.6)
          + classDef.noise * noise();
      } else {
        const slow = 0.55 * Math.sin(2 * Math.PI * t / (61 + sourceNumber) + phase);
        const medium = 0.35 * Math.sin(2 * Math.PI * t / (16 + bandIndex * 0.35) + phase * 1.7);
        const fast = 0.19 * Math.sin(2 * Math.PI * t / 4.8 + phase * 0.3);
        const envelope = 1 + 0.22 * Math.sin(2 * Math.PI * t / 45 + phase);
        structure = slow + envelope * medium + fast + classDef.noise * noise();
      }
      // Errors and the measurement scatter are synthetic and reproducible; the intrinsic
      // modulation estimate below uses the same error-aware algebra as the internal project.
      const error = baseline * (0.027 + 0.0022 * bandIndex) * (0.92 + 0.12 * Math.abs(noise()));
      const measured = baseline + amplitude * structure + error * Math.sqrt(3) * noise();
      flux.push(Math.max(0.025, measured));
      errors.push(error);
    }
    return { flux, errors, baseline };
  }

  function intrinsicModulationIndex(flux, errors) {
    if (!flux.length || flux.length !== errors.length) return null;
    const averageFlux = mean(flux);
    if (!Number.isFinite(averageFlux) || Math.abs(averageFlux) < 1e-12) return null;
    const observedVariance = flux.reduce((sum, x) => sum + (x - averageFlux) ** 2, 0) / flux.length;
    const meanErrorVariance = mean(errors.map(e => e * e));
    const intrinsicVariance = observedVariance - meanErrorVariance;
    return intrinsicVariance >= 0 ? 100 * Math.sqrt(intrinsicVariance) / Math.abs(averageFlux) : null;
  }

  function robustVariabilityIndex(flux) {
    const med = median(flux);
    if (!Number.isFinite(med) || Math.abs(med) < 1e-12) return null;
    const mad = median(flux.map(value => Math.abs(value - med)));
    return 100 * 1.4826 * mad / Math.abs(med);
  }

  function generateMultibandPopulation() {
    const sources = [];
    const rows = [];
    SYNTHETIC_CLASSES.forEach((classDef, classIndex) => {
      for (let sourceNumber = 1; sourceNumber <= 8; sourceNumber += 1) {
        const sourceName = `${classDef.key === 'BL Lac' ? 'BLLac' : classDef.key}-S${String(sourceNumber).padStart(2, '0')}`;
        const source = { name: sourceName, classKey: classDef.key, classLabel: classDef.label, classColor: classDef.color, bands: [] };
        ENERGY_BANDS.forEach((band, bandIndex) => {
          const series = generateMultibandCurve(classDef, sourceNumber + classIndex * 2, bandIndex);
          const row = {
            source: sourceName, sourceNumber, classKey: classDef.key, classLabel: classDef.label, classColor: classDef.color,
            bandIndex, band: band.name, bandShort: band.short, bandColor: band.color,
            series: series.flux, errors: series.errors, sampen: null,
            A: 0, B: 0, sigma: null, tolerance: null, exampleB: null, exampleA: null,
            modulation: intrinsicModulationIndex(series.flux, series.errors),
            robustVariability: robustVariabilityIndex(series.flux), fisherShannon: { H: null, fisher: null, bandwidth: null },
            mse: null, ci: null, mseReady: false, sampenReady: false, fisherReady: false, metricsReady: false,
            meanFlux: mean(series.flux), n: series.flux.length
          };
          source.bands.push(row);
          rows.push(row);
        });
        sources.push(source);
      }
    });
    return { sources, rows };
  }

  const MULTIBAND = generateMultibandPopulation();
  let visibleBands = new Set(ENERGY_BANDS.map((_, i) => i));
  let activeScaleIndex = 1;
  let populationMetricsFinished = false;
  let populationMetricsScheduled = false;
  let populationMetricsCursor = 0;

  function updateRowMetricState(row) {
    row.metricsReady = Boolean(row.mseReady && row.sampenReady && row.fisherReady);
  }
  function ensureRowMSE(row) {
    if (!row || row.mseReady) return;
    row.mse = calculateMSE(row.series); row.ci = row.mse.CI; row.mseReady = true; updateRowMetricState(row);
  }
  function ensureRowSampEn(row) {
    if (!row || row.sampenReady) return;
    const result = calculateSampEn(row.series, EMBEDDING_SAMPEN, 0.2);
    row.sampen = result.value; row.A = result.A; row.B = result.B; row.sigma = result.sigma;
    row.tolerance = result.tolerance; row.exampleB = result.exampleB; row.exampleA = result.exampleA;
    row.sampenReady = true; updateRowMetricState(row);
  }
  function ensureRowFisher(row) {
    if (!row || row.fisherReady) return;
    row.fisherShannon = fisherShannonKDE(row.series); row.fisherReady = true; updateRowMetricState(row);
  }
  function ensureRowMetrics(row) { ensureRowMSE(row); ensureRowSampEn(row); ensureRowFisher(row); }
  function ensureSourceCoreMetrics(source) { source?.bands?.forEach(row => { ensureRowMSE(row); ensureRowSampEn(row); }); }
  function populationMetricsStatus(message) {
    const status = document.getElementById('populationComputeStatus');
    if (status) status.textContent = message;
  }
  function renderPopulationAnalyticsWhenReady() {
    if (MULTIBAND.rows.some(row => !row.metricsReady) || populationMetricsFinished) return;
    populationMetricsFinished = true;
    populationMetricsStatus('Métricas da população sintética calculadas.');
    drawMultibandGallery();
    drawFisherPlane(activeBandRow());
    drawMultibandCurve(true);
  }
  function schedulePopulationMetricsBatch() {
    if (populationMetricsFinished || populationMetricsScheduled) return;
    populationMetricsScheduled = true;
    const runBatch = deadline => {
      populationMetricsScheduled = false;
      if (document.hidden) return;
      let processed = 0;
      while (populationMetricsCursor < MULTIBAND.rows.length && processed < 3) {
        const row = MULTIBAND.rows[populationMetricsCursor++];
        if (!row.metricsReady) ensureRowMetrics(row);
        processed += 1;
        if (deadline && typeof deadline.timeRemaining === 'function' && deadline.timeRemaining() < 4) break;
      }
      if (populationMetricsCursor >= MULTIBAND.rows.length) { renderPopulationAnalyticsWhenReady(); return; }
      schedulePopulationMetricsBatch();
    };
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(runBatch, { timeout: 200 });
    else window.setTimeout(() => runBatch(null), 16);
  }
  function sourceFromSelect() {
    const select = document.getElementById('multibandSource');
    const name = select?.value;
    return MULTIBAND.sources.find(source => source.name === name) || MULTIBAND.sources[0];
  }
  function activeBandIndex() {
    const value = Number(document.getElementById('activeBandSelector')?.value ?? 2);
    return Number.isInteger(value) && value >= 0 && value < ENERGY_BANDS.length ? value : 2;
  }
  function activeBandRow() {
    const source = sourceFromSelect();
    if (!source) return null;
    // The currently selected source stays useful immediately. KDEs for the full
    // population remain scheduled in the background.
    ensureSourceCoreMetrics(source);
    const row = source.bands?.[activeBandIndex()] || source.bands?.[0] || null;
    ensureRowFisher(row);
    return row;
  }
  function activeBandRows() { return MULTIBAND.rows.filter(row => row.bandIndex === activeBandIndex()); }
  function itemFromBandRow(row) {
    if (!row) return null;
    const scenarioKey = row.classKey === 'BL Lac' ? 'flares' : row.classKey === 'AGN' ? 'multiscale' : 'smooth';
    const base = scenarioInfo[scenarioKey];
    return { ...base, sourceName: `${row.source} · ${row.band} · SINTÉTICO`, series: row.series, sampen: {
      value: row.sampen, A: row.A, B: row.B, sigma: row.sigma, tolerance: row.tolerance,
      templateCount: row.n - EMBEDDING_SAMPEN, exampleB: row.exampleB, exampleA: row.exampleA,
      status: Number.isFinite(row.sampen) ? 'Estimativa sintética calculada.' : 'A SampEn não foi definida para estes parâmetros porque A ou B é zero.'
    }, sampenM: EMBEDDING_SAMPEN, rFactor: 0.2, fisherShannon: row.fisherShannon, mse: row.mse, sourceNameShort: row.source, activeRow: row };
  }
  function updateScenarioButtonsForSource() {
    const src = sourceFromSelect();
    if (!src) return;
    currentKey = src.classKey === 'BL Lac' ? 'flares' : src.classKey === 'AGN' ? 'multiscale' : 'smooth';
    document.querySelectorAll('[data-scenario]').forEach(button => {
      const active = button.dataset.scenario === currentKey;
      button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active));
    });
  }
  function renderActiveDemo() {
    const row = activeBandRow();
    if (!row) return;
    const item = itemFromBandRow(row);
    const status = document.getElementById('scenarioStatus'); if (status) status.textContent = `${row.classKey.toUpperCase()} · ${row.source} · ${row.band.toUpperCase()}`;
    const description = document.getElementById('scenarioDescription'); if (description) description.textContent = `${scenarioInfo[currentKey].description} A mesma curva sintética, na banda ${row.band}, alimenta as três lentes.`;
    const stamp = document.querySelector('.synthetic-stamp'); if (stamp) stamp.textContent = `SINTÉTICO · N=${row.n}`;
    drawLightcurve(item); drawSampEn(item); drawFisherPlane(row); drawMSE(item);
    drawMultibandCurve(); drawMultibandGallery();
  }

  function classLegendMarkup() {
    return SYNTHETIC_CLASSES.map(item => `<span><i class="class-legend-dot" style="background:${chartDisplayColor(item.color)}"></i>${escapeXML(item.label)}</span>`).join('');
  }

  function renderClassLegends() {
    document.querySelectorAll('.class-legend').forEach(legend => { legend.innerHTML = classLegendMarkup(); });
  }

  function tickValues(min, max, count = 5) {
    if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
    if (Math.abs(max - min) < 1e-12) { min -= 0.5; max += 0.5; }
    return Array.from({ length: count }, (_, i) => {
      const value = min + (max - min) * i / (count - 1);
      return { value, label: format(value, Math.abs(max - min) < 1 ? 2 : 1) };
    });
  }

  function drawMultibandCurve(skipDependentRedraw = false) {
    const source = sourceFromSelect();
    if (!source) return;
    const g = plotGeometry('multibandCurvePlot', 900, 310, { top: 18, right: 24, bottom: 43, left: 56 });
    const { width, height, margin } = g;
    const plotHeight = height - margin.top - margin.bottom;
    const yMin = -3.2, yMax = 3.2;
    const x = value => margin.left + value / (MULTIBAND_N - 1) * (width - margin.left - margin.right);
    const y = value => height - margin.bottom - (value - yMin) / (yMax - yMin) * plotHeight;
    const xTicks = [0, Math.round((MULTIBAND_N - 1) * .25), Math.round((MULTIBAND_N - 1) * .5), Math.round((MULTIBAND_N - 1) * .75), MULTIBAND_N - 1].map(v => ({ value: v, label: String(v) }));
    const yTicks = [-3, -1.5, 0, 1.5, 3].map(v => ({ value: v, label: format(v, 1) }));
    const content = [plotFrame(width, height, margin, xTicks, yTicks, 'Índice temporal sintético', 'Fluxo normalizado (z-score)', x, y)];
    const activeBand = activeBandIndex();
    source.bands.forEach(row => {
      if (!visibleBands.has(row.bandIndex)) return;
      const avg = mean(row.series), sd = standardDeviation(row.series) || 1;
      const z = row.series.map(value => (value - avg) / sd);
      const path = z.map((value, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(2)},${y(value).toFixed(2)}`).join(' ');
      const isActive = row.bandIndex === activeBand;
      content.push(`<path class="multiband-curve ${isActive ? 'is-active-band' : ''}" data-band="${row.bandIndex}" d="${path}" fill="none" stroke="${chartDisplayColor(row.bandColor)}" stroke-width="${isActive ? 3.2 : 1.7}" opacity="${isActive ? 1 : .42}"><title>${escapeXML(source.name)} · ${escapeXML(row.band)} · ${isActive ? 'BANDA EM FOCO · ' : ''}SampEn=${format(row.sampen, 3)} · m_int=${format(row.modulation, 2)}% · CI=${format(row.ci,3)}</title></path>`);
      if (isActive) z.forEach((value, i) => { if (i % 12 === 0) content.push(`<circle cx="${x(i)}" cy="${y(value)}" r="2.4" fill="${chartDisplayColor(row.bandColor)}" opacity="1"><title>${escapeXML(row.band)} · t=${i} · z=${format(value, 3)}</title></circle>`); });
    });
    content.push(`<text class="plot-label" x="${width - margin.right}" y="${margin.top + 2}" text-anchor="end">${escapeXML(source.name)} · foco ${escapeXML(ENERGY_BANDS[activeBand].name)} · SINTÉTICO</text>`);
    setChartTableData('multibandCurvePlot', ['Índice temporal', ...source.bands.map(b => b.band)], Array.from({length: MULTIBAND_N}, (_, t) => [t, ...source.bands.map(row => format((row.series[t] - mean(row.series)) / (standardDeviation(row.series) || 1), 5))]), 'Valores normalizados (z-score) da fonte sintética selecionada, nas oito bandas.');
    setSvg('multibandCurvePlot', content.join(''));
    const validSE = source.bands.filter(b => Number.isFinite(b.sampen));
    const avgSE = validSE.length ? mean(validSE.map(b => b.sampen)) : NaN;
    const avgMod = mean(source.bands.map(b => b.modulation).filter(Number.isFinite));
    const stat = document.getElementById('multibandSourceStats');
    if (stat) stat.textContent = `${source.classLabel} · ${MULTIBAND_N} pontos por banda · média de SampEn nas oito bandas = ${format(avgSE, 3)} · modulação intrínseca média = ${format(avgMod, 2)}% · foco: ${ENERGY_BANDS[activeBand].name}`;
    const sourceSummary = document.getElementById('multibandSource');
    if (sourceSummary) sourceSummary.setAttribute('aria-label', `Fonte demonstrativa selecionada: ${source.name}`);
    if (!skipDependentRedraw) {
      drawMSEBandScale(source); drawSensitivityMap(source); drawBandScaleHeatmap(source);
    }
    drawSampenSourceBandHeatmap(); drawFisherBandTrajectory(source);
  }
  function drawBandMeanChart(svgId, metricKey, axisLabel, digits = 3) {
    const g = plotGeometry(svgId, 700, 290, { top: 18, right: 18, bottom: 58, left: 58 });
    const { width, height, margin } = g;
    const summaries = ENERGY_BANDS.map((band, index) => {
      const values = MULTIBAND.rows.filter(row => row.bandIndex === index).map(row => row[metricKey]).filter(Number.isFinite);
      const avg = values.length ? mean(values) : NaN;
      return { ...band, index, avg, sd: values.length > 1 ? standardDeviation(values) : 0, n: values.length };
    });
    const maxVal = Math.max(0.1, ...summaries.filter(s => Number.isFinite(s.avg)).map(s => s.avg + s.sd)) * 1.18;
    const xStep = (width - margin.left - margin.right) / summaries.length;
    const y = value => height - margin.bottom - value / maxVal * (height - margin.top - margin.bottom);
    const x = index => margin.left + (index + 0.5) * xStep;
    const yTicks = Array.from({ length: 5 }, (_, i) => ({ value: maxVal * i / 4, label: format(maxVal * i / 4, digits > 2 ? 2 : 1) }));
    const compact = isCompactViewport(svgId);
    const xTicks = summaries.map(summary => ({ value: summary.index, label: compact ? summary.short.split(/[–-]/)[0] : summary.short }));
    const content = [plotFrame(width, height, margin, xTicks, yTicks, compact ? 'Início da banda (keV)' : 'Banda de energia (keV)', axisLabel, value => x(value), y)];
    summaries.forEach(summary => {
      if (!Number.isFinite(summary.avg)) return;
      const barWidth = xStep * 0.62, top = y(summary.avg), x0 = x(summary.index) - barWidth / 2;
      const selected = summary.index === activeBandIndex();
      content.push(`<rect x="${x0}" y="${top}" width="${barWidth}" height="${height - margin.bottom - top}" rx="4" fill="${chartDisplayColor(summary.color)}" opacity="${selected ? 1 : .72}" stroke="${selected ? chartForegroundColor() : 'none'}" stroke-width="${selected ? 1.8 : 0}"><title>${escapeXML(summary.name)} · média=${format(summary.avg, digits)} · DP=${format(summary.sd, digits)} · N=${summary.n} curvas sintéticas</title></rect>`);
      const topError = y(Math.min(maxVal, summary.avg + summary.sd)), bottomError = y(Math.max(0, summary.avg - summary.sd));
      content.push(`<line x1="${x(summary.index)}" y1="${topError}" x2="${x(summary.index)}" y2="${bottomError}" stroke="${chartDisplayColor('#e8efff')}" stroke-width="1.2" vector-effect="non-scaling-stroke"/><line x1="${x(summary.index)-5}" y1="${topError}" x2="${x(summary.index)+5}" y2="${topError}" stroke="${chartDisplayColor('#e8efff')}" stroke-width="1.2"/><line x1="${x(summary.index)-5}" y1="${bottomError}" x2="${x(summary.index)+5}" y2="${bottomError}" stroke="${chartDisplayColor('#e8efff')}" stroke-width="1.2"/>`);
      const valueLabelY = Math.max(margin.top + 14, topError - 8);
      content.push(`<text class="plot-label" x="${x(summary.index)}" y="${valueLabelY}" text-anchor="middle">${format(summary.avg, 2)}</text>`);
    });
    setChartTableData(svgId, ['Banda', 'Média', 'DP', 'Número de séries sintéticas'], summaries.map(r => [r.name, format(r.avg,digits), format(r.sd,digits), r.n]), `Média ± 1 DP calculadas por banda para ${metricKey}.`);
    setSvg(svgId, content.join(''));
  }
  function drawClassDistribution(svgId, metricKey, xAxisLabel, digits = 3) {
    const bandIdx = activeBandIndex();
    const dataByClass = SYNTHETIC_CLASSES.map(classDef => ({ ...classDef, values: MULTIBAND.rows.filter(row => row.classKey === classDef.key && row.bandIndex === bandIdx).map(row => row[metricKey]).filter(Number.isFinite) }));
    const all = dataByClass.flatMap(group => group.values);
    const g = plotGeometry(svgId, 700, 290, { top: 18, right: 18, bottom: 55, left: 59 });
    const { width, height, margin } = g;
    if (!all.length) { setSvg(svgId, '<text x="210" y="160" text-anchor="middle">Sem valores finitos para esta banda</text>'); return; }
    const min0 = Math.min(...all), max0 = Math.max(...all);
    const pad = Math.max((max0 - min0) * 0.06, 0.025), min = min0 - pad, max = max0 + pad;
    const bins = 12, binWidth = (max - min) / bins;
    const counts = dataByClass.map(group => Array.from({ length: bins }, () => 0));
    dataByClass.forEach((group, gi) => group.values.forEach(value => { const bin = Math.max(0, Math.min(bins - 1, Math.floor((value - min) / binWidth))); counts[gi][bin] += 1; }));
    const fractions = counts.map((group, gi) => group.map(value => value / Math.max(1, dataByClass[gi].values.length)));
    const ymax = Math.max(0.05, ...fractions.flat()) * 1.16;
    const x = value => margin.left + (value - min) / (max - min || 1) * (width - margin.left - margin.right);
    const y = value => height - margin.bottom - value / ymax * (height - margin.top - margin.bottom);
    const xTicks = Array.from({ length: 5 }, (_, i) => { const value = min + (max - min) * i / 4; return { value, label: format(value, digits) }; });
    const yTicks = Array.from({ length: 5 }, (_, i) => ({ value: ymax * i / 4, label: `${Math.round(ymax * i * 25)}%` }));
    const content = [plotFrame(width, height, margin, xTicks, yTicks, xAxisLabel, 'Fração da classe / intervalo', x, y)];
    const groupWidth = (width - margin.left - margin.right) / bins * 0.83;
    fractions.forEach((group, gi) => group.forEach((fraction, bin) => {
      const x0 = x(min + bin * binWidth) + (width - margin.left - margin.right) / bins * 0.085 + gi * groupWidth / 3;
      const barWidth = groupWidth / 3 * 0.92, top = y(fraction);
      content.push(`<rect x="${x0}" y="${top}" width="${barWidth}" height="${height - margin.bottom - top}" fill="${chartDisplayColor(dataByClass[gi].color)}" opacity="0.82" rx="1"><title>${escapeXML(dataByClass[gi].label)} · banda ${escapeXML(ENERGY_BANDS[bandIdx].name)} · intervalo ${format(min + bin * binWidth, digits)}–${format(min + (bin + 1) * binWidth, digits)} · ${format(fraction * 100, 1)}% dos registros · N=${dataByClass[gi].values.length} fontes sintéticas</title></rect>`);
    }));
    setChartTableData(svgId, ['Classe demonstrativa', 'Intervalo', 'Fração', 'N de fontes'], dataByClass.flatMap((group, gi) => group.values.map((v, i) => [group.label, format(v,digits), 'observação sintética individual', group.values.length])), `Valores de ${metricKey} na banda ${ENERGY_BANDS[bandIdx].name}. O histograma usa uma observação por fonte sintética nesta banda.`);
    setSvg(svgId, content.join(''));
  }
  function drawScatter(svgId, records, xGetter, yGetter, xAxisLabel, yAxisLabel, options = {}) {
    const points = records.map(row => ({ row, x: xGetter(row), y: yGetter(row) })).filter(point => Number.isFinite(point.x) && Number.isFinite(point.y) && (!options.logY || point.y > 0) && (!options.logX || point.x > 0));
    const baseWidth = options.width || 900, baseHeight = options.height || 330;
    const baseMargin = options.margin || { top: 20, right: 24, bottom: 50, left: 68 };
    const g = plotGeometry(svgId, baseWidth, baseHeight, baseMargin, { left: baseMargin.left > 66 ? 78 : 72 });
    const { width, height, margin } = g;
    if (points.length < 2) { setSvg(svgId, `<text class="plot-label" x="${width/2}" y="${height/2}" text-anchor="middle">Dados demonstrativos insuficientes</text>`); return; }
    let minX = Math.min(...points.map(p => p.x)), maxX = Math.max(...points.map(p => p.x));
    let minY = Math.min(...points.map(p => p.y)), maxY = Math.max(...points.map(p => p.y));
    if (options.logX) { minX = Math.log10(minX); maxX = Math.log10(maxX); }
    if (options.logY) { minY = Math.floor(Math.log10(minY)); maxY = Math.ceil(Math.log10(maxY)); if (maxY - minY < 2) maxY = minY + 2; }
    const xPad = Math.max((maxX - minX) * 0.08, options.logX ? 0.05 : 0.01);
    const yPad = options.logY ? 0 : Math.max((maxY - minY) * 0.1, 0.01);
    minX -= xPad; maxX += xPad; minY -= yPad; maxY += yPad;
    const X = value => { const v = options.logX ? Math.log10(value) : value; return margin.left + (v - minX) / (maxX - minX || 1) * (width - margin.left - margin.right); };
    const Y = value => { const v = options.logY ? Math.log10(value) : value; return height - margin.bottom - (v - minY) / (maxY - minY || 1) * (height - margin.top - margin.bottom); };
    const xTicks = Array.from({ length: 5 }, (_, i) => { const scaled = minX + (maxX - minX) * i / 4; const value = options.logX ? 10 ** scaled : scaled; return { value, label: format(value, options.xDigits ?? 2) }; });
    const yTicks = options.logY
      ? Array.from({length: Math.max(2, Math.min(5, Math.floor(maxY)-Math.ceil(minY)+1))}, (_,i)=>Math.ceil(minY)+i).filter(exp=>exp<=maxY).map(exp=>({value:10**exp,label:formatInteger(10**exp)}))
      : Array.from({ length: 5 }, (_, i) => { const scaled = minY + (maxY - minY) * i / 4; return { value: scaled, label: format(scaled, options.yDigits ?? 2) }; });
    const content = [plotFrame(width, height, margin, xTicks, yTicks, xAxisLabel, yAxisLabel, X, Y)];
    points.forEach(({ row, x, y }) => {
      const cx = X(x), cy = Y(y);
      const tooltip = `${row.source} · ${row.classLabel} · ${row.band}\nSampEn=${format(row.sampen, 4)}\nm_int=${format(row.modulation, 3)}%\nV_rob=${format(row.robustVariability, 3)}%\nH=${format(row.fisherShannon?.H, 4)}\nI_F=${format(row.fisherShannon?.fisher, 4)}\nCI=${format(row.ci, 4)}`;
      const key = `${row.source}|${row.bandIndex}`;
      const selected = options.selectedPoint && key === options.selectedKey;
      if (selected && options.annotateSelected) {
        content.push(`<line x1="${cx}" y1="${margin.top}" x2="${cx}" y2="${height-margin.bottom}" stroke="${chartForegroundColor()}" stroke-dasharray="3 4" opacity=".55"/>`);
        content.push(`<line x1="${margin.left}" y1="${cy}" x2="${width-margin.right}" y2="${cy}" stroke="${chartForegroundColor()}" stroke-dasharray="3 4" opacity=".55"/>`);
        const lx=Math.min(width-margin.right-8,Math.max(margin.left+8,cx+(cx>(margin.left+width-margin.right)/2?-10:10)));
        const ly=Math.max(margin.top+14,Math.min(height-margin.bottom-8,cy-10));
        content.push(`<text class="plot-label" x="${lx}" y="${ly}" text-anchor="${cx>(margin.left+width-margin.right)/2?'end':'start'}" style="fill:#ffffff;font-weight:800">${escapeXML(row.source)} · ${escapeXML(row.bandShort||row.band)}</text>`);
      }
      content.push(`<circle class="interactive-point ${selected ? 'is-current-point' : ''}" cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${selected ? 7.5 : 3.7}" fill="${chartDisplayColor(row.classColor)}" fill-opacity="${selected ? 1 : .88}" stroke="${selected ? chartForegroundColor() : chartDisplayColor(row.classColor)}" stroke-width="${selected ? 2.4 : .5}"><title>${escapeXML(tooltip)}${selected ? ' · FONTE/BANDA EM FOCO' : ''}</title></circle>`);
    });
    content.push(`<text class="plot-label" x="${width - margin.right}" y="${margin.top + 1}" text-anchor="end">N = ${points.length} pares fonte × banda sintéticos</text>`);
    setChartTableData(svgId, ['Fonte', 'Classe sintética', 'Banda', xAxisLabel, yAxisLabel, 'SampEn', 'm_int (%)', 'V_rob (%)', 'CI'], points.map(({row,x,y}) => [row.source,row.classLabel,row.band,format(x, options.xDigits ?? 3),format(y, options.yDigits ?? 3),format(row.sampen,3),format(row.modulation,2),format(row.robustVariability,2),format(row.ci,3)]), 'Pares fonte × banda sintéticos; uma fonte contribui com observações relacionadas entre bandas.');
    setSvg(svgId, content.join(''));
  }
  function drawFisherPopulation() {
    const filter = document.getElementById('fisherBandFilter')?.value || String(activeBandIndex());
    const source = sourceFromSelect();
    const selected = source?.bands?.[activeBandIndex()];
    const rows = filter === 'all' ? MULTIBAND.rows : MULTIBAND.rows.filter(row => row.bandIndex === Number(filter));
    const axisSuffix = filter === 'all' ? ' · todas as bandas' : ` · ${ENERGY_BANDS[Number(filter)]?.name || ''}`;
    drawScatter('fisherPopulationPlot', rows,
      row => row.fisherShannon?.H, row => row.fisherShannon?.fisher,
      `Entropia de Shannon H (nats)${axisSuffix}`, 'Informação de Fisher I_F (escala log)',
      { logY: true, width: 900, height: 330, xDigits: 2, yDigits: 2, selectedPoint: selected, selectedKey: `${selected?.source}|${selected?.bandIndex}`, annotateSelected: true });
    const explanation=document.querySelector('#fisherPopulationPlot')?.closest('.multiband-chart-card')?.querySelector('.chart-explanation');
    if(explanation) explanation.textContent=filter==='all'
      ? 'Todas as 192 combinações sintéticas fonte × banda estão visíveis. As oito bandas da mesma fonte são medidas relacionadas, não 192 fontes independentes. O ponto branco identifica a fonte e a banda em foco.'
      : `A comparação mostra 24 fontes sintéticas na banda ${ENERGY_BANDS[Number(filter)]?.name}. O ponto branco é a fonte ativa. Eixo I_F em escala logarítmica com marcas em potências de dez; os dados são demonstrativos.`;
  }

  function drawFisherMetricRelation() {
    const metric = document.getElementById('fisherRelationMetric')?.value || 'modulation';
    const xGetter = metric === 'robust' ? row => row.robustVariability : row => row.modulation;
    const xLabel = metric === 'robust' ? 'Variabilidade robusta relativa V_rob (%)' : 'Índice de modulação intrínseco m_int (%)';
    drawScatter('fisherMetricPlot', activeBandRows(), xGetter, row => row.fisherShannon?.fisher, xLabel, 'Informação de Fisher I_F', { width: 900, height: 330, xDigits: 2, yDigits: 3, selectedPoint: activeBandRow(), selectedKey: `${activeBandRow()?.source}|${activeBandRow()?.bandIndex}` });
  }
  function drawMSEBandScale(source) {
    if (!source) return;
    const g = plotGeometry('mseBandScalePlot', 900, 330, { top: 20, right: 24, bottom: 49, left: 60 });
    const { width, height, margin } = g;
    const allPoints = source.bands.flatMap(row => row.mse.points.map(point => point.value)).filter(Number.isFinite);
    const maxValue = Math.max(...allPoints, Math.log(factorial(WPE_DIMENSION)) * 0.85, 0.3) * 1.1;
    const x = value => margin.left + (value - 1) / (SCALES - 1) * (width - margin.left - margin.right);
    const y = value => height - margin.bottom - value / maxValue * (height - margin.top - margin.bottom);
    const xTicks = Array.from({ length: SCALES }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
    const yTicks = Array.from({ length: 5 }, (_, i) => ({ value: maxValue * i / 4, label: format(maxValue * i / 4, 2) }));
    const content = [plotFrame(width, height, margin, xTicks, yTicks, 'Escala temporal τ', 'WPE (nats; d = 4)', x, y)];
    const activeBand=activeBandIndex();
    source.bands.forEach(row => {
      const data = row.mse.points, isActive=row.bandIndex===activeBand;
      const path = data.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.scale).toFixed(2)},${y(p.value).toFixed(2)}`).join(' ');
      content.push(`<path d="${path}" fill="none" stroke="${chartDisplayColor(row.bandColor)}" stroke-width="${isActive?3.4:1.7}" opacity="${isActive?1:.78}"><title>${escapeXML(source.name)} · ${escapeXML(row.band)} · ${isActive?'BANDA EM FOCO · ':''}CI=${format(row.ci, 4)}</title></path>`);
      data.forEach(p => {
        const tauFocused = p.scale === activeScaleIndex && isActive;
        content.push(`<circle cx="${x(p.scale)}" cy="${y(p.value)}" r="${tauFocused?6.5:isActive?4:2.4}" fill="${chartDisplayColor(row.bandColor)}" opacity="${isActive?1:.82}" stroke="${tauFocused?chartForegroundColor():'none'}" stroke-width="${tauFocused?2:0}"><title>${escapeXML(row.band)} · τ=${p.scale} · WPE=${format(p.value, 4)} · N_coarse=${p.n}${tauFocused?' · ESCALA EM FOCO':''}</title></circle>`);
        if (tauFocused) content.push(`<circle cx="${x(p.scale)}" cy="${y(p.value)}" r="10" fill="none" stroke="${chartForegroundColor()}" stroke-width="1.5" stroke-dasharray="2 2"/>`);
      });
    });
    content.push(`<text class="plot-label" x="${width - margin.right}" y="${margin.top + 1}" text-anchor="end">${escapeXML(source.name)} · foco ${escapeXML(ENERGY_BANDS[activeBand].name)} · τ em foco = ${activeScaleIndex}</text>`);
    setChartTableData('mseBandScalePlot', ['Banda','Escala τ','WPE (nats)','N agregado'], source.bands.flatMap(r=>r.mse.points.map(pt=>[r.band,pt.scale,format(pt.value,6),pt.n])), 'Valores calculados nas oito bandas e oito escalas para a fonte sintética ativa.');
    setSvg('mseBandScalePlot', content.join(''));
  }
  function drawSensitivityMap(source) {
    const select = document.getElementById('sensitivityBand');
    const mode = document.getElementById('sensitivityMode')?.value || 'value';
    const allBands = select?.value === 'all';
    const allContainer = document.getElementById('sensitivityAllBands');
    const svg = document.getElementById('sampenSensitivityPlot');
    if (allContainer) allContainer.hidden = !allBands;
    if (svg) svg.closest('.chart-frame').hidden = allBands;
    const legend = document.getElementById('sensitivityLegend');
    if (allBands) {
      if (legend) legend.innerHTML = sensitivityLegendMarkup(mode);
      if (allContainer) allContainer.innerHTML = source.bands.map((row, idx) => {
        const cells = computeSensitivityCells(row);
        return `<article class="sensitivity-mini-map"><h4>${escapeXML(row.band)}${idx===activeBandIndex()?' · BANDA EM FOCO':''}</h4><div class="sensitivity-mini-grid" role="group" aria-label="Mapa m por r da banda ${escapeXML(row.band)}">${cells.map((cell,cellIndex)=>`<button type="button" tabindex="${cellIndex===0?'0':'-1'}" class="sensitivity-mini-cell ${cell.reference?'is-reference':''} ${!Number.isFinite(cell.value)?'is-undefined':''}" style="--cell-color:${sensitivityCellColor(cell,mode,cells)}" title="m=${cell.m}; r=${format(cell.rFactor,2)}σ; SampEn=${format(cell.value,4)}; A=${cell.A}; B=${cell.B}" aria-label="${escapeXML(row.band)}, m ${cell.m}, r ${format(cell.rFactor,2)} sigma, SampEn ${format(cell.value,4)}" data-sens-cell-index="${cellIndex}" data-sens-focus="${row.bandIndex}">${Number.isFinite(cell.value)?format(cell.value,1):'—'}</button>`).join('')}</div><p>${cells.filter(c=>Number.isFinite(c.value)).length}/50 estimativas definidas</p></article>`;
      }).join('');
      allContainer.querySelectorAll('[data-sens-focus]').forEach(btn=>btn.addEventListener('click',()=>{ if(select)select.value=btn.dataset.sensFocus; drawSensitivityMap(source); select?.focus(); }));
      return;
    }
    const bandIndex = Number(select?.value ?? activeBandIndex());
    const row = source.bands[bandIndex] || source.bands[activeBandIndex()] || source.bands[0];
    if (!row) return;
    const dimensions = [1,2,3,4,5];
    const rFactors = Array.from({length:10},(_,i)=>(i+1)*0.05);
    const cells = computeSensitivityCells(row,dimensions,rFactors);
    const finite = cells.filter(c=>Number.isFinite(c.value));
    const ref = cells.find(c=>c.m===2 && Math.abs(c.rFactor-.2)<1e-9);
    const geometry = plotGeometry('sampenSensitivityPlot', 1000, 360, { top: 54, right: 22, bottom: 39, left: 94 }, { left: 82 });
    const { width, height, margin } = geometry;
    if (svg) svg.dataset.baseViewBox = svg.dataset.renderViewBox;
    const cellW=(width-margin.left-margin.right)/rFactors.length, cellH=(height-margin.top-margin.bottom)/dimensions.length;
    const lo=finite.length?Math.min(...finite.map(c=>c.value)):0, hi=finite.length?Math.max(...finite.map(c=>c.value)):1;
    const content=[];
    rFactors.forEach((r,i)=>content.push(`<text class="plot-label" font-size="${isCompactViewport('sampenSensitivityPlot')?'9':'12'}" x="${margin.left+(i+.5)*cellW}" y="${margin.top-15}" text-anchor="middle">${format(r,2)}σ</text>`));
    dimensions.forEach((m,ri)=>{
      const cy=margin.top+ri*cellH;
      content.push(`<text class="plot-axis-title" x="${margin.left-12}" y="${cy+cellH/2+4}" text-anchor="end">m = ${m}</text>`);
      rFactors.forEach((r,ci)=>{
        const cell=cells.find(c=>c.m===m&&Math.abs(c.rFactor-r)<1e-9); const color=sensitivityCellColor(cell,mode,cells,ref);
        const cx=margin.left+ci*cellW, x=cx+1.5, y=cy+1.5, w=cellW-3, h=cellH-3;
        const isRef=cell.reference; const hatch=!Number.isFinite(cell.value); const lowCount=cell.A<5||cell.B<20;
        content.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${color}" stroke="${isRef?'#ffffff':'rgba(224,235,255,.3)'}" stroke-width="${isRef?3:1}" ${hatch||lowCount?'stroke-dasharray="4 3"':''}><title>${escapeXML(row.band)} · m=${m}; r=${format(r,2)}σ; SampEn=${format(cell.value,5)}; A=${cell.A}; B=${cell.B}; diferença referência=${format(Number.isFinite(cell.value)&&Number.isFinite(ref?.value)?cell.value-ref.value:NaN,5)}${lowCount?' · CONTAGENS BAIXAS':''}${isRef?' · PADRÃO DO ESTUDO':''}</title></rect>`);
        if(cell.reference) content.push(`<circle cx="${cx+cellW-7}" cy="${cy+7}" r="4" fill="none" stroke="#ffffff" stroke-width="2"/>`);
        content.push(`<text x="${cx+cellW/2}" y="${cy+cellH/2+4}" text-anchor="middle" fill="${sensitivityTextColor(color)}" font-size="${isCompactViewport('sampenSensitivityPlot')?10:14}" font-weight="700">${Number.isFinite(cell.value)?format(mode==='difference'?cell.difference:cell.value,2):'—'}</text>`);
      });
    });
    const modeTitle=mode==='value'?'SampEn':mode==='difference'?'Δ SampEn vs. padrão':'Estabilidade ±10%';
    content.push(`<text class="plot-label" x="${width-margin.right}" y="${height-7}" text-anchor="end">${escapeXML(row.band)} · ${escapeXML(source.name)} · ${modeTitle} · anel = m=2, r=0,20σ</text>`);
    setChartTableData('sampenSensitivityPlot',['Banda','m','r fator (σ)','SampEn','Diferença vs. padrão','A','B','Status'],cells.map(c=>[row.band,c.m,format(c.rFactor,2),format(c.value,5),format(c.difference,5),c.A,c.B,c.status]),'Mapa de sensibilidade recalculado. O padrão de referência é m=2 e r=0,20σ; estabilidade é critério operacional, não intervalo de confiança.');
    setSvg('sampenSensitivityPlot',content.join(''));
    if(legend) { const legendVals=mode==='difference'?finite.map(c=>c.difference).filter(Number.isFinite):finite.map(c=>c.value); legend.innerHTML=sensitivityLegendMarkup(mode,mode==='stability'?null:(legendVals.length?Math.min(...legendVals):null),mode==='stability'?null:(legendVals.length?Math.max(...legendVals):null)); }
  }
  const sensitivityCache = new Map();
  function computeSensitivityCells(row, dimensions=[1,2,3,4,5], rFactors=Array.from({length:10},(_,i)=>(i+1)*0.05)) {
    const key = `${row.source || 'demo'}|${row.bandIndex ?? 'x'}|${dimensions.join(',')}|${rFactors.join(',')}`;
    if (sensitivityCache.has(key)) return sensitivityCache.get(key);
    const cells=[];
    dimensions.forEach(m=>rFactors.forEach(rFactor=>{
      const result=calculateSampEn(row.series,m,rFactor);
      cells.push({m,rFactor,value:result.value,A:result.A,B:result.B,reference:m===2&&Math.abs(rFactor-.2)<1e-9,status:result.value===null?'Sem estimativa': 'Definida'});
    }));
    const ref=cells.find(c=>c.reference); cells.forEach(c=>{c.difference=Number.isFinite(c.value)&&Number.isFinite(ref?.value)?c.value-ref.value:NaN; c.stable=Number.isFinite(c.value)&&Number.isFinite(ref?.value)&&Math.abs(c.value-ref.value)<=.1*Math.max(Math.abs(ref.value),1e-9); if(!Number.isFinite(c.value))c.status='A=0 ou B=0'; else if(c.A<5||c.B<20)c.status='Definida, mas contagens baixas';});
    sensitivityCache.set(key,cells);
    return cells;
  }
  function mixHex(a,b,t){ const pa=[1,3,5].map(i=>parseInt(a.slice(i,i+2),16)),pb=[1,3,5].map(i=>parseInt(b.slice(i,i+2),16));return '#'+pa.map((v,i)=>Math.round(v+(pb[i]-v)*t).toString(16).padStart(2,'0')).join(''); }
  function interpolatePalette(stops,t){const z=Math.max(0,Math.min(1,t))*(stops.length-1),i=Math.min(stops.length-2,Math.floor(z));return mixHex(stops[i],stops[i+1],z-i);}
  function sensitivityCellColor(cell,mode,cells,refOverride){
    if(!Number.isFinite(cell?.value))return '#202b3e';
    const finite=cells.filter(c=>Number.isFinite(c.value));const ref=refOverride||cells.find(c=>c.reference);
    if(mode==='difference'){const vals=finite.map(c=>c.difference).filter(Number.isFinite);const span=Math.max(.001,...vals.map(Math.abs));const d=cell.difference;return d<0?mixHex('#2b6cb0','#e9eff7',1-Math.min(1,Math.abs(d)/span)):mixHex('#e9eff7','#c0392b',Math.min(1,d/span));}
    if(mode==='stability'){if(cell.A<5||cell.B<20)return '#414b5a';return cell.stable?'#238b70':'#5c3d57';}
    const vals=finite.map(c=>c.value),lo=Math.min(...vals),hi=Math.max(...vals);return interpolatePalette(['#440154','#3b528b','#21908d','#5dc863','#fde725'],(cell.value-lo)/(hi-lo||1));
  }
  function sensitivityTextColor(color){
    const toLinear = value => { const channel = parseInt(value,16)/255; return channel <= .04045 ? channel/12.92 : ((channel+.055)/1.055)**2.4; };
    const n=String(color).replace('#','');if(n.length!==6)return '#FFFFFF';
    const r=toLinear(n.slice(0,2)),g=toLinear(n.slice(2,4)),b=toLinear(n.slice(4,6));
    const background=.2126*r+.7152*g+.0722*b,dark='#07121E',darkL=.2126*toLinear('07')+.7152*toLinear('12')+.0722*toLinear('1E');
    const darkContrast=(background+.05)/(darkL+.05),whiteContrast=1.05/(background+.05);
    return whiteContrast>=darkContrast?'#FFFFFF':dark;
  }
  function sensitivityLegendMarkup(mode,lo=null,hi=null){const modeText=mode==='value'?'SampEn calculada':mode==='difference'?'Diferença em relação ao padrão':'Estável: dentro de ±10%';return `<div class="sensitivity-legend"><strong>${modeText}</strong><div class="sensitivity-gradient ${mode==='difference'?'is-diverging':mode==='stability'?'is-stability':''}"></div><div class="sensitivity-legend-ticks"><span>${lo===null?'Menor':format(lo,3)}</span><span>${mode==='stability'?'Fora/baixas contagens':'Referência m=2, r=0,20σ'}</span><span>${hi===null?'Maior':format(hi,3)}</span></div><p>Células hachuradas ou cinzas indicam estimativa indefinida ou contagens insuficientes; diferença zero corresponde ao padrão de referência.</p></div>`;}
  function drawBandScaleHeatmap(source) {
    const svgId='bandScaleHeatmapPlot'; const svg=document.getElementById(svgId); if(!svg||!source)return;
    const geometry=plotGeometry(svgId,760,390,{top:44,right:22,bottom:32,left:132},{left:86});
    const w=geometry.width,h=geometry.height,ml=geometry.margin.left,mr=geometry.margin.right,mt=geometry.margin.top,mb=geometry.margin.bottom,cw=(w-ml-mr)/SCALES,ch=(h-mt-mb)/ENERGY_BANDS.length;
    const values=source.bands.flatMap(row=>row.mse.points.map(p=>p.value)).filter(Number.isFinite);const lo=Math.min(...values),hi=Math.max(...values);
    svg.dataset.renderViewBox=`0 0 ${w} ${h}`;
    let out='';
    source.bands.forEach((row,ri)=>{
      const cy=mt+ri*ch, active=ri===activeBandIndex();
      out+=`<text class="plot-label" x="${ml-12}" y="${cy+ch/2+4}" text-anchor="end">${escapeXML(row.bandShort)}</text>`;
      row.mse.points.forEach((p,ci)=>{const color=interpolatePalette(['#440154','#3b528b','#21908d','#5dc863','#fde725'],(p.value-lo)/(hi-lo||1));const x=ml+ci*cw,y=cy,activeTau=p.scale===activeScaleIndex,selected=active&&activeTau;out+=`<rect tabindex="${selected?'0':'-1'}" role="button" aria-label="Selecionar banda ${escapeXML(row.band)} na escala ${p.scale}" data-band-select="${ri}" data-scale-select="${p.scale}" x="${x+1}" y="${y+1}" width="${cw-2}" height="${ch-2}" rx="3" fill="${color}" stroke="${selected?chartForegroundColor():active?chartDisplayColor('#e8efff'):'rgba(130,145,166,.45)'}" stroke-width="${selected?3:active?1.3:0.7}"><title>${escapeXML(row.band)} · τ=${p.scale}; WPE=${format(p.value,5)}; n agregado=${p.n}; CI da banda=${format(row.ci,4)}${selected?' · BANDA E ESCALA EM FOCO':''}</title></rect><text x="${x+cw/2}" y="${y+ch/2+4}" text-anchor="middle" fill="${sensitivityTextColor(color)}" font-size="12" font-weight="650">${format(p.value,2)}</text>`;});
    });
    for(let i=0;i<SCALES;i++)out+=`<text class="plot-label" x="${ml+(i+.5)*cw}" y="${mt-13}" text-anchor="middle">τ=${i+1}</text>`;
    out+=`<text class="plot-axis-title" x="${(ml+w-mr)/2}" y="${h-7}" text-anchor="middle">Escala temporal (τ)</text>`;
    setChartTableData(svgId,['Banda energética','Escala τ','WPE (nats)','N agregado','CI da banda'],source.bands.flatMap(row=>row.mse.points.map(p=>[row.band,p.scale,format(p.value,6),p.n,format(row.ci,5)])),'WPE calculada por banda e escala da fonte sintética ativa.');
    setSvg(svgId,out);
  }
  function drawFisherBandTrajectory(source) {
    const svgId='fisherBandTrajectoryPlot'; if(!document.getElementById(svgId)||!source)return;
    if (!populationMetricsFinished) { setPopulationPending(svgId); return; }
    const g=plotGeometry(svgId,900,330,{top:24,right:28,bottom:60,left:72});const {width,height,margin}=g;
    const points=source.bands.filter(row=>Number.isFinite(row.fisherShannon?.H)&&Number.isFinite(row.fisherShannon?.fisher)&&row.fisherShannon.fisher>0);
    const values=points.map(row=>row.fisherShannon.fisher);if(!values.length){setSvg(svgId,'');return;}
    const minLog=Math.min(...values.map(Math.log10)),maxLog=Math.max(...values.map(Math.log10)),lp=Math.max((maxLog-minLog)*.16,.12),lo=minLog-lp,hi=maxLog+lp;
    const hs=points.map(row=>row.fisherShannon.H);const minH=Math.min(...hs),maxH=Math.max(...hs);const hp=Math.max((maxH-minH)*.18,.05);
    const x=v=>margin.left+(v-(minH-hp))/(maxH-minH+2*hp||1)*(width-margin.left-margin.right);
    const y=v=>height-margin.bottom-(Math.log10(Math.max(v,1e-12))-lo)/(hi-lo||1)*(height-margin.top-margin.bottom);
    const xTicks=points.map(row=>({value:row.fisherShannon.H,label:row.bandShort}));const yTicks=Array.from({length:4},(_,i)=>({value:10**(lo+(hi-lo)*i/3),label:`10^${format(lo+(hi-lo)*i/3,1)}`}));
    const out=[plotFrame(width,height,margin,xTicks,yTicks,'Entropia de Shannon H (nats)','Informação de Fisher I_F (escala log)',x,y)];
    const path=points.map((row,i)=>`${i?'L':'M'}${x(row.fisherShannon.H)},${y(row.fisherShannon.fisher)}`).join(' ');out.push(`<path d="${path}" fill="none" stroke="${chartDisplayColor('#61dcc7')}" stroke-width="2.6"/>`);
    points.forEach(row=>{const i=row.bandIndex,active=i===activeBandIndex();out.push(`<circle tabindex="${active?'0':'-1'}" role="button" aria-label="Selecionar banda ${escapeXML(row.band)}" data-fisher-band-index="${i}" data-band-select="${i}" cx="${x(row.fisherShannon.H)}" cy="${y(row.fisherShannon.fisher)}" r="${active?7:4.5}" fill="${chartDisplayColor(row.bandColor)}" stroke="${chartForegroundColor()}" stroke-width="${active?2.5:1}"><title>${row.source} · ${row.band} · H=${format(row.fisherShannon.H,5)} · I_F=${format(row.fisherShannon.fisher,5)}${active?' · BANDA EM FOCO':''}</title></circle>`);});
    setChartTableData(svgId,['Fonte','Banda','H (nats)','I_F','Largura de banda KDE'],points.map(r=>[r.source,r.band,format(r.fisherShannon.H,6),format(r.fisherShannon.fisher,6),format(r.fisherShannon.bandwidth,6)]),'Estimativas KDE calculadas para uma fonte sintética em cada banda.');
    setSvg(svgId,out.join(''));
  }
  function drawSampenSourceBandHeatmap() {
    const svgId='sampenBandHeatmapPlot';const svg=document.getElementById(svgId);if(!svg)return;
    if (!populationMetricsFinished) { setPopulationPending(svgId); return; }
    const w=1020,h=720,ml=155,mr=18,mt=47,mb=35,cw=(w-ml-mr)/8,ch=(h-mt-mb)/MULTIBAND.sources.length;
    const values=MULTIBAND.rows.map(r=>r.sampen).filter(Number.isFinite);const lo=Math.min(...values),hi=Math.max(...values),current=sourceFromSelect();svg.dataset.renderViewBox=`0 0 ${w} ${h}`;
    let out='';ENERGY_BANDS.forEach((band,i)=>out+=`<text class="plot-label" x="${ml+(i+.5)*cw}" y="${mt-13}" text-anchor="middle">${escapeXML(band.short)}</text>`);
    MULTIBAND.sources.forEach((source,ri)=>{const y=mt+ri*ch,isSource=source.name===current?.name;out+=`<text class="plot-label" x="${ml-10}" y="${y+ch/2+3}" text-anchor="end" style="fill:${isSource?'#ffffff':'#91a2bf'};font-weight:${isSource?750:450}">${escapeXML(source.name)}</text>`;source.bands.forEach((row,ci)=>{const color=Number.isFinite(row.sampen)?interpolatePalette(['#440154','#3b528b','#21908d','#5dc863','#fde725'],(row.sampen-lo)/(hi-lo||1)):'#354154';const activeBand=ci===activeBandIndex(),isTabStop=isSource&&activeBand,x=ml+ci*cw;out+=`<rect tabindex="${isTabStop?'0':'-1'}" role="button" aria-label="Selecionar ${escapeXML(source.name)} na banda ${escapeXML(row.band)}" data-source-select="${escapeXML(source.name)}" data-source-row="${ri}" data-band-select="${ci}" x="${x+1}" y="${y+1}" width="${cw-2}" height="${ch-2}" rx="2" fill="${color}" stroke="${isSource&&activeBand?chartForegroundColor():activeBand?chartDisplayColor('#e8efff'):'rgba(130,145,166,.35)'}" stroke-width="${isSource&&activeBand?3:activeBand?1.8:.7}"><title>${source.name} · ${row.band} · SampEn=${format(row.sampen,5)} · A=${row.A} · B=${row.B} · m_int=${format(row.modulation,2)}%</title></rect>`;if(ch>21)out+=`<text x="${x+cw/2}" y="${y+ch/2+3}" text-anchor="middle" fill="${sensitivityTextColor(color)}" font-size="10" font-weight="650">${format(row.sampen,2)}</text>`;});});
    out+=`<text class="plot-axis-title" x="${(ml+w-mr)/2}" y="${h-7}" text-anchor="middle">Bandas de energia (keV) · contorno branco = fonte e banda ativas</text>`;
    setChartTableData(svgId,['Fonte sintética','Classe','Banda','SampEn','A','B','m_int (%)','CI'],MULTIBAND.rows.map(r=>[r.source,r.classLabel,r.band,format(r.sampen,5),r.A,r.B,format(r.modulation,3),format(r.ci,4)]),'Matriz sintética completa fonte × banda: 24 fontes demonstrativas × 8 bandas.');
    setSvg(svgId,out);
  }

  function drawSampenCorrelations() {
    const rows = activeBandRows().filter(row => Number.isFinite(row.sampen));
    const src=activeBandRow(); const selectedKey=`${src?.source}|${src?.bandIndex}`;
    drawScatter('sampenModPlot', rows.filter(row => Number.isFinite(row.modulation)), row => row.modulation, row => row.sampen,
      'Índice de modulação intrínseco m_int (%)', 'Sample Entropy (SampEn)', { width: 700, height: 290, margin: { top: 18, right: 18, bottom: 55, left: 66 }, xDigits: 1, yDigits: 2, selectedPoint:src, selectedKey });
    drawScatter('sampenRobustPlot', rows.filter(row => Number.isFinite(row.robustVariability)), row => row.robustVariability, row => row.sampen,
      'Variabilidade robusta relativa V_rob (%)', 'Sample Entropy (SampEn)', { width: 700, height: 290, margin: { top: 18, right: 18, bottom: 55, left: 66 }, xDigits: 1, yDigits: 2, selectedPoint:src, selectedKey });
  }
  function drawCIRelation() {
    const metric = document.getElementById('ciRelationMetric')?.value || 'modulation';
    const xGetter = metric === 'robust' ? row => row.robustVariability : row => row.modulation;
    const xLabel = metric === 'robust' ? 'Variabilidade robusta relativa V_rob (%)' : 'Índice de modulação intrínseco m_int (%)';
    const src=activeBandRow();
    drawScatter('ciMetricPlot', activeBandRows(), xGetter, row => row.ci, xLabel, 'Complexity Index (CI; soma das 8 escalas)', { width: 900, height: 330, xDigits: 2, yDigits: 3, selectedPoint:src, selectedKey:`${src?.source}|${src?.bandIndex}` });
  }
  function drawCISampEnRelation() {
    const rows = activeBandRows().filter(row => Number.isFinite(row.sampen) && Number.isFinite(row.ci));
    const src=activeBandRow();
    drawScatter('ciSampEnPlot', rows, row => row.sampen, row => row.ci,
      'Sample Entropy (SampEn)', 'Complexity Index (CI; soma das 8 escalas)',
      { width: 900, height: 330, xDigits: 3, yDigits: 3, selectedPoint:src, selectedKey:`${src?.source}|${src?.bandIndex}` });
  }
  function drawMultibandGallery() {
    if (!populationMetricsFinished) {
      ['sampenBandMeanPlot','sampenClassDistPlot','sampenModPlot','sampenRobustPlot','fisherPopulationPlot','fisherMetricPlot','ciBandMeanPlot','ciClassDistPlot','ciMetricPlot','ciSampEnPlot']
        .forEach(id => setPopulationPending(id));
      return;
    }
    drawBandMeanChart('sampenBandMeanPlot', 'sampen', 'SampEn média', 3);
    drawClassDistribution('sampenClassDistPlot', 'sampen', 'Sample Entropy (SampEn)', 3);
    drawSampenCorrelations(); drawFisherPopulation(); drawFisherMetricRelation();
    drawBandMeanChart('ciBandMeanPlot', 'ci', 'Complexity Index médio', 3);
    drawClassDistribution('ciClassDistPlot', 'ci', 'Complexity Index (CI)', 3);
    drawCIRelation(); drawCISampEnRelation(); renderClassLegends();
  }
  function initMultibandGallery() {
    const sourceSelect = document.getElementById('multibandSource');
    if (sourceSelect) {
      sourceSelect.innerHTML = MULTIBAND.sources.map(source => `<option value="${escapeXML(source.name)}">${escapeXML(source.name)} · ${escapeXML(source.classLabel)}</option>`).join('');
      sourceSelect.value = MULTIBAND.sources[0].name;
      sourceSelect.addEventListener('change', () => { updateScenarioButtonsForSource(); renderActiveDemo(); });
    }
    const activeBand = document.getElementById('activeBandSelector');
    if(activeBand){activeBand.value='2';activeBand.addEventListener('change',()=>{
      const sensitivity=document.getElementById('sensitivityBand');if(sensitivity&&sensitivity.value!=='all')sensitivity.value=activeBand.value;
      const fisher=document.getElementById('fisherBandFilter');if(fisher&&fisher.value!=='all')fisher.value=activeBand.value;
      renderActiveDemo();
    });}
    const sensitivityBand = document.getElementById('sensitivityBand');
    if (sensitivityBand) {
      sensitivityBand.innerHTML = `<option value="all">Oito bandas · 8 mapas de 50 células</option>` + ENERGY_BANDS.map((band, i) => `<option value="${i}">${escapeXML(band.name)}</option>`).join('');
      sensitivityBand.value = String(activeBandIndex());
      sensitivityBand.addEventListener('change', () => { if(sensitivityBand.value!=='all'&&activeBand)activeBand.value=sensitivityBand.value; if(sensitivityBand.value!=='all')renderActiveDemo();else drawSensitivityMap(sourceFromSelect()); });
    }
    const legend = document.getElementById('bandToggleLegend');
    if (legend) {
      legend.innerHTML = ENERGY_BANDS.map((band, i) => `<button class="band-toggle is-on" type="button" data-band-toggle="${i}" aria-pressed="true"><i style="--band-color:${chartDisplayColor(band.color)}"></i><span>${escapeXML(band.name)}</span></button>`).join('');
      legend.addEventListener('click', event => {
        const button = event.target?.closest?.('[data-band-toggle]'); if(!button)return;
        const index=Number(button.dataset.bandToggle); if(visibleBands.has(index))visibleBands.delete(index);else visibleBands.add(index);
        if(!visibleBands.size){visibleBands.add(index);}
        button.classList.toggle('is-on',visibleBands.has(index));button.setAttribute('aria-pressed',String(visibleBands.has(index)));drawMultibandCurve();
      });
    }
    const fisherBandFilter = document.getElementById('fisherBandFilter');
    if (fisherBandFilter) {
      fisherBandFilter.innerHTML = `<option value="all">Todas as bandas · 192 curvas relacionadas</option>` + ENERGY_BANDS.map((band, i) => `<option value="${i}">${escapeXML(band.name)} · 24 curvas</option>`).join('');
      fisherBandFilter.value = String(activeBandIndex());
      fisherBandFilter.addEventListener('change', () => { if(fisherBandFilter.value!=='all'&&activeBand)activeBand.value=fisherBandFilter.value; if(fisherBandFilter.value==='all')drawFisherPopulation();else renderActiveDemo(); });
    }
    document.getElementById('sensitivityMode')?.addEventListener('change',()=>drawSensitivityMap(sourceFromSelect()));
    document.getElementById('fisherRelationMetric')?.addEventListener('change', drawFisherMetricRelation);
    const sensAll=document.getElementById('sensitivityAllBands');
    if (sensAll) sensAll.addEventListener('click',event=>{const button=event.target?.closest?.('[data-sens-focus]');if(!button)return;const idx=button.dataset.sensFocus;if(sensitivityBand)sensitivityBand.value=idx;if(activeBand)activeBand.value=idx;renderActiveDemo();document.getElementById('tab-sampen')?.click();});
    const sourceHeat=document.getElementById('sampenBandHeatmapPlot');
    if(sourceHeat) {
      sourceHeat.addEventListener('click',event=>{
        const cell=event.target?.closest?.('[data-source-select]');if(!cell)return;
        const chosenSource=cell.dataset.sourceSelect,chosenBand=String(cell.dataset.bandSelect);
        const sourceSelect=document.getElementById('multibandSource');if(sourceSelect)sourceSelect.value=chosenSource;
        if(activeBand)activeBand.value=chosenBand;const sensitivity=document.getElementById('sensitivityBand');if(sensitivity)sensitivity.value=chosenBand;
        const fisher=document.getElementById('fisherBandFilter');if(fisher)fisher.value=chosenBand;
        renderActiveDemo();document.getElementById('tab-sampen')?.click();
        const next=Array.from(sourceHeat.querySelectorAll('[data-source-select]')).find(node=>node.dataset.sourceSelect===chosenSource&&node.dataset.bandSelect===chosenBand);next?.focus();
      });
      sourceHeat.addEventListener('keydown',event=>{
        const cell=event.target?.closest?.('[data-source-select]');if(!cell)return;
        if(event.key==='Enter'||event.key===' '){event.preventDefault();cell.dispatchEvent(new MouseEvent('click',{bubbles:true}));return;}
        if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
        event.preventDefault();
        const rows=MULTIBAND.sources.length,cols=ENERGY_BANDS.length;
        let r=Number(cell.dataset.sourceRow),c=Number(cell.dataset.bandSelect);
        if(event.key==='ArrowLeft')c=Math.max(0,c-1);if(event.key==='ArrowRight')c=Math.min(cols-1,c+1);
        if(event.key==='ArrowUp')r=Math.max(0,r-1);if(event.key==='ArrowDown')r=Math.min(rows-1,r+1);
        if(event.key==='Home')c=0;if(event.key==='End')c=cols-1;
        const target=Array.from(sourceHeat.querySelectorAll('[data-source-select]')).find(node=>Number(node.dataset.sourceRow)===r&&Number(node.dataset.bandSelect)===c);
        if(target){sourceHeat.querySelectorAll('[data-source-select]').forEach(node=>node.setAttribute('tabindex',node===target?'0':'-1'));target.focus();}
      });
    }
    const scaleHeat=document.getElementById('bandScaleHeatmapPlot');
    const focusScaleCell=event=>{
      const cell=event.target?.closest?.('[data-band-select][data-scale-select]');if(!cell)return;
      if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;if(event.type==='keydown')event.preventDefault();
      const idx=String(cell.dataset.bandSelect),tau=Number(cell.dataset.scaleSelect);
      if(activeBand)activeBand.value=idx;const sensitivity=document.getElementById('sensitivityBand');if(sensitivity)sensitivity.value=idx;
      const fisher=document.getElementById('fisherBandFilter');if(fisher)fisher.value=idx;if(Number.isInteger(tau)&&tau>=1&&tau<=SCALES)activeScaleIndex=tau;
      renderActiveDemo();document.getElementById('tab-mse')?.click();
      const next=Array.from(scaleHeat?.querySelectorAll('[data-band-select][data-scale-select]')||[]).find(node=>node.dataset.bandSelect===idx&&Number(node.dataset.scaleSelect)===tau);next?.focus();
    };
    if(scaleHeat){
      scaleHeat.addEventListener('click',focusScaleCell);scaleHeat.addEventListener('keydown',focusScaleCell);
      scaleHeat.addEventListener('keydown',event=>{
        const cell=event.target?.closest?.('[data-band-select][data-scale-select]');if(!cell)return;
        if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
        event.preventDefault();let band=Number(cell.dataset.bandSelect),tau=Number(cell.dataset.scaleSelect);
        if(event.key==='ArrowLeft')tau=Math.max(1,tau-1);if(event.key==='ArrowRight')tau=Math.min(SCALES,tau+1);
        if(event.key==='ArrowUp')band=Math.max(0,band-1);if(event.key==='ArrowDown')band=Math.min(ENERGY_BANDS.length-1,band+1);
        if(event.key==='Home')tau=1;if(event.key==='End')tau=SCALES;
        const target=Array.from(scaleHeat.querySelectorAll('[data-band-select][data-scale-select]')).find(node=>Number(node.dataset.bandSelect)===band&&Number(node.dataset.scaleSelect)===tau);
        if(target){scaleHeat.querySelectorAll('[data-band-select][data-scale-select]').forEach(node=>node.setAttribute('tabindex',node===target?'0':'-1'));target.focus();}
      });
    }
    const fisherTrajectory=document.getElementById('fisherBandTrajectoryPlot');
    const focusFisherBand=event=>{
      const cell=event.target?.closest?.('[data-fisher-band-index]');if(!cell)return;
      if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;if(event.type==='keydown')event.preventDefault();
      const idx=String(cell.dataset.bandSelect);if(activeBand)activeBand.value=idx;
      const sensitivity=document.getElementById('sensitivityBand');if(sensitivity)sensitivity.value=idx;const fisher=document.getElementById('fisherBandFilter');if(fisher)fisher.value=idx;
      renderActiveDemo();document.getElementById('tab-fisher')?.click();
      const next=Array.from(fisherTrajectory?.querySelectorAll('[data-fisher-band-index]')||[]).find(node=>node.dataset.bandSelect===idx);next?.focus();
    };
    if(fisherTrajectory){
      fisherTrajectory.addEventListener('click',focusFisherBand);fisherTrajectory.addEventListener('keydown',focusFisherBand);
      fisherTrajectory.addEventListener('keydown',event=>{
        const cell=event.target?.closest?.('[data-fisher-band-index]');if(!cell||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        event.preventDefault();const points=Array.from(fisherTrajectory.querySelectorAll('[data-fisher-band-index]'));const current=Number(cell.dataset.fisherBandIndex);
        const next=event.key==='Home'?0:event.key==='End'?points.length-1:Math.max(0,Math.min(points.length-1,current+(event.key==='ArrowRight'?1:-1)));
        points.forEach((point,index)=>point.setAttribute('tabindex',index===next?'0':'-1'));points[next]?.focus();
      });
    }
    const sensGridContainer=document.getElementById('sensitivityAllBands');
    if(sensGridContainer){
      sensGridContainer.addEventListener('keydown',event=>{
        const cell=event.target?.closest?.('[data-sens-cell-index]');if(!cell)return;
        if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
        event.preventDefault();let index=Number(cell.dataset.sensCellIndex);
        if(event.key==='ArrowLeft')index=Math.max(0,index-1);if(event.key==='ArrowRight')index=Math.min(49,index+1);
        if(event.key==='ArrowUp')index=Math.max(0,index-10);if(event.key==='ArrowDown')index=Math.min(49,index+10);
        if(event.key==='Home')index=0;if(event.key==='End')index=49;
        const grid=cell.closest('.sensitivity-mini-grid');const target=Array.from(grid?.querySelectorAll('[data-sens-cell-index]')||[]).find(node=>Number(node.dataset.sensCellIndex)===index);
        if(target){grid.querySelectorAll('[data-sens-cell-index]').forEach(node=>node.setAttribute('tabindex',node===target?'0':'-1'));target.focus();}
      });
    }
    document.getElementById('ciRelationMetric')?.addEventListener('change', drawCIRelation);
    renderClassLegends();
    const initialSource = sourceFromSelect();
    ensureSourceCoreMetrics(initialSource);
    ensureRowFisher(initialSource?.bands?.[activeBandIndex()]);
    drawMultibandCurve();
  }
  function initMethodTabs() {
    const tabs = Array.from(document.querySelectorAll('[data-method-tab]'));
    const panels = Array.from(document.querySelectorAll('[data-method-panel]'));
    const activate = key => {
      tabs.forEach(tab => {
        const active = tab.dataset.methodTab === key;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
      });
      panels.forEach(panel => {
        const active = panel.dataset.methodPanel === key;
        panel.classList.toggle('is-active', active);
        panel.hidden = !active;
      });
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activate(tab.dataset.methodTab));
      tab.addEventListener('keydown', event => {
        if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        tabs[next]?.focus();
        activate(tabs[next]?.dataset.methodTab);
      });
    });
    if (tabs.length) activate('sampen');
  }

  const INTERACTIVE_CHART_IDS = [
    'lightcurvePlot','sampenPlot','fisherPlot','msePlot','multibandCurvePlot',
    'sampenBandMeanPlot','sampenClassDistPlot','sampenModPlot','sampenRobustPlot','sampenSensitivityPlot','sampenBandHeatmapPlot',
    'fisherPopulationPlot','fisherMetricPlot','fisherBandTrajectoryPlot','mseBandScalePlot','bandScaleHeatmapPlot','ciBandMeanPlot','ciClassDistPlot','ciMetricPlot','ciSampEnPlot'
  ];

  function readViewBox(svg) {
    const raw=svg.getAttribute('viewBox')||svg.dataset.baseViewBox||'0 0 900 300';const n=raw.trim().split(/[ ,]+/).map(Number);return{x:n[0],y:n[1],w:n[2],h:n[3]};
  }
  function readBaseViewBox(svg) {const n=(svg.dataset.baseViewBox||svg.getAttribute('data-base-viewbox')||svg.getAttribute('viewBox')||'0 0 900 300').trim().split(/[ ,]+/).map(Number);return{x:n[0],y:n[1],w:n[2],h:n[3]};}
  function applyConstantTextSize(svg){
    const base=readBaseViewBox(svg),box=readViewBox(svg),factor=base.w/Math.max(box.w,1e-6);
    svg.querySelectorAll('text').forEach(el=>{
      if(!el.dataset.baseFontSize){const raw=getComputedStyle(el).fontSize||el.getAttribute('font-size')||'10';el.dataset.baseFontSize=parseFloat(raw)||10;}
      const fs=Number(el.dataset.baseFontSize);el.style.fontSize=`${Math.max(6,Math.min(18,fs/factor))}px`;
    });
  }
  function writeViewBox(svg,box){
    const base=readBaseViewBox(svg),w=Math.max(base.w*.08,Math.min(base.w,box.w)),h=Math.max(base.h*.08,Math.min(base.h,box.h));
    const x=Math.max(base.x,Math.min(base.x+base.w-w,box.x)),y=Math.max(base.y,Math.min(base.y+base.h-h,box.y));
    svg.setAttribute('viewBox',`${x} ${y} ${w} ${h}`);applyConstantTextSize(svg);
  }
  function resetViewBox(svg){const base=readBaseViewBox(svg);svg.setAttribute('viewBox',`${base.x} ${base.y} ${base.w} ${base.h}`);svg.querySelectorAll('text').forEach(el=>{el.style.fontSize='';delete el.dataset.baseFontSize;});}
  function zoomSvg(svg,factor,clientX=null,clientY=null,axis='both'){
    const box=readViewBox(svg),rect=svg.getBoundingClientRect();
    const cx=clientX==null||!rect.width?box.x+box.w/2:box.x+(clientX-rect.left)/rect.width*box.w;
    const cy=clientY==null||!rect.height?box.y+box.h/2:box.y+(clientY-rect.top)/rect.height*box.h;
    const w=axis==='y'?box.w:box.w*factor,h=axis==='x'?box.h:box.h*factor;
    writeViewBox(svg,{x:axis==='y'?box.x:cx-(cx-box.x)*(w/box.w),y:axis==='x'?box.y:cy-(cy-box.y)*(h/box.h),w,h});
  }
  function pointInViewBox(svg,event){const box=readViewBox(svg),rect=svg.getBoundingClientRect();return{x:box.x+(event.clientX-rect.left)/Math.max(1,rect.width)*box.w,y:box.y+(event.clientY-rect.top)/Math.max(1,rect.height)*box.h};}
  function activateChart(svg,button){svg.dataset.zoomArmed=svg.dataset.zoomArmed==='true'?'false':'true';const armed=svg.dataset.zoomArmed==='true';svg.classList.toggle('is-armed',armed);svg.style.touchAction=armed?'none':'pan-y';if(button){button.setAttribute('aria-pressed',String(armed));button.textContent=armed?'Zoom ativo':'Ativar zoom';}const hint=svg.closest('.chart-frame')?.parentElement?.querySelector('.chart-tool-hint');if(hint)hint.textContent=armed?'Roda: zoom · arraste: mover · Shift+arraste: ampliar região · Esc: soltar':'Clique em “Ativar zoom” para usar a roda sem prender a rolagem da página.';}
  async function toggleChartFullscreen(target){
    const active=document.fullscreenElement;
    if(active===target){
      if(typeof document.exitFullscreen==='function') await document.exitFullscreen();
      else target.classList.remove('is-fullscreen-fallback');
      return;
    }
    if(target.classList.contains('is-fullscreen-fallback')&&!active){target.classList.remove('is-fullscreen-fallback');return;}
    if(active&&typeof document.exitFullscreen==='function') await document.exitFullscreen();
    document.querySelectorAll('.is-fullscreen-fallback').forEach(element=>element.classList.remove('is-fullscreen-fallback'));
    try{
      if(typeof target.requestFullscreen==='function') await target.requestFullscreen();
      else target.classList.add('is-fullscreen-fallback');
    }catch(_){
      if(!document.fullscreenElement) target.classList.add('is-fullscreen-fallback');
    }
  }
  function exportSvgPng(svg, filename) {
    if (typeof document.createElement !== 'function' || typeof Image === 'undefined') return;

    // Resolve the palette at click time, rather than at chart-render time. This keeps
    // the exported asset aligned with the currently selected UI theme.
    const isLightTheme = document.documentElement.dataset.theme === 'light';
    const palette = isLightTheme ? {
      background: '#FFFFFF',
      grid: '#CBD5E1',
      label: '#334155',
      axis: '#64748B',
      axisTitle: '#334155',
      tooltip: '#0F172A',
      pointStroke: '#FFFFFF',
      bar: '#6D28D9',
      barSoft: '#6D28D9'
    } : {
      background: '#101A2B',
      grid: '#28364D',
      label: '#B8C5DC',
      axis: '#667691',
      axisTitle: '#BDC9DD',
      tooltip: '#ECF2FF',
      pointStroke: '#101C30',
      bar: '#9697FF',
      barSoft: '#9697FF'
    };

    const clone = svg.cloneNode(true);
    const box = readViewBox(svg);
    const width = Math.max(900, Math.round(box.w * 2));
    const height = Math.max(500, Math.round(box.h * 2));
    clone.setAttribute('xmlns', NS);
    clone.setAttribute('width', String(width));
    clone.setAttribute('height', String(height));

    const exportStyle = document.createElementNS
      ? document.createElementNS(NS, 'style')
      : document.createElement('style');
    exportStyle.textContent = `
      .plot-grid { stroke: ${palette.grid}; stroke-width: 1; }
      .plot-label { font-family: Arial, sans-serif; font-size: 13px; fill: ${palette.label}; }
      .plot-axis { stroke: ${palette.axis}; stroke-width: 1; }
      .plot-axis-title { font-family: Arial, sans-serif; font-size: 13px; fill: ${palette.axisTitle}; }
      .plot-tooltip { font-family: Arial, sans-serif; font-size: 14px; fill: ${palette.tooltip}; }
      .plane-point { stroke: ${palette.pointStroke}; stroke-width: 1.5; }
      .interactive-point { stroke-width: .5; }
      .bar-soft { fill: ${palette.barSoft}; opacity: .36; }
      .bar-strong { fill: ${palette.bar}; }
      .plot-point { stroke: ${palette.pointStroke}; stroke-width: 1; }
      .plot-line { fill: none; stroke-linejoin: round; stroke-linecap: round; }
    `;

    // Some SVGs are already drawn before a theme switch and retain explicit colors.
    // Translate known series colors for this export, while leaving heatmap gradients
    // (which encode values) untouched. Explicit light text used on dark backgrounds is
    // darkened in light-theme exports for legibility.
    if (isLightTheme) {
      const lightTextColors = new Map([
        ['#ffffff', '#0F172A'], ['#fff', '#0F172A'], ['white', '#0F172A'],
        ['#91a2bf', '#475569'], ['#aab8d2', '#475569'],
        ['#e8efff', '#334155'], ['#eaf2ff', '#334155'],
        ['#b8c5dc', '#334155'], ['#bdc9dd', '#334155'],
        ['#ecf2ff', '#0F172A']
      ]);
      const recolor = (value, isText, property) => {
        if (!value) return value;
        const normalized = value.trim().toLowerCase();
        if (LIGHT_CHART_COLORS[normalized]) return LIGHT_CHART_COLORS[normalized];
        if (isText && property === 'fill' && lightTextColors.has(normalized)) {
          return lightTextColors.get(normalized);
        }
        if (property === 'stroke' && ['#101a2b', '#101c30', '#0f172a'].includes(normalized)) {
          return '#FFFFFF';
        }
        return value;
      };

      clone.querySelectorAll('*').forEach(element => {
        const isText = String(element.tagName || '').toLowerCase() === 'text';
        ['fill', 'stroke'].forEach(property => {
          const value = element.getAttribute(property);
          if (value) element.setAttribute(property, recolor(value, isText, property));
        });
        const inlineStyle = element.getAttribute('style');
        if (inlineStyle) {
          const updatedStyle = inlineStyle.replace(/(^|;)\s*(fill|stroke)\s*:\s*([^;]+)/gi,
            (match, prefix, property, value) => `${prefix}${property}:${recolor(value, isText, property.toLowerCase())}`);
          if (updatedStyle !== inlineStyle) element.setAttribute('style', updatedStyle);
        }
      });
    }

    // Place the background rectangle before the drawing and the export stylesheet.
    const background = document.createElementNS ? document.createElementNS(NS, 'rect') : null;
    if (background) {
      background.setAttribute('x', String(box.x));
      background.setAttribute('y', String(box.y));
      background.setAttribute('width', String(box.w));
      background.setAttribute('height', String(box.h));
      background.setAttribute('fill', palette.background);
      clone.insertBefore(background, clone.firstChild);
    }
    clone.insertBefore(exportStyle, background ? background.nextSibling : clone.firstChild);

    const svgText = new XMLSerializer().serializeToString(clone);
    const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' }));
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) { URL.revokeObjectURL(url); return; }
      context.fillStyle = palette.background;
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      canvas.toBlob(blob => {
        if (blob) {
          const blobUrl = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = blobUrl;
          anchor.download = filename;
          anchor.click();
          URL.revokeObjectURL(blobUrl);
        }
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
    image.onerror = () => URL.revokeObjectURL(url);
    image.src = url;
  }
  function initializeChartInteractions(){
    if(typeof document.createElement!=='function')return;
    INTERACTIVE_CHART_IDS.forEach(id=>{
      const svg=document.getElementById(id);if(!svg||typeof svg.closest!=='function'||svg.dataset.chartControlsReady==='true')return;
      const frame=svg.closest('.chart-frame');if(!frame||!frame.parentElement)return;
      const base=svg.dataset.renderViewBox||svg.getAttribute('viewBox')||'0 0 900 300';svg.dataset.baseViewBox=base;svg.dataset.chartControlsReady='true';svg.dataset.zoomArmed='false';svg.classList.add('interactive-svg-chart');
      const toolbar=document.createElement('div');toolbar.className='chart-tools';toolbar.setAttribute('role','toolbar');toolbar.setAttribute('aria-label',`Controles de ${id}`);
      const makeButton=(label,title,callback,extra='')=>{const button=document.createElement('button');button.type='button';button.className=`chart-tool-button ${extra}`.trim();button.textContent=label;button.title=title;button.setAttribute('aria-label',title);button.addEventListener('click',callback);toolbar.appendChild(button);return button;};
      const activate=makeButton('Ativar zoom','Ativar/desativar zoom por roda e arraste',()=>activateChart(svg,activate),'chart-tool-activate');
      makeButton('−','Diminuir zoom',()=>zoomSvg(svg,1.25));makeButton('+','Aumentar zoom',()=>zoomSvg(svg,.8));makeButton('Reset','Restaurar escala original',()=>resetViewBox(svg),'chart-tool-reset');
      makeButton('Tela cheia','Abrir ou fechar este gráfico em tela cheia',()=>{const target=svg.closest('.multiband-chart-card,.demo-panel,.demo-primary-chart,.multiband-source-panel')||frame.parentElement;void toggleChartFullscreen(target);},'chart-tool-fullscreen');
      makeButton('PNG','Salvar imagem deste gráfico como PNG',()=>exportSvgPng(svg,`blazarlab-${id.replace(/[^a-z0-9_-]/gi,'-')}.png`),'chart-tool-download');
      const hint=document.createElement('span');hint.className='chart-tool-hint';hint.textContent='Clique em “Ativar zoom” para usar a roda sem prender a rolagem da página.';toolbar.appendChild(hint);frame.parentElement.insertBefore(toolbar,frame);
      ensureChartTable(svg);
      let drag=null;const pointers=new Map();let pinch=null;let selectionRect=null;
      svg.addEventListener('wheel',event=>{if(svg.dataset.zoomArmed!=='true'&&!event.ctrlKey)return;event.preventDefault();const rect=svg.getBoundingClientRect(),rx=(event.clientX-rect.left)/Math.max(1,rect.width),ry=(event.clientY-rect.top)/Math.max(1,rect.height);const axis=ry>.88?'x':rx<.1?'y':'both';zoomSvg(svg,event.deltaY<0?.88:1.14,event.clientX,event.clientY,axis);},{passive:false});
      svg.addEventListener('dblclick',event=>{event.preventDefault();resetViewBox(svg);});
      svg.addEventListener('pointerdown',event=>{
        pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
        if(svg.dataset.zoomArmed!=='true'&&!event.ctrlKey){pointers.delete(event.pointerId);return;}
        if(pointers.size>=2){const ps=[...pointers.values()],dx=ps[1].x-ps[0].x,dy=ps[1].y-ps[0].y;pinch={distance:Math.hypot(dx,dy),box:readViewBox(svg),center:{x:(ps[0].x+ps[1].x)/2,y:(ps[0].y+ps[1].y)/2}};drag=null;return;}
        if(event.button!==0&&event.pointerType!=='touch')return;
        const rect=svg.getBoundingClientRect(),box=readViewBox(svg),point=pointInViewBox(svg,event);
        drag={x:event.clientX,y:event.clientY,box,rect,point,shift:event.shiftKey,moved:false};
        if(event.shiftKey){selectionRect=document.createElementNS(NS,'rect');selectionRect.setAttribute('class','zoom-selection-rect');selectionRect.setAttribute('x',point.x);selectionRect.setAttribute('y',point.y);selectionRect.setAttribute('width','0');selectionRect.setAttribute('height','0');svg.appendChild(selectionRect);}
        else svg.classList.add('is-panning');
        try{svg.setPointerCapture(event.pointerId);}catch(_){}
        if(event.pointerType!=='touch')event.preventDefault();
      });
      svg.addEventListener('pointermove',event=>{
        if(pointers.has(event.pointerId))pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
        if(pinch&&pointers.size>=2){const ps=[...pointers.values()],dx=ps[1].x-ps[0].x,dy=ps[1].y-ps[0].y,dist=Math.max(8,Math.hypot(dx,dy)),factor=pinch.distance/dist;const center={x:(ps[0].x+ps[1].x)/2,y:(ps[0].y+ps[1].y)/2};const baseBox=pinch.box;const cur=readViewBox(svg);const ax=pointInViewBox(svg,{clientX:center.x,clientY:center.y}).x,ay=pointInViewBox(svg,{clientX:center.x,clientY:center.y}).y;zoomSvg(svg,factor,center.x,center.y);pinch.distance=dist;pinch.box=readViewBox(svg);pinch.center=center;return;}
        if(!drag)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;drag.moved ||= Math.abs(dx)+Math.abs(dy)>3;
        if(drag.shift&&selectionRect){const now=pointInViewBox(svg,event);selectionRect.setAttribute('x',Math.min(drag.point.x,now.x));selectionRect.setAttribute('y',Math.min(drag.point.y,now.y));selectionRect.setAttribute('width',Math.abs(now.x-drag.point.x));selectionRect.setAttribute('height',Math.abs(now.y-drag.point.y));return;}
        if(svg.dataset.zoomArmed==='true'||event.ctrlKey){const vx=dx*drag.box.w/Math.max(1,drag.rect.width),vy=dy*drag.box.h/Math.max(1,drag.rect.height);writeViewBox(svg,{x:drag.box.x-vx,y:drag.box.y-vy,w:drag.box.w,h:drag.box.h});}
      });
      const stopDrag=()=>{if(drag?.shift&&selectionRect){const w=Number(selectionRect.getAttribute('width')),h=Number(selectionRect.getAttribute('height'));if(w>8&&h>8)writeViewBox(svg,{x:Number(selectionRect.getAttribute('x')),y:Number(selectionRect.getAttribute('y')),w,h});selectionRect.remove();selectionRect=null;}drag=null;pinch=null;svg.classList.remove('is-panning');};
      svg.addEventListener('pointerup',event=>{pointers.delete(event.pointerId);if(pointers.size<2)pinch=null;stopDrag();});svg.addEventListener('pointercancel',event=>{pointers.delete(event.pointerId);stopDrag();});svg.addEventListener('lostpointercapture',stopDrag);
      svg.addEventListener('keydown',event=>{if(event.target!==svg)return;if(['+','=','-','0','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();if(event.key==='0')resetViewBox(svg);else if(event.key==='+'||event.key==='=')zoomSvg(svg,.8);else if(event.key==='-')zoomSvg(svg,1.25);else{const box=readViewBox(svg);const dx=box.w*.08,dy=box.h*.08;writeViewBox(svg,{x:box.x+(event.key==='ArrowLeft'?-dx:event.key==='ArrowRight'?dx:0),y:box.y+(event.key==='ArrowUp'?-dy:event.key==='ArrowDown'?dy:0),w:box.w,h:box.h});}}});
      svg.setAttribute('tabindex','0');
      const help=document.createElement('span');help.id=`${id}-chart-help`;help.className='sr-only';
      const keyboardHelp = id==='sampenBandHeatmapPlot' ? 'Matriz interativa. Use as setas para percorrer fontes e bandas; Enter ou Espaço seleciona a célula. Com foco no próprio gráfico, mais, menos, zero e setas controlam o zoom e o deslocamento.'
        : id==='bandScaleHeatmapPlot' ? 'Matriz interativa. Use as setas para percorrer bandas e escalas; Enter ou Espaço seleciona a célula. Com foco no próprio gráfico, mais, menos, zero e setas controlam o zoom e o deslocamento.'
        : id==='fisherBandTrajectoryPlot' ? 'Pontos selecionáveis por banda. Use as setas esquerda e direita para percorrer as bandas; Enter ou Espaço seleciona. Com foco no próprio gráfico, mais, menos, zero e setas controlam o zoom e o deslocamento.'
        : 'Ative o zoom para usar a roda; arraste para mover e use Shift mais arraste para ampliar uma região. Duplo clique restaura. Com foco no próprio gráfico, mais, menos, zero e setas controlam zoom e deslocamento.';
      help.textContent=keyboardHelp;frame.insertAdjacentElement('afterend',help);
      const describedBy = new Set((svg.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));describedBy.add(help.id);svg.setAttribute('aria-describedby',[...describedBy].join(' '));
    });
    if (!document.documentElement.dataset.chartGlobalHandlers) {
      document.documentElement.dataset.chartGlobalHandlers='true';
      document.addEventListener('keydown',event=>{if(event.key==='Escape'){document.querySelectorAll('.is-fullscreen-fallback').forEach(element=>element.classList.remove('is-fullscreen-fallback'));document.querySelectorAll('.interactive-svg-chart.is-armed').forEach(svg=>{svg.dataset.zoomArmed='false';svg.classList.remove('is-armed');svg.style.touchAction='pan-y';const button=svg.closest('.chart-frame')?.parentElement?.querySelector('.chart-tool-activate');if(button){button.textContent='Ativar zoom';button.setAttribute('aria-pressed','false');}const hint=svg.closest('.chart-frame')?.parentElement?.querySelector('.chart-tool-hint');if(hint)hint.textContent='Clique em “Ativar zoom” para usar a roda sem prender a rolagem da página.';});}});
      document.addEventListener('pointerdown',event=>{if(event.target?.closest?.('.interactive-svg-chart,.chart-tools'))return;document.querySelectorAll('.interactive-svg-chart.is-armed').forEach(svg=>{svg.dataset.zoomArmed='false';svg.classList.remove('is-armed');svg.style.touchAction='pan-y';const button=svg.closest('.chart-frame')?.parentElement?.querySelector('.chart-tool-activate');if(button){button.textContent='Ativar zoom';button.setAttribute('aria-pressed','false');}});});
    }
  }

  let currentKey = 'smooth';
  function selectScenario(key, updateHash = false) {
    if (!scenarioInfo[key]) return;
    currentKey = key;
    const sourceClass = key === 'flares' ? 'BL Lac' : key === 'multiscale' ? 'AGN' : 'FSRQ';
    const sourceSelect=document.getElementById('multibandSource');
    if(sourceSelect){const match=MULTIBAND.sources.find(source=>source.classKey===sourceClass);if(match)sourceSelect.value=match.name;}
    document.querySelectorAll('[data-scenario]').forEach(button=>{const active=button.dataset.scenario===key;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));});
    renderActiveDemo();
    if(updateHash&&typeof history!=='undefined'&&history.replaceState)history.replaceState(null,'','#explorar');
  }
  function initThemeSwitcher(onThemeChanged) {
    const buttons = document.querySelectorAll('[data-theme-choice]');
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    let initialTheme = 'dark';
    try {
      const savedTheme = window.localStorage.getItem('blazarlab-theme');
      if (savedTheme === 'light' || savedTheme === 'dark') initialTheme = savedTheme;
    } catch (_) {
      // Storage can be unavailable in private browsing or restricted contexts.
    }

    function applyTheme(theme, persist = true) {
      const selectedTheme = theme === 'light' ? 'light' : 'dark';
      const previousTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      document.documentElement.setAttribute('data-theme', selectedTheme);
      buttons.forEach(button => {
        const active = button.dataset.themeChoice === selectedTheme;
        button.setAttribute('aria-pressed', String(active));
      });
      if (themeMeta) themeMeta.setAttribute('content', selectedTheme === 'light' ? '#FFFFFF' : '#0A1120');
      if (persist) {
        try { window.localStorage.setItem('blazarlab-theme', selectedTheme); }
        catch (_) { /* The theme remains active for this page even if it cannot be saved. */ }
        if (previousTheme !== selectedTheme && typeof onThemeChanged === 'function') onThemeChanged(selectedTheme);
      }
    }

    applyTheme(initialTheme, false);
    buttons.forEach(button => button.addEventListener('click', () => applyTheme(button.dataset.themeChoice)));
  }

  function initNavigation() {
    const toggle=document.getElementById('navToggle'),nav=document.getElementById('siteNav');
    if (toggle && nav) {
      const label = toggle.querySelector('.sr-only');
      const closeNavigation = (returnFocus = false) => {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded','false');
        if (label) label.textContent = 'Abrir navegação';
        if (returnFocus) toggle.focus();
      };
      toggle.addEventListener('click',()=>{
        const opened=nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded',String(opened));
        if (label) label.textContent = opened ? 'Fechar navegação' : 'Abrir navegação';
      });
      nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>closeNavigation(false)));
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && nav.classList.contains('is-open')) { event.preventDefault(); event.stopImmediatePropagation(); closeNavigation(true); }
      });
      document.addEventListener('pointerdown', event => {
        if (!nav.classList.contains('is-open')) return;
        if (event.target?.closest?.('#siteNav, #navToggle')) return;
        closeNavigation(false);
      });
      window.addEventListener('resize', () => {
        if (window.innerWidth > 780 && nav.classList.contains('is-open')) closeNavigation(false);
      });
    }
    document.querySelectorAll('[data-scenario]').forEach(button=>button.addEventListener('click',()=>selectScenario(button.dataset.scenario,true)));
    document.querySelectorAll('[data-jump-scenario]').forEach(link=>link.addEventListener('click',()=>selectScenario(link.dataset.jumpScenario,true)));
    document.querySelectorAll('[data-focus-chart]').forEach(button=>button.addEventListener('click',()=>{
      const tabKey=button.dataset.focusTab,chartId=button.dataset.focusChart;
      const tab=document.querySelector(`[data-method-tab="${tabKey}"]`);if(tab)tab.click();
      const chart=document.getElementById(chartId);if(chart){chart.scrollIntoView({behavior:document.documentElement.classList.contains('reduce-motion')?'auto':'smooth',block:'center'});const card=chart.closest('.multiband-chart-card');if(card){card.classList.add('chart-focus-highlight');setTimeout(()=>card.classList.remove('chart-focus-highlight'),1500);} }
    }));
  }
  function methodSimulationMarkup(method) {
    if (method === 'sampen') return `<div class="method-simulation simulation-sampen" role="status"><div class="simulation-heading"><strong>Comparação de padrões</strong><span>Exemplo didático · tolerância r fixa</span></div><div class="pattern-band"><b>B</b><span class="pattern-points"><i></i><i></i><i></i></span><span>Coincidem em m pontos</span><em>12 pares</em></div><div class="pattern-band pattern-band-a"><b>A</b><span class="pattern-points"><i></i><i></i><i></i><i></i></span><span>Continuam coincidindo em m+1</span><em>4 pares</em></div><div class="simulation-equation">SampEn = −ln(A/B) = −ln(4/12) ≈ 1,10</div><p>Os pares de A são um subconjunto dos pares de B. Quanto menor a fração A/B, maior a SampEn. Contagens ilustrativas, não calculadas dos dados observacionais.</p></div>`;
    if (method === 'fisher') return `<div class="method-simulation simulation-fisher" role="status"><div class="simulation-heading"><strong>Da curva à distribuição</strong><span>Dois aspectos complementares</span></div><svg viewBox="0 0 320 112" aria-label="Distribuição esquemática com região de gradiente destacada"><path class="simulation-axis" d="M12 91H308M12 16V91"/><path class="simulation-density" d="M12 90 C60 90 73 84 101 48 S145 14 163 38 S191 82 221 88 S275 90 308 90"/><path class="simulation-gradient" d="M75 83 C91 69 95 57 101 48 S125 21 139 20"/><text x="15" y="12">densidade do fluxo</text><text x="166" y="107">valor do fluxo →</text></svg><div class="simulation-two-metrics"><span><b>Shannon</b> — espalhamento global</span><span><b>Fisher</b> — variação local da densidade</span></div><p>O formato global e os gradientes locais fornecem informações diferentes; a estimativa depende também do alisamento da densidade.</p></div>`;
    return `<div class="method-simulation simulation-mse" role="status"><div class="simulation-heading"><strong>Uma série, várias escalas</strong><span>Agregação por blocos</span></div><div class="scale-row"><b>τ = 1</b><span class="scale-samples fast-samples">▁▆▂▇▃▅▁▆▂▇▃▅</span><small>mais detalhes</small></div><div class="scale-row"><b>τ = 2</b><span class="scale-samples mid-samples">▃▅▅▃▃▅</span><small>blocos de 2</small></div><div class="scale-row"><b>τ = 4</b><span class="scale-samples slow-samples">▄▅▄▅</span><small>mais agregação</small></div><div class="simulation-equation">WPE(τ) → curva multiescala → CI</div><p>A WPE descreve padrões ordinais ponderados em cada escala; o índice CI resume a curva conforme a convenção escolhida.</p></div>`;
  }
  function initMethodVisualAnimations() {
    const buttons = document.querySelectorAll('.method-visual-trigger');
    const status = document.getElementById('methodAnimationStatus');
    let cleanupTimer = null;
    let activeButton = null;
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const card = button.closest('.method-card');
        const method = button.dataset.animationTarget || 'sampen';
        const methodName = button.dataset.methodName || card?.querySelector('.method-name')?.textContent?.trim() || 'método científico';
        if (cleanupTimer) clearTimeout(cleanupTimer);
        buttons.forEach(other => other.classList.remove('is-playing'));
        document.querySelectorAll('.method-card').forEach(other => other.classList.remove('is-animation-active'));
        document.querySelectorAll('.method-simulation').forEach(panel => panel.remove());
        button.classList.remove('is-playing'); void button.offsetWidth; button.classList.add('is-playing');
        card?.classList.add('is-animation-active');
        const opensDetailedSimulation = button.classList.contains('method-visual-trigger-chart');
        if (opensDetailedSimulation && card && typeof document.createElement === 'function') {
          const panel = document.createElement('div'); panel.innerHTML = methodSimulationMarkup(method);
          const simulation = panel.firstElementChild;
          const anchor = card.querySelector('.method-visual');
          if (simulation) { if (anchor) anchor.before(simulation); else card.append(simulation); simulation.classList.add('simulation-entering'); }
        }
        if (status) status.textContent = opensDetailedSimulation
          ? `Simulação científica de ${methodName} exibida.`
          : `Animação visual breve de ${methodName}. Toque no diagrama para explorar a simulação do método.`;
        activeButton = button;
        cleanupTimer = setTimeout(() => {
          activeButton?.classList.remove('is-playing');
          card?.classList.remove('is-animation-active');
          cleanupTimer = null; activeButton = null;
        }, document.documentElement.classList.contains('reduce-motion') ? 220 : 1050);
      });
    });
    document.querySelectorAll('.method-card').forEach(card => {
      card.addEventListener('click', event => {
        if (event.target.closest('button,a,summary,details')) return;
        card.querySelector('.method-icon')?.click();
      });
      card.addEventListener('keydown', event => {
        if (event.target !== card || !['Enter',' '].includes(event.key)) return;
        event.preventDefault(); card.querySelector('.method-icon')?.click();
      });
    });
    document.querySelectorAll('[data-learning-animation]').forEach(button => button.addEventListener('click', () => {
      const step = button.closest('.learning-step'); if (!step) return;
      step.classList.remove('learning-is-playing'); void step.offsetWidth; step.classList.add('learning-is-playing');
      step.querySelector('.learning-animation-note')?.remove();
      const note = document.createElement('p'); note.className = 'learning-animation-note';
      note.textContent = button.dataset.learningAnimation === 'blazar' ? 'O jato aponta aproximadamente para o observador: o brilho pode ser intensificado por efeitos relativísticos.' : 'A curva de luz representa o fluxo medido ao longo do tempo; surtos e mudanças de ritmo motivam a análise.';
      button.before(note);
      if (document.documentElement.classList.contains('reduce-motion')) step.classList.remove('learning-is-playing');
    }));
  }
  function initActiveNavigation() {
    const nav = document.getElementById('siteNav');
    if (!nav || !('IntersectionObserver' in window)) return;
    const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
    const sections = links.map(link => document.getElementById(link.getAttribute('href').slice(1))).filter(Boolean);
    const updateActive = () => {
      const marker = Math.min(window.innerHeight * 0.42, 360);
      const candidates = sections.map(section => ({section, rect: section.getBoundingClientRect()}))
        .filter(item => item.rect.top <= marker && item.rect.bottom > 105)
        .sort((a, b) => Math.abs(a.rect.top - 105) - Math.abs(b.rect.top - 105));
      const activeId = candidates[0]?.section.id;
      links.forEach(link => {
        const active = link.getAttribute('href') === `#${activeId}`;
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    };
    const observer = new IntersectionObserver(updateActive, {rootMargin: '-12% 0px -68% 0px', threshold: [0, .1, .35, .65, 1]});
    sections.forEach(section => observer.observe(section));
    window.addEventListener('scroll', updateActive, {passive: true});
    window.addEventListener('resize', updateActive, {passive: true});
    updateActive();
  }

  function init() {
    initThemeSwitcher(() => {
      const legend = document.getElementById('bandToggleLegend');
      legend?.querySelectorAll?.('[data-band-toggle]').forEach(button => {
        const band = ENERGY_BANDS[Number(button.dataset.bandToggle)];
        const swatch = button.querySelector('i');
        if (band && swatch) swatch.style.setProperty('--band-color', chartDisplayColor(band.color));
      });
      renderActiveDemo();
      renderClassLegends();
    });
    initNavigation();
    initActiveNavigation();
    initMethodVisualAnimations();
    initMultibandGallery();
    initMethodTabs();
    selectScenario('smooth');
    initializeChartInteractions();
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotionPreference = () => document.documentElement.classList.toggle('reduce-motion', motionPreference.matches);
    syncMotionPreference();
    if (typeof motionPreference.addEventListener === 'function') motionPreference.addEventListener('change', syncMotionPreference);
    // SVG roots own their handlers and toolbars. A normal resize (including fullscreen
    // enter/exit) must not rebuild those controls or reset their armed state. The plotting
    // geometry only changes at the compact/mobile breakpoint, so rerender only when that
    // breakpoint is crossed; setSvg updates viewBox while preserving the existing handlers.
    let resizeTimer=null;
    let compactViewport=Number(window.innerWidth||1280)<900;
    if (typeof ResizeObserver === 'function') {
      const lastContainerModes = new WeakMap();
      const geometryObserver = new ResizeObserver(entries => {
        let geometryChanged = false;
        entries.forEach(entry => {
          const svg = entry.target.querySelector('svg[id]');
          if (!svg) return;
          const compact = entry.contentRect.width < 900;
          const previous = lastContainerModes.get(entry.target);
          if (previous !== undefined && previous !== compact) geometryChanged = true;
          lastContainerModes.set(entry.target, compact);
        });
        if (geometryChanged) {
          clearTimeout(resizeTimer);
          resizeTimer=setTimeout(()=>{renderActiveDemo();},120);
        }
      });
      document.querySelectorAll('.chart-frame').forEach(frame => geometryObserver.observe(frame));
    }
    window.addEventListener('resize',()=>{
      // ResizeObserver handles chart containers; this fallback covers older engines.
      if (typeof ResizeObserver === 'function') return;
      const nextCompact=Number(window.innerWidth||1280)<900;
      if(nextCompact===compactViewport)return;
      compactViewport=nextCompact;
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(()=>{renderActiveDemo();},180);
    });
    populationMetricsStatus('Calculando as métricas da população sintética em segundo plano; a fonte selecionada já está disponível.');
    schedulePopulationMetricsBatch();
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !populationMetricsFinished) schedulePopulationMetricsBatch();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
