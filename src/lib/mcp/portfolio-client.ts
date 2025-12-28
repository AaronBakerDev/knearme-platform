/**
 * Portfolio API client for the MCP endpoint.
 *
 * Wraps portfolio API routes, authenticating requests with OAuth access tokens.
 * For Next.js API routes, this calls the same app's API endpoints internally.
 *
 * @see /docs/chatgpt-apps-sdk/PORTFOLIO_TOOL_MAPPING.md
 */

import { getPublicUrl } from '@/lib/storage/upload';
import type { ProjectOutput, ProjectImageOutput, ProjectStatus } from './types';

interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PortfolioClientConfig {
  baseUrl: string;
  accessToken: string;
}

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

interface ProjectWithImages {
  id: string;
  title?: string | null;
  project_type?: string | null;
  project_type_slug?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  city_slug?: string | null;
  slug?: string | null;
  status: string;
  hero_image_id?: string | null;
  summary?: string | null;
  challenge?: string | null;
  solution?: string | null;
  results?: string | null;
  outcome_highlights?: string[] | null;
  description?: string | null;
  materials?: string[] | null;
  techniques?: string[] | null;
  duration?: string | null;
  tags?: string[] | null;
  seo_title?: string | null;
  seo_description?: string | null;
  client_type?: string | null;
  budget_range?: string | null;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  project_images?: Array<Record<string, unknown>>;
}

export class PortfolioClient {
  private baseUrl: string;
  private accessToken: string;

  constructor(config: PortfolioClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.accessToken = config.accessToken;
  }

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

  async getProject(projectId: string): Promise<ApiResult<{ project: ProjectWithImages }>> {
    return this.request('GET', `/api/projects/${projectId}`);
  }

  async listProjects(params?: {
    status?: ProjectStatus;
    limit?: number;
    offset?: number;
  }): Promise<ApiResult<{
    projects: ProjectWithImages[];
    total: number;
    limit: number;
    offset: number;
  }>> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());

    const queryString = query.toString();
    const path = queryString ? `/api/projects?${queryString}` : '/api/projects';

    return this.request('GET', path);
  }

  async updateProject(
    projectId: string,
    updates: Record<string, unknown>
  ): Promise<ApiResult<{ project: ProjectWithImages }>> {
    return this.request('PATCH', `/api/projects/${projectId}`, updates);
  }

  async publishProject(projectId: string): Promise<ApiResult<{ project: ProjectWithImages }>> {
    return this.request('POST', `/api/projects/${projectId}/publish`);
  }

  async unpublishProject(projectId: string): Promise<ApiResult<{ project: ProjectWithImages }>> {
    return this.request('DELETE', `/api/projects/${projectId}/publish`);
  }

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
  ): Promise<ApiResult<{
    image: ProjectImageOutput;
    upload: { signed_url: string; token: string; path: string };
  }>> {
    return this.request('POST', `/api/projects/${projectId}/images`, input);
  }

  async listImages(projectId: string): Promise<ApiResult<{ images: ProjectImageOutput[] }>> {
    return this.request('GET', `/api/projects/${projectId}/images`);
  }

  /**
   * Upload images from URLs - for MCP/ChatGPT integration.
   * The server downloads and stores the images.
   */
  async addImagesFromUrls(
    projectId: string,
    images: Array<{
      url: string;
      filename?: string;
      image_type?: 'before' | 'after' | 'progress' | 'detail';
      alt_text?: string;
    }>
  ): Promise<ApiResult<{
    uploaded: number;
    failed: number;
    images: Array<{
      id: string;
      url: string;
      image_type: string | null;
      display_order: number;
    }>;
    errors?: Array<{ url: string; error: string }>;
  }>> {
    return this.request('POST', `/api/projects/${projectId}/images/from-url`, { images });
  }

  async reorderImages(
    projectId: string,
    imageIds: string[]
  ): Promise<ApiResult<{
    reordered: boolean;
    reorderedCount: number;
    labelsUpdated: boolean;
    labelsUpdatedCount: number;
  }>> {
    return this.request('PATCH', `/api/projects/${projectId}/images`, { image_ids: imageIds });
  }

  async updateImageLabels(
    projectId: string,
    labels: Array<{
      image_id: string;
      image_type?: 'before' | 'after' | 'progress' | 'detail' | null;
      alt_text?: string | null;
    }>
  ): Promise<ApiResult<{
    reordered: boolean;
    reorderedCount: number;
    labelsUpdated: boolean;
    labelsUpdatedCount: number;
  }>> {
    return this.request('PATCH', `/api/projects/${projectId}/images`, { labels });
  }

  async deleteImage(
    projectId: string,
    imageId: string
  ): Promise<ApiResult<{ deleted: boolean }>> {
    return this.request('DELETE', `/api/projects/${projectId}/images`, { image_id: imageId });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getMissingPublishFields(project: ProjectOutput): string[] {
  const missing: string[] = [];
  if (!project.title) missing.push('title');
  if (!project.project_type) missing.push('project_type');
  if (!project.city) missing.push('city');
  if (!project.state) missing.push('state');
  if (!project.hero_image_id) missing.push('hero_image_id');
  return missing;
}

export function canPublish(project: ProjectOutput, imageCount: number): boolean {
  const missing = getMissingPublishFields(project);
  return missing.length === 0 && imageCount >= 1 && project.hero_image_id !== null;
}

export function toProjectOutput(apiProject: Record<string, unknown>): ProjectOutput {
  return {
    id: apiProject.id as string,
    title: apiProject.title as string | null,
    description: apiProject.description as string | null,
    project_type: apiProject.project_type as string | null,
    project_type_slug: apiProject.project_type_slug as string | null,
    neighborhood: apiProject.neighborhood as string | null,
    city: apiProject.city as string | null,
    state: apiProject.state as string | null,
    city_slug: apiProject.city_slug as string | null,
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
    hero_image_url: apiProject.hero_image_url as string | null ?? null,
    created_at: apiProject.created_at as string,
    updated_at: apiProject.updated_at as string,
    published_at: apiProject.published_at as string | null,
  };
}

export function toImageOutput(apiImage: Record<string, unknown>): ProjectImageOutput {
  const storagePath = apiImage.storage_path as string | undefined;
  const resolvedUrl = typeof apiImage.url === 'string'
    ? (apiImage.url as string)
    : storagePath
      ? getPublicUrl('project-images', storagePath)
      : '';

  return {
    id: apiImage.id as string,
    url: resolvedUrl,
    image_type: apiImage.image_type as ProjectImageOutput['image_type'],
    alt_text: apiImage.alt_text as string | null,
    display_order: apiImage.display_order as number,
  };
}

export function attachHeroImageUrl(
  project: ProjectOutput,
  images: ProjectImageOutput[]
): ProjectOutput {
  if (!project.hero_image_id) {
    return { ...project, hero_image_url: null };
  }

  const heroImage = images.find((img) => img.id === project.hero_image_id);
  return { ...project, hero_image_url: heroImage?.url ?? null };
}
