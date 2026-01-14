# Performance Monitoring for Claude Agent SDK

This guide covers comprehensive monitoring, observability, and cost tracking for Claude Agent SDK applications.

---

## Table of Contents

1. [Built-in SDK Metrics](#1-built-in-sdk-metrics)
2. [OpenTelemetry Integration](#2-opentelemetry-integration)
3. [Langfuse Integration](#3-langfuse-integration)
4. [Key Metrics to Track](#4-key-metrics-to-track)
5. [Setting Up Dashboards](#5-setting-up-dashboards)
6. [Session Analytics](#6-session-analytics)
7. [Cost Tracking](#7-cost-tracking)
8. [Alerting](#8-alerting)
9. [Logging Best Practices](#9-logging-best-practices)

---

## 1. Built-in SDK Metrics

The Claude Agent SDK provides built-in metrics through result messages.

### Capturing Metrics from Result Messages

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

interface QueryMetrics {
  sessionId: string;
  totalCostUsd: number;
  durationMs: number;
  status: "success" | "error_max_turns" | "error_during_execution";
  turnCount: number;
  toolUsage: Record<string, number>;
}

async function queryWithMetrics(
  prompt: string,
  options: QueryOptions
): Promise<{ result: string; metrics: QueryMetrics }> {
  const metrics: QueryMetrics = {
    sessionId: "",
    totalCostUsd: 0,
    durationMs: 0,
    status: "success",
    turnCount: 0,
    toolUsage: {},
  };

  let result = "";
  const startTime = Date.now();

  for await (const message of query({ prompt, options })) {
    // Capture session ID from init message
    if (message.type === "system" && message.subtype === "init") {
      metrics.sessionId = message.session_id;
    }

    // Track tool usage
    if (message.type === "assistant" && "message" in message) {
      for (const block of message.message.content) {
        if ("type" in block && block.type === "tool_use") {
          const toolName = block.name;
          metrics.toolUsage[toolName] = (metrics.toolUsage[toolName] || 0) + 1;
        }
      }
      metrics.turnCount++;
    }

    // Capture final metrics from result message
    if (message.type === "result") {
      metrics.totalCostUsd = message.total_cost_usd;
      metrics.durationMs = message.duration_ms;
      metrics.status = message.subtype as QueryMetrics["status"];
      result = message.result || "";
    }
  }

  // Calculate actual wall-clock time (may differ from SDK duration)
  const actualDurationMs = Date.now() - startTime;

  console.log(`[Metrics] Session: ${metrics.sessionId}`);
  console.log(`[Metrics] Cost: $${metrics.totalCostUsd.toFixed(4)}`);
  console.log(`[Metrics] Duration: ${metrics.durationMs}ms (SDK) / ${actualDurationMs}ms (wall)`);
  console.log(`[Metrics] Status: ${metrics.status}`);
  console.log(`[Metrics] Turns: ${metrics.turnCount}`);
  console.log(`[Metrics] Tools:`, metrics.toolUsage);

  return { result, metrics };
}
```

### Result Message Structure

| Field | Type | Description |
|-------|------|-------------|
| `total_cost_usd` | `number` | Total cost of the query in USD |
| `duration_ms` | `number` | Execution time in milliseconds |
| `subtype` | `string` | Query status: `success`, `error_max_turns`, `error_during_execution` |
| `result` | `string` | Final response text |
| `session_id` | `string` | Session identifier (in init message) |

### Metrics Aggregation Class

```typescript
/**
 * Aggregates metrics across multiple queries for reporting.
 *
 * @see https://docs.anthropic.com/claude-code/agent-sdk#metrics
 */
class MetricsAggregator {
  private metrics: QueryMetrics[] = [];

  add(metric: QueryMetrics): void {
    this.metrics.push(metric);
  }

  getLatencyPercentiles(): { p50: number; p95: number; p99: number } {
    const sorted = [...this.metrics]
      .map((m) => m.durationMs)
      .sort((a, b) => a - b);
    const len = sorted.length;

    return {
      p50: sorted[Math.floor(len * 0.5)] || 0,
      p95: sorted[Math.floor(len * 0.95)] || 0,
      p99: sorted[Math.floor(len * 0.99)] || 0,
    };
  }

  getTotalCost(): number {
    return this.metrics.reduce((sum, m) => sum + m.totalCostUsd, 0);
  }

  getSuccessRate(): number {
    const successful = this.metrics.filter((m) => m.status === "success").length;
    return this.metrics.length > 0 ? successful / this.metrics.length : 0;
  }

  getToolUsageStats(): Record<string, { count: number; avgPerQuery: number }> {
    const toolCounts: Record<string, number> = {};

    for (const m of this.metrics) {
      for (const [tool, count] of Object.entries(m.toolUsage)) {
        toolCounts[tool] = (toolCounts[tool] || 0) + count;
      }
    }

    const stats: Record<string, { count: number; avgPerQuery: number }> = {};
    for (const [tool, count] of Object.entries(toolCounts)) {
      stats[tool] = {
        count,
        avgPerQuery: count / this.metrics.length,
      };
    }

    return stats;
  }

  getSummary(): object {
    return {
      totalQueries: this.metrics.length,
      totalCostUsd: this.getTotalCost(),
      successRate: this.getSuccessRate(),
      latency: this.getLatencyPercentiles(),
      toolUsage: this.getToolUsageStats(),
    };
  }
}
```

---

## 2. OpenTelemetry Integration

OpenTelemetry provides vendor-neutral observability for distributed tracing, metrics, and logs.

### Environment Variables

```bash
# Enable telemetry in Claude SDK
CLAUDE_CODE_ENABLE_TELEMETRY=1

# Configure OTLP exporters
OTEL_METRICS_EXPORTER=otlp
OTEL_LOGS_EXPORTER=otlp
OTEL_TRACES_EXPORTER=otlp
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

# Optional: Service identification
OTEL_SERVICE_NAME=my-agent
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=production,service.version=1.0.0
```

### Setting Up OpenTelemetry

```typescript
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-grpc";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { Resource } from "@opentelemetry/resources";
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

/**
 * Initialize OpenTelemetry SDK for agent monitoring.
 * Must be called before any other imports/code.
 *
 * @see https://opentelemetry.io/docs/instrumentation/js/getting-started/nodejs/
 */
function initTelemetry(): NodeSDK {
  const sdk = new NodeSDK({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || "claude-agent",
      [SEMRESATTRS_SERVICE_VERSION]: process.env.npm_package_version || "1.0.0",
    }),
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4317",
    }),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4317",
      }),
      exportIntervalMillis: 60000, // Export every 60 seconds
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false }, // Reduce noise
      }),
    ],
  });

  sdk.start();
  console.log("[Telemetry] OpenTelemetry SDK initialized");

  // Graceful shutdown
  process.on("SIGTERM", () => {
    sdk.shutdown()
      .then(() => console.log("[Telemetry] SDK shut down"))
      .catch((err) => console.error("[Telemetry] Shutdown error", err))
      .finally(() => process.exit(0));
  });

  return sdk;
}

