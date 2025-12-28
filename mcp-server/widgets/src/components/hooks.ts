/**
 * Widget Hooks.
 *
 * Custom React hooks for accessing OpenAI widget runtime features.
 * These provide convenient access to tool output data and theme settings.
 *
 * @see /docs/chatgpt-apps-sdk/BUILDING.md
 */

import { useMemo, useState, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Theme preference from the ChatGPT runtime context.
 */
export type Theme = 'light' | 'dark';

/**
 * OpenAI bridge interface (subset used by hooks).
 */
interface OpenAIBridge {
  toolOutput?: unknown;
  getContext?: () => { colorScheme: Theme };
  onContextChange?: (callback: (context: { colorScheme: Theme }) => void) => () => void;
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Get the OpenAI bridge from window if available.
 */
function getOpenAI(): OpenAIBridge | undefined {
  if (typeof window !== 'undefined') {
    return (window as unknown as { openai?: OpenAIBridge }).openai;
  }
  return undefined;
}

/**
 * Get system color scheme preference.
 */
function getSystemTheme(): Theme {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * React hook to read data from the OpenAI tool output.
 *
 * In ChatGPT widgets, the tool response is available via window.openai.toolOutput.
 * This hook provides typed access to that data with a fallback for development.
 *
 * @template T - The expected shape of the tool output data
 * @param fallback - Optional fallback data for development/testing
 * @returns The tool output data, or null if not available
 *
 * @example
 * ```tsx
 * interface ProjectData {
 *   project: { id: string; title: string };
 *   images: Array<{ url: string }>;
 * }
 *
 * function MyWidget() {
 *   const data = useToolOutput<ProjectData>();
 *   if (!data) return <LoadingSpinner />;
 *   return <div>{data.project.title}</div>;
 * }
 * ```
 */
export function useToolOutput<T = unknown>(fallback?: T): T | null {
  return useMemo(() => {
    const openai = getOpenAI();

    // Try to read from window.openai.toolOutput
    if (openai?.toolOutput) {
      return openai.toolOutput as T;
    }

    // Fallback: check for __WIDGET_DATA__ (legacy pattern)
    const widgetData = (window as unknown as { __WIDGET_DATA__?: { data?: T } }).__WIDGET_DATA__;
    if (widgetData?.data) {
      return widgetData.data as T;
    }

    // Use provided fallback for development
    if (fallback !== undefined) {
      return fallback;
    }

    return null;
  }, [fallback]);
}

/**
 * React hook to get the current theme from ChatGPT runtime.
 *
 * Returns the color scheme preference from the ChatGPT context,
 * falling back to system preference if not available.
 *
 * @returns The current theme ('light' or 'dark')
 *
 * @example
 * ```tsx
 * function MyWidget() {
 *   const theme = useTheme();
 *   return (
 *     <div className={theme === 'dark' ? 'dark-mode' : 'light-mode'}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(() => {
    const openai = getOpenAI();
    if (openai?.getContext) {
      return openai.getContext().colorScheme;
    }
    return getSystemTheme();
  });

  useEffect(() => {
    const openai = getOpenAI();

    // Subscribe to context changes from ChatGPT
    if (openai?.onContextChange) {
      const unsubscribe = openai.onContextChange((context) => {
        setTheme(context.colorScheme);
      });
      return unsubscribe;
    }

    // Fallback: listen to system preference changes
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        setTheme(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }

    return undefined;
  }, []);

  return theme;
}

/**
 * React hook to request display mode changes.
 *
 * @returns Object with requestFullscreen function
 *
 * @example
 * ```tsx
 * function MyWidget() {
 *   const { requestFullscreen } = useDisplayMode();
 *   return <button onClick={requestFullscreen}>Expand</button>;
 * }
 * ```
 */
export function useDisplayMode() {
  const requestFullscreen = useMemo(() => {
    return () => {
      const openai = getOpenAI() as { requestDisplayMode?: (opts: { mode: string }) => void };
      if (openai?.requestDisplayMode) {
        openai.requestDisplayMode({ mode: 'fullscreen' });
      } else {
        console.log('[Mock] requestDisplayMode: fullscreen');
      }
    };
  }, []);

  return { requestFullscreen };
}
