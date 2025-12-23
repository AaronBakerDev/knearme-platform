/**
 * MCP Tool Definitions and Handlers.
 *
 * @see /docs/chatgpt-apps-sdk/MCP_CONTRACTOR_INTERFACE.md
 */

import { z } from 'zod';
import {
  PortfolioClient,
  getMissingPublishFields,
  canPublish,
  toProjectOutput,
  toImageOutput,
} from './portfolio-client';
import { buildWidgetMeta } from './widget';
import type {
  AuthContext,
  ProjectImageOutput,
  CreateProjectDraftOutput,
  AddProjectMediaOutput,
  MediaUpdateOutput,
  UpdateProjectSectionsOutput,
  UpdateProjectMetaOutput,
  FinalizeProjectOutput,
  ListContractorProjectsOutput,
  GetProjectStatusOutput,
} from './types';

// ============================================================================
// TOOL SCHEMAS
// ============================================================================

export const createProjectDraftSchema = z.object({
  project_type: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  summary: z.string().optional(),
  challenge: z.string().optional(),
  solution: z.string().optional(),
  results: z.string().optional(),
  outcome_highlights: z.array(z.string()).optional(),
});

export const addProjectMediaSchema = z.object({
  project_id: z.string().uuid(),
  images: z.array(
    z.object({
      url: z.string().url(),
      filename: z.string().optional(),
      image_type: z.enum(['before', 'after', 'progress', 'detail']).optional(),
      alt_text: z.string().optional(),
    })
  ).min(1).max(10),
});

export const reorderProjectMediaSchema = z.object({
  project_id: z.string().uuid(),
  image_ids: z.array(z.string().uuid()),
});

export const setProjectHeroMediaSchema = z.object({
  project_id: z.string().uuid(),
  hero_image_id: z.string().uuid(),
});

export const setProjectMediaLabelsSchema = z.object({
  project_id: z.string().uuid(),
  labels: z.array(
    z.object({
      image_id: z.string().uuid(),
      image_type: z.enum(['before', 'after', 'progress', 'detail']).nullable().optional(),
      alt_text: z.string().nullable().optional(),
    })
  ),
});

export const updateProjectSectionsSchema = z.object({
  project_id: z.string().uuid(),
  summary: z.string().optional(),
  challenge: z.string().optional(),
  solution: z.string().optional(),
  results: z.string().optional(),
  outcome_highlights: z.array(z.string()).optional(),
});

export const updateProjectMetaSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().optional(),
  project_type: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  duration: z.string().optional(),
  tags: z.array(z.string()).optional(),
  materials: z.array(z.string()).optional(),
  techniques: z.array(z.string()).optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
});

export const finalizeProjectSchema = z.object({
  project_id: z.string().uuid(),
});

export const listContractorProjectsSchema = z.object({
  status: z.enum(['draft', 'published', 'archived']).optional(),
  limit: z.number().int().min(1).max(50).optional(),
  offset: z.number().int().min(0).optional(),
});

export const getProjectStatusSchema = z.object({
  project_id: z.string().uuid(),
});

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

