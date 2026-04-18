/*
 * Copyright (C) 2026 Johan Pieterse / Plain Sailing Information Systems
 * Email: johan@plainsailingisystems.co.za
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fromSubgraph } from '../src/adapt-subgraph.js';

test('fromSubgraph unwraps openric:nodes + openric:edges', () => {
  const input = {
    '@type': 'openric:Subgraph',
    'openric:nodes': [{ id: 'n1' }],
    'openric:edges': [{ source: 'n1', target: 'n2' }],
  };
  const result = fromSubgraph(input);
  assert.equal(result.nodes.length, 1);
  assert.equal(result.edges.length, 1);
});

test('fromSubgraph passes through already-adapted shape', () => {
  const input = { nodes: [{ id: 'n1' }], edges: [] };
  const result = fromSubgraph(input);
  assert.equal(result.nodes.length, 1);
});

test('fromSubgraph returns empty on garbage', () => {
  assert.deepEqual(fromSubgraph(null), { nodes: [], edges: [] });
  assert.deepEqual(fromSubgraph(undefined), { nodes: [], edges: [] });
  assert.deepEqual(fromSubgraph('nope'), { nodes: [], edges: [] });
});
