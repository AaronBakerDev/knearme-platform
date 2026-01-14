'use client';

import { useEffect, useMemo, useRef } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  GA_MEASUREMENT_ID,
  AnalyticsEventParams,
  trackClientEvent,
} from '@/lib/analytics';

type AnalyticsProviderProps = {
  children: React.ReactNode;
};

const buildPageViewParams = (path: string): AnalyticsEventParams => ({
  page_path: path,
  page_location:
    typeof window !== 'undefined' ? window.location.href : undefined,
  page_title: typeof document !== 'undefined' ? document.title : undefined,
});

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPageViewKey = useRef<string | undefined>(undefined);

  const pagePath = useMemo(() => {
    if (!pathname) return '/';
    const query = searchParams?.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;
    const key = `${GA_MEASUREMENT_ID}:${pagePath}`;
    if (lastPageViewKey.current === key) return;
    lastPageViewKey.current = key;
    trackClientEvent('page_view', buildPageViewParams(pagePath));
  }, [pagePath]);

  return (
    <>
      {GA_MEASUREMENT_ID && (
        <>
          <Script
            id="ga4-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
            `}
          </Script>
        </>
      )}
      {children}
    </>
  );
}

