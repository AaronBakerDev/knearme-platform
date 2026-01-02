# Operational Excellence: Testing, Observability & Resilience

> **Goal:** Ensure agentic features are reliable, debuggable, and fail gracefully

This document consolidates the strategies for testing emergent agent behavior, debugging multi-agent decisions, and graceful degradation when things go wrong.

---

## 1. Testing Strategy for Agentic Systems

### The Challenge

Traditional testing asserts exact outputs. But agents have emergent behavior—they decide what to ask, when to hand off, and how to structure responses. We need to test behavior patterns, not exact strings.

### What's Testable vs What Requires Integration

| Testable (Unit) | Requires Integration |
|-----------------|---------------------|
| Tool schema validation | Multi-turn conversation quality |
| State transformation functions | Agent persona consistency |
| Constraint enforcement | Natural handoff timing |
| Data extraction parsing | End-to-end user experience |
| Deduplication logic | Voice matching across responses |

### Testing Layers

#### 1.1 Unit Testing Agents

**Mock the AI provider layer:**
```typescript
// Pattern from existing tests
vi.mock('@/lib/ai/providers', () => ({
  isGoogleAIEnabled: vi.fn(() => false),
  AI_MODELS: { generation: 'mock-model' }
}));
```

**Property-based testing for constraints:**
```typescript
// Test that constraints are ALWAYS enforced
it.each([
  ['extremely long title...'.repeat(10), 60],
  ['', 60],
  ['Normal title', 60],
])('truncates title to max length', (input, maxLength) => {
  const result = enforceConstraints({ title: input });
  expect(result.title.length).toBeLessThanOrEqual(maxLength);
});
```

#### 1.2 Conversation Scenario Testing

Test flows without asserting exact text:

```typescript
const FURNITURE_MAKER_ONBOARDING = {
  name: "Furniture maker onboarding flow",
  turns: [
    {
      user: "I make custom furniture in Denver",
      assertAgentDid: [
        "extracted business type",
        "identified location",
        "asked follow-up about specialty"
      ],
      mustNotDo: ["assume masonry vocabulary"]
    }
  ],
  finalStateAssertions: {
    "business.type": "furniture_maker",
    "images.length": { gte: 0 }
  }
};
```

#### 1.3 LLM-as-Judge Evaluation

Use a separate model to evaluate agent responses:

```typescript
interface JudgmentCriteria {
  helpfulness: number;     // 1-5
  accuracy: number;        // 1-5
  voiceConsistency: number; // 1-5
  naturalness: number;     // 1-5
  noHallucination: boolean;
}
```

**Quality weights:**
- Helpfulness: 25%
- Accuracy: 25%
- Voice Match: 20%
- No Hallucination: 20%
- Naturalness: 10%

#### 1.4 Edge Case Scenarios

Create specific tests for adversarial inputs:
- `user-confusion.ts` - Contradictory information
- `hostile-input.ts` - Rude or confrontational
- `minimal-responses.ts` - One-word answers
- `over-sharing.ts` - Too much info at once
- `multi-business-types.ts` - Mentions multiple trades

### Test File Structure

```
src/lib/agents/__tests__/
├── fixtures/
│   ├── extraction-responses.ts
│   └── conversation-scenarios.ts
├── story-extractor.test.ts     # EXISTS - expand
├── content-generator.test.ts   # EXISTS - expand
├── orchestrator.test.ts        # ADD
├── handoff.test.ts             # ADD
└── integration/
    ├── handoffs.test.ts
    ├── state-persistence.test.ts
    └── full-flow.test.ts
```

---

## 2. Observability & Debugging

### The Challenge

Multiple agents collaborate autonomously. When something goes wrong, we need to answer: "Why did the agent do that?"

### Logging Architecture

#### 2.1 Agent-Specific Log Structure

```typescript
interface AgentLogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';

  agent: {
    name: 'story-extractor' | 'content-generator' | 'orchestrator';
    phase: 'gathering' | 'images' | 'generating' | 'review' | 'ready';
    invocationId: string;
  };

  correlation: {
    conversationId: string;
    traceId: string;
    parentSpanId?: string;
    projectId?: string;
    contractorId: string;
  };

  event: {
    type: 'agent_start' | 'agent_decision' | 'agent_handoff' | 'tool_call' | 'agent_complete';
    message: string;
    data?: Record<string, unknown>;
  };
}
```