export const toolDefinitions = [
  {
    name: 'create_project_draft',
    description: 'Create a new draft case-study project. Returns project ID and missing fields.',
    inputSchema: {
      type: 'object',
      properties: {
        project_type: { type: 'string', description: 'Type of project (e.g., chimney rebuild)' },
        city: { type: 'string', description: 'City where the project is located' },
        state: { type: 'string', description: 'State where the project is located' },
        summary: { type: 'string', description: '1-2 sentence hook' },
        challenge: { type: 'string', description: 'What was the problem' },
        solution: { type: 'string', description: 'What the contractor did' },
        results: { type: 'string', description: 'Outcome or impact' },
        outcome_highlights: { type: 'array', items: { type: 'string' }, description: '2-4 bullet outcomes' },
      },
      required: [],
    },
  },
  {
    name: 'add_project_media',
    description: 'Add images to a project draft. Provide image URLs that the server will download and store.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        images: {
          type: 'array',
          description: 'Array of images to add (1-10 images)',
          items: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'URL of the image to download' },
              filename: { type: 'string', description: 'Optional filename' },
              image_type: { type: 'string', enum: ['before', 'after', 'progress', 'detail'], description: 'Image classification' },
              alt_text: { type: 'string', description: 'Alt text for accessibility' },
            },
            required: ['url'],
          },
        },
      },
      required: ['project_id', 'images'],
    },
  },
  {
    name: 'reorder_project_media',
    description: 'Reorder project images.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string' },
        image_ids: { type: 'array', items: { type: 'string' } },
      },
      required: ['project_id', 'image_ids'],
    },
  },
  {
    name: 'set_project_hero_media',
    description: 'Set the hero image for a project.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string' },
        hero_image_id: { type: 'string' },
      },
      required: ['project_id', 'hero_image_id'],
    },
  },
  {
    name: 'set_project_media_labels',
    description: 'Label images as before/after/progress/detail and add alt text.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string' },
        labels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              image_id: { type: 'string' },
              image_type: { type: 'string', enum: ['before', 'after', 'progress', 'detail'] },
              alt_text: { type: 'string' },
            },
            required: ['image_id'],
          },
        },
      },
      required: ['project_id', 'labels'],
    },
  },
  {
    name: 'update_project_sections',
    description: 'Update narrative sections: summary, challenge, solution, results.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string' },
        summary: { type: 'string' },
        challenge: { type: 'string' },
        solution: { type: 'string' },
        results: { type: 'string' },
        outcome_highlights: { type: 'array', items: { type: 'string' } },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'update_project_meta',
    description: 'Update project metadata: title, type, location, duration, tags, SEO.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string' },
        title: { type: 'string' },
        project_type: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        duration: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        materials: { type: 'array', items: { type: 'string' } },
        techniques: { type: 'array', items: { type: 'string' } },
        seo_title: { type: 'string' },
        seo_description: { type: 'string' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'finalize_project',
    description: 'Publish the project. Requires all mandatory fields. Ask for confirmation first.',
    inputSchema: {
      type: 'object',
      properties: { project_id: { type: 'string' } },
      required: ['project_id'],
    },
  },
  {
    name: 'list_contractor_projects',
    description: "List the contractor's projects. Can filter by status.",
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['draft', 'published', 'archived'] },
        limit: { type: 'number' },
        offset: { type: 'number' },
      },
      required: [],
    },
  },
  {
    name: 'get_project_status',
    description: 'Get project status including images and missing fields.',
    inputSchema: {
      type: 'object',
      properties: { project_id: { type: 'string' } },
      required: ['project_id'],
    },
  },
];

// ============================================================================
// TOOL HANDLERS
// ============================================================================

export type ToolResult<T> = { success: true; result: T } | { success: false; error: string };

function createClient(auth: AuthContext, baseUrl: string): PortfolioClient {
  return new PortfolioClient({ baseUrl, accessToken: auth.accessToken });
}

export async function handleCreateProjectDraft(
  input: z.infer<typeof createProjectDraftSchema>,
  auth: AuthContext,
  baseUrl: string
): Promise<ToolResult<CreateProjectDraftOutput>> {
  const client = createClient(auth, baseUrl);
  const result = await client.createProject(input);

  if (!result.success) return { success: false, error: result.error };

  const project = toProjectOutput(result.data.project as unknown as Record<string, unknown>);
  const missing = getMissingPublishFields(project);
  const images = (result.data.project as unknown as { project_images?: unknown[] }).project_images || [];
  if (images.length === 0) missing.push('images');

  return {
    success: true,
    result: {
      structuredContent: { project_id: project.id, missing_fields: missing },
      _meta: buildWidgetMeta('project-draft', { project, missing_fields: missing, can_publish: false }, { project }),
    },
  };
}

