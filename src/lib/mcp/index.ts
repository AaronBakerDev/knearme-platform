/**
 * MCP Library Exports.
 *
 * Provides Model Context Protocol functionality for ChatGPT Apps SDK.
 * Used by the /api/mcp endpoint.
 *
 * @see /docs/chatgpt-apps-sdk/BUILDING.md
 */

// Types
export * from './types';

// Token validation
export { validateToken, createDevToken } from './token-validator';
export type { TokenValidationResult } from './token-validator';

// Widget resources
export {
  widgetResource,
  widgetMeta,
  getWidgetBundle,
  getWidgetResourceResponse,
  buildWidgetMeta,
} from './widget';

// Portfolio client
export { PortfolioClient, getMissingPublishFields, canPublish, toProjectOutput, toImageOutput } from './portfolio-client';
export type { PortfolioClientConfig, ApiResult } from './portfolio-client';

// Tools
export { toolDefinitions, dispatchTool } from './tools';
