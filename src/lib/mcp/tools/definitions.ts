import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  addProjectMediaSchema,
  createProjectDraftSchema,
  finalizeProjectSchema,
  getProjectStatusSchema,
  listContractorProjectsSchema,
  publishProjectSchema,
  reorderProjectMediaSchema,
  setProjectHeroMediaSchema,
  setProjectMediaLabelsSchema,
  unpublishProjectSchema,
  updateProjectMetaSchema,
  updateProjectSectionsSchema,
} from '@/lib/chat/tool-schemas';

const TOOL_OUTPUT_TEMPLATE = 'template://knearme-portfolio';

type ToolHints = {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  openWorldHint?: boolean;
};

type ToolMeta = {
  invoking: string;
  invoked: string;
  hints?: ToolHints;
  widgetAccessible?: boolean;
  visibility?: 'private';
};

function buildToolMeta(options: ToolMeta) {
  return {
    'openai/outputTemplate': TOOL_OUTPUT_TEMPLATE,
    'openai/toolInvocation/invoking': options.invoking,
    'openai/toolInvocation/invoked': options.invoked,
    ...(options.hints ? { 'openai/toolHints': options.hints } : {}),
    ...(options.widgetAccessible ? { 'openai/widgetAccessible': true } : {}),
    ...(options.visibility ? { 'openai/visibility': options.visibility } : {}),
  };
}

/**
 * Convert a Zod schema to JSON Schema format for MCP protocol.
 * Strips $schema and removes definitions to keep the schema compact.
 *
 */
function toJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  const jsonSchema = zodToJsonSchema(schema, { target: 'openApi3' });
  const rest = { ...(jsonSchema as Record<string, unknown>) };
  delete rest.$schema;
  delete rest.definitions;
  return rest;
}

/**
 * Tool definition factory for consistent structure.
 */
function defineTool(config: {
  name: string;
  title: string;
  description: string;
  schema: z.ZodTypeAny;
  meta: ToolMeta;
}) {
  return {
    name: config.name,
    title: config.title,
    description: config.description,
    _meta: buildToolMeta(config.meta),
    inputSchema: toJsonSchema(config.schema),
  };
}

export const toolDefinitions = [
  defineTool({
    name: 'create_project_draft',
    title: 'Create Project Draft',
    description: 'Create a new draft case-study project. Returns project ID and missing fields.',
    schema: createProjectDraftSchema,
    meta: { invoking: 'Creating a new project draft…', invoked: 'Draft created.' },
  }),
  defineTool({
    name: 'add_project_media',
    title: 'Add Project Media',
    description: 'Add images to a project draft. Prefer ChatGPT file IDs; URL imports are supported as a fallback.',
    schema: addProjectMediaSchema,
    meta: { invoking: 'Adding project images…', invoked: 'Images queued for upload.', hints: { openWorldHint: true } },
  }),
  defineTool({
    name: 'reorder_project_media',
    title: 'Reorder Project Media',
    description: 'Reorder project images.',
    schema: reorderProjectMediaSchema,
    meta: { invoking: 'Reordering images…', invoked: 'Images reordered.', widgetAccessible: true },
  }),
  defineTool({
    name: 'set_project_hero_media',
    title: 'Set Project Hero Image',
    description: 'Set the hero image for a project.',
    schema: setProjectHeroMediaSchema,
    meta: { invoking: 'Setting hero image…', invoked: 'Hero image updated.', widgetAccessible: true },
  }),
  defineTool({
    name: 'set_project_media_labels',
    title: 'Set Project Media Labels',
    description: 'Label images as before/after/progress/detail and add alt text.',
    schema: setProjectMediaLabelsSchema,
    meta: { invoking: 'Updating image labels…', invoked: 'Image labels updated.', widgetAccessible: true },
  }),
  defineTool({
    name: 'update_project_sections',
    title: 'Update Project Sections',
    description: 'Update narrative sections: summary, challenge, solution, results.',
    schema: updateProjectSectionsSchema,
    meta: { invoking: 'Updating project sections…', invoked: 'Project sections updated.', widgetAccessible: true },
  }),
  defineTool({
    name: 'update_project_meta',
    title: 'Update Project Metadata',
    description: 'Update project metadata: title, type, location, duration, tags, SEO.',
    schema: updateProjectMetaSchema,
    meta: { invoking: 'Updating project details…', invoked: 'Project details updated.' },
  }),
  defineTool({
    name: 'publish_project',
    title: 'Publish Project',
    description: 'Publish the project. Requires all mandatory fields. Ask for confirmation first.',
    schema: publishProjectSchema,
    meta: { invoking: 'Publishing project…', invoked: 'Project published.', hints: { destructiveHint: true } },
  }),
  defineTool({
    name: 'unpublish_project',
    title: 'Unpublish Project',
    description: 'Revert a published project to draft status.',
    schema: unpublishProjectSchema,
    meta: { invoking: 'Reverting project to draft…', invoked: 'Project reverted to draft.' },
  }),
  defineTool({
    name: 'list_projects',
    title: 'List Projects',
    description: "List the contractor's projects. Can filter by status.",
    schema: listContractorProjectsSchema,
    meta: { invoking: 'Fetching projects…', invoked: 'Projects loaded.', hints: { readOnlyHint: true } },
  }),
  defineTool({
    name: 'list_contractor_projects',
    title: 'List Contractor Projects (Legacy)',
    description: "List the contractor's projects. Can filter by status.",
    schema: listContractorProjectsSchema,
    meta: { invoking: 'Fetching projects…', invoked: 'Projects loaded.', hints: { readOnlyHint: true }, visibility: 'private' },
  }),
  defineTool({
    name: 'get_project_status',
    title: 'Get Project Status',
    description: 'Get project status including images and missing fields.',
    schema: getProjectStatusSchema,
    meta: { invoking: 'Fetching project status…', invoked: 'Project status loaded.', hints: { readOnlyHint: true } },
  }),
  defineTool({
    name: 'finalize_project',
    title: 'Finalize Project (Legacy)',
    description: 'Publish the project. Requires all mandatory fields. Ask for confirmation first.',
    schema: finalizeProjectSchema,
    meta: { invoking: 'Publishing project…', invoked: 'Project published.', hints: { destructiveHint: true }, visibility: 'private' },
  }),
];
