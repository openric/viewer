/*
 * Copyright (C) 2026 Johan Pieterse / Plain Sailing Information Systems
 * Email: johan@plainsailingisystems.co.za
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Node-hover tooltip, baked into the viewer as of v0.2.0.
 * Exposed for both 2D (cytoscape) and 3D (ForceGraph3D) via init2D/init3D.
 *
 * Opt-in via `tooltip: true` or `tooltip: { render: fn }`. Set `tooltip: false`
 * to disable. Default is `true` (on) — matches the viewer.openric.org demo.
 */

import { getColour } from './colours.js';

const TOOLTIP_ID = 'openric-viewer-tooltip';
const STYLE_ID = 'openric-viewer-tooltip-style';

const STYLESHEET = `
  .openric-viewer-tooltip {
    position: fixed; pointer-events: none; z-index: 100000;
    background: rgba(15, 23, 42, 0.97); color: #e5e7eb;
    border: 1px solid #334155; border-radius: 6px;
    padding: 0.55rem 0.75rem; font-size: 0.82rem; line-height: 1.4;
    max-width: 360px; box-shadow: 0 4px 12px rgba(0,0,0,0.35);
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    display: none;
  }
  .openric-viewer-tooltip .orv-label { font-weight: 600; font-size: 0.92rem; margin-bottom: 0.25rem; word-break: break-word; }
  .openric-viewer-tooltip .orv-type { display: inline-block; padding: 0.05rem 0.45rem; border-radius: 999px; font-size: 0.7rem; margin-bottom: 0.4rem; color: #fff; }
  .openric-viewer-tooltip dl { margin: 0.3rem 0 0 0; display: grid; grid-template-columns: auto 1fr; gap: 0.15rem 0.6rem; }
  .openric-viewer-tooltip dt { color: #9ca3af; font-size: 0.72rem; }
  .openric-viewer-tooltip dd { margin: 0; font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 0.72rem; word-break: break-all; }
  .openric-viewer-tooltip .orv-hint { margin-top: 0.45rem; color: #9ca3af; font-size: 0.72rem; font-style: italic; }
`;

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function ensureStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = STYLESHEET;
  document.head.appendChild(el);
}

function ensureElement() {
  if (typeof document === 'undefined') return null;
  let el = document.getElementById(TOOLTIP_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = TOOLTIP_ID;
    el.className = 'openric-viewer-tooltip';
    el.setAttribute('role', 'tooltip');
    document.body.appendChild(el);
  }
  return el;
}

/**
 * Default render function for the tooltip body. Receives the hovered node;
 * returns an HTML string. Override via `tooltip: { render: fn }`.
 */
export function defaultRender(node) {
  if (!node) return '';
  const known = new Set(['id', 'label', 'name', 'type', 'color', 'colour', 'val', 'x', 'y', 'z', 'vx', 'vy', 'vz', 'fx', 'fy', 'fz', 'index', '__indexColor', '__threeObj', '__lineObj']);
  const colour = getColour(node); // pass whole node — dual-read across spec v0.37 boundary
  const shortType = node.type || 'Unknown';
  const ricoType = /^rico:|:\/\//.test(shortType) ? shortType : `rico:${shortType}`;
  const extras = [];
  for (const [k, v] of Object.entries(node)) {
    if (known.has(k)) continue;
    if (v == null || v === '') continue;
    if (typeof v === 'object') continue;
    extras.push({ k, v });
  }
  const extraDl = extras.length
    ? `<dl>${extras.map(e => `<dt>${escapeHtml(e.k)}</dt><dd>${escapeHtml(e.v)}</dd>`).join('')}</dl>`
    : '';
  return `
    <div class="orv-label">${escapeHtml(node.label || node.name || 'Unknown')}</div>
    <span class="orv-type" style="background:${colour};">${escapeHtml(shortType)}</span>
    <dl>
      <dt>RiC-O type</dt><dd>${escapeHtml(ricoType)}</dd>
      <dt>id</dt><dd>${escapeHtml(node.id)}</dd>
    </dl>
    ${extraDl}
    <div class="orv-hint">Click to drill into this node's subgraph</div>
  `;
}

/**
 * Build a tooltip controller for a viewer instance. Returns {show, hide, remove}.
 *
 * @param {object} options
 * @param {Function} [options.render]  Custom renderer `(node) => html`. Defaults to defaultRender.
 */
export function createTooltip(options = {}) {
  ensureStyles();
  const el = ensureElement();
  const render = typeof options.render === 'function' ? options.render : defaultRender;

  function show(clientX, clientY, node) {
    if (!el) return;
    el.innerHTML = render(node);
    el.style.display = 'block';
    // Position into viewport
    const pad = 14;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let x = clientX + pad;
    let y = clientY + pad;
    if (x + w > window.innerWidth - 10) x = clientX - w - pad;
    if (y + h > window.innerHeight - 10) y = clientY - h - pad;
    el.style.left = Math.max(4, x) + 'px';
    el.style.top = Math.max(4, y) + 'px';
  }

  function hide() {
    if (el) el.style.display = 'none';
  }

  function remove() {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  return { show, hide, remove };
}

/**
 * Resolve the user's `tooltip` option into a renderer or null (disabled).
 */
export function resolveTooltip(tooltipOption) {
  if (tooltipOption === false) return null;
  if (tooltipOption === true || tooltipOption == null) return createTooltip();
  if (typeof tooltipOption === 'object') return createTooltip(tooltipOption);
  return null;
}
