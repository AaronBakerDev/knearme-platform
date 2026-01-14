/**
 * MCP Protocol Handler.
 *
 * This module implements the MCP protocol handler for the ChatGPT app.
 * It validates incoming requests, authenticates users, and dispatches
 * to the appropriate tool handlers.
 *
 * @see /docs/chatgpt-apps-sdk/BUILDING.md
 */
import type { Request, Response } from 'express';
/**
 * Create the MCP request handler.
 *
 * @param portfolioApiUrl - Base URL of the portfolio API
 */
export declare function createMcpHandler(portfolioApiUrl: string): (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=server.d.ts.map