/**
 * OpenAI Widget Hooks for ChatGPT Apps SDK.
 *
 * React hooks for subscribing to window.openai globals.
 * Uses useSyncExternalStore for proper React 18+ subscription patterns.
 *
 * These hooks listen for the 'openai:set_globals' event dispatched by
 * ChatGPT when widget globals are updated.
 *
 * @see https://platform.openai.com/docs/chatgpt-apps-sdk
 * @see /docs/chatgpt-apps-sdk/BUILDING.md
 */

import { useSyncExternalStore, useCallback, useEffect } from 'react';
import type { OpenAiGlobals, OpenAiApi, Theme } from './types';

// ============================================================================
// SUBSCRIPTION UTILITIES
// ============================================================================

/**
 * Event name dispatched by ChatGPT when globals are updated.
 */
const GLOBALS_EVENT = 'openai:set_globals';

/**
 * Create a subscription function for useSyncExternalStore.
 * Subscribes to the 'openai:set_globals' custom event.
 *
 * @param callback - Function to call when globals change
 * @returns Unsubscribe function
 */
function subscribeToGlobals(callback: () => void): () => void {
  window.addEventListener(GLOBALS_EVENT, callback);
  return () => window.removeEventListener(GLOBALS_EVENT, callback);
}

/**
 * Get a snapshot of a specific global value.
 * Returns undefined if window.openai is not available.
 *
 * @param key - The global key to retrieve
 * @returns The current value or undefined
 */
function getGlobalSnapshot<K extends keyof OpenAiGlobals>(key: K): OpenAiGlobals[K] | undefined {
  if (typeof window === 'undefined' || !window.openai) {
    return undefined;
  }
  return window.openai[key] as OpenAiGlobals[K] | undefined;
}

/**
 * Server snapshot - always returns undefined since window.openai
 * is not available during SSR.
 */
function getServerSnapshot(): undefined {
  return undefined;
}

// ============================================================================
// CORE HOOKS
// ============================================================================

/**
 * Subscribe to a specific window.openai global value.
 *
 * This hook uses React 18's useSyncExternalStore for proper subscription
 * to external state. It listens for the 'openai:set_globals' event
 * dispatched by ChatGPT when globals are updated.
 *
 * @example
 * ```tsx
 * function MyWidget() {
 *   const toolOutput = useOpenAiGlobal('toolOutput');
 *   const theme = useOpenAiGlobal('theme');
 *
 *   return (
 *     <div className={theme === 'dark' ? 'dark' : 'light'}>
 *       <pre>{JSON.stringify(toolOutput, null, 2)}</pre>
 *     </div>
 *   );
 * }
 * ```
 *
 * @param key - The global key to subscribe to
 * @returns The current value of the global, or undefined if not available
 */
export function useOpenAiGlobal<K extends keyof OpenAiGlobals>(
  key: K
): OpenAiGlobals[K] | undefined {
  const getSnapshot = useCallback(() => getGlobalSnapshot(key), [key]);

  return useSyncExternalStore(
    subscribeToGlobals,
    getSnapshot,
    getServerSnapshot
  );
}

/**
 * Get the tool output from window.openai.toolOutput.
 *
 * The tool output contains the structuredContent returned by the MCP tool.
 * This is token-efficient data intended for model reasoning.
 *
 * @example
 * ```tsx
 * interface ProjectData {
 *   id: string;
 *   title: string;
 *   status: 'draft' | 'published';
 * }
 *
 * function ProjectWidget() {
 *   const output = useToolOutput<ProjectData>();
 *
 *   if (!output) {
 *     return <div>Loading...</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <h1>{output.title}</h1>
 *       <span>Status: {output.status}</span>
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns The tool output, typed as T, or undefined if not available
 */
export function useToolOutput<T = unknown>(): T | undefined {
  return useOpenAiGlobal('toolOutput') as T | undefined;
}

/**
 * Get the tool input (arguments) from window.openai.toolInput.
 *
 * The tool input contains the arguments that were passed to the MCP tool.
 * Useful for understanding what action triggered the widget.
 *
 * @example
 * ```tsx
 * interface CreateProjectArgs {
 *   title: string;
 *   contractor_id: string;
 * }
 *
 * function ProjectForm() {
 *   const input = useToolInput<CreateProjectArgs>();
 *
 *   return (
 *     <form>
 *       <input defaultValue={input?.title} />
 *     </form>
 *   );
 * }
 * ```
 *
 * @returns The tool input arguments, typed as T, or undefined if not available
 */
