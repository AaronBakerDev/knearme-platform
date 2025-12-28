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
  attachHeroImageUrl,
} from './portfolio-client';
import { buildWidgetMeta } from './widget';
import type {
  AuthContext,
  CreateProjectDraftOutput,
  AddProjectMediaOutput,
  MediaUpdateOutput,
  UpdateProjectSectionsOutput,
  UpdateProjectMetaOutput,
  FinalizeProjectOutput,
  PublishProjectOutput,
  UnpublishProjectOutput,
  ListContractorProjectsOutput,
  GetProjectStatusOutput,
} from './types';

// ============================================================================
// TOOL SCHEMAS
// ============================================================================

export const createProjectDraftSchema = z.object({
  title: z.string().optional(),
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
  files: z.array(
    z.object({
      file_id: z.string(),
      filename: z.string(),
      content_type: z.string(),
      image_type: z.enum(['before', 'after', 'progress', 'detail']).optional(),
      alt_text: z.string().optional(),
      display_order: z.number().int().min(0).optional(),
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
    })
  ).min(1).max(10).optional(),
  images: z.array(
    z.object({
      url: z.string().url(),
      filename: z.string().optional(),
      image_type: z.enum(['before', 'after', 'progress', 'detail']).optional(),
      alt_text: z.string().optional(),
    })
  ).min(1).max(10).optional(),
}).refine((data) => (data.files && data.files.length > 0) || (data.images && data.images.length > 0), {
  message: 'files or images required',
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
  neighborhood: z.string().optional(),
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

const TOOL_OUTPUT_TEMPLATE = 'template://knearme-portfolio';

type ToolHints = {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  openWorldHint?: boolean;
};

function buildToolMeta(options: {
  invoking: string;
  invoked: string;
  hints?: ToolHints;
  widgetAccessible?: boolean;
  visibility?: 'private';
}) {
  return {
    'openai/outputTemplate': TOOL_OUTPUT_TEMPLATE,
    'openai/toolInvocation/invoking': options.invoking,
    'openai/toolInvocation/invoked': options.invoked,
    ...(options.hints ? { 'openai/toolHints': options.hints } : {}),
    ...(options.widgetAccessible ? { 'openai/widgetAccessible': true } : {}),
    ...(options.visibility ? { 'openai/visibility': options.visibility } : {}),
  };
}

export const toolDefinitions = [
  {
    name: 'create_project_draft',
    title: 'Create Project Draft',
    description: 'Create a new draft case-study project. Returns project ID and missing fields.',
    _meta: buildToolMeta({
      invoking: 'Creating a new project draft…',
      invoked: 'Draft created.',
    }),
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Optional project title' },
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
    title: 'Add Project Media',
    description: 'Add images to a project draft. Prefer ChatGPT file IDs; URL imports are supported as a fallback.',
    _meta: buildToolMeta({
      invoking: 'Adding project images…',
      invoked: 'Images queued for upload.',
      hints: { openWorldHint: true },
    }),
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        files: {
          type: 'array',
          description: 'Array of ChatGPT file uploads (1-10 files)',
          items: {
            type: 'object',
            properties: {
              file_id: { type: 'string', description: 'ChatGPT file ID' },
              filename: { type: 'string', description: 'Original filename' },
              content_type: { type: 'string', description: 'MIME type (e.g., image/jpeg)' },
              image_type: { type: 'string', enum: ['before', 'after', 'progress', 'detail'], description: 'Image classification' },
              alt_text: { type: 'string', description: 'Alt text for accessibility' },
              display_order: { type: 'number', description: 'Optional display order index' },
              width: { type: 'number', description: 'Image width in pixels' },
              height: { type: 'number', description: 'Image height in pixels' },
            },
            required: ['file_id', 'filename', 'content_type'],
          },
        },
        images: {
          type: 'array',
          description: 'Fallback: import images by URL (1-10 images)',
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
      required: ['project_id'],
    },
  },
  {
    name: 'reorder_project_media',
    title: 'Reorder Project Media',
    description: 'Reorder project images.',
    _meta: buildToolMeta({
      invoking: 'Reordering images…',
      invoked: 'Images reordered.',
      widgetAccessible: true,
    }),
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
    title: 'Set Project Hero Image',
    description: 'Set the hero image for a project.',
    _meta: buildToolMeta({
      invoking: 'Setting hero image…',
      invoked: 'Hero image updated.',
      widgetAccessible: true,
    }),
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
    title: 'Set Project Media Labels',
    description: 'Label images as before/after/progress/detail and add alt text.',
    _meta: buildToolMeta({
      invoking: 'Updating image labels…',
      invoked: 'Image labels updated.',
      widgetAccessible: true,
    }),
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
    title: 'Update Project Sections',
    description: 'Update narrative sections: summary, challenge, solution, results.',
    _meta: buildToolMeta({
      invoking: 'Updating project sections…',
      invoked: 'Project sections updated.',
      widgetAccessible: true,
    }),
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
    title: 'Update Project Metadata',
    description: 'Update project metadata: title, type, location, duration, tags, SEO.',
    _meta: buildToolMeta({
      invoking: 'Updating project details…',
      invoked: 'Project details updated.',
    }),
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string' },
        title: { type: 'string' },
        project_type: { type: 'string' },
        neighborhood: { type: 'string' },
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
    name: 'publish_project',
    title: 'Publish Project',
    description: 'Publish the project. Requires all mandatory fields. Ask for confirmation first.',
    _meta: buildToolMeta({
      invoking: 'Publishing project…',
      invoked: 'Project published.',
      hints: { destructiveHint: true },
    }),
    inputSchema: {
      type: 'object',
      properties: { project_id: { type: 'string' } },
      required: ['project_id'],
    },
  },
  {
    name: 'unpublish_project',
    title: 'Unpublish Project',
    description: 'Revert a published project to draft status.',
    _meta: buildToolMeta({
      invoking: 'Reverting project to draft…',
      invoked: 'Project reverted to draft.',
    }),
    inputSchema: {
      type: 'object',
      properties: { project_id: { type: 'string' } },
      required: ['project_id'],
    },
  },
  {
    name: 'list_projects',
    title: 'List Projects',
    description: "List the contractor's projects. Can filter by status.",
    _meta: buildToolMeta({
      invoking: 'Fetching projects…',
      invoked: 'Projects loaded.',
      hints: { readOnlyHint: true },
    }),
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
    name: 'list_contractor_projects',
    title: 'List Contractor Projects (Legacy)',
    description: "List the contractor's projects. Can filter by status.",
    _meta: buildToolMeta({
      invoking: 'Fetching projects…',
      invoked: 'Projects loaded.',
      hints: { readOnlyHint: true },
      visibility: 'private',
    }),
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
    title: 'Get Project Status',
    description: 'Get project status including images and missing fields.',
    _meta: buildToolMeta({
      invoking: 'Fetching project status…',
      invoked: 'Project status loaded.',
      hints: { readOnlyHint: true },
    }),
    inputSchema: {
      type: 'object',
      properties: { project_id: { type: 'string' } },
      required: ['project_id'],
    },
  },
  {
    name: 'finalize_project',
    title: 'Finalize Project (Legacy)',
    description: 'Publish the project. Requires all mandatory fields. Ask for confirmation first.',
    _meta: buildToolMeta({
      invoking: 'Publishing project…',
      invoked: 'Project published.',
      hints: { destructiveHint: true },
      visibility: 'private',
    }),
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
  const images = (result.data.project as unknown as { project_images?: unknown[] }).project_images || [];
  const imageOutputs = images.map((img) => toImageOutput(img as unknown as Record<string, unknown>));
  const projectWithHero = attachHeroImageUrl(project, imageOutputs);
  const missing = getMissingPublishFields(projectWithHero);
  if (imageOutputs.length === 0) missing.push('images');

  return {
    success: true,
    result: {
      structuredContent: { project_id: project.id, missing_fields: missing },
      _meta: buildWidgetMeta(
        'project-draft',
        { project: projectWithHero, missing_fields: missing, can_publish: false },
        { project: projectWithHero }
      ),
    },
  };
}

export async function handleAddProjectMedia(
  input: z.infer<typeof addProjectMediaSchema>,
  auth: AuthContext,
  baseUrl: string
): Promise<ToolResult<AddProjectMediaOutput>> {
  const client = createClient(auth, baseUrl);
  const uploadErrors: Array<{ file_id?: string; url?: string; error: string }> = [];
  const uploads: Array<{
    file_id: string;
    image_id: string;
    signed_url: string;
    token: string;
    path: string;
    content_type: string;
  }> = [];

  let urlUploaded = 0;
  let urlFailed = 0;

  if (input.files && input.files.length > 0) {
    for (const file of input.files) {
      const uploadResult = await client.requestImageUpload(input.project_id, {
        filename: file.filename,
        content_type: file.content_type,
        image_type: file.image_type,
        display_order: file.display_order,
        width: file.width,
        height: file.height,
      });

      if (!uploadResult.success) {
        uploadErrors.push({ file_id: file.file_id, error: uploadResult.error });
        continue;
      }

      uploads.push({
        file_id: file.file_id,
        image_id: uploadResult.data.image.id,
        signed_url: uploadResult.data.upload.signed_url,
        token: uploadResult.data.upload.token,
        path: uploadResult.data.upload.path,
        content_type: file.content_type,
      });
    }
  }

  if (input.images && input.images.length > 0) {
    const urlResult = await client.addImagesFromUrls(input.project_id, input.images);
    if (!urlResult.success) return { success: false, error: urlResult.error };

    urlUploaded = urlResult.data.uploaded;
    urlFailed = urlResult.data.failed;
    if (urlResult.data.errors) {
      urlResult.data.errors.forEach((error) => {
        uploadErrors.push({ url: error.url, error: error.error });
      });
    }
  }

  if (uploads.length === 0 && urlUploaded === 0 && uploadErrors.length > 0) {
    const errorMessages = uploadErrors
      .map((error) => error.file_id ? `${error.file_id}: ${error.error}` : `${error.url}: ${error.error}`)
      .join('; ');
    return { success: false, error: `Failed to add images: ${errorMessages}` };
  }

  // Get updated project with all images
  const projectResult = await client.getProject(input.project_id);
  if (!projectResult.success) return { success: false, error: projectResult.error };

  const project = toProjectOutput(projectResult.data.project as unknown as Record<string, unknown>);
  const images = (projectResult.data.project as unknown as { project_images?: unknown[] }).project_images || [];
  const imageOutputs = images.map((img) => toImageOutput(img as unknown as Record<string, unknown>));
  const projectWithHero = attachHeroImageUrl(project, imageOutputs);
  const missing = getMissingPublishFields(projectWithHero);
  if (imageOutputs.length === 0) missing.push('images');

  const statusParts: string[] = [];
  if (uploads.length > 0) statusParts.push(`Prepared ${uploads.length} upload${uploads.length === 1 ? '' : 's'}`);
  if (urlUploaded > 0) statusParts.push(`Imported ${urlUploaded} image${urlUploaded === 1 ? '' : 's'}`);
  if (urlFailed > 0) statusParts.push(`${urlFailed} URL import failed`);
  if (uploadErrors.length > 0 && urlFailed === 0) statusParts.push(`${uploadErrors.length} upload errors`);
  const statusMessage = statusParts.length > 0 ? statusParts.join(', ') : 'No images added';

  return {
    success: true,
    result: {
      structuredContent: {
        project_id: input.project_id,
        media_count: imageOutputs.length,
        missing_fields: missing,
        upload_status: statusMessage,
        upload_errors: uploadErrors.length > 0 ? uploadErrors : undefined,
      },
      _meta: buildWidgetMeta(
        'project-media',
        { project: projectWithHero, images: imageOutputs },
        { images: imageOutputs, uploads }
      ),
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

  const projectResult = await client.getProject(input.project_id);
  if (!projectResult.success) return { success: false, error: projectResult.error };

  const project = toProjectOutput(projectResult.data.project as unknown as Record<string, unknown>);
  const images = (projectResult.data.project as unknown as { project_images?: unknown[] }).project_images || [];
  const imageOutputs = images.map((img) => toImageOutput(img as unknown as Record<string, unknown>));
  const projectWithHero = attachHeroImageUrl(project, imageOutputs);

  return {
    success: true,
    result: {
      structuredContent: { project_id: input.project_id, status: 'ok' },
      _meta: buildWidgetMeta(
        'project-media',
        { project: projectWithHero, images: imageOutputs },
        { images: imageOutputs }
      ),
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

  const projectResult = await client.getProject(input.project_id);
  if (!projectResult.success) return { success: false, error: projectResult.error };

  const project = toProjectOutput(projectResult.data.project as unknown as Record<string, unknown>);
  const images = (projectResult.data.project as unknown as { project_images?: unknown[] }).project_images || [];
  const imageOutputs = images.map((img) => toImageOutput(img as unknown as Record<string, unknown>));
  const projectWithHero = attachHeroImageUrl(project, imageOutputs);

  return {
    success: true,
    result: {
      structuredContent: { project_id: input.project_id, status: 'ok' },
      _meta: buildWidgetMeta(
        'project-media',
        { project: projectWithHero, images: imageOutputs },
        { images: imageOutputs }
      ),
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

  const projectResult = await client.getProject(input.project_id);
  if (!projectResult.success) return { success: false, error: projectResult.error };

  const project = toProjectOutput(projectResult.data.project as unknown as Record<string, unknown>);
  const images = (projectResult.data.project as unknown as { project_images?: unknown[] }).project_images || [];
  const imageOutputs = images.map((img) => toImageOutput(img as unknown as Record<string, unknown>));
  const projectWithHero = attachHeroImageUrl(project, imageOutputs);

  return {
    success: true,
    result: {
      structuredContent: { project_id: input.project_id, status: 'ok' },
      _meta: buildWidgetMeta(
        'project-media',
        { project: projectWithHero, images: imageOutputs },
        { images: imageOutputs }
      ),
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
  const imageOutputs = images.map((img) => toImageOutput(img as unknown as Record<string, unknown>));
  const projectWithHero = attachHeroImageUrl(project, imageOutputs);
  const missing = getMissingPublishFields(projectWithHero);
  if (imageOutputs.length === 0) missing.push('images');
  const publishable = canPublish(projectWithHero, imageOutputs.length);

  return {
    success: true,
    result: {
      structuredContent: { project_id, missing_fields: missing, can_publish: publishable },
      _meta: buildWidgetMeta(
        'project-draft',
        { project: projectWithHero, missing_fields: missing, can_publish: publishable },
        { project: projectWithHero }
      ),
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
  const imageOutputs = images.map((img) => toImageOutput(img as unknown as Record<string, unknown>));
  const projectWithHero = attachHeroImageUrl(project, imageOutputs);
  const missing = getMissingPublishFields(projectWithHero);
  if (imageOutputs.length === 0) missing.push('images');
  const publishable = canPublish(projectWithHero, imageOutputs.length);

  return {
    success: true,
    result: {
      structuredContent: { project_id, missing_fields: missing, can_publish: publishable },
      _meta: buildWidgetMeta(
        'project-draft',
        { project: projectWithHero, missing_fields: missing, can_publish: publishable },
        { project: projectWithHero }
      ),
    },
  };
}

export async function handlePublishProject(
  input: z.infer<typeof finalizeProjectSchema>,
  auth: AuthContext,
  baseUrl: string
): Promise<ToolResult<PublishProjectOutput>> {
  const client = createClient(auth, baseUrl);
  const result = await client.publishProject(input.project_id);
  if (!result.success) return { success: false, error: result.error };

  const project = toProjectOutput(result.data.project as unknown as Record<string, unknown>);
  const images = (result.data.project as { project_images?: unknown[] }).project_images || [];
  const imageOutputs = images.map((img) => toImageOutput(img as unknown as Record<string, unknown>));
  const projectWithHero = attachHeroImageUrl(project, imageOutputs);

  const basePublicUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.co';
  const url = project.city_slug && project.project_type_slug && project.slug
    ? `${basePublicUrl}/${project.city_slug}/masonry/${project.project_type_slug}/${project.slug}`
    : basePublicUrl;

  return {
    success: true,
    result: {
      structuredContent: { project_id: input.project_id, status: 'published', url },
      _meta: buildWidgetMeta(
        'project-status',
        { project: { ...projectWithHero, images: imageOutputs }, missing_fields: [], can_publish: false, public_url: url },
        { project: { ...projectWithHero, images: imageOutputs } }
      ),
    },
  };
}

export async function handleUnpublishProject(
  input: z.infer<typeof finalizeProjectSchema>,
  auth: AuthContext,
  baseUrl: string
): Promise<ToolResult<UnpublishProjectOutput>> {
  const client = createClient(auth, baseUrl);
  const result = await client.unpublishProject(input.project_id);
  if (!result.success) return { success: false, error: result.error };

  const project = toProjectOutput(result.data.project as unknown as Record<string, unknown>);
  const images = (result.data.project as { project_images?: unknown[] }).project_images || [];
  const imageOutputs = images.map((img) => toImageOutput(img as unknown as Record<string, unknown>));
  const projectWithHero = attachHeroImageUrl(project, imageOutputs);

  const missing = getMissingPublishFields(projectWithHero);
  if (imageOutputs.length === 0) missing.push('images');
  const publishable = canPublish(projectWithHero, imageOutputs.length);

  return {
    success: true,
    result: {
      structuredContent: { project_id: input.project_id, status: 'draft' },
      _meta: buildWidgetMeta(
        'project-status',
        { project: { ...projectWithHero, images: imageOutputs }, missing_fields: missing, can_publish: publishable },
        { project: { ...projectWithHero, images: imageOutputs } }
      ),
    },
  };
}

export async function handleFinalizeProject(
  input: z.infer<typeof finalizeProjectSchema>,
  auth: AuthContext,
  baseUrl: string
): Promise<ToolResult<FinalizeProjectOutput>> {
  const publishResult = await handlePublishProject(input, auth, baseUrl);
  if (!publishResult.success) return publishResult;
  return { success: true, result: publishResult.result };
}

export async function handleListContractorProjects(
  input: z.infer<typeof listContractorProjectsSchema>,
  auth: AuthContext,
  baseUrl: string
): Promise<ToolResult<ListContractorProjectsOutput>> {
  const client = createClient(auth, baseUrl);
  const result = await client.listProjects({ status: input.status, limit: input.limit || 10, offset: input.offset || 0 });
  if (!result.success) return { success: false, error: result.error };

  const projects = result.data.projects.map((p) => {
    const project = toProjectOutput(p as unknown as Record<string, unknown>);
    const images = (p as { project_images?: unknown[] }).project_images || [];
    const imageOutputs = images.map((img) => toImageOutput(img as unknown as Record<string, unknown>));
    return attachHeroImageUrl(project, imageOutputs);
  });
  const offset = input.offset || 0;
  const count = offset + projects.length;
  const hasMore = result.data.total > count;

  return {
    success: true,
    result: {
      structuredContent: { count, has_more: hasMore },
      _meta: buildWidgetMeta(
        'project-list',
        {
          projects,
          count,
          has_more: hasMore,
          offset,
          limit: input.limit || 10,
          status_filter: input.status,
        },
        { projects }
      ),
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
  const projectWithHero = attachHeroImageUrl(project, imageOutputs);
  const missing = getMissingPublishFields(projectWithHero);
  if (imageOutputs.length === 0) missing.push('images');
  const publishable = canPublish(projectWithHero, imageOutputs.length);

  return {
    success: true,
    result: {
      structuredContent: { project_id: input.project_id, status: project.status, missing_fields: missing, can_publish: publishable },
      _meta: buildWidgetMeta(
        'project-status',
        { project: { ...projectWithHero, images: imageOutputs }, missing_fields: missing, can_publish: publishable },
        { project: { ...projectWithHero, images: imageOutputs } }
      ),
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
    case 'publish_project': {
      const parsed = finalizeProjectSchema.safeParse(toolArgs);
      if (!parsed.success) return { success: false, error: formatZodError(parsed.error) };
      return handlePublishProject(parsed.data, auth, baseUrl);
    }
    case 'unpublish_project': {
      const parsed = finalizeProjectSchema.safeParse(toolArgs);
      if (!parsed.success) return { success: false, error: formatZodError(parsed.error) };
      return handleUnpublishProject(parsed.data, auth, baseUrl);
    }
    case 'list_contractor_projects': {
      const parsed = listContractorProjectsSchema.safeParse(toolArgs);
      if (!parsed.success) return { success: false, error: formatZodError(parsed.error) };
      return handleListContractorProjects(parsed.data, auth, baseUrl);
    }
    case 'list_projects': {
      const parsed = listContractorProjectsSchema.safeParse(toolArgs);
      if (!parsed.success) return { success: false, error: formatZodError(parsed.error) };
      return handleListContractorProjects(parsed.data, auth, baseUrl);
    }
    case 'finalize_project': {
      const parsed = finalizeProjectSchema.safeParse(toolArgs);
      if (!parsed.success) return { success: false, error: formatZodError(parsed.error) };
      return handleFinalizeProject(parsed.data, auth, baseUrl);
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
