/**
 * Portfolio API client for the MCP server.
 *
 * This client wraps the knearme-portfolio API routes, authenticating
 * requests using the contractor's OAuth access token.
 *
 * @see /docs/chatgpt-apps-sdk/PORTFOLIO_TOOL_MAPPING.md
 */

import type {
  ProjectOutput,
  ProjectWithImages,
  ProjectImageOutput,
  ProjectStatus,
} from '../types/mcp.js';

/**
 * API error response structure.
 */
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

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
export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

/**
 * Portfolio API client for MCP tools.
 *
 * Each method maps to a portfolio API route and handles:
 * - Authentication via Bearer token
 * - Error response parsing
 * - Type-safe responses
 */
export class PortfolioClient {
  private baseUrl: string;
  private accessToken: string;

  constructor(config: PortfolioClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.accessToken = config.accessToken;
  }

  /**
   * Make an authenticated API request.
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<ApiResult<T>> {
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
        const errorData = data as ApiError;
        return {
          success: false,
          error: errorData.error?.message || 'API request failed',
          code: errorData.error?.code || 'UNKNOWN_ERROR',
        };
      }

      return { success: true, data: data as T };
    } catch (err) {
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
  async createProject(input: {
    title?: string;
    project_type?: string;
    city?: string;
    state?: string;
    summary?: string;
    challenge?: string;
    solution?: string;
    results?: string;
    outcome_highlights?: string[];
  }): Promise<ApiResult<{ project: ProjectWithImages }>> {
    return this.request('POST', '/api/projects', input);
  }

  /**
   * Get a single project with images.
   * Maps to: GET /api/projects/[id]
   */
  async getProject(
    projectId: string
  ): Promise<ApiResult<{ project: ProjectWithImages }>> {
    return this.request('GET', `/api/projects/${projectId}`);
  }

  /**
   * List contractor's projects.
   * Maps to: GET /api/projects
   */
  async listProjects(params?: {
    status?: ProjectStatus;
    limit?: number;
    offset?: number;
  }): Promise<
    ApiResult<{
      projects: ProjectWithImages[];
      total: number;
      limit: number;
      offset: number;
    }>
  > {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());

    const queryString = query.toString();
    const path = queryString ? `/api/projects?${queryString}` : '/api/projects';

