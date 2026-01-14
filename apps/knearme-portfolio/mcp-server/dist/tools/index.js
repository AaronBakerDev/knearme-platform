/**
 * MCP Tool Definitions for KnearMe Contractor ChatGPT App.
 *
 * This file exports all tool definitions and handlers for the MCP server.
 * Tools map to the portfolio API and follow the contracts in MCP_CONTRACTOR_INTERFACE.md.
 *
 * @see /docs/chatgpt-apps-sdk/MCP_CONTRACTOR_INTERFACE.md
 */
import { z } from 'zod';
import { PortfolioClient, getMissingPublishFields, canPublish, toProjectOutput, toImageOutput, } from '../api/portfolio-client.js';
import { widgetMeta } from '../resources/widget.js';
// ============================================================================
// TOOL SCHEMAS (Zod validation)
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
    files: z.array(z.object({
        file_id: z.string(),
        filename: z.string(),
        content_type: z.string(),
        image_type: z.enum(['before', 'after', 'progress', 'detail']).optional(),
    })),
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
    labels: z.array(z.object({
        image_id: z.string().uuid(),
        image_type: z.enum(['before', 'after', 'progress', 'detail']).nullable().optional(),
        alt_text: z.string().nullable().optional(),
    })),
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
// TOOL DEFINITIONS (for MCP server registration)
// ============================================================================
export const toolDefinitions = [
    {
        name: 'create_project_draft',
        description: 'Create a new draft case-study project. Use this when the contractor wants to start a new project. Returns the project ID and lists any missing fields needed for publishing.',
        inputSchema: {
            type: 'object',
            properties: {
                project_type: { type: 'string', description: 'Type of project (e.g., chimney rebuild, tuckpointing)' },
                city: { type: 'string', description: 'City where the project is located' },
                state: { type: 'string', description: 'State where the project is located' },
                summary: { type: 'string', description: '1-2 sentence hook summarizing the project' },
                challenge: { type: 'string', description: 'What was the problem or constraint' },
                solution: { type: 'string', description: 'What the contractor did to solve it' },
                results: { type: 'string', description: 'Outcome or impact of the work' },
                outcome_highlights: { type: 'array', items: { type: 'string' }, description: '2-4 bullet point outcomes' },
            },
            required: [],
        },
        hints: { readOnlyHint: false },
    },
    {
        name: 'add_project_media',
        description: 'Add images to a project draft. Use this when the contractor uploads photos. Accepts file IDs from ChatGPT uploads.',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: { type: 'string', description: 'Project UUID' },
                files: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            file_id: { type: 'string', description: 'ChatGPT file ID' },
                            filename: { type: 'string', description: 'Original filename' },
                            content_type: { type: 'string', description: 'MIME type (image/jpeg, image/png, etc.)' },
                            image_type: { type: 'string', enum: ['before', 'after', 'progress', 'detail'], description: 'Image classification' },
                        },
                        required: ['file_id', 'filename', 'content_type'],
                    },
                },
            },
            required: ['project_id', 'files'],
        },
        hints: { readOnlyHint: false },
    },
    {
        name: 'reorder_project_media',
        description: 'Reorder project images. Use this when the contractor wants to change the gallery order.',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: { type: 'string', description: 'Project UUID' },
                image_ids: { type: 'array', items: { type: 'string' }, description: 'Image UUIDs in desired order' },
            },
            required: ['project_id', 'image_ids'],
        },
        hints: { readOnlyHint: false },
    },
    {
        name: 'set_project_hero_media',
        description: 'Set the hero image for a project. This image is used as the primary/thumbnail image.',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: { type: 'string', description: 'Project UUID' },
                hero_image_id: { type: 'string', description: 'Image UUID to set as hero' },
            },
            required: ['project_id', 'hero_image_id'],
        },
        hints: { readOnlyHint: false },
    },
    {
        name: 'set_project_media_labels',
        description: 'Label images as before/after/progress/detail and add alt text for accessibility.',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: { type: 'string', description: 'Project UUID' },
                labels: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            image_id: { type: 'string', description: 'Image UUID' },
                            image_type: { type: 'string', enum: ['before', 'after', 'progress', 'detail'], description: 'Image classification' },
                            alt_text: { type: 'string', description: 'Accessibility description' },
                        },
                        required: ['image_id'],
                    },
                },
            },
            required: ['project_id', 'labels'],
        },
        hints: { readOnlyHint: false },
    },
    {
        name: 'update_project_sections',
        description: 'Update the narrative sections of a project: summary, challenge, solution, results, and outcome highlights. The description is auto-composed from these sections.',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: { type: 'string', description: 'Project UUID' },
                summary: { type: 'string', description: '1-2 sentence hook' },
                challenge: { type: 'string', description: 'What was the problem' },
                solution: { type: 'string', description: 'What was done' },
                results: { type: 'string', description: 'Outcome or impact' },
                outcome_highlights: { type: 'array', items: { type: 'string' }, description: 'Bullet point outcomes' },
            },
            required: ['project_id'],
        },
        hints: { readOnlyHint: false },
    },
    {
        name: 'update_project_meta',
        description: 'Update project metadata: title, type, location, duration, tags, materials, techniques, and SEO fields.',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: { type: 'string', description: 'Project UUID' },
                title: { type: 'string', description: 'Project title' },
                project_type: { type: 'string', description: 'Type of project' },
                city: { type: 'string', description: 'City location' },
                state: { type: 'string', description: 'State location' },
                duration: { type: 'string', description: 'How long the project took' },
                tags: { type: 'array', items: { type: 'string' }, description: 'Search tags' },
                materials: { type: 'array', items: { type: 'string' }, description: 'Materials used' },
                techniques: { type: 'array', items: { type: 'string' }, description: 'Techniques employed' },
                seo_title: { type: 'string', description: 'SEO title (max 70 chars)' },
                seo_description: { type: 'string', description: 'SEO description (max 160 chars)' },
            },
            required: ['project_id'],
        },
        hints: { readOnlyHint: false },
    },
    {
        name: 'finalize_project',
        description: 'Publish the project, making it visible on the public portfolio. Requires all mandatory fields to be filled. This action is destructive - ask for confirmation before calling.',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: { type: 'string', description: 'Project UUID' },
            },
            required: ['project_id'],
        },
        hints: { readOnlyHint: false, destructiveHint: true },
    },
    {
        name: 'list_contractor_projects',
        description: 'List the contractor\'s recent projects. Can filter by status (draft, published, archived).',
        inputSchema: {
            type: 'object',
            properties: {
                status: { type: 'string', enum: ['draft', 'published', 'archived'], description: 'Filter by status' },
                limit: { type: 'number', description: 'Max results (default 10, max 50)' },
                offset: { type: 'number', description: 'Pagination offset' },
            },
            required: [],
        },
        hints: { readOnlyHint: true },
    },
    {
        name: 'get_project_status',
        description: 'Get the current status of a project including images and what fields are missing for publishing.',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: { type: 'string', description: 'Project UUID' },
            },
            required: ['project_id'],
        },
        hints: { readOnlyHint: true },
    },
];
/**
 * Build widget-enhanced _meta for tool responses.
 * Includes CSP, domain, outputTemplate, and widget-specific data.
 *
 * @param template - Which widget template to render
 * @param data - Template-specific data (passed to widget via window.__WIDGET_DATA__)
 * @param extraMeta - Additional _meta fields (project, images, etc.)
 *
 * @see /docs/chatgpt-apps-sdk/BUILDING.md - Resource registration section
 */
