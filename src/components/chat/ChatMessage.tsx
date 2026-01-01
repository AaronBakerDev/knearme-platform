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
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed mb-2 last:mb-0">
      {children}
    </p>
  ),
  a: ({ children, href }) => (
    <a
      href={href ?? '#'}
      target="_blank"
      rel="noreferrer noopener"
      className="text-primary underline underline-offset-2 hover:text-primary/80"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li className="break-words">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-muted-foreground/40 pl-4 text-muted-foreground italic">
      {children}
    </blockquote>
  ),
  h1: ({ children }) => (
    <h1 className="text-base font-semibold mt-3 mb-1">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-sm font-semibold mt-3 mb-1">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>
  ),
  code: ({ className, children, ...props }) => {
    // In react-markdown v9+, inline code doesn't have a language class
    // Code blocks have className like "language-js"
    const isCodeBlock = Boolean(className?.startsWith('language-'));
    if (!isCodeBlock) {
      return (
        <code
          className="rounded bg-muted/80 px-1.5 py-0.5 font-mono text-[13px]"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={cn('font-mono text-[13px]', className)} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mt-3 mb-3 overflow-x-auto rounded-lg bg-muted/70 p-3 text-[13px] leading-relaxed">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-3 border-muted/70" />,
  table: ({ children }) => (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-muted/60 bg-muted/40 px-2 py-1 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-muted/60 px-2 py-1">{children}</td>
  ),
};

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
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {content}
            </ReactMarkdown>
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
