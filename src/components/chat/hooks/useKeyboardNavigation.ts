/**
 * Keyboard navigation hook for chat components.
 *
 * Provides standardized keyboard shortcuts and focus management
 * for the chat interface. Implements WCAG 2.1 AA keyboard requirements.
 *
 * Shortcuts:
 * - Tab: Navigate between input, send, mic, attach
 * - Enter: Send message (when input focused)
 * - Escape: Close any open sheet/modal, cancel recording
 * - Space: Start/stop recording (when mic focused)
 * - Arrow Up: Edit last message (when input empty)
 *
 * @see /docs/ai-sdk/chat-ux-patterns.md#keyboard-navigation
 */

import { useCallback, useEffect, useRef, type RefObject } from 'react';

/**
 * Keyboard shortcut configuration.
 */
interface KeyboardShortcut {
  /** Key code (e.g., 'Escape', 'Enter', 'Space') */
  key: string;
  /** Whether Ctrl/Cmd must be held */
  ctrlKey?: boolean;
  /** Whether Shift must be held */
  shiftKey?: boolean;
  /** Whether Alt must be held */
  altKey?: boolean;
  /** Handler function */
  handler: (e: KeyboardEvent) => void;
  /** Optional condition to check before handling */
  condition?: () => boolean;
  /** Prevent default behavior */
  preventDefault?: boolean;
}

/**
 * Hook options.
 */
interface UseKeyboardNavigationOptions {
  /** Whether keyboard navigation is enabled */
  enabled?: boolean;
  /** Custom shortcuts to add */
  shortcuts?: KeyboardShortcut[];
  /** Called when Escape is pressed */
  onEscape?: () => void;
  /** Called when user wants to edit last message (Arrow Up with empty input) */
  onEditLastMessage?: () => void;
  /** Reference to the input element for focus management */
  inputRef?: RefObject<HTMLInputElement | null>;
}

/**
 * Focus trap utility for modals/sheets.
 * Keeps focus within a container when tabbing.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  isActive: boolean
) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelector);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift+Tab: if on first element, wrap to last
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab: if on last element, wrap to first
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    // Focus first element on activation
    firstFocusable?.focus();

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, isActive]);
}

/**
 * Hook for keyboard navigation in chat components.
 *
 * @example
 * ```tsx
 * const inputRef = useRef<HTMLInputElement>(null);
 *
 * useKeyboardNavigation({
 *   inputRef,
 *   onEscape: () => setSheetOpen(false),
 *   onEditLastMessage: () => console.log('Edit last message'),
 * });
 * ```
 */
export function useKeyboardNavigation({
  enabled = true,
  shortcuts = [],
  onEscape,
  onEditLastMessage,
  inputRef,
}: UseKeyboardNavigationOptions = {}) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Build shortcut map
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Built-in Escape handler
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      // Arrow Up to edit last message (when input is empty and focused)
      if (
        e.key === 'ArrowUp' &&
        onEditLastMessage &&
        inputRef?.current &&
        document.activeElement === inputRef.current &&
        !inputRef.current.value
      ) {
        e.preventDefault();
        onEditLastMessage();
        return;
      }

      // Custom shortcuts
      for (const shortcut of shortcuts) {
        const keyMatch = e.key === shortcut.key;
        const ctrlMatch = shortcut.ctrlKey ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shiftKey ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.altKey ? e.altKey : !e.altKey;
        const conditionMatch = shortcut.condition ? shortcut.condition() : true;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && conditionMatch) {
          if (shortcut.preventDefault !== false) {
            e.preventDefault();
          }
          shortcut.handler(e);
          return;
        }
      }
    },
    [enabled, shortcuts, onEscape, onEditLastMessage, inputRef]
  );

  // Add global keydown listener
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);

  /**
   * Focus the input element.
   */
  const focusInput = useCallback(() => {
    inputRef?.current?.focus();
  }, [inputRef]);

  /**
   * Save current focus before opening a modal.
   */
  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  /**
   * Restore focus after closing a modal.
   */
  const restoreFocus = useCallback(() => {
    previousFocusRef.current?.focus();
    previousFocusRef.current = null;
  }, []);

  return {
    focusInput,
    saveFocus,
    restoreFocus,
  };
}

export default useKeyboardNavigation;
