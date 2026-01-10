'use client';

/**
 * Agent Activity Indicator
 *
 * Displays what the Discovery Agent is currently doing during streaming.
 * Uses ThinkingSteps for complex operations (search, reviews) and
 * a simple pill for quick operations (confirm, save).
 *
 * @example
 * ```tsx
 * <AgentActivityIndicator
 *   activeToolCalls={[{ toolCallId: '1', toolName: 'showBusinessSearchResults', state: 'executing' }]}
 *   isTextStreaming={false}
 * />
 * ```
 *
 * @see /src/components/chat/ThinkingSteps.tsx - Chain of thought UI
 * @see /docs/specs/typeform-onboarding-spec.md - UX requirements
 */

import { Search, MessageSquare, CheckCircle, Globe, Sparkles, Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThinkingSteps } from './ThinkingSteps';
import {
  buildStepsForTool,
  getToolTitle,
  getToolSummary,
  TOOL_STEP_CONFIGS,
} from './thinking-steps-config';

// =============================================================================
// Types
// =============================================================================

export interface ActiveToolCall {
  toolCallId: string;
  toolName: string;
  state: 'input-streaming' | 'input-available' | 'executing' | 'output-available';
  /** Optional result data for generating previews */
  result?: unknown;
}

interface AgentActivityIndicatorProps {
  /** Active tool calls being streamed */
  activeToolCalls: ActiveToolCall[];
  /** Whether text is currently streaming (fallback to dots) */
  isTextStreaming?: boolean;
  /** Optional className */
  className?: string;
}

// =============================================================================
// Icon Mapping
// =============================================================================

const ICONS = {
  search: Search,
  message: MessageSquare,
  globe: Globe,
  save: Save,
  sparkles: Sparkles,
} as const;

// =============================================================================
// Tools that use ThinkingSteps (complex, multi-step)
// =============================================================================

const THINKING_STEPS_TOOLS = new Set([
  'showBusinessSearchResults',
  'fetchReviews',
  'webSearchBusiness',
]);

// =============================================================================
// Simple Activity Pill (for quick operations)
// =============================================================================

interface SimpleActivityPillProps {
  message: string;
  icon: React.ElementType;
  className?: string;
}

function SimpleActivityPill({ message, icon: Icon, className }: SimpleActivityPillProps) {
  return (
    <div className={cn('flex justify-start animate-fade-in', className)}>
      <div className="inline-flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground">
        <Icon className="h-4 w-4 animate-pulse" />
        <span>{message}</span>
        <span className="flex gap-0.5">
          <span
            className="w-1 h-1 rounded-full bg-current animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-1 h-1 rounded-full bg-current animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="w-1 h-1 rounded-full bg-current animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// Typing Indicator (for text streaming)
// =============================================================================

function TypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn('flex justify-start animate-fade-in', className)}>
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

// =============================================================================
// Simple Activity Messages (for tools without ThinkingSteps)
// =============================================================================

const SIMPLE_ACTIVITIES: Record<string, { message: string; icon: React.ElementType }> = {
  confirmBusiness: {
    message: 'Confirming your business...',
    icon: CheckCircle,
  },
  saveProfile: {
    message: 'Saving your profile...',
    icon: Sparkles,
  },
  showProfileReveal: {
    message: 'Preparing your summary...',
    icon: Sparkles,
  },
};

// =============================================================================
// Main Component
// =============================================================================

export function AgentActivityIndicator({
  activeToolCalls,
  isTextStreaming = false,
  className,
}: AgentActivityIndicatorProps) {
  // Get the first active tool that isn't completed yet
  const activeCall = activeToolCalls.find(
    (call) => call.state !== 'output-available'
  );

  // If no active tool and not streaming text, show nothing
  if (!activeCall && !isTextStreaming) {
    return null;
  }

  // If streaming text but no active tool, show simple typing indicator
  if (!activeCall && isTextStreaming) {
    return <TypingIndicator className={className} />;
  }

  const toolName = activeCall!.toolName;

  // Use ThinkingSteps for complex operations
  if (THINKING_STEPS_TOOLS.has(toolName) && TOOL_STEP_CONFIGS[toolName]) {
    const config = TOOL_STEP_CONFIGS[toolName];
    const IconComponent = ICONS[config.icon] || Search;

    return (
      <ThinkingSteps
        title={getToolTitle(toolName)}
        steps={buildStepsForTool(toolName, activeCall!.state, activeCall!.result)}
        isStreaming={activeCall!.state !== 'output-available'}
        summary={getToolSummary(toolName, activeCall!.result)}
        icon={<IconComponent className="h-4 w-4" />}
        className={className}
      />
    );
  }

  // Use simple pill for quick operations
  const simpleActivity = SIMPLE_ACTIVITIES[toolName];
  if (simpleActivity) {
    return (
      <SimpleActivityPill
        message={simpleActivity.message}
        icon={simpleActivity.icon}
        className={className}
      />
    );
  }

  // Default fallback
  return (
    <SimpleActivityPill
      message="Working on it..."
      icon={Loader2}
      className={className}
    />
  );
}
