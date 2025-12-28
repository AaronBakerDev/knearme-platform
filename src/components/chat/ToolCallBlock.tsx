/**
 * ToolCallBlock - Collapsible display for tool invocations in chat.
 *
 * Shows tool calls as collapsed blocks that can be expanded to see:
 * - Tool name (formatted for readability)
 * - Arguments passed to the tool
 * - Result returned by the tool
 *
 * This provides visibility into AI tool usage during conversations,
 * helping users understand what data was extracted and when.
 *
 * @see /src/lib/chat/tool-schemas.ts for available tools
 * @see /src/components/chat/ChatMessages.tsx for integration
 */
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Wrench, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolCallBlockProps {
  /** Name of the tool that was called */
  toolName: string;
  /** Arguments passed to the tool */
  args?: Record<string, unknown>;
  /** Result returned by the tool */
  result?: unknown;
  /** Current state of the tool call (input-streaming, output-available, etc.) */
  state: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format a camelCase or PascalCase tool name for display.
 *
 * @example "extractProjectData" -> "Extract Project Data"
 */
function formatToolName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

/**
 * Get status icon based on tool state.
 */
function getStatusIcon(state: string) {
  switch (state) {
    case 'input-streaming':
    case 'input-available':
      return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
    case 'output-error':
    case 'output-denied':
      return <AlertCircle className="h-3 w-3 text-destructive" />;
    case 'output-available':
      return <CheckCircle2 className="h-3 w-3 text-green-500" />;
    default:
      return null;
  }
}

export function ToolCallBlock({
  toolName,
  args,
  result,
  state,
  className,
}: ToolCallBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isLoading = state === 'input-streaming' || state === 'input-available';
  const hasError = state === 'output-error' || state === 'output-denied';
  const isComplete = state === 'output-available';

  return (
    <div
      className={cn(
        'rounded-lg border border-border/50 bg-muted/30 text-sm my-2',
        hasError && 'border-destructive/50 bg-destructive/5',
        isComplete && 'border-green-500/20',
        className
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors rounded-lg"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
        <Wrench className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="font-medium text-foreground/80 flex-1 truncate">
          {formatToolName(toolName)}
        </span>
        {getStatusIcon(state)}
        {isLoading && (
          <span className="text-xs text-muted-foreground animate-pulse">
            Running...
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border/50">
          {args && Object.keys(args).length > 0 && (
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Arguments
              </span>
              <pre className="mt-1.5 p-2 rounded-md bg-background text-xs overflow-x-auto max-h-48 overflow-y-auto">
                {JSON.stringify(args, null, 2)}
              </pre>
            </div>
          )}
          {result !== undefined && isComplete && (
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Result
              </span>
              <pre className="mt-1.5 p-2 rounded-md bg-background text-xs overflow-x-auto max-h-48 overflow-y-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
          {hasError && (
            <div className="text-xs text-destructive">
              Tool execution failed or was denied.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
