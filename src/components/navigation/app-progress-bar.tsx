'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { NProgress, type NProgressOptions } from 'nprogress-v2';

type Props = {
  color?: string;
  height?: string;
  options?: Partial<NProgressOptions>;
  shallowRouting?: boolean; // reserved for parity with prior API
};

/**
 * Lightweight progress bar for route transitions.
 * Avoids the CJS `next-nprogress-bar` import that breaks on React 19 / Next 16
 * where `navigation` collides with the Navigation API.
 */
export function AppProgressBar({
  color = '#0A2FFF',
  height = '2px',
  options,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Inject minimal styles once
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.setAttribute('data-progress-bar', 'true');
    styleTag.textContent = `
#nprogress { pointer-events: none; }
#nprogress .bar {
  background: ${color};
  position: fixed;
  z-index: 99999;
  top: 0;
  left: 0;
  width: 100%;
  height: ${height};
}
#nprogress .peg {
  display: block;
  position: absolute;
  right: 0px;
  width: 100px;
  height: 100%;
  box-shadow: 0 0 10px ${color}, 0 0 5px ${color};
  opacity: 1.0;
  transform: rotate(3deg) translate(0px, -4px);
}
#nprogress .spinner { display: none; }
`;
    document.head.appendChild(styleTag);
    return () => {
      styleTag.remove();
    };
  }, [color, height]);

  // Configure once
  useEffect(() => {
    NProgress.configure({ showSpinner: false, ...(options ?? {}) });
  }, [options]);

  // Start/stop on navigation changes
  useEffect(() => {
    NProgress.start();
    const timer = setTimeout(() => NProgress.done(), 300);
    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [pathname, searchParams]);

  // Component renders nothing
  return null;
}
