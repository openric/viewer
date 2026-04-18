# @openric/viewer

Standalone 2D/3D graph viewer for **[OpenRiC](https://openric.org)**-conformant servers. Implementation-neutral — drives any server that implements the OpenRiC Viewing API, not just the Heratio reference implementation.

- **Spec:** [openric.org](https://openric.org)
- **Reference implementation:** [github.com/ArchiveHeritageGroup/heratio](https://github.com/ArchiveHeritageGroup/heratio)
- **This repo:** [github.com/openric/viewer](https://github.com/openric/viewer)

## Install

```bash
npm install @openric/viewer
```

Peer dependencies (install what you need):

```bash
npm install cytoscape                   # 2D
npm install 3d-force-graph three three-spritetext   # 3D
```

Or via CDN:

```html
<script src="https://unpkg.com/cytoscape@3"></script>
<script src="https://unpkg.com/three@0.160"></script>
<script src="https://unpkg.com/three-spritetext@1"></script>
<script src="https://unpkg.com/3d-force-graph@1"></script>
<script src="https://unpkg.com/@openric/viewer"></script>
```

## Use

```js
import { mount } from '@openric/viewer';

const handle = mount(document.getElementById('viewer'), {
  server: 'https://heratio.theahg.co.za/api/ric/v1',
  start: '/records/my-fonds',
  mode: '2d',          // '2d' | '3d'
  depth: 2,
  onNodeClick: (node) => console.log(node),
});

// Later...
handle.setRoot('/agents/some-actor');
handle.setMode('3d');
handle.unmount();
```

## Portability proof

The [live demo](https://viewer.openric.org) points the same viewer at two different servers:

1. **Heratio** — the reference implementation
2. **Static fixture backend** — serves the OpenRiC [conformance fixture pack](https://github.com/openric/spec/tree/main/fixtures) as if it were a live API

If both render correctly, the viewer depends only on the OpenRiC spec contract — not on any Heratio-specific behaviour.

Run the static fixture backend locally:

```bash
# from this repo
npm run fixture-backend -- /path/to/openric/spec/fixtures
# serves on http://localhost:5181
```

## Develop

```bash
npm install
npm run dev              # vite dev server with live reload on http://localhost:5180
npm test                 # node --test
npm run build            # produces dist/openric-viewer.esm.js + .umd.js + .css
```

## Publish (maintainers)

Tag and push; GitHub Actions publishes to npm with provenance:

```bash
npm version patch     # or minor / major
git push --follow-tags
```

## Licence

**AGPL-3.0-or-later** — same as the reference implementation. The OpenRiC specification itself is CC-BY 4.0; this viewer is a separate work.
