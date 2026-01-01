/**
 * Tool execution endpoint for Live API sessions.
 *
 * POST /api/chat/tools
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, isAuthError } from '@/lib/api/auth';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/errors';
import type { ToolContext } from '@/lib/chat/chat-types';
import {
  extractProjectDataSchema,
  promptForImagesSchema,
  showPortfolioPreviewSchema,
  showContentEditorSchema,
  requestClarificationSchema,
  suggestQuickActionsSchema,
  generatePortfolioContentSchema,
  composePortfolioLayoutSchema,
  checkPublishReadySchema,
  updateFieldSchema,
  regenerateSectionSchema,
  reorderImagesSchema,
  validateForPublishSchema,
  updateDescriptionBlocksSchema,
} from '@/lib/chat/tool-schemas';
import {
  createChatToolExecutors,
  type AllowedToolName,
  DEEP_CONTEXT_TOOLS,
} from '@/lib/chat/tools-runtime';

const toolCallSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  args: z.unknown().optional(),
});

const requestSchema = z.object({
  toolCalls: z.array(toolCallSchema),
  projectId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  latestUserMessage: z.string().optional(),
});

type DeepToolName = (typeof DEEP_CONTEXT_TOOLS)[number];

function inferDeepToolChoice(text: string): DeepToolName | null {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return null;

  const wantsLayout =
    /\blayout\b/.test(normalized) ||
    /\b(description|content)\s+blocks\b/.test(normalized) ||
    /\bblock\s+layout\b/.test(normalized) ||
    /\bcontent\s+structure\b/.test(normalized);

  if (wantsLayout) return 'composePortfolioLayout';

  const wantsPublishCheck =
    /ready to publish|publish ready|publish readiness|am i ready to publish|can i publish|check publish/.test(
      normalized
    ) || (normalized.includes('publish') && normalized.includes('ready'));

  if (wantsPublishCheck) return 'checkPublishReady';

  const wantsGenerate =
    /\b(generate|draft|write)\b/.test(normalized) &&
    !/\bregenerate\b/.test(normalized) &&
    /(content|description|portfolio|page|story|write up|write-up)/.test(normalized);

  if (wantsGenerate) return 'generatePortfolioContent';

  return null;
}

const TOOL_INPUT_SCHEMAS: Record<string, z.ZodTypeAny> = {
  extractProjectData: extractProjectDataSchema,
  promptForImages: promptForImagesSchema,
  showPortfolioPreview: showPortfolioPreviewSchema,
  showContentEditor: showContentEditorSchema,
  requestClarification: requestClarificationSchema,
  suggestQuickActions: suggestQuickActionsSchema,
  generatePortfolioContent: generatePortfolioContentSchema,
  composePortfolioLayout: composePortfolioLayoutSchema,
  checkPublishReady: checkPublishReadySchema,
  updateField: updateFieldSchema,
  regenerateSection: regenerateSectionSchema,
  reorderImages: reorderImagesSchema,
  validateForPublish: validateForPublishSchema,
  updateDescriptionBlocks: updateDescriptionBlocksSchema,
};

export async function POST(request: NextRequest) {
  const start = Date.now();
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    const body = await request.json().catch(() => null);
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid tool request payload', {
        errors: parsed.error.flatten(),
      });
    }

    const { toolCalls, projectId, sessionId, latestUserMessage } = parsed.data;
    const toolContext: ToolContext = {
      userId: auth.user.id,
      contractorId: auth.contractor.id,
      projectId,
      sessionId,
    };

    const toolExecutors = createChatToolExecutors({
      toolContext,
      latestUserMessage: latestUserMessage ?? '',
    });
    const allowedDeepTool = inferDeepToolChoice(latestUserMessage ?? '');

    const results = [];

    for (const [index, call] of toolCalls.entries()) {
      const name = call.name as AllowedToolName;
      const executor = toolExecutors[name];
      const schema = TOOL_INPUT_SCHEMAS[name];

      if (DEEP_CONTEXT_TOOLS.includes(name as DeepToolName) && name !== allowedDeepTool) {
        results.push({
          id: call.id ?? `${call.name}-${index}`,
          name: call.name,
          error: {
            message: 'Deep tool requires an explicit user request.',
          },
        });
        continue;
      }

      if (!executor || !schema) {
        results.push({
          id: call.id ?? `${call.name}-${index}`,
          name: call.name,
          error: {
            message: `Unknown tool: ${call.name}`,
          },
        });
        continue;
      }

      const args = call.args ?? {};
      const parsedArgs = schema.safeParse(args);
      if (!parsedArgs.success) {
        results.push({
          id: call.id ?? `${call.name}-${index}`,
          name: call.name,
          error: {
            message: 'Invalid tool arguments',
            details: parsedArgs.error.flatten(),
          },
        });
        continue;
      }

      try {
        // Type assertion needed: parsedArgs.data is typed as unknown due to union of schemas,
        // but it's validated by the schema lookup for this specific tool
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const output = await executor(parsedArgs.data as any);
        results.push({
          id: call.id ?? `${call.name}-${index}`,
          name: call.name,
          output,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Tool execution failed';
        results.push({
          id: call.id ?? `${call.name}-${index}`,
          name: call.name,
          error: {
            message,
          },
        });
      }
    }

    return apiSuccess({ results, durationMs: Date.now() - start });
  } catch (error) {
    return handleApiError(error, {
      route: '/api/chat/tools',
      method: 'POST',
      duration: Date.now() - start,
    });
  }
}
