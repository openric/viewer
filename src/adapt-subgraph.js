/*
 * Copyright (C) 2026 Johan Pieterse / Plain Sailing Information Systems
 * Email: johan@plainsailingisystems.co.za
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Adapt an OpenRiC `openric:Subgraph` response to the internal
 * `{nodes, edges}` shape. Idempotent — passes through already-adapted graphs.
 */
export function fromSubgraph(response) {
  if (!response || typeof response !== 'object') return { nodes: [], edges: [] };
  const nodes = response['openric:nodes'] || response.nodes || [];
  const edges = response['openric:edges'] || response.edges || [];
  return { nodes, edges };
}

/**
 * Fetch a subgraph from an OpenRiC-conformant server.
 *
 * @param {string} serverBase  Base URL, e.g. "https://heratio.theahg.co.za/api/ric/v1"
 * @param {string} rootUri     Root entity URI or path, e.g. "/records/slug"
 * @param {number} depth       Subgraph depth (default 2)
 * @returns {Promise<{nodes: Array, edges: Array}>}
 */
export async function fetchSubgraph(serverBase, rootUri, depth = 2) {
  const url = new URL(`${serverBase.replace(/\/$/, '')}/graph`);
  url.searchParams.set('uri', rootUri);
  url.searchParams.set('depth', String(depth));
  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/ld+json, application/json' },
  });
  if (!response.ok) {
    throw new Error(`OpenRiC graph fetch failed: ${response.status} ${response.statusText}`);
  }
  return fromSubgraph(await response.json());
}
