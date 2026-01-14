'use client';

/**
 * Voice -> Voice controls with push-to-talk or continuous mode.
 *
 * Redesigned for better UX:
 * - Integrates with the pill input style
 * - Clear separation of user speech vs AI response
 * - Proper transcript accumulation (not just last word)
 * - Mode toggle integrated inside
 */

import React from 'react';
import { Mic, MicOff, Loader2, Volume2, X, RefreshCw, MessageSquareText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { VoiceActivityIndicator } from './VoiceActivityIndicator';

type VoiceLiveStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

/**
 * Talk mode for voice controls:
 * - 'hold': Push-to-talk (hold button while speaking)
 * - 'tap': Toggle-to-talk (tap to start, tap to stop)
 * - 'continuous': Hands-free mode with automatic voice activity detection
 */
type VoiceTalkMode = 'hold' | 'tap' | 'continuous';

const TALK_MODE_STORAGE_KEY = 'knearme.voiceTalkMode';

function isTalkMode(value: string): value is VoiceTalkMode {
  return value === 'hold' || value === 'tap' || value === 'continuous';
}

interface VoiceLiveControlsProps {
  status: VoiceLiveStatus;
  isConnected: boolean;
  /** Whether currently in continuous/hands-free mode (from session) */
  isContinuousMode?: boolean;
  /** Current audio input level (0-1 normalized) for VAD indicator */
  audioLevel?: number;
  liveUserTranscript?: string;
  liveAssistantTranscript?: string;
  error?: string | null;
  onPressStart: () => void | Promise<void>;
  onPressEnd: () => void;
  onDisconnect?: () => void;
  /**
   * Called when talk mode changes. Parent should use this to reconnect
   * with the new mode (continuous requires different session config).
   */
  onTalkModeChange?: (mode: VoiceTalkMode) => void;
  className?: string;
  /** Called to exit voice chat and return to text mode */
  onReturnToText?: () => void;
}

export type { VoiceTalkMode };

export function VoiceLiveControls({
  status,
  isConnected,
  isContinuousMode = false,
  audioLevel = 0,
  liveUserTranscript,
  liveAssistantTranscript,
  error,
  onPressStart,
  onPressEnd,
  onDisconnect,
  onTalkModeChange,
  className,
  onReturnToText,
}: VoiceLiveControlsProps) {
  const isListening = status === 'listening';
  const isSpeaking = status === 'speaking';
  const isConnecting = status === 'connecting';
  const [talkMode, setTalkMode] = React.useState<VoiceTalkMode>('tap');
  const isContinuous = talkMode === 'continuous';

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(TALK_MODE_STORAGE_KEY);
    if (stored && isTalkMode(stored)) {
      setTalkMode(stored);
    }
  }, []);

  const updateTalkMode = React.useCallback((next: VoiceTalkMode) => {
    setTalkMode(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TALK_MODE_STORAGE_KEY, next);
    }
    // Notify parent so it can reconnect with appropriate session config
    onTalkModeChange?.(next);
  }, [onTalkModeChange]);

  // Status indicator text
  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    if (isContinuous && isContinuousMode) return 'Listening continuously...';
    if (isListening) return 'Listening...';
    if (isSpeaking) return 'Speaking...';
    if (error) return 'Error';
    if (isContinuous) return 'Tap Auto to start';
    if (talkMode === 'tap') return 'Tap to talk';
    return 'Hold to talk';
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Live transcripts - show ABOVE input as speech bubbles (only in Hold/Tap mode)
          In continuous/auto mode, transcripts go directly to chat as messages */}
      {!isContinuous && (liveUserTranscript || liveAssistantTranscript) && (
        <div className="space-y-2 px-1 max-h-[200px] overflow-y-auto">
          {/* User's current speech */}
          {liveUserTranscript && (
            <div className="flex justify-end">
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5',
                  'bg-primary text-primary-foreground',
                  'text-sm leading-relaxed',
                  isListening && 'animate-pulse'
                )}
              >
                {liveUserTranscript}
              </div>
            </div>
          )}

          {/* AI's current response */}
          {liveAssistantTranscript && (
            <div className="flex justify-start">
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl rounded-bl-md px-4 py-2.5',
                  'bg-muted text-foreground',
                  'text-sm leading-relaxed',
                  isSpeaking && 'animate-pulse'
                )}
              >
                {liveAssistantTranscript}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main control pill - matching ChatInput style */}
      <div
        className={cn(
          'flex items-center gap-2 bg-muted/60 backdrop-blur-sm border rounded-full px-2 py-1.5 shadow-chat-input',
          isContinuousMode && 'border-green-500/50 bg-green-500/5',
          isListening && !isContinuousMode && 'border-primary/50 bg-primary/5',
          isSpeaking && 'border-blue-500/50 bg-blue-500/5',
          error && 'border-destructive/50',
          !isListening && !isSpeaking && !isContinuousMode && !error && 'border-border/40'
        )}
      >
        {/* Return to text mode button - 💬 speech bubble */}
        {onReturnToText && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onReturnToText}
            className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80"
            title="Return to text chat"
            aria-label="Switch to text mode"
          >
            <MessageSquareText className="h-4 w-4" />
          </Button>
        )}

        {/* Status text - flexible middle area */}
        <div className="flex-1 flex items-center gap-2 px-2 min-w-0">
          {isConnecting && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {/* Only show speaker icon when AI is speaking - mic is redundant with main button */}
          {isSpeaking && <Volume2 className="h-4 w-4 text-blue-500 animate-pulse" />}

          {/* Voice activity indicator - shows audio levels in continuous mode */}
          {isContinuous && isContinuousMode && !isConnecting && (
            <VoiceActivityIndicator
              audioLevel={audioLevel}
              isListening={isListening}
              isSpeaking={isSpeaking}
              isContinuousMode={isContinuousMode}
            />
          )}

          <span
            className={cn(
              'text-sm truncate',
              isContinuousMode && 'text-green-600 font-medium',
              isListening && !isContinuousMode && 'text-primary font-medium',
              isSpeaking && 'text-blue-600 font-medium',
              !isListening && !isSpeaking && !isContinuousMode && 'text-muted-foreground'
            )}
          >
            {getStatusText()}
          </span>
        </div>

        {/* Talk mode selector with integrated mic control
            - First click selects the mode
            - Subsequent interactions activate mic based on mode:
              - Hold: press and hold to talk
              - Tap: tap to toggle
              - Auto: auto-starts, tap to stop
        */}
        <div className="flex items-center gap-1 rounded-full bg-background/80 p-1">
          {/* Hold mode button - press and hold when active */}
          <button
            type="button"
            onClick={() => {
              if (talkMode !== 'hold') {
                updateTalkMode('hold');
              }
            }}
            onPointerDown={(e) => {
              if (talkMode === 'hold' && !isConnecting) {
                e.preventDefault();
                onPressStart();
              }
            }}
            onPointerUp={(e) => {
              if (talkMode === 'hold') {
                e.preventDefault();
                onPressEnd();
              }
            }}
            onPointerLeave={(e) => {
              if (talkMode === 'hold' && isListening) {
                e.preventDefault();
                onPressEnd();
              }
            }}
            disabled={isConnecting}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-full transition-all text-xs font-medium',
              talkMode === 'hold'
                ? isListening
                  ? 'bg-destructive text-destructive-foreground animate-pulse'
                  : 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
            aria-pressed={talkMode === 'hold'}
            aria-label={talkMode === 'hold' ? (isListening ? 'Release to stop' : 'Hold to talk') : 'Switch to hold mode'}
          >
            {talkMode === 'hold' && (isConnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mic className="h-3.5 w-3.5" />)}
            Hold
          </button>

          {/* Tap mode button - tap to toggle when active */}
          <button
            type="button"
            onClick={() => {
              if (talkMode !== 'tap') {
                updateTalkMode('tap');
              } else if (!isConnecting) {
                // Already in tap mode - toggle listening
                if (isListening) {
                  onPressEnd();
                } else {
                  onPressStart();
                }
              }
            }}
            disabled={isConnecting}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-full transition-all text-xs font-medium',
              talkMode === 'tap'
                ? isListening
                  ? 'bg-destructive text-destructive-foreground animate-pulse'
                  : 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
            aria-pressed={talkMode === 'tap'}
            aria-label={talkMode === 'tap' ? (isListening ? 'Tap to stop' : 'Tap to talk') : 'Switch to tap mode'}
          >
            {talkMode === 'tap' && (isConnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />)}
            Tap
          </button>

          {/* Auto/Continuous mode button - tap to toggle session
              Switching to Auto mode triggers auto-start via ChatWizard callback */}
          <button
            type="button"
            onClick={() => {
              if (talkMode !== 'continuous') {
                // Switching to continuous mode - ChatWizard will auto-start
                updateTalkMode('continuous');
              } else if (!isConnecting) {
                // Already in continuous mode - toggle session
                if (isListening || isContinuousMode) {
                  onPressEnd();
                } else {
                  onPressStart();
                }
              }
            }}
            disabled={isConnecting}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-full transition-all text-xs font-medium',
              talkMode === 'continuous'
                ? isContinuousMode || isListening
                  ? 'bg-green-600 text-white ring-2 ring-green-400/50'
                  : 'bg-green-600 text-white'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
            aria-pressed={talkMode === 'continuous'}
            title="Hands-free mode with automatic voice detection"
            aria-label={talkMode === 'continuous' ? (isContinuousMode ? 'Tap to stop auto mode' : 'Tap to start auto mode') : 'Switch to auto mode'}
          >
            {talkMode === 'continuous' && (isConnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isContinuousMode ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />)}
            Auto
          </button>
        </div>

        {/* End session button - compact to match mode buttons */}
        {onDisconnect && isConnected && (
          <button
            type="button"
            onClick={onDisconnect}
            className="flex items-center justify-center h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="End voice session"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Error display with retry options */}
      {error && (
        <div className="mx-1 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive mb-3">{error}</p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPressStart()}
              className="border-destructive/30 hover:border-destructive/50 hover:bg-destructive/5"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Try Again
            </Button>
            {onReturnToText && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onReturnToText}
                className="text-muted-foreground hover:text-foreground"
              >
                <MessageSquareText className="h-3.5 w-3.5 mr-1.5" />
                Switch to Text
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
