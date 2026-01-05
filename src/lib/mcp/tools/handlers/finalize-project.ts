import { z } from 'zod';
import type { AuthContext, FinalizeProjectOutput } from '../../types';
import { finalizeProjectSchema } from '@/lib/chat/tool-schemas';
import { handlePublishProject } from './publish-project';
import type { ToolResult } from '../shared';

export async function handleFinalizeProject(
  input: z.infer<typeof finalizeProjectSchema>,
  auth: AuthContext,
  baseUrl: string
): Promise<ToolResult<FinalizeProjectOutput>> {
  const publishResult = await handlePublishProject(input, auth, baseUrl);
  if (!publishResult.success) return publishResult;
  return { success: true, result: publishResult.result };
}
