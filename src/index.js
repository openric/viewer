/*
 * Copyright (C) 2026 Johan Pieterse / Plain Sailing Information Systems
 * Email: johan@plainsailingisystems.co.za
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * @openric/viewer — standalone 2D/3D graph viewer for OpenRiC-conformant
 * servers. Part of the OpenRiC specification ecosystem
 * (https://openric.org). Ported from the Heratio reference implementation.
 */

import { COLOURS, getColour } from './colours.js';
import { fromSubgraph, fetchSubgraph } from './adapt-subgraph.js';
import { init2D } from './viewer-2d.js';
import { init3D } from './viewer-3d.js';

/**
 * Mount an OpenRiC viewer in a DOM element.
 *
 * @param {HTMLElement} element   Container element
 * @param {Object}  config
 * @param {string}  config.server       OpenRiC API base URL
 * @param {string}  config.start        Initial root URI or path (e.g. "/records/slug")
 * @param {'2d'|'3d'} [config.mode]    Viewer mode (default '2d')
 * @param {number}  [config.depth]      Subgraph depth (default 2)
 * @param {Function} [config.onNodeClick] Called with clicked node data
 * @param {Object}  [config.libs]       Inject libs: {cytoscape, ForceGraph3D, SpriteText}
 * @returns {{unmount(): void, setRoot(uri: string): Promise<void>, setMode(m: '2d'|'3d'): Promise<void>}}
 */
export function mount(element, config) {
  if (!element || typeof element !== 'object') {
    throw new Error('[openric-viewer] mount(element, config): element is required');
  }
  if (!config || !config.server) {
    throw new Error('[openric-viewer] mount(element, config): config.server is required');
  }

  let mode = config.mode === '3d' ? '3d' : '2d';
  let root = config.start || '/';
  let depth = config.depth || 2;
  let instance = null;

  async function render() {
    element.innerHTML = '';
    const graph = await fetchSubgraph(config.server, root, depth);
    const opts = {
      onNodeClick: config.onNodeClick,
      ...(config.libs || {}),
    };
    instance = mode === '3d'
      ? init3D(element, graph, opts)
      : init2D(element, graph, opts);
  }

  render().catch((e) => {
    console.error('[openric-viewer] initial render failed:', e);
    element.innerHTML = `<div style="padding:1rem;color:#b91c1c;font-family:sans-serif;">Failed to load OpenRiC graph: ${e.message}</div>`;
  });

  return {
    unmount() {
      if (instance && typeof instance.destroy === 'function') instance.destroy();
      element.innerHTML = '';
      instance = null;
    },
    async setRoot(uri) {
      root = uri;
      await render();
    },
    async setMode(newMode) {
      mode = newMode === '3d' ? '3d' : '2d';
      await render();
    },
  };
}

export { COLOURS, getColour, fromSubgraph, fetchSubgraph, init2D, init3D };

if (typeof window !== 'undefined') {
  window.OpenricViewer = { mount, COLOURS, getColour, fromSubgraph, fetchSubgraph, init2D, init3D };
}
