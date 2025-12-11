'use client';

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

export function AIProgress({ stage, currentStep }: AIProgressProps) {
  const activeIndex = STAGES.findIndex((s) => s.key === stage);
  const percent = ((activeIndex + 1) / STAGES.length) * 100;

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm" role="status" aria-live="polite">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Loader2 className={cn('h-4 w-4 text-primary', stage === 'complete' ? 'hidden' : 'animate-spin')} />
          <p className="text-sm font-medium">
            {STAGES[activeIndex]?.label || 'Processing'}
          </p>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{percent.toFixed(0)}%</span>
      </div>

      <Progress value={percent} className="h-2" />

      <div className="mt-4 grid grid-cols-4 gap-2 text-xs font-medium">
        {STAGES.map((s, idx) => {
          const Icon = s.icon;
          const isActive = idx === activeIndex;
          const isDone = idx < activeIndex;
          return (
            <div
              key={s.key}
              className={cn(
                'flex items-center gap-1 rounded-md border px-2 py-1',
                isDone && 'border-green-500/50 bg-green-500/5 text-green-700 dark:text-green-400',
                isActive && !isDone && 'border-primary/60 bg-primary/5 text-primary',
                !isActive && !isDone && 'border-muted bg-muted/60 text-muted-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="truncate">{s.label}</span>
            </div>
          );
        })}
      </div>

      {currentStep && (
        <p className="mt-3 text-xs text-muted-foreground">{currentStep}</p>
      )}
    </div>
  );
}

export default AIProgress;
