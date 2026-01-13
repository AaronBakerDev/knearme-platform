/**
 * Smoke test for Langfuse OpenTelemetry tracing configuration.
 *
 * These tests verify that:
 * 1. Langfuse configuration is correctly read from environment variables
 * 2. The LangfuseExporter is properly initialized
 * 3. Telemetry config is correctly generated for AI SDK calls
 *
 * Note: These tests check configuration, not actual trace delivery.
 * For full E2E verification, use the VERIFY-001 manual test procedure.
 *
 * @see /src/lib/observability/langfuse.ts - Implementation
 * @see /src/instrumentation.ts - Next.js integration
 * @see /.claude/ralph/prds/current.json - TEST-001 specification
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock environment before importing the module
const originalEnv = process.env;

describe('Langfuse Tracing Configuration', () => {
  beforeEach(() => {
    // Reset environment for each test
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isLangfuseEnabled()', () => {
    it('returns true when both keys are set', async () => {
      process.env.LANGFUSE_PUBLIC_KEY = 'pk-lf-test-key';
      process.env.LANGFUSE_SECRET_KEY = 'sk-lf-test-key';
      delete process.env.LANGFUSE_ENABLED;

      const { isLangfuseEnabled } = await import('@/lib/observability/langfuse');
      expect(isLangfuseEnabled()).toBe(true);
    });

    it('returns false when public key is missing', async () => {
      delete process.env.LANGFUSE_PUBLIC_KEY;
      process.env.LANGFUSE_SECRET_KEY = 'sk-lf-test-key';

      const { isLangfuseEnabled } = await import('@/lib/observability/langfuse');
      expect(isLangfuseEnabled()).toBe(false);
    });

    it('returns false when secret key is missing', async () => {
      process.env.LANGFUSE_PUBLIC_KEY = 'pk-lf-test-key';
      delete process.env.LANGFUSE_SECRET_KEY;

      const { isLangfuseEnabled } = await import('@/lib/observability/langfuse');
      expect(isLangfuseEnabled()).toBe(false);
    });

    it('returns false when explicitly disabled', async () => {
      process.env.LANGFUSE_PUBLIC_KEY = 'pk-lf-test-key';
      process.env.LANGFUSE_SECRET_KEY = 'sk-lf-test-key';
      process.env.LANGFUSE_ENABLED = 'false';

      const { isLangfuseEnabled } = await import('@/lib/observability/langfuse');
      expect(isLangfuseEnabled()).toBe(false);
    });

    it('returns true when LANGFUSE_ENABLED is set to anything except false', async () => {
      process.env.LANGFUSE_PUBLIC_KEY = 'pk-lf-test-key';
      process.env.LANGFUSE_SECRET_KEY = 'sk-lf-test-key';
      process.env.LANGFUSE_ENABLED = 'true';

      const { isLangfuseEnabled } = await import('@/lib/observability/langfuse');
      expect(isLangfuseEnabled()).toBe(true);
    });
  });

  describe('getLangfuseExporter()', () => {
    it('returns null when Langfuse is disabled', async () => {
      delete process.env.LANGFUSE_PUBLIC_KEY;
      delete process.env.LANGFUSE_SECRET_KEY;

      const { getLangfuseExporter } = await import('@/lib/observability/langfuse');
      expect(getLangfuseExporter()).toBeNull();
    });

    it('returns LangfuseExporter instance when enabled', async () => {
      process.env.LANGFUSE_PUBLIC_KEY = 'pk-lf-test-key';
      process.env.LANGFUSE_SECRET_KEY = 'sk-lf-test-key';

      const { getLangfuseExporter } = await import('@/lib/observability/langfuse');
      const exporter = getLangfuseExporter();

      expect(exporter).not.toBeNull();
      expect(exporter).toHaveProperty('export');
      expect(exporter).toHaveProperty('forceFlush');
      expect(exporter).toHaveProperty('shutdown');
    });

    it('returns singleton instance on multiple calls', async () => {
      process.env.LANGFUSE_PUBLIC_KEY = 'pk-lf-test-key';
      process.env.LANGFUSE_SECRET_KEY = 'sk-lf-test-key';

      const { getLangfuseExporter } = await import('@/lib/observability/langfuse');
      const exporter1 = getLangfuseExporter();
      const exporter2 = getLangfuseExporter();

      expect(exporter1).toBe(exporter2);
    });
  });

  describe('getTelemetryConfig()', () => {
    it('returns disabled config when Langfuse is not configured', async () => {
      delete process.env.LANGFUSE_PUBLIC_KEY;
      delete process.env.LANGFUSE_SECRET_KEY;

      const { getTelemetryConfig } = await import('@/lib/observability/langfuse');
      const config = getTelemetryConfig();

      expect(config.isEnabled).toBe(false);
      expect(config.functionId).toBe('chat-completion');
    });

    it('returns enabled config when Langfuse is configured', async () => {
      process.env.LANGFUSE_PUBLIC_KEY = 'pk-lf-test-key';
      process.env.LANGFUSE_SECRET_KEY = 'sk-lf-test-key';

      const { getTelemetryConfig } = await import('@/lib/observability/langfuse');
      const config = getTelemetryConfig();

      expect(config.isEnabled).toBe(true);
    });

    it('uses provided functionId', async () => {
      process.env.LANGFUSE_PUBLIC_KEY = 'pk-lf-test-key';
      process.env.LANGFUSE_SECRET_KEY = 'sk-lf-test-key';

      const { getTelemetryConfig } = await import('@/lib/observability/langfuse');
      const config = getTelemetryConfig({ functionId: 'story-extractor' });

      expect(config.functionId).toBe('story-extractor');
    });

    it('includes metadata when provided', async () => {
      process.env.LANGFUSE_PUBLIC_KEY = 'pk-lf-test-key';
      process.env.LANGFUSE_SECRET_KEY = 'sk-lf-test-key';

      const { getTelemetryConfig } = await import('@/lib/observability/langfuse');
      const metadata = {
        agent: 'content-generator',
        phase: 'generating',
        projectType: 'masonry',
      };
      const config = getTelemetryConfig({ metadata });

      expect(config.metadata).toEqual(metadata);
    });
  });

  describe('Lifecycle functions', () => {
    it('flushLangfuse() completes without error when disabled', async () => {
      delete process.env.LANGFUSE_PUBLIC_KEY;
      delete process.env.LANGFUSE_SECRET_KEY;

      const { flushLangfuse } = await import('@/lib/observability/langfuse');
      await expect(flushLangfuse()).resolves.toBeUndefined();
    });

    it('shutdownLangfuse() completes without error when disabled', async () => {
      delete process.env.LANGFUSE_PUBLIC_KEY;
      delete process.env.LANGFUSE_SECRET_KEY;

      const { shutdownLangfuse } = await import('@/lib/observability/langfuse');
      await expect(shutdownLangfuse()).resolves.toBeUndefined();
    });
  });
});

describe('Agent Logger Integration', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('createAgentLogger returns valid logger object', async () => {
    const { createAgentLogger, createCorrelationContext } = await import(
      '@/lib/observability/agent-logger'
    );

    const ctx = createCorrelationContext('conv-123', 'biz-456', 'proj-789');
    const logger = createAgentLogger('story-extractor', ctx, 'extraction');

    expect(logger).toHaveProperty('start');
    expect(logger).toHaveProperty('decision');
    expect(logger).toHaveProperty('complete');
    expect(logger).toHaveProperty('error');
  });

  it('createCorrelationContext generates unique IDs', async () => {
    const { createCorrelationContext } = await import(
      '@/lib/observability/agent-logger'
    );

    const ctx1 = createCorrelationContext('conv-123', 'biz-456');
    const ctx2 = createCorrelationContext('conv-123', 'biz-456');

    expect(ctx1.conversationId).toBe('conv-123');
    expect(ctx1.contractorId).toBe('biz-456');
    // Each call should generate unique trace IDs
    expect(ctx1.requestTraceId).toBeDefined();
    expect(ctx2.requestTraceId).toBeDefined();
    expect(ctx1.requestTraceId).not.toBe(ctx2.requestTraceId);
  });

  it('logger methods execute without throwing', async () => {
    const { createAgentLogger, createCorrelationContext } = await import(
      '@/lib/observability/agent-logger'
    );

    const ctx = createCorrelationContext('conv-test', 'biz-test');
    const logger = createAgentLogger('test-agent', ctx, 'testing');

    // These should not throw
    expect(() => logger.start({ testKey: 'testValue' })).not.toThrow();
    expect(() =>
      logger.decision('Test decision', {
        confidence: 0.9,
        decision: 'proceed',
      })
    ).not.toThrow();
    expect(() => logger.complete({ result: 'success' })).not.toThrow();
    expect(() => logger.error(new Error('Test error'), { code: 'TEST' })).not.toThrow();
  });
});
