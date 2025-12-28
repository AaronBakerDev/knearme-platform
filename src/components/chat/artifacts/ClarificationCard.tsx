'use client';

/**
 * ClarificationCard artifact.
 *
 * Displays when the AI is uncertain about something and needs clarification.
 * Shows the question, confidence level, current value (if any), and
 * alternative options the user can select.
 *
 * Features:
 * - Visual confidence indicator (low/medium/high)
 * - Quick-select buttons for common alternatives
 * - Free-form input option
 * - Context explanation for why clarification is needed
 *
 * @see /docs/ai-sdk/chat-artifacts-spec.md
 * @see /todo/ai-sdk-phase-8-agent-architecture.md
 */

import { useState } from 'react';
import { HelpCircle, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ClarificationData } from '@/types/artifacts';

interface ClarificationCardProps {
  /** Clarification data from tool output */
  data: ClarificationData;
  /** Callback when user responds */
  onAction?: (action: { type: string; payload?: unknown }) => void;
  /** Optional additional className */
  className?: string;
}

/**
 * Get confidence level styling.
 */
function getConfidenceStyle(confidence: number): {
  color: string;
  bgColor: string;
  icon: typeof HelpCircle;
  label: string;
} {
  if (confidence < 0.3) {
    return {
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      icon: AlertTriangle,
      label: 'Low confidence',
    };
  }
  if (confidence < 0.7) {
    return {
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      icon: HelpCircle,
      label: 'Needs confirmation',
    };
  }
  return {
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    icon: CheckCircle,
    label: 'Likely correct',
  };
}

/**
 * Human-readable field labels.
 */
const FIELD_LABELS: Record<string, string> = {
  project_type: 'Project Type',
  materials: 'Materials Used',
  customer_problem: 'Customer Problem',
  solution_approach: 'Solution Approach',
  duration: 'Project Duration',
  location: 'Location',
  challenges: 'Challenges Faced',
  proud_of: 'Highlight',
  techniques: 'Techniques Used',
};

/**
 * ClarificationCard component.
 */
export function ClarificationCard({
  data,
  onAction,
  className,
}: ClarificationCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { field, currentValue, alternatives, question, confidence, context } = data;
  const style = getConfidenceStyle(confidence);
  const ConfidenceIcon = style.icon;
  const fieldLabel = FIELD_LABELS[field] || field;

  const handleSelectOption = (option: string) => {
    setSelectedOption(option);
  };

  const handleConfirm = () => {
    if (!onAction || !selectedOption) return;

    setIsSubmitting(true);
    onAction({
      type: 'clarification-response',
      payload: {
        field,
        value: selectedOption,
        wasOriginalValue: selectedOption === currentValue,
      },
    });
  };

  const handleConfirmCurrent = () => {
    if (!onAction || !currentValue) return;

    setIsSubmitting(true);
    onAction({
      type: 'clarification-response',
      payload: {
        field,
        value: currentValue,
        wasOriginalValue: true,
      },
    });
  };

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-4 my-3 transition-all shadow-sm',
        className
      )}
      role="region"
      aria-label={`Clarification needed for ${fieldLabel}`}
    >
      {/* Header with confidence indicator */}
      <div className="flex items-start gap-3 mb-3">
        <div className={cn('p-2 rounded-full', style.bgColor)}>
          <ConfidenceIcon className={cn('w-5 h-5', style.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', style.bgColor, style.color)}>
              {style.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {fieldLabel}
            </span>
          </div>
          <p className="text-sm font-medium text-foreground mt-1">
            {question}
          </p>
        </div>
      </div>

      {/* Context explanation */}
      {context && (
        <p className="text-xs text-muted-foreground mb-3 pl-11">
          {context}
        </p>
      )}

      {/* Current value (if any) */}
      {currentValue && (
        <div className="mb-3 pl-11">
          <p className="text-xs text-muted-foreground mb-1">Current understanding:</p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground bg-muted px-3 py-1.5 rounded-md border border-border">
              {currentValue}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleConfirmCurrent}
              disabled={isSubmitting}
              className="h-8 text-primary hover:text-primary"
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              Correct
            </Button>
          </div>
        </div>
      )}

      {/* Alternative options */}
      {alternatives && alternatives.length > 0 && (
        <div className="pl-11">
          <p className="text-xs text-muted-foreground mb-2">
            {currentValue ? 'Or did you mean:' : 'Please select:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {alternatives.map((alt) => (
              <button
                key={alt}
                onClick={() => handleSelectOption(alt)}
                disabled={isSubmitting}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md border transition-all',
                  'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20',
                  selectedOption === alt
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/50 border-border text-foreground'
                )}
              >
                {alt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Submit selected option */}
      {selectedOption && selectedOption !== currentValue && (
        <div className="mt-3 pl-11">
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            size="sm"
            className="gap-1"
          >
            Use &ldquo;{selectedOption}&rdquo;
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
