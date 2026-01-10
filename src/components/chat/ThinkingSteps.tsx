'use client';

/**
 * ThinkingSteps - Minimal Chain of Thought UI Component
 *
 * A clean, ChatGPT-style indicator showing the agent's progress through
 * multi-step operations. Designed for minimal visual footprint while
 * maintaining informational clarity.
 *
 * Features:
 * - Minimal inline design (no heavy borders or nested containers)
 * - Small status indicators: dot (pending), spinner (active), check (complete)
 * - Smooth fade-in animations with staggered delays
 * - Auto-opens during streaming, auto-collapses 800ms after completion
 * - Manual toggle via click
 *
 * @example
 * ```tsx
 * <ThinkingSteps
 *   title="Finding your business"
 *   steps={[
 *     { id: 'search', label: 'Searching Google Maps', status: 'complete' },
 *     { id: 'results', label: 'Found 3 matches', status: 'in-progress', preview: <ResultsList /> },
 *   ]}
 *   isStreaming={true}
 * />
 * ```
 *
 * @see /docs/ai-sdk/chain-of-thought.md
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Search, Check, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

export interface ThinkingStep {
  /** Unique identifier for the step */
  id: string;
  /** Display label for the step */
  label: string;
  /** Current status of the step */
  status: 'pending' | 'in-progress' | 'complete' | 'error';
  /** Optional inline preview content (e.g., search results list) */
  preview?: ReactNode;
}

export interface ThinkingStepsProps {
  /** Title shown in the header (e.g., "Finding your business") */
  title: string;
  /** Array of steps to display */
  steps: ThinkingStep[];
  /** Whether the agent is currently streaming */
  isStreaming: boolean;
  /** Summary text shown when collapsed (e.g., "Found ABC Masonry") */
  summary?: string;
  /** Icon to show in header */
  icon?: ReactNode;
  /** Optional className */
  className?: string;
}

// =============================================================================
// Status Icon Component - Minimal Design
// =============================================================================

function StepStatusIcon({ status }: { status: ThinkingStep['status'] }) {
  switch (status) {
    case 'complete':
      return <Check className="h-3.5 w-3.5 text-green-500" />;
    case 'in-progress':
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />;
    case 'error':
      return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
    case 'pending':
    default:
      return (
        <span className="flex h-3.5 w-3.5 items-center justify-center">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
        </span>
      );
  }
}

// =============================================================================
// Component
// =============================================================================

export function ThinkingSteps({
  title,
  steps,
  isStreaming,
  summary,
  icon,
  className,
}: ThinkingStepsProps) {
  // Track whether user has manually toggled (overrides auto behavior)
  const [userOverride, setUserOverride] = useState<boolean | null>(null);
  // Track if we're in the delayed collapse phase
  const [isDelayedClosed, setIsDelayedClosed] = useState(false);
  const prevStreamingRef = useRef(isStreaming);

  // Detect streaming transitions and handle state changes
  useEffect(() => {
    const wasStreaming = prevStreamingRef.current;
    prevStreamingRef.current = isStreaming;

    // Streaming just ended - start delayed collapse
    if (!isStreaming && wasStreaming) {
      const timer = setTimeout(() => {
        setIsDelayedClosed(true);
      }, 800); // Brief delay to show completion
      return () => clearTimeout(timer);
    }

    // Streaming started - reset state (deferred to satisfy lint rule)
    if (isStreaming && !wasStreaming) {
      const resetTimer = setTimeout(() => {
        setIsDelayedClosed(false);
        setUserOverride(null);
      }, 0);
      return () => clearTimeout(resetTimer);
    }
  }, [isStreaming]);

  // Compute effective isOpen state:
  // 1. User override takes precedence
  // 2. Otherwise: open while streaming, closed after delayed close
  const isOpen =
    userOverride !== null ? userOverride : isStreaming || !isDelayedClosed;

  // Handler for manual toggle
  const handleOpenChange = (open: boolean) => {
    setUserOverride(open);
  };

  // Check if all steps are complete
  const allComplete = steps.every((step) => step.status === 'complete');
  const hasError = steps.some((step) => step.status === 'error');

  // Determine header content
  const headerIcon = icon || <Search className="h-3.5 w-3.5" />;
  const headerText = !isOpen && summary ? summary : title;

  return (
    <div className={cn('animate-fade-in', className)}>
      <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
        {/* Header - minimal clickable trigger */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              'group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm',
              'hover:bg-muted/40 transition-colors duration-200',
              'text-left cursor-pointer'
            )}
          >
            {/* Icon with subtle animation when streaming */}
            <span
              className={cn(
                'text-muted-foreground transition-colors',
                isStreaming && 'text-primary'
              )}
            >
              {isStreaming ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : allComplete ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : hasError ? (
                <AlertCircle className="h-3.5 w-3.5 text-red-500" />
              ) : (
                headerIcon
              )}
            </span>

            {/* Title/Summary */}
            <span
              className={cn(
                'flex-1 transition-colors duration-200',
                isStreaming
                  ? 'text-foreground font-medium'
                  : allComplete
                    ? 'text-muted-foreground'
                    : 'text-foreground/80'
              )}
            >
              {headerText}
            </span>

            {/* Expand/collapse chevron */}
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-200',
                'group-hover:text-muted-foreground',
                isOpen && 'rotate-180'
              )}
            />
          </button>
        </CollapsibleTrigger>

        {/* Steps content - flat structure, no nested borders */}
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-up-1 data-[state=open]:slide-down-1 duration-200">
          <div className="ml-5 space-y-1 pb-1 pt-0.5">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="animate-fade-in"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'both',
                }}
              >
                {/* Step row */}
                <div className="flex items-center gap-2 py-0.5">
                  <StepStatusIcon status={step.status} />
                  <span
                    className={cn(
                      'text-sm transition-colors duration-150',
                      step.status === 'complete' && 'text-foreground/70',
                      step.status === 'in-progress' &&
                        'text-foreground font-medium',
                      step.status === 'pending' && 'text-muted-foreground/60',
                      step.status === 'error' && 'text-red-500'
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Preview content (if any) */}
                {step.preview && (
                  <div
                    className="ml-5 mt-1 animate-fade-in text-sm text-muted-foreground"
                    style={{ animationDelay: `${(index + 1) * 50}ms` }}
                  >
                    {step.preview}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
