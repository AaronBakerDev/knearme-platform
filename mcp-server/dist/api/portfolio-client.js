/**
 * Portfolio API client for the MCP server.
 *
 * This client wraps the knearme-portfolio API routes, authenticating
 * requests using the contractor's OAuth access token.
 *
 * @see /docs/chatgpt-apps-sdk/PORTFOLIO_TOOL_MAPPING.md
 */
/**
 * Portfolio API client for MCP tools.
 *
 * Each method maps to a portfolio API route and handles:
 * - Authentication via Bearer token
 * - Error response parsing
 * - Type-safe responses
 */
export class PortfolioClient {
    baseUrl;
    accessToken;
    constructor(config) {
        this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.accessToken = config.accessToken;
    }
    /**
     * Make an authenticated API request.
     */
    async request(method, path, body) {
        const url = `${this.baseUrl}${path}`;
        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.accessToken}`,
                },
                body: body ? JSON.stringify(body) : undefined,
            });
            const data = await response.json();
            if (!response.ok) {
                const errorData = data;
                return {
                    success: false,
                    error: errorData.error?.message || 'API request failed',
                    code: errorData.error?.code || 'UNKNOWN_ERROR',
                };
            }
            return { success: true, data: data };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Network error';
            return { success: false, error: message, code: 'NETWORK_ERROR' };
        }
    }
    // ===========================================================================
    // PROJECT OPERATIONS
    // ===========================================================================
    /**
     * Create a new draft project.
     * Maps to: POST /api/projects
     */
    async createProject(input) {
        return this.request('POST', '/api/projects', input);
    }
    /**
     * Get a single project with images.
     * Maps to: GET /api/projects/[id]
     */
    async getProject(projectId) {
        return this.request('GET', `/api/projects/${projectId}`);
    }
    /**
     * List contractor's projects.
     * Maps to: GET /api/projects
     */
    async listProjects(params) {
        const query = new URLSearchParams();
        if (params?.status)
            query.set('status', params.status);
        if (params?.limit)
            query.set('limit', params.limit.toString());
        if (params?.offset)
            query.set('offset', params.offset.toString());
        const queryString = query.toString();
        const path = queryString ? `/api/projects?${queryString}` : '/api/projects';
        return this.request('GET', path);
    }
    /**
     * Update project fields.
     * Maps to: PATCH /api/projects/[id]
     */
    async updateProject(projectId, updates) {
        return this.request('PATCH', `/api/projects/${projectId}`, updates);
    }
    /**
     * Publish a project.
     * Maps to: POST /api/projects/[id]/publish
     */
    async publishProject(projectId) {
        return this.request('POST', `/api/projects/${projectId}/publish`);
    }
    // ===========================================================================
    // IMAGE OPERATIONS
    // ===========================================================================
    /**
     * Request a signed upload URL for a new image.
     * Maps to: POST /api/projects/[id]/images
     */
    async requestImageUpload(projectId, input) {
        return this.request('POST', `/api/projects/${projectId}/images`, input);
    }
    /**
     * List project images.
     * Maps to: GET /api/projects/[id]/images
     */
    async listImages(projectId) {
        return this.request('GET', `/api/projects/${projectId}/images`);
    }
    /**
     * Reorder images.
     * Maps to: PATCH /api/projects/[id]/images
     */
    async reorderImages(projectId, imageIds) {
        return this.request('PATCH', `/api/projects/${projectId}/images`, {
            image_ids: imageIds,
        });
    }
    /**
     * Update image labels.
     * Maps to: PATCH /api/projects/[id]/images
     */
    async updateImageLabels(projectId, labels) {
        return this.request('PATCH', `/api/projects/${projectId}/images`, {
            labels,
        });
    }
    /**
     * Delete an image.
     * Maps to: DELETE /api/projects/[id]/images
     */
    async deleteImage(projectId, imageId) {
        return this.request('DELETE', `/api/projects/${projectId}/images`, {
            image_id: imageId,
        });
    }
}
// ===========================================================================
// HELPER FUNCTIONS
// ===========================================================================
/**
 * Calculate missing fields required for publishing.
 * Used by multiple tools to show what's needed to finalize.
 */
export function getMissingPublishFields(project) {
    const missing = [];
    if (!project.title)
        missing.push('title');
    if (!project.summary)
        missing.push('summary');
    if (!project.challenge)
        missing.push('challenge');
    if (!project.solution)
        missing.push('solution');
    if (!project.results)
        missing.push('results');
    if (!project.project_type)
        missing.push('project_type');
    if (!project.city)
        missing.push('city');
    if (!project.state)
        missing.push('state');
    if (!project.hero_image_id)
        missing.push('hero_image');
    return missing;
}
/**
 * Check if a project has all required fields for publishing.
 */
export function canPublish(project, imageCount) {
    const missing = getMissingPublishFields(project);
    return missing.length === 0 && imageCount >= 1 && project.hero_image_id !== null;
}
/**
 * Transform API project response to MCP output format.
 */
export function toProjectOutput(apiProject) {
    return {
        id: apiProject.id,
        title: apiProject.title,
        description: apiProject.description,
        project_type: apiProject.project_type,
        city: apiProject.city,
        state: apiProject.state,
        status: apiProject.status,
        slug: apiProject.slug,
        summary: apiProject.summary,
        challenge: apiProject.challenge,
        solution: apiProject.solution,
        results: apiProject.results,
        outcome_highlights: apiProject.outcome_highlights,
        hero_image_id: apiProject.hero_image_id,
        client_type: apiProject.client_type,
        budget_range: apiProject.budget_range,
        materials: apiProject.materials,
        techniques: apiProject.techniques,
        duration: apiProject.duration,
        tags: apiProject.tags,
        seo_title: apiProject.seo_title,
        seo_description: apiProject.seo_description,
        created_at: apiProject.created_at,
        updated_at: apiProject.updated_at,
        published_at: apiProject.published_at,
    };
}
/**
 * Transform API image response to MCP output format.
 */
export function toImageOutput(apiImage) {
    return {
        id: apiImage.id,
        url: apiImage.url,
        image_type: apiImage.image_type,
        alt_text: apiImage.alt_text,
        display_order: apiImage.display_order,
    };
}
//# sourceMappingURL=portfolio-client.js.map