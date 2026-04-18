/*
 * Copyright (C) 2026 Johan Pieterse / Plain Sailing Information Systems
 * Email: johan@plainsailingisystems.co.za
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Static fixture backend — serves the OpenRiC conformance fixture pack
 * (openric/spec → fixtures/) as if it were a live OpenRiC Viewing API.
 * Proves the viewer is decoupled from Heratio's URL shape.
 *
 * Run: node demo/fixture-backend/server.js [fixtures-path] [port]
 */

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';

const FIXTURES_DIR = process.argv[2] || path.resolve(process.cwd(), '../spec/fixtures');
const PORT = Number(process.argv[3] || 5181);

async function readJsonIfExists(filePath) {
  try {
    const body = await fs.readFile(filePath, 'utf8');
    return JSON.parse(body);
  } catch {
    return null;
  }
}

/**
 * Map a request path to a fixture file.
 *   /graph?uri=/records/foo → fixtures/subgraph-depth-1/expected-graph.json (demo)
 *   /records/foo            → fixtures/fonds-minimal/expected.jsonld
 *   /records                → fixtures/record-list/expected.jsonld
 *   /                       → fixtures/service-description/expected.jsonld
 */
async function resolveFixture(reqUrl) {
  const { pathname, searchParams } = reqUrl;

  if (pathname === '/graph') {
    const candidates = ['subgraph-depth-1', 'subgraph-depth-2'];
    for (const c of candidates) {
      const hit = await readJsonIfExists(path.join(FIXTURES_DIR, c, 'expected-graph.json'));
      if (hit) return hit;
    }
    return { 'openric:nodes': [], 'openric:edges': [] };
  }

  if (pathname === '/' || pathname === '') {
    return readJsonIfExists(path.join(FIXTURES_DIR, 'service-description', 'expected.jsonld'));
  }

  if (pathname === '/records') {
    return readJsonIfExists(path.join(FIXTURES_DIR, 'record-list', 'expected.jsonld'));
  }

  if (pathname.startsWith('/records/')) {
    return readJsonIfExists(path.join(FIXTURES_DIR, 'fonds-minimal', 'expected.jsonld'));
  }

  if (pathname.startsWith('/agents/')) {
    return readJsonIfExists(path.join(FIXTURES_DIR, 'agent-person-simple', 'expected.jsonld'));
  }

  if (pathname.startsWith('/places/')) {
    return readJsonIfExists(path.join(FIXTURES_DIR, 'place-country', 'expected.jsonld'));
  }

  if (pathname === '/vocabulary') {
    return readJsonIfExists(path.join(FIXTURES_DIR, 'vocabulary', 'expected.jsonld'));
  }

  return null;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Accept, Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const reqUrl = new url.URL(req.url, `http://localhost:${PORT}`);
  const body = await resolveFixture(reqUrl);

  if (!body) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'not_found', path: reqUrl.pathname }));
  }

  res.writeHead(200, { 'Content-Type': 'application/ld+json' });
  res.end(JSON.stringify(body));
});

server.listen(PORT, () => {
  console.log(`[fixture-backend] serving ${FIXTURES_DIR} on http://localhost:${PORT}`);
});
