/**
 * ThinkingBlock - Collapsible display for AI reasoning in chat.
 *
 * Shows AI "thinking" content as collapsed blocks that can be expanded.
 * This keeps the conversation clean while still allowing users to see
 * the AI's reasoning process if they want to.
 *
 * Similar to ToolCallBlock but with lighter styling and brain icon.
 *
 * @see /src/components/chat/ToolCallBlock.tsx for similar pattern
 * @see /src/components/chat/ChatMessages.tsx for integration
 */
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThinkingBlockProps {
  /** Header/title of the thinking block (e.g., "Evaluating Current Status") */
  header: string;
  /** The reasoning content */
  content: string;
  /** Whether to start expanded (default: false) */
  defaultExpanded?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Truncate text to a maximum length with ellipsis.
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Collapsible block showing AI reasoning/thinking.
 * Collapsed by default to keep conversation clean.
 */
export function ThinkingBlock({
  header,
  content,
  defaultExpanded = false,
  className,
}: ThinkingBlockProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Preview of content when collapsed
  const preview = truncate(content.replace(/\n/g, ' ').trim(), 60);

  return (
    <div
      className={cn(
        'rounded-lg border border-border/30 bg-muted/20 text-sm my-2',
        className
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-muted/30 transition-colors rounded-lg"
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} thinking: ${header}`}
      >
        {isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" />
        )}
        <Brain className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" />
        <span className="font-medium text-muted-foreground/80 flex-1 truncate text-xs">
          {header}
        </span>
        {!isExpanded && preview && (
          <span className="text-xs text-muted-foreground/50 truncate max-w-[200px] hidden sm:inline">
            {preview}
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border/20">
          <p className="text-xs text-muted-foreground/70 whitespace-pre-wrap leading-relaxed">
            {content}
          </p>
        </div>
      )}
    </div>
  );
}