function buildWidgetMeta(template, data, extraMeta) {
    return {
        ...widgetMeta,
        widgetTemplate: template,
        widgetData: data,
        ...extraMeta,
    };
}
/**
 * Create a portfolio client for the authenticated contractor.
 */
function createClient(auth, baseUrl) {
    return new PortfolioClient({
        baseUrl,
        accessToken: auth.accessToken,
    });
}
/**
 * Handle create_project_draft tool.
 */
export async function handleCreateProjectDraft(input, auth, baseUrl) {
    const client = createClient(auth, baseUrl);
    const result = await client.createProject(input);
    if (!result.success) {
        return { success: false, error: result.error };
    }
    const project = toProjectOutput(result.data.project);
    const missing = getMissingPublishFields(project);
    // Add images check
    const images = result.data.project.project_images || [];
    if (images.length === 0)
        missing.push('images');
    return {
        success: true,
        result: {
            structuredContent: {
                project_id: project.id,
                missing_fields: missing,
            },
            _meta: buildWidgetMeta('project-draft', {
                project,
                missing_fields: missing,
                can_publish: false,
            }, { project }),
        },
    };
}
/**
 * Handle add_project_media tool.
 * Note: In production, this would download files from ChatGPT and upload to Supabase.
 * For now, we implement the API structure but file handling needs ChatGPT runtime.
 */
