/*
 * Copyright (C) 2026 Johan Pieterse / Plain Sailing Information Systems
 * Email: johan@plainsailingisystems.co.za
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { getColour } from './colours.js';
import { fromSubgraph } from './adapt-subgraph.js';

/**
 * Initialise a 2D Cytoscape graph.
 *
 * Requires `cytoscape` to be resolvable — either as an ES import
 * (passed via `options.cytoscape`) or present on `window.cytoscape`.
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
    return instance;
  } catch (e) {
    console.error('[openric-viewer] 2D init error:', e);
    return null;
  }
}
