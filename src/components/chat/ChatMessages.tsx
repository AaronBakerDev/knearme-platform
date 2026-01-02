'use client';

/**
 * Chat message list with centered column layout and auto-scroll.
 *
 * Design: "Void Interface" - messages float in a centered 650px column
 * with generous vertical padding for an immersive feel.
 *
 * Renders a scrollable list of messages and automatically
 * scrolls to the bottom when new messages arrive.
 *
 * Tool parts are rendered as artifacts using ArtifactRenderer.
 * @see /docs/ai-sdk/chat-artifacts-spec.md
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { UIMessage } from 'ai';
import { ChatMessage } from './ChatMessage';
import { ChatTypingIndicator } from './ChatTypingIndicator';
import { ArtifactRenderer, isArtifactPart } from './artifacts';
import { ToolCallBlock } from './ToolCallBlock';
import { ThinkingBlock } from './ThinkingBlock';
import { parseThinking, type TextSegment } from './utils/parseThinking';
import { cn } from '@/lib/utils';

/**
 * Image item for artifacts that display images.
 */
interface ArtifactImage {
  id: string;
  url: string;
  image_type?: 'before' | 'after' | 'progress' | 'detail';
}

export interface ChatMessagesProps {
  /** Array of messages to display */
  messages: UIMessage[];
  /** Whether the AI is currently generating a response */
  isLoading?: boolean;
  /** Callback when an artifact emits an action (categorize, remove, add, etc.) */
  onArtifactAction?: (action: { type: string; payload?: unknown }) => void;
  /** Callback when user provides feedback on a message */
  onMessageFeedback?: (messageId: string, type: 'positive' | 'negative') => void;
  /** Images to pass to image-related artifacts (e.g., ImageGalleryArtifact) */
  images?: ArtifactImage[];
  /** Optional additional className */
  className?: string;
  /**
   * Whether a save operation is in progress.
   * Passed to ContentEditor to disable buttons during save.
   */
  isSaving?: boolean;
  /**
   * When true, scroll to bottom on initial load (after messages are populated).
   * Use when loading existing chat history to show latest messages.
   */
  scrollOnLoad?: boolean;
  /**
   * Set of tool call IDs that have already been processed.
   * Passed to ArtifactRenderer to skip firing side-effects for
   * restored session messages (prevents auto-opening preview overlay).
   */
  processedSideEffectToolCallIds?: Set<string>;
}

/**
 * Extract text content from a UIMessage.
 * AI SDK v6 uses parts array for message content.
 */
function getMessageText(message: UIMessage): string {
  // Handle parts array (AI SDK v6 format)
  if (message.parts && Array.isArray(message.parts)) {
    return message.parts
      .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
      .map((part) => part.text)
      .join('');
  }
  return '';
}

/**
 * Tool part shape for rendering.
 */
interface RenderableToolPart {
  type: string;
  state: string;
  toolCallId: string;
  toolName?: string;
  output?: unknown;
  input?: unknown;
  args?: unknown;
  errorText?: string;
}

/**
 * Check if a part is a tool part (has tool- prefix and required fields).
 */
function isToolPart(part: unknown): part is RenderableToolPart {
  if (typeof part !== 'object' || part === null) return false;
  const obj = part as Record<string, unknown>;
  return (
    typeof obj.type === 'string' &&
    obj.type.startsWith('tool-') &&
    typeof obj.toolCallId === 'string' &&
    typeof obj.state === 'string'
  );
}

/**
 * Type guard to check if a part is an artifact tool part.
 * These are rendered with specialized artifact components.
 */
function isArtifactToolPart(part: unknown): part is RenderableToolPart {
  if (!isToolPart(part)) return false;
  return isArtifactPart(part as { type: string });
}

/**
 * Type guard to check if a part is a generic tool part (non-artifact).
 * These are rendered with the collapsible ToolCallBlock.
 */
function isGenericToolPart(part: unknown): part is RenderableToolPart {
  if (!isToolPart(part)) return false;
  return !isArtifactPart(part as { type: string });
}

/**
 * Extract tool name from part type (e.g., "tool-extractProjectData" -> "extractProjectData").
 */
function extractToolNameFromPart(part: RenderableToolPart): string {
  if (part.toolName) return part.toolName;
  // Extract from type like "tool-extractProjectData"
  return part.type.replace(/^tool-/, '');
}

/**
 * Extract artifact tool parts from a UIMessage for specialized rendering.
 * Returns parts that have registered artifact components.
 */
