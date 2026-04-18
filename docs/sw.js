/*
 * Copyright (C) 2026 Johan Pieterse / Plain Sailing Information Systems
 * Email: johan@plainsailingisystems.co.za
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Service worker for the @openric/viewer public demo. Intercepts fetches
 * to the virtual "/api/static-ric/*" endpoint and serves them from a
 * static fixture pack. This lets the demo drive the viewer against a
 * second, non-Heratio backend on GitHub Pages — no server required.
 *
 * Registration is opt-in: the page only activates the SW when the user
 * picks "Static fixtures" in the demo's server dropdown.
 */

const CACHE_VERSION = 'openric-viewer-static-v1';
const API_PREFIX = '/api/static-ric';

const ROUTES = {
  '/graph:1': '/fixtures/subgraph-depth-1.json',
  '/graph:2': '/fixtures/subgraph-depth-2.json',
  '/graph':   '/fixtures/subgraph-depth-2.json', // default
};

self.addEventListener('install', (event) => {
  // Best-effort precache — never fail install if a fixture is temporarily 404.
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      Promise.allSettled([
        cache.add('/fixtures/subgraph-depth-1.json'),
        cache.add('/fixtures/subgraph-depth-2.json'),
      ]),
    ),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(API_PREFIX)) return;

  const apiPath = url.pathname.slice(API_PREFIX.length);
  const depth = url.searchParams.get('depth') || '';
  const routeKey = depth ? `${apiPath}:${depth}` : apiPath;
  const fixturePath = ROUTES[routeKey] || ROUTES[apiPath];

  if (!fixturePath) {
    event.respondWith(
      new Response(JSON.stringify({ error: 'not_found', path: apiPath }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    let response = await cache.match(fixturePath);
    if (!response) {
      try {
        response = await fetch(fixturePath);
        if (response.ok) {
          await cache.put(fixturePath, response.clone());
        }
      } catch (e) {
        return new Response(JSON.stringify({ error: 'fixture_fetch_failed', fixture: fixturePath, reason: String(e) }), {
          status: 502, headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    if (!response || !response.ok) {
      return new Response(JSON.stringify({ error: 'fixture_not_available', fixture: fixturePath }), {
        status: 502, headers: { 'Content-Type': 'application/json' },
      });
    }
    const text = await response.text();
    return new Response(text, {
      status: 200,
      headers: {
        'Content-Type': 'application/ld+json',
        'X-Openric-Backend': 'static-fixtures',
      },
    });
  })());
});
