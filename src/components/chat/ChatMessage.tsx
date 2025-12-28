'use client';

/**
 * Individual chat message with action buttons.
 *
 * Design: "Void Interface"
 * - User messages: teal pill bubble, right-aligned
 * - AI messages: plain text, no bubble, no avatar, left-aligned
 *   - Hover shows action buttons: copy, thumbs up, thumbs down
 *
 * The minimal AI message style creates visual hierarchy
 * and focuses attention on user input. Action buttons provide
 * utility without cluttering the interface.
 *
 * @see ChatMessages for message list rendering
 */

import { useState, useCallback } from 'react';
import { Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  /** Message role determines alignment and styling */
  role: 'user' | 'assistant';
  /** Text content to display */
  content: string;
  /** Whether this message is currently streaming */
  isStreaming?: boolean;
  /** Optional message ID for feedback tracking */
  messageId?: string;
  /** Called when user provides feedback on this message */
  onFeedback?: (messageId: string, type: 'positive' | 'negative') => void;
  /** Optional additional className */
  className?: string;
}

/**
 * Chat message component with action buttons for AI messages.
 *
 * - User messages: teal pill bubble, right-aligned
 * - AI messages: plain text, no bubble, left-aligned, with hover actions
 */
export function ChatMessage({
  role,
  content,
  isStreaming = false,
  messageId,
  onFeedback,
  className,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(
    null
  );

  const isUser = role === 'user';

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [content]);

  const handleFeedback = useCallback(
    (type: 'positive' | 'negative') => {
      setFeedback(type);
      if (messageId && onFeedback) {
        onFeedback(messageId, type);
      }
    },
    [messageId, onFeedback]
  );

  return (
    <div
      className={cn(
        'flex animate-message-in group',
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
        // AI message - plain text with hover actions
        <div className="relative max-w-[90%]">
          <div
            className={cn(
              'text-foreground text-[15px] leading-relaxed',
              isStreaming && 'opacity-70'
            )}
          >
            <p className="whitespace-pre-wrap break-words">{content}</p>
          </div>

          {/* Action buttons - visible on hover, below message */}
          {!isStreaming && content.length > 0 && (
            <div
              className={cn(
                'flex items-center gap-0.5 mt-1.5 -ml-1',
                'opacity-0 group-hover:opacity-100',
                'transition-opacity duration-150'
              )}
            >
              {/* Copy button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className={cn(
                      'h-7 w-7 rounded-md',
                      'text-muted-foreground hover:text-foreground hover:bg-muted/80',
                      'transition-colors'
                    )}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {copied ? 'Copied!' : 'Copy'}
                </TooltipContent>
              </Tooltip>

              {/* Thumbs up */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleFeedback('positive')}
                    className={cn(
                      'h-7 w-7 rounded-md',
                      'text-muted-foreground hover:text-foreground hover:bg-muted/80',
                      'transition-colors',
                      feedback === 'positive' &&
                        'text-emerald-500 hover:text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                    )}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Helpful
                </TooltipContent>
              </Tooltip>

              {/* Thumbs down */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleFeedback('negative')}
                    className={cn(
                      'h-7 w-7 rounded-md',
                      'text-muted-foreground hover:text-foreground hover:bg-muted/80',
                      'transition-colors',
                      feedback === 'negative' &&
                        'text-red-500 hover:text-red-500 bg-red-50 dark:bg-red-950/30'
                    )}
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Not helpful
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