export async function handleAddProjectMedia(
  input: z.infer<typeof addProjectMediaSchema>,
  auth: AuthContext,
  baseUrl: string
): Promise<ToolResult<AddProjectMediaOutput>> {
  const client = createClient(auth, baseUrl);

  // Upload images from URLs using the new endpoint
  const uploadResult = await client.addImagesFromUrls(input.project_id, input.images);
  if (!uploadResult.success) return { success: false, error: uploadResult.error };

  // Check if any uploads failed
  const { uploaded, failed, errors } = uploadResult.data;
  if (uploaded === 0 && failed > 0) {
    const errorMessages = errors?.map(e => `${e.url}: ${e.error}`).join('; ') || 'Unknown error';
    return { success: false, error: `Failed to upload images: ${errorMessages}` };
  }

  // Get updated project with all images
  const projectResult = await client.getProject(input.project_id);
  if (!projectResult.success) return { success: false, error: projectResult.error };

  const project = toProjectOutput(projectResult.data.project as unknown as Record<string, unknown>);
  const images = (projectResult.data.project as unknown as { project_images?: unknown[] }).project_images || [];
  const imageOutputs = images.map((img) => toImageOutput(img as unknown as Record<string, unknown>));
  const missing = getMissingPublishFields(project);
  if (imageOutputs.length === 0) missing.push('images');

  // Include partial success info in the response
  const statusMessage = failed > 0
    ? `Uploaded ${uploaded} images, ${failed} failed`
    : `Uploaded ${uploaded} images`;

  return {
    success: true,
    result: {
      structuredContent: {
        project_id: input.project_id,
        media_count: imageOutputs.length,
        missing_fields: missing,
        upload_status: statusMessage,
        upload_errors: errors,
      },
      _meta: buildWidgetMeta('project-media', { project_id: input.project_id, images: imageOutputs, hero_image_id: project.hero_image_id }, { images: imageOutputs }),
    },
  };
}

export async function handleReorderProjectMedia(
  input: z.infer<typeof reorderProjectMediaSchema>,
  auth: AuthContext,
  baseUrl: string
): Promise<ToolResult<MediaUpdateOutput>> {
  const client = createClient(auth, baseUrl);
  const result = await client.reorderImages(input.project_id, input.image_ids);
  if (!result.success) return { success: false, error: result.error };

  const imagesResult = await client.listImages(input.project_id);
  if (!imagesResult.success) return { success: false, error: imagesResult.error };

  const images = imagesResult.data.images.map((img) => toImageOutput(img as unknown as Record<string, unknown>));

  return {
    success: true,
    result: {
      structuredContent: { project_id: input.project_id, status: 'ok' },
      _meta: buildWidgetMeta('project-media', { project_id: input.project_id, images }, { images }),
    },
  };
}

export async function handleSetProjectHeroMedia(
  input: z.infer<typeof setProjectHeroMediaSchema>,
  auth: AuthContext,
  baseUrl: string
): Promise<ToolResult<MediaUpdateOutput>> {
  const client = createClient(auth, baseUrl);
  const result = await client.updateProject(input.project_id, { hero_image_id: input.hero_image_id });
  if (!result.success) return { success: false, error: result.error };

  const imagesResult = await client.listImages(input.project_id);
  const images = imagesResult.success
    ? imagesResult.data.images.map((img) => toImageOutput(img as unknown as Record<string, unknown>))
    : [];

  return {
    success: true,
    result: {
      structuredContent: { project_id: input.project_id, status: 'ok' },
      _meta: buildWidgetMeta('project-media', { project_id: input.project_id, images, hero_image_id: input.hero_image_id }, { images }),
    },
  };
}

export async function handleSetProjectMediaLabels(
  input: z.infer<typeof setProjectMediaLabelsSchema>,
  auth: AuthContext,
  baseUrl: string
): Promise<ToolResult<MediaUpdateOutput>> {
  const client = createClient(auth, baseUrl);
  const result = await client.updateImageLabels(input.project_id, input.labels);
  if (!result.success) return { success: false, error: result.error };

  const imagesResult = await client.listImages(input.project_id);
  const images = imagesResult.success
    ? imagesResult.data.images.map((img) => toImageOutput(img as unknown as Record<string, unknown>))
    : [];

  return {
    success: true,
    result: {
      structuredContent: { project_id: input.project_id, status: 'ok' },
      _meta: buildWidgetMeta('project-media', { project_id: input.project_id, images }, { images }),
    },
  };
}