// Initialize at startup
initTelemetry();
```

### Custom Spans and Metrics

```typescript
import { trace, metrics, SpanStatusCode } from "@opentelemetry/api";

const tracer = trace.getTracer("claude-agent");
const meter = metrics.getMeter("claude-agent");

// Create custom metrics
const queryCounter = meter.createCounter("agent.queries.total", {
  description: "Total number of agent queries",
});

const queryDuration = meter.createHistogram("agent.query.duration_ms", {
  description: "Query duration in milliseconds",
  unit: "ms",
});

const queryCost = meter.createHistogram("agent.query.cost_usd", {
  description: "Query cost in USD",
  unit: "usd",
});

const activeQueries = meter.createUpDownCounter("agent.queries.active", {
  description: "Number of currently active queries",
});

/**
 * Execute a query with full OpenTelemetry instrumentation.
 * Creates spans for the overall query and each tool invocation.
 */
async function queryWithTracing(
  prompt: string,
  options: QueryOptions,
  userId?: string
): Promise<{ result: string; metrics: QueryMetrics }> {
  return tracer.startActiveSpan("agent.query", async (span) => {
    // Set span attributes
    span.setAttribute("user.id", userId || "anonymous");
    span.setAttribute("agent.model", options.model || "claude-sonnet-4-5-20250929");
    span.setAttribute("agent.max_turns", options.maxTurns || 100);
    span.setAttribute("agent.max_budget_usd", options.maxBudgetUsd || 0);

    activeQueries.add(1);
    const startTime = Date.now();

    try {
      const metrics: QueryMetrics = {
        sessionId: "",
        totalCostUsd: 0,
        durationMs: 0,
        status: "success",
        turnCount: 0,
        toolUsage: {},
      };

      let result = "";

      for await (const message of query({ prompt, options })) {
        if (message.type === "system" && message.subtype === "init") {
          metrics.sessionId = message.session_id;
          span.setAttribute("session.id", message.session_id);
        }

        // Create child spans for tool usage
        if (message.type === "assistant" && "message" in message) {
          for (const block of message.message.content) {
            if ("type" in block && block.type === "tool_use") {
              const toolSpan = tracer.startSpan(`tool.${block.name}`, {
                attributes: {
                  "tool.name": block.name,
                  "tool.input_size": JSON.stringify(block.input).length,
                },
              });
              // Tool span ends when result is received (simplified here)
              toolSpan.end();

              metrics.toolUsage[block.name] = (metrics.toolUsage[block.name] || 0) + 1;
            }
          }
          metrics.turnCount++;
        }

        if (message.type === "result") {
          metrics.totalCostUsd = message.total_cost_usd;
          metrics.durationMs = message.duration_ms;
          metrics.status = message.subtype as QueryMetrics["status"];
          result = message.result || "";
        }
      }

      // Record metrics
      const duration = Date.now() - startTime;
      queryCounter.add(1, { status: metrics.status });
      queryDuration.record(duration, { model: options.model || "sonnet" });
      queryCost.record(metrics.totalCostUsd, { model: options.model || "sonnet" });

      // Set span result attributes
      span.setAttribute("query.cost_usd", metrics.totalCostUsd);
      span.setAttribute("query.duration_ms", metrics.durationMs);
      span.setAttribute("query.turn_count", metrics.turnCount);
      span.setAttribute("query.status", metrics.status);
      span.setStatus({ code: SpanStatusCode.OK });

      return { result, metrics };
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      span.recordException(error as Error);
      queryCounter.add(1, { status: "error" });
      throw error;
    } finally {
      activeQueries.add(-1);
      span.end();
    }
  });
}
```

### Docker Compose for Local OTEL Stack

```yaml
# docker-compose.otel.yml
version: "3.8"

services:
  # OpenTelemetry Collector
  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    command: ["--config=/etc/otel-collector-config.yaml"]
    volumes:
      - ./otel-collector-config.yaml:/etc/otel-collector-config.yaml
    ports:
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP
      - "8889:8889"   # Prometheus metrics
    depends_on:
      - jaeger

  # Jaeger for trace visualization
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686" # UI
      - "14250:14250" # gRPC

  # Prometheus for metrics
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"

  # Grafana for dashboards
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana

volumes:
  grafana-storage:
```

### OTEL Collector Configuration

```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024

exporters:
  jaeger:
    endpoint: jaeger:14250
    tls:
      insecure: true

  prometheus:
    endpoint: "0.0.0.0:8889"
    namespace: claude_agent

  logging:
    verbosity: detailed

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [jaeger, logging]
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [prometheus, logging]
    logs:
      receivers: [otlp]
      processors: [batch]
      exporters: [logging]
```

---

## 3. Langfuse Integration

Langfuse provides LLM-specific observability with trace analysis and session replay.

### Installation

```bash
npm install langfuse
```

### Setup and Configuration

```typescript
import { Langfuse } from "langfuse";

/**
 * Langfuse client for LLM observability.
 *
 * @see https://langfuse.com/docs/sdk/typescript
 */
const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
  baseUrl: process.env.LANGFUSE_HOST || "https://cloud.langfuse.com",
});

