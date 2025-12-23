'use client';

import type { MouseEvent } from 'react';
import { forwardRef } from 'react';
import Link from 'next/link';
import type { ComponentProps } from 'react';
import { AnalyticsEventParams, trackClientEvent } from '@/lib/analytics';

type NextLinkProps = ComponentProps<typeof Link>;

type TrackedLinkProps = NextLinkProps & {
  eventName?: string;
  eventParams?: AnalyticsEventParams;
};

export const TrackedLink = forwardRef<HTMLAnchorElement, TrackedLinkProps>(
  ({ eventName, eventParams, onClick, ...props }, ref) => {
    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      if (eventName) {
        trackClientEvent(eventName, eventParams);
      }
      onClick?.(event);
    };

    return <Link {...props} onClick={handleClick} ref={ref} />;
  },
);

TrackedLink.displayName = 'TrackedLink';

