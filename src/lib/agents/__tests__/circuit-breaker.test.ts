/**
 * Circuit Breaker Integration Tests
 *
 * Tests the circuit breaker functionality for agent protection:
 * - Circuit opens after threshold failures
 * - Circuit recovers after timeout
 * - Kill-switch activates at 3+ open circuits
 *
 * @see /src/lib/agents/circuit-breaker.ts
 * @see /docs/philosophy/operational-excellence.md - Resilience Strategy
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  canExecute,
  recordSuccess,
  recordFailure,
  getCircuitBreakerStatus,
  getOpenCircuits,
  resetAllCircuitBreakers,
  resetCircuitBreaker,
  withCircuitBreaker,
  isCircuitOpenError,
  type AgentType,
} from '../circuit-breaker';

// Mock the feature flags to track kill-switch activation
vi.mock('@/lib/config/feature-flags', () => ({
  activateKillSwitch: vi.fn(),
}));

// Import the mocked function for assertions
import { activateKillSwitch } from '@/lib/config/feature-flags';

describe('Circuit Breaker', () => {
  beforeEach(() => {
    // Reset all breakers before each test
    resetAllCircuitBreakers();
    vi.clearAllMocks();
    // Use fake timers for timeout testing
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('starts in CLOSED state allowing execution', () => {
      expect(canExecute('discovery')).toBe(true);
      expect(canExecute('story')).toBe(true);
      expect(canExecute('content-generator')).toBe(true);
    });

    it('status only tracks accessed breakers', () => {
      // After resetAllCircuitBreakers(), previously accessed breakers persist
      // But accessing a new type adds it to status
      canExecute('quality');
      const status = getCircuitBreakerStatus();

      // quality should be in status and in CLOSED state
      expect(status.quality).toBeDefined();
      expect(status.quality.state).toBe('CLOSED');
    });

    it('tracks status after first access', () => {
      canExecute('discovery');
      const status = getCircuitBreakerStatus();
      expect(status.discovery).toBeDefined();
      expect(status.discovery.state).toBe('CLOSED');
      expect(status.discovery.failures).toBe(0);
      expect(status.discovery.successes).toBe(0);
    });
  });

  describe('Circuit Opens After Threshold Failures', () => {
    it('opens circuit after 5 failures for default agents', () => {
      const agent: AgentType = 'discovery';
      const error = new Error('API error');

      // Record 4 failures - should still be CLOSED
      for (let i = 0; i < 4; i++) {
        expect(canExecute(agent)).toBe(true);
        recordFailure(agent, error);
      }

      expect(canExecute(agent)).toBe(true); // Still closed at 4 failures
      expect(getCircuitBreakerStatus()[agent].state).toBe('CLOSED');

      // 5th failure should open the circuit
      recordFailure(agent, error);
      expect(canExecute(agent)).toBe(false);
      expect(getCircuitBreakerStatus()[agent].state).toBe('OPEN');
    });

    it('opens circuit after 3 failures for content-generator (stricter threshold)', () => {
      const agent: AgentType = 'content-generator';
      const error = new Error('Generation failed');

      // Record 2 failures - should still be CLOSED
      recordFailure(agent, error);
      recordFailure(agent, error);
      expect(canExecute(agent)).toBe(true);

      // 3rd failure should open the circuit
      recordFailure(agent, error);
      expect(canExecute(agent)).toBe(false);
      expect(getCircuitBreakerStatus()[agent].state).toBe('OPEN');
    });

    it('opens circuit after 3 failures for story agent', () => {
      const agent: AgentType = 'story';
      const error = new Error('Story extraction failed');

      recordFailure(agent, error);
      recordFailure(agent, error);
      expect(canExecute(agent)).toBe(true);

      recordFailure(agent, error);
      expect(canExecute(agent)).toBe(false);
    });

    it('tracks failures in status', () => {
      const agent: AgentType = 'discovery';
      const error = new Error('Test error');

      recordFailure(agent, error);
      recordFailure(agent, error);

      const status = getCircuitBreakerStatus();
      expect(status[agent].failures).toBe(2);
    });
  });

  describe('Circuit Recovers After Timeout', () => {
    it('transitions from OPEN to HALF_OPEN after timeout', () => {
      const agent: AgentType = 'discovery';
      const error = new Error('API error');

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        recordFailure(agent, error);
      }
      expect(canExecute(agent)).toBe(false);
      expect(getCircuitBreakerStatus()[agent].state).toBe('OPEN');

      // Advance time past the timeout (30s for discovery)
      vi.advanceTimersByTime(31000);

      // Should now be HALF_OPEN and allow requests
      expect(canExecute(agent)).toBe(true);
      expect(getCircuitBreakerStatus()[agent].state).toBe('HALF_OPEN');
    });

    it('closes circuit after success threshold in HALF_OPEN', () => {
      const agent: AgentType = 'discovery';
      const error = new Error('API error');

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        recordFailure(agent, error);
      }

      // Wait for HALF_OPEN
      vi.advanceTimersByTime(31000);
      expect(canExecute(agent)).toBe(true);

      // Record 3 successes (successThreshold = 3)
      recordSuccess(agent);
      recordSuccess(agent);
      expect(getCircuitBreakerStatus()[agent].state).toBe('HALF_OPEN');

      recordSuccess(agent);
      expect(getCircuitBreakerStatus()[agent].state).toBe('CLOSED');
      expect(canExecute(agent)).toBe(true);
    });

    it('reopens circuit if failure occurs in HALF_OPEN', () => {
      const agent: AgentType = 'discovery';
      const error = new Error('API error');

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        recordFailure(agent, error);
      }

      // Wait for HALF_OPEN
      vi.advanceTimersByTime(31000);
      expect(canExecute(agent)).toBe(true);

      // Record a failure in HALF_OPEN
      recordFailure(agent, error);
      expect(getCircuitBreakerStatus()[agent].state).toBe('OPEN');
      expect(canExecute(agent)).toBe(false);
    });

    it('uses correct timeout for content-generator (2 minutes)', () => {
      const agent: AgentType = 'content-generator';
      const error = new Error('Generation failed');

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        recordFailure(agent, error);
      }
      expect(canExecute(agent)).toBe(false);

      // Advance 90 seconds - should still be OPEN
      vi.advanceTimersByTime(90000);
      expect(canExecute(agent)).toBe(false);

      // Advance another 30 seconds (total 2 minutes) - should be HALF_OPEN
      vi.advanceTimersByTime(30000);
      expect(canExecute(agent)).toBe(true);
    });
  });

  describe('Kill-Switch Activation', () => {
    it('activates kill-switch when 3+ circuits are open', () => {
      const error = new Error('System failure');

      // Open first circuit (discovery needs 5 failures)
      for (let i = 0; i < 5; i++) {
        recordFailure('discovery', error);
      }
      expect(activateKillSwitch).not.toHaveBeenCalled();

      // Open second circuit (story needs 3 failures)
      for (let i = 0; i < 3; i++) {
        recordFailure('story', error);
      }
      expect(activateKillSwitch).not.toHaveBeenCalled();

      // Open third circuit (content-generator needs 3 failures)
      for (let i = 0; i < 3; i++) {
        recordFailure('content-generator', error);
      }

      // Kill-switch should be activated
      expect(activateKillSwitch).toHaveBeenCalledWith(
        expect.stringContaining('3 agent circuits open'),
        'circuit_breaker'
      );
    });

    it('tracks open circuits correctly', () => {
      const error = new Error('Test error');

      expect(getOpenCircuits()).toEqual([]);

      // Open discovery
      for (let i = 0; i < 5; i++) {
        recordFailure('discovery', error);
      }
      expect(getOpenCircuits()).toContain('discovery');
      expect(getOpenCircuits().length).toBe(1);

      // Open story
      for (let i = 0; i < 3; i++) {
        recordFailure('story', error);
      }
      expect(getOpenCircuits()).toContain('discovery');
      expect(getOpenCircuits()).toContain('story');
      expect(getOpenCircuits().length).toBe(2);
    });
  });

  describe('withCircuitBreaker Wrapper', () => {
    it('executes function when circuit is closed', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await withCircuitBreaker('discovery', fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('throws when circuit is open', async () => {
      const error = new Error('API error');

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        recordFailure('discovery', error);
      }

      await expect(
        withCircuitBreaker('discovery', async () => 'test')
      ).rejects.toThrow('Circuit breaker open');
    });

    it('records success on function completion', async () => {
      await withCircuitBreaker('discovery', async () => 'done');

      const status = getCircuitBreakerStatus();
      expect(status.discovery.successes).toBe(1);
    });

    it('records failure on function error', async () => {
      try {
        await withCircuitBreaker('discovery', async () => {
          throw new Error('Function error');
        });
      } catch {
        // Expected to throw
      }

      const status = getCircuitBreakerStatus();
      expect(status.discovery.failures).toBe(1);
    });

    it('propagates the original error', async () => {
      const originalError = new Error('Original error message');

      await expect(
        withCircuitBreaker('discovery', async () => {
          throw originalError;
        })
      ).rejects.toThrow('Original error message');
    });
  });

  describe('isCircuitOpenError', () => {
    it('returns true for circuit open errors', () => {
      const error = new Error('Circuit breaker open for discovery');
      expect(isCircuitOpenError(error)).toBe(true);
    });

    it('returns false for other errors', () => {
      const error = new Error('API timeout');
      expect(isCircuitOpenError(error)).toBe(false);
    });

    it('returns false for non-Error objects', () => {
      expect(isCircuitOpenError('string error')).toBe(false);
      expect(isCircuitOpenError(null)).toBe(false);
      expect(isCircuitOpenError(undefined)).toBe(false);
    });
  });

  describe('Reset Functions', () => {
    it('resetCircuitBreaker closes an open circuit', () => {
      const error = new Error('Test error');

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        recordFailure('discovery', error);
      }
      expect(canExecute('discovery')).toBe(false);

      // Reset it
      resetCircuitBreaker('discovery');
      expect(canExecute('discovery')).toBe(true);
      expect(getCircuitBreakerStatus().discovery.state).toBe('CLOSED');
      expect(getCircuitBreakerStatus().discovery.failures).toBe(0);
    });

    it('resetAllCircuitBreakers closes all open circuits', () => {
      const error = new Error('Test error');

      // Open multiple circuits
      for (let i = 0; i < 5; i++) {
        recordFailure('discovery', error);
      }
      for (let i = 0; i < 3; i++) {
        recordFailure('story', error);
      }

      expect(getOpenCircuits().length).toBe(2);

      resetAllCircuitBreakers();
      expect(getOpenCircuits().length).toBe(0);
    });
  });

  describe('Window Reset', () => {
    it('resets failure count after window expires', () => {
      const agent: AgentType = 'discovery';
      const error = new Error('Test error');

      // Record some failures (but not enough to open)
      recordFailure(agent, error);
      recordFailure(agent, error);
      recordFailure(agent, error);
      expect(getCircuitBreakerStatus()[agent].failures).toBe(3);

      // Advance past the window size (2 minutes for default)
      vi.advanceTimersByTime(121000);

      // Check state - this should reset the window
      canExecute(agent);
      expect(getCircuitBreakerStatus()[agent].failures).toBe(0);
    });
  });
});