// Ensure traces are flushed on shutdown
process.on("SIGTERM", async () => {
  await langfuse.shutdownAsync();
});
```

### Instrumenting Agent Queries

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";
import { Langfuse } from "langfuse";

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
});

interface LangfuseTraceContext {
  traceId: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Execute a query with Langfuse tracing for LLM observability.
 * Captures full conversation flow, tool usage, and costs.
 */
async function queryWithLangfuse(
  prompt: string,
  options: QueryOptions,
  context: LangfuseTraceContext
): Promise<{ result: string; traceUrl: string }> {
  // Create a trace for this query
  const trace = langfuse.trace({
    id: context.traceId,
    name: "agent-query",
    userId: context.userId,
    sessionId: context.sessionId,
    metadata: context.metadata,
    input: { prompt },
  });

  // Create a span for the overall query
  const querySpan = trace.span({
    name: "claude-agent-sdk-query",
    input: {
      model: options.model || "claude-sonnet-4-5-20250929",
      systemPrompt: options.systemPrompt?.substring(0, 500) + "...", // Truncate for display
      allowedTools: options.allowedTools,
      maxTurns: options.maxTurns,
      maxBudgetUsd: options.maxBudgetUsd,
    },
  });

  let result = "";
  let turnCount = 0;
  const toolCalls: Array<{ name: string; input: unknown; output?: unknown }> = [];

  try {
    for await (const message of query({ prompt, options })) {
      if (message.type === "system" && message.subtype === "init") {
        querySpan.update({
          metadata: { sdkSessionId: message.session_id },
        });
      }

      // Track assistant messages and tool usage
      if (message.type === "assistant" && "message" in message) {
        turnCount++;

        // Create a generation for each assistant turn
        const generation = trace.generation({
          name: `turn-${turnCount}`,
          model: options.model || "claude-sonnet-4-5-20250929",
          input: turnCount === 1 ? prompt : "continuation",
          output: message.message.content,
          metadata: {
            turnNumber: turnCount,
            contentBlocks: message.message.content.length,
          },
        });

        // Track tool calls
        for (const block of message.message.content) {
          if ("type" in block && block.type === "tool_use") {
            toolCalls.push({
              name: block.name,
              input: block.input,
            });

            // Create a span for each tool call
            trace.span({
              name: `tool-${block.name}`,
              input: block.input,
              metadata: { toolName: block.name },
            });
          }
        }

        generation.end();
      }

      // Capture tool results
      if (message.type === "user" && "message" in message) {
        for (const block of message.message.content) {
          if ("type" in block && block.type === "tool_result") {
            // Match with corresponding tool call
            const lastToolCall = toolCalls.find(
              (tc) => !tc.output && tc.name === block.tool_use_id
            );
            if (lastToolCall) {
              lastToolCall.output = block.content;
            }
          }
        }
      }

      if (message.type === "result") {
        result = message.result || "";

        // Update span with final metrics
        querySpan.end({
          output: { result: result.substring(0, 1000) },
          metadata: {
            totalCostUsd: message.total_cost_usd,
            durationMs: message.duration_ms,
            status: message.subtype,
            turnCount,
            toolCalls: toolCalls.length,
          },
        });

        // Update trace with final output
        trace.update({
          output: { result: result.substring(0, 1000) },
          metadata: {
            totalCostUsd: message.total_cost_usd,
            durationMs: message.duration_ms,
            status: message.subtype,
          },
        });

        // Score the trace (optional - for quality tracking)
        if (message.subtype === "success") {
          trace.score({
            name: "query-success",
            value: 1,
          });
        }
      }
    }

    // Flush to ensure trace is sent
    await langfuse.flushAsync();

    return {
      result,
      traceUrl: `https://cloud.langfuse.com/trace/${context.traceId}`,
    };
  } catch (error) {
    querySpan.end({
      level: "ERROR",
      statusMessage: error instanceof Error ? error.message : "Unknown error",
    });
    await langfuse.flushAsync();
    throw error;
  }
}
```

### Session Tracking

```typescript
/**
 * Track multi-query sessions in Langfuse for conversation analysis.
 */
class LangfuseSessionTracker {
  private langfuse: Langfuse;
  private sessionId: string;
  private userId?: string;

  constructor(langfuse: Langfuse, sessionId: string, userId?: string) {
    this.langfuse = langfuse;
    this.sessionId = sessionId;
    this.userId = userId;
  }

  async trackQuery(
    prompt: string,
    options: QueryOptions
  ): Promise<{ result: string; traceId: string }> {
    const traceId = `${this.sessionId}-${Date.now()}`;

    const { result } = await queryWithLangfuse(prompt, options, {
      traceId,
      sessionId: this.sessionId,
      userId: this.userId,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });

    return { result, traceId };
  }

  // Score the entire session
  async scoreSession(name: string, value: number, comment?: string): Promise<void> {
    this.langfuse.score({
      traceId: this.sessionId,
      name,
      value,
      comment,
    });
    await this.langfuse.flushAsync();
  }
}

// Usage
const tracker = new LangfuseSessionTracker(langfuse, "session-123", "user-456");
const { result, traceId } = await tracker.trackQuery("Help me with...", options);
```

---

## 4. Key Metrics to Track

### Latency Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| `agent.query.duration_ms.p50` | Median query duration | < 5,000ms |
| `agent.query.duration_ms.p95` | 95th percentile | < 15,000ms |
| `agent.query.duration_ms.p99` | 99th percentile | < 30,000ms |
| `agent.first_token_ms` | Time to first token | < 1,000ms |

### Cost Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `agent.query.cost_usd.sum` | Total cost per period | Budget dependent |
| `agent.query.cost_usd.avg` | Average cost per query | > $0.10/query |
| `agent.session.cost_usd` | Cost per session | > $1.00/session |
| `agent.cost_per_user.daily` | Daily cost per user | > $5.00/user |

### Success Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| `agent.queries.success_rate` | Successful queries / total | > 99% |
| `agent.queries.error_rate` | Failed queries / total | < 1% |
| `agent.queries.max_turns_rate` | Queries hitting turn limit | < 5% |

### Tool Usage Metrics

| Metric | Description | Use Case |
|--------|-------------|----------|
| `agent.tool.invocations` | Tool call count by tool | Optimization |
| `agent.tool.duration_ms` | Tool execution time | Bottleneck detection |
| `agent.tool.error_rate` | Tool failure rate | Reliability |

### Subagent Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| `agent.subagent.spawns` | Subagent spawn count | Varies |
| `agent.subagent.duration_ms` | Subagent execution time | < 10,000ms |
| `agent.subagent.cost_usd` | Cost per subagent | Track trends |

### Implementation

```typescript
import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("claude-agent");

// Define comprehensive metrics
const agentMetrics = {
  // Latency
  queryDuration: meter.createHistogram("agent.query.duration_ms", {
    description: "Query duration in milliseconds",
    unit: "ms",
  }),
  firstTokenLatency: meter.createHistogram("agent.first_token_ms", {
    description: "Time to first token",
    unit: "ms",
  }),

  // Cost
  queryCost: meter.createHistogram("agent.query.cost_usd", {
    description: "Query cost in USD",
    unit: "usd",
  }),
  dailyCost: meter.createCounter("agent.cost.daily_usd", {
    description: "Daily cumulative cost",
    unit: "usd",
  }),

  // Success/Error
  queryTotal: meter.createCounter("agent.queries.total", {
    description: "Total queries",
  }),
  queryErrors: meter.createCounter("agent.queries.errors", {
    description: "Failed queries",
  }),

  // Tool usage
  toolInvocations: meter.createCounter("agent.tool.invocations", {
    description: "Tool invocation count",
  }),
  toolDuration: meter.createHistogram("agent.tool.duration_ms", {
    description: "Tool execution duration",
    unit: "ms",
  }),

  // Subagents
  subagentSpawns: meter.createCounter("agent.subagent.spawns", {
    description: "Subagent spawn count",
  }),
  subagentCost: meter.createHistogram("agent.subagent.cost_usd", {
    description: "Subagent cost",
    unit: "usd",
  }),

  // Tokens
  inputTokens: meter.createCounter("agent.tokens.input", {
    description: "Input tokens consumed",
  }),
  outputTokens: meter.createCounter("agent.tokens.output", {
    description: "Output tokens generated",
  }),
};

/**
 * Record comprehensive metrics for a query.
 */