export function useToolInput<T extends Record<string, unknown> = Record<string, unknown>>(): T | undefined {
  return useOpenAiGlobal('toolInput') as T | undefined;
}

/**
 * Get the tool response metadata from window.openai.toolResponseMetadata.
 *
 * The _meta field contains full data for UI rendering that shouldn't
 * consume tokens in the model's context. Use this for detailed data
 * like image URLs, full descriptions, etc.
 *
 * @example
 * ```tsx
 * import type { ToolResponseMetadata } from './types';
 *
 * function ProjectGallery() {
 *   const meta = useToolResponseMetadata();
 *
 *   if (!meta?.widgetData) {
 *     return <div>No data</div>;
 *   }
 *
 *   return (
 *     <div className="gallery">
 *       {meta.widgetTemplate}
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns The response metadata, or undefined if not available
 */
export function useToolResponseMetadata(): OpenAiGlobals['toolResponseMetadata'] | undefined {
  return useOpenAiGlobal('toolResponseMetadata');
}

/**
 * Manage widget state that persists across interactions.
 *
 * Widget state is stored in window.openai.widgetState and can be updated
 * via setWidgetState. The state persists across tool calls and is passed
 * to the model in subsequent interactions.
 *
 * IMPORTANT: Keep widget state small (< 4k tokens). Store IDs and references,
 * not full data objects.
 *
 * @example
 * ```tsx
 * interface MyWidgetState {
 *   selectedProjectId: string | null;
 *   viewMode: 'grid' | 'list';
 *   expandedSections: string[];
 * }
 *
 * function MyWidget() {
 *   const [state, setState] = useWidgetState<MyWidgetState>({
 *     selectedProjectId: null,
 *     viewMode: 'grid',
 *     expandedSections: [],
 *   });
 *
 *   const selectProject = (id: string) => {
 *     setState({ ...state, selectedProjectId: id });
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={() => selectProject('123')}>
 *         Select Project
 *       </button>
 *       <span>View: {state.viewMode}</span>
 *     </div>
 *   );
 * }
 * ```
 *
 * @param defaultState - Default state to use if no state exists
 * @returns Tuple of [currentState, setStateFn]
 */
