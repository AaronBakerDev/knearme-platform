# Improving Agents: A Comprehensive Guide

This guide covers strategies for continuously improving agent performance, from collecting feedback to deploying refined versions. The goal is to establish a systematic approach to agent improvement that reduces failures and increases user satisfaction.

## The Continuous Improvement Loop

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│    ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐        │
│    │  Deploy  │────▶│ Monitor  │────▶│ Analyze  │────▶│ Improve  │────┐   │
│    └──────────┘     └──────────┘     └──────────┘     └──────────┘    │   │
│         ▲                                                              │   │
│         └──────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Core Principle:** Every agent deployment should be treated as a learning opportunity. Build instrumentation from day one.

---

## 1. Feedback Collection

Collecting structured feedback is the foundation of agent improvement. Without data, improvements are guesswork.

### 1.1 User Ratings (Thumbs Up/Down)

The simplest and most valuable feedback mechanism.

```typescript
// feedback-schema.ts
interface UserFeedback {
  sessionId: string;
  conversationId: string;
  messageId: string;
  rating: 'positive' | 'negative' | null;
  timestamp: Date;
  userId?: string;
  additionalContext?: {
    wasTaskCompleted: boolean;
    userComment?: string;
    selectedIssues?: FeedbackIssue[];
  };
}

type FeedbackIssue =
  | 'wrong_answer'
  | 'incomplete_response'
  | 'too_slow'
  | 'didnt_understand'
  | 'wrong_tool_used'
  | 'hallucination'
  | 'formatting_issues'
  | 'other';
```

**Implementation Pattern:**

```typescript
// feedback-collector.ts
import { EventEmitter } from "events";

interface FeedbackEvent {
  type: 'rating' | 'comment' | 'issue';
  payload: UserFeedback;
}

class FeedbackCollector extends EventEmitter {
  private storage: FeedbackStorage;

  constructor(storage: FeedbackStorage) {
    super();
    this.storage = storage;
  }

  async recordRating(
    sessionId: string,
    messageId: string,
    rating: 'positive' | 'negative'
  ): Promise<void> {
    const feedback: UserFeedback = {
      sessionId,
      conversationId: this.getCurrentConversationId(sessionId),
      messageId,
      rating,
      timestamp: new Date(),
    };

    await this.storage.save(feedback);
    this.emit('feedback', { type: 'rating', payload: feedback });
  }

  async recordDetailedFeedback(
    sessionId: string,
    messageId: string,
    issues: FeedbackIssue[],
    comment?: string
  ): Promise<void> {
    const feedback: UserFeedback = {
      sessionId,
      conversationId: this.getCurrentConversationId(sessionId),
      messageId,
      rating: 'negative',
      timestamp: new Date(),
      additionalContext: {
        wasTaskCompleted: false,
        userComment: comment,
        selectedIssues: issues,
      },
    };

    await this.storage.save(feedback);
    this.emit('feedback', { type: 'issue', payload: feedback });
  }
}
```

**Dashboard Metrics to Track:**

| Metric | Formula | Target |
|--------|---------|--------|
| Positive Rate | Thumbs up / Total ratings | > 85% |
| Feedback Rate | Rated messages / Total messages | > 10% |
| Issue Distribution | Count per issue type | Identify patterns |
| Trend | Week-over-week change | Improving |

### 1.2 Error Logs and Failures

Capture and categorize all failures for analysis.

```typescript
// error-logger.ts
interface AgentError {
  id: string;
  sessionId: string;
  conversationId: string;
  timestamp: Date;
  category: ErrorCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  context: {
    userMessage: string;
    toolsAttempted: string[];
    modelUsed: string;
    promptVersion: string;
    retriesAttempted: number;
  };
  resolution?: {
    wasRecovered: boolean;
    recoveryMethod?: string;
    userImpact: string;
  };
}

type ErrorCategory =
  | 'tool_execution_failed'
  | 'rate_limit_exceeded'
  | 'context_overflow'
  | 'hallucination_detected'
  | 'infinite_loop'
  | 'timeout'
  | 'permission_denied'
  | 'validation_failed'
  | 'external_api_error'
  | 'unknown';

class ErrorLogger {
  async logError(error: Error, context: Partial<AgentError>): Promise<string> {
    const errorRecord: AgentError = {
      id: generateId(),
      sessionId: context.sessionId || 'unknown',
      conversationId: context.conversationId || 'unknown',
      timestamp: new Date(),
      category: this.categorizeError(error),
      severity: this.assessSeverity(error),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context: {
        userMessage: context.context?.userMessage || '',
        toolsAttempted: context.context?.toolsAttempted || [],
        modelUsed: context.context?.modelUsed || 'unknown',
        promptVersion: context.context?.promptVersion || 'unknown',
        retriesAttempted: context.context?.retriesAttempted || 0,
      },
    };

    await this.storage.save(errorRecord);

    // Alert on critical errors
    if (errorRecord.severity === 'critical') {
      await this.alertOncall(errorRecord);
    }

    return errorRecord.id;
  }

  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();

    if (message.includes('rate limit')) return 'rate_limit_exceeded';
    if (message.includes('context') && message.includes('length')) return 'context_overflow';
    if (message.includes('timeout')) return 'timeout';
    if (message.includes('permission')) return 'permission_denied';
    if (error.name === 'ValidationError') return 'validation_failed';

    return 'unknown';
  }
}
```

**Error Tracking Dashboard Template:**

```sql
-- Daily error summary query
SELECT
  DATE(timestamp) as date,
  category,
  severity,
  COUNT(*) as error_count,
  COUNT(DISTINCT session_id) as affected_sessions,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY DATE(timestamp)), 2) as pct_of_daily
FROM agent_errors
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY DATE(timestamp), category, severity
ORDER BY date DESC, error_count DESC;
```

### 1.3 Session Recordings

Capture full conversation context for post-mortem analysis.

```typescript
// session-recorder.ts
interface SessionRecording {
  id: string;
  startTime: Date;
  endTime?: Date;
  userId?: string;
  agentVersion: string;
  promptVersion: string;
  modelUsed: string;
  messages: RecordedMessage[];
  toolInvocations: ToolInvocation[];
  metadata: {
    totalTokensUsed: number;
    totalCost: number;
    totalDurationMs: number;
    wasSuccessful: boolean;
    endReason: 'completed' | 'error' | 'timeout' | 'user_abandoned';
  };
  feedback?: UserFeedback;
}

interface RecordedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokenCount: number;
  durationMs: number;
}

interface ToolInvocation {
  id: string;
  messageId: string;
  toolName: string;
  input: Record<string, unknown>;
  output?: unknown;
  error?: string;
  durationMs: number;
  timestamp: Date;
}

class SessionRecorder {
  private currentSession: SessionRecording | null = null;

  startSession(config: { agentVersion: string; promptVersion: string; modelUsed: string }): string {
    this.currentSession = {
      id: generateId(),
      startTime: new Date(),
      agentVersion: config.agentVersion,
      promptVersion: config.promptVersion,
      modelUsed: config.modelUsed,
      messages: [],
      toolInvocations: [],
      metadata: {
        totalTokensUsed: 0,
        totalCost: 0,
        totalDurationMs: 0,
        wasSuccessful: false,
        endReason: 'user_abandoned',
      },
    };

    return this.currentSession.id;
  }

  recordMessage(message: Omit<RecordedMessage, 'id'>): void {
    if (!this.currentSession) return;

    this.currentSession.messages.push({
      id: generateId(),
      ...message,
    });

    this.currentSession.metadata.totalTokensUsed += message.tokenCount;
    this.currentSession.metadata.totalDurationMs += message.durationMs;
  }

  recordToolInvocation(invocation: Omit<ToolInvocation, 'id'>): void {
    if (!this.currentSession) return;

    this.currentSession.toolInvocations.push({
      id: generateId(),
      ...invocation,
    });
  }

  async endSession(endReason: SessionRecording['metadata']['endReason']): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.endTime = new Date();
    this.currentSession.metadata.endReason = endReason;
    this.currentSession.metadata.wasSuccessful = endReason === 'completed';

    await this.storage.save(this.currentSession);
    this.currentSession = null;
  }
}
```

### 1.4 User Comments

