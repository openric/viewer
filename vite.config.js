/*
 * Copyright (C) 2026 Johan Pieterse / Plain Sailing Information Systems
 * Email: johan@plainsailingisystems.co.za
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'OpenricViewer',
      fileName: (format) => `openric-viewer.${format}.js`,
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: ['cytoscape', '3d-force-graph', 'three', 'three-spritetext'],
      output: {
        globals: {
          cytoscape: 'cytoscape',
          '3d-force-graph': 'ForceGraph3D',
          three: 'THREE',
          'three-spritetext': 'SpriteText',
        },
      },
    },
    sourcemap: true,
    cssCodeSplit: false,
  },
  server: {
    open: '/demo/index.html',
    port: 5180,
  },
});