export function useWidgetState<T extends Record<string, unknown>>(
  defaultState: T
): [T, (newState: T) => void] {
  // Get current state from window.openai
  const rawState = useOpenAiGlobal('widgetState');

  // Merge with default state (rawState takes precedence)
  const currentState: T = rawState
    ? { ...defaultState, ...(rawState as Partial<T>) }
    : defaultState;

  // Initialize state on mount if empty
  useEffect(() => {
    if (!rawState && window.openai?.setWidgetState) {
      window.openai.setWidgetState(defaultState);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Create setter function
  const setState = useCallback((newState: T) => {
    if (window.openai?.setWidgetState) {
      window.openai.setWidgetState(newState);
    } else {
      console.warn('[Widget] setWidgetState not available - running outside ChatGPT?');
    }
  }, []);

  return [currentState, setState];
}

/**
 * Get the current theme preference from window.openai.theme.
 *
 * Returns 'light' or 'dark' based on ChatGPT's current appearance setting.
 * Falls back to system preference if running outside ChatGPT.
 *
 * @example
 * ```tsx
 * function ThemedWidget() {
 *   const theme = useTheme();
 *
 *   return (
 *     <div className={`widget ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
 *       <h1>Styled for {theme} mode</h1>
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns 'light' or 'dark'
 */
export function useTheme(): Theme {
  const theme = useOpenAiGlobal('theme');

  // If theme is available from ChatGPT, use it
  if (theme) {
    return theme;
  }

  // Fallback to system preference when running outside ChatGPT
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // SSR fallback
  return 'light';
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Subscribe to theme changes with a stable callback.
 *
 * Useful when you need to perform side effects on theme change,
 * such as updating third-party libraries or analytics.
 *
 * @example
 * ```tsx
 * function ChartWidget() {
 *   const chartRef = useRef<ChartInstance>(null);
 *
 *   useThemeEffect((theme) => {
 *     if (chartRef.current) {
 *       chartRef.current.setTheme(theme === 'dark' ? 'dark' : 'light');
 *     }
 *   });
 *
 *   return <div ref={chartRef} />;
 * }
 * ```
 *
 * @param callback - Function to call when theme changes
 */
export function useThemeEffect(callback: (theme: Theme) => void): void {
  const theme = useTheme();
  useEffect(() => {
    callback(theme);
  }, [callback, theme]);
}

/**
 * Check if the widget is running inside ChatGPT.
 *
 * Useful for conditionally rendering development UI or
 * enabling mock data when running outside ChatGPT.
 *
 * @example
 * ```tsx
 * function DevWidget() {
 *   const inChatGPT = useIsInChatGPT();
 *
 *   return (
 *     <div>
 *       {!inChatGPT && (
 *         <div className="dev-banner">
 *           Running in development mode
 *         </div>
 *       )}
 *       <WidgetContent />
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns true if window.openai is available
 */
export function useIsInChatGPT(): boolean {
  // Use a stable snapshot function
  const getSnapshot = useCallback(() => {
    return typeof window !== 'undefined' && !!window.openai;
  }, []);

  return useSyncExternalStore(
    subscribeToGlobals,
    getSnapshot,
    () => false // Server always returns false
  );
}

/**
 * Get the full OpenAI API object for direct access.
 *
 * Use this when you need access to methods like callTool, sendFollowUpMessage,
 * etc. Returns undefined if running outside ChatGPT.
 *
 * For most cases, prefer the specific hooks (useToolOutput, useTheme, etc.)
 * as they provide proper React subscription semantics.
 *
 * @example
 * ```tsx
 * function ActionButton() {
 *   const openai = useOpenAiApi();
 *
 *   const handleClick = async () => {
 *     if (!openai) return;
 *
 *     await openai.callTool('update_project', { id: '123', status: 'published' });
 *     await openai.sendFollowUpMessage({ prompt: 'Project published!' });
 *   };
 *
 *   return <button onClick={handleClick}>Publish</button>;
 * }
 * ```
 *
 * @returns The OpenAI API object, or undefined if not available
 */
export function useOpenAiApi(): OpenAiApi | undefined {
  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') return undefined;
    return window.openai;
  }, []);

  return useSyncExternalStore(
    subscribeToGlobals,
    getSnapshot,
    () => undefined
  );
}

/**
 * Get the current display mode from window.openai.displayMode.
 *
 * Returns the current widget display mode: 'inline', 'pip', or 'fullscreen'.
 *
 * @example
 * ```tsx
 * function AdaptiveWidget() {
 *   const displayMode = useDisplayMode();
 *
 *   return (
 *     <div className={displayMode === 'fullscreen' ? 'p-8' : 'p-4'}>
 *       {displayMode === 'pip' && <CompactView />}
 *       {displayMode !== 'pip' && <FullView />}
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns The current display mode, or 'inline' as fallback
 */
export function useDisplayMode(): OpenAiGlobals['displayMode'] {
  const mode = useOpenAiGlobal('displayMode');
  return mode ?? 'inline';
}

/**
 * Get the safe area insets for proper padding in fullscreen/pip modes.
 *
 * Safe area accounts for device notches, rounded corners, and system UI.
 *
 * @example
 * ```tsx
 * function SafeWidget() {
 *   const safeArea = useSafeArea();
 *
 *   return (
 *     <div style={{
 *       paddingTop: safeArea.top,
 *       paddingBottom: safeArea.bottom,
 *       paddingLeft: safeArea.left,
 *       paddingRight: safeArea.right,
 *     }}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns Safe area insets object
 */
export function useSafeArea(): OpenAiGlobals['safeArea'] {
  const safeArea = useOpenAiGlobal('safeArea');
  return safeArea ?? { top: 0, bottom: 0, left: 0, right: 0 };
}

/**
 * Get the maximum height constraint for the widget.
 *
 * Use this to ensure your widget doesn't exceed the available space.
 *
 * @example
 * ```tsx
 * function ScrollableWidget() {
 *   const maxHeight = useMaxHeight();
 *
 *   return (
 *     <div style={{ maxHeight, overflow: 'auto' }}>
 *       <LongContent />
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns Maximum height in pixels, or 600 as fallback
 */
export function useMaxHeight(): number {
  const maxHeight = useOpenAiGlobal('maxHeight');
  return maxHeight ?? 600;
}
