/**
 * Circuit Breaker for AI Agent Operations
 *
 * Provides automatic protection against cascading failures in the agent system.
 * Each agent type has its own circuit breaker to allow granular control.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failures exceeded threshold, requests fail fast
 * - HALF_OPEN: Testing if service recovered
 *
 * @see /docs/philosophy/operational-excellence.md - Resilience Strategy
 * @see /docs/philosophy/implementation-roadmap.md - Risk Mitigation
 */

import { activateKillSwitch } from '@/lib/config/feature-flags';

// =============================================================================
// Types
// =============================================================================

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Agent types that have their own circuit breaker
 */
export type AgentType =
  | 'discovery'
  | 'story-extractor'
  | 'content-generator'
  | 'quality-checker'
  | 'layout-composer'
  | 'ui-composer'
  | 'orchestrator';

interface CircuitBreakerConfig {
  /** Failures before opening circuit */
  failureThreshold: number;
  /** Successes in HALF_OPEN to close circuit */
  successThreshold: number;
  /** MS before OPEN -> HALF_OPEN */
  timeout: number;
  /** MS window to track failures */
  windowSize: number;
}

interface CircuitMetrics {
  failures: number;
  successes: number;
  lastFailure: Date | null;
  lastSuccess: Date | null;
  windowStart: Date;
}

interface CircuitBreakerState {
  state: CircuitState;
  metrics: CircuitMetrics;
  config: CircuitBreakerConfig;
  openedAt: Date | null;
}

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,   // 5 failures to open
  successThreshold: 3,   // 3 successes to close
  timeout: 60000,        // 1 minute before testing recovery
  windowSize: 120000,    // 2 minute window for counting failures
};

/**
 * Custom config per agent type
 *
 * More critical agents have stricter thresholds.
 */
const AGENT_CONFIGS: Partial<Record<AgentType, Partial<CircuitBreakerConfig>>> = {
  'content-generator': {
    failureThreshold: 3,  // Content generation is critical
    timeout: 120000,      // Wait longer before retry
  },
  'discovery': {
    failureThreshold: 5,  // External API, more lenient
    timeout: 30000,       // Faster recovery attempt
  },
};

// =============================================================================
// State Management
// =============================================================================

/** Per-agent circuit breaker states (in-memory) */
const circuitBreakers: Map<AgentType, CircuitBreakerState> = new Map();

function getOrCreateBreaker(agent: AgentType): CircuitBreakerState {
  if (!circuitBreakers.has(agent)) {
    const customConfig = AGENT_CONFIGS[agent] || {};
    circuitBreakers.set(agent, {
      state: 'CLOSED',
      metrics: {
        failures: 0,
        successes: 0,
        lastFailure: null,
        lastSuccess: null,
        windowStart: new Date(),
      },
      config: { ...DEFAULT_CONFIG, ...customConfig },
      openedAt: null,
    });
  }
  return circuitBreakers.get(agent)!;
}

function updateCircuitState(breaker: CircuitBreakerState): void {
  const now = Date.now();

  // Reset metrics if outside window
  if (now - breaker.metrics.windowStart.getTime() > breaker.config.windowSize) {
    breaker.metrics = {
      failures: 0,
      successes: 0,
      lastFailure: null,
      lastSuccess: null,
      windowStart: new Date(),
    };
  }

  // Check if OPEN circuit should transition to HALF_OPEN
  if (breaker.state === 'OPEN' && breaker.openedAt) {
    const elapsed = now - breaker.openedAt.getTime();
    if (elapsed >= breaker.config.timeout) {
      breaker.state = 'HALF_OPEN';
      breaker.metrics.successes = 0;
      console.info(`[Circuit Breaker] Transitioning to HALF_OPEN after ${Math.round(elapsed / 1000)}s`);
    }
  }
}

function openCircuit(breaker: CircuitBreakerState, agent: AgentType): void {
  breaker.state = 'OPEN';
  breaker.openedAt = new Date();
  console.error(`[Circuit Breaker] ${agent} circuit OPENED after ${breaker.metrics.failures} failures`);

  // Check if we should trigger kill switch
  const openCount = Array.from(circuitBreakers.values()).filter(
    (b) => b.state === 'OPEN'
  ).length;

  if (openCount >= 3) {
    console.error(
      `[Circuit Breaker] ${openCount} circuits open, activating kill switch`
    );
    activateKillSwitch(
      `${openCount} agent circuits open: ${getOpenCircuits().join(', ')}`,
      'circuit_breaker'
    );
  }
}

