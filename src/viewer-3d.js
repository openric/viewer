/*
 * Copyright (C) 2026 Johan Pieterse / Plain Sailing Information Systems
 * Email: johan@plainsailingisystems.co.za
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { getColour } from './colours.js';
import { fromSubgraph } from './adapt-subgraph.js';
import { resolveTooltip } from './tooltip.js';

/**
 * Initialise a 3D ForceGraph3D viewer.
 *
 * Requires `3d-force-graph` and `three-spritetext` resolvable via
 * `options.ForceGraph3D` / `options.SpriteText` or on `window`.
 *
 * Options:
 *   onNodeClick(node)       — click handler, called with node data
 *   onNodeHover(node)       — optional hover handler, in addition to tooltip
 *   tooltip                 — true|false|{render: fn}. Default: true.
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

    // Hover tooltip (v0.2.0). Looks up the originating node from the raw
    // subgraph to render richer context than ForceGraph3D's view of the node.
    const nodeById = new Map(nodes.map(n => [n.id, n]));
    const tooltip = resolveTooltip(options.tooltip);
    if (tooltip) {
      let lastMouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      const track = (e) => { lastMouse = { x: e.clientX, y: e.clientY }; };
      window.addEventListener('mousemove', track);

      graph.onNodeHover((node) => {
        if (node) {
          tooltip.show(lastMouse.x, lastMouse.y, nodeById.get(node.id) || node);
          if (typeof options.onNodeHover === 'function') options.onNodeHover(node);
        } else {
          tooltip.hide();
          if (typeof options.onNodeHover === 'function') options.onNodeHover(null);
        }
      });
    }

    return graph;
  } catch (e) {
    console.error('[openric-viewer] 3D init error:', e);
    return null;
  }
}
