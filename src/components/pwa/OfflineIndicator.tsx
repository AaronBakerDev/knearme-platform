/**
 * Offline Status Indicator Component.
 *
 * Shows a subtle banner when offline or when drafts are pending sync.
 * Provides sync status and manual sync trigger.
 *
 * Features:
 * - Shows offline status with icon
 * - Displays pending draft count
 * - Manual sync button
 * - Auto-hides when online with no pending items
 *
 * @example
 * ```tsx
 * // Add to layout
 * <OfflineIndicator />
 * ```
 */

'use client';

import { WifiOff, CloudOff, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOfflineSync } from '@/lib/offline';
import { toast } from 'sonner';
import { useCallback } from 'react';

export function OfflineIndicator() {
  const { isOnline, queueCount, isSyncing, syncNow } = useOfflineSync({
    onSyncComplete: (count) => {
      toast.success(`Synced ${count} draft${count !== 1 ? 's' : ''}`, {
        icon: <Check className="h-4 w-4" />,
      });
    },
    onSyncError: (error) => {
      toast.error('Sync failed', {
        description: error.message,
      });
    },
  });

  const handleSync = useCallback(async () => {
    if (!isOnline) {
      toast.error("Can't sync while offline");
      return;
    }
    await syncNow();
  }, [isOnline, syncNow]);

  // Don't show if online and no pending items
  if (isOnline && queueCount === 0) {
    return null;
  }

  return (
    <div className="fixed top-14 left-0 right-0 z-40 animate-in slide-in-from-top duration-300">
      <div className="bg-muted/95 backdrop-blur border-b px-4 py-2">
        <div className="container mx-auto flex items-center justify-between gap-4">
          {/* Status */}
          <div className="flex items-center gap-2 text-sm">
            {!isOnline ? (
              <>
                <WifiOff className="h-4 w-4 text-destructive" />
                <span className="text-muted-foreground">
                  You&apos;re offline
                </span>
              </>
            ) : (
              <>
                <CloudOff className="h-4 w-4 text-amber-500" />
                <span className="text-muted-foreground">
                  {queueCount} draft{queueCount !== 1 ? 's' : ''} pending sync
                </span>
              </>
            )}
          </div>

          {/* Sync button */}
          {queueCount > 0 && isOnline && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
              className="h-7 text-xs"
            >
              <RefreshCw
                className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`}
              />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
