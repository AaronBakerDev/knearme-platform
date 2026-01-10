import type { SharedProjectState } from '../types';
import type { PhaseHint } from './types';

/**
 * Determine the current phase based on state.
 *
 * @deprecated This function is informational only, not for gating.
 * The model decides what to do based on context, not forced phases.
 * Kept for backwards compatibility and analytics.
 *
 * @see /docs/philosophy/agent-philosophy.md
 */
export function determinePhase(state: SharedProjectState): PhaseHint {
  if (state.readyToPublish) return 'ready';
  if (state.title && state.description) return 'review';
  if (state.images.length > 0) return 'generating';
  return 'gathering';
}

/**
 * Merge new updates into project state.
 * Later values override earlier ones for the same field.
 */
export function mergeProjectState(
  existing: SharedProjectState,
  updates: Partial<SharedProjectState>
): SharedProjectState {
  return {
    ...existing,
    ...updates,
    materials: [...new Set([...existing.materials, ...(updates.materials || [])])],
    techniques: [...new Set([...existing.techniques, ...(updates.techniques || [])])],
    tags: [...new Set([...existing.tags, ...(updates.tags || [])])],
    images: updates.images || existing.images,
    needsClarification: updates.needsClarification || existing.needsClarification,
    clarifiedFields: [
      ...new Set([
        ...existing.clarifiedFields,
        ...(updates.clarifiedFields || []),
      ]),
    ],
  };
}
