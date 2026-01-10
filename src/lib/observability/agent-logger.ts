/**
 * Agent-Specific Logging with Correlation IDs
 *
 * Provides structured logging for multi-agent systems with:
 * - Hierarchical trace IDs linking conversation → request → agent → tool
 * - Agent lifecycle events (start, decision, handoff, complete)
 * - Decision capture for debugging "why did the agent do that?"
 *
 * Integrates with existing Langfuse tracing for production observability.
 *
 * @see /docs/philosophy/operational-excellence.md - Observability Strategy
 */

import type { AgentType } from '@/lib/agents/circuit-breaker';

// =============================================================================
// Types
// =============================================================================

/**
 * Agent phases (informational, not gating)
 */
export type AgentPhase =
  | 'gathering'
  | 'images'
  | 'generating'
  | 'review'
  | 'ready';

/**
 * Agent event types for structured logging
 */
export type AgentEventType =
  | 'agent_start'
  | 'agent_decision'
  | 'agent_handoff'
  | 'tool_call'
  | 'tool_result'
  | 'agent_complete'
  | 'agent_error';

/**
 * Correlation context for tracing across agents
 */
export interface CorrelationContext {
  /** Root conversation/session ID */
  conversationId: string;
  /** Per-request trace ID */
  requestTraceId: string;
  /** Current agent invocation ID */
  agentSpanId?: string;
  /** Current tool call ID */
  toolSpanId?: string;
  /** Project being worked on */
  projectId?: string;
  /** Contractor for RLS context */
  contractorId: string;
}

/**
 * Agent log entry structure
 */
export interface AgentLogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';

  agent: {
    name: AgentType;
    phase: AgentPhase;
    invocationId: string;
  };

  correlation: CorrelationContext;

  event: {
    type: AgentEventType;
    message: string;
    data?: Record<string, unknown>;
  };

  timing?: {
    startTime: number;
    duration?: number;
    tokenUsage?: { prompt: number; completion: number };
  };
}

/**
 * Agent reasoning capture for decision transparency
 */
export interface AgentReasoning {
  agentName: AgentType;
  invocationId: string;

  observations: string[];
  considerations: string[];
  decision: string;
  confidence: number;
  alternatives?: string[];
}

// =============================================================================
// Correlation Context Management
// =============================================================================

let currentContext: CorrelationContext | null = null;

/**
 * Create a new correlation context for a conversation
 */
export function createCorrelationContext(
  conversationId: string,
  contractorId: string,
  projectId?: string
): CorrelationContext {
  return {
    conversationId,
    requestTraceId: generateId('req'),
    projectId,
    contractorId,
  };
}

/**
 * Create a child context for an agent invocation
 */
export function withAgentSpan(
  ctx: CorrelationContext,
  agentName: AgentType
): CorrelationContext {
  return {
    ...ctx,
    agentSpanId: generateId(`${agentName}`),
    toolSpanId: undefined, // Clear tool span when starting new agent
  };
}

/**
 * Create a child context for a tool call
 */
export function withToolSpan(
  ctx: CorrelationContext,
  toolName: string
): CorrelationContext {
  return {
    ...ctx,
    toolSpanId: generateId(`tool-${toolName}`),
  };
}

/**
 * Set the current context (for async context propagation)
 */
export function setCurrentContext(ctx: CorrelationContext | null): void {
  currentContext = ctx;
}

/**
 * Get the current context
 */
export function getCurrentContext(): CorrelationContext | null {
  return currentContext;
}

// =============================================================================
// Agent Logger
// =============================================================================

class AgentLogger {
  private agentName: AgentType;
  private phase: AgentPhase;
  private invocationId: string;
  private startTime: number;
  private context: CorrelationContext;

  constructor(
    agentName: AgentType,
    context: CorrelationContext,
    phase: AgentPhase = 'gathering'
  ) {
    this.agentName = agentName;
    this.phase = phase;
    this.invocationId = context.agentSpanId || generateId(agentName);
    this.startTime = Date.now();
    this.context = {
      ...context,
      agentSpanId: this.invocationId,
    };
  }

  private log(
    level: AgentLogEntry['level'],
    eventType: AgentEventType,
    message: string,
    data?: Record<string, unknown>
  ): void {
    const entry: AgentLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      agent: {
        name: this.agentName,
        phase: this.phase,
        invocationId: this.invocationId,
      },
      correlation: this.context,
      event: {
        type: eventType,
        message,
        data,
      },
      timing: {
        startTime: this.startTime,
        duration: Date.now() - this.startTime,
      },
    };

    // Log as structured JSON for parsing by observability tools
    const logFn =
      level === 'error'
        ? console.error
        : level === 'warn'
          ? console.warn
          : level === 'debug'
            ? console.debug
            : console.log;