export async function handleUpdateProjectSections(
  input: z.infer<typeof updateProjectSectionsSchema>,
  auth: AuthContext,
  baseUrl: string
): Promise<ToolResult<UpdateProjectSectionsOutput>> {
  const client = createClient(auth, baseUrl);
  const { project_id, ...updates } = input;
  const result = await client.updateProject(project_id, updates);
  if (!result.success) return { success: false, error: result.error };

  const project = toProjectOutput(result.data.project as unknown as Record<string, unknown>);
  const images = (result.data.project as { project_images?: unknown[] }).project_images || [];
  const missing = getMissingPublishFields(project);
  if (images.length === 0) missing.push('images');

  return {
    success: true,
    result: {
      structuredContent: { project_id, missing_fields: missing },
      _meta: buildWidgetMeta('project-draft', { project, missing_fields: missing, can_publish: canPublish(project, images.length) }, { project }),
    },
  };
}

export async function handleUpdateProjectMeta(
  input: z.infer<typeof updateProjectMetaSchema>,
  auth: AuthContext,
  baseUrl: string
): Promise<ToolResult<UpdateProjectMetaOutput>> {
  const client = createClient(auth, baseUrl);
  const { project_id, ...updates } = input;
  const result = await client.updateProject(project_id, updates);
  if (!result.success) return { success: false, error: result.error };

  const project = toProjectOutput(result.data.project as unknown as Record<string, unknown>);
  const images = (result.data.project as { project_images?: unknown[] }).project_images || [];
  const missing = getMissingPublishFields(project);
  if (images.length === 0) missing.push('images');

  return {
    success: true,
    result: {
      structuredContent: { project_id, status: 'ok' },
      _meta: buildWidgetMeta('project-draft', { project, missing_fields: missing, can_publish: canPublish(project, images.length) }, { project }),
    },
  };
}

export async function handleFinalizeProject(
  input: z.infer<typeof finalizeProjectSchema>,
  auth: AuthContext,
  baseUrl: string
): Promise<ToolResult<FinalizeProjectOutput>> {
  const client = createClient(auth, baseUrl);
  const result = await client.publishProject(input.project_id);
  if (!result.success) return { success: false, error: result.error };

  const project = toProjectOutput(result.data.project as unknown as Record<string, unknown>);
  const images = (result.data.project as { project_images?: unknown[] }).project_images || [];
  const imageOutputs = images.map((img) => toImageOutput(img as unknown as Record<string, unknown>));

  const basePublicUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.co';
  const url = project.city_slug && project.project_type_slug && project.slug
    ? `${basePublicUrl}/${project.city_slug}/masonry/${project.project_type_slug}/${project.slug}`
    : basePublicUrl;

  return {
    success: true,
    result: {
      structuredContent: { project_id: input.project_id, status: 'published', url },
      _meta: buildWidgetMeta('project-status', { project: { ...project, images: imageOutputs }, missing_fields: [], can_publish: false, public_url: url }, { project: { ...project, images: imageOutputs } }),
    },
  };
}

export async function handleListContractorProjects(
  input: z.infer<typeof listContractorProjectsSchema>,
  auth: AuthContext,
  baseUrl: string
): Promise<ToolResult<ListContractorProjectsOutput>> {
  const client = createClient(auth, baseUrl);
  const result = await client.listProjects({ status: input.status, limit: input.limit || 10, offset: input.offset || 0 });
  if (!result.success) return { success: false, error: result.error };

  const projects = result.data.projects.map((p) => toProjectOutput(p as unknown as Record<string, unknown>));

  return {
    success: true,
    result: {
      structuredContent: { count: projects.length, has_more: result.data.total > (input.offset || 0) + projects.length },
      _meta: buildWidgetMeta('project-list', { projects, total: result.data.total, status_filter: input.status }, { projects }),
    },
  };
}

