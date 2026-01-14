'use client';

/**
 * Hook to detect if a media query matches.
 *
 * Uses window.matchMedia for efficient CSS media query matching.
 * Returns false during SSR to avoid hydration mismatches.
 *
 * @example
 * const isDesktop = useMediaQuery('(min-width: 768px)');
 * const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
 */

import { useSyncExternalStore } from 'react';

/**
 * Hook that returns true if the media query matches.
 *
 * @param query - CSS media query string (e.g., '(min-width: 768px)')
 * @returns boolean - true if matches, false otherwise (or during SSR)
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = (onStoreChange: () => void) => {
    if (typeof window === 'undefined') {
      return () => undefined;
    }
    const mediaQuery = window.matchMedia(query);
    const handler = () => onStoreChange();
    mediaQuery.addEventListener('change', handler);
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  };

  const getSnapshot = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  };

  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Convenience hook for common breakpoint: desktop (≥768px)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 768px)');
}

/**
 * Convenience hook for common breakpoint: mobile (<768px)
 */
export function useIsMobile(): boolean {
  // Note: Returns true on SSR to assume mobile-first
  const isDesktop = useMediaQuery('(min-width: 768px)');
  return !isDesktop;
}
