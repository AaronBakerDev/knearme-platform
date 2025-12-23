/**
 * Vite configuration for ChatGPT widget bundle.
 *
 * Builds a single HTML file with inlined CSS and JS that can be served
 * as an MCP resource with mimeType: text/html+skybridge.
 *
 * @see /docs/chatgpt-apps-sdk/BUILDING.md
 */

import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

/**
 * Custom plugin to inline all assets into HTML.
 * Creates a single HTML file with embedded CSS and JS.
 */
function inlineAssetsPlugin(): Plugin {
  return {
    name: 'inline-assets',
    enforce: 'post',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');
      const htmlPath = resolve(distDir, 'index.html');

      if (!existsSync(htmlPath)) {
        console.warn('[inline-assets] index.html not found');
        return;
      }

      let html = readFileSync(htmlPath, 'utf-8');

      // Find and inline CSS
      const cssMatch = html.match(/href="([^"]+\.css)"/);
      if (cssMatch) {
        const cssPath = resolve(distDir, cssMatch[1].replace(/^\//, ''));
        if (existsSync(cssPath)) {
          const css = readFileSync(cssPath, 'utf-8');
          html = html.replace(
            `<link rel="stylesheet" crossorigin href="${cssMatch[1]}">`,
            `<style>${css}</style>`
          );
        }
      }

      // Find and inline JS
      const jsMatch = html.match(/src="([^"]+\.js)"/);
      if (jsMatch) {
        const jsPath = resolve(distDir, jsMatch[1].replace(/^\//, ''));
        if (existsSync(jsPath)) {
          const js = readFileSync(jsPath, 'utf-8');
          html = html.replace(
            `<script type="module" crossorigin src="${jsMatch[1]}"></script>`,
            `<script type="module">${js}</script>`
          );
        }
      }

      // Write inlined HTML
      const inlinedPath = resolve(distDir, 'widget.html');
      writeFileSync(inlinedPath, html);
      console.log('[inline-assets] Created widget.html with inlined assets');
    },
  };
}

export default defineConfig({
  plugins: [react(), inlineAssetsPlugin()],

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },

  build: {
    // Output directory
    outDir: 'dist',

    // Generate a single bundle (no code splitting)
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        // Single chunk output
        manualChunks: undefined,
        // Inline all assets
        inlineDynamicImports: true,
      },
    },

    // Inline all assets under 100KB (effectively everything)
    assetsInlineLimit: 100000,

    // Minify for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for debugging
      },
    },

    // No source maps for production widget
    sourcemap: false,
  },

  // Development server
  server: {
    port: 3002,
    open: false,
  },
});
