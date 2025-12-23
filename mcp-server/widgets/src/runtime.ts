/**
 * OpenAI Widget Runtime Interface.
 *
 * Type definitions and helpers for interacting with the ChatGPT widget bridge.
 * The window.openai object is injected by ChatGPT when the widget loads.
 *
 * @see /docs/chatgpt-apps-sdk/BUILDING.md
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Display modes supported by ChatGPT widgets.
 */
export type DisplayMode = 'inline' | 'fullscreen' | 'pip' | 'carousel';

/**
 * Safe area insets for widget positioning.
 */
export interface SafeArea {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * View bounds for the widget.
 */
export interface ViewBounds {
  width: number;
  height: number;
}

/**
 * Runtime context provided by ChatGPT.
 */
export interface RuntimeContext {
  /** Current display mode */
  displayMode: DisplayMode;
  /** Safe area insets */
  safeArea: SafeArea;
  /** View bounds */
  view: ViewBounds;
  /** Color scheme preference */
  colorScheme: 'light' | 'dark';
}

/**
 * Tool call result from the MCP server.
 */
export interface ToolResult<T = unknown> {
  /** Structured content for model reasoning */
  structuredContent: T;
  /** Metadata including full data for UI rendering */
  _meta?: Record<string, unknown>;
}

/**
 * Widget state that persists across interactions.
 * Keep this small (< 4k tokens) - use IDs, not full data.
 */
export type WidgetState = Record<string, unknown>;

/**
 * OpenAI widget bridge interface.
 * This is available as window.openai in the widget iframe.
 */
export interface OpenAIBridge {
  /**
   * Call an MCP tool and get the result.
   *
   * @param toolName - The tool to call
   * @param args - Tool arguments
   * @returns Tool result with structuredContent and _meta
   */
  callTool<T = unknown>(toolName: string, args: Record<string, unknown>): Promise<ToolResult<T>>;

  /**
   * Send a follow-up message to the model.
   * Use this when the user takes an action that should trigger model reasoning.
   *
   * @param message - The message to send
   * @param widgetState - Optional state to include for model context
   */
  sendFollowUpMessage(message: string, widgetState?: WidgetState): Promise<void>;

  /**
   * Request a different display mode.
   * Only use fullscreen when the UI truly requires it.
   *
   * @param mode - The requested display mode
   */
  requestDisplayMode(mode: DisplayMode): Promise<void>;

  /**
   * Notify ChatGPT of the widget's intrinsic height.
   * Call this when content changes to ensure proper sizing.
   *
   * @param height - The desired height in pixels
   */
  notifyIntrinsicHeight(height: number): void;

  /**
   * Open an external URL in a new tab.
   * The URL must be in the redirect_domains allowlist.
   *
   * @param url - The URL to open
   */
  openExternal(url: string): Promise<void>;

  /**
   * Close the widget.
   */
  close(): void;

  /**
   * Get the current runtime context.
   */
  getContext(): RuntimeContext;

  /**
   * Subscribe to context changes.
   *
   * @param callback - Called when context changes
   * @returns Unsubscribe function
   */
  onContextChange(callback: (context: RuntimeContext) => void): () => void;
}

// ============================================================================
// RUNTIME ACCESS
// ============================================================================

declare global {
  interface Window {
    openai?: OpenAIBridge;
  }
}

/**
 * Get the OpenAI bridge, throwing if not available.
 * Use this in production widgets.
 */
export function getOpenAI(): OpenAIBridge {
  if (!window.openai) {
    throw new Error('OpenAI bridge not available. Widget must run inside ChatGPT.');
  }
  return window.openai;
}

/**
 * Check if the OpenAI bridge is available.
 */
export function isInChatGPT(): boolean {
  return typeof window !== 'undefined' && !!window.openai;
}

/**
 * Get the OpenAI bridge or a mock for development.
 * In development, returns a mock that logs calls to console.
 */
export function getOpenAIOrMock(): OpenAIBridge {
  if (window.openai) {
    return window.openai;
  }

  // Development mock
  console.warn('[Widget] Running outside ChatGPT - using mock bridge');

  const mockContext: RuntimeContext = {
    displayMode: 'inline',
    safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
    view: { width: 400, height: 600 },
    colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  };

  return {
    callTool: async <T = unknown>(toolName: string, args: Record<string, unknown>): Promise<ToolResult<T>> => {
      console.log('[Mock] callTool:', toolName, args);
      return { structuredContent: {} as T };
    },
    sendFollowUpMessage: async (message, widgetState) => {
      console.log('[Mock] sendFollowUpMessage:', message, widgetState);
    },
    requestDisplayMode: async (mode) => {
      console.log('[Mock] requestDisplayMode:', mode);
      mockContext.displayMode = mode;
    },
    notifyIntrinsicHeight: (height) => {
      console.log('[Mock] notifyIntrinsicHeight:', height);
    },
    openExternal: async (url) => {
      console.log('[Mock] openExternal:', url);
      window.open(url, '_blank');
    },
    close: () => {
      console.log('[Mock] close');
    },
    getContext: () => mockContext,
    onContextChange: (callback) => {
      // Mock: call immediately with current context
      callback(mockContext);
      return () => {};
    },
  };
}

// ============================================================================
// HOOKS
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

/**
 * React hook to get and subscribe to the runtime context.
 */
export function useRuntimeContext(): RuntimeContext {
  const [context, setContext] = useState<RuntimeContext>(() => {
    const bridge = getOpenAIOrMock();
    return bridge.getContext();
  });

  useEffect(() => {
    const bridge = getOpenAIOrMock();
    const unsubscribe = bridge.onContextChange(setContext);
    return unsubscribe;
  }, []);

  return context;
}

/**
 * React hook to call a tool with loading and error state.
 */
export function useToolCall<T = unknown>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const callTool = useCallback(async (
    toolName: string,
    args: Record<string, unknown>
  ): Promise<ToolResult<T> | null> => {
    setLoading(true);
    setError(null);

    try {
      const bridge = getOpenAIOrMock();
      const result = await bridge.callTool<T>(toolName, args);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { callTool, loading, error };
}

/**
 * React hook to notify ChatGPT of height changes.
 * Automatically reports height when the ref element changes size.
 */
export function useAutoHeight() {
  const [ref, setRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    const bridge = getOpenAIOrMock();
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        bridge.notifyIntrinsicHeight(Math.ceil(height));
      }
    });

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref]);

  return setRef;
}
