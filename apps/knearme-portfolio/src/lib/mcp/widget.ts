/**
 * Widget Resource Handler for MCP endpoint.
 *
 * Serves widget metadata for ChatGPT rendering.
 * The widget bundle is built from mcp-server/widgets using Vite.
 * Run `npm run build` in mcp-server/widgets to rebuild.
 *
 * @see /docs/chatgpt-apps-sdk/BUILDING.md
 * @see /mcp-server/widgets/ for widget source code
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { WidgetMetaFields } from './types';
import { logger } from '@/lib/logging';

/**
 * Widget resource definition for MCP resources/list.
 */
export const widgetResource = {
  uri: 'template://knearme-portfolio',
  name: 'KnearMe Portfolio Widget',
  description: 'Widget for managing contractor project portfolios',
  mimeType: 'text/html+skybridge',
};

/**
 * Widget metadata for tool responses.
 * Include this in _meta field to enable widget rendering.
 */
export const widgetMeta: WidgetMetaFields = {
  'openai/widgetCSP': {
    connect_domains: [
      'knearme.co',
      'api.knearme.co',
      '*.supabase.co',
    ],
    resource_domains: [
      'https://*.supabase.co',
      'https://knearme.co',
    ],
    frame_domains: [],
  },
  'openai/widgetDomain': 'knearme.co',
  'openai/widgetPrefersBorder': true,
  'openai/widgetDescription': 'KnearMe portfolio management widgets',
  'openai/outputTemplate': 'template://knearme-portfolio',
};

/**
 * Path to the built widget bundle.
 * Built by running `npm run build` in mcp-server/widgets.
 */
const WIDGET_BUNDLE_PATH = join(process.cwd(), 'mcp-server/widgets/dist/widget.html');

/**
 * Cached widget bundle to avoid repeated file reads.
 */
let widgetBundleCache: string | null = null;

/**
 * Minimal fallback widget HTML for when the bundle isn't available.
 * Used during development or if the build hasn't run.
 */
const FALLBACK_WIDGET_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KnearMe Portfolio</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; padding: 16px; background: #fff; }
    .container { max-width: 600px; margin: 0 auto; }
    .card { background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .title { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
    .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    .status-draft { background: #fef3c7; color: #92400e; }
    .status-published { background: #d1fae5; color: #065f46; }
    .missing { color: #dc2626; font-size: 14px; margin-top: 8px; }
    .btn { background: #2563eb; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; }
    .btn:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="container" id="app">
    <div class="card">
      <p>Loading project data...</p>
    </div>
  </div>
  <script>
    (function() {
      const data = window.__WIDGET_DATA__ || {};
      const app = document.getElementById('app');

      if (data.template === 'project-draft' || data.template === 'project-status') {
        const project = data.data?.project || {};
        const missing = data.data?.missing_fields || [];

        app.innerHTML = \`
          <div class="card">
            <div class="title">\${project.title || 'Untitled Project'}</div>
            <span class="status status-\${project.status}">\${project.status}</span>
            \${project.project_type ? '<p style="margin-top:8px">Type: ' + project.project_type + '</p>' : ''}
            \${project.city ? '<p>Location: ' + project.city + (project.state ? ', ' + project.state : '') + '</p>' : ''}
            \${missing.length > 0 ? '<p class="missing">Missing: ' + missing.join(', ') + '</p>' : ''}
            \${data.data?.public_url ? '<p style="margin-top:12px"><a href="' + data.data.public_url + '" target="_blank">View published project</a></p>' : ''}
          </div>
        \`;
      } else if (data.template === 'project-media') {
        const images = data.data?.images || [];
        app.innerHTML = \`
          <div class="card">
            <div class="title">Project Images (\${images.length})</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
              \${images.map(img => '<img src="' + img.url + '" style="width:80px;height:80px;object-fit:cover;border-radius:4px" />').join('')}
            </div>
          </div>
        \`;
      } else if (data.template === 'project-list') {
        const projects = data.data?.projects || [];
        app.innerHTML = projects.length ? projects.map(p => \`
          <div class="card">
            <div class="title">\${p.title || 'Untitled'}</div>
            <span class="status status-\${p.status}">\${p.status}</span>
          </div>
        \`).join('') : '<div class="card"><p>No projects found</p></div>';
      }
    })();
  </script>
</body>
</html>`;

/**
 * Get widget HTML bundle.
 * Loads the built React widget if available, otherwise returns fallback.
 */
export function getWidgetBundle(): string {
  // Return cached bundle if available
  if (widgetBundleCache) {
    return widgetBundleCache;
  }

  // Try to load the built widget bundle
  try {
    if (existsSync(WIDGET_BUNDLE_PATH)) {
      widgetBundleCache = readFileSync(WIDGET_BUNDLE_PATH, 'utf-8');
      logger.info('[Widget] Loaded built widget bundle', { path: WIDGET_BUNDLE_PATH });
      return widgetBundleCache;
    }
  } catch (error) {
    logger.warn('[Widget] Failed to load built widget bundle', { error });
  }

  // Fall back to minimal inline widget
  logger.warn('[Widget] Using fallback widget. Run "npm run build" in mcp-server/widgets to build the full widget.');
  return FALLBACK_WIDGET_HTML;
}

/**
 * Get full widget resource response for MCP resources/read.
 */
export function getWidgetResourceResponse() {
  return {
    uri: widgetResource.uri,
    mimeType: widgetResource.mimeType,
    text: getWidgetBundle(),
    _meta: widgetMeta,
  };
}

/**
 * Build widget metadata with template data.
 */
export function buildWidgetMeta<T extends Record<string, unknown>>(
  template: 'project-draft' | 'project-media' | 'project-status' | 'project-list',
  data: unknown,
  extraMeta: T
): T & WidgetMetaFields {
  return {
    ...widgetMeta,
    widgetTemplate: template,
    widgetData: data,
    ...extraMeta,
  } as T & WidgetMetaFields;
}
