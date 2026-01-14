# FINAL RECOMMENDATION: Reliable Google AI Agents for KnearMe

> **Decision Date:** January 12, 2026
> **Branch:** `feature/google-interactions-api`
> **Status:** RECOMMENDATION READY

---

## Executive Summary

After extensive debate and research, the evidence is clear:

| Option | Verdict | Reason |
|--------|---------|--------|
| **Interactions API** | ❌ NOT READY | Beta, TypeScript broken, zero production adoption |
| **Full SDK Migration** | ⚠️ PREMATURE | Team just finished OASDK migration, adds risk |
| **Stay with Vercel AI SDK** | ✅ STABLE | Works, but missing observability wiring |
| **Hybrid + Fix Observability** | ✅ **RECOMMENDED** | Best of both worlds |

---

## The Core Insight

**You already have 80% of what you need. The remaining 20% is wiring, not new technology.**

### What Exists (Working)
- ✅ Gemini integration via Vercel AI SDK
- ✅ Retry logic with exponential backoff (`src/lib/ai/retry.ts`)
- ✅ Circuit breakers per agent (`src/lib/agents/circuit-breaker.ts`)
- ✅ Feature flags with kill switch (`src/lib/config/feature-flags.ts`)
- ✅ Langfuse SDK installed (`langfuse-vercel@3.38.6`)
- ✅ Agent logger with correlation IDs (`src/lib/observability/agent-logger.ts`)
- ✅ Telemetry helpers (`src/lib/observability/traced-ai.ts`)

### What's Broken (Quick Fixes)
- ❌ **Missing `instrumentation.ts`** - Langfuse isn't actually connected!
- ❌ **Agent logger only used in 1 agent** - Other 9+ agents use plain logging
- ❌ **No decision capture** - Can't debug "why did agent do that?"

### What's Not Needed (Yet)
- ❌ Interactions API - Beta, broken TypeScript
- ❌ Full SDK migration - High risk, low reward
- ❌ Deep Research agent - No proven use case

---

## The Plan: Fix What's Broken, Ship Value

### Phase 0: Wire Up Observability (Day 1)

**Task 1: Create the missing instrumentation file**

```typescript
// instrumentation.ts (PROJECT ROOT - CURRENTLY MISSING!)
import { registerOTel } from '@vercel/otel';
import { LangfuseExporter } from 'langfuse-vercel';

export function register() {
  registerOTel({
    serviceName: 'knearme-portfolio',
    traceExporter: new LangfuseExporter({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASEURL || 'https://cloud.langfuse.com',
    }),
  });
}
```

**Task 2: Enable experimental telemetry in next.config.ts**

```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  // ... rest of config
};
```

**Outcome:** All AI SDK calls automatically traced to Langfuse.

---

### Phase 1: Adopt Agent Logger (Day 2-3)

**Current state:** Only `discovery.ts` uses the agent logger. Other agents use plain `console.log`.

**Fix:** Add correlation IDs to critical agents:

```typescript
// src/lib/agents/content-generator.ts (BEFORE)
import { logger } from '@/lib/logging';

export async function generateContent(...) {
  logger.info('Starting content generation');  // No context!
  // ...
}

// src/lib/agents/content-generator.ts (AFTER)
import { createAgentLogger } from '@/lib/observability/agent-logger';

export async function generateContent(conversationId: string, ...) {
  const agentLog = createAgentLogger({
    conversationId,
    agentName: 'content-generator',
    phase: 'generation',
    businessId
  });

  agentLog.start('Starting content generation');

  try {
    const result = await withRetry(() => generateText({...}));
    agentLog.complete('Content generated', { wordCount: result.length });
    return result;
  } catch (error) {
    agentLog.error('Generation failed', error);
    throw error;
  }
}
```

**Priority agents to update:**
1. `content-generator.ts`
2. `story-extractor.ts`
3. `image-analysis.ts`
4. `quality-checker.ts`