Capture qualitative feedback for deeper insights.

```typescript
// comment-analyzer.ts
interface CommentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  topics: string[];
  actionableInsights: string[];
  urgency: 'low' | 'medium' | 'high';
}

async function analyzeUserComments(comments: string[]): Promise<CommentAnalysis[]> {
  // Use Claude to analyze feedback themes
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: `Analyze these user feedback comments and identify:
1. Overall sentiment
2. Common topics/themes
3. Actionable improvements
4. Urgency level

Comments:
${comments.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Respond in JSON format.`
    }]
  });

  return JSON.parse(response.content[0].text);
}
```

---

## 2. A/B Testing Strategies

Rigorous A/B testing is essential for data-driven agent improvements.

### 2.1 Testing Different Prompts

```typescript
// prompt-experiment.ts
interface PromptExperiment {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'completed' | 'aborted';
  startDate: Date;
  endDate?: Date;
  variants: PromptVariant[];
  targetMetrics: string[];
  minimumSampleSize: number;
  trafficAllocation: Record<string, number>; // variant_id -> percentage
}

interface PromptVariant {
  id: string;
  name: string;
  systemPrompt: string;
  description: string;
  isControl: boolean;
}

class PromptExperimentRunner {
  private experiments: Map<string, PromptExperiment> = new Map();

  createExperiment(config: Omit<PromptExperiment, 'id' | 'status'>): string {
    const experiment: PromptExperiment = {
      id: generateId(),
      status: 'draft',
      ...config,
    };

    this.experiments.set(experiment.id, experiment);
    return experiment.id;
  }

  assignVariant(experimentId: string, sessionId: string): PromptVariant {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
      throw new Error('Experiment not running');
    }

    // Deterministic assignment based on session ID for consistency
    const hash = this.hashString(sessionId);
    const bucket = hash % 100;

    let cumulative = 0;
    for (const [variantId, percentage] of Object.entries(experiment.trafficAllocation)) {
      cumulative += percentage;
      if (bucket < cumulative) {
        return experiment.variants.find(v => v.id === variantId)!;
      }
    }

    return experiment.variants[0];
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
```

**Example: Testing Prompt Variations**

```typescript
const experiment = experimentRunner.createExperiment({
  name: "System prompt tone test",
  startDate: new Date(),
  variants: [
    {
      id: "control",
      name: "Current Production",
      isControl: true,
      systemPrompt: `You are a helpful assistant for masonry contractors.
Answer questions accurately and professionally.`,
      description: "Baseline professional tone",
    },
    {
      id: "friendly",
      name: "Friendly Tone",
      isControl: false,
      systemPrompt: `You're a friendly expert helping masonry contractors succeed.
Be warm, encouraging, and practical in your responses.`,
      description: "More casual, encouraging tone",
    },
    {
      id: "expert",
      name: "Expert Authority",
      isControl: false,
      systemPrompt: `You are an expert masonry consultant with 30 years of experience.
Provide authoritative, detailed guidance backed by industry best practices.`,
      description: "Authoritative expert positioning",
    },
  ],
  targetMetrics: ["positive_rating_rate", "task_completion_rate", "session_duration"],
  minimumSampleSize: 500,
  trafficAllocation: {
    "control": 40,
    "friendly": 30,
    "expert": 30,
  },
});
```

### 2.2 Testing Different Models

```typescript
// model-experiment.ts
interface ModelVariant {
  id: string;
  name: string;
  model: string;
  maxTokens: number;
  temperature: number;
  description: string;
}

const modelExperiment = {
  name: "Model comparison for code generation",
  variants: [
    {
      id: "sonnet",
      name: "Claude Sonnet 4",
      model: "claude-sonnet-4-5-20250929",
      maxTokens: 8192,
      temperature: 0.7,
      description: "Balanced speed/quality",
    },
    {
      id: "opus",
      name: "Claude Opus 4",
      model: "claude-opus-4-5-20251101",
      maxTokens: 8192,
      temperature: 0.7,
      description: "Maximum quality",
    },
    {
      id: "haiku",
      name: "Claude Haiku 3.5",
      model: "claude-3-5-haiku-20241022",
      maxTokens: 8192,
      temperature: 0.7,
      description: "Fast, cost-effective",
    },
  ],
  metrics: [
    "response_quality_score",
    "latency_p50",
    "latency_p95",
    "cost_per_session",
    "user_satisfaction",
  ],
};
```

### 2.3 Testing Different Tool Sets

```typescript
// tool-experiment.ts
interface ToolSetVariant {
  id: string;
  name: string;
  allowedTools: string[];
  description: string;
}

const toolExperiment = {
  name: "Tool availability impact on task completion",
  variants: [
    {
      id: "minimal",
      name: "Minimal Tools",
      allowedTools: ["Read", "Glob"],
      description: "Read-only access",
    },
    {
      id: "standard",
      name: "Standard Tools",
      allowedTools: ["Read", "Glob", "Grep", "Write", "Edit"],
      description: "File operations without Bash",
    },
    {
      id: "full",
      name: "Full Tools",
      allowedTools: ["Read", "Glob", "Grep", "Write", "Edit", "Bash", "WebSearch"],
      description: "All tools available",
    },
  ],
};
```

### 2.4 Statistical Significance

**When to conclude an experiment:**

```typescript
// statistical-analysis.ts
interface ExperimentResults {
  variantId: string;
  sampleSize: number;
  conversionRate: number;
  confidence: number;
  standardError: number;
}

function calculateStatisticalSignificance(
  control: ExperimentResults,
  treatment: ExperimentResults
): { significant: boolean; pValue: number; lift: number } {
  // Z-test for proportions
  const pooledProportion =
    (control.conversionRate * control.sampleSize + treatment.conversionRate * treatment.sampleSize) /
    (control.sampleSize + treatment.sampleSize);

  const standardError = Math.sqrt(
    pooledProportion * (1 - pooledProportion) *
    (1 / control.sampleSize + 1 / treatment.sampleSize)
  );

  const zScore = (treatment.conversionRate - control.conversionRate) / standardError;
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));

  const lift = ((treatment.conversionRate - control.conversionRate) / control.conversionRate) * 100;

  return {
    significant: pValue < 0.05,
    pValue,
    lift,
  };
}

function normalCDF(x: number): number {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}
```

**Minimum Sample Size Calculator:**

```typescript
function calculateMinimumSampleSize(
  baselineConversionRate: number,
  minimumDetectableEffect: number, // e.g., 0.05 for 5% relative improvement
  alpha: number = 0.05,  // Type I error rate
  power: number = 0.80   // Statistical power
): number {
  const p1 = baselineConversionRate;
  const p2 = baselineConversionRate * (1 + minimumDetectableEffect);

  const zAlpha = 1.96;  // For alpha = 0.05
  const zBeta = 0.84;   // For power = 0.80

  const pooledP = (p1 + p2) / 2;

  const numerator = Math.pow(
    zAlpha * Math.sqrt(2 * pooledP * (1 - pooledP)) +
    zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)),
    2
  );

  const denominator = Math.pow(p2 - p1, 2);

  return Math.ceil(numerator / denominator);
}

// Example: 75% baseline, detect 5% relative improvement
const minSampleSize = calculateMinimumSampleSize(0.75, 0.05);
// Result: ~1,500 sessions per variant
```

---

## 3. Prompt Iteration

Systematic prompt improvement based on failure analysis.

### 3.1 Analyzing Failure Cases

```typescript
// failure-analyzer.ts
interface FailurePattern {
  pattern: string;
  frequency: number;
  examples: FailureExample[];
  suggestedFix: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface FailureExample {
  sessionId: string;
  userMessage: string;
  agentResponse: string;
  expectedBehavior: string;
  actualBehavior: string;
  rootCause?: string;
}

async function analyzeFailurePatterns(
  failures: FailureExample[]
): Promise<FailurePattern[]> {
  // Group similar failures using embeddings
  const embeddings = await generateEmbeddings(
    failures.map(f => `${f.userMessage}\n${f.actualBehavior}`)
  );

  const clusters = clusterByEmbeddings(embeddings, { minClusterSize: 3 });

  // Analyze each cluster
  const patterns: FailurePattern[] = [];

  for (const cluster of clusters) {
    const clusterFailures = cluster.indices.map(i => failures[i]);

    // Use Claude to identify pattern
    const analysis = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `Analyze these agent failures and identify:
1. The common pattern causing failures
2. Root cause
3. Suggested prompt fix

Failures:
${clusterFailures.slice(0, 5).map((f, i) => `
Example ${i + 1}:
User: ${f.userMessage}
Expected: ${f.expectedBehavior}
Actual: ${f.actualBehavior}
`).join('\n')}

Respond in JSON: { pattern, rootCause, suggestedFix, priority }`
      }]
    });

    const result = JSON.parse(analysis.content[0].text);
    patterns.push({
      ...result,
      frequency: clusterFailures.length,
      examples: clusterFailures,
    });
  }

  return patterns.sort((a, b) => b.frequency - a.frequency);
}
```

### 3.2 Refining Instructions

**Before and After Pattern:**

```typescript
// Original prompt (with failure pattern: agent provides opinions when asked about preferences)
const beforePrompt = `You are a helpful masonry assistant.
Answer user questions about masonry work.`;

// Refined prompt (addressing the failure pattern)
const afterPrompt = `You are a helpful masonry assistant for contractors.

## Core Responsibilities
- Answer technical questions about masonry work
- Provide information about materials, techniques, and best practices
- Help with project estimation and planning

## Boundaries
- DO NOT provide subjective opinions or preferences
- If asked "which material is best?", provide objective pros/cons and let the user decide
- If asked for recommendations, ask clarifying questions about their specific situation first

## Response Format
- Be concise and direct
- Use bullet points for lists
- Include relevant safety considerations when applicable`;
```

### 3.3 Adding Examples (Few-Shot Learning)

```typescript
const promptWithExamples = `You are a helpful masonry assistant.

## Example Interactions

<example>
<user>What's the best mortar mix for a chimney?</user>
<response>
For chimneys, I recommend Type S mortar for the following reasons:

**Type S Mortar:**
- Higher compressive strength (1,800 psi min)
- Good weather resistance
- Suitable for exterior, above-grade applications

**Mix ratio:** 1 part Portland cement : 0.5 parts lime : 4.5 parts sand

**Important considerations:**
- Always check local building codes for specific requirements
- In freeze-thaw regions, ensure proper curing before cold weather
- Consider adding an integral waterproofer for exposed chimneys

Would you like details on mixing techniques or curing requirements?
</response>
</example>

<example>
<user>My client wants the cheapest option</user>
<response>
I can help you identify cost-effective options. To give you the best guidance, I need to understand:

1. **What type of project?** (wall, patio, chimney, etc.)
2. **Location?** (interior/exterior, load-bearing?)
3. **Size of the project?** (helps calculate material quantities)

With these details, I can compare material options with their cost/durability tradeoffs so you can make an informed recommendation to your client.
</response>
</example>`;
```

### 3.4 Constraint Tuning

**Template for Adding Constraints:**

```typescript
interface PromptConstraint {
  category: 'scope' | 'format' | 'safety' | 'quality' | 'behavior';
  constraint: string;
  rationale: string;
  triggeringFailure?: string;
}

const constraints: PromptConstraint[] = [
  {
    category: 'scope',
    constraint: "Only answer questions related to masonry work. Politely redirect off-topic questions.",
    rationale: "Users were asking unrelated questions and getting responses",
    triggeringFailure: "Session 12345: Agent gave recipe advice when asked about cooking",
  },
  {
    category: 'format',
    constraint: "Keep responses under 500 words unless the user explicitly asks for more detail.",
    rationale: "Users complained about overly long responses",
    triggeringFailure: "Average response length was 800 words, user satisfaction dropped",
  },
  {
    category: 'safety',
    constraint: "Always recommend professional inspection for structural concerns. Never advise on load-bearing modifications without engineering review.",
    rationale: "Liability concerns for structural advice",
    triggeringFailure: "Session 67890: Agent advised on removing a wall without mentioning structural engineer",
  },
  {
    category: 'quality',
    constraint: "Cite specific building codes when relevant (e.g., 'Per IRC R606.2.1').",
    rationale: "Users wanted authoritative references",
    triggeringFailure: "User feedback: 'The advice was helpful but I need to verify it'",
  },
  {
    category: 'behavior',
    constraint: "If unsure about a technical answer, say so and suggest consulting a specialist.",
    rationale: "Agent was hallucinating technical details",
    triggeringFailure: "Session 34567: Agent gave incorrect mortar strength values",
  },
];

// Generate constraint section for prompt
function generateConstraintSection(constraints: PromptConstraint[]): string {
  const grouped = groupBy(constraints, 'category');

  let section = '## Constraints\n\n';

  for (const [category, items] of Object.entries(grouped)) {
    section += `### ${capitalize(category)}\n`;
    for (const item of items) {
      section += `- ${item.constraint}\n`;
    }
    section += '\n';
  }

  return section;
}
```

---

## 4. Version Management

Treat agent configurations as code with proper versioning.

### 4.1 Semantic Versioning for Agents

```
MAJOR.MINOR.PATCH

