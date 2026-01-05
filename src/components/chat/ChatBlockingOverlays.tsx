'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatPhase } from '@/lib/chat/chat-types';

interface ChatBlockingOverlaysProps {
  phase: ChatPhase;
  isSavingContent: boolean;
  isRegenerating: boolean;
  regeneratingSection: 'title' | 'description' | 'seo' | null;
}

function BlockingOverlay({
  message,
  className,
}: {
  message: string;
  className: string;
}) {
  return (
    <div className={cn('absolute inset-0 flex items-center justify-center backdrop-blur-sm z-10', className)}>
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    </div>
  );
}

export function ChatBlockingOverlays({
  phase,
  isSavingContent,
  isRegenerating,
  regeneratingSection,
}: ChatBlockingOverlaysProps) {
  return (
    <>
      {(phase === 'analyzing' || phase === 'generating') && (
        <BlockingOverlay
          message={phase === 'analyzing' ? 'Analyzing your photos...' : 'Writing your description...'}
          className="bg-background/80"
        />
      )}

      {isSavingContent && (
        <BlockingOverlay
          message="Saving your edits..."
          className="bg-background/70"
        />
      )}

      {isRegenerating && (
        <BlockingOverlay
          message={regeneratingSection
            ? `Regenerating ${regeneratingSection}...`
            : 'Regenerating content...'}
          className="bg-background/70"
        />
      )}
    </>
  );
}
