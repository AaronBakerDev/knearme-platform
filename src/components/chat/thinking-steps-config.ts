/**
 * Step Configurations for Chain of Thought UI
 *
 * Defines the steps displayed for each tool operation.
 * These create a more engaging UX by showing progress through multi-step operations.
 *
 * @see /src/components/chat/ThinkingSteps.tsx
 */

import type { ThinkingStep } from './ThinkingSteps';

// =============================================================================
// Step Definitions
// =============================================================================

export interface ToolStepConfig {
  /** Title shown in the ThinkingSteps header */
  title: string;
  /** Icon key for the header (maps to Lucide icons) */
  icon: 'search' | 'message' | 'globe' | 'save' | 'sparkles';
  /** Steps to display (without status - that's determined at runtime) */
  steps: Array<{
    id: string;
    label: string;
  }>;
  /** Function to generate collapsed summary */
  getSummary?: (result?: unknown) => string;
}

/**
 * Tool step configurations.
 * Maps tool names to their step definitions.
 */
export const TOOL_STEP_CONFIGS: Record<string, ToolStepConfig> = {
  showBusinessSearchResults: {
    title: 'Finding your business',
    icon: 'search',
    steps: [
      { id: 'search', label: 'Searching Google Maps' },
      { id: 'results', label: 'Processing results' },
    ],
    getSummary: (result) => {
      const r = result as { results?: Array<{ name?: string }> } | undefined;
      if (r?.results?.[0]?.name) {
        return `Found ${r.results.length} match${r.results.length > 1 ? 'es' : ''}`;
      }
      return 'Search complete';
    },
  },

  fetchReviews: {
    title: 'Loading customer reviews',
    icon: 'message',
    steps: [
      { id: 'fetch', label: 'Fetching reviews' },
      { id: 'analyze', label: 'Finding highlights' },
    ],
    getSummary: (result) => {
      const r = result as { reviews?: unknown[] } | undefined;
      if (r?.reviews?.length) {
        return `Found ${r.reviews.length} review${r.reviews.length > 1 ? 's' : ''}`;
      }
      return 'Reviews loaded';
    },
  },

  webSearchBusiness: {
    title: 'Searching the web',
    icon: 'globe',
    steps: [
      { id: 'search', label: 'Searching online' },
      { id: 'analyze', label: 'Analyzing results' },
    ],
    getSummary: () => 'Web search complete',
  },

  saveProfile: {
    title: 'Saving your profile',
    icon: 'save',
    steps: [
      { id: 'validate', label: 'Validating information' },
      { id: 'save', label: 'Saving to database' },
    ],
    getSummary: () => 'Profile saved',
  },

  showProfileReveal: {
    title: 'Preparing your summary',
    icon: 'sparkles',
    steps: [
      { id: 'generate', label: 'Creating portfolio summary' },
      { id: 'prepare', label: 'Preparing display' },
    ],
    getSummary: () => 'Summary ready',
  },

  confirmBusiness: {
    title: 'Confirming your business',
    icon: 'search',
    steps: [
      { id: 'confirm', label: 'Saving business details' },
    ],
    getSummary: () => 'Business confirmed',
  },
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Build steps array with appropriate statuses based on tool call state.
 *
 * @param toolName - The tool being called
 * @param toolState - Current state of the tool call
 * @param result - Optional result data for generating previews
 */
export function buildStepsForTool(
  toolName: string,
  toolState: 'input-streaming' | 'input-available' | 'executing' | 'output-available',
  _result?: unknown
): ThinkingStep[] {
  const config = TOOL_STEP_CONFIGS[toolName];
  if (!config) return [];

  // Determine which step is active based on tool state
  const isComplete = toolState === 'output-available';

  return config.steps.map((step, index) => {
    let status: ThinkingStep['status'];

    if (isComplete) {
      // All steps complete when output is available
      status = 'complete';
    } else if (index === 0) {
      // First step is in-progress during input/executing
      status = toolState === 'executing' ? 'in-progress' : 'in-progress';
    } else {
      // Later steps are pending
      status = 'pending';
    }

    return {
      id: step.id,
      label: step.label,
      status,
    };
  });
}

/**
 * Get the title for a tool's thinking steps.
 */
export function getToolTitle(toolName: string): string {
  return TOOL_STEP_CONFIGS[toolName]?.title || 'Working...';
}

/**
 * Get the summary for a completed tool call.
 */
export function getToolSummary(toolName: string, result?: unknown): string {
  const config = TOOL_STEP_CONFIGS[toolName];
  return config?.getSummary?.(result) || 'Complete';
}

/**
 * Get the icon key for a tool.
 */
export function getToolIcon(toolName: string): ToolStepConfig['icon'] {
  return TOOL_STEP_CONFIGS[toolName]?.icon || 'search';
}