export async function handleAddProjectMedia(input, auth, baseUrl) {
    const client = createClient(auth, baseUrl);
    // For each file, request upload URL and upload
    // Note: Actual file download from ChatGPT requires window.openai.getFileDownloadUrl()
    // which is only available in the widget runtime. The MCP server receives file_ids
    // and the widget handles the actual file transfer.
    const uploadedImages = [];
    for (const file of input.files) {
        const uploadResult = await client.requestImageUpload(input.project_id, {
            filename: file.filename,
            content_type: file.content_type,
            image_type: file.image_type,
        });
        if (!uploadResult.success) {
            return { success: false, error: uploadResult.error };
        }
        // In production: download from ChatGPT, upload to signed_url
        // For now, we return the image record that was created
        uploadedImages.push(toImageOutput(uploadResult.data.image));
    }
    // Get updated project to calculate missing fields
    const projectResult = await client.getProject(input.project_id);
    if (!projectResult.success) {
        return { success: false, error: projectResult.error };
    }
    const project = toProjectOutput(projectResult.data.project);
    const images = projectResult.data.project.project_images || [];
    const imageOutputs = images.map((img) => toImageOutput(img));
    const missing = getMissingPublishFields(project);
    if (imageOutputs.length === 0)
        missing.push('images');
    return {
        success: true,
        result: {
            structuredContent: {
                project_id: input.project_id,
                media_count: imageOutputs.length,
                missing_fields: missing,
            },
            _meta: buildWidgetMeta('project-media', {
                project_id: input.project_id,
                images: imageOutputs,
                hero_image_id: project.hero_image_id,
            }, { images: imageOutputs }),
        },
    };
}
/**
 * Handle reorder_project_media tool.
 */
export async function handleReorderProjectMedia(input, auth, baseUrl) {
    const client = createClient(auth, baseUrl);
    const result = await client.reorderImages(input.project_id, input.image_ids);
    if (!result.success) {
        return { success: false, error: result.error };
    }
    // Get updated images
    const imagesResult = await client.listImages(input.project_id);
    if (!imagesResult.success) {
        return { success: false, error: imagesResult.error };
    }
    const images = imagesResult.data.images.map((img) => toImageOutput(img));
    return {
        success: true,
        result: {
            structuredContent: {
                project_id: input.project_id,
                status: 'ok',
            },
            _meta: buildWidgetMeta('project-media', {
                project_id: input.project_id,
                images,
            }, { images }),
        },
    };
}
/**
 * Handle set_project_hero_media tool.
 */
export async function handleSetProjectHeroMedia(input, auth, baseUrl) {
    const client = createClient(auth, baseUrl);
    const result = await client.updateProject(input.project_id, {
        hero_image_id: input.hero_image_id,
    });
    if (!result.success) {
        return { success: false, error: result.error };
    }
    // Get images for response
    const imagesResult = await client.listImages(input.project_id);
    const images = imagesResult.success
        ? imagesResult.data.images.map((img) => toImageOutput(img))
        : [];
    return {
        success: true,
        result: {
            structuredContent: {
                project_id: input.project_id,
                status: 'ok',
            },
            _meta: buildWidgetMeta('project-media', {
                project_id: input.project_id,
                images,
                hero_image_id: input.hero_image_id,
            }, { images }),
        },
    };
}
/**
 * Handle set_project_media_labels tool.
 */
export async function handleSetProjectMediaLabels(input, auth, baseUrl) {
    const client = createClient(auth, baseUrl);
    const result = await client.updateImageLabels(input.project_id, input.labels);
    if (!result.success) {
        return { success: false, error: result.error };
    }
    // Get updated images
    const imagesResult = await client.listImages(input.project_id);
    const images = imagesResult.success
        ? imagesResult.data.images.map((img) => toImageOutput(img))
        : [];
    return {
        success: true,
        result: {
            structuredContent: {
                project_id: input.project_id,
                status: 'ok',
            },
            _meta: buildWidgetMeta('project-media', {
                project_id: input.project_id,
                images,
            }, { images }),
        },
    };
}
/**
 * Handle update_project_sections tool.
 */