function recordQueryMetrics(result: QueryMetrics, model: string): void {
  const labels = { model, status: result.status };

  agentMetrics.queryDuration.record(result.durationMs, labels);
  agentMetrics.queryCost.record(result.totalCostUsd, labels);
  agentMetrics.dailyCost.add(result.totalCostUsd, { model });
  agentMetrics.queryTotal.add(1, labels);

  if (result.status !== "success") {
    agentMetrics.queryErrors.add(1, { model, error_type: result.status });
  }

  // Record tool usage
  for (const [tool, count] of Object.entries(result.toolUsage)) {
    agentMetrics.toolInvocations.add(count, { tool, model });
  }
}
```

---

## 5. Setting Up Dashboards

### Grafana Dashboard Setup

#### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  # Scrape OTEL collector metrics
  - job_name: "otel-collector"
    static_configs:
      - targets: ["otel-collector:8889"]

  # Scrape agent directly (if exposing metrics endpoint)
  - job_name: "claude-agent"
    static_configs:
      - targets: ["agent:9090"]
    metrics_path: /metrics
```

#### Grafana Dashboard JSON

```json
{
  "dashboard": {
    "title": "Claude Agent Performance",
    "uid": "claude-agent-perf",
    "panels": [
      {
        "title": "Query Latency (p50, p95, p99)",
        "type": "timeseries",
        "gridPos": { "x": 0, "y": 0, "w": 12, "h": 8 },
        "targets": [
          {
            "expr": "histogram_quantile(0.50, rate(claude_agent_agent_query_duration_ms_bucket[5m]))",
            "legendFormat": "p50"
          },
          {
            "expr": "histogram_quantile(0.95, rate(claude_agent_agent_query_duration_ms_bucket[5m]))",
            "legendFormat": "p95"
          },
          {
            "expr": "histogram_quantile(0.99, rate(claude_agent_agent_query_duration_ms_bucket[5m]))",
            "legendFormat": "p99"
          }
        ]
      },
      {
        "title": "Query Success Rate",
        "type": "stat",
        "gridPos": { "x": 12, "y": 0, "w": 6, "h": 4 },
        "targets": [
          {
            "expr": "sum(rate(claude_agent_agent_queries_total{status=\"success\"}[5m])) / sum(rate(claude_agent_agent_queries_total[5m])) * 100",
            "legendFormat": "Success %"
          }
        ],
        "options": {
          "colorMode": "value",
          "graphMode": "none",
          "textMode": "value_and_name"
        },
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": {
              "mode": "absolute",
              "steps": [
                { "color": "red", "value": null },
                { "color": "yellow", "value": 95 },
                { "color": "green", "value": 99 }
              ]
            }
          }
        }
      },
      {
        "title": "Hourly Cost",
        "type": "stat",
        "gridPos": { "x": 18, "y": 0, "w": 6, "h": 4 },
        "targets": [
          {
            "expr": "sum(increase(claude_agent_agent_cost_daily_usd_total[1h]))",
            "legendFormat": "Cost"
          }
        ],
        "options": {
          "colorMode": "value"
        },
        "fieldConfig": {
          "defaults": {
            "unit": "currencyUSD",
            "thresholds": {
              "mode": "absolute",
              "steps": [
                { "color": "green", "value": null },
                { "color": "yellow", "value": 10 },
                { "color": "red", "value": 50 }
              ]
            }
          }
        }
      },
      {
        "title": "Queries per Minute",
        "type": "timeseries",
        "gridPos": { "x": 12, "y": 4, "w": 12, "h": 8 },
        "targets": [
          {
            "expr": "sum(rate(claude_agent_agent_queries_total[1m])) * 60",
            "legendFormat": "Total"
          },
          {
            "expr": "sum(rate(claude_agent_agent_queries_total{status=\"success\"}[1m])) * 60",
            "legendFormat": "Success"
          },
          {
            "expr": "sum(rate(claude_agent_agent_queries_total{status!=\"success\"}[1m])) * 60",
            "legendFormat": "Errors"
          }
        ]
      },
      {
        "title": "Tool Usage",
        "type": "piechart",
        "gridPos": { "x": 0, "y": 8, "w": 6, "h": 8 },
        "targets": [
          {
            "expr": "sum by (tool) (increase(claude_agent_agent_tool_invocations_total[1h]))",
            "legendFormat": "{{tool}}"
          }
        ]
      },
      {
        "title": "Cost by Model",
        "type": "timeseries",
        "gridPos": { "x": 6, "y": 8, "w": 6, "h": 8 },
        "targets": [
          {
            "expr": "sum by (model) (increase(claude_agent_agent_query_cost_usd_sum[1h]))",
            "legendFormat": "{{model}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "currencyUSD"
          }
        }
      }
    ]
  }
}
```

### Datadog Integration

```typescript
import tracer from "dd-trace";

// Initialize Datadog tracer
tracer.init({
  service: "claude-agent",
  env: process.env.NODE_ENV || "development",
  version: process.env.npm_package_version,
  logInjection: true,
});

import StatsD from "hot-shots";

const dogstatsd = new StatsD({
  host: process.env.DD_AGENT_HOST || "localhost",
  port: 8125,
  prefix: "claude.agent.",
  globalTags: [`env:${process.env.NODE_ENV}`],
});

/**
 * Send metrics to Datadog.
 */
function recordDatadogMetrics(result: QueryMetrics, model: string): void {
  const tags = [`model:${model}`, `status:${result.status}`];

  // Histograms
  dogstatsd.histogram("query.duration_ms", result.durationMs, tags);
  dogstatsd.histogram("query.cost_usd", result.totalCostUsd, tags);

  // Counters
  dogstatsd.increment("queries.total", 1, tags);
  if (result.status !== "success") {
    dogstatsd.increment("queries.errors", 1, tags);
  }

  // Tool usage
  for (const [tool, count] of Object.entries(result.toolUsage)) {
    dogstatsd.increment("tool.invocations", count, [...tags, `tool:${tool}`]);
  }
}
```

---

## 6. Session Analytics

### Session Tracking Implementation

