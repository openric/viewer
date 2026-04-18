/*
 * Copyright (C) 2026 Johan Pieterse / Plain Sailing Information Systems
 * Email: johan@plainsailingisystems.co.za
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { getColour } from './colours.js';
import { fromSubgraph } from './adapt-subgraph.js';
import { resolveTooltip } from './tooltip.js';

/**
 * Initialise a 2D Cytoscape graph.
 *
 * Requires `cytoscape` to be resolvable — either as an ES import
 * (passed via `options.cytoscape`) or present on `window.cytoscape`.
 *
 * Options:
 *   onNodeClick(data)       — click handler, called with node data
 *   onNodeHover(data|null)  — optional hover handler, in addition to tooltip
 *   tooltip                 — true|false|{render: fn}. Default: true.
 */
export function init2D(container, graphData, options = {}) {
  const { nodes, edges } = fromSubgraph(graphData);
  if (!nodes.length) return null;

  const cy = options.cytoscape || (typeof window !== 'undefined' && window.cytoscape);
  if (!cy) {
    console.error('[openric-viewer] cytoscape not found. Pass via options.cytoscape or load cytoscape.min.js before the viewer.');
    return null;
  }

  const nodeSize = options.nodeSize || 28;
  const fontSize = options.fontSize || '10px';
  const maxLabelLen = options.maxLabelLen || 30;

  const elements = [];
  for (const node of nodes) {
    elements.push({
      data: {
        id: node.id,
        label: node.label ? String(node.label).substring(0, maxLabelLen) : 'Unknown',
        type: node.type,
        colour: getColour(node.type),
        atomUrl: node.atomUrl || null,
      },
    });
  }
  edges.forEach((edge, idx) => {
    elements.push({
      data: {
        id: `e${idx}`,
        source: edge.source,
        target: edge.target,
        label: edge.label || edge.predicate || '',
      },
    });
  });

  try {
    const instance = cy({
      container,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(colour)',
            label: 'data(label)',
            color: '#eee',
            'font-size': fontSize,
            'text-valign': 'bottom',
            'text-margin-y': '5px',
            width: `${nodeSize}px`,
            height: `${nodeSize}px`,
            'text-wrap': 'ellipsis',
            'text-max-width': '120px',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 1,
            'line-color': '#6b7280',
            'target-arrow-color': '#6b7280',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-size': '7px',
            color: '#9ca3af',
            'text-rotation': 'autorotate',
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: false,
        nodeRepulsion: () => options.nodeRepulsion || 5000,
        idealEdgeLength: options.idealEdgeLength || 90,
        padding: options.padding || 20,
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });

    if (typeof options.onNodeClick === 'function') {
      instance.on('tap', 'node', (evt) => options.onNodeClick(evt.target.data()));
    }

    // Hover tooltip (v0.2.0). Render from the raw subgraph node so we keep
    // the untruncated label + any extras the API returned.
    const nodeById = new Map(nodes.map(n => [n.id, n]));
    const tooltip = resolveTooltip(options.tooltip);
    if (tooltip) {
      let lastMouse = { x: 0, y: 0 };
      const track = (e) => { lastMouse = { x: e.clientX, y: e.clientY }; };
      window.addEventListener('mousemove', track);

      instance.on('mouseover', 'node', (evt) => {
        const id = evt.target.data('id');
        const src = nodeById.get(id) || evt.target.data();
        tooltip.show(lastMouse.x, lastMouse.y, src);
        if (typeof options.onNodeHover === 'function') options.onNodeHover(src);
      });
      instance.on('mouseout', 'node', () => {
        tooltip.hide();
        if (typeof options.onNodeHover === 'function') options.onNodeHover(null);
      });

      const origDestroy = instance.destroy.bind(instance);
      instance.destroy = () => {
        window.removeEventListener('mousemove', track);
        tooltip.hide();
        return origDestroy();
      };
    }

    return instance;
  } catch (e) {
    console.error('[openric-viewer] 2D init error:', e);
    return null;
  }
}