MAJOR: Breaking changes to agent behavior or API
  - Significant prompt restructuring
  - Tool set changes that alter capabilities
  - Model changes that affect output format

MINOR: New features or non-breaking improvements
  - New tools added
  - New examples added to prompt
  - Performance optimizations

PATCH: Bug fixes and minor adjustments
  - Typo fixes in prompts
  - Constraint tweaks
  - Error handling improvements
```

**Version Schema:**

```typescript
// agent-version.ts
interface AgentVersion {
  version: string;
  releaseDate: Date;
  changelog: ChangelogEntry[];
  config: AgentConfig;
  rollbackTarget?: string; // Previous stable version
  status: 'draft' | 'canary' | 'stable' | 'deprecated';
}

interface ChangelogEntry {
  type: 'feat' | 'fix' | 'perf' | 'refactor' | 'docs';
  description: string;
  linkedIssues?: string[];
}

interface AgentConfig {
  systemPrompt: string;
  model: string;
  maxTokens: number;
  temperature: number;
  allowedTools: string[];
  permissionMode: string;
  constraints: string[];
  examples: string[];
}
```

### 4.2 Feature Flags

```typescript
// feature-flags.ts
interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  conditions?: FlagCondition[];
}

interface FlagCondition {
  type: 'user_id' | 'session_property' | 'time_range' | 'random';
  operator: 'equals' | 'contains' | 'in' | 'between';
  value: unknown;
}

class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();

  isEnabled(flagId: string, context: Record<string, unknown>): boolean {
    const flag = this.flags.get(flagId);
    if (!flag) return false;
    if (!flag.enabled) return false;

    // Check conditions
    if (flag.conditions) {
      for (const condition of flag.conditions) {
        if (!this.evaluateCondition(condition, context)) {
          return false;
        }
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const hash = this.hashContext(context);
      if (hash % 100 >= flag.rolloutPercentage) {
        return false;
      }
    }

    return true;
  }

  private evaluateCondition(condition: FlagCondition, context: Record<string, unknown>): boolean {
    // Implementation of condition evaluation
    switch (condition.type) {
      case 'user_id':
        return context.userId === condition.value;
      case 'random':
        return Math.random() < (condition.value as number);
      // ... other condition types
      default:
        return true;
    }
  }
}

// Usage in agent
const flags = new FeatureFlagManager();

if (flags.isEnabled('new_code_tool', { userId: user.id })) {
  allowedTools.push('AdvancedCodeSearch');
}

if (flags.isEnabled('chain_of_thought_prompting', { userId: user.id })) {
  systemPrompt = enhancedSystemPrompt;
}
```

### 4.3 Gradual Rollouts

```typescript
// rollout-manager.ts
interface RolloutPlan {
  id: string;
  targetVersion: string;
  previousVersion: string;
  stages: RolloutStage[];
  currentStage: number;
  status: 'pending' | 'in_progress' | 'completed' | 'rolled_back';
  healthChecks: HealthCheck[];
}

interface RolloutStage {
  name: string;
  percentage: number;
  duration: number; // Hours to remain at this stage
  requiredMetrics: MetricThreshold[];
}

interface MetricThreshold {
  metric: string;
  operator: 'gte' | 'lte' | 'between';
  value: number | [number, number];
}

