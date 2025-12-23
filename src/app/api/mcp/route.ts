/**
 * MCP Protocol Handler - Next.js API Route.
 *
 * Implements the Model Context Protocol for ChatGPT Apps SDK.
 * Handles JSON-RPC 2.0 requests for tool invocation and widget resources.
 *
 * Endpoint: POST /api/mcp
 *
 * @see /docs/chatgpt-apps-sdk/BUILDING.md
 * @see https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateToken } from '@/lib/mcp/token-validator';
import { dispatchTool, toolDefinitions } from '@/lib/mcp/tools';
import { widgetResource, getWidgetResourceResponse } from '@/lib/mcp/widget';
import type { McpRequest, McpResponse, AuthContext } from '@/lib/mcp/types';

// Base URL for the portfolio API (same app)
const PORTFOLIO_API_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

function createSuccessResponse(id: string | number, result: unknown): McpResponse {
  return {
    jsonrpc: '2.0',
    id,
    result,
  };
}

function createErrorResponse(
  id: string | number,
  code: number,
  message: string,
  data?: Record<string, unknown>
): McpResponse {
  const error: { code: number; message: string; data?: Record<string, unknown> } = {
    code,
    message,
  };
  if (data) {
    error.data = data;
  }
  return {
    jsonrpc: '2.0',
    id,
    error,
  };
}

function formatZodError(error: z.ZodError): string {
  return error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

async function authenticateRequest(
  request: NextRequest
): Promise<{ success: true; auth: AuthContext } | { success: false; error: string }> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, error: 'Authorization header required' };
  }

  const token = authHeader.slice(7);
  const tokenResult = await validateToken(token);

  if (!tokenResult.success) {
    return { success: false, error: tokenResult.error };
  }

  return {
    success: true,
    auth: {
      contractorId: tokenResult.payload.contractor_id,
      accessToken: token,
    },
  };
}

// ============================================================================
// MCP METHOD HANDLERS
// ============================================================================

/**
 * Handle tools/call method - dispatches to appropriate tool handler.
 */
async function handleToolCall(
  id: string | number,
  params: Record<string, unknown> | undefined,
  request: NextRequest
): Promise<McpResponse> {
  if (!params || !params.name || !params.arguments) {
    return createErrorResponse(id, -32602, 'Invalid params: name and arguments required');
  }

  const toolName = params.name as string;
  const toolArgs = params.arguments as Record<string, unknown>;

  // Authenticate the request
  const authResult = await authenticateRequest(request);
  if (!authResult.success) {
    return createErrorResponse(id, -32000, authResult.error, { requiresAuth: true });
  }

  const auth = authResult.auth;

  // Dispatch to tool handler
  try {
    const result = await dispatchTool(toolName, toolArgs, auth, PORTFOLIO_API_URL);

    if (!result.success) {
      return createErrorResponse(id, -32000, result.error);
    }

    return createSuccessResponse(id, {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result.result.structuredContent),
        },
      ],
      _meta: result.result._meta,
    });
  } catch (err) {
    console.error(`[MCP Tool ${toolName}] Error:`, err);
    const message = err instanceof Error ? err.message : 'Tool execution failed';
    return createErrorResponse(id, -32000, message);
  }
}

/**
 * Handle resources/read method - returns widget resource.
 */
function handleResourceRead(
  id: string | number,
  params: Record<string, unknown> | undefined
): McpResponse {
  if (!params || !params.uri) {
    return createErrorResponse(id, -32602, 'Invalid params: uri required');
  }

  const uri = params.uri as string;

  // Handle widget resource
  if (uri === widgetResource.uri) {
    const resource = getWidgetResourceResponse();
    return createSuccessResponse(id, {
      contents: [resource],
    });
  }

  return createErrorResponse(id, -32002, `Resource not found: ${uri}`);
}

/**
 * Main MCP request handler.
 */
async function handleMcpRequest(
  mcpRequest: McpRequest,
  request: NextRequest
): Promise<McpResponse> {
  const { id, method, params } = mcpRequest;

  switch (method) {
    // =========================================================================
    // MCP LIFECYCLE METHODS
    // =========================================================================

    case 'initialize':
      return createSuccessResponse(id, {
        protocolVersion: '2024-11-05',
        serverInfo: {
          name: 'knearme-mcp-server',
          version: '0.1.0',
        },
        capabilities: {
          tools: {},
          resources: {},
        },
      });

    case 'tools/list':
      return createSuccessResponse(id, {
        tools: toolDefinitions,
      });

    // =========================================================================
    // TOOL INVOCATION
    // =========================================================================

    case 'tools/call':
      return handleToolCall(id, params, request);

    // =========================================================================
    // RESOURCE METHODS
    // =========================================================================

    case 'resources/list':
      return createSuccessResponse(id, {
        resources: [widgetResource],
      });

    case 'resources/read':
      return handleResourceRead(id, params);

    // =========================================================================
    // UNKNOWN METHOD
    // =========================================================================

    default:
      return createErrorResponse(id, -32601, `Method not found: ${method}`);
  }
}

// ============================================================================
// NEXT.JS API ROUTE HANDLER
// ============================================================================

/**
 * POST /api/mcp
 *
 * MCP protocol endpoint for ChatGPT Apps SDK.
 * Accepts JSON-RPC 2.0 requests.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const mcpRequest = (await request.json()) as McpRequest;

    // Validate JSON-RPC structure
    if (!mcpRequest.jsonrpc || mcpRequest.jsonrpc !== '2.0') {
      return NextResponse.json(
        createErrorResponse(mcpRequest.id || 0, -32600, 'Invalid Request'),
        { status: 400 }
      );
    }

    const response = await handleMcpRequest(mcpRequest, request);
    return NextResponse.json(response);
  } catch (err) {
    console.error('[MCP Handler] Unexpected error:', err);
    return NextResponse.json(createErrorResponse(0, -32603, 'Internal error'), { status: 500 });
  }
}

/**
 * GET /api/mcp
 *
 * Health check endpoint.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    server: 'knearme-mcp-server',
    version: '0.1.0',
    protocol: 'MCP 2024-11-05',
  });
}
