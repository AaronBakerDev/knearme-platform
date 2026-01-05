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
  input: unknown,
  auth: AuthContext,
  baseUrl: string
) => Promise<ToolResult<{ structuredContent: unknown; _meta?: unknown }>>;

type ToolEntry = {
  schema: z.ZodTypeAny;
  handler: ToolHandler;
};

const toolRegistry: Record<string, ToolEntry> = {
  create_project_draft: {
    schema: createProjectDraftSchema,
    handler: handleCreateProjectDraft,
  },
  add_project_media: {
    schema: addProjectMediaSchema,
    handler: handleAddProjectMedia,
  },
  reorder_project_media: {
    schema: reorderProjectMediaSchema,
    handler: handleReorderProjectMedia,
  },
  set_project_hero_media: {
    schema: setProjectHeroMediaSchema,
    handler: handleSetProjectHeroMedia,
  },
  set_project_media_labels: {
    schema: setProjectMediaLabelsSchema,
    handler: handleSetProjectMediaLabels,
  },
  update_project_sections: {
    schema: updateProjectSectionsSchema,
    handler: handleUpdateProjectSections,
  },
  update_project_meta: {
    schema: updateProjectMetaSchema,
    handler: handleUpdateProjectMeta,
  },
  publish_project: {
    schema: finalizeProjectSchema,
    handler: handlePublishProject,
  },
  unpublish_project: {
    schema: finalizeProjectSchema,
    handler: handleUnpublishProject,
  },
  list_contractor_projects: {
    schema: listContractorProjectsSchema,
    handler: handleListContractorProjects,
  },
  list_projects: {
    schema: listContractorProjectsSchema,
    handler: handleListContractorProjects,
  },
  finalize_project: {
    schema: finalizeProjectSchema,
    handler: handleFinalizeProject,
  },
  get_project_status: {
    schema: getProjectStatusSchema,
    handler: handleGetProjectStatus,
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