```typescript
interface Session {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  queries: Array<{
    timestamp: Date;
    prompt: string;
    durationMs: number;
    costUsd: number;
    status: string;
  }>;
  totalCostUsd: number;
  totalDurationMs: number;
}

/**
 * Track user sessions for engagement analytics.
 */
class SessionTracker {
  private sessions: Map<string, Session> = new Map();

  startSession(sessionId: string, userId: string): Session {
    const session: Session = {
      id: sessionId,
      userId,
      startTime: new Date(),
      queries: [],
      totalCostUsd: 0,
      totalDurationMs: 0,
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  recordQuery(
    sessionId: string,
    prompt: string,
    metrics: QueryMetrics
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.queries.push({
      timestamp: new Date(),
      prompt: prompt.substring(0, 100), // Truncate for storage
      durationMs: metrics.durationMs,
      costUsd: metrics.totalCostUsd,
      status: metrics.status,
    });

    session.totalCostUsd += metrics.totalCostUsd;
    session.totalDurationMs += metrics.durationMs;
  }

  endSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.endTime = new Date();
    return session;
  }

  getSessionAnalytics(sessionId: string): object | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const durationMinutes = session.endTime
      ? (session.endTime.getTime() - session.startTime.getTime()) / 60000
      : (Date.now() - session.startTime.getTime()) / 60000;

    return {
      sessionId: session.id,
      userId: session.userId,
      durationMinutes,
      messageCount: session.queries.length,
      messagesPerMinute: session.queries.length / Math.max(durationMinutes, 1),
      totalCostUsd: session.totalCostUsd,
      avgCostPerQuery: session.totalCostUsd / Math.max(session.queries.length, 1),
      avgLatencyMs: session.totalDurationMs / Math.max(session.queries.length, 1),
      successRate:
        session.queries.filter((q) => q.status === "success").length /
        Math.max(session.queries.length, 1),
    };
  }
}

// Export metrics to monitoring system
function exportSessionMetrics(session: Session): void {
  const analytics = getSessionAnalytics(session.id);
  if (!analytics) return;

  // Send to your metrics system
  console.log("[Session Analytics]", JSON.stringify(analytics, null, 2));
}
```

### Engagement Metrics

```typescript
const sessionMeter = metrics.getMeter("claude-agent-sessions");

const sessionMetrics = {
  sessionDuration: sessionMeter.createHistogram("session.duration_minutes", {
    description: "Session duration in minutes",
    unit: "min",
  }),
  messagesPerSession: sessionMeter.createHistogram("session.messages", {
    description: "Messages per session",
  }),
  costPerSession: sessionMeter.createHistogram("session.cost_usd", {
    description: "Cost per session in USD",
    unit: "usd",
  }),
  activeSessions: sessionMeter.createUpDownCounter("sessions.active", {
    description: "Currently active sessions",
  }),
  dailyActiveUsers: sessionMeter.createCounter("users.daily_active", {
    description: "Daily active users",
  }),
};
```

---

## 7. Cost Tracking

### Per-Agent Cost Breakdown

```typescript
interface AgentCostReport {
  agentId: string;
  period: { start: Date; end: Date };
  totalCostUsd: number;
  queryCount: number;
  avgCostPerQuery: number;
  costByModel: Record<string, number>;
  costBySubagent: Record<string, number>;
  topCostlyQueries: Array<{
    sessionId: string;
    costUsd: number;
    durationMs: number;
  }>;
}

/**
 * Track and attribute costs across agents and subagents.
 */
class CostTracker {
  private costs: Map<string, { totalUsd: number; count: number }> = new Map();
  private modelCosts: Map<string, number> = new Map();
  private subagentCosts: Map<string, number> = new Map();
  private queryHistory: Array<{
    agentId: string;
    sessionId: string;
    costUsd: number;
    durationMs: number;
    timestamp: Date;
  }> = [];

  recordCost(
    agentId: string,
    sessionId: string,
    costUsd: number,
    durationMs: number,
    model: string,
    subagent?: string
  ): void {
    // Update agent totals
    const existing = this.costs.get(agentId) || { totalUsd: 0, count: 0 };
    this.costs.set(agentId, {
      totalUsd: existing.totalUsd + costUsd,
      count: existing.count + 1,
    });

    // Update model costs
    const modelKey = `${agentId}:${model}`;
    this.modelCosts.set(modelKey, (this.modelCosts.get(modelKey) || 0) + costUsd);

    // Update subagent costs if applicable
    if (subagent) {
      const subagentKey = `${agentId}:${subagent}`;
      this.subagentCosts.set(
        subagentKey,
        (this.subagentCosts.get(subagentKey) || 0) + costUsd
      );
    }

    // Store for history
    this.queryHistory.push({
      agentId,
      sessionId,
      costUsd,
      durationMs,
      timestamp: new Date(),
    });

    // Trim old history (keep last 10000)
    if (this.queryHistory.length > 10000) {
      this.queryHistory = this.queryHistory.slice(-10000);
    }
  }

  getAgentReport(agentId: string, periodHours = 24): AgentCostReport {
    const cutoff = new Date(Date.now() - periodHours * 60 * 60 * 1000);
    const agentQueries = this.queryHistory.filter(
      (q) => q.agentId === agentId && q.timestamp >= cutoff
    );

    const totalCost = agentQueries.reduce((sum, q) => sum + q.costUsd, 0);

    // Get cost by model
    const costByModel: Record<string, number> = {};
    for (const [key, cost] of this.modelCosts) {
      if (key.startsWith(`${agentId}:`)) {
        const model = key.split(":")[1];
        costByModel[model] = cost;
      }
    }

    // Get cost by subagent
    const costBySubagent: Record<string, number> = {};
    for (const [key, cost] of this.subagentCosts) {
      if (key.startsWith(`${agentId}:`)) {
        const subagent = key.split(":")[1];
        costBySubagent[subagent] = cost;
      }
    }

    // Top costly queries
    const topQueries = [...agentQueries]
      .sort((a, b) => b.costUsd - a.costUsd)
      .slice(0, 10)
      .map((q) => ({
        sessionId: q.sessionId,
        costUsd: q.costUsd,
        durationMs: q.durationMs,
      }));

    return {
      agentId,
      period: { start: cutoff, end: new Date() },
      totalCostUsd: totalCost,
      queryCount: agentQueries.length,
      avgCostPerQuery: totalCost / Math.max(agentQueries.length, 1),
      costByModel,
      costBySubagent,
      topCostlyQueries: topQueries,
    };
  }
}
```

### Budget Enforcement with maxBudgetUsd

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

interface BudgetConfig {
  maxQueryBudgetUsd: number;
  maxSessionBudgetUsd: number;
  maxDailyBudgetUsd: number;
  alertThresholdPercent: number;
}

const defaultBudgetConfig: BudgetConfig = {
  maxQueryBudgetUsd: 1.0,      // $1 per query
  maxSessionBudgetUsd: 10.0,   // $10 per session
  maxDailyBudgetUsd: 100.0,    // $100 per day
  alertThresholdPercent: 80,   // Alert at 80% of budget
};

/**
 * Enforce budget limits and trigger alerts.
 */
class BudgetEnforcer {
  private config: BudgetConfig;
  private dailySpend: number = 0;
  private sessionSpends: Map<string, number> = new Map();
  private lastResetDate: string = new Date().toDateString();

  constructor(config: BudgetConfig = defaultBudgetConfig) {
    this.config = config;
  }

