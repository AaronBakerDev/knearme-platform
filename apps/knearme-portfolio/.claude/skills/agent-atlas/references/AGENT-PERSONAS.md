# Agent Personas Reference

> **Pattern:** Orchestrator + Subagents
> **Principle:** Account Manager coordinates specialists. Don't overload the orchestrator with tools.

This document describes the agent architecture for the KnearMe portfolio platform.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ACCOUNT MANAGER (Orchestrator)                        │
│              User-facing persona • Coordinates specialists               │
├─────────────────────────────────────────────────────────────────────────┤
│  Role: Analyze request → Delegate complex tasks → Synthesize results    │
│  Tools: Lightweight (read, routing) - delegates heavy work              │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
          ▼                          ▼                          ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   STORY AGENT    │    │   DESIGN AGENT   │    │  QUALITY AGENT   │
│   (Subagent)     │    │   (Subagent)     │    │   (Subagent)     │
├──────────────────┤    ├──────────────────┤    ├──────────────────┤
│ • Conversation   │    │ • Layout tokens  │    │ • Assessment     │
│ • Image analysis │    │ • Composition    │    │ • Contextual     │
│ • Narrative      │    │ • Preview gen    │    │ • Advisory       │
│ • Content write  │    │ • Design refine  │    │ • NOT blocking   │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## Why This Pattern?

### From Agent Architecture Best Practices:

> "Orchestrator + Subagents is best for multi-specialty work, complex domain problems, content pipelines"

| Benefit | How It Applies |
|---------|---------------|
| **Context isolation** | Each subagent focuses on one thing |
| **Parallel execution** | Story + Design can work simultaneously |
| **Specialized prompts** | Each agent has focused expertise |
| **Modular** | Add/remove agents without breaking system |

### The Key Rule

**Don't overload the orchestrator with all the tools.**

The Account Manager should have lightweight tools for routing and quick lookups. Complex work (image analysis, content generation, layout composition, quality assessment) is delegated to specialist subagents.

---

## 1. Account Manager (Orchestrator)

### Role

The user-facing persona that coordinates everything.

### Persona

> "I'm your account manager. I understand what you need and connect you with the right specialists to get it done."

### Responsibilities

| Task | Description |
|------|-------------|
| **Greet & understand** | Welcome user, understand their needs |
| **Route** | Decide which specialist to involve |
| **Delegate** | Spawn subagents for complex tasks |
| **Synthesize** | Combine subagent outputs into coherent response |
| **Present** | Deliver results to user |

### Tools (Lightweight)

```typescript
tools: [
  "read",           // Quick lookups
  "delegateTask",   // Spawn subagents
]

// NOT overloaded with:
// - Image analysis (Story Agent)
// - Layout generation (Design Agent)
// - Quality checks (Quality Agent)
```

### When to Delegate vs Handle Directly

| Situation | Action |
|-----------|--------|
| Simple question | Handle directly |
| User uploads images | Delegate to Story Agent |
| Content ready for layout | Delegate to Design Agent |
| Ready to publish | Delegate to Quality Agent |
| Complex multi-step | Spawn multiple subagents |

---

## 2. Story Agent (Subagent)

### Role

Handles conversation, content extraction, and multimodal understanding.

### Persona

> "I'm having a conversation with someone who has work to show. I listen, I see their images, I extract what matters, and I write in their voice—not mine."

### Expertise

- Natural conversation (not scripted questions)
- Multimodal image understanding
- Narrative extraction
- Content writing in business voice
- Business context discovery

### Tools

```typescript
tools: [
  "extractNarrative",
  "analyzeImages",      // Multimodal
  "generateContent",
  "signalCheckpoint",
]
```

### Outputs

| Output | Description |
|--------|-------------|
| `businessContext` | Discovered type, voice, vocabulary |
| `projectContent` | Title, description, story |
| `imageAnalysis` | What images show, suggested organization |

### Key Behavior: Multimodal

Story Agent sees images directly in the prompt:

```typescript
const response = await generateText({
  model: gemini('gemini-2.0-flash'),
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: userMessage },
      ...images.map(img => ({ type: 'image', image: img.url }))
    ]
  }]
});
```

Categories emerge from conversation:
- "I see before/after shots of a chimney rebuild..."
- "These furniture photos show beautiful grain detail..."

### NOT Responsible For

- Forcing images into predefined categories
- Enforcing word counts
- Using AI-sounding language
- Following rigid question scripts

---

## 3. Design Agent (Subagent)

### Role

Handles layout composition, design tokens, and preview generation.

### Persona

> "I compose visual presentations that let the work shine. I pick from curated options, not arbitrary CSS."

### Expertise

- Design token selection
- Layout composition
- Hero image selection
- Preview generation
- Design refinement from feedback

### Tools

```typescript
tools: [
  "selectTokens",
  "composeLayout",
  "selectHero",
  "renderPreview",
]
```

### Outputs

| Output | Description |
|--------|-------------|
| `design.layout` | Selected layout token |
| `design.spacing` | Selected spacing token |
| `design.headingStyle` | Selected heading token |
| `design.accentColor` | Selected color token |
| `design.heroImage` | Best image for hero |
| `preview` | Rendered portfolio preview |