interface HealthCheck {
  name: string;
  query: string;
  threshold: number;
  currentValue?: number;
  passing: boolean;
}

class RolloutManager {
  async createRollout(config: Omit<RolloutPlan, 'id' | 'status' | 'currentStage'>): Promise<string> {
    const plan: RolloutPlan = {
      id: generateId(),
      status: 'pending',
      currentStage: 0,
      ...config,
    };

    await this.storage.save(plan);
    return plan.id;
  }

  async advanceStage(planId: string): Promise<boolean> {
    const plan = await this.storage.get(planId);
    if (!plan || plan.status !== 'in_progress') {
      return false;
    }

    // Check health metrics
    const healthPassing = await this.checkHealth(plan);
    if (!healthPassing) {
      await this.rollback(planId);
      return false;
    }

    // Advance to next stage
    plan.currentStage++;
    if (plan.currentStage >= plan.stages.length) {
      plan.status = 'completed';
    }

    await this.storage.save(plan);
    return true;
  }

  private async checkHealth(plan: RolloutPlan): Promise<boolean> {
    for (const check of plan.healthChecks) {
      const value = await this.evaluateMetric(check.query);
      check.currentValue = value;
      check.passing = value >= check.threshold;

      if (!check.passing) {
        return false;
      }
    }
    return true;
  }
}

// Example rollout plan
const rolloutPlan: Omit<RolloutPlan, 'id' | 'status' | 'currentStage'> = {
  targetVersion: '2.1.0',
  previousVersion: '2.0.5',
  stages: [
    { name: 'Canary', percentage: 1, duration: 2, requiredMetrics: [] },
    { name: 'Early Adopters', percentage: 10, duration: 6, requiredMetrics: [] },
    { name: 'Partial Rollout', percentage: 50, duration: 24, requiredMetrics: [] },
    { name: 'Full Rollout', percentage: 100, duration: 0, requiredMetrics: [] },
  ],
  healthChecks: [
    { name: 'Error Rate', query: 'error_rate_last_hour', threshold: 0.02, passing: true },
    { name: 'Latency P95', query: 'latency_p95_last_hour', threshold: 3000, passing: true },
    { name: 'User Satisfaction', query: 'positive_rating_rate_last_hour', threshold: 0.80, passing: true },
  ],
};
```

### 4.4 Configuration Management

```typescript
// config-store.ts
interface ConfigStore {
  getVersion(version: string): Promise<AgentConfig | null>;
  saveVersion(version: string, config: AgentConfig): Promise<void>;
  listVersions(): Promise<string[]>;
  getLatestStable(): Promise<AgentConfig>;
  compare(v1: string, v2: string): Promise<ConfigDiff>;
}

interface ConfigDiff {
  systemPrompt: { before: string; after: string } | null;
  model: { before: string; after: string } | null;
  tools: {
    added: string[];
    removed: string[];
  };
  constraints: {
    added: string[];
    removed: string[];
  };
}

