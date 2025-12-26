'use client';

/**
 * Chat message list with centered column layout and auto-scroll.
 *
 * Design: "Void Interface" - messages float in a centered 650px column
 * with generous vertical padding for an immersive feel.
 *
 * Renders a scrollable list of messages and automatically
 * scrolls to the bottom when new messages arrive.
 */

import { useEffect, useRef } from 'react';
import type { UIMessage } from 'ai';
import { ChatMessage } from './ChatMessage';
import { ChatTypingIndicator } from './ChatTypingIndicator';
import { cn } from '@/lib/utils';

interface ChatMessagesProps {
  /** Array of messages to display */
  messages: UIMessage[];
  /** Whether the AI is currently generating a response */
  isLoading?: boolean;
  /** Optional additional className */
  className?: string;
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
 * Chat messages container with centered column and auto-scroll.
 */
export function ChatMessages({
  messages,
  isLoading = false,
  className,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex-1 overflow-y-auto',
        className
      )}
    >
      {/* Centered content column */}
      <div className="max-w-[650px] mx-auto px-4 py-16 space-y-6">
        {/* Message list */}
        {messages.map((message) => {
          const text = getMessageText(message);
          // Skip empty messages
          if (!text) return null;

          return (
            <ChatMessage
              key={message.id}
              role={message.role as 'user' | 'assistant'}
              content={text}
            />
          );
        })}

        {/* Typing indicator when AI is responding */}
        {isLoading && <ChatTypingIndicator />}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
