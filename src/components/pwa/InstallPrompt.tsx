/**
 * PWA Install Prompt Component.
 *
 * Shows a custom "Add to Home Screen" banner when the app is installable.
 * Captures the `beforeinstallprompt` event and displays a user-friendly
 * prompt with dismiss and install options.
 *
 * Features:
 * - Detects installability via `beforeinstallprompt` event
 * - Custom styled banner (not browser default)
 * - "Don't show again" option persisted to localStorage
 * - Tracks install conversions (logs to console, can be extended)
 * - iOS detection with manual installation instructions
 *
 * @see https://web.dev/articles/customize-install
 * @see https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Download, Smartphone, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * BeforeInstallPromptEvent is not in standard TypeScript lib.
 * This interface matches the Chrome/Edge implementation.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// localStorage key for dismissal
const DISMISS_KEY = 'knearme-install-prompt-dismissed';
// Don't show again for 30 days after dismissal
const DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Checks if we're on iOS (Safari doesn't support beforeinstallprompt).
 */
function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/**
 * Checks if the app is already installed (standalone mode).
 */
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

/**
 * Checks if user previously dismissed the prompt.
 */
function isDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  const dismissed = localStorage.getItem(DISMISS_KEY);
  if (!dismissed) return false;

  const dismissedAt = parseInt(dismissed, 10);
  if (isNaN(dismissedAt)) return false;

  // Check if dismissal has expired
  return Date.now() - dismissedAt < DISMISS_DURATION_MS;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Don't show if already installed or dismissed
    if (isStandalone() || isDismissed()) {
      return;
    }

    // iOS doesn't support beforeinstallprompt - show instructions instead
    if (isIOS()) {
      // Delay showing iOS instructions to not be intrusive
      const timer = setTimeout(() => {
        setShowIOSInstructions(true);
        setShowBanner(true);
      }, 5000);
      return () => clearTimeout(timer);
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome's mini-infobar
      e.preventDefault();
      // Store the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show our custom banner after a short delay
      setTimeout(() => setShowBanner(true), 3000);
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      setShowBanner(false);
      setDeferredPrompt(null);
      // Could track analytics here
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for user response
      const { outcome } = await deferredPrompt.userChoice;

      console.log(`[PWA] Install prompt outcome: ${outcome}`);

      if (outcome === 'accepted') {
        // User accepted - banner will hide via appinstalled event
      } else {
        // User dismissed the prompt
        setShowBanner(false);
      }
    } catch (error) {
      console.error('[PWA] Install prompt error:', error);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    // Store dismissal timestamp
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }, []);

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-md mx-auto bg-background border rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Install KnearMe</h3>
              <p className="text-xs text-muted-foreground">
                Add to your home screen
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-8 w-8"
            aria-label="Dismiss install prompt"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">
          {showIOSInstructions ? (
            // iOS Instructions
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                To install on your iPhone or iPad:
              </p>
              <ol className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-xs font-medium">
                    1
                  </span>
                  <span>Tap the</span>
                  <Share className="h-4 w-4 text-blue-500" />
                  <span>Share button</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-xs font-medium">
                    2
                  </span>
                  <span>Select &quot;Add to Home Screen&quot;</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-xs font-medium">
                    3
                  </span>
                  <span>Tap &quot;Add&quot;</span>
                </li>
              </ol>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismiss}
                className="w-full mt-2"
              >
                Got it
              </Button>
            </div>
          ) : (
            // Standard install button (Chrome, Edge, etc.)
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Install the app for quick access and offline support.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isInstalling ? 'Installing...' : 'Install App'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDismiss}
                >
                  Not now
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
