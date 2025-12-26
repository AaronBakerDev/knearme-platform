'use client';

/**
 * Individual chat message.
 *
 * Design: "Void Interface"
 * - User messages: teal pill bubble, right-aligned
 * - AI messages: plain text, no bubble, no avatar, left-aligned
 *
 * The minimal AI message style creates visual hierarchy
 * and focuses attention on user input.
 */

import { cn } from '@/lib/utils';

interface ChatMessageProps {
  /** Message role determines alignment and styling */
  role: 'user' | 'assistant';
  /** Text content to display */
  content: string;
  /** Whether this message is currently streaming */
  isStreaming?: boolean;
  /** Optional additional className */
  className?: string;
}

/**
 * Chat message component.
 *
 * - User messages: teal pill bubble, right-aligned
 * - AI messages: plain text, no bubble, left-aligned
 */
export function ChatMessage({
  role,
  content,
  isStreaming = false,
  className,
}: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'flex animate-message-in',
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
    >
      {isUser ? (
        // User message - teal pill bubble
        <div
          className={cn(
            'max-w-[80%] bg-primary text-primary-foreground rounded-3xl px-4 py-2.5 text-sm shadow-sm',
            isStreaming && 'animate-pulse'
          )}
        >
          <p className="whitespace-pre-wrap break-words">{content}</p>
        </div>
      ) : (
        // AI message - plain text, no bubble, no avatar
        <div
          className={cn(
            'max-w-[90%] text-foreground text-[15px] leading-relaxed',
            isStreaming && 'opacity-70'
          )}
        >
          <p className="whitespace-pre-wrap break-words">{content}</p>
        </div>
      )}
    </div>
  );
}
