import { z } from 'zod';
import type { AuthContext } from '../types';
import {
  addProjectMediaSchema,
  createProjectDraftSchema,
  finalizeProjectSchema,
  getProjectStatusSchema,
  listContractorProjectsSchema,
  reorderProjectMediaSchema,
  setProjectHeroMediaSchema,
  setProjectMediaLabelsSchema,
  updateProjectMetaSchema,
  updateProjectSectionsSchema,
} from '@/lib/chat/tool-schemas';
import {
  handleAddProjectMedia,
  handleCreateProjectDraft,
  handleFinalizeProject,
  handleGetProjectStatus,
  handleListContractorProjects,
  handlePublishProject,
  handleReorderProjectMedia,
  handleSetProjectHeroMedia,
  handleSetProjectMediaLabels,
  handleUnpublishProject,
  handleUpdateProjectMeta,
  handleUpdateProjectSections,
} from './handlers';
import type { ToolResult } from './shared';

type ToolHandler = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any,
  auth: AuthContext,
  baseUrl: string
) => Promise<ToolResult<{ structuredContent: unknown; _meta?: unknown }>>;

type ToolEntry = {
  schema: z.ZodTypeAny;
  handler: ToolHandler;
};

// Handlers are typed with specific schemas but registry uses generic `unknown` input
// The dispatch function validates input against schema before calling handler
const toolRegistry: Record<string, ToolEntry> = {
  create_project_draft: {
    schema: createProjectDraftSchema,
    handler: handleCreateProjectDraft as ToolHandler,
  },
  add_project_media: {
    schema: addProjectMediaSchema,
    handler: handleAddProjectMedia as ToolHandler,
  },
  reorder_project_media: {
    schema: reorderProjectMediaSchema,
    handler: handleReorderProjectMedia as ToolHandler,
  },
  set_project_hero_media: {
    schema: setProjectHeroMediaSchema,
    handler: handleSetProjectHeroMedia as ToolHandler,
  },
  set_project_media_labels: {
    schema: setProjectMediaLabelsSchema,
    handler: handleSetProjectMediaLabels as ToolHandler,
  },
  update_project_sections: {
    schema: updateProjectSectionsSchema,
    handler: handleUpdateProjectSections as ToolHandler,
  },
  update_project_meta: {
    schema: updateProjectMetaSchema,
    handler: handleUpdateProjectMeta as ToolHandler,
  },
  publish_project: {
    schema: finalizeProjectSchema,
    handler: handlePublishProject as ToolHandler,
  },
  unpublish_project: {
    schema: finalizeProjectSchema,
    handler: handleUnpublishProject as ToolHandler,
  },
  list_contractor_projects: {
    schema: listContractorProjectsSchema,
    handler: handleListContractorProjects as ToolHandler,
  },
  list_projects: {
    schema: listContractorProjectsSchema,
    handler: handleListContractorProjects as ToolHandler,
  },
  finalize_project: {
    schema: finalizeProjectSchema,
    handler: handleFinalizeProject as ToolHandler,
  },
  get_project_status: {
    schema: getProjectStatusSchema,
    handler: handleGetProjectStatus as ToolHandler,
  },
};

function formatZodError(error: z.ZodError): string {
  return error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
}

export async function dispatchTool(
  toolName: string,
  toolArgs: Record<string, unknown>,
  auth: AuthContext,
  baseUrl: string
): Promise<{ success: true; result: { structuredContent: unknown; _meta?: unknown } } | { success: false; error: string }> {
  const entry = toolRegistry[toolName];
  if (!entry) {
    return { success: false, error: `Unknown tool: ${toolName}` };
  }

  const parsed = entry.schema.safeParse(toolArgs);
  if (!parsed.success) return { success: false, error: formatZodError(parsed.error) };

  return entry.handler(parsed.data, auth, baseUrl);
}