#### 2.2 Log Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| **debug** | Internal state changes | "Checking readyForImages: { projectType: 'chimney-rebuild' }" |
| **info** | Agent lifecycle events | "StoryExtractor completed, extracted 4 fields" |
| **warn** | Degraded operation | "ContentGenerator retrying after rate limit" |
| **error** | Failures needing investigation | "QualityChecker failed: Invalid state" |

### Tracing Agent Decisions

#### 2.3 Correlation ID Hierarchy

```
conversationId (chat_sessions.id)
└── requestTraceId (per API request)
    └── agentSpanId (per agent invocation)
        └── toolSpanId (per tool call)
```

#### 2.4 Decision Transparency

Capture reasoning for post-hoc analysis:

```typescript
interface AgentReasoningLog {
  agentName: string;
  inputState: Partial<SharedProjectState>;

  reasoning: {
    observations: string[];     // What the agent noticed
    considerations: string[];   // Options it considered
    decision: string;           // What it decided
    confidence: number;         // 0-1
  };

  outputState: Partial<SharedProjectState>;
}
```

### Replay & Debug

#### 2.5 Conversation Replay

```typescript
interface ReplaySession {
  conversationId: string;
  messages: ReplayMessage[];
  agentInvocations: AgentInvocationRecord[];
  timeline: TimelineEvent[];
}

// CLI tool for debugging
// npx tsx scripts/debug/replay-conversation.ts --session-id abc123
```

#### 2.6 State Snapshots

Capture state at key decision points for time-travel debugging:

```typescript
interface StateSnapshot {
  id: string;
  conversationId: string;
  timestamp: string;
  trigger: 'agent_start' | 'agent_complete' | 'tool_result';
  state: SharedProjectState;
}
```

### Key Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `agent.latency.p95` | 95th percentile duration | > 5s extractors, > 15s generators |
| `agent.error_rate` | Errors per 100 invocations | > 5% |
| `agent.confidence.avg` | Average confidence score | < 0.6 |
| `token.per_session.avg` | Tokens per conversation | > 50k |

---

## 3. Rollback & Graceful Degradation

### The Challenge

We're migrating from wizard-based UI to conversation-first agents. Users must never be stuck—always have a path forward.

### Feature Flags

#### 3.1 Flag Configuration

```typescript
interface AgenticFeatureFlags {
  agenticEnabled: boolean;           // Master switch
  agenticOnboarding: boolean;        // Discovery Agent
  agenticProjectCreation: boolean;   // Story Agent
  businessDiscovery: boolean;        // DataForSEO integration

  rolloutPercentage: number;         // 0-100
  allowlistContractorIds: string[];  // Always enabled
  blocklistContractorIds: string[];  // Never enabled

  minConversationConfidence: number; // Below this, suggest form
  maxAgentErrorRate: number;         // Above this, auto-disable
}
```

#### 3.2 Flag Resolution Priority

1. Kill switch (in-memory) - highest priority
2. Blocklist - explicitly disabled
3. Allowlist - explicitly enabled
4. Contractor-level override (from DB)
5. Rollout percentage (hash-based deterministic)
6. Environment defaults

### Fallback Triggers

#### 3.3 When to Fall Back to Forms

| Trigger | Detection | Action |
|---------|-----------|--------|
| **Explicit request** | "let me use the form" | Immediate fallback |
| **Error rate** | > 30% of turns fail | Suggest fallback |
| **Low confidence** | Average < 50% | Suggest fallback |
| **Timeout** | Response > 30s | Suggest fallback |
| **Frustration** | Detected signals | Suggest fallback |

#### 3.4 Frustration Detection

```typescript
const frustrationPatterns = [
  /\b(doesn't|does not)\s+work/i,
  /\b(not|can't)\s+(understand|help)/i,
  /\bjust (let me|want to)\s+(fill|type)/i,
  /\bform\s*(instead|please)/i,
  /[!?]{3,}/,  // Multiple punctuation
];
```

