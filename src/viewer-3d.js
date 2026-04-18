/*
 * Copyright (C) 2026 Johan Pieterse / Plain Sailing Information Systems
 * Email: johan@plainsailingisystems.co.za
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { getColour } from './colours.js';
import { fromSubgraph } from './adapt-subgraph.js';

/**
 * Initialise a 3D ForceGraph3D viewer.
 *
 * Requires `3d-force-graph` and `three-spritetext` resolvable via
 * `options.ForceGraph3D` / `options.SpriteText` or on `window`.
 */
export function init3D(container, graphData, options = {}) {
  const { nodes, edges } = fromSubgraph(graphData);
  if (!nodes.length) return null;

  const ForceGraph3D =
    options.ForceGraph3D ||
    (typeof window !== 'undefined' && window.ForceGraph3D);
  const SpriteText =
    options.SpriteText ||
    (typeof window !== 'undefined' && window.SpriteText);

  if (!ForceGraph3D) {
    console.error('[openric-viewer] ForceGraph3D not found. Pass via options.ForceGraph3D or load 3d-force-graph before the viewer.');
    return null;
  }

  const mappedNodes = nodes.map((n) => ({
    id: n.id,
    name: n.label || 'Unknown',
    colour: getColour(n.type),
    val: 1,
    type: n.type,
    atomUrl: n.atomUrl || null,
  }));
  const mappedLinks = edges.map((e) => ({
    source: e.source,
    target: e.target,
    label: e.label || e.predicate || '',
  }));

  try {
    const w = container.clientWidth || 800;
    const h = container.clientHeight || 500;

    const graph = ForceGraph3D()(container)
      .graphData({ nodes: mappedNodes, links: mappedLinks })
      .nodeColor('colour')
      .nodeVal('val')
      .nodeLabel('name')
      .nodeThreeObject((node) => {
        if (!SpriteText) return undefined;
        const name = node.name.length > 18 ? `${node.name.substring(0, 18)}…` : node.name;
        const sprite = new SpriteText(name);
        sprite.color = '#ffffff';
        sprite.textHeight = 3;
        sprite.backgroundColor = node.colour;
        sprite.padding = 0.5;
        sprite.borderRadius = 1;
        return sprite;
      })
      .nodeThreeObjectExtend(false)
      .linkDirectionalParticles(1)
      .linkLabel('label')
      .backgroundColor('#111827')
      .width(w)
      .height(h);

    if (typeof options.onNodeClick === 'function') {
      graph.onNodeClick((node) => {
        options.onNodeClick(node);
        const distance = 120;
        const dist = Math.hypot(node.x || 0, node.y || 0, node.z || 0) || 1;
        graph.cameraPosition(
          {
            x: ((node.x || 0) * (distance + dist)) / dist,
            y: ((node.y || 0) * (distance + dist)) / dist,
            z: ((node.z || 0) * (distance + dist)) / dist,
          },
          node,
          800,
        );
      });
    }
    return graph;
  } catch (e) {
    console.error('[openric-viewer] 3D init error:', e);
    return null;
  }
}
