/**
 * Offline Fallback Page.
 *
 * Displayed when the user is offline and the requested page isn't cached.
 * The service worker serves this page from the precache when network fails.
 *
 * Features:
 * - Clear offline indicator
 * - Automatic online detection and reload
 * - Guidance on what to do while offline
 *
 * @see next.config.ts - PWA fallbacks configuration
 * @see https://web.dev/articles/offline-fallback-page
 */

'use client';

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Home, Clock, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(
    () => (typeof navigator !== 'undefined' ? navigator.onLine : false)
  );
  const [isReloading, setIsReloading] = useState(false);

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-reload when back online after a brief delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setIsReloading(true);
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center w-20 h-20 rounded-full bg-muted">
            {isOnline ? (
              <RefreshCw className="h-10 w-10 text-green-500 animate-spin" />
            ) : (
              <WifiOff className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isOnline ? 'Back Online!' : "You're Offline"}
          </CardTitle>
          <CardDescription className="text-base">
            {isOnline
              ? 'Reconnecting you now...'
              : "It looks like you've lost your internet connection. Some features may be unavailable."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Connection Status */}
          <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-muted">
            <CloudOff className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {isOnline ? 'Connection restored' : 'No internet connection'}
            </span>
          </div>

          {/* Actions */}
          {!isOnline && (
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleRetry}
                disabled={isReloading}
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isReloading ? 'animate-spin' : ''}`} />
                {isReloading ? 'Checking connection...' : 'Try Again'}
              </Button>
              <Button variant="outline" onClick={handleGoHome} className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </div>
          )}

          {/* Offline Tips */}
          {!isOnline && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3 text-muted-foreground">
                While you&apos;re offline:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Previously viewed pages may still be available from cache
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <RefreshCw className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    The app will automatically reconnect when you&apos;re back online
                  </span>
                </li>
              </ul>
            </div>
          )}

          <p className="text-xs text-center text-muted-foreground">
            KnearMe works best with an internet connection
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