  private resetDailyIfNeeded(): void {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dailySpend = 0;
      this.lastResetDate = today;
    }
  }

  canExecuteQuery(sessionId: string): {
    allowed: boolean;
    reason?: string;
    remainingBudget: { query: number; session: number; daily: number };
  } {
    this.resetDailyIfNeeded();

    const sessionSpend = this.sessionSpends.get(sessionId) || 0;

    const remainingBudget = {
      query: this.config.maxQueryBudgetUsd,
      session: this.config.maxSessionBudgetUsd - sessionSpend,
      daily: this.config.maxDailyBudgetUsd - this.dailySpend,
    };

    if (remainingBudget.daily <= 0) {
      return {
        allowed: false,
        reason: "Daily budget exceeded",
        remainingBudget,
      };
    }

    if (remainingBudget.session <= 0) {
      return {
        allowed: false,
        reason: "Session budget exceeded",
        remainingBudget,
      };
    }

    return { allowed: true, remainingBudget };
  }

  recordSpend(sessionId: string, costUsd: number): void {
    this.resetDailyIfNeeded();
    this.dailySpend += costUsd;
    this.sessionSpends.set(
      sessionId,
      (this.sessionSpends.get(sessionId) || 0) + costUsd
    );

    // Check alert thresholds
    const dailyPercent = (this.dailySpend / this.config.maxDailyBudgetUsd) * 100;
    if (dailyPercent >= this.config.alertThresholdPercent) {
      this.triggerAlert("daily", dailyPercent, this.dailySpend);
    }
  }

  private triggerAlert(type: string, percent: number, amount: number): void {
    console.warn(
      `[Budget Alert] ${type} budget at ${percent.toFixed(1)}% ($${amount.toFixed(2)})`
    );
    // Send to alerting system (PagerDuty, Slack, etc.)
  }

  /**
   * Get the effective budget for a query, considering session and daily limits.
   */
  getEffectiveMaxBudget(sessionId: string): number {
    const check = this.canExecuteQuery(sessionId);
    if (!check.allowed) return 0;

    return Math.min(
      check.remainingBudget.query,
      check.remainingBudget.session,
      check.remainingBudget.daily
    );
  }
}

// Usage with SDK
async function queryWithBudget(
  prompt: string,
  options: QueryOptions,
  sessionId: string,
  budgetEnforcer: BudgetEnforcer
): Promise<{ result: string; metrics: QueryMetrics }> {
  const budgetCheck = budgetEnforcer.canExecuteQuery(sessionId);

  if (!budgetCheck.allowed) {
    throw new Error(`Budget exceeded: ${budgetCheck.reason}`);
  }

  // Set maxBudgetUsd to enforce limit at SDK level
  const effectiveBudget = budgetEnforcer.getEffectiveMaxBudget(sessionId);

  const response = query({
    prompt,
    options: {
      ...options,
      maxBudgetUsd: effectiveBudget,
    },
  });

  let result = "";
  let queryMetrics: QueryMetrics | null = null;

  for await (const message of response) {
    if (message.type === "result") {
      queryMetrics = {
        sessionId: sessionId,
        totalCostUsd: message.total_cost_usd,
        durationMs: message.duration_ms,
        status: message.subtype as QueryMetrics["status"],
        turnCount: 0,
        toolUsage: {},
      };
      result = message.result || "";

      // Record spend for budget tracking
      budgetEnforcer.recordSpend(sessionId, message.total_cost_usd);
    }
  }

  if (!queryMetrics) {
    throw new Error("Query completed without metrics");
  }

  return { result, metrics: queryMetrics };
}
```

### Cost Optimization Strategies

```typescript
/**
 * Cost optimization recommendations based on usage patterns.
 */
interface CostOptimization {
  recommendation: string;
  estimatedSavings: number;
  implementation: string;
}

function analyzeCostOptimizations(
  report: AgentCostReport
): CostOptimization[] {
  const optimizations: CostOptimization[] = [];

  // Check if Opus is overused
  if (report.costByModel["opus"] && report.costByModel["opus"] > report.totalCostUsd * 0.5) {
    optimizations.push({
      recommendation: "Consider using Sonnet instead of Opus for simpler tasks",
      estimatedSavings: report.costByModel["opus"] * 0.6, // Sonnet is ~60% cheaper
      implementation: `Add model routing based on task complexity:
        const model = isComplexTask(prompt)
          ? "claude-opus-4-5-20251101"
          : "claude-sonnet-4-5-20250929";`,
    });
  }

  // Check for high cost per query
  if (report.avgCostPerQuery > 0.1) {
    optimizations.push({
      recommendation: "Reduce average query cost with maxTurns limit",
      estimatedSavings: report.totalCostUsd * 0.2,
      implementation: `Set maxTurns: 10 to prevent runaway costs`,
    });
  }

  // Check subagent costs
  const totalSubagentCost = Object.values(report.costBySubagent).reduce(
    (a, b) => a + b,
    0
  );
  if (totalSubagentCost > report.totalCostUsd * 0.3) {
    optimizations.push({
      recommendation: "Use Haiku for simple subagent tasks",
      estimatedSavings: totalSubagentCost * 0.5,
      implementation: `Set model: "haiku" for review/validation subagents`,
    });
  }

  return optimizations;
}
```

---

## 8. Alerting

### PagerDuty Integration

```typescript
import axios from "axios";

interface PagerDutyConfig {
  routingKey: string;
  serviceUrl?: string;
}

/**
 * Send alerts to PagerDuty.
 *
 * @see https://developer.pagerduty.com/docs/events-api-v2/trigger-events/
 */
class PagerDutyAlerter {
  private config: PagerDutyConfig;

  constructor(config: PagerDutyConfig) {
    this.config = config;
  }

  async trigger(
    severity: "critical" | "error" | "warning" | "info",
    summary: string,
    details: Record<string, unknown>
  ): Promise<void> {
    try {
      await axios.post("https://events.pagerduty.com/v2/enqueue", {
        routing_key: this.config.routingKey,
        event_action: "trigger",
        payload: {
          summary,
          severity,
          source: "claude-agent",
          component: "agent-monitoring",
          custom_details: details,
          timestamp: new Date().toISOString(),
        },
      });
      console.log(`[PagerDuty] Alert sent: ${summary}`);
    } catch (error) {
      console.error("[PagerDuty] Failed to send alert:", error);
    }
  }

  async resolve(dedupKey: string): Promise<void> {
    await axios.post("https://events.pagerduty.com/v2/enqueue", {
      routing_key: this.config.routingKey,
      event_action: "resolve",
      dedup_key: dedupKey,
    });
  }
}
```

### Slack Integration

```typescript
import { WebClient } from "@slack/web-api";

interface SlackAlertConfig {
  token: string;
  channel: string;
  mentionUsers?: string[]; // User IDs for critical alerts
}

/**
 * Send alerts to Slack.
 */
class SlackAlerter {
  private client: WebClient;
  private config: SlackAlertConfig;

  constructor(config: SlackAlertConfig) {
    this.client = new WebClient(config.token);
    this.config = config;
  }

