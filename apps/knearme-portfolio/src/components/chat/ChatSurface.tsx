'use client';

/**
 * Shared chat surface layout.
 *
 * Provides the common message + input shell used by chat experiences.
 * Keeps the project "Void Interface" layout consistent across contexts.
 */

import type { ReactNode } from 'react';
import type { UIMessage } from 'ai';
import { ChatMessages } from './ChatMessages';
import type { ActiveToolCall } from './AgentActivityIndicator';
import { cn } from '@/lib/utils';

interface ChatSurfaceProps {
  /** Messages to render */
  messages: UIMessage[];
  /** Whether the assistant is responding */
  isLoading?: boolean;
  /** Active tool calls for activity indicator */
  activeToolCalls?: ActiveToolCall[];
  /** Whether text is currently streaming */
  isTextStreaming?: boolean;
  /** Artifact actions (tool-driven) */
  onArtifactAction?: (action: { type: string; payload?: unknown }) => void;
  /** Optional message feedback handler */
  onMessageFeedback?: (messageId: string, type: 'positive' | 'negative') => void;
  /** Images for image-related artifacts */
  images?: { id: string; url: string; image_type?: 'before' | 'after' | 'progress' | 'detail' }[];
  /** Save state for artifact controls */
  isSaving?: boolean;
  /** Tool call IDs already processed (avoid side effects on restore) */
  processedSideEffectToolCallIds?: Set<string>;
  /** Scroll to bottom on initial load */
  scrollOnLoad?: boolean;
  /** Optional content above messages (e.g., helper chips) */
  headerSlot?: ReactNode;
  /** Optional content below messages (e.g., input area) */
  footerSlot?: ReactNode;
  /** Container class name */
  className?: string;
  /** ChatMessages class name */
  messagesClassName?: string;
}

export function ChatSurface({
  messages,
  isLoading = false,
  activeToolCalls = [],
  isTextStreaming = false,
  onArtifactAction,
  onMessageFeedback,
  images,
  isSaving,
  processedSideEffectToolCallIds,
  scrollOnLoad = false,
  headerSlot,
  footerSlot,
  className,
  messagesClassName,
}: ChatSurfaceProps) {
  return (
    <div className={cn('flex flex-col h-full min-h-0', className)}>
      {headerSlot}
      <ChatMessages
        messages={messages}
        isLoading={isLoading}
        activeToolCalls={activeToolCalls}
        isTextStreaming={isTextStreaming}
        onArtifactAction={onArtifactAction}
        onMessageFeedback={onMessageFeedback}
        images={images}
        className={cn('flex-1 overflow-y-auto', messagesClassName)}
        isSaving={isSaving}
        scrollOnLoad={scrollOnLoad}
        processedSideEffectToolCallIds={processedSideEffectToolCallIds}
      />
      {footerSlot}
    </div>
  );
}