---

### Phase 2: Build Agentic Features (Weeks 2-4)

**Use current Vercel AI SDK** - it works and is stable.

```typescript
// src/lib/agents/discovery.ts
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { createAgentLogger } from '@/lib/observability/agent-logger';
import { withCircuitBreaker } from '@/lib/agents/circuit-breaker';
import { withRetry, AI_RETRY_OPTIONS } from '@/lib/ai/retry';

export async function runDiscoveryAgent(
  message: string,
  history: Message[],
  context: AgentContext
) {
  const agentLog = createAgentLogger({
    conversationId: context.conversationId,
    agentName: 'discovery',
    phase: 'onboarding',
    businessId: context.businessId
  });

  agentLog.start('Processing user message', { messageLength: message.length });

  try {
    const result = await withCircuitBreaker('discovery', async () => {
      return withRetry(async () => {
        return generateText({
          model: google('gemini-2.5-flash'),
          system: DISCOVERY_SYSTEM_PROMPT,
          messages: [...history, { role: 'user', content: message }],
          tools: {
            searchBusiness: searchBusinessTool,
            confirmMatch: confirmMatchTool,
            extractDetails: extractDetailsTool,
          },
          experimental_telemetry: {
            isEnabled: true,
            functionId: 'discovery-agent',
            metadata: {
              conversationId: context.conversationId,
              phase: 'onboarding',
            },
          },
        });
      }, AI_RETRY_OPTIONS);
    });

    agentLog.decision(
      'Agent response generated',
      result.toolCalls?.map(t => t.toolName) || ['text-response'],
      0.9
    );

    return result;
  } catch (error) {
    agentLog.error('Discovery agent failed', error as Error);
    throw error;
  }
}
```

---

### Phase 3: Evaluate Native SDK (Week 5)

**ONLY IF** you hit Vercel AI SDK limitations:

```bash
# Check: What features are we missing?
npm run audit:ai-features

# Compare: Side-by-side implementation
npm run test:sdk-comparison
```

**Migrate to `@google/genai` IF:**
- Context caching needed (not in Vercel SDK)
- Native streaming reconnection needed
- Gemini-specific features unavailable

**Stay with Vercel AI SDK IF:**
- Everything works as-is
- Provider flexibility valued
- Team prefers current patterns

---

### Phase 4: Interactions API (Future - When GA)

**Criteria to adopt Interactions API:**
- [ ] Reaches General Availability (not beta)
- [ ] TypeScript types fixed (no `unknown` unions)
- [ ] 3+ production case studies published
- [ ] Deep Research proves ROI in A/B test

**Until then:** Use stable `generateContent` for all production workloads.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    KNEARME AGENT ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    OBSERVABILITY LAYER                       │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │ │
│  │  │  Langfuse   │  │ Agent Logger│  │  Feature Flags      │  │ │
│  │  │  (Tracing)  │  │ (Corr IDs)  │  │  (Kill Switch)      │  │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              ↓                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    RESILIENCE LAYER                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │ │
│  │  │   Retry     │  │  Circuit    │  │  Graceful           │  │ │
│  │  │   Logic     │  │  Breakers   │  │  Degradation        │  │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              ↓                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    AGENT LAYER                               │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │ │
│  │  │Discovery │  │  Story   │  │ Content  │  │ Quality  │    │ │
│  │  │  Agent   │  │Extractor │  │Generator │  │ Checker  │    │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              ↓                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    SDK LAYER                                 │ │
│  │  ┌─────────────────────────────────────────────────────┐    │ │
│  │  │           Vercel AI SDK (@ai-sdk/google)            │    │ │
│  │  │     generateText() | streamText() | generateObject()│    │ │
│  │  └─────────────────────────────────────────────────────┘    │ │
│  │                              ↓                               │ │
│  │  ┌─────────────────────────────────────────────────────┐    │ │
│  │  │              Google Gemini Models                   │    │ │
│  │  │   gemini-2.5-flash | gemini-3-flash-preview | pro   │    │ │
│  │  └─────────────────────────────────────────────────────┘    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Success Metrics

