import type { UIMessage } from 'ai';
import type { QuickActionItem, QuickActionType } from '@/components/chat/hooks';
import type { SuggestQuickActionsOutput } from '@/lib/chat/tool-schemas';

/**
 * Extract error message from a Response object.
 * Attempts to parse JSON body for structured error messages.
 */
export async function getResponseErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return fallback;
  }

  try {
    const data = await response.json();
    return data?.error?.message ?? data?.message ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Task A6: Type-safe interface for ContentEditor tool parts.
 * Used for safe updates when regenerating content.
 */
export interface ContentEditorToolPart {
  type: 'tool-showContentEditor';
  state: string;
  toolCallId: string;
  output?: unknown;
  input?: unknown;
  errorText?: string;
}

/**
 * Task A6: Type guard to validate ContentEditor tool part structure.
 * @see /src/types/artifacts.ts for related type definitions
 */
export function isContentEditorToolPart(part: unknown): part is ContentEditorToolPart {
  if (typeof part !== 'object' || part === null) return false;
  const p = part as Record<string, unknown>;
  return (
    p.type === 'tool-showContentEditor' &&
    typeof p.state === 'string' &&
    typeof p.toolCallId === 'string'
  );
}

const QUICK_ACTION_LIMIT = 5;

const QUICK_ACTION_TYPES: QuickActionType[] = [
  'addPhotos',
  'generate',
  'openForm',
  'showPreview',
  'composeLayout',
  'checkPublishReady',
  'insert',
];

function isQuickActionType(value: string): value is QuickActionType {
  return QUICK_ACTION_TYPES.includes(value as QuickActionType);
}

export function mergeQuickActions(
  primary: QuickActionItem[],
  fallback: QuickActionItem[]
): QuickActionItem[] {
  const merged: QuickActionItem[] = [];
  const seen = new Set<string>();

  const addAction = (action: QuickActionItem) => {
    if (action.type === 'insert' && !action.value) return;
    const key = `${action.type}:${action.label}`.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(action);
  };

  for (const action of [...primary, ...fallback]) {
    addAction(action);
    if (merged.length >= QUICK_ACTION_LIMIT) break;
  }

  return merged;
}

/**
 * Tool types that trigger side-effects in ArtifactRenderer.
 * When messages are restored from session history, we need to track
 * these tool call IDs to prevent re-firing side-effects.
 * @see /src/components/chat/artifacts/ArtifactRenderer.tsx SIDE_EFFECT_TOOLS
 */
const SIDE_EFFECT_TOOL_TYPES = new Set([
  'tool-showContentEditor',
  'tool-showPortfolioPreview',
  'tool-updateField',
  'tool-updateDescriptionBlocks',
  'tool-suggestQuickActions',
  'tool-composePortfolioLayout',
  'tool-reorderImages',
  'tool-regenerateSection',
  'tool-validateForPublish',
]);

/**
 * Extract side-effect tool call IDs from messages.
 * Used to pre-populate processedSideEffectToolCalls when restoring session.
 */
export function extractSideEffectToolCallIds(messages: UIMessage[]): Set<string> {
  const ids = new Set<string>();
  for (const msg of messages) {
    if (!msg.parts) continue;
    for (const part of msg.parts) {
      if (typeof part !== 'object' || part === null) continue;
      const toolPart = part as { type?: string; toolCallId?: string };
      if (toolPart.type && toolPart.toolCallId && SIDE_EFFECT_TOOL_TYPES.has(toolPart.type)) {
        ids.add(toolPart.toolCallId);
      }
    }
  }
  return ids;
}

export function coerceQuickActionSuggestions(payload: unknown): QuickActionItem[] {
  if (!payload || typeof payload !== 'object') return [];
  // Safely check if 'actions' property exists before casting
  if (!('actions' in payload)) return [];
  const actions = (payload as SuggestQuickActionsOutput).actions;
  if (!Array.isArray(actions)) return [];

  const now = Date.now();
  return actions
    .flatMap((action, index): QuickActionItem[] => {
      if (!action || typeof action !== 'object') return [];
      const { label, type, value } = action as {
        label?: unknown;
        type?: unknown;
        value?: unknown;
      };

      if (typeof label !== 'string' || !label.trim()) return [];
      if (typeof type !== 'string' || !isQuickActionType(type)) return [];
      if (type === 'insert' && (typeof value !== 'string' || !value.trim())) return [];

      return [
        {
          id: `agent-${now}-${index}`,
          label: label.trim(),
          type,
          value: typeof value === 'string' ? value : undefined,
        },
      ];
    })
    .slice(0, QUICK_ACTION_LIMIT);
}

export function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function mergeUniqueStrings(...arrays: string[][]): string[] {
  return Array.from(
    new Set(
      arrays
        .flat()
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    )
  );
}

export type DeepToolChoice =
  | 'generatePortfolioContent'
  | 'checkPublishReady'
  | 'composePortfolioLayout';

export function inferDeepToolChoice(text: string): DeepToolChoice | undefined {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return undefined;

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

  return undefined;
}
