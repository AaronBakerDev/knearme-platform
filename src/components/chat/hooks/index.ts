/**
 * Chat hooks barrel export.
 *
 * @see useDropZone - Drag-and-drop file handling
 * @see useInlineImages - Inline image upload management
 * @see useCompleteness - Portfolio completeness calculation
 * @see useProjectData - Aggregated preview data
 * @see useKeyboardNavigation - Keyboard shortcuts and focus management
 * @see useMilestoneToasts - Milestone celebration toasts
 * @see useSmartSuggestion - Contextual suggestion pills
 * @see useAutoSummarize - Auto-summarize sessions on end
 * @see useSaveQueue - Optimistic saves with retry queue
 */

export { useDropZone } from './useDropZone';
export { useInlineImages } from './useInlineImages';
export { useCompleteness, calculateCompleteness } from './useCompleteness';
export type { CompletenessState } from './useCompleteness';
export { useProjectData } from './useProjectData';
export type { ProjectPreviewData, HeroImageLayout } from './useProjectData';
export { useKeyboardNavigation, useFocusTrap } from './useKeyboardNavigation';
export { useAutoSummarize, useSessionActivity } from './useAutoSummarize';
export { useSaveQueue } from './useSaveQueue';
export { useQuickActions } from './useQuickActions';
export type { QuickActionItem, QuickActionType } from './useQuickActions';
export { useVoiceModeManager } from './useVoiceModeManager';
export { useLiveVoiceSession } from './useLiveVoiceSession';

// UX polish hooks (co-located with their components)
export { useMilestoneToasts, MilestoneToast } from '../MilestoneToast';
export { useSmartSuggestion, SmartSuggestionPill } from '../SmartSuggestionPill';
export type { Suggestion } from '../SmartSuggestionPill';