function closeCircuit(breaker: CircuitBreakerState, agent: AgentType): void {
  breaker.state = 'CLOSED';
  breaker.openedAt = null;
  breaker.metrics = {
    failures: 0,
    successes: 0,
    lastFailure: null,
    lastSuccess: null,
    windowStart: new Date(),
  };
  console.info(`[Circuit Breaker] ${agent} circuit CLOSED`);
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Check if circuit allows request
 *
 * @param agent - The agent type to check
 * @returns true if request should proceed, false to fail fast
 *
 * @example
 * ```typescript
 * if (!canExecute('content-generator')) {
 *   return { error: 'Service temporarily unavailable' };
 * }
 * // Proceed with request...
 * ```
 */
export function canExecute(agent: AgentType): boolean {
  const breaker = getOrCreateBreaker(agent);
  updateCircuitState(breaker);

  switch (breaker.state) {
    case 'CLOSED':
      return true;
    case 'OPEN':
      return false;
    case 'HALF_OPEN':
      return true; // Allow test request
    default:
      return true;
  }
}

/**
 * Record a successful operation
 *
 * @param agent - The agent type that succeeded
 */
export function recordSuccess(agent: AgentType): void {
  const breaker = getOrCreateBreaker(agent);
  breaker.metrics.successes++;
  breaker.metrics.lastSuccess = new Date();

  if (breaker.state === 'HALF_OPEN') {
    if (breaker.metrics.successes >= breaker.config.successThreshold) {
      closeCircuit(breaker, agent);
    }
  }
}

/**
 * Record a failed operation
 *
 * @param agent - The agent type that failed
 * @param error - The error that occurred
 */
export function recordFailure(agent: AgentType, error: Error): void {
  const breaker = getOrCreateBreaker(agent);
  breaker.metrics.failures++;
  breaker.metrics.lastFailure = new Date();

  console.warn(`[Circuit Breaker] ${agent} failure: ${error.message}`, {
    failures: breaker.metrics.failures,
    threshold: breaker.config.failureThreshold,
    state: breaker.state,
  });

  if (breaker.state === 'CLOSED') {
    if (breaker.metrics.failures >= breaker.config.failureThreshold) {
      openCircuit(breaker, agent);
    }
  } else if (breaker.state === 'HALF_OPEN') {
    // Any failure in HALF_OPEN reopens circuit
    openCircuit(breaker, agent);
  }
}

/**
 * Get current state of all circuit breakers
 */
export function getCircuitBreakerStatus(): Record<
  AgentType,
  { state: CircuitState; failures: number; successes: number }
> {
  const status: Record<string, { state: CircuitState; failures: number; successes: number }> = {};

  for (const [agent, breaker] of circuitBreakers) {
    updateCircuitState(breaker);
    status[agent] = {
      state: breaker.state,
      failures: breaker.metrics.failures,
      successes: breaker.metrics.successes,
    };
  }

  return status as Record<AgentType, { state: CircuitState; failures: number; successes: number }>;
}

/**
 * Get list of currently open circuits
 */
export function getOpenCircuits(): AgentType[] {
  const open: AgentType[] = [];
  for (const [agent, breaker] of circuitBreakers) {
    updateCircuitState(breaker);
    if (breaker.state === 'OPEN') {
      open.push(agent);
    }
  }
  return open;
}

/**
 * Manually reset a circuit breaker
 *
 * Use with caution - only for admin/debug purposes.
 *
 * @param agent - The agent type to reset
 */
export function resetCircuitBreaker(agent: AgentType): void {
  const breaker = getOrCreateBreaker(agent);
  closeCircuit(breaker, agent);
}

/**
 * Reset all circuit breakers
 *
 * Use with caution - only for admin/debug purposes.
 */
export function resetAllCircuitBreakers(): void {
  for (const [agent, breaker] of circuitBreakers) {
    closeCircuit(breaker, agent);
  }
}

// =============================================================================
// Wrapper Helper
// =============================================================================

/**
 * Execute a function with circuit breaker protection
 *
 * Automatically records success/failure and handles open circuits.
 *
 * @param agent - The agent type executing
 * @param fn - The function to execute
 * @returns The function result or throws if circuit is open
 *
 * @example
 * ```typescript
 * const result = await withCircuitBreaker('content-generator', async () => {
 *   return await generateContent(state);
 * });
 * ```
 */
export async function withCircuitBreaker<T>(
  agent: AgentType,
  fn: () => Promise<T>
): Promise<T> {
  if (!canExecute(agent)) {
    throw new Error(
      `Circuit breaker open for ${agent}. Service temporarily unavailable.`
    );
  }

  try {
    const result = await fn();
    recordSuccess(agent);
    return result;
  } catch (error) {
    recordFailure(agent, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Check if an error indicates circuit is open
 */
export function isCircuitOpenError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes('Circuit breaker open')
  );
}
