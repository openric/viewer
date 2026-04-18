/*
 * Copyright (C) 2026 Johan Pieterse / Plain Sailing Information Systems
 * Email: johan@plainsailingisystems.co.za
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchSubgraph } from '../src/adapt-subgraph.js';

// Minimal window.location polyfill for node test env (fetchSubgraph uses it
// when the server base is relative).
globalThis.window ??= { location: { origin: 'https://example.test' } };

test('fetchSubgraph accepts absolute server base', async () => {
  const captured = {};
  globalThis.fetch = async (url) => {
    captured.url = url;
    return { ok: true, status: 200, json: async () => ({ nodes: [], edges: [] }) };
  };
  await fetchSubgraph('https://heratio.example/api/ric/v1', '/records/foo', 2);
  assert.ok(captured.url.startsWith('https://heratio.example/api/ric/v1/graph?'));
  assert.ok(captured.url.includes('uri=%2Frecords%2Ffoo'));
  assert.ok(captured.url.includes('depth=2'));
});

test('fetchSubgraph accepts relative server base (uses window.location.origin)', async () => {
  const captured = {};
  globalThis.fetch = async (url) => {
    captured.url = url;
    return { ok: true, status: 200, json: async () => ({ nodes: [], edges: [] }) };
  };
  await fetchSubgraph('/api/static-ric', '/default/recordset/905228', 1);
  assert.ok(captured.url.startsWith('https://example.test/api/static-ric/graph?'), `got ${captured.url}`);
});

test('fetchSubgraph throws on non-2xx', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 404, statusText: 'Not Found' });
  await assert.rejects(
    () => fetchSubgraph('https://x.example', '/y', 1),
    /OpenRiC graph fetch failed: 404 Not Found/,
  );
});
