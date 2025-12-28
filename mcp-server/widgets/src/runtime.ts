/**
 * OpenAI Widget Runtime Interface.
 *
 * Helper functions for interacting with the ChatGPT widget bridge.
 * The window.openai object is injected by ChatGPT when the widget loads.
 *
 * Type definitions are in ./types.ts - this file provides runtime utilities.
 *
 * @see /docs/chatgpt-apps-sdk/BUILDING.md
 * @see ./types.ts for OpenAiApi and OpenAiGlobals interfaces
 */

import { useState, useEffect, useCallback } from 'react';
import type { OpenAiApi, DisplayMode, Theme } from './types';

// ============================================================================
// RUNTIME CONTEXT TYPE (for legacy compatibility)
// ============================================================================

/**
 * Runtime context provided by ChatGPT.
 * This is a simplified view of the OpenAiGlobals for context-based hooks.
 */
export interface RuntimeContext {
  /** Current display mode */
  displayMode: DisplayMode;
  /** Safe area insets */
  safeArea: { top: number; right: number; bottom: number; left: number };
  /** View bounds */
  view: { width: number; height: number };
  /** Color scheme preference */
  colorScheme: Theme;
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
 * Bridge interface for the mock implementation.
 * Provides a subset of OpenAiApi methods for development.
 */
interface MockBridge {
  callTool<T = unknown>(toolName: string, args: Record<string, unknown>): Promise<ToolResult<T>>;
  sendFollowUpMessage(message: string, widgetState?: WidgetState): Promise<void>;
  requestDisplayMode(mode: DisplayMode): Promise<void>;
  notifyIntrinsicHeight(height: number): void;
  openExternal(url: string): Promise<void>;
  close(): void;
  getContext(): RuntimeContext;
  onContextChange(callback: (context: RuntimeContext) => void): () => void;
}

// ============================================================================
// RUNTIME ACCESS
// ============================================================================

/**
 * Get the OpenAI API, throwing if not available.
 * Use this in production widgets.
 */
export function getOpenAI(): OpenAiApi {
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
 * Get the OpenAI API or a mock for development.
 * In development, returns a mock that logs calls to console.
 *
 * Note: The mock implements a simplified bridge interface for development.
 * Production widgets should use the full OpenAiApi from window.openai.
 */
export function getOpenAIOrMock(): MockBridge {
  if (window.openai) {
    // Adapt the real API to the bridge interface
    const api = window.openai;
    return {
      callTool: async <T = unknown>(toolName: string, args: Record<string, unknown>): Promise<ToolResult<T>> => {
        await api.callTool(toolName, args);
        // Return a placeholder since the real API doesn't return ToolResult
        return { structuredContent: {} as T };
      },
      sendFollowUpMessage: async (message: string, widgetState?: WidgetState) => {
        await api.sendFollowUpMessage({ prompt: message });
        if (widgetState) {
          api.setWidgetState(widgetState);
        }
      },
      requestDisplayMode: async (mode: DisplayMode) => {
        await api.requestDisplayMode({ mode });
      },
      notifyIntrinsicHeight: (height: number) => {
        api.notifyIntrinsicHeight(height);
      },
      openExternal: async (url: string) => {
        api.openExternal({ href: url });
      },
      close: () => {
        api.requestClose();
      },
      getContext: (): RuntimeContext => ({
        displayMode: api.displayMode,
        safeArea: api.safeArea,
        view: { width: 400, height: api.maxHeight }, // approximation
        colorScheme: api.theme,
      }),
      onContextChange: (callback: (context: RuntimeContext) => void) => {
        // Call immediately with current context
        callback({
          displayMode: api.displayMode,
          safeArea: api.safeArea,
          view: { width: 400, height: api.maxHeight },
          colorScheme: api.theme,
        });
        // Return no-op unsubscribe - use hooks.ts for proper subscriptions
        return () => {};
      },
    };
  }

  // Development mock
  console.warn('[Widget] Running outside ChatGPT - using mock bridge');

  const mockContext: RuntimeContext = {
    displayMode: 'inline',
    safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
    view: { width: 400, height: 600 },
    colorScheme: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
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

/**
 * React hook to get and subscribe to the runtime context.
 *
 * @deprecated Use hooks from ./hooks.ts for proper useSyncExternalStore subscriptions.
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
