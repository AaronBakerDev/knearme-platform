'use client';

/**
 * Voice Recording Error - Displays voice recording errors with retry options.
 *
 * Shows:
 * - Error message with icon
 * - User-friendly suggestion
 * - Retry button (if error is retryable)
 * - Dismiss button
 *
 * @see /src/types/voice.ts for error types
 */

import { AlertCircle, RefreshCw, X, Mic, Wifi, FileWarning, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VoiceRecordingError as VoiceError, VoiceRecordingErrorType } from '@/types/voice';

interface VoiceRecordingErrorProps {
  /** The error to display */
  error: VoiceError;
  /** Callback when user clicks retry */
  onRetry?: () => void;
  /** Callback when user dismisses error */
  onDismiss?: () => void;
  /** Compact mode for inline display */
  compact?: boolean;
  /** Optional className */
  className?: string;
}

/**
 * Render the appropriate icon for an error type.
 */
function renderErrorIcon(type: VoiceRecordingErrorType, className: string) {
  switch (type) {
    case 'PERMISSION_DENIED':
    case 'NO_AUDIO_DEVICE':
    case 'NOT_SUPPORTED':
      return <Mic className={className} />;
    case 'NETWORK_ERROR':
      return <Wifi className={className} />;
    case 'FILE_TOO_LARGE':
    case 'FILE_TOO_SHORT':
    case 'UNSUPPORTED_FORMAT':
      return <FileWarning className={className} />;
    case 'TRANSCRIPTION_FAILED':
      return <Clock className={className} />;
    default:
      return <AlertCircle className={className} />;
  }
}

/**
 * Voice recording error display component.
 */
export function VoiceRecordingError({
  error,
  onRetry,
  onDismiss,
  compact = false,
  className,
}: VoiceRecordingErrorProps) {
  if (compact) {
    const icon = renderErrorIcon(error.type, 'h-4 w-4 flex-shrink-0');
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2',
          className
        )}
      >
        {icon}
        <span className="flex-1 truncate">{error.message}</span>

        {error.retryable && onRetry && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRetry}
            className="h-6 w-6 flex-shrink-0"
            aria-label="Retry"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        )}

        {onDismiss && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="h-6 w-6 flex-shrink-0"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    );
  }

  const icon = renderErrorIcon(error.type, 'h-5 w-5 text-destructive');

  return (
    <div
      className={cn(
        'rounded-lg border border-destructive/20 bg-destructive/5 p-4',
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 rounded-full bg-destructive/10">
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-destructive">{error.message}</h4>

          {error.suggestion && (
            <p className="text-sm text-muted-foreground mt-1">{error.suggestion}</p>
          )}

          <div className="flex items-center gap-2 mt-3">
            {error.retryable && onRetry && (
              <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Try Again
              </Button>
            )}

            {onDismiss && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDismiss}
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
