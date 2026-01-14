'use client';

/**
 * Voice mode toggle for chat input.
 * Shows "Talk" / "Type" (and optional Voice -> Voice when enabled).
 */

import { Mic, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VoiceInteractionMode } from '@/types/voice';

interface VoiceModeToggleProps {
  mode: VoiceInteractionMode;
  onModeChange: (mode: VoiceInteractionMode) => void;
  disabledModes?: VoiceInteractionMode[];
  showVoiceVoice?: boolean;
  className?: string;
}

const MODE_OPTIONS: Array<{
  mode: VoiceInteractionMode;
  label: string;
  icon: typeof Mic;
}> = [
  { mode: 'voice_chat', label: 'Talk', icon: Mic },
  { mode: 'text', label: 'Type', icon: Keyboard },
];

export function VoiceModeToggle({
  mode,
  onModeChange,
  disabledModes = [],
  showVoiceVoice: _showVoiceVoice = false,
  className,
}: VoiceModeToggleProps) {
  // showVoiceVoice is deprecated - voice_chat is now the only voice mode
  const options = MODE_OPTIONS;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border/40 bg-muted/60 p-1',
        className
      )}
      role="tablist"
      aria-label="Input mode"
    >
      {options.map((option) => {
        const isActive = mode === option.mode;
        const isDisabled = disabledModes.includes(option.mode);
        const Icon = option.icon;

        return (
          <Button
            key={option.mode}
            type="button"
            size="sm"
            variant={isActive ? 'secondary' : 'ghost'}
            onClick={() => onModeChange(option.mode)}
            disabled={isDisabled}
            aria-pressed={isActive}
            className={cn(
              'h-8 rounded-full px-3 text-xs font-medium',
              !isActive && 'text-muted-foreground'
            )}
          >
            <Icon className="mr-1 h-3.5 w-3.5" />
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