    logFn(JSON.stringify(entry));
  }

  /** Log agent start */
  start(inputData?: Record<string, unknown>): void {
    this.log('info', 'agent_start', `${this.agentName} started`, inputData);
  }

  /** Log a decision point */
  decision(
    decision: string,
    reasoning?: Partial<AgentReasoning>
  ): void {
    this.log('info', 'agent_decision', decision, {
      reasoning,
    });
  }

  /** Log a handoff to another agent */
  handoff(
    toAgent: AgentType,
    reason: string,
    sharedState?: Record<string, unknown>
  ): void {
    this.log('info', 'agent_handoff', `Handing off to ${toAgent}: ${reason}`, {
      toAgent,
      reason,
      sharedState,
    });
  }

  /** Log a tool call */
  toolCall(
    toolName: string,
    args: Record<string, unknown>
  ): string {
    const toolSpanId = generateId(`tool-${toolName}`);
    this.log('debug', 'tool_call', `Calling tool: ${toolName}`, {
      toolName,
      args,
      toolSpanId,
    });
    return toolSpanId;
  }

  /** Log a tool result */
  toolResult(
    toolName: string,
    toolSpanId: string,
    result: unknown,
    durationMs: number
  ): void {
    this.log('debug', 'tool_result', `Tool ${toolName} completed`, {
      toolName,
      toolSpanId,
      resultSummary: summarizeResult(result),
      durationMs,
    });
  }

  /** Log agent completion */
  complete(
    outputData?: Record<string, unknown>,
    tokenUsage?: { prompt: number; completion: number }
  ): void {
    const entry: AgentLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      agent: {
        name: this.agentName,
        phase: this.phase,
        invocationId: this.invocationId,
      },
      correlation: this.context,
      event: {
        type: 'agent_complete',
        message: `${this.agentName} completed`,
        data: outputData,
      },
      timing: {
        startTime: this.startTime,
        duration: Date.now() - this.startTime,
        tokenUsage,
      },
    };

    console.log(JSON.stringify(entry));
  }

  /** Log an error */
  error(error: Error, data?: Record<string, unknown>): void {
    this.log('error', 'agent_error', error.message, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...data,
    });
  }

  /** Log debug information */
  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', 'agent_decision', message, data);
  }

  /** Log a warning */
  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', 'agent_decision', message, data);
  }

  /** Update the current phase */
  setPhase(phase: AgentPhase): void {
    this.phase = phase;
  }

  /** Get the invocation ID for this logger instance */
  getInvocationId(): string {
    return this.invocationId;
  }

  /** Get the correlation context */
  getContext(): CorrelationContext {
    return this.context;
  }
}

/**
 * Create a logger for an agent invocation
 *
 * @example
 * ```typescript
 * const ctx = createCorrelationContext(sessionId, contractorId);
 * const logger = createAgentLogger('story-extractor', ctx);
 *
 * logger.start({ messageCount: 5 });
 * logger.decision('Extracted project type', { projectType: 'chimney-rebuild' });
 * logger.complete({ fieldsExtracted: 4 });
 * ```
 */
export function createAgentLogger(
  agentName: AgentType,
  context: CorrelationContext,
  phase?: AgentPhase
): AgentLogger {
  return new AgentLogger(agentName, context, phase);
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Generate a short unique ID for tracing
 */
function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Summarize a result object for logging (avoid huge payloads)
 */
function summarizeResult(result: unknown): Record<string, unknown> {
  if (result === null || result === undefined) {
    return { type: 'null' };
  }

  if (typeof result !== 'object') {
    return { type: typeof result, value: String(result).substring(0, 100) };
  }

  if (Array.isArray(result)) {
    return { type: 'array', length: result.length };
  }

  const obj = result as Record<string, unknown>;
  const keys = Object.keys(obj);
  const summary: Record<string, unknown> = {
    type: 'object',
    keys: keys.slice(0, 10),
  };

  if (obj.success !== undefined) summary.success = obj.success;
  if (obj.error !== undefined) summary.error = String(obj.error).substring(0, 100);

  return summary;
}

// =============================================================================
// Quick Logging Functions (for simpler cases)
// =============================================================================

/**
 * Log an agent event without creating a full logger
 */
export function logAgentEvent(
  agentName: AgentType,
  eventType: AgentEventType,
  message: string,
  data?: Record<string, unknown>
): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level: 'info',
    agent: { name: agentName },
    event: { type: eventType, message, data },
  };

  console.log(JSON.stringify(entry));
}

/**
 * Log an agent error without creating a full logger
 */
export function logAgentError(
  agentName: AgentType,
  error: Error,
  context?: Record<string, unknown>
): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    agent: { name: agentName },
    event: {
      type: 'agent_error',
      message: error.message,
      data: {
        error: { name: error.name, message: error.message, stack: error.stack },
        ...context,
      },
    },
  };

  console.error(JSON.stringify(entry));
}