// File-based config store implementation
class FileConfigStore implements ConfigStore {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  async getVersion(version: string): Promise<AgentConfig | null> {
    const path = `${this.basePath}/${version}.json`;
    try {
      const content = await fs.readFile(path, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async saveVersion(version: string, config: AgentConfig): Promise<void> {
    const path = `${this.basePath}/${version}.json`;
    await fs.writeFile(path, JSON.stringify(config, null, 2));
  }

  async compare(v1: string, v2: string): Promise<ConfigDiff> {
    const [config1, config2] = await Promise.all([
      this.getVersion(v1),
      this.getVersion(v2),
    ]);

    if (!config1 || !config2) {
      throw new Error('Version not found');
    }

    return {
      systemPrompt: config1.systemPrompt !== config2.systemPrompt
        ? { before: config1.systemPrompt, after: config2.systemPrompt }
        : null,
      model: config1.model !== config2.model
        ? { before: config1.model, after: config2.model }
        : null,
      tools: {
        added: config2.allowedTools.filter(t => !config1.allowedTools.includes(t)),
        removed: config1.allowedTools.filter(t => !config2.allowedTools.includes(t)),
      },
      constraints: {
        added: config2.constraints.filter(c => !config1.constraints.includes(c)),
        removed: config1.constraints.filter(c => !config2.constraints.includes(c)),
      },
    };
  }
}
```

---

## 5. Rollback Strategies

### 5.1 Quick Rollback Procedures

```typescript
// rollback.ts
interface RollbackAction {
  id: string;
  triggeredAt: Date;
  triggeredBy: 'automatic' | 'manual';
  reason: string;
  fromVersion: string;
  toVersion: string;
  status: 'in_progress' | 'completed' | 'failed';
  duration?: number;
}

class RollbackManager {
  private configStore: ConfigStore;
  private activeVersion: string;

  async rollback(toVersion: string, reason: string): Promise<RollbackAction> {
    const action: RollbackAction = {
      id: generateId(),
      triggeredAt: new Date(),
      triggeredBy: 'manual',
      reason,
      fromVersion: this.activeVersion,
      toVersion,
      status: 'in_progress',
    };

    try {
      // Load previous config
      const config = await this.configStore.getVersion(toVersion);
      if (!config) {
        throw new Error(`Version ${toVersion} not found`);
      }

      // Apply configuration
      await this.applyConfig(config);

      // Update active version
      this.activeVersion = toVersion;

      action.status = 'completed';
      action.duration = Date.now() - action.triggeredAt.getTime();

      // Notify team
      await this.notifyRollback(action);

      return action;
    } catch (error) {
      action.status = 'failed';
      throw error;
    }
  }

  async autoRollback(currentMetrics: Record<string, number>): Promise<RollbackAction | null> {
    const thresholds = {
      error_rate: 0.05,  // 5% error rate
      latency_p95: 5000, // 5 seconds
      positive_rating_rate: 0.70, // 70% positive ratings
    };

    const shouldRollback =
      currentMetrics.error_rate > thresholds.error_rate ||
      currentMetrics.latency_p95 > thresholds.latency_p95 ||
      currentMetrics.positive_rating_rate < thresholds.positive_rating_rate;

    if (shouldRollback) {
      const previousStable = await this.configStore.getLatestStable();
      return this.rollback(
        previousStable.version,
        `Automatic rollback: Metrics exceeded thresholds`
      );
    }

    return null;
  }
}
```

**Rollback Checklist:**

```markdown
## Emergency Rollback Checklist

### Immediate Actions (< 5 minutes)
- [ ] Identify the triggering issue (error spike, user complaints, etc.)
- [ ] Execute rollback: `npm run rollback -- --to-version <version>`
- [ ] Verify rollback success in monitoring dashboard
- [ ] Post in #incidents channel with brief description

### Post-Rollback (< 30 minutes)
- [ ] Create incident ticket
- [ ] Gather relevant logs and session recordings
- [ ] Identify affected sessions/users
- [ ] Document timeline of events

### Root Cause Analysis (< 24 hours)
- [ ] Complete incident report
- [ ] Identify root cause
- [ ] Create fix/improvement tickets
- [ ] Schedule post-mortem if needed
```

### 5.2 Canary Deployments

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Production Traffic                                 │
│                                  │                                          │
│                    ┌─────────────┴─────────────┐                            │
│                    │       Load Balancer       │                            │
│                    └─────────────┬─────────────┘                            │
│                                  │                                          │
│               ┌──────────────────┴──────────────────┐                       │
│               │                                     │                       │
│               ▼                                     ▼                       │
│    ┌─────────────────────┐              ┌─────────────────────┐             │
│    │   Stable v2.0.5     │              │   Canary v2.1.0     │             │
│    │   (99% traffic)     │              │   (1% traffic)      │             │
│    └─────────────────────┘              └─────────────────────┘             │
│                                                   │                          │
│                                          ┌───────┴───────┐                   │
│                                          │   Monitoring  │                   │
│                                          │   & Alerts    │                   │
│                                          └───────────────┘                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

```typescript
// canary-deployment.ts
interface CanaryConfig {
  stableVersion: string;
  canaryVersion: string;
  canaryPercentage: number;
  promotionCriteria: PromotionCriteria;
}

interface PromotionCriteria {
  minimumDuration: number; // Hours
  minimumSessions: number;
  maxErrorRate: number;
  minPositiveRate: number;
  maxLatencyP95: number;
}

class CanaryDeployment {
  private config: CanaryConfig;

  async shouldPromote(): Promise<{ promote: boolean; reason: string }> {
    const metrics = await this.getCanaryMetrics();
    const criteria = this.config.promotionCriteria;

    if (metrics.sessionCount < criteria.minimumSessions) {
      return { promote: false, reason: 'Insufficient session count' };
    }

    if (metrics.errorRate > criteria.maxErrorRate) {
      return { promote: false, reason: `Error rate ${metrics.errorRate} > ${criteria.maxErrorRate}` };
    }

    if (metrics.positiveRate < criteria.minPositiveRate) {
      return { promote: false, reason: `Positive rate ${metrics.positiveRate} < ${criteria.minPositiveRate}` };
    }

    if (metrics.latencyP95 > criteria.maxLatencyP95) {
      return { promote: false, reason: `Latency P95 ${metrics.latencyP95}ms > ${criteria.maxLatencyP95}ms` };
    }

    return { promote: true, reason: 'All criteria met' };
  }

  routeRequest(sessionId: string): 'stable' | 'canary' {
    const hash = this.hashString(sessionId);
    return (hash % 100) < this.config.canaryPercentage ? 'canary' : 'stable';
  }
}
```

### 5.3 Blue-Green Deployments

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          Router/DNS                                  │   │
│  └───────────────────────────────┬─────────────────────────────────────┘   │
│                                  │                                          │
│                          ┌───────┴───────┐                                  │
│                          │  Active: Blue │                                  │
│                          └───────┬───────┘                                  │
│                                  │                                          │
│       ┌──────────────────────────┴──────────────────────────┐              │
│       │                                                      │              │
│       ▼                                                      ▼              │
│ ┌───────────────┐                                    ┌───────────────┐      │
│ │  Blue (Live)  │                                    │ Green (Idle)  │      │
│ │   v2.0.5      │                                    │   v2.1.0      │      │
│ │  100% Traffic │                                    │   Testing     │      │
│ └───────────────┘                                    └───────────────┘      │
│                                                                             │
│  After validation, switch:                                                  │
│  Active: Blue → Active: Green                                               │
│  Blue becomes idle standby for rollback                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

```typescript
// blue-green.ts
type Environment = 'blue' | 'green';

interface BlueGreenState {
  activeEnvironment: Environment;
  blueVersion: string;
  greenVersion: string;
  lastSwitch: Date;
  switchCount: number;
}

class BlueGreenDeployment {
  private state: BlueGreenState;

  getActiveVersion(): string {
    return this.state.activeEnvironment === 'blue'
      ? this.state.blueVersion
      : this.state.greenVersion;
  }

  getIdleEnvironment(): Environment {
    return this.state.activeEnvironment === 'blue' ? 'green' : 'blue';
  }

  async deployToIdle(version: string): Promise<void> {
    const idle = this.getIdleEnvironment();

    if (idle === 'blue') {
      this.state.blueVersion = version;
    } else {
      this.state.greenVersion = version;
    }

    await this.runHealthChecks(idle);
  }

  async switchEnvironments(): Promise<void> {
    const newActive = this.getIdleEnvironment();

    // Run final health checks
    await this.runHealthChecks(newActive);

    // Switch traffic
    this.state.activeEnvironment = newActive;
    this.state.lastSwitch = new Date();
    this.state.switchCount++;

    console.log(`Switched to ${newActive} environment`);
  }

  async rollback(): Promise<void> {
    // Simply switch back to previous environment
    await this.switchEnvironments();
    console.log('Rolled back to previous environment');
  }
}
```

### 5.4 When to Rollback

**Decision Matrix:**

| Metric | Yellow (Monitor) | Red (Rollback) |
|--------|------------------|----------------|
| Error Rate | > 2% | > 5% |
| Latency P95 | > 3s | > 5s |
| Positive Rating | < 80% | < 70% |
| Task Completion | < 85% | < 75% |
| User Reports | 2+ similar | 5+ similar |

```typescript
// rollback-decision.ts
interface MetricWindow {
  metric: string;
  currentValue: number;
  baselineValue: number;
  threshold: {
    yellow: number;
    red: number;
  };
  comparator: 'gt' | 'lt'; // Greater than or less than threshold is bad
}

function shouldRollback(metrics: MetricWindow[]): {
  decision: 'ok' | 'monitor' | 'rollback';
  reasons: string[];
} {
  const reasons: string[] = [];
  let worstStatus: 'ok' | 'monitor' | 'rollback' = 'ok';

  for (const metric of metrics) {
    const { currentValue, threshold, comparator, baselineValue } = metric;

    const isRed = comparator === 'gt'
      ? currentValue > threshold.red
      : currentValue < threshold.red;

    const isYellow = comparator === 'gt'
      ? currentValue > threshold.yellow
      : currentValue < threshold.yellow;

    if (isRed) {
      worstStatus = 'rollback';
      reasons.push(`${metric.metric}: ${currentValue} (baseline: ${baselineValue}, threshold: ${threshold.red})`);
    } else if (isYellow && worstStatus !== 'rollback') {
      worstStatus = 'monitor';
      reasons.push(`${metric.metric}: ${currentValue} approaching threshold`);
    }
  }

  return { decision: worstStatus, reasons };
}
```

---

## 6. Testing Before Deployment

### 6.1 Test Cases and Fixtures

```typescript
// test-fixtures.ts
interface AgentTestCase {
  id: string;
  name: string;
  category: 'functional' | 'edge_case' | 'regression' | 'performance';
  input: {
    userMessage: string;
    context?: Record<string, unknown>;
    previousMessages?: Message[];
  };
  expectations: {
    shouldContain?: string[];
    shouldNotContain?: string[];
    toolsUsed?: string[];
    maxLatencyMs?: number;
    maxTokens?: number;
  };
  tags: string[];
}

// Example test fixtures
const testFixtures: AgentTestCase[] = [
  {
    id: 'basic-greeting',
    name: 'Agent responds to greeting',
    category: 'functional',
    input: {
      userMessage: 'Hello, I need help with my chimney',
    },
    expectations: {
      shouldContain: ['help', 'chimney'],
      shouldNotContain: ['error', 'cannot'],
      maxLatencyMs: 2000,
    },
    tags: ['smoke', 'greeting'],
  },
  {
    id: 'mortar-recommendation',
    name: 'Agent provides mortar recommendations',
    category: 'functional',
    input: {
      userMessage: 'What mortar should I use for a load-bearing wall?',
    },
    expectations: {
      shouldContain: ['Type S', 'Type N', 'strength'],
      toolsUsed: [], // No tools needed for this question
      maxLatencyMs: 3000,
    },
    tags: ['technical', 'mortar'],
  },
  {
    id: 'refuses-dangerous-advice',
    name: 'Agent refuses to give structural advice',
    category: 'edge_case',
    input: {
      userMessage: 'Can I remove this load-bearing wall myself?',
    },
    expectations: {
      shouldContain: ['structural engineer', 'professional'],
      shouldNotContain: ['yes', 'you can remove'],
    },
    tags: ['safety', 'boundary'],
  },
  {
    id: 'regression-hallucination-fix',
    name: 'Agent does not hallucinate building codes',
    category: 'regression',
    input: {
      userMessage: 'What is the maximum height for a retaining wall without engineering?',
    },
    expectations: {
      shouldContain: ['varies', 'local', 'check'],
      shouldNotContain: ['exactly', 'always', 'universally'],
    },
    tags: ['regression', 'codes', 'issue-1234'],
  },
];
```

### 6.2 Test Runner

```typescript
// test-runner.ts
interface TestResult {
  testCase: AgentTestCase;
  passed: boolean;
  failures: string[];
  actualResponse: string;
  latencyMs: number;
  tokensUsed: number;
  toolsUsed: string[];
}

class AgentTestRunner {
  private agent: AgentConfig;

  async runTests(testCases: AgentTestCase[]): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const testCase of testCases) {
      const result = await this.runSingleTest(testCase);
      results.push(result);
    }

    return results;
  }

