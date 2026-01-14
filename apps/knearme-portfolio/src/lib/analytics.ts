import type { NextRequest } from 'next/server';
import { logger } from '@/lib/logging';

const GA_ENDPOINT = 'https://www.google-analytics.com/mp/collect';

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
export const GA_MEASUREMENT_PROTOCOL_SECRET =
  process.env.GA_MEASUREMENT_PROTOCOL_SECRET;

export type AnalyticsEventParams = Record<
  string,
  string | number | boolean | null | undefined
>;

type MeasurementEventOptions = {
  clientId?: string;
  userId?: string;
  params?: AnalyticsEventParams;
  timestampMicros?: number;
};

const SERVER_CLIENT_ID_PREFIX = 'GA1.1';

const nowMicros = () => Date.now() * 1000;

const generateFallbackClientId = () => {
  const randomSegment = Math.floor(Math.random() * 10_000_000_000);
  return `${SERVER_CLIENT_ID_PREFIX}.${Date.now()}.${randomSegment}`;
};

export const parseClientIdFromCookie = (cookieValue?: string) => {
  if (!cookieValue) return undefined;
  const segments = cookieValue.split('.');
  if (segments.length >= 4) {
    return `${segments[2]}.${segments[3]}`;
  }
  return undefined;
};

export const getClientIdFromRequest = (request: NextRequest) => {
  const gaCookie = request.cookies.get('_ga')?.value;
  return parseClientIdFromCookie(gaCookie);
};

export const sendMeasurementEvent = async (
  eventName: string,
  options: MeasurementEventOptions = {},
) => {
  if (!GA_MEASUREMENT_ID || !GA_MEASUREMENT_PROTOCOL_SECRET) {
    logger.warn('[analytics] Missing GA4 env vars, skipping server event', {
      eventName,
    });
    return { success: false, error: 'GA4 env vars not configured' };
  }

  const clientId = options.clientId || generateFallbackClientId();

  const payload = {
    client_id: clientId,
    user_id: options.userId,
    timestamp_micros: options.timestampMicros ?? nowMicros(),
    events: [
      {
        name: eventName,
        params: {
          engagement_time_msec: 1,
          ...options.params,
        },
      },
    ],
  };

  const url = `${GA_ENDPOINT}?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_MEASUREMENT_PROTOCOL_SECRET}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('[analytics] Measurement Protocol error', { error: errorText });
    return { success: false, error: errorText };
  }

  return { success: true };
};

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const trackClientEvent = (
  eventName: string,
  params: AnalyticsEventParams = {},
) => {
  if (typeof window === 'undefined') return;
  if (!GA_MEASUREMENT_ID) {
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('[analytics] GA measurement ID missing, event not sent', {
        eventName,
      });
    }
    return;
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...params,
  });
};
