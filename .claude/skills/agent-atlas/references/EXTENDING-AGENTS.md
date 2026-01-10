# Extending Agent Capabilities

> How to add new capabilities to the Orchestrator + Subagents architecture.

---

## Decision: Tools vs New Agent

Before extending, decide which approach fits:

| Add Tools to Existing Agent | Create New Subagent |
|-----------------------------|---------------------|
| Capability fits agent's domain | Distinct expertise domain |
| 1-2 new tools | 3+ specialized tools |
| Uses agent's existing context | Needs its own prompts/context |
| Sequential with agent's work | Could run in parallel |

**Rule of thumb:** If you're adding video analysis, that's multimodal—add to Story Agent. If you're adding full SEO optimization with keyword research, meta generation, and structured data—that's a new agent.

---

## Option 1: Add Tools to Existing Agents

### Which Agent Gets the Tool?

| Agent | Domain | Add tools for... |
|-------|--------|------------------|
| **Story Agent** | Content & understanding | New media types, voice analysis, transcript processing |
| **Design Agent** | Visual presentation | New layouts, animation tokens, responsive variants |
| **Quality Agent** | Assessment & validation | Industry-specific checks, new quality criteria |

### Implementation Steps

1. **Add tool to agent's tool list**

```typescript
// In story-extractor.ts or relevant agent file
tools: [
  "extractNarrative",
  "analyzeImages",
  "analyzeVideo",      // NEW
  "generateContent",
  "signalCheckpoint",
]
```

2. **Define tool schema** (if using Vercel AI SDK)

```typescript
// In tool-schemas.ts
export const analyzeVideoSchema = z.object({
  videoUrl: z.string().url(),
  extractFrames: z.boolean().optional(),
});
```

3. **Implement tool executor**

```typescript
// In tools-runtime.ts or agent file
async function analyzeVideo(input: z.infer<typeof analyzeVideoSchema>) {
  // Implementation
}
```

4. **Update state if needed**

```typescript
// In types.ts - add to relevant state section
project: {
  // ...existing
  videoAnalysis?: VideoAnalysisResult;  // NEW
}
```

---

## Option 2: Create New Subagent

### When to Create a New Agent

Create a new subagent when:
- Distinct expertise that doesn't overlap with existing agents
- Needs 3+ specialized tools
- Benefits from focused context/prompts
- Can run in parallel with other agents

### Example Candidates

| Agent | Domain | Tools |
|-------|--------|-------|
| **SEO Agent** | Search optimization | analyzeKeywords, optimizeMeta, generateStructuredData |
| **Analytics Agent** | Performance insights | trackMetrics, analyzePatterns, suggestOptimizations |
| **Outreach Agent** | Sharing & promotion | generateSocialPost, createEmailTemplate, scheduleShare |
| **Pricing Agent** | Quote generation | estimateProject, comparePricing, generateQuote |

### Implementation Steps

#### 1. Create Agent File

```typescript
// src/lib/agents/seo-agent.ts

/**
 * SEO Agent (SUBAGENT)
 *
 * ARCHITECTURE: Subagent of Account Manager Orchestrator
 *
 * Handles SEO optimization, keyword research, and structured data.
 * Writes to the `seo` section of shared ProjectState.
 *
 * Persona: "I optimize content for discoverability. I research what
 * people search for and ensure the portfolio ranks well."
 *
 * Tools: analyzeKeywords, optimizeMeta, generateStructuredData
 *
 * @see /.claude/skills/agent-atlas/references/AGENT-PERSONAS.md
 */

import type { SharedProjectState } from './types';

export interface SEOAgentResult {
  keywords: string[];
  metaTitle: string;
  metaDescription: string;
  structuredData: object;
}

export async function optimizeSEO(
  state: SharedProjectState
): Promise<SEOAgentResult> {
  // Implementation
}
```

#### 2. Add State Section

```typescript
// In types.ts

interface SharedProjectState {
  // Story Agent writes
  businessContext: { /* ... */ };
  project: { /* ... */ };

  // Design Agent writes
  design: { /* ... */ };

  // Quality Agent writes
  assessment: { /* ... */ };

  // SEO Agent writes (NEW)
  seo: {
    keywords: string[];
    metaTitle: string;
    metaDescription: string;
    structuredData: object;
    lastOptimized?: string;
  };

  // Coordination
  checkpoint: /* ... */;
}
```

#### 3. Export from Index

```typescript
// In index.ts

// SEO Agent
export {
  optimizeSEO,
  type SEOAgentResult,
} from './seo-agent';
```

#### 4. Register with Orchestrator

The Account Manager needs to know when to delegate to the new agent:

```typescript
// In orchestrator.ts

// Add to delegation logic
if (shouldOptimizeSEO(state, message)) {
  // Delegate to SEO Agent
  const seoResult = await optimizeSEO(state);
  state.seo = seoResult;
}
```

#### 5. Add Checkpoint (if needed)

```typescript
// If the agent signals completion
checkpoint:
  | 'images_uploaded'
  | 'basic_info'
  | 'story_complete'
  | 'design_complete'
  | 'seo_complete'      // NEW
  | 'ready_to_publish';
```

---

## Key Rules

### Do

- **Keep orchestrator lightweight** - Add capabilities to subagents, not orchestrator
- **One agent owns each state section** - Clear ownership prevents conflicts
- **Document the persona** - Each agent has a voice and expertise
- **Enable parallel execution** - Independent agents can run simultaneously
- **Make quality advisory** - Suggestions, not gates

### Don't

- **Don't nest subagents** - Subagents cannot spawn other subagents
- **Don't overload one agent** - If an agent has 10+ tools, consider splitting
- **Don't create agents for single tools** - Use existing agent instead
- **Don't block on quality** - Always allow "publish anyway"
- **Don't share tool ownership** - Each tool belongs to one agent

---

## Parallel Execution

New agents that don't depend on others can run simultaneously:

```
User uploads images + requests SEO optimization
         │
    ┌────┼────┬────┐
    ▼    ▼    ▼    ▼
 Story Design Quality SEO
 Agent Agent  Agent  Agent
    │    │      │      │
    └────┴──────┴──────┘
              ▼
       Account Manager
        (synthesize)
```

### Determining Parallelism

| Agent A | Agent B | Parallel? | Why |
|---------|---------|-----------|-----|
| Story | Design | ✅ Yes | Design can start with partial content |
| Story | Quality | ❌ No | Quality needs content to assess |
| Design | SEO | ✅ Yes | Independent domains |
| Quality | SEO | ✅ Yes | Both assess, don't modify |

---

## Checklist: Adding a New Agent

- [ ] Distinct domain that doesn't overlap with existing agents
- [ ] 3+ specialized tools defined
- [ ] Persona documented (voice, expertise, approach)
- [ ] State section added to SharedProjectState
- [ ] Agent file created with JSDoc header
- [ ] Exported from index.ts
- [ ] Orchestrator knows when to delegate
- [ ] Checkpoint added (if signals completion)
- [ ] Parallel execution opportunities identified
- [ ] AGENT-PERSONAS.md updated

---

## References

| Document | Purpose |
|----------|---------|
| [AGENT-PERSONAS.md](AGENT-PERSONAS.md) | Existing agent definitions |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System overview |
| [STATE-MODELS.md](STATE-MODELS.md) | State structure |
| `todo/ai-sdk-phase-10-persona-agents.md` | Implementation plan |

---

*Last updated: 2026-01-02*
