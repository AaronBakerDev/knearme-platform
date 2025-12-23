/**
 * Widget Resource Handler.
 *
 * Serves the widget HTML bundle as an MCP resource.
 * ChatGPT fetches this resource to render the widget UI.
 *
 * Resource URI: template://knearme-portfolio
 *
 * @see /docs/chatgpt-apps-sdk/BUILDING.md
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
// Get the directory of this file
const __dirname = dirname(fileURLToPath(import.meta.url));
// Widget bundle path (built by widgets package)
const WIDGET_PATH = resolve(__dirname, '../../widgets/dist/widget.html');
/**
 * Widget bundle content (cached on first read).
 */
let widgetBundle = null;
/**
 * Get the widget HTML bundle.
 * Caches the result for performance.
 */
export function getWidgetBundle() {
    if (!widgetBundle) {
        try {
            widgetBundle = readFileSync(WIDGET_PATH, 'utf-8');
        }
        catch (error) {
            console.error('[Widget] Failed to read widget bundle:', error);
            // Return minimal error HTML
            widgetBundle = `<!DOCTYPE html>
<html>
<head><title>Error</title></head>
<body><p>Widget bundle not found. Run: cd widgets && npm run build</p></body>
</html>`;
        }
    }
    return widgetBundle;
}
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
 *
 * Include this in the _meta field of tool responses to enable widget rendering.
 *
 * @see BUILDING.md - Resource registration section
 */
export const widgetMeta = {
    // Content Security Policy - allowlist for network requests
    'openai/widgetCSP': {
        // Domains the widget can fetch data from
        connect_domains: [
            'api.knearme.com',
            'localhost:3000', // Dev
        ],
        // Domains for images/assets
        resource_domains: [
            'https://*.supabase.co',
            'https://knearme.com',
        ],
        // No iframes allowed
        frame_domains: [],
    },
    // Widget domain for fullscreen support
    'openai/widgetDomain': 'widgets.knearme.com',
    // Widget prefers a border around it
    'openai/widgetPrefersBorder': true,
    // Output template reference
    'openai/outputTemplate': 'template://knearme-portfolio',
};
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
 * Inject widget data into the bundle.
 *
 * Replaces the __WIDGET_DATA__ placeholder with actual data
 * so the widget can render the correct template.
 *
 * @param template - Template name to render
 * @param data - Template-specific data
 */
export function injectWidgetData(template, data) {
    const bundle = getWidgetBundle();
    // Inject data as a global variable
    const widgetData = JSON.stringify({ template, data });
    const script = `<script>window.__WIDGET_DATA__=${widgetData};</script>`;
    // Insert before the closing </head> tag
    return bundle.replace('</head>', `${script}</head>`);
}
//# sourceMappingURL=widget.js.map