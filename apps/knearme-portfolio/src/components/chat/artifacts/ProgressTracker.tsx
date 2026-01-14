'use client';

/**
 * ProgressTracker artifact.
 *
 * In-chat visual showing portfolio completeness with animated progress ring,
 * completed/pending fields, and contextual status messages.
 *
 * Features:
 * - Animated progress ring with percentage
 * - Checkmark icons for completed fields
 * - Contextual next-step suggestions
 * - Celebration animation when reaching 100%
 *
 * @see /docs/ai-sdk/chat-ux-patterns.md#progress-visualization
 * @see /docs/ai-sdk/chat-artifacts-spec.md
 */

import { Check, Circle, Camera, Wrench, Clock, HelpCircle, Sparkles, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProgressTrackerData } from '@/types/artifacts';

interface ProgressTrackerProps {
  /** Progress data from tool output */
  data: ProgressTrackerData;
  /** Optional additional className */
  className?: string;
}

/**
 * Field icons for visual representation.
 */
const FIELD_ICONS: Record<string, typeof Check> = {
  photos: Camera,
  project_type: HelpCircle,
  materials: Wrench,
  customer_problem: HelpCircle,
  solution_approach: Lightbulb,
  duration: Clock,
  proud_of: Sparkles,
};

/**
 * Human-readable field labels.
 */
const FIELD_LABELS: Record<string, string> = {
  photos: 'Photos',
  project_type: 'Project type',
  materials: 'Materials',
  customer_problem: 'The problem',
  solution_approach: 'Your solution',
  duration: 'Timeline',
  proud_of: 'Highlight',
};

/**
 * Progress ring SVG with animation.
 */
function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 6,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  const isComplete = progress >= 100;

  return (
    <div className="relative">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Portfolio ${progress}% complete`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(
            'transition-all duration-700 ease-out',
            isComplete ? 'text-green-500' : 'text-primary'
          )}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={cn(
            'text-lg font-semibold tabular-nums',
            isComplete && 'text-green-500'
          )}
        >
          {progress}%
        </span>
      </div>
    </div>
  );
}

/**
 * Field item component showing completion status.
 */
function FieldItem({
  field,
  isComplete,
  index,
}: {
  field: string;
  isComplete: boolean;
  index: number;
}) {
  const Icon = FIELD_ICONS[field] || Circle;
  const label = FIELD_LABELS[field] || field;

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm animate-chip-slide-in',
        `chip-stagger-${Math.min(index + 1, 6)}`,
        isComplete ? 'text-foreground' : 'text-muted-foreground'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center w-5 h-5 rounded-full transition-colors',
          isComplete ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'
        )}
      >
        {isComplete ? (
          <Check className="h-3 w-3" />
        ) : (
          <Icon className="h-3 w-3" />
        )}
      </div>
      <span className={cn(isComplete && 'line-through decoration-muted-foreground/50')}>
        {label}
      </span>
    </div>
  );
}

/**
 * ProgressTracker artifact component.
 *
 * Renders an in-chat progress visualization with:
 * - Animated progress ring
 * - Completed/pending field checklist
 * - Contextual status message
 */
export function ProgressTracker({ data, className }: ProgressTrackerProps) {
  const { percentage, completedFields, missingFields, statusMessage, canGenerate } = data;
  const isComplete = percentage >= 100;
  const allFields = [...completedFields, ...missingFields];

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 animate-canvas-item-in',
        isComplete && 'border-green-500/30 bg-green-500/5',
        className
      )}
      data-testid="progress-tracker"
    >
      <div className="flex items-start gap-4">
        {/* Progress ring */}
        <ProgressRing progress={percentage} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Status message */}
          <p className={cn(
            'font-medium mb-3',
            isComplete && 'text-green-500'
          )}>
            {statusMessage}
          </p>

          {/* Field checklist - 2 columns on larger screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            {allFields.map((field, index) => (
              <FieldItem
                key={field}
                field={field}
                isComplete={completedFields.includes(field)}
                index={index}
              />
            ))}
          </div>

          {/* Generate hint when ready */}
          {canGenerate && !isComplete && (
            <p className="mt-3 text-xs text-muted-foreground">
              You can generate now, or add more details for a better result.
            </p>
          )}
        </div>
      </div>

      {/* ARIA live region for screen readers */}
      <div aria-live="polite" className="sr-only">
        Portfolio {percentage}% complete. {statusMessage}
        {completedFields.length > 0 && `. Completed: ${completedFields.map(f => FIELD_LABELS[f] || f).join(', ')}.`}
        {missingFields.length > 0 && ` Missing: ${missingFields.map(f => FIELD_LABELS[f] || f).join(', ')}.`}
      </div>
    </div>
  );
}

export default ProgressTracker;
