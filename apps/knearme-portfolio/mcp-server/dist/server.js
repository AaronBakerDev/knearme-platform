/**
 * MCP Protocol Handler.
 *
 * This module implements the MCP protocol handler for the ChatGPT app.
 * It validates incoming requests, authenticates users, and dispatches
 * to the appropriate tool handlers.
 *
 * @see /docs/chatgpt-apps-sdk/BUILDING.md
 */
import { validateToken } from './auth/token-validator.js';
import { toolDefinitions, createProjectDraftSchema, addProjectMediaSchema, reorderProjectMediaSchema, setProjectHeroMediaSchema, setProjectMediaLabelsSchema, updateProjectSectionsSchema, updateProjectMetaSchema, finalizeProjectSchema, listContractorProjectsSchema, getProjectStatusSchema, handleCreateProjectDraft, handleAddProjectMedia, handleReorderProjectMedia, handleSetProjectHeroMedia, handleSetProjectMediaLabels, handleUpdateProjectSections, handleUpdateProjectMeta, handleFinalizeProject, handleListContractorProjects, handleGetProjectStatus, } from './tools/index.js';
import { widgetResource, getWidgetResourceResponse, } from './resources/widget.js';
// ============================================================================
// MCP HANDLER
// ============================================================================
/**
 * Create the MCP request handler.
 *
 * @param portfolioApiUrl - Base URL of the portfolio API
 */
export function createMcpHandler(portfolioApiUrl) {
    return async (req, res) => {
        const mcpRequest = req.body;
        // Validate JSON-RPC structure
        if (!mcpRequest.jsonrpc || mcpRequest.jsonrpc !== '2.0') {
            res.status(400).json(createErrorResponse(mcpRequest.id, -32600, 'Invalid Request'));
            return;
        }
        try {
            const response = await handleMcpRequest(mcpRequest, req, portfolioApiUrl);
            res.json(response);
        }
        catch (err) {
            console.error('[MCP Handler] Unexpected error:', err);
            res.json(createErrorResponse(mcpRequest.id, -32603, 'Internal error'));
        }
    };
}
/**
 * Handle an MCP request.
 */
async function handleMcpRequest(mcpRequest, httpRequest, portfolioApiUrl) {
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
            return handleToolCall(id, params, httpRequest, portfolioApiUrl);
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
/**
 * Handle a tool call request.
 */
async function handleToolCall(id, params, httpRequest, portfolioApiUrl) {
    if (!params || !params.name || !params.arguments) {
        return createErrorResponse(id, -32602, 'Invalid params: name and arguments required');
    }
    const toolName = params.name;
    const toolArgs = params.arguments;
    // Authenticate the request
    const authResult = await authenticateRequest(httpRequest);
    if (!authResult.success) {
        return createErrorResponse(id, -32000, authResult.error, { requiresAuth: true });
    }
    const auth = authResult.auth;
    // Dispatch to tool handler
    try {
        const result = await dispatchTool(toolName, toolArgs, auth, portfolioApiUrl);
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
    }
    catch (err) {
        console.error(`[Tool ${toolName}] Error:`, err);
        const message = err instanceof Error ? err.message : 'Tool execution failed';
        return createErrorResponse(id, -32000, message);
    }
}
/**
 * Authenticate an incoming request.
 */
async function authenticateRequest(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { success: false, error: 'Authorization header required' };
    }
    const token = authHeader.slice(7);
    // Validate the token
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
/**
 * Dispatch a tool call to the appropriate handler.
 */
async function dispatchTool(toolName, toolArgs, auth, portfolioApiUrl) {
    switch (toolName) {
        case 'create_project_draft': {
            const parsed = createProjectDraftSchema.safeParse(toolArgs);
            if (!parsed.success)
                return { success: false, error: formatZodError(parsed.error) };
            return handleCreateProjectDraft(parsed.data, auth, portfolioApiUrl);
        }
        case 'add_project_media': {
            const parsed = addProjectMediaSchema.safeParse(toolArgs);
            if (!parsed.success)
                return { success: false, error: formatZodError(parsed.error) };
            return handleAddProjectMedia(parsed.data, auth, portfolioApiUrl);
        }
        case 'reorder_project_media': {
            const parsed = reorderProjectMediaSchema.safeParse(toolArgs);
            if (!parsed.success)
                return { success: false, error: formatZodError(parsed.error) };
            return handleReorderProjectMedia(parsed.data, auth, portfolioApiUrl);
        }
        case 'set_project_hero_media': {
            const parsed = setProjectHeroMediaSchema.safeParse(toolArgs);
            if (!parsed.success)
                return { success: false, error: formatZodError(parsed.error) };
            return handleSetProjectHeroMedia(parsed.data, auth, portfolioApiUrl);
        }
        case 'set_project_media_labels': {
            const parsed = setProjectMediaLabelsSchema.safeParse(toolArgs);
            if (!parsed.success)
                return { success: false, error: formatZodError(parsed.error) };
            return handleSetProjectMediaLabels(parsed.data, auth, portfolioApiUrl);
        }
        case 'update_project_sections': {
            const parsed = updateProjectSectionsSchema.safeParse(toolArgs);
            if (!parsed.success)
                return { success: false, error: formatZodError(parsed.error) };
            return handleUpdateProjectSections(parsed.data, auth, portfolioApiUrl);
        }
        case 'update_project_meta': {
            const parsed = updateProjectMetaSchema.safeParse(toolArgs);
            if (!parsed.success)
                return { success: false, error: formatZodError(parsed.error) };
            return handleUpdateProjectMeta(parsed.data, auth, portfolioApiUrl);
        }
        case 'finalize_project': {
            const parsed = finalizeProjectSchema.safeParse(toolArgs);
            if (!parsed.success)
                return { success: false, error: formatZodError(parsed.error) };
            return handleFinalizeProject(parsed.data, auth, portfolioApiUrl);
        }
        case 'list_contractor_projects': {
            const parsed = listContractorProjectsSchema.safeParse(toolArgs);
            if (!parsed.success)
                return { success: false, error: formatZodError(parsed.error) };
            return handleListContractorProjects(parsed.data, auth, portfolioApiUrl);
        }
        case 'get_project_status': {
            const parsed = getProjectStatusSchema.safeParse(toolArgs);
            if (!parsed.success)
                return { success: false, error: formatZodError(parsed.error) };
            return handleGetProjectStatus(parsed.data, auth, portfolioApiUrl);
        }
        default:
            return { success: false, error: `Unknown tool: ${toolName}` };
    }
}
/**
 * Handle a resource read request.
 */
function handleResourceRead(id, params) {
    if (!params || !params.uri) {
        return createErrorResponse(id, -32602, 'Invalid params: uri required');
    }
    const uri = params.uri;
    // Handle widget resource
    if (uri === widgetResource.uri) {
        const resource = getWidgetResourceResponse();
        return createSuccessResponse(id, {
            contents: [resource],
        });
    }
    return createErrorResponse(id, -32002, `Resource not found: ${uri}`);
}
// ============================================================================
// HELPERS
// ============================================================================
/**
 * Create a successful MCP response.
 */
function createSuccessResponse(id, result) {
    return {
        jsonrpc: '2.0',
        id,
        result,
    };
}
/**
 * Create an error MCP response.
 */
function createErrorResponse(id, code, message, data) {
    const error = {
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
/**
 * Format a Zod validation error into a human-readable string.
 */
function formatZodError(error) {
    return error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
}
//# sourceMappingURL=server.js.map