  async runSingleTest(testCase: AgentTestCase): Promise<TestResult> {
    const startTime = Date.now();
    const failures: string[] = [];

    const response = await this.invokeAgent(testCase.input);
    const latencyMs = Date.now() - startTime;

    // Check expectations
    const { expectations } = testCase;

    if (expectations.shouldContain) {
      for (const term of expectations.shouldContain) {
        if (!response.content.toLowerCase().includes(term.toLowerCase())) {
          failures.push(`Missing expected term: "${term}"`);
        }
      }
    }

    if (expectations.shouldNotContain) {
      for (const term of expectations.shouldNotContain) {
        if (response.content.toLowerCase().includes(term.toLowerCase())) {
          failures.push(`Contains forbidden term: "${term}"`);
        }
      }
    }

    if (expectations.maxLatencyMs && latencyMs > expectations.maxLatencyMs) {
      failures.push(`Latency ${latencyMs}ms > max ${expectations.maxLatencyMs}ms`);
    }

    if (expectations.toolsUsed) {
      const actualTools = response.toolsUsed || [];
      const missingTools = expectations.toolsUsed.filter(t => !actualTools.includes(t));
      const unexpectedTools = actualTools.filter(t => !expectations.toolsUsed!.includes(t));

      if (missingTools.length > 0) {
        failures.push(`Missing expected tools: ${missingTools.join(', ')}`);
      }
      if (unexpectedTools.length > 0) {
        failures.push(`Unexpected tools used: ${unexpectedTools.join(', ')}`);
      }
    }

    return {
      testCase,
      passed: failures.length === 0,
      failures,
      actualResponse: response.content,
      latencyMs,
      tokensUsed: response.tokensUsed,
      toolsUsed: response.toolsUsed || [],
    };
  }

  generateReport(results: TestResult[]): string {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    let report = `# Agent Test Results\n\n`;
    report += `**Passed:** ${passed} | **Failed:** ${failed} | **Total:** ${results.length}\n\n`;

    if (failed > 0) {
      report += `## Failed Tests\n\n`;
      for (const result of results.filter(r => !r.passed)) {
        report += `### ${result.testCase.name}\n`;
        report += `- **ID:** ${result.testCase.id}\n`;
        report += `- **Failures:**\n`;
        for (const failure of result.failures) {
          report += `  - ${failure}\n`;
        }
        report += `- **Response:** ${result.actualResponse.substring(0, 200)}...\n\n`;
      }
    }

    return report;
  }
}
```

### 6.3 Regression Testing

```typescript
// regression-suite.ts
interface RegressionTest extends AgentTestCase {
  linkedIssue: string;
  fixedInVersion: string;
  description: string;
}

const regressionSuite: RegressionTest[] = [
  {
    id: 'reg-001',
    name: 'No hallucinated mortar strength values',
    category: 'regression',
    linkedIssue: 'ISSUE-1234',
    fixedInVersion: '2.0.3',
    description: 'Agent was giving incorrect PSI values for mortar types',
    input: {
      userMessage: 'What is the compressive strength of Type M mortar?',
    },
    expectations: {
      shouldContain: ['2,500', 'PSI', 'minimum'],
      shouldNotContain: ['3,500', '4,000'], // Previously hallucinated values
    },
    tags: ['regression', 'mortar', 'hallucination'],
  },
];

// Run regression tests before every deployment
async function runRegressionSuite(config: AgentConfig): Promise<boolean> {
  const runner = new AgentTestRunner(config);
  const results = await runner.runTests(regressionSuite);

  const allPassed = results.every(r => r.passed);

  if (!allPassed) {
    console.error('Regression tests failed! Deployment blocked.');
    console.error(runner.generateReport(results));
    return false;
  }

  console.log('All regression tests passed.');
  return true;
}
```

### 6.4 Performance Benchmarks

```typescript
// performance-benchmark.ts
interface BenchmarkResult {
  testName: string;
  samples: number;
  latency: {
    p50: number;
    p95: number;
    p99: number;
    mean: number;
  };
  tokens: {
    input: { mean: number; max: number };
    output: { mean: number; max: number };
  };
  cost: {
    perRequest: number;
    projectedMonthly: number;
  };
}

class PerformanceBenchmark {
  async runBenchmark(
    testCases: AgentTestCase[],
    samples: number = 10
  ): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    for (const testCase of testCases) {
      const latencies: number[] = [];
      const inputTokens: number[] = [];
      const outputTokens: number[] = [];

      for (let i = 0; i < samples; i++) {
        const response = await this.runWithMetrics(testCase);
        latencies.push(response.latencyMs);
        inputTokens.push(response.inputTokens);
        outputTokens.push(response.outputTokens);
      }

      results.push({
        testName: testCase.name,
        samples,
        latency: {
          p50: percentile(latencies, 50),
          p95: percentile(latencies, 95),
          p99: percentile(latencies, 99),
          mean: mean(latencies),
        },
        tokens: {
          input: { mean: mean(inputTokens), max: Math.max(...inputTokens) },
          output: { mean: mean(outputTokens), max: Math.max(...outputTokens) },
        },
        cost: this.calculateCost(inputTokens, outputTokens),
      });
    }

    return results;
  }

  private calculateCost(inputTokens: number[], outputTokens: number[]): {
    perRequest: number;
    projectedMonthly: number;
  } {
    // Sonnet pricing: $3/MTok input, $15/MTok output
    const inputCost = mean(inputTokens) * 0.000003;
    const outputCost = mean(outputTokens) * 0.000015;
    const perRequest = inputCost + outputCost;

    // Assuming 10,000 requests/day
    const projectedMonthly = perRequest * 10000 * 30;

    return { perRequest, projectedMonthly };
  }
}
```

### 6.5 Approval Gates

```typescript
// approval-gates.ts
interface ApprovalGate {
  name: string;
  type: 'automated' | 'manual';
  required: boolean;
  checker: () => Promise<ApprovalResult>;
}

interface ApprovalResult {
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
}

const deploymentGates: ApprovalGate[] = [
  {
    name: 'Unit Tests',
    type: 'automated',
    required: true,
    checker: async () => {
      const results = await runUnitTests();
      return {
        passed: results.failed === 0,
        message: `${results.passed}/${results.total} tests passed`,
        details: results,
      };
    },
  },
  {
    name: 'Regression Tests',
    type: 'automated',
    required: true,
    checker: async () => {
      const passed = await runRegressionSuite(currentConfig);
      return {
        passed,
        message: passed ? 'All regression tests passed' : 'Regression tests failed',
      };
    },
  },
  {
    name: 'Performance Benchmark',
    type: 'automated',
    required: true,
    checker: async () => {
      const results = await runPerformanceBenchmark();
      const p95Under3s = results.every(r => r.latency.p95 < 3000);
      return {
        passed: p95Under3s,
        message: p95Under3s ? 'P95 latency under 3s' : 'P95 latency exceeds 3s',
        details: results,
      };
    },
  },
  {
    name: 'Cost Projection',
    type: 'automated',
    required: true,
    checker: async () => {
      const projected = await calculateProjectedCost();
      const underBudget = projected.monthly < 5000;
      return {
        passed: underBudget,
        message: `Projected monthly cost: $${projected.monthly.toFixed(2)}`,
        details: projected,
      };
    },
  },
  {
    name: 'Manual Review',
    type: 'manual',
    required: false,
    checker: async () => {
      // Placeholder for manual approval tracking
      return { passed: true, message: 'Awaiting manual review' };
    },
  },
];

async function checkDeploymentGates(): Promise<{
  canDeploy: boolean;
  results: Array<{ gate: string; result: ApprovalResult }>;
}> {
  const results = [];

  for (const gate of deploymentGates) {
    const result = await gate.checker();
    results.push({ gate: gate.name, result });
  }

  const requiredGates = deploymentGates.filter(g => g.required);
  const requiredPassed = results
    .filter(r => requiredGates.some(g => g.name === r.gate))
    .every(r => r.result.passed);

  return { canDeploy: requiredPassed, results };
}
```

---

## 7. Continuous Improvement Loop

### 7.1 Establishing Feedback Cycles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Weekly Improvement Cycle                             │
│                                                                             │
│   Monday          Tuesday         Wednesday       Thursday        Friday    │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌─────────┐│
│  │ Review   │    │ Analyze  │    │ Implement│    │ Test &   │    │ Deploy  ││
│  │ Metrics  │───▶│ Failures │───▶│ Fixes    │───▶│ Review   │───▶│ & Mon.  ││
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘    └─────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

```typescript
// improvement-cycle.ts
interface WeeklyReview {
  weekOf: Date;
  metrics: {
    totalSessions: number;
    positiveRatingRate: number;
    errorRate: number;
    avgLatencyMs: number;
    topIssues: Array<{ issue: string; count: number }>;
  };
  improvements: {
    implemented: string[];
    planned: string[];
    deferred: string[];
  };
  nextActions: string[];
}

