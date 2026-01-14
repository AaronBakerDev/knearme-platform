'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, BellOff, BellRing, Info, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Badge, Alert, AlertDescription } from '@/components/ui';
import {
  getExistingPushSubscription,
  isPushSupported,
  requestNotificationPermission,
  subscribeAndPersist,
  unsubscribeAndRemove,
} from '@/lib/notifications';
import { logger } from '@/lib/logging';

type PermissionState = 'default' | 'granted' | 'denied';

type StatusVariant = 'default' | 'secondary' | 'destructive' | 'outline';

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function PushNotificationSettings() {
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState<PermissionState>('default');
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ios = useMemo(() => isIOS(), []);

  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    const pushSupported = isPushSupported();
    setSupported(pushSupported);

    if (!pushSupported) {
      setPermission('default');
      setHasSubscription(false);
      setIsLoading(false);
      return;
    }

    const currentPermission = typeof Notification !== 'undefined'
      ? (Notification.permission as PermissionState)
      : 'default';

    setPermission(currentPermission);

    try {
      const subscription = await getExistingPushSubscription();
      setHasSubscription(!!subscription);
      setError(null);
    } catch (err) {
      logger.error('[Settings] Push subscription check failed', { error: err });
      setError('We could not verify notification status. Try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const handleEnable = useCallback(async () => {
    setIsWorking(true);
    setError(null);

    try {
      const result = await requestNotificationPermission();
      setPermission(result);

      if (result !== 'granted') {
        toast.error('Notification permission was not granted.');
        return;
      }

      await subscribeAndPersist();
      toast.success('Notifications enabled.');
    } catch (err) {
      logger.error('[Settings] Push enable failed', { error: err });
      toast.error('Failed to enable notifications.');
      setError('We could not enable notifications.');
    } finally {
      setIsWorking(false);
      await refreshStatus();
    }
  }, [refreshStatus]);

  const handleDisable = useCallback(async () => {
    setIsWorking(true);
    setError(null);

    try {
      await unsubscribeAndRemove();
      toast.success('Notifications disabled.');
    } catch (err) {
      logger.error('[Settings] Push disable failed', { error: err });
      toast.error('Failed to disable notifications.');
      setError('We could not disable notifications.');
    } finally {
      setIsWorking(false);
      await refreshStatus();
    }
  }, [refreshStatus]);

  const statusLabel = (() => {
    if (isLoading) return 'Checking';
    if (!supported) return 'Unavailable';
    if (permission === 'denied') return 'Blocked';
    if (hasSubscription) return 'Enabled';
    if (permission === 'granted') return 'Off';
    return 'Not enabled';
  })();

  const statusVariant: StatusVariant = (() => {
    if (isLoading) return 'outline';
    if (!supported) return 'secondary';
    if (permission === 'denied') return 'destructive';
    if (hasSubscription) return 'default';
    return 'outline';
  })();

  const canEnable = supported && permission !== 'denied' && !hasSubscription;
  const canDisable = supported && permission === 'granted' && hasSubscription;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Push notifications</p>
          <p className="text-sm text-muted-foreground">
            Get alerts when projects are published or need attention.
          </p>
        </div>
        <Badge variant={statusVariant}>
          {hasSubscription ? <BellRing /> : <BellOff />}
          {statusLabel}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {canEnable && (
          <Button onClick={handleEnable} disabled={isWorking}>
            <Bell className="h-4 w-4 mr-2" />
            {isWorking ? 'Enabling...' : 'Enable notifications'}
          </Button>
        )}
        {canDisable && (
          <Button variant="outline" onClick={handleDisable} disabled={isWorking}>
            <BellOff className="h-4 w-4 mr-2" />
            {isWorking ? 'Disabling...' : 'Disable notifications'}
          </Button>
        )}
      </div>

      {permission === 'denied' && (
        <Alert className="bg-amber-50 text-amber-900 border-amber-200">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Notifications are blocked in your browser settings. Enable them in site settings to receive updates.
          </AlertDescription>
        </Alert>
      )}

      {ios && supported && (
        <Alert className="bg-muted/40">
          <Smartphone className="h-4 w-4" />
          <AlertDescription>
            iOS Safari requires &quot;Allow Notifications&quot; in Settings and the app installed on your home screen.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
