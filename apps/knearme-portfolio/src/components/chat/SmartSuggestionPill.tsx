'use client';

/**
 * SmartSuggestionPill - Contextual suggestion hints.
 *
 * Appears above the chat input when the AI has a contextual suggestion
 * for what the user might want to do next. Tapping the pill inserts
 * the suggestion into the input or triggers an action.
 *
 * Use cases:
 * - "Add more photos" when description is ready but images are few
 * - "Tell me about the challenge" when materials detected but no problem
 * - "Ready to generate!" when completeness is high
 *
 * @see /docs/ai-sdk/chat-ux-patterns.md#smartsuggestionpill
 */

import { Lightbulb, ChevronRight, Camera, MessageSquare, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Suggestion types with associated icons.
 */
export type SuggestionType = 'prompt' | 'photos' | 'generate' | 'general';

/**
 * Suggestion configuration.
 */
export interface Suggestion {
  /** The suggestion text to display */
  text: string;
  /** Type of suggestion (affects icon) */
  type: SuggestionType;
  /** Optional action to trigger instead of inserting text */
  action?: 'addPhotos' | 'generate';
}

interface SmartSuggestionPillProps {
  /** The suggestion to display */
  suggestion: Suggestion | null;
  /** Called when user taps the pill */
  onTap?: (suggestion: Suggestion) => void;
  /** Optional additional className */
  className?: string;
}

/**
 * Icon map for suggestion types.
 */
const TYPE_ICONS = {
  prompt: MessageSquare,
  photos: Camera,
  generate: Sparkles,
  general: Lightbulb,
} as const;

/**
 * SmartSuggestionPill component.
 *
 * A tappable pill that appears above the input with a contextual suggestion.
 * Animates in with fade-in-up and can be tapped to execute the suggestion.
 *
 * @example
 * ```tsx
 * <SmartSuggestionPill
 *   suggestion={{ text: 'Add more photos', type: 'photos', action: 'addPhotos' }}
 *   onTap={(s) => {
 *     if (s.action === 'addPhotos') {
 *       openPhotoSheet();
 *     }
 *   }}
 * />
 * ```
 */
export function SmartSuggestionPill({
  suggestion,
  onTap,
  className,
}: SmartSuggestionPillProps) {
  if (!suggestion) {
    return null;
  }

  const Icon = TYPE_ICONS[suggestion.type] || Lightbulb;

  return (
    <button
      type="button"
      onClick={() => onTap?.(suggestion)}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-full',
        'bg-muted hover:bg-muted/80 text-sm',
        'transition-colors duration-150',
        'animate-fade-in',
        className
      )}
      aria-label={`Suggestion: ${suggestion.text}`}
    >
      <Icon
        className={cn(
          'h-4 w-4 flex-shrink-0',
          suggestion.type === 'generate' && 'text-primary',
          suggestion.type === 'photos' && 'text-blue-500',
          suggestion.type === 'prompt' && 'text-amber-500',
          suggestion.type === 'general' && 'text-amber-500'
        )}
        aria-hidden="true"
      />
      <span className="truncate">{suggestion.text}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
    </button>
  );
}

/**
 * Hook to generate smart suggestions based on current state.
 *
 * Analyzes completeness data, image count, and conversation state
 * to provide contextual next-step suggestions.
 *
 * @example
 * ```tsx
 * const suggestion = useSmartSuggestion({
 *   completeness: { percentage: 40, missingFields: ['photos', 'duration'] },
 *   imageCount: 1,
 *   phase: 'conversation',
 * });
 *
 * <SmartSuggestionPill suggestion={suggestion} onTap={handleSuggestion} />
 * ```
 */
export function useSmartSuggestion(context: {
  completeness: {
    percentage: number;
    missingFields: string[];
    canGenerate: boolean;
  };
  imageCount: number;
  phase: 'conversation' | 'generation' | 'review';
}): Suggestion | null {
  const { completeness, imageCount, phase } = context;

  // Don't show suggestions during generation or review
  if (phase !== 'conversation') {
    return null;
  }

  // Ready to generate
  if (completeness.canGenerate && completeness.percentage >= 75) {
    return {
      text: 'Ready to generate your portfolio!',
      type: 'generate',
      action: 'generate',
    };
  }

  // Need photos
  if (imageCount === 0) {
    return {
      text: 'Add some photos of your project',
      type: 'photos',
      action: 'addPhotos',
    };
  }

  // Could use more photos
  if (imageCount < 3 && completeness.percentage > 40) {
    return {
      text: 'Add more photos for a better showcase',
      type: 'photos',
      action: 'addPhotos',
    };
  }

  // Missing specific content
  if (completeness.missingFields.includes('customer_problem')) {
    return {
      text: 'What problem did the customer have?',
      type: 'prompt',
    };
  }

  if (completeness.missingFields.includes('solution_approach')) {
    return {
      text: 'Tell me how you solved it',
      type: 'prompt',
    };
  }

  if (completeness.missingFields.includes('proud_of')) {
    return {
      text: "What are you most proud of?",
      type: 'prompt',
    };
  }

  // Encourage more detail
  if (completeness.percentage < 60) {
    return {
      text: 'Tell me more about this project',
      type: 'prompt',
    };
  }

  return null;
}

export default SmartSuggestionPill;