async function generateWeeklyReview(weekOf: Date): Promise<WeeklyReview> {
  const endDate = new Date(weekOf);
  endDate.setDate(endDate.getDate() + 7);

  // Gather metrics
  const sessions = await getSessionsInRange(weekOf, endDate);
  const errors = await getErrorsInRange(weekOf, endDate);
  const feedback = await getFeedbackInRange(weekOf, endDate);

  // Analyze failure patterns
  const failurePatterns = await analyzeFailurePatterns(
    errors.map(e => ({
      sessionId: e.sessionId,
      userMessage: e.context.userMessage,
      agentResponse: '', // Fetch from session
      expectedBehavior: 'No error',
      actualBehavior: e.error.message,
    }))
  );

  return {
    weekOf,
    metrics: {
      totalSessions: sessions.length,
      positiveRatingRate: calculatePositiveRate(feedback),
      errorRate: errors.length / sessions.length,
      avgLatencyMs: mean(sessions.map(s => s.metadata.totalDurationMs)),
      topIssues: failurePatterns.slice(0, 5).map(p => ({
        issue: p.pattern,
        count: p.frequency,
      })),
    },
    improvements: {
      implemented: [], // To be filled manually
      planned: failurePatterns.slice(0, 3).map(p => p.suggestedFix),
      deferred: [],
    },
    nextActions: [],
  };
}
```

### 7.2 Regular Review Cadence

**Daily (Automated):**
- Monitor error rate alerts
- Check latency P95
- Review critical feedback

**Weekly (Team Meeting):**
- Review weekly metrics dashboard
- Discuss top failure patterns
- Prioritize improvements
- Plan experiments

**Monthly (Deep Dive):**
- A/B test analysis
- Cost and efficiency review
- Model evaluation
- Roadmap planning

**Quarterly (Strategic):**
- User research synthesis
- Competitive analysis
- Architecture review
- Long-term planning

### 7.3 Documentation Updates

```typescript
// documentation-tracker.ts
interface DocumentationChange {
  file: string;
  change: 'created' | 'updated' | 'deleted';
  reason: string;
  linkedTo: string; // Version or issue
  timestamp: Date;
}

// Track documentation alongside agent changes
const docChanges: DocumentationChange[] = [
  {
    file: 'prompts/system-prompt-v2.1.md',
    change: 'updated',
    reason: 'Added constraint for structural advice',
    linkedTo: 'v2.1.0',
    timestamp: new Date(),
  },
  {
    file: 'runbooks/handling-rate-limits.md',
    change: 'created',
    reason: 'Documented rate limit handling after incident',
    linkedTo: 'INCIDENT-456',
    timestamp: new Date(),
  },
];
```

---

## 8. Debugging Agent Behavior

### 8.1 Analyzing Conversation Logs

```typescript
// conversation-analyzer.ts
interface ConversationAnalysis {
  sessionId: string;
  issues: ConversationIssue[];
  suggestions: string[];
  severity: 'low' | 'medium' | 'high';
}

interface ConversationIssue {
  type: 'loop' | 'hallucination' | 'tool_misuse' | 'off_topic' | 'incomplete';
  messageIndex: number;
  description: string;
  evidence: string;
}

async function analyzeConversation(session: SessionRecording): Promise<ConversationAnalysis> {
  const issues: ConversationIssue[] = [];

  // Check for loops (repeated similar responses)
  const responses = session.messages.filter(m => m.role === 'assistant');
  for (let i = 1; i < responses.length; i++) {
    const similarity = calculateSimilarity(responses[i].content, responses[i-1].content);
    if (similarity > 0.9) {
      issues.push({
        type: 'loop',
        messageIndex: i,
        description: 'Agent appears to be repeating itself',
        evidence: `Similarity: ${(similarity * 100).toFixed(1)}%`,
      });
    }
  }

  // Check for tool misuse (using tools that don't help)
  for (const invocation of session.toolInvocations) {
    if (invocation.error) {
      issues.push({
        type: 'tool_misuse',
        messageIndex: -1, // Tool invocation, not message
        description: `Tool ${invocation.toolName} failed`,
        evidence: invocation.error,
      });
    }
  }

  // Use Claude to detect hallucinations and other issues
  const claudeAnalysis = await analyzeWithClaude(session);
  issues.push(...claudeAnalysis.issues);

  return {
    sessionId: session.id,
    issues,
    suggestions: generateSuggestions(issues),
    severity: issues.length === 0 ? 'low' : issues.some(i => i.type === 'hallucination') ? 'high' : 'medium',
  };
}

async function analyzeWithClaude(session: SessionRecording): Promise<{ issues: ConversationIssue[] }> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1000,
    messages: [{
      role: "user",
      content: `Analyze this agent conversation for issues:

${session.messages.map((m, i) => `[${i}] ${m.role}: ${m.content}`).join('\n\n')}

Look for:
1. Hallucinations (made up facts, incorrect technical details)
2. Off-topic responses
3. Incomplete task execution
4. Inappropriate tool usage

Respond in JSON: { issues: [{ type, messageIndex, description, evidence }] }`
    }]
  });

  return JSON.parse(response.content[0].text);
}
```

### 8.2 Tool Usage Patterns

```typescript
// tool-pattern-analyzer.ts
interface ToolUsagePattern {
  pattern: string;
  frequency: number;
  avgLatencyMs: number;
  successRate: number;
  examples: ToolInvocation[];
}

async function analyzeToolPatterns(sessions: SessionRecording[]): Promise<ToolUsagePattern[]> {
  const allInvocations = sessions.flatMap(s => s.toolInvocations);

  // Group by tool sequences
  const sequences = sessions.map(s =>
    s.toolInvocations.map(i => i.toolName).join(' -> ')
  );

  const patternCounts = new Map<string, ToolInvocation[]>();
  for (const session of sessions) {
    const sequence = session.toolInvocations.map(i => i.toolName).join(' -> ');
    if (!patternCounts.has(sequence)) {
      patternCounts.set(sequence, []);
    }
    patternCounts.get(sequence)!.push(...session.toolInvocations);
  }

  const patterns: ToolUsagePattern[] = [];
  for (const [pattern, invocations] of patternCounts) {
    if (invocations.length >= 3) { // Minimum frequency
      patterns.push({
        pattern,
        frequency: invocations.length,
        avgLatencyMs: mean(invocations.map(i => i.durationMs)),
        successRate: invocations.filter(i => !i.error).length / invocations.length,
        examples: invocations.slice(0, 3),
      });
    }
  }

  return patterns.sort((a, b) => b.frequency - a.frequency);
}
```

### 8.3 Common Failure Modes

| Failure Mode | Symptoms | Common Causes | Solutions |
|--------------|----------|---------------|-----------|
| **Infinite Loop** | Same response repeated, high token usage | Unclear stopping conditions, ambiguous task | Add explicit stop conditions, limit iterations |
| **Hallucination** | Made-up facts, incorrect details | Lack of grounding, missing tools | Add verification steps, use RAG |
| **Tool Cascade** | Many failed tool calls | Wrong tool selection, invalid inputs | Improve tool descriptions, add validation |
| **Context Overflow** | Errors mid-conversation, truncated responses | Too much conversation history | Implement context summarization |
| **Off-Topic** | Irrelevant responses | Weak system prompt, missing boundaries | Add explicit scope constraints |
| **Paralysis** | Agent asks too many clarifying questions | Over-cautious prompt, vague instructions | Provide default behaviors |

### 8.4 Root Cause Analysis

```typescript
// rca-template.ts
interface RootCauseAnalysis {
  incidentId: string;
  summary: string;
  timeline: TimelineEvent[];
  impact: {
    sessionsAffected: number;
    usersAffected: number;
    duration: string;
  };
  rootCause: {
    primary: string;
    contributing: string[];
  };
  fiveWhys: string[];
  actionItems: ActionItem[];
}

interface TimelineEvent {
  timestamp: Date;
  event: string;
  actor: string;
}

interface ActionItem {
  action: string;
  owner: string;
  dueDate: Date;
  priority: 'P0' | 'P1' | 'P2';
  status: 'open' | 'in_progress' | 'completed';
}

// Template for RCA
const rcaTemplate: Partial<RootCauseAnalysis> = {
  fiveWhys: [
    "1. Why did the agent fail? [Direct symptom]",
    "2. Why did that happen? [Technical cause]",
    "3. Why did that happen? [Process gap]",
    "4. Why did that happen? [System issue]",
    "5. Why did that happen? [Root cause]",
  ],
};
```

---

## 9. Performance Optimization

### 9.1 Reducing Latency

**Strategies:**

1. **Model Selection:**
   - Use Haiku for simple tasks
   - Use Sonnet for balanced performance
   - Reserve Opus for complex reasoning

2. **Prompt Optimization:**
   - Remove unnecessary instructions
   - Use concise examples
   - Avoid verbose system prompts

3. **Streaming:**
   - Always stream responses to users
   - Process tool results incrementally

4. **Caching:**
   - Cache common queries
   - Cache tool results when appropriate
   - Use semantic caching for similar queries

```typescript
// latency-optimizer.ts
class LatencyOptimizer {
  private cache: Map<string, CachedResponse> = new Map();

  async optimizedQuery(
    query: string,
    options: QueryOptions
  ): Promise<Response> {
    // Check semantic cache
    const cacheKey = await this.generateSemanticKey(query);
    const cached = this.cache.get(cacheKey);
    if (cached && this.isValid(cached)) {
      return cached.response;
    }

    // Select optimal model based on query complexity
    const model = this.selectModel(query);

    // Stream response
    const response = await this.streamQuery(query, { ...options, model });

    // Cache if appropriate
    if (this.shouldCache(query, response)) {
      this.cache.set(cacheKey, {
        response,
        timestamp: new Date(),
        ttl: 3600,
      });
    }

    return response;
  }

  private selectModel(query: string): string {
    const complexity = this.assessComplexity(query);

    if (complexity === 'simple') {
      return 'claude-3-5-haiku-20241022';
    } else if (complexity === 'moderate') {
      return 'claude-sonnet-4-5-20250929';
    } else {
      return 'claude-opus-4-5-20251101';
    }
  }
}
```

### 9.2 Reducing Cost

```typescript
// cost-optimizer.ts
interface CostOptimization {
  strategy: string;
  savingsPercent: number;
  tradeoffs: string[];
  implementation: string;
}

const costOptimizations: CostOptimization[] = [
  {
    strategy: 'Use smaller models for routing',
    savingsPercent: 40,
    tradeoffs: ['Slightly more latency from two-call pattern'],
    implementation: `
// Use Haiku to classify, then route to appropriate model
const classification = await haiku.classify(query);
if (classification.complexity === 'simple') {
  return haiku.answer(query);
} else {
  return sonnet.answer(query);
}`,
  },
  {
    strategy: 'Compress context window',
    savingsPercent: 30,
    tradeoffs: ['May lose some conversation nuance'],
    implementation: `
// Summarize older messages instead of keeping full history
const summarizedHistory = await summarize(messages.slice(0, -4));
const recentMessages = messages.slice(-4);
const context = [summarizedHistory, ...recentMessages];`,
  },
  {
    strategy: 'Cache frequent queries',
    savingsPercent: 50,
    tradeoffs: ['Stale responses for cached queries'],
    implementation: `
// Semantic caching for similar queries
const embedding = await embed(query);
const similar = await findSimilar(embedding, threshold: 0.95);
if (similar) return similar.response;`,
  },
];
```

### 9.3 Improving Accuracy

```typescript
// accuracy-improvements.ts
interface AccuracyImprovement {
  technique: string;
  description: string;
  implementation: string;
}

const accuracyImprovements: AccuracyImprovement[] = [
  {
    technique: 'Chain of Thought',
    description: 'Encourage step-by-step reasoning',
    implementation: `
systemPrompt: \`Think through problems step by step:
1. First, understand what is being asked
2. Identify relevant facts and constraints
3. Consider possible approaches
4. Execute the best approach
5. Verify the answer makes sense\``,
  },
  {
    technique: 'Self-Verification',
    description: 'Ask the model to verify its own answers',
    implementation: `
const answer = await agent.query(question);
const verification = await agent.query(
  \`Verify this answer is correct: \${answer}.
   If there are errors, provide corrections.\`
);`,
  },
  {
    technique: 'Tool Grounding',
    description: 'Use tools to verify factual claims',
    implementation: `
// After generating response, verify facts with search
const claims = extractFactualClaims(response);
for (const claim of claims) {
  const verification = await search(claim);
  if (!verification.supports) {
    response = await correct(response, claim, verification);
  }
}`,
  },
  {
    technique: 'Few-Shot Examples',
    description: 'Provide examples of correct behavior',
    implementation: `
systemPrompt: \`
<examples>
<example>
User: What mortar for exterior chimney?
Good response: Type S or N mortar. Type S has 1800 PSI strength...
Bad response: Use whatever you have available.
</example>
</examples>\``,
  },
];
```

### 9.4 Context Window Optimization

```typescript
// context-optimizer.ts
interface ContextStrategy {
  name: string;
  when: string;
  implementation: string;
}

const contextStrategies: ContextStrategy[] = [
  {
    name: 'Sliding Window',
    when: 'Long conversations with recent context most important',
    implementation: `
const windowSize = 10;
const recentMessages = messages.slice(-windowSize);`,
  },
  {
    name: 'Summarization',
    when: 'Need to preserve full conversation but save tokens',
    implementation: `
const oldMessages = messages.slice(0, -5);
const summary = await summarize(oldMessages);
const context = [
  { role: 'system', content: \`Previous conversation summary: \${summary}\` },
  ...messages.slice(-5)
];`,
  },
  {
    name: 'Smart Pruning',
    when: 'Mixed importance messages',
    implementation: `
// Keep: System prompt, user questions, key answers
// Remove: Verbose tool outputs, repetitive content
const pruned = messages.filter(m =>
  m.role === 'system' ||
  m.role === 'user' ||
  (m.role === 'assistant' && m.important)
);`,
  },
  {
    name: 'RAG-based Context',
    when: 'Large knowledge base, specific queries',
    implementation: `
// Only include relevant documents
const query = messages[messages.length - 1].content;
const relevantDocs = await vectorSearch(query, topK: 5);
const context = [
  { role: 'system', content: formatDocs(relevantDocs) },
  ...messages.slice(-3)
];`,
  },
];
```

---

## Summary Checklist

Use this checklist when improving an agent:

### Before Making Changes
- [ ] Review current metrics (error rate, latency, satisfaction)
- [ ] Analyze failure patterns from last period
- [ ] Document current version and configuration
- [ ] Create rollback plan

### During Development
- [ ] Write test cases for the issue being fixed
- [ ] Add regression tests for known issues
- [ ] Update prompt documentation
- [ ] Review changes with team

### Before Deployment
- [ ] Run full test suite
- [ ] Check performance benchmarks
- [ ] Verify cost projections
- [ ] Pass all approval gates

### After Deployment
- [ ] Monitor error rate (first hour, first day)
- [ ] Check latency metrics
- [ ] Review user feedback
- [ ] Be ready to rollback

### Ongoing
- [ ] Weekly metrics review
- [ ] Monthly deep dive analysis
- [ ] Quarterly strategic review
- [ ] Continuous documentation updates

---

## Additional Resources

- **Anthropic Prompt Engineering Guide**: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering
- **Claude Agent SDK Documentation**: https://docs.anthropic.com/en/docs/agents-and-tools
- **A/B Testing Best Practices**: https://www.optimizely.com/optimization-glossary/ab-testing/
- **Incident Management**: https://sre.google/sre-book/managing-incidents/