    return this.request('GET', path);
  }

  /**
   * Update project fields.
   * Maps to: PATCH /api/projects/[id]
   */
  async updateProject(
    projectId: string,
    updates: {
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
    }
  ): Promise<ApiResult<{ project: ProjectWithImages }>> {
    return this.request('PATCH', `/api/projects/${projectId}`, updates);
  }

  /**
   * Publish a project.
   * Maps to: POST /api/projects/[id]/publish
   */
  async publishProject(
    projectId: string
  ): Promise<ApiResult<{ project: ProjectWithImages }>> {
    return this.request('POST', `/api/projects/${projectId}/publish`);
  }

  // ===========================================================================
  // IMAGE OPERATIONS
  // ===========================================================================

  /**
   * Request a signed upload URL for a new image.
   * Maps to: POST /api/projects/[id]/images
   */
  async requestImageUpload(
    projectId: string,
    input: {
      filename: string;
      content_type: string;
      image_type?: 'before' | 'after' | 'progress' | 'detail';
      display_order?: number;
      width?: number;
      height?: number;
    }
  ): Promise<
    ApiResult<{
      image: ProjectImageOutput;
      upload: {
        signed_url: string;
        token: string;
        path: string;
      };
    }>
  > {
    return this.request('POST', `/api/projects/${projectId}/images`, input);
  }

  /**
   * List project images.
   * Maps to: GET /api/projects/[id]/images
   */
  async listImages(
    projectId: string
  ): Promise<ApiResult<{ images: ProjectImageOutput[] }>> {
    return this.request('GET', `/api/projects/${projectId}/images`);
  }

  /**
   * Reorder images.
   * Maps to: PATCH /api/projects/[id]/images
   */
  async reorderImages(
    projectId: string,
    imageIds: string[]
  ): Promise<
    ApiResult<{
      reordered: boolean;
      reorderedCount: number;
      labelsUpdated: boolean;
      labelsUpdatedCount: number;
    }>
  > {
    return this.request('PATCH', `/api/projects/${projectId}/images`, {
      image_ids: imageIds,
    });
  }

  /**
   * Update image labels.
   * Maps to: PATCH /api/projects/[id]/images
   */
  async updateImageLabels(
    projectId: string,
    labels: Array<{
      image_id: string;
      image_type?: 'before' | 'after' | 'progress' | 'detail' | null;
      alt_text?: string | null;
    }>
  ): Promise<
    ApiResult<{
      reordered: boolean;
      reorderedCount: number;
      labelsUpdated: boolean;
      labelsUpdatedCount: number;
    }>
  > {
    return this.request('PATCH', `/api/projects/${projectId}/images`, {
      labels,
    });
  }

  /**
   * Delete an image.
   * Maps to: DELETE /api/projects/[id]/images
   */
  async deleteImage(
    projectId: string,
    imageId: string
  ): Promise<ApiResult<{ deleted: boolean }>> {
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
export function getMissingPublishFields(project: ProjectOutput): string[] {
  const missing: string[] = [];

  if (!project.title) missing.push('title');
  if (!project.summary) missing.push('summary');
  if (!project.challenge) missing.push('challenge');
  if (!project.solution) missing.push('solution');
  if (!project.results) missing.push('results');
  if (!project.project_type) missing.push('project_type');
  if (!project.city) missing.push('city');
  if (!project.state) missing.push('state');
  if (!project.hero_image_id) missing.push('hero_image');

  return missing;
}

/**
 * Check if a project has all required fields for publishing.
 */
export function canPublish(
  project: ProjectOutput,
  imageCount: number
): boolean {
  const missing = getMissingPublishFields(project);
  return missing.length === 0 && imageCount >= 1 && project.hero_image_id !== null;
}

/**
 * Transform API project response to MCP output format.
 */
export function toProjectOutput(
  apiProject: Record<string, unknown>
): ProjectOutput {
  return {
    id: apiProject.id as string,
    title: apiProject.title as string | null,
    description: apiProject.description as string | null,
    project_type: apiProject.project_type as string | null,
    city: apiProject.city as string | null,
    state: apiProject.state as string | null,
    status: apiProject.status as ProjectStatus,
    slug: apiProject.slug as string | null,
    summary: apiProject.summary as string | null,
    challenge: apiProject.challenge as string | null,
    solution: apiProject.solution as string | null,
    results: apiProject.results as string | null,
    outcome_highlights: apiProject.outcome_highlights as string[] | null,
    hero_image_id: apiProject.hero_image_id as string | null,
    client_type: apiProject.client_type as ProjectOutput['client_type'],
    budget_range: apiProject.budget_range as ProjectOutput['budget_range'],
    materials: apiProject.materials as string[] | null,
    techniques: apiProject.techniques as string[] | null,
    duration: apiProject.duration as string | null,
    tags: apiProject.tags as string[] | null,
    seo_title: apiProject.seo_title as string | null,
    seo_description: apiProject.seo_description as string | null,
    created_at: apiProject.created_at as string,
    updated_at: apiProject.updated_at as string,
    published_at: apiProject.published_at as string | null,
  };
}

/**
 * Transform API image response to MCP output format.
 */
export function toImageOutput(
  apiImage: Record<string, unknown>
): ProjectImageOutput {
  return {
    id: apiImage.id as string,
    url: apiImage.url as string,
    image_type: apiImage.image_type as ProjectImageOutput['image_type'],
    alt_text: apiImage.alt_text as string | null,
    display_order: apiImage.display_order as number,
  };
}