### Reliability
| Metric | Target | How to Measure |
|--------|--------|----------------|
| Agent error rate | < 2% | Langfuse error traces / total |
| P95 latency | < 10s | Langfuse latency dashboard |
| Circuit breaker trips | < 1/day | Circuit breaker events |
| Successful fallbacks | 100% | Form fallback completion |

### Observability
| Metric | Target | How to Measure |
|--------|--------|----------------|
| Trace coverage | 100% agents | Langfuse trace count |
| Correlation ID usage | All requests | Log audit |
| Debug time | < 5 min | Time to root cause |
| Alert response | < 15 min | PagerDuty/Slack |

### User Delight
| Metric | Target | How to Measure |
|--------|--------|----------------|
| Onboarding completion | > 80% | Funnel analytics |
| Time to first portfolio | < 10 min | Event timing |
| Agent confidence avg | > 0.7 | Langfuse metadata |
| Fallback usage | < 10% | Feature flag metrics |

---

## Immediate Action Items

### Today (30 minutes)
1. [ ] Create `instrumentation.ts` at project root
2. [ ] Add `instrumentationHook: true` to `next.config.ts`
3. [ ] Deploy and verify traces appear in Langfuse

### This Week (4-6 hours)
4. [ ] Add agent logger to `content-generator.ts`
5. [ ] Add agent logger to `story-extractor.ts`
6. [ ] Add agent logger to `image-analysis.ts`
7. [ ] Document Langfuse dashboard queries

### Next Sprint
8. [ ] Build agentic onboarding with current SDK
9. [ ] Add circuit breaker monitoring dashboard
10. [ ] Create fallback trigger rules

---

## What We're NOT Doing (And Why)

| Rejected Option | Why |
|-----------------|-----|
| **Migrate to Interactions API** | Beta, TypeScript broken, zero production adoption |
| **Migrate to @google/genai** | No proven benefit over Vercel AI SDK for our use case |
| **Build Deep Research** | No user need validated; premature optimization |
| **Replace Langfuse** | Already integrated, just needs wiring |
| **Another SDK migration** | Team just finished OASDK migration; focus on stability |

---

## The Bottom Line

> **The best technology is the one that's working.**

Your current stack with Vercel AI SDK + Gemini is production-ready. The gaps are:
1. Langfuse isn't wired up (30-minute fix)
2. Agent logger isn't adopted (few hours fix)
3. Decision capture isn't implemented (can add incrementally)

**Fix these gaps. Ship agentic features. Delight users.**

When you hit actual limitations, *then* evaluate native SDK migration. Until then, build value with what works.

---

## Debate Summary

| Team | Position | Key Evidence | Final Assessment |
|------|----------|--------------|------------------|
| **PRO-INTERACTIONS** | Migrate now | Server-state, Deep Research | Lost - API not ready |
| **PRO-VERCEL** | Stay put | Stability, recent migration | Won on stability |
| **ALTERNATIVES** | Hybrid approach | Best of both | Adopted partially |
| **SDK-RESEARCH** | Data-driven | Zero production adoption | Key evidence |
| **REAL-WORLD** | Field research | TypeScript broken | Decisive evidence |

**Winner: Pragmatic Stability**

Stay with Vercel AI SDK. Fix observability. Build features. Evaluate migration when there's evidence it's needed.

---

## Approval

- [ ] Create `instrumentation.ts` today
- [ ] Adopt agent logger in 4 critical agents this week
- [ ] Ship agentic onboarding with current SDK
- [ ] Re-evaluate Interactions API when it reaches GA

**Decision Owner:** Team
**Execution Owner:** You
**Timeline:** Start today

---

*Document generated after multi-agent debate with 6 research teams, 4 rebuttals, and real-world evidence gathering.*
