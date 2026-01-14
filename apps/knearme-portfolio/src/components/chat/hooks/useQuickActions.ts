import { useMemo } from 'react';
import type { ExtractedProjectData, ChatPhase } from '@/lib/chat/chat-types';
import type { CompletenessState } from './useCompleteness';

export type QuickActionType =
  | 'addPhotos'
  | 'generate'
  | 'openForm'
  | 'showPreview'
  | 'composeLayout'
  | 'checkPublishReady'
  | 'insert';

export interface QuickActionItem {
  id: string;
  label: string;
  type: QuickActionType;
  value?: string;
}

interface UseQuickActionsInput {
  extractedData: ExtractedProjectData;
  completeness: CompletenessState;
  imageCount: number;
  allowGenerate: boolean;
  phase?: ChatPhase;
}

/**
 * Quick action suggestions for the chat input.
 *
 * Heuristic-based baseline. Agent-driven suggestions can be merged
 * on top of this list in the ChatWizard without changing the UI.
 *
 * PHILOSOPHY: No phase gating. Actions are always available.
 * The phase param is kept for backwards compatibility but not used for gating.
 *
 * @see /docs/philosophy/agent-philosophy.md
 */
export function useQuickActions({
  extractedData,
  completeness,
  imageCount,
  allowGenerate,
  phase: _phase, // Kept for backwards compatibility, not used for gating
}: UseQuickActionsInput): QuickActionItem[] {
  return useMemo(() => {
    const actions: QuickActionItem[] = [];

    if (imageCount === 0) {
      actions.push({
        id: 'add-photos',
        label: 'Add photos',
        type: 'addPhotos',
      });
    }

    if (allowGenerate && imageCount > 0) {
      actions.push({
        id: 'generate',
        label: 'Generate content',
        type: 'generate',
      });
    }

    // PHILOSOPHY: Always show layout/publish actions when we have content
    // No phase gate - user decides when these are relevant
    if (allowGenerate) {
      actions.push({
        id: 'compose-layout',
        label: 'Compose layout',
        type: 'composeLayout',
      });
      actions.push({
        id: 'check-publish',
        label: 'Check publish readiness',
        type: 'checkPublishReady',
      });
    }

    const promptCandidates: Array<{ id: string; label: string; value: string; condition: boolean }> = [
      {
        id: 'project-type',
        label: 'Add project type',
        value: 'Project type was ...',
        condition: !extractedData.project_type,
      },
      {
        id: 'location',
        label: 'Add location',
        value: 'This project was in City, ST.',
        condition: !extractedData.city || !extractedData.state,
      },
      {
        id: 'materials',
        label: 'Add materials',
        value: 'Materials used: ...',
        condition: !extractedData.materials_mentioned?.length,
      },
      {
        id: 'customer-problem',
        label: 'Add customer problem',
        value: 'Customer problem: ...',
        condition: !extractedData.customer_problem,
      },
      {
        id: 'solution-approach',
        label: 'Add solution approach',
        value: 'Solution approach: ...',
        condition: !extractedData.solution_approach,
      },
      {
        id: 'duration',
        label: 'Add duration',
        value: 'Project duration: ...',
        condition: !extractedData.duration,
      },
      {
        id: 'proud-of',
        label: 'Add proud-of detail',
        value: "I'm proud of ...",
        condition: !extractedData.proud_of,
      },
    ];

    for (const candidate of promptCandidates) {
      if (candidate.condition) {
        actions.push({
          id: candidate.id,
          label: candidate.label,
          type: 'insert',
          value: candidate.value,
        });
      }

      if (actions.length >= 5) break;
    }

    // Ensure we always show the most relevant missing fields if available
    if (actions.length === 0 && completeness.missingFields.length > 0) {
      actions.push({
        id: 'missing-fields',
        label: 'What should I add next?',
        type: 'insert',
        value: 'What details are still missing for this project?',
      });
    }

    return actions.slice(0, 5);
  }, [
    allowGenerate,
    completeness.missingFields.length,
    extractedData.city,
    extractedData.customer_problem,
    extractedData.duration,
    extractedData.materials_mentioned,
    extractedData.project_type,
    extractedData.proud_of,
    extractedData.solution_approach,
    extractedData.state,
    imageCount,
    // phase removed - no longer used for gating
  ]);
}
