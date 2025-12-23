'use client';

import { useEffect, useMemo, useRef } from 'react';
import {
  AnalyticsEventParams,
  trackClientEvent,
} from '@/lib/analytics';

type AnalyticsEventOnMountProps = {
  eventName: string;
  params?: AnalyticsEventParams;
  onceKey?: string | number | null;
};

export function AnalyticsEventOnMount({
  eventName,
  params,
  onceKey,
}: AnalyticsEventOnMountProps) {
  const serializedParams = useMemo(
    () => JSON.stringify(params ?? {}),
    [params],
  );
  const lastKey = useRef<string | undefined>(undefined);

  useEffect(() => {
    const key = `${eventName}:${onceKey ?? 'static'}:${serializedParams}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    trackClientEvent(eventName, params);
  }, [eventName, onceKey, serializedParams, params]);

  return null;
}

