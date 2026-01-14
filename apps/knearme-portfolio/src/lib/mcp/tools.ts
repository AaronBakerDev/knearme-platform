/**
 * MCP Tool Definitions and Handlers.
 *
 * Tool schemas are centralized in tool-schemas.ts and converted to JSON Schema
 * format using zod-to-json-schema for MCP protocol compatibility.
 *
 * @see /src/lib/chat/tool-schemas.ts - Single source of truth for Zod schemas
 * @see /docs/chatgpt-apps-sdk/MCP_CONTRACTOR_INTERFACE.md
 */

export { toolDefinitions } from './tools/definitions';
export { dispatchTool } from './tools/dispatch';
