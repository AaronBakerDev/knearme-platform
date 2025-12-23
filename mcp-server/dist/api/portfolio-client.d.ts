/**
 * Portfolio API client for the MCP server.
 *
 * This client wraps the knearme-portfolio API routes, authenticating
 * requests using the contractor's OAuth access token.
 *
 * @see /docs/chatgpt-apps-sdk/PORTFOLIO_TOOL_MAPPING.md
 */
import type { ProjectOutput, ProjectWithImages, ProjectImageOutput, ProjectStatus } from '../types/mcp.js';
/**
 * Portfolio API client configuration.
 */
export interface PortfolioClientConfig {
    baseUrl: string;
    accessToken: string;
}
/**
 * Result type for API operations.
 */
export type ApiResult<T> = {
    success: true;
    data: T;
} | {
    success: false;
    error: string;
    code: string;
};
/**
 * Portfolio API client for MCP tools.
 *
 * Each method maps to a portfolio API route and handles:
 * - Authentication via Bearer token
 * - Error response parsing
 * - Type-safe responses
 */
export declare class PortfolioClient {
    private baseUrl;
    private accessToken;
    constructor(config: PortfolioClientConfig);
    /**
     * Make an authenticated API request.
     */
    private request;
    /**
     * Create a new draft project.
     * Maps to: POST /api/projects
     */
    createProject(input: {
        title?: string;
        project_type?: string;
        city?: string;
        state?: string;
        summary?: string;
        challenge?: string;
        solution?: string;
        results?: string;
        outcome_highlights?: string[];
    }): Promise<ApiResult<{
        project: ProjectWithImages;
    }>>;
    /**
     * Get a single project with images.
     * Maps to: GET /api/projects/[id]
     */
    getProject(projectId: string): Promise<ApiResult<{
        project: ProjectWithImages;
    }>>;
    /**
     * List contractor's projects.
     * Maps to: GET /api/projects
     */
    listProjects(params?: {
        status?: ProjectStatus;
        limit?: number;
        offset?: number;
    }): Promise<ApiResult<{
        projects: ProjectWithImages[];
        total: number;
        limit: number;
        offset: number;
    }>>;
    /**
     * Update project fields.
     * Maps to: PATCH /api/projects/[id]
     */
    updateProject(projectId: string, updates: {
        title?: string;
        description?: string;
        project_type?: string;
        materials?: string[];
        techniques?: string[];
        city?: string;
        state?: string;
        duration?: string;
        tags?: string[];
        seo_title?: string;
        seo_description?: string;
        summary?: string;
        challenge?: string;
        solution?: string;
        results?: string;
        outcome_highlights?: string[];
        hero_image_id?: string | null;
        client_type?: string | null;
        budget_range?: string | null;
        description_manual?: boolean;
    }): Promise<ApiResult<{
        project: ProjectWithImages;
    }>>;
    /**
     * Publish a project.
     * Maps to: POST /api/projects/[id]/publish
     */
    publishProject(projectId: string): Promise<ApiResult<{
        project: ProjectWithImages;
    }>>;
    /**
     * Request a signed upload URL for a new image.
     * Maps to: POST /api/projects/[id]/images
     */
    requestImageUpload(projectId: string, input: {
        filename: string;
        content_type: string;
        image_type?: 'before' | 'after' | 'progress' | 'detail';
        display_order?: number;
        width?: number;
        height?: number;
    }): Promise<ApiResult<{
        image: ProjectImageOutput;
        upload: {
            signed_url: string;
            token: string;
            path: string;
        };
    }>>;
    /**
     * List project images.
     * Maps to: GET /api/projects/[id]/images
     */
    listImages(projectId: string): Promise<ApiResult<{
        images: ProjectImageOutput[];
    }>>;
    /**
     * Reorder images.
     * Maps to: PATCH /api/projects/[id]/images
     */
    reorderImages(projectId: string, imageIds: string[]): Promise<ApiResult<{
        reordered: boolean;
        reorderedCount: number;
        labelsUpdated: boolean;
        labelsUpdatedCount: number;
    }>>;
    /**
     * Update image labels.
     * Maps to: PATCH /api/projects/[id]/images
     */
    updateImageLabels(projectId: string, labels: Array<{
        image_id: string;
        image_type?: 'before' | 'after' | 'progress' | 'detail' | null;
        alt_text?: string | null;
    }>): Promise<ApiResult<{
        reordered: boolean;
        reorderedCount: number;
        labelsUpdated: boolean;
        labelsUpdatedCount: number;
    }>>;
    /**
     * Delete an image.
     * Maps to: DELETE /api/projects/[id]/images
     */
    deleteImage(projectId: string, imageId: string): Promise<ApiResult<{
        deleted: boolean;
    }>>;
}
/**
 * Calculate missing fields required for publishing.
 * Used by multiple tools to show what's needed to finalize.
 */
export declare function getMissingPublishFields(project: ProjectOutput): string[];
/**
 * Check if a project has all required fields for publishing.
 */
export declare function canPublish(project: ProjectOutput, imageCount: number): boolean;
/**
 * Transform API project response to MCP output format.
 */
export declare function toProjectOutput(apiProject: Record<string, unknown>): ProjectOutput;
/**
 * Transform API image response to MCP output format.
 */
export declare function toImageOutput(apiImage: Record<string, unknown>): ProjectImageOutput;
//# sourceMappingURL=portfolio-client.d.ts.map