### Circuit Breakers

#### 3.5 Per-Agent Circuit Breakers

```
States:
- CLOSED: Normal operation, requests pass through
- OPEN: Failures exceeded threshold, requests fail fast
- HALF_OPEN: Testing if service recovered

Thresholds:
- failureThreshold: 5 failures to open
- successThreshold: 3 successes to close
- timeout: 60s before OPEN → HALF_OPEN
```

#### 3.6 Circuit Breaker Integration

```typescript
// Wrap tool executors with circuit breaker protection
if (!canExecute(agentType)) {
  return {
    success: false,
    error: 'Service temporarily unavailable. Please try again or use the form.',
    circuitOpen: true,
  };
}
```

### State Preservation

#### 3.7 Conversation-to-Form Mapping

All extracted data transfers seamlessly to form fields:

```typescript
function conversationToFormData(extracted: ExtractedProjectData): WizardFormData {
  return {
    projectType: extracted.project_type,
    customerProblem: extracted.customer_problem,
    materials: extracted.materials_mentioned,
    // ... all fields mapped
  };
}
```

#### 3.8 Session Checkpoints

Save state at key points for recovery:
- After each successful extraction
- Before each agent operation
- On user-initiated save

### Parallel Paths

#### 3.9 Route Structure

```
Current (Wizard):
/profile/setup      → 3-step form wizard
/projects/new       → 6-step wizard

New (Agentic):
/onboard            → Discovery Agent conversation
/create             → Story Agent conversation

Both share:
/projects/[id]      → Edit experience
```

### User Communication

#### 3.10 Fallback UI

When fallback is triggered:
1. Explain what happened (briefly)
2. Reassure data is saved
3. Offer options: "Keep chatting" or "Use form"
4. Transfer state seamlessly

#### 3.11 Beta Badge

Show for agentic features:
- Indicates beta status
- Explains: "Say 'use the form' anytime to switch"
- Links to feedback

---

## 4. Implementation Files

### Testing
- `/src/lib/testing/llm-judge.ts` - LLM evaluation framework
- `/src/lib/testing/regression-suite.ts` - Automated regression runner
- `/src/lib/chat/__tests__/scenarios/` - Conversation test scenarios

### Observability
- `/src/lib/observability/agent-logger.ts` - Agent-specific structured logging
- `/src/lib/observability/correlation.ts` - Trace ID management
- `/src/lib/observability/reasoning.ts` - Decision capture
- `/src/lib/debug/replay.ts` - Conversation replay system

### Resilience
- `/src/lib/config/feature-flags.ts` - Flag resolution logic
- `/src/lib/config/kill-switch.ts` - Emergency disable
- `/src/lib/agents/circuit-breaker.ts` - Per-agent circuit breakers
- `/src/lib/agents/fallback-triggers.ts` - Fallback detection
- `/src/lib/chat/state-transfer.ts` - Form ↔ conversation mapping

---

## 5. Migration Timeline

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 0 | 1-2 days | Feature flags, circuit breakers, state transfer |
| Phase 1 | 1 week | /onboard route, 10% A/B test |
| Phase 2 | 1 week | Increase rollout, full circuit breaker |
| Phase 3 | 1-2 weeks | Enhanced project creation, content A/B |
| Phase 4 | Ongoing | Gradual increase, monitor, collect feedback |

### Sunsetting Criteria

Retire wizard paths when:
1. Agentic completion rate >= 95% of wizard
2. Error/fallback rate < 5%
3. No circuit breaker trips in 7 days
4. User feedback 4+ rating
5. 30 days stable operation

**Forms remain as permanent fallback option.**

---

## References

- [agent-philosophy.md](./agent-philosophy.md) - Core principles
- [over-engineering-audit.md](./over-engineering-audit.md) - What to fix
- [implementation-roadmap.md](./implementation-roadmap.md) - Migration phases
- [agentic-first-experience.md](./agentic-first-experience.md) - Full UX vision