### Key Behavior: Guardrails (Design Tokens)

Agent picks from curated options, preventing "MySpace syndrome":

```typescript
const DESIGN_TOKENS = {
  layouts: ['hero-focused', 'gallery-grid', 'story-flow', 'comparison', 'minimal'],
  spacings: ['compact', 'comfortable', 'spacious'],
  headings: ['bold', 'elegant', 'technical', 'playful'],
  colors: ['slate', 'warm', 'cool', 'earth', 'vibrant'],
};
```

### NOT Responsible For

- Arbitrary CSS decisions
- Content creation
- Blocking conversation flow

---

## 4. Quality Agent (Subagent)

### Role

Handles contextual assessment—advisory, not blocking.

### Persona

> "I assess if the portfolio represents the work well. My standards adapt to this business type. I advise, I don't block."

### Expertise

- Contextual quality assessment
- Business-appropriate standards
- Advisory suggestions
- Publish readiness check

### Tools

```typescript
tools: [
  "assessReadiness",
  "identifyGaps",
  "suggestImprovements",
]
```

### Outputs

| Output | Description |
|--------|-------------|
| `ready` | Boolean - is it publish-ready? |
| `confidence` | high / medium / low |
| `suggestions` | Advisory, not requirements |
| `contextualChecks` | What was evaluated |

### Key Behavior: ADVISORY, NOT BLOCKING

```typescript
guidelines: [
  "No fixed word count requirements",
  "No mandatory field checklists",
  "Standards adapt to business type",
  "Always allow 'publish anyway'",
]
```

### Contextual Checks (Not Fixed Checklist)

| Business Type | Quality Questions |
|---------------|-------------------|
| Contractor | "Does the before/after show transformation?" |
| Furniture Maker | "Does the craftsmanship come through?" |
| Photographer | "Is the style clear? Do we show range?" |
| Event Planner | "Can we feel the experience?" |

### NOT Responsible For

- Fixed word count requirements
- Blocking publish
- One-size-fits-all checklists

---

## Shared State Model

All agents read from and write to common project state:

```typescript
interface ProjectState {
  // Content (Story Agent writes)
  businessContext: {
    name: string;
    type: string;
    voice: 'formal' | 'casual' | 'technical';
    vocabulary: string[];
  };

  project: {
    title: string;
    description: string;
    story: string;
    images: ImageWithAnalysis[];
  };

  // Design (Design Agent writes)
  design: {
    layout: LayoutToken;
    spacing: SpacingToken;
    headingStyle: HeadingToken;
    accentColor: AccentToken;
    heroImage: string;
  };

  // Quality (Quality Agent writes)
  assessment: {
    ready: boolean;
    confidence: 'high' | 'medium' | 'low';
    suggestions: string[];
  };

  // Coordination
  checkpoint: 'images_uploaded' | 'basic_info' | 'story_complete' | 'design_complete' | 'ready_to_publish';
}
```

---

## Orchestration Examples

### Simple Question

```
User: "How do I add more photos?"
         ↓
Account Manager: Handles directly (no delegation needed)
         ↓
Response: "You can add more photos by..."
```

### Project Creation

```
User: "Here's my kitchen remodel project" + [images]
         ↓
Account Manager: Delegate to Story Agent
         ↓
Story Agent: Sees images, asks questions, extracts narrative
         ↓ signals checkpoint
Account Manager: Delegate to Design Agent
         ↓
Design Agent: Composes layout, selects tokens
         ↓
Account Manager: Synthesize and present preview
```

### Parallel Execution

```
User uploads images
         │
    ┌────┴────┐
    ▼         ▼
 Story     Design
 Agent     Agent
    │         │
    └────┬────┘
         ▼
   Account Manager
   (synthesize)
```

---

## Implementation Status

| Component | Status | Location |
|-----------|--------|----------|
| Discovery Agent (onboarding) | ✅ Done | `src/lib/agents/discovery.ts` |
| Account Manager | 🔄 Enhance | `src/lib/agents/orchestrator.ts` |
| Story Agent | 🔄 Enhance | `src/lib/agents/story-extractor.ts` |
| Design Agent | 🔄 Build | `src/lib/agents/ui-composer.ts` |
| Quality Agent | 🔄 Enhance | `src/lib/agents/quality-checker.ts` |
| Design Tokens | ✅ Exists | `src/lib/design/tokens.ts` |

---

## Key Principles

| Principle | Implementation |
|-----------|----------------|
| **Don't overload orchestrator** | Delegate complex tasks to subagents |
| **Subagents are specialists** | Each has focused expertise and tools |
| **Context isolation** | Each subagent works in its own context |
| **Parallel when possible** | Independent tasks run simultaneously |
| **Orchestrator synthesizes** | Combines subagent outputs coherently |
| **Quality is advisory** | Suggests, doesn't block |

---

## References

| Document | Purpose |
|----------|---------|
| `todo/ai-sdk-phase-10-persona-agents.md` | Implementation plan |
| `agent-builder/references/architectures.md` | Pattern source |
| `src/lib/design/tokens.ts` | Design token definitions |

---

*Last updated: 2026-01-02*
