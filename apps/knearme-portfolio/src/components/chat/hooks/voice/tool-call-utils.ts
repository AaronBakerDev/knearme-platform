import { logger } from '@/lib/logging';

export type ToolCallInput = {
  id?: string | null;
  name?: string | null;
  args?: unknown;
};

export type ToolCallPayload = {
  id: string;
  name: string;
  args: Record<string, unknown>;
};

export type ToolResultPayload = {
  id?: string;
  name?: string;
  output?: unknown;
  error?: unknown;
};

export type ToolResponsePayload = {
  id?: string;
  name?: string;
  response: { output?: unknown; error?: unknown };
};

export function buildToolCallsPayload(calls: ToolCallInput[]): ToolCallPayload[] {
  return calls.map((call, index) => ({
    id: call.id ?? `${call.name ?? 'tool'}-${index}`,
    name: call.name ?? 'unknown',
    args: call.args && typeof call.args === 'object' && !Array.isArray(call.args)
      ? (call.args as Record<string, unknown>)
      : {},
  }));
}

export function buildToolResponses(results: ToolResultPayload[]): ToolResponsePayload[] {
  return results.map((result) => ({
    id: result.id,
    name: result.name,
    response: result.error ? { error: result.error } : { output: result.output },
  }));
}

export async function persistToolResult(
  sessionId: string,
  toolName: string,
  output?: unknown,
  error?: { message?: string }
): Promise<void> {
  try {
    const response = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'assistant',
        content: `[Tool: ${toolName}]`,
        metadata: {
          parts: [
            {
              type: 'tool-result',
              toolName,
              output: error ? { error: error.message ?? 'Tool execution failed' } : output,
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      logger.warn('[LiveVoice] Failed to persist tool result', {
        toolName,
        status: response.status,
      });
    }
  } catch (err) {
    logger.warn('[LiveVoice] Error persisting tool result', { error: err });
  }
}