export async function handleGetProjectStatus(
  input: z.infer<typeof getProjectStatusSchema>,
  auth: AuthContext,
  baseUrl: string
): Promise<ToolResult<GetProjectStatusOutput>> {
  const client = createClient(auth, baseUrl);
  const result = await client.getProject(input.project_id);
  if (!result.success) return { success: false, error: result.error };

  const project = toProjectOutput(result.data.project as unknown as Record<string, unknown>);
  const images = (result.data.project as { project_images?: unknown[] }).project_images || [];
  const imageOutputs = images.map((img) => toImageOutput(img as unknown as Record<string, unknown>));
  const missing = getMissingPublishFields(project);
  if (imageOutputs.length === 0) missing.push('images');
  const publishable = canPublish(project, imageOutputs.length);

  return {
    success: true,
    result: {
      structuredContent: { project_id: input.project_id, status: project.status, missing_fields: missing, can_publish: publishable },
      _meta: buildWidgetMeta('project-status', { project: { ...project, images: imageOutputs }, missing_fields: missing, can_publish: publishable }, { project: { ...project, images: imageOutputs } }),
    },
  };
}

// ============================================================================
// TOOL DISPATCHER
// ============================================================================

export function formatZodError(error: z.ZodError): string {
  return error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
}

export async function dispatchTool(
  toolName: string,
  toolArgs: Record<string, unknown>,
  auth: AuthContext,
  baseUrl: string
): Promise<{ success: true; result: { structuredContent: unknown; _meta?: unknown } } | { success: false; error: string }> {
  switch (toolName) {
    case 'create_project_draft': {
      const parsed = createProjectDraftSchema.safeParse(toolArgs);
      if (!parsed.success) return { success: false, error: formatZodError(parsed.error) };
      return handleCreateProjectDraft(parsed.data, auth, baseUrl);
    }
    case 'add_project_media': {
      const parsed = addProjectMediaSchema.safeParse(toolArgs);
      if (!parsed.success) return { success: false, error: formatZodError(parsed.error) };
      return handleAddProjectMedia(parsed.data, auth, baseUrl);
    }
    case 'reorder_project_media': {
      const parsed = reorderProjectMediaSchema.safeParse(toolArgs);
      if (!parsed.success) return { success: false, error: formatZodError(parsed.error) };
      return handleReorderProjectMedia(parsed.data, auth, baseUrl);
    }
    case 'set_project_hero_media': {
      const parsed = setProjectHeroMediaSchema.safeParse(toolArgs);
      if (!parsed.success) return { success: false, error: formatZodError(parsed.error) };
      return handleSetProjectHeroMedia(parsed.data, auth, baseUrl);
    }
    case 'set_project_media_labels': {
      const parsed = setProjectMediaLabelsSchema.safeParse(toolArgs);
      if (!parsed.success) return { success: false, error: formatZodError(parsed.error) };
      return handleSetProjectMediaLabels(parsed.data, auth, baseUrl);
    }
    case 'update_project_sections': {
      const parsed = updateProjectSectionsSchema.safeParse(toolArgs);
      if (!parsed.success) return { success: false, error: formatZodError(parsed.error) };
      return handleUpdateProjectSections(parsed.data, auth, baseUrl);
    }
    case 'update_project_meta': {
      const parsed = updateProjectMetaSchema.safeParse(toolArgs);
      if (!parsed.success) return { success: false, error: formatZodError(parsed.error) };
      return handleUpdateProjectMeta(parsed.data, auth, baseUrl);
    }
    case 'finalize_project': {
      const parsed = finalizeProjectSchema.safeParse(toolArgs);
      if (!parsed.success) return { success: false, error: formatZodError(parsed.error) };
      return handleFinalizeProject(parsed.data, auth, baseUrl);
    }
    case 'list_contractor_projects': {
      const parsed = listContractorProjectsSchema.safeParse(toolArgs);
      if (!parsed.success) return { success: false, error: formatZodError(parsed.error) };
      return handleListContractorProjects(parsed.data, auth, baseUrl);
    }
    case 'get_project_status': {
      const parsed = getProjectStatusSchema.safeParse(toolArgs);
      if (!parsed.success) return { success: false, error: formatZodError(parsed.error) };
      return handleGetProjectStatus(parsed.data, auth, baseUrl);
    }
    default:
      return { success: false, error: `Unknown tool: ${toolName}` };
  }
}