function getArtifactToolParts(message: UIMessage): RenderableToolPart[] {
  if (!message.parts || !Array.isArray(message.parts)) {
    return [];
  }

  const toolParts: RenderableToolPart[] = [];
  for (const part of message.parts) {
    if (isArtifactToolPart(part)) {
      toolParts.push(part);
    }
  }
  return toolParts;
}

/**
 * Extract generic tool parts from a UIMessage for collapsible block rendering.
 * Returns tool parts that don't have specialized artifact components.
 */
function getGenericToolParts(message: UIMessage): RenderableToolPart[] {
  if (!message.parts || !Array.isArray(message.parts)) {
    return [];
  }

  const toolParts: RenderableToolPart[] = [];
  for (const part of message.parts) {
    if (isGenericToolPart(part)) {
      toolParts.push(part);
    }
  }
  return toolParts;
}

/**
 * Chat messages container with centered column and auto-scroll.
 *
 * Accessibility:
 * - Uses role="log" for the message container (announces new messages)
 * - ARIA live region for streaming updates
 * - Proper message structure for screen readers
 */
export function ChatMessages({
  messages,
  isLoading = false,
  onArtifactAction,
  onMessageFeedback,
  images,
  className,
  isSaving,
  scrollOnLoad = false,
  processedSideEffectToolCallIds,
}: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const hasScrolledOnLoad = useRef(false);
  const previousMessageCount = useRef(messages.length);
  const isAtBottomRef = useRef(true);
  const prefersReducedMotion = useRef(false);
  const scrollDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  // Get the last message for ARIA announcements
  const lastMessage = messages[messages.length - 1];
  const lastMessageText = lastMessage ? getMessageText(lastMessage) : '';
  const lastMessageRole = lastMessage?.role;

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const container = containerRef.current;
    if (!container) return;
    const finalBehavior = prefersReducedMotion.current ? 'auto' : behavior;
    container.scrollTo({ top: container.scrollHeight, behavior: finalBehavior });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => {
      prefersReducedMotion.current = media.matches;
    };
    updatePreference();
    if (media.addEventListener) {
      media.addEventListener('change', updatePreference);
      return () => media.removeEventListener('change', updatePreference);
    }
    media.addListener(updatePreference);
    return () => media.removeListener(updatePreference);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateIsAtBottom = () => {
      const threshold = 64;
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      const seenAtBottom = distanceFromBottom <= threshold;
      if (isAtBottomRef.current !== seenAtBottom) {
        isAtBottomRef.current = seenAtBottom;
        setIsAtBottom(seenAtBottom);
        if (seenAtBottom) {
          setHasNewMessages(false);
        }
      } else {
        isAtBottomRef.current = seenAtBottom;
      }
    };

    updateIsAtBottom();
    container.addEventListener('scroll', updateIsAtBottom, { passive: true });
    return () => container.removeEventListener('scroll', updateIsAtBottom);
  }, []);

  // Handle initial scroll when loading existing messages
  useEffect(() => {
    // If scrollOnLoad is enabled and we have messages, scroll once after initial load
    if (scrollOnLoad && !hasScrolledOnLoad.current && messages.length > 1) {
      // Use a small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        scrollToBottom('auto');
        hasScrolledOnLoad.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [scrollOnLoad, messages.length, scrollToBottom]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    let notifyTimer: number | undefined;

    // Skip scroll on initial mount to prevent jumping
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousMessageCount.current = messages.length;
      return undefined;
    }

    // Only scroll if new messages were added (not on initial load)
    const hasNewMessage = messages.length > previousMessageCount.current;
    if ((hasNewMessage || isLoading) && isAtBottomRef.current) {
      // Debounce rapid scroll events to prevent janky scrolling during message bursts
      if (scrollDebounceRef.current) {
        clearTimeout(scrollDebounceRef.current);
      }
      scrollDebounceRef.current = setTimeout(() => {
        scrollToBottom('smooth');
        scrollDebounceRef.current = null;
      }, 50); // 50ms debounce window
    } else if ((hasNewMessage || isLoading) && !isAtBottomRef.current) {
      notifyTimer = window.setTimeout(() => setHasNewMessages(true), 0);
    }
    previousMessageCount.current = messages.length;

    return () => {
      if (notifyTimer !== undefined) {
        window.clearTimeout(notifyTimer);
      }
      if (scrollDebounceRef.current) {
        clearTimeout(scrollDebounceRef.current);
      }
    };
  }, [messages, isLoading, scrollToBottom]);

  // Cleanup scroll debounce timer on component unmount (defensive, prevents memory leak)
  useEffect(() => {
    return () => {
      if (scrollDebounceRef.current) {
        clearTimeout(scrollDebounceRef.current);
        scrollDebounceRef.current = null;
      }
    };
  }, []);

  // Memoize parseThinking results to prevent expensive re-computation on every render
  // Key by message ID + text content for cache invalidation when content changes
  const parsedThinkingMap = useMemo(() => {
    const map = new Map<string, TextSegment[]>();
    for (const message of messages) {
      if (message.role === 'assistant') {
        const text = getMessageText(message);
        if (text) {
          map.set(message.id, parseThinking(text));
        }
      }
    }
    return map;
  }, [messages]);

  return (
    <div
      ref={containerRef}
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
      aria-atomic="false"
      className={cn(
        'flex-1 min-h-0 overflow-y-auto overscroll-contain',
        className
      )}
    >
      {/* Centered content column */}
      <div className="max-w-[720px] mx-auto px-4 pt-6 pb-8 space-y-6">
        {/* Message list */}
        {messages.map((message) => {
          const text = getMessageText(message);
          const artifactParts = getArtifactToolParts(message);
          const genericParts = getGenericToolParts(message);

          // Skip completely empty messages (no text, no tools)
          if (!text && artifactParts.length === 0 && genericParts.length === 0) return null;

          return (
            <div
              key={message.id}
              className="space-y-3"
              role="article"
              aria-label={`${message.role === 'user' ? 'You' : 'Assistant'}: ${text.slice(0, 50)}${text.length > 50 ? '...' : ''}`}
            >
              {/* Text content - parse thinking blocks for assistant messages */}
              {text && (() => {
                // Only parse thinking for assistant messages
                if (message.role === 'assistant') {
                  // Use memoized parsed segments to avoid re-computation
                  const segments = parsedThinkingMap.get(message.id) || [];
                  return segments.map((segment, segIndex) => {
                    if (segment.type === 'thinking') {
                      return (
                        <ThinkingBlock
                          key={`${message.id}-thinking-${segIndex}`}
                          header={segment.header}
                          content={segment.content}
                        />
                      );
                    }
                    // Regular text segment
                    return (
                      <ChatMessage
                        key={`${message.id}-text-${segIndex}`}
                        role="assistant"
                        content={segment.content}
                        messageId={message.id}
                        onFeedback={onMessageFeedback}
                      />
                    );
                  });
                }
                // User messages render as-is
                return (
                  <ChatMessage
                    role="user"
                    content={text}
                    messageId={message.id}
                    onFeedback={onMessageFeedback}
                  />
                );
              })()}

              {/* Artifact parts (specialized tool rendering) */}
              {artifactParts.map((part, index) => (
                <ArtifactRenderer
                  key={`${message.id}-artifact-${index}`}
                  part={part}
                  onAction={onArtifactAction}
                  images={images}
                  isSaving={isSaving}
                  processedToolCallIds={processedSideEffectToolCallIds}
                />
              ))}

              {/* Generic tool parts (collapsible blocks for visibility) */}
              {genericParts.map((part, index) => (
                <ToolCallBlock
                  key={`${message.id}-tool-${index}`}
                  toolName={extractToolNameFromPart(part)}
                  args={(part.input || part.args) as Record<string, unknown> | undefined}
                  result={part.output}
                  state={part.state}
                />
              ))}
            </div>
          );
        })}

        {/* Typing indicator when AI is responding */}
        {isLoading && <ChatTypingIndicator />}
      </div>

      {hasNewMessages && !isAtBottom && (
        <div className="sticky bottom-4 z-10 flex justify-center pointer-events-none">
          <button
            type="button"
            onClick={() => {
              scrollToBottom('smooth');
              setHasNewMessages(false);
            }}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full border bg-background/90 px-3 py-1.5 text-xs font-medium shadow-md backdrop-blur"
            aria-label="Jump to latest messages"
          >
            Jump to latest
          </button>
        </div>
      )}

      {/* Screen reader announcement for new messages */}
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {isLoading && 'Assistant is typing...'}
        {!isLoading && lastMessageRole === 'assistant' && lastMessageText && (
          `New message from assistant: ${lastMessageText.slice(0, 100)}`
        )}
      </div>
    </div>
  );
}
