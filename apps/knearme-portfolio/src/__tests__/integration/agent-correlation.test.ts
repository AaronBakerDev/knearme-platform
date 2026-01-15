/**
 * Integration test for agent logger correlation IDs.
 *
 * Verifies that:
 * 1. Correlation contexts maintain consistent IDs across events
 * 2. Agent hierarchies (parent → child) are properly linked
 * 3. All event types share the same correlation context
 * 4. Multiple agents in a conversation share the same conversationId
 *
 * @see /src/lib/observability/agent-logger.ts - Implementation
 * @see /.claude/ralph/prds/current.json - TEST-002 specification
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createAgentLogger,
  createCorrelationContext,
  withAgentSpan,
  withToolSpan,
  setCurrentContext,
  getCurrentContext,
  type AgentLogEntry,
} from '@/lib/observability/agent-logger';

// Capture console output for verification
let capturedLogs: string[] = [];
const originalLog = console.log;
const originalError = console.error;

describe('Agent Correlation ID Tests', () => {
  beforeEach(() => {
    capturedLogs = [];
    console.log = vi.fn((...args: unknown[]) => {
      capturedLogs.push(args.map(String).join(' '));
    });
    console.error = vi.fn((...args: unknown[]) => {
      capturedLogs.push(args.map(String).join(' '));
    });
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
    setCurrentContext(null);
  });

  describe('Correlation Context Creation', () => {
    it('creates context with consistent conversationId', () => {
      const ctx = createCorrelationContext('conv-abc123', 'biz-xyz');

      expect(ctx.conversationId).toBe('conv-abc123');
      expect(ctx.contractorId).toBe('biz-xyz');
      expect(ctx.requestTraceId).toMatch(/^req_[a-z0-9]+_[a-z0-9]+$/);
    });

    it('creates unique requestTraceId on each call', () => {
      const ctx1 = createCorrelationContext('conv-same', 'biz-same');
      const ctx2 = createCorrelationContext('conv-same', 'biz-same');

      expect(ctx1.conversationId).toBe(ctx2.conversationId);
      expect(ctx1.contractorId).toBe(ctx2.contractorId);
      expect(ctx1.requestTraceId).not.toBe(ctx2.requestTraceId);
    });

    it('includes optional projectId when provided', () => {
      const ctx = createCorrelationContext('conv-123', 'biz-456', 'proj-789');

      expect(ctx.projectId).toBe('proj-789');
    });
  });

  describe('Agent Span Creation', () => {
    it('withAgentSpan creates child context with agentSpanId', () => {
      const parentCtx = createCorrelationContext('conv-parent', 'biz-test');
      const agentCtx = withAgentSpan(parentCtx, 'story-extractor');

      // Parent fields preserved
      expect(agentCtx.conversationId).toBe(parentCtx.conversationId);
      expect(agentCtx.requestTraceId).toBe(parentCtx.requestTraceId);
      expect(agentCtx.contractorId).toBe(parentCtx.contractorId);

      // Agent span added
      expect(agentCtx.agentSpanId).toMatch(/^story-extractor_[a-z0-9]+_[a-z0-9]+$/);
    });

    it('withToolSpan creates child context with toolSpanId', () => {
      const agentCtx = withAgentSpan(
        createCorrelationContext('conv-test', 'biz-test'),
        'content-generator'
      );
      const toolCtx = withToolSpan(agentCtx, 'generate-title');

      // Parent fields preserved
      expect(toolCtx.conversationId).toBe(agentCtx.conversationId);
      expect(toolCtx.requestTraceId).toBe(agentCtx.requestTraceId);
      expect(toolCtx.agentSpanId).toBe(agentCtx.agentSpanId);

      // Tool span added
      expect(toolCtx.toolSpanId).toMatch(/^tool-generate-title_[a-z0-9]+_[a-z0-9]+$/);
    });
  });

  describe('Logger Event Correlation', () => {
    it('all events from same logger share correlation context', () => {
      const ctx = createCorrelationContext('conv-log-test', 'biz-log-test');
      const logger = createAgentLogger('story-extractor', ctx, 'gathering');

      // Log various events
      logger.start({ input: 'test' });
      logger.decision('Made decision', { confidence: 0.9, decision: 'proceed' });
      logger.complete({ output: 'success' });

      // Parse captured logs
      const entries = capturedLogs.map((log) => JSON.parse(log) as AgentLogEntry);

      expect(entries).toHaveLength(3);

      // All entries share the same correlation IDs
      const firstCorrelation = entries[0].correlation;
      for (const entry of entries) {
        expect(entry.correlation.conversationId).toBe(firstCorrelation.conversationId);
        expect(entry.correlation.requestTraceId).toBe(firstCorrelation.requestTraceId);
        expect(entry.correlation.contractorId).toBe(firstCorrelation.contractorId);
        expect(entry.correlation.agentSpanId).toBe(firstCorrelation.agentSpanId);
      }
    });

    it('error events include same correlation as other events', () => {
      const ctx = createCorrelationContext('conv-error-test', 'biz-error-test');
      const logger = createAgentLogger('content-generator', ctx);

      logger.start({ task: 'generate' });
      logger.error(new Error('Generation failed'), { reason: 'timeout' });

      const entries = capturedLogs.map((log) => JSON.parse(log) as AgentLogEntry);

      expect(entries).toHaveLength(2);
      expect(entries[0].correlation.agentSpanId).toBe(entries[1].correlation.agentSpanId);
      expect(entries[1].event.type).toBe('agent_error');
    });

    it('invocationId is consistent across all events', () => {
      const ctx = createCorrelationContext('conv-inv-test', 'biz-inv-test');
      const logger = createAgentLogger('image-analysis', ctx);

      logger.start({});
      logger.decision('Analyzed images', { confidence: 0.85, decision: 'complete' });
      logger.complete({ imageCount: 3 });

      const entries = capturedLogs.map((log) => JSON.parse(log) as AgentLogEntry);
      const invocationId = entries[0].agent.invocationId;

      for (const entry of entries) {
        expect(entry.agent.invocationId).toBe(invocationId);
        expect(entry.agent.name).toBe('image-analysis');
      }
    });
  });

  describe('Multi-Agent Conversation Correlation', () => {
    it('multiple agents in same conversation share conversationId', () => {
      const conversationId = 'conv-multi-agent';
      const contractorId = 'biz-multi';

      // First agent: story-extractor
      const ctx1 = createCorrelationContext(conversationId, contractorId);
      const logger1 = createAgentLogger('story-extractor', ctx1);
      logger1.start({ phase: 'extraction' });
      logger1.complete({ extracted: true });

      // Second agent: content-generator (same conversation)
      const ctx2 = createCorrelationContext(conversationId, contractorId);
      const logger2 = createAgentLogger('content-generator', ctx2);
      logger2.start({ phase: 'generation' });
      logger2.complete({ generated: true });

      const entries = capturedLogs.map((log) => JSON.parse(log) as AgentLogEntry);

      expect(entries).toHaveLength(4);

      // All entries share same conversationId
      for (const entry of entries) {
        expect(entry.correlation.conversationId).toBe(conversationId);
        expect(entry.correlation.contractorId).toBe(contractorId);
      }

      // But they have different requestTraceIds and agentSpanIds
      const storyEntries = entries.filter((e) => e.agent.name === 'story-extractor');
      const contentEntries = entries.filter((e) => e.agent.name === 'content-generator');

      expect(storyEntries[0].correlation.requestTraceId).not.toBe(
        contentEntries[0].correlation.requestTraceId
      );
      expect(storyEntries[0].correlation.agentSpanId).not.toBe(
        contentEntries[0].correlation.agentSpanId
      );
    });
  });

  describe('Context Management', () => {
    it('setCurrentContext and getCurrentContext work correctly', () => {
      const ctx = createCorrelationContext('conv-ctx-test', 'biz-ctx-test');

      expect(getCurrentContext()).toBeNull();

      setCurrentContext(ctx);
      expect(getCurrentContext()).toBe(ctx);

      setCurrentContext(null);
      expect(getCurrentContext()).toBeNull();
    });

    it('getContext returns logger correlation context', () => {
      const ctx = createCorrelationContext('conv-get-ctx', 'biz-get-ctx');
      const logger = createAgentLogger('discovery', ctx);

      const loggerCtx = logger.getContext();

      expect(loggerCtx.conversationId).toBe('conv-get-ctx');
      expect(loggerCtx.contractorId).toBe('biz-get-ctx');
      expect(loggerCtx.agentSpanId).toBeDefined();
    });

    it('getInvocationId returns consistent ID', () => {
      const ctx = createCorrelationContext('conv-inv', 'biz-inv');
      const logger = createAgentLogger('quality-checker', ctx);

      const invId1 = logger.getInvocationId();
      const invId2 = logger.getInvocationId();

      expect(invId1).toBe(invId2);
      expect(invId1).toMatch(/^quality-checker_[a-z0-9]+_[a-z0-9]+$/);
    });
  });

  describe('Event Type Verification', () => {
    it('logs correct event types for each method', () => {
      const ctx = createCorrelationContext('conv-events', 'biz-events');
      const logger = createAgentLogger('orchestrator', ctx);

      logger.start({});
      logger.decision('test decision', { confidence: 0.8, decision: 'test' });
      logger.handoff('content-generator', 'ready for generation');
      logger.complete({});

      const entries = capturedLogs.map((log) => JSON.parse(log) as AgentLogEntry);
      const eventTypes = entries.map((e) => e.event.type);

      expect(eventTypes).toEqual([
        'agent_start',
        'agent_decision',
        'agent_handoff',
        'agent_complete',
      ]);
    });
  });

  describe('Timing Information', () => {
    it('includes timing data in log entries', async () => {
      const ctx = createCorrelationContext('conv-timing', 'biz-timing');
      const logger = createAgentLogger('bio-synthesis', ctx);

      logger.start({});

      // Small delay to ensure duration > 0
      await new Promise((resolve) => setTimeout(resolve, 10));

      logger.complete({}, { prompt: 100, completion: 200 });

      const entries = capturedLogs.map((log) => JSON.parse(log) as AgentLogEntry);
      const completeEntry = entries.find((e) => e.event.type === 'agent_complete');

      expect(completeEntry?.timing).toBeDefined();
      expect(completeEntry?.timing?.startTime).toBeGreaterThan(0);
      expect(completeEntry?.timing?.duration).toBeGreaterThanOrEqual(10);
      expect(completeEntry?.timing?.tokenUsage).toEqual({ prompt: 100, completion: 200 });
    });
  });
});
