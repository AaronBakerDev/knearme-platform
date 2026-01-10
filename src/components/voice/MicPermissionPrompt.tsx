'use client';

/**
 * Microphone Permission Prompt - UI for handling mic permission states.
 *
 * Shows appropriate UI based on permission status:
 * - prompt: "Enable microphone access" button
 * - granted: Nothing (or success indicator)
 * - denied: Error message with browser-specific instructions
 * - unavailable: Device not available message
 *
 * @see /src/types/voice.ts for permission types
 * @see /src/hooks/useVoiceRecording.ts for permission logic
 */

import { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MicPermissionStatus } from '@/types/voice';

interface MicPermissionPromptProps {
  /** Current permission status */
  status: MicPermissionStatus;
  /** Callback to request permission */
  onRequestPermission: () => void | Promise<void>;
  /** Callback when permission is granted */
  onPermissionGranted?: () => void;
  /** Whether currently requesting permission */
  isRequesting?: boolean;
  /** Compact mode for inline use */
  compact?: boolean;
  /** Optional className */
  className?: string;
}

/**
 * Detect the current browser for permission instructions.
 */
function detectBrowser(): 'chrome' | 'safari' | 'firefox' | 'edge' | 'other' {
  if (typeof navigator === 'undefined') return 'other';

  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes('edg/')) return 'edge';
  if (ua.includes('chrome/') && !ua.includes('edg/')) return 'chrome';
  if (ua.includes('safari/') && !ua.includes('chrome/')) return 'safari';
  if (ua.includes('firefox/')) return 'firefox';

  return 'other';
}

/**
 * Get browser-specific permission instructions.
 */
function getPermissionInstructions(browser: ReturnType<typeof detectBrowser>): {
  steps: string[];
  settingsUrl?: string;
} {
  switch (browser) {
    case 'chrome':
      return {
        steps: [
          'Click the lock/tune icon in the address bar',
          'Find "Microphone" in the permissions list',
          'Change it to "Allow"',
          'Refresh this page',
        ],
      };
    case 'safari':
      return {
        steps: [
          'Open Safari → Settings → Websites',
          'Select "Microphone" in the left sidebar',
          'Find this website and set it to "Allow"',
          'Refresh this page',
        ],
      };
    case 'firefox':
      return {
        steps: [
          'Click the shield/lock icon in the address bar',
          'Click "Permissions" or "Protection Dashboard"',
          'Enable microphone access',
          'Refresh this page',
        ],
      };
    case 'edge':
      return {
        steps: [
          'Click the lock icon in the address bar',
          'Click "Site permissions"',
          'Enable "Microphone"',
          'Refresh this page',
        ],
      };
    default:
      return {
        steps: [
          'Check your browser settings for microphone permissions',
          'Enable microphone access for this website',
          'Refresh this page',
        ],
      };
  }
}

/**
 * Microphone permission prompt component.
 */
export function MicPermissionPrompt({
  status,
  onRequestPermission,
  onPermissionGranted,
  isRequesting = false,
  compact = false,
  className,
}: MicPermissionPromptProps) {
  const [browser] = useState(() => detectBrowser());
  const [showInstructions, setShowInstructions] = useState(false);

  // Notify when permission is granted
  useEffect(() => {
    if (status === 'granted' && onPermissionGranted) {
      onPermissionGranted();
    }
  }, [status, onPermissionGranted]);

  /**
   * Handle request permission click.
   */
  const handleRequest = useCallback(async () => {
    try {
      await onRequestPermission();
    } catch {
      // Error is handled in parent
    }
  }, [onRequestPermission]);

  // Permission already granted - show nothing or compact success
  if (status === 'granted') {
    if (compact) {
      return (
        <div className={cn('flex items-center gap-1.5 text-sm text-green-600', className)}>
          <CheckCircle className="h-4 w-4" />
          <span>Microphone enabled</span>
        </div>
      );
    }
    return null;
  }

  // Permission denied - show error with instructions
  if (status === 'denied') {
    const instructions = getPermissionInstructions(browser);

    return (
      <div
        className={cn(
          'rounded-lg border border-destructive/20 bg-destructive/5 p-4',
          compact && 'p-3',
          className
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 rounded-full bg-destructive/10">
            <MicOff className="h-5 w-5 text-destructive" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-destructive">Microphone Access Blocked</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Voice recording requires microphone access. Please enable it in your browser
              settings.
            </p>

            {/* Show/hide instructions toggle */}
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => setShowInstructions(!showInstructions)}
              className="px-0 h-auto mt-2 text-primary"
            >
              <Settings className="h-3.5 w-3.5 mr-1" />
              {showInstructions ? 'Hide instructions' : 'How to enable'}
            </Button>

            {/* Browser-specific instructions */}
            {showInstructions && (
              <ol className="mt-3 space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
                {instructions.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            )}

            {/* Retry button */}
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRequest}
                disabled={isRequesting}
              >
                {isRequesting ? 'Requesting...' : 'Try Again'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Device unavailable
  if (status === 'unavailable') {
    return (
      <div
        className={cn(
          'rounded-lg border border-amber-200 bg-amber-50 p-4',
          compact && 'p-3',
          className
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 rounded-full bg-amber-100">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-amber-800">No Microphone Found</h4>
            <p className="text-sm text-amber-700 mt-1">
              Please connect a microphone to use voice recording, or use text input instead.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Default: prompt state - show request button
  if (compact) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleRequest}
        disabled={isRequesting}
        className={className}
      >
        <Mic className="h-4 w-4 mr-1.5" />
        {isRequesting ? 'Enabling...' : 'Enable Microphone'}
      </Button>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-primary/20 bg-primary/5 p-4 text-center',
        className
      )}
    >
      <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-3">
        <Mic className="h-6 w-6 text-primary" />
      </div>

      <h4 className="font-medium">Enable Voice Recording</h4>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
        We&apos;ll need microphone access to record your answers. Your recordings are only used for
        transcription.
      </p>

      <Button
        type="button"
        onClick={handleRequest}
        disabled={isRequesting}
        className="mt-4"
      >
        <Mic className="h-4 w-4 mr-2" />
        {isRequesting ? 'Requesting Access...' : 'Allow Microphone Access'}
      </Button>
    </div>
  );
}