  async sendAlert(
    severity: "critical" | "warning" | "info",
    title: string,
    details: Record<string, unknown>
  ): Promise<void> {
    const colorMap = {
      critical: "#dc3545",
      warning: "#ffc107",
      info: "#17a2b8",
    };

    const mentions =
      severity === "critical" && this.config.mentionUsers
        ? this.config.mentionUsers.map((u) => `<@${u}>`).join(" ") + " "
        : "";

    await this.client.chat.postMessage({
      channel: this.config.channel,
      text: `${mentions}${title}`,
      attachments: [
        {
          color: colorMap[severity],
          title,
          fields: Object.entries(details).map(([key, value]) => ({
            title: key,
            value: String(value),
            short: true,
          })),
          footer: "Claude Agent Monitoring",
          ts: String(Date.now() / 1000),
        },
      ],
    });
  }
}
```

### Alert Manager

```typescript
interface AlertThresholds {
  errorRatePercent: number;
  latencyP95Ms: number;
  dailyBudgetPercent: number;
  queryBudgetUsd: number;
}

const defaultThresholds: AlertThresholds = {
  errorRatePercent: 5,      // Alert if error rate > 5%
  latencyP95Ms: 30000,      // Alert if p95 > 30s
  dailyBudgetPercent: 80,   // Alert at 80% of daily budget
  queryBudgetUsd: 1.0,      // Alert if single query > $1
};

/**
 * Centralized alert management for agent monitoring.
 */
class AlertManager {
  private pagerDuty?: PagerDutyAlerter;
  private slack?: SlackAlerter;
  private thresholds: AlertThresholds;
  private recentAlerts: Map<string, Date> = new Map();
  private cooldownMs: number = 300000; // 5 minute cooldown

  constructor(
    thresholds: AlertThresholds = defaultThresholds,
    options: {
      pagerDuty?: PagerDutyConfig;
      slack?: SlackAlertConfig;
    } = {}
  ) {
    this.thresholds = thresholds;
    if (options.pagerDuty) {
      this.pagerDuty = new PagerDutyAlerter(options.pagerDuty);
    }
    if (options.slack) {
      this.slack = new SlackAlerter(options.slack);
    }
  }

  private shouldAlert(alertKey: string): boolean {
    const lastAlert = this.recentAlerts.get(alertKey);
    if (lastAlert && Date.now() - lastAlert.getTime() < this.cooldownMs) {
      return false;
    }
    this.recentAlerts.set(alertKey, new Date());
    return true;
  }

  async checkErrorRate(errorRate: number): Promise<void> {
    if (errorRate > this.thresholds.errorRatePercent) {
      if (this.shouldAlert("error_rate")) {
        const severity = errorRate > 10 ? "critical" : "warning";
        await this.sendAlert(severity, "High Error Rate", {
          current: `${errorRate.toFixed(1)}%`,
          threshold: `${this.thresholds.errorRatePercent}%`,
        });
      }
    }
  }

  async checkLatency(p95Ms: number): Promise<void> {
    if (p95Ms > this.thresholds.latencyP95Ms) {
      if (this.shouldAlert("latency")) {
        const severity = p95Ms > this.thresholds.latencyP95Ms * 2 ? "critical" : "warning";
        await this.sendAlert(severity, "High Latency", {
          p95: `${(p95Ms / 1000).toFixed(1)}s`,
          threshold: `${(this.thresholds.latencyP95Ms / 1000).toFixed(1)}s`,
        });
      }
    }
  }

  async checkBudget(currentSpend: number, dailyBudget: number): Promise<void> {
    const percent = (currentSpend / dailyBudget) * 100;
    if (percent > this.thresholds.dailyBudgetPercent) {
      if (this.shouldAlert("budget")) {
        const severity = percent > 95 ? "critical" : "warning";
        await this.sendAlert(severity, "Budget Alert", {
          spent: `$${currentSpend.toFixed(2)}`,
          budget: `$${dailyBudget.toFixed(2)}`,
          percent: `${percent.toFixed(1)}%`,
        });
      }
    }
  }

  async checkQueryCost(costUsd: number, sessionId: string): Promise<void> {
    if (costUsd > this.thresholds.queryBudgetUsd) {
      if (this.shouldAlert(`query_cost_${sessionId}`)) {
        await this.sendAlert("warning", "High Query Cost", {
          cost: `$${costUsd.toFixed(4)}`,
          sessionId,
          threshold: `$${this.thresholds.queryBudgetUsd}`,
        });
      }
    }
  }

  private async sendAlert(
    severity: "critical" | "warning" | "info",
    title: string,
    details: Record<string, unknown>
  ): Promise<void> {
    console.warn(`[Alert] ${severity.toUpperCase()}: ${title}`, details);

    await Promise.all([
      this.pagerDuty?.trigger(severity, title, details),
      this.slack?.sendAlert(severity, title, details),
    ]);
  }
}

// Usage
const alertManager = new AlertManager(defaultThresholds, {
  pagerDuty: { routingKey: process.env.PAGERDUTY_KEY! },
  slack: {
    token: process.env.SLACK_TOKEN!,
    channel: "#agent-alerts",
    mentionUsers: ["U1234567"], // On-call engineer
  },
});

// Check metrics periodically
setInterval(async () => {
  const metrics = getAggregatedMetrics(); // Your metrics aggregator
  await alertManager.checkErrorRate(metrics.errorRate);
  await alertManager.checkLatency(metrics.latencyP95);
  await alertManager.checkBudget(metrics.dailySpend, 100); // $100 daily budget
}, 60000); // Every minute
```

---

## 9. Logging Best Practices

### Structured Logging Format

```typescript
import pino from "pino";

/**
 * Structured logger for agent operations.
 * Uses pino for high-performance JSON logging.
 *
 * @see https://github.com/pinojs/pino
 */
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    service: "claude-agent",
    version: process.env.npm_package_version,
    env: process.env.NODE_ENV,
  },
  redact: {
    paths: [
      "*.password",
      "*.apiKey",
      "*.secret",
      "*.token",
      "user.email",
      "user.phone",
    ],
    censor: "[REDACTED]",
  },
});

// Create child loggers for different components
export const queryLogger = logger.child({ component: "query" });
export const sessionLogger = logger.child({ component: "session" });
export const costLogger = logger.child({ component: "cost" });
export const toolLogger = logger.child({ component: "tool" });
```

### Log Levels

| Level | Use Case | Examples |
|-------|----------|----------|
| `fatal` | Application crash | Unrecoverable errors |
| `error` | Failed operations | Query failures, API errors |
| `warn` | Potential issues | High latency, budget threshold |
| `info` | Normal operations | Query start/end, session events |
| `debug` | Development details | Tool inputs, intermediate results |
| `trace` | Very detailed | Full message content |

### Correlation IDs

```typescript
import { AsyncLocalStorage } from "async_hooks";
import { v4 as uuidv4 } from "uuid";

