'use client';

/**
 * ExpandableProgressChecklist - Clickable progress ring with expandable checklist.
 *
 * When collapsed: Shows progress ring with percentage and status message
 * When expanded: Shows detailed checklist with:
 *   - Completed items (green checkmark, strikethrough)
 *   - Missing items (clickable, shows specific requirement)
 *   - Clicking missing item inserts prompt or triggers action
 *
 * Design: Clean, functional with subtle craft-inspired details
 * - Smooth expand/collapse animation
 * - Color-coded progress states
 * - Interactive missing items
 *
 * @see useCompleteness for field weights and requirements
 */

import { useState, useCallback } from 'react';
import {
  Check,
  ChevronDown,
  Camera,
  Wrench,
  Clock,
  HelpCircle,
  Sparkles,
  Lightbulb,
  Star,
  ArrowRight,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { CompletenessState } from './hooks/useCompleteness';
import type { LucideIcon } from 'lucide-react';

interface FieldConfig {
  label: string;
  icon: LucideIcon;
  requirement: string;
  prompt?: string;
  action?: 'addPhotos';
}

/**
 * Field configuration for the checklist.
 */
const FIELD_CONFIG: Record<string, FieldConfig> = {
  photos: {
    label: 'Photos',
    icon: Camera,
    requirement: 'Add at least 1 photo',
    action: 'addPhotos',
  },
  project_type: {
    label: 'Project type',
    icon: HelpCircle,
    requirement: 'Tell me what type of project',
    prompt: 'This is a ',
  },
  materials: {
    label: 'Materials',
    icon: Wrench,
    requirement: 'Mention the materials used',
    prompt: 'The materials I used were ',
  },
  customer_problem: {
    label: 'Customer problem',
    icon: HelpCircle,
    requirement: 'Describe the problem',
    prompt: 'The customer came to me because ',
  },
  solution_approach: {
    label: 'Your solution',
    icon: Lightbulb,
    requirement: 'Explain how you solved it',
    prompt: 'To fix this, I ',
  },
  duration: {
    label: 'Timeline',
    icon: Clock,
    requirement: 'How long did it take?',
    prompt: 'This project took about ',
  },
  proud_of: {
    label: 'Highlight',
    icon: Star,
    requirement: 'What are you most proud of?',
    prompt: "What I'm most proud of is ",
  },
};

interface ExpandableProgressChecklistProps {
  /** Current completeness state */
  completeness: CompletenessState;
  /** Called when user clicks a prompt chip */
  onInsertPrompt: (text: string) => void;
  /** Called when user clicks add photos */
  onAction: (action: 'addPhotos') => void;
  /** Additional class names */
  className?: string;
}

/**
 * Animated progress ring SVG.
 */
function ProgressRing({
  progress,
  size = 48,
  strokeWidth = 4,
  isComplete,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  isComplete?: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        aria-label={`${progress}% complete`}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/40"
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
            isComplete ? 'text-emerald-500' : 'text-primary'
          )}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={cn(
            'text-sm font-semibold tabular-nums',
            isComplete ? 'text-emerald-500' : 'text-foreground'
          )}
        >
          {progress}%
        </span>
      </div>
    </div>
  );
}

/**
 * Completed field item.
 */
function CompletedField({ field }: { field: string }) {
  const config = FIELD_CONFIG[field];
  if (!config) return null;

  return (
    <div className="flex items-center gap-2.5 py-1.5 text-sm">
      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
        <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
      </div>
      <span className="text-muted-foreground line-through">{config.label}</span>
    </div>
  );
}

/**
 * Missing field item - clickable.
 */
function MissingField({
  field,
  onClick,
}: {
  field: string;
  onClick: () => void;
}) {
  const config = FIELD_CONFIG[field];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 py-2 px-1.5 -mx-1.5 rounded-lg',
        'text-left group',
        'hover:bg-muted/60 active:bg-muted',
        'transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1'
      )}
    >
      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
        <Icon className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground/90 group-hover:text-foreground">
          {config.label}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {config.requirement}
        </p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-transparent group-hover:text-primary transition-colors flex-shrink-0" />
    </button>
  );
}

/**
 * ExpandableProgressChecklist component.
 */
export function ExpandableProgressChecklist({
  completeness,
  onInsertPrompt,
  onAction,
  className,
}: ExpandableProgressChecklistProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { percentage, completedFields, missingFields, statusMessage } =
    completeness;

  const isComplete = percentage >= 100;

  const handleFieldClick = useCallback(
    (field: string) => {
      const config = FIELD_CONFIG[field];
      if (!config) return;

      if (config.action) {
        onAction(config.action);
      } else if (config.prompt) {
        onInsertPrompt(config.prompt);
        // Close the checklist after action
        setIsOpen(false);
      }
    },
    [onAction, onInsertPrompt]
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            'w-full flex items-center gap-3 p-3 rounded-xl',
            'text-left',
            'bg-muted/30 hover:bg-muted/50 border border-border/30 hover:border-border/50',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1',
            isComplete && 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30'
          )}
        >
          {/* Progress ring */}
          <ProgressRing progress={percentage} isComplete={isComplete} />

          {/* Status text */}
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'text-sm font-medium',
                isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
              )}
            >
              {statusMessage}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {completedFields.length}/{completedFields.length + missingFields.length} complete
              {!isOpen && missingFields.length > 0 && ' · Tap to see details'}
            </p>
          </div>

          {/* Chevron */}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="pt-3 px-1 space-y-1">
          {/* Missing fields first - actionable */}
          {missingFields.length > 0 && (
            <div className="space-y-0.5">
              {missingFields.map((field) => (
                <MissingField
                  key={field}
                  field={field}
                  onClick={() => handleFieldClick(field)}
                />
              ))}
            </div>
          )}

          {/* Divider if both sections present */}
          {missingFields.length > 0 && completedFields.length > 0 && (
            <div className="h-px bg-border/50 my-2" />
          )}

          {/* Completed fields */}
          {completedFields.length > 0 && (
            <div className="space-y-0.5 opacity-60">
              {completedFields.map((field) => (
                <CompletedField key={field} field={field} />
              ))}
            </div>
          )}

          {/* Ready to generate message */}
          {isComplete && (
            <div className="flex items-center gap-2 pt-3 text-sm text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">Ready to generate your portfolio!</span>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default ExpandableProgressChecklist;
