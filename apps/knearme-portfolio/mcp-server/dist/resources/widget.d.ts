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
/**
 * Get the widget HTML bundle.
 * Caches the result for performance.
 */
export declare function getWidgetBundle(): string;
/**
 * Widget resource definition for MCP resources/list.
 */
export declare const widgetResource: {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
};
/**
 * Widget metadata for tool responses.
 *
 * Include this in the _meta field of tool responses to enable widget rendering.
 *
 * @see BUILDING.md - Resource registration section
 */
export declare const widgetMeta: {
    'openai/widgetCSP': {
        connect_domains: string[];
        resource_domains: string[];
        frame_domains: never[];
    };
    'openai/widgetDomain': string;
    'openai/widgetPrefersBorder': boolean;
    'openai/outputTemplate': string;
};
/**
 * Get full widget resource response for MCP resources/read.
 */
export declare function getWidgetResourceResponse(): {
    uri: string;
    mimeType: string;
    text: string;
    _meta: {
        'openai/widgetCSP': {
            connect_domains: string[];
            resource_domains: string[];
            frame_domains: never[];
        };
        'openai/widgetDomain': string;
        'openai/widgetPrefersBorder': boolean;
        'openai/outputTemplate': string;
    };
};
/**
 * Inject widget data into the bundle.
 *
 * Replaces the __WIDGET_DATA__ placeholder with actual data
 * so the widget can render the correct template.
 *
 * @param template - Template name to render
 * @param data - Template-specific data
 */
export declare function injectWidgetData(template: 'project-draft' | 'project-media' | 'project-status' | 'project-list', data: unknown): string;
//# sourceMappingURL=widget.d.ts.map