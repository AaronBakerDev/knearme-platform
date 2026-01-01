'use client';

/**
 * Voice Chat toggle button for integration inside ChatInput.
 *
 * Redesigned from a 3-option dropdown to a simple binary toggle:
 * - In text mode: Shows 🎧 headphones to enter Voice Chat
 * - In voice_chat mode: Not rendered (VoiceLiveControls shows instead)
 *
 * Design rationale: Type and Voice-to-Text modes were merged because
 * users can always tap the mic button for voice-to-text transcription.
 * This eliminates the "two microphone icons" confusion.
 *
 * @see /docs/09-agent/voice-modes-implementation.md for design context
 */

import { Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VoiceInteractionMode } from '@/types/voice';

interface VoiceChatButtonProps {
  /** Current voice mode */
  mode: VoiceInteractionMode;
  /** Callback when mode changes */
  onModeChange: (mode: VoiceInteractionMode) => void;
  /** Whether Voice Chat is available (mic permission, network quality) */
  disabled?: boolean;
  /** Optional tooltip text */
  title?: string;
  className?: string;
}

/**
 * Simple toggle button to enter Voice Chat mode.
 *
 * Shows headphones icon (🎧) - distinct from the mic icon (🎤) used
 * for voice-to-text recording, eliminating UI confusion.
 */
export function VoiceChatButton({
  mode,
  onModeChange,
  disabled = false,
  title = 'Voice Chat',
  className,
}: VoiceChatButtonProps) {
  const isVoiceChat = mode === 'voice_chat';

  // Don't render in voice_chat mode - VoiceLiveControls handles that UI
  if (isVoiceChat) {
    return null;
  }

  const handleClick = () => {
    if (!disabled) {
      onModeChange('voice_chat');
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={disabled}
      title={title}
      className={cn(
        'h-9 w-9 rounded-full',
        'text-muted-foreground hover:text-foreground hover:bg-muted/80',
        'transition-colors duration-150',
        // Subtle glow when available (not disabled)
        !disabled && 'hover:shadow-sm hover:shadow-primary/20',
        className
      )}
      aria-label="Start Voice Chat"
    >
      <Headphones className="h-4 w-4" />
    </Button>
  );
}

// Re-export with old name for backwards compatibility during migration
// TODO: Remove after all consumers are updated
export { VoiceChatButton as VoiceModeButton };
