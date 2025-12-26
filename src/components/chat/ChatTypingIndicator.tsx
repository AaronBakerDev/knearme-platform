'use client';

/**
 * Typing indicator showing animated dots.
 *
 * Design: "Void Interface" - minimal dots without avatar or bubble,
 * matching the plain text AI message style.
 *
 * Displayed when the AI assistant is generating a response.
 */

import { cn } from '@/lib/utils';

interface ChatTypingIndicatorProps {
  /** Optional additional className */
  className?: string;
}

/**
 * Animated typing indicator with three bouncing dots (no avatar, no bubble).
 */
export function ChatTypingIndicator({ className }: ChatTypingIndicatorProps) {
  return (
    <div className={cn('flex justify-start animate-message-in', className)}>
      {/* Simple animated dots - no bubble, matching plain AI text style */}
      <div className="flex gap-1.5 py-2">
        <span
          className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
    </div>
  );
}
