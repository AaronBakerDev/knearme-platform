'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, FileText, ShieldCheck, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export type AIStage = 'analyzing' | 'generating' | 'reviewing' | 'complete';

export interface AIProgressProps {
  stage: AIStage;
  currentStep?: string;
}

const STAGES: { key: AIStage; label: string; icon: typeof Sparkles }[] = [
  { key: 'analyzing', label: 'Analyzing images', icon: Sparkles },
  { key: 'generating', label: 'Generating content', icon: FileText },
  { key: 'reviewing', label: 'Reviewing quality', icon: ShieldCheck },
  { key: 'complete', label: 'Complete', icon: ShieldCheck },
];

const TIPS: Record<AIStage, string[]> = {
  analyzing: [
    'Our AI is analyzing your project photos...',
    'Detecting materials like brick, stone, and mortar...',
    'Identifying before/after progression...',
    'Recognizing techniques and craftsmanship...',
  ],
  generating: [
    'Crafting your project description...',
    'Creating SEO-optimized content...',
    'Generating tags for discoverability...',
    'Writing a compelling story for your work...',
  ],
  reviewing: [
    'Ensuring content quality...',
    'Checking for completeness...',
  ],
  complete: [
    'All done! Your content is ready.',
  ],
};

export function AIProgress({ stage, currentStep }: AIProgressProps) {
  const activeIndex = STAGES.findIndex((s) => s.key === stage);
  const percent = ((activeIndex + 1) / STAGES.length) * 100;

  const [tipIndex, setTipIndex] = useState(0);
  const [showTimeEstimate, setShowTimeEstimate] = useState(false);
  const prevStageRef = useRef(stage);

  // Reset state when stage changes (via ref comparison to avoid lint warning)
  useEffect(() => {
    if (prevStageRef.current !== stage) {
      prevStageRef.current = stage;
      // Use setTimeout with 0ms to batch state updates after render
      setTimeout(() => {
        setTipIndex(0);
        setShowTimeEstimate(false);
      }, 0);
    }
  }, [stage]);

  // Rotate tips every 5 seconds
  useEffect(() => {
    const tips = TIPS[stage] || [];
    if (tips.length <= 1) return;

    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [stage]);

  // Show time estimate after 3 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowTimeEstimate(true);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [stage]);

  const currentTip = TIPS[stage]?.[tipIndex] || currentStep;

  return (
    <div
      className="rounded-lg border bg-card p-4 shadow-sm"
      role="status"
      aria-live="polite"
      aria-busy={stage !== 'complete'}
    >
      {/* Header with spinner and stage label */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Loader2
            className={cn(
              'h-4 w-4 text-primary',
              stage === 'complete' ? 'hidden' : 'animate-spin'
            )}
            aria-hidden="true"
          />
          <p className="text-sm font-medium">
            {STAGES[activeIndex]?.label || 'Processing'}
          </p>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {percent.toFixed(0)}%
        </span>
      </div>

      {/* Progress bar */}
      <Progress value={percent} className="h-2" aria-label={`Progress: ${percent.toFixed(0)}%`} />

      {/* Stages grid with pulse animation on active stage */}
      <div className="mt-4 grid grid-cols-4 gap-2 text-xs font-medium">
        {STAGES.map((s, idx) => {
          const Icon = s.icon;
          const isActive = idx === activeIndex;
          const isDone = idx < activeIndex;
          return (
            <div
              key={s.key}
              className={cn(
                'flex items-center gap-1 rounded-md border px-2 py-1 transition-all',
                isDone && 'border-green-500/50 bg-green-500/5 text-green-700 dark:text-green-400',
                isActive && !isDone && 'border-primary/60 bg-primary/5 text-primary animate-pulse',
                !isActive && !isDone && 'border-muted bg-muted/60 text-muted-foreground'
              )}
              aria-current={isActive ? 'step' : undefined}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="truncate">{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Rotating tip */}
      {stage !== 'complete' && currentTip && (
        <div className="mt-4 p-3 rounded-md bg-muted/50 border border-muted">
          <p
            className="text-sm text-muted-foreground transition-opacity duration-300"
            key={tipIndex} // Force re-render for fade effect
          >
            {currentTip}
          </p>
        </div>
      )}

      {/* Time estimate (shows after 3s delay) */}
      {showTimeEstimate && stage !== 'complete' && (
        <p className="mt-3 text-xs text-muted-foreground text-center animate-in fade-in duration-500">
          ⏱️ This typically takes 30-60 seconds
        </p>
      )}

      {/* Screen reader announcement for stage changes */}
      <span className="sr-only" aria-live="assertive" aria-atomic="true">
        {stage !== 'complete' ? `${STAGES[activeIndex]?.label}. ${currentTip}` : 'Process complete'}
      </span>
    </div>
  );
}

export default AIProgress;