export async function handleUpdateProjectSections(input, auth, baseUrl) {
    const client = createClient(auth, baseUrl);
    const { project_id, ...updates } = input;
    const result = await client.updateProject(project_id, updates);
    if (!result.success) {
        return { success: false, error: result.error };
    }
    const project = toProjectOutput(result.data.project);
    const images = result.data.project.project_images || [];
    const missing = getMissingPublishFields(project);
    if (images.length === 0)
        missing.push('images');
    return {
        success: true,
        result: {
            structuredContent: {
                project_id,
                missing_fields: missing,
            },
            _meta: buildWidgetMeta('project-draft', {
                project,
                missing_fields: missing,
                can_publish: canPublish(project, images.length),
            }, { project }),
        },
    };
}
/**
 * Handle update_project_meta tool.
 */
export async function handleUpdateProjectMeta(input, auth, baseUrl) {
    const client = createClient(auth, baseUrl);
    const { project_id, ...updates } = input;
    const result = await client.updateProject(project_id, updates);
    if (!result.success) {
        return { success: false, error: result.error };
    }
    const project = toProjectOutput(result.data.project);
    const images = result.data.project.project_images || [];
    const missing = getMissingPublishFields(project);
    if (images.length === 0)
        missing.push('images');
    return {
        success: true,
        result: {
            structuredContent: {
                project_id,
                status: 'ok',
            },
            _meta: buildWidgetMeta('project-draft', {
                project,
                missing_fields: missing,
                can_publish: canPublish(project, images.length),
            }, { project }),
        },
    };
}
/**
 * Handle finalize_project tool.
 */
export async function handleFinalizeProject(input, auth, baseUrl) {
    const client = createClient(auth, baseUrl);
    const result = await client.publishProject(input.project_id);
    if (!result.success) {
        return { success: false, error: result.error };
    }
    const project = toProjectOutput(result.data.project);
    const images = result.data.project.project_images || [];
    const imageOutputs = images.map((img) => toImageOutput(img));
    // Construct public URL - this would be configured per environment
    const basePublicUrl = process.env.PUBLIC_SITE_URL || 'https://knearme.com';
    const url = `${basePublicUrl}/${project.slug}`;
    return {
        success: true,
        result: {
            structuredContent: {
                project_id: input.project_id,
                status: 'published',
                url,
            },
            _meta: buildWidgetMeta('project-status', {
                project: { ...project, images: imageOutputs },
                missing_fields: [],
                can_publish: false, // Already published
                public_url: url,
            }, { project: { ...project, images: imageOutputs } }),
        },
    };
}
/**
 * Handle list_contractor_projects tool.
 */
export async function handleListContractorProjects(input, auth, baseUrl) {
    const client = createClient(auth, baseUrl);
    const result = await client.listProjects({
        status: input.status,
        limit: input.limit || 10,
        offset: input.offset || 0,
    });
    if (!result.success) {
        return { success: false, error: result.error };
    }
    const projects = result.data.projects.map((p) => toProjectOutput(p));
    return {
        success: true,
        result: {
            structuredContent: {
                count: projects.length,
                has_more: result.data.total > (input.offset || 0) + projects.length,
            },
            _meta: buildWidgetMeta('project-list', {
                projects,
                total: result.data.total,
                status_filter: input.status,
            }, { projects }),
        },
    };
}
/**
 * Handle get_project_status tool.
 */
export async function handleGetProjectStatus(input, auth, baseUrl) {
    const client = createClient(auth, baseUrl);
    const result = await client.getProject(input.project_id);
    if (!result.success) {
        return { success: false, error: result.error };
    }
    const project = toProjectOutput(result.data.project);
    const images = result.data.project.project_images || [];
    const imageOutputs = images.map((img) => toImageOutput(img));
    const missing = getMissingPublishFields(project);
    if (imageOutputs.length === 0)
        missing.push('images');
    const publishable = canPublish(project, imageOutputs.length);
    return {
        success: true,
        result: {
            structuredContent: {
                project_id: input.project_id,
                status: project.status,
                missing_fields: missing,
                can_publish: publishable,
            },
            _meta: buildWidgetMeta('project-status', {
                project: { ...project, images: imageOutputs },
                missing_fields: missing,
                can_publish: publishable,
            }, { project: { ...project, images: imageOutputs } }),
        },
    };
}
//# sourceMappingURL=index.js.map