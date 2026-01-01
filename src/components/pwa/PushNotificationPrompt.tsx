/**
 * Push Notification Permission Prompt.
 *
 * Shows a dismissible banner that requests notification permission
 * and registers a push subscription (Phase 2 prep).
 *
 * Behavior:
 * - Only renders if Push + Notifications are supported
 * - Requires an eligibility signal (e.g., user created a project)
 * - Persists dismissals in localStorage to avoid nagging
 * - Handles iOS Safari caveats with helper text
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, BellRing, X, Smartphone, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  isPushSupported,
  requestNotificationPermission,
  subscribeAndPersist,
} from '@/lib/notifications';

const DISMISS_KEY = 'knearme-push-dismissed';
const DISMISS_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function getDismissedAt(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (!dismissed) return null;
    const dismissedAt = parseInt(dismissed, 10);
    return Number.isNaN(dismissedAt) ? null : dismissedAt;
  } catch {
    return null;
  }
}

function setDismissedAt(timestamp: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DISMISS_KEY, timestamp.toString());
  } catch {
    // Ignore storage failures (e.g., private mode or blocked storage).
  }
}

function isDismissedWithin(timestamp: number | null): boolean {
  if (!timestamp) return false;
  return Date.now() - timestamp < DISMISS_DURATION_MS;
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

type PermissionState = 'default' | 'granted' | 'denied';

interface PushNotificationPromptProps {
  /**
   * Eligibility signal to avoid prompting brand new users.
   * Example: user has created at least one project.
   */
  eligible?: boolean;
}

export function PushNotificationPrompt({ eligible = true }: PushNotificationPromptProps) {
  const [permission, setPermission] = useState<PermissionState>('default');
  const [isVisible, setIsVisible] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const ios = useMemo(() => isIOS(), []);

  useEffect(() => {
    if (!eligible) return;
    if (!isPushSupported()) return;
    const currentPermission = typeof Notification !== 'undefined' ? Notification.permission : 'default';
    setPermission(currentPermission);

    if (currentPermission === 'granted' || currentPermission === 'denied') {
      return;
    }

    if (isDismissedWithin(getDismissedAt())) {
      return;
    }

    // Slight delay to avoid appearing immediately on page load
    const timer = setTimeout(() => setIsVisible(true), 4000);
    return () => clearTimeout(timer);
  }, [eligible]);

  const recordDismissal = useCallback((timestamp: number = Date.now()) => {
    setIsVisible(false);
    setDismissedAt(timestamp);
  }, []);

  const handleDismiss = useCallback(() => {
    recordDismissal();
  }, [recordDismissal]);

  const handleEnable = useCallback(async () => {
    setIsWorking(true);
    try {
      const result = await requestNotificationPermission();
      setPermission(result);

      if (result !== 'granted') {
        recordDismissal();
        return;
      }

      await subscribeAndPersist();
      setIsVisible(false);
    } catch (error) {
      console.error('[Push] Subscription failed', error);
    } finally {
      setIsWorking(false);
    }
  }, [recordDismissal]);

  if (!eligible || !isPushSupported()) return null;
  if (permission === 'granted') return null;
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-lg mx-auto bg-background border rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Stay in the loop</h3>
              <p className="text-xs text-muted-foreground">
                Enable notifications for project updates.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-8 w-8"
            aria-label="Dismiss notification prompt"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-3">
          {permission === 'denied' ? (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 text-amber-500" />
              <div>
                Notifications are blocked in your browser settings. Enable them in site settings to receive updates.
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                We&apos;ll only send important updates like publish confirmations and new engagement alerts.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleEnable} disabled={isWorking} className="flex-1 min-w-[140px]">
                  <BellRing className="h-4 w-4 mr-2" />
                  {isWorking ? 'Enabling...' : 'Enable notifications'}
                </Button>
                <Button variant="outline" onClick={handleDismiss}>
                  Not now
                </Button>
              </div>
              {ios && (
                <div className="flex items-start gap-2 rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
                  <Smartphone className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    iOS Safari: ensure you have “Allow Notifications” enabled in Settings → Safari → Notifications, then tap “Add to Home Screen”.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