const asyncLocalStorage = new AsyncLocalStorage<{ correlationId: string }>();

/**
 * Generate a correlation ID for request tracing.
 */
export function generateCorrelationId(): string {
  return uuidv4();
}

/**
 * Run a function with a correlation ID in context.
 */
export async function withCorrelation<T>(
  correlationId: string,
  fn: () => Promise<T>
): Promise<T> {
  return asyncLocalStorage.run({ correlationId }, fn);
}

/**
 * Get the current correlation ID from context.
 */
export function getCorrelationId(): string | undefined {
  return asyncLocalStorage.getStore()?.correlationId;
}

/**
 * Logger that automatically includes correlation ID.
 */
export function getLogger(component: string): pino.Logger {
  const correlationId = getCorrelationId();
  return logger.child({
    component,
    ...(correlationId && { correlationId }),
  });
}

// Usage
async function handleQuery(prompt: string, options: QueryOptions): Promise<string> {
  const correlationId = generateCorrelationId();

  return withCorrelation(correlationId, async () => {
    const log = getLogger("query");

    log.info({ prompt: prompt.substring(0, 100) }, "Query started");

    try {
      const { result, metrics } = await queryWithMetrics(prompt, options);

      log.info(
        {
          durationMs: metrics.durationMs,
          costUsd: metrics.totalCostUsd,
          status: metrics.status,
        },
        "Query completed"
      );

      return result;
    } catch (error) {
      log.error({ error }, "Query failed");
      throw error;
    }
  });
}
```

### PII Handling

```typescript
/**
 * Sanitize user input before logging.
 * Removes or masks potentially sensitive information.
 */
function sanitizeForLogging(input: string): string {
  // Email addresses
  let sanitized = input.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    "[EMAIL]"
  );

  // Phone numbers (various formats)
  sanitized = sanitized.replace(
    /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,
    "[PHONE]"
  );

  // SSN
  sanitized = sanitized.replace(/\d{3}-\d{2}-\d{4}/g, "[SSN]");

  // Credit card numbers
  sanitized = sanitized.replace(/\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g, "[CC]");

  // IP addresses
  sanitized = sanitized.replace(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g, "[IP]");

  return sanitized;
}

/**
 * Safe logging wrapper that sanitizes content.
 */
function safeLog(
  level: "info" | "warn" | "error" | "debug",
  message: string,
  data?: Record<string, unknown>
): void {
  const sanitizedData: Record<string, unknown> = {};

  if (data) {
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string") {
        sanitizedData[key] = sanitizeForLogging(value);
      } else if (typeof value === "object" && value !== null) {
        sanitizedData[key] = JSON.parse(
          sanitizeForLogging(JSON.stringify(value))
        );
      } else {
        sanitizedData[key] = value;
      }
    }
  }

  logger[level](sanitizedData, sanitizeForLogging(message));
}

// Usage
safeLog("info", "User query: find John at john@example.com", {
  userId: "user-123",
  ip: "192.168.1.1",
});
// Output: "User query: find John at [EMAIL]" { userId: "user-123", ip: "[IP]" }
```

### Complete Logging Example

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

async function queryWithLogging(
  prompt: string,
  options: QueryOptions,
  context: { userId: string; sessionId: string }
): Promise<{ result: string; metrics: QueryMetrics }> {
  const correlationId = generateCorrelationId();
  const log = logger.child({
    correlationId,
    userId: context.userId,
    sessionId: context.sessionId,
    component: "query",
  });

  log.info(
    {
      promptLength: prompt.length,
      model: options.model,
      maxTurns: options.maxTurns,
      maxBudgetUsd: options.maxBudgetUsd,
    },
    "Starting query"
  );

  const startTime = Date.now();
  let sdkSessionId: string | undefined;
  let turnCount = 0;
  const toolsUsed: string[] = [];

  try {
    for await (const message of query({ prompt, options })) {
      if (message.type === "system" && message.subtype === "init") {
        sdkSessionId = message.session_id;
        log.debug({ sdkSessionId }, "SDK session initialized");
      }

      if (message.type === "assistant" && "message" in message) {
        turnCount++;

        for (const block of message.message.content) {
          if ("type" in block && block.type === "tool_use") {
            toolsUsed.push(block.name);
            log.debug(
              { tool: block.name, turn: turnCount },
              "Tool invoked"
            );
          }
        }
      }

      if (message.type === "result") {
        const metrics: QueryMetrics = {
          sessionId: sdkSessionId || context.sessionId,
          totalCostUsd: message.total_cost_usd,
          durationMs: message.duration_ms,
          status: message.subtype as QueryMetrics["status"],
          turnCount,
          toolUsage: toolsUsed.reduce((acc, tool) => {
            acc[tool] = (acc[tool] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        };

        log.info(
          {
            status: metrics.status,
            durationMs: metrics.durationMs,
            wallDurationMs: Date.now() - startTime,
            costUsd: metrics.totalCostUsd,
            turnCount,
            toolCount: toolsUsed.length,
            uniqueTools: [...new Set(toolsUsed)],
          },
          "Query completed"
        );

        return {
          result: message.result || "",
          metrics,
        };
      }
    }

    throw new Error("Query ended without result message");
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        durationMs: Date.now() - startTime,
        turnCount,
      },
      "Query failed"
    );
    throw error;
  }
}
```

---

## Quick Reference

### Essential Metrics Checklist

- [ ] Query latency (p50, p95, p99)
- [ ] Success/error rate
- [ ] Cost per query/session/day
- [ ] Tool usage frequency
- [ ] Subagent spawn rate
- [ ] Active sessions

### Environment Variables

```bash
# OpenTelemetry
CLAUDE_CODE_ENABLE_TELEMETRY=1
OTEL_SERVICE_NAME=claude-agent
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

# Langfuse
LANGFUSE_SECRET_KEY=sk-...
LANGFUSE_PUBLIC_KEY=pk-...
LANGFUSE_HOST=https://cloud.langfuse.com

# Alerting
PAGERDUTY_KEY=...
SLACK_TOKEN=xoxb-...

# Logging
LOG_LEVEL=info
```

### Quick Metrics Collection

```typescript
// Minimal metrics collection
for await (const message of query({ prompt, options })) {
  if (message.type === "result") {
    console.log({
      cost: message.total_cost_usd,
      duration: message.duration_ms,
      status: message.subtype,
    });
  }
}
```

---

## Resources

- [OpenTelemetry JavaScript SDK](https://opentelemetry.io/docs/instrumentation/js/)
- [Langfuse Documentation](https://langfuse.com/docs)
- [Grafana Dashboards](https://grafana.com/docs/grafana/latest/dashboards/)
- [PagerDuty Events API](https://developer.pagerduty.com/docs/events-api-v2/trigger-events/)
- [Pino Logger](https://github.com/pinojs/pino)
- [Claude Agent SDK](https://docs.anthropic.com/claude-code/agent-sdk)
