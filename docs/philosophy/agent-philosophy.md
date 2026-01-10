# Agent Philosophy: Let the Model Be Agentic

> "The model has all the knowledge in the world. Stop telling it what to do."

## Core Belief

Large language models are remarkably capable. When we over-engineer agents with rigid schemas, forced workflows, and prescriptive chains, we:
- Limit their creativity and adaptability
- Create brittle systems that break on edge cases
- Spend engineering effort solving problems the model already knows how to solve
- Build complexity that obscures rather than enables

**The goal is not to control the agent. The goal is to give it the right tools and get out of the way.**

---

## The Anti-Patterns We've Built

### 1. Prescriptive Data Schemas

**What we did:**
```typescript
// Forcing the agent into our mental model
const projectSchema = z.object({
  title: z.string().max(100),
  description: z.string().min(400).max(600),
  materials: z.array(z.string()).min(1).max(10),
  techniques: z.array(z.string()),
  problem: z.string(),
  solution: z.string(),
  highlight: z.string(),
  // ... 20 more rigid fields
});
```

**What's wrong:**
- The model knows what makes a good portfolio. We don't need to tell it "descriptions must be 400-600 words."
- Rigid schemas reject valid content that doesn't fit our boxes
- We're encoding our assumptions, not enabling intelligence

**Better approach:**
- Minimal schemas that capture *what we need to store*, not *what we think is correct*
- Let the model decide structure based on the actual project
- Accept that a chimney rebuild description differs from a patio installation

### 2. Forced Wizard Steps

**What we did:**
```
Step 1: Upload photos (required)
Step 2: Answer interview questions (required, 5 questions minimum)
Step 3: Review AI content (required)
Step 4: Edit fields (optional)
Step 5: SEO optimization (required)
Step 6: Publish
```

**What's wrong:**
- Not every project needs 5 interview questions
- Some contractors just want to upload photos and let AI do everything
- Others want deep control over every word
- Forcing steps creates friction and abandonment

**Better approach:**
- One conversation, infinite flexibility
- "Here are my photos" → AI generates everything → "Looks good, publish"
- OR: "Let's talk about this project in detail" → deep interview → refined content
- The user's intent determines the flow, not our wizard

### 3. Tool Chains and Orchestration

**What we did:**
```typescript
// Rigid tool chain
const toolChain = [
  'analyzeImages',      // Must run first
  'extractStoryDetails', // Must run after images
  'generateContent',     // Must run after story
  'optimizeSEO',        // Must run after content
];
```

**What's wrong:**
- The model knows when it has enough information
- Sometimes image analysis alone is enough
- Sometimes the contractor's verbal story is more important than images
- Chains prevent the model from adapting to the situation

**Better approach:**
- Give tools, not chains
- The model decides when to analyze, when to ask, when to generate
- Trust it to call tools in the right order (it will)

### 4. Excessive Validation and Guardrails

**What we did:**
```typescript
// "Helpful" validation everywhere
if (description.length < 400) {
  throw new Error("Description too short");
}
if (!materials.includes(detectedMaterial)) {
  throw new Error("Materials don't match image analysis");
}
if (confidence < 0.8) {
  // Force re-analysis
}
```

**What's wrong:**
- We're second-guessing the model constantly
- Edge cases that the model handles gracefully become errors
- Validation logic becomes the source of bugs, not prevention

**Better approach:**
- Validate at boundaries (user input, database writes)
- Trust internal agent decisions
- Let the model explain its uncertainty rather than encoding confidence thresholds

---

## Principles for Agentic Design

### 1. Tools Over Workflows

**Give the agent tools. Don't prescribe when to use them.**

```typescript
// Good: Tools are capabilities
const tools = {
  analyzeImages,     // "I can look at photos"
  searchWeb,         // "I can research"
  generateContent,   // "I can write"
  saveProject,       // "I can persist"
};

// Bad: Workflows are constraints
const workflow = {
  step1: () => analyzeImages(),
  step2: () => generateContent(),
  // ...
};
```

### 2. Minimal Schemas

**Schemas should capture storage needs, not business rules.**

```typescript
// Good: What we need to store
const projectSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.unknown(),  // Let structure emerge
  images: z.array(imageRef),
  status: z.enum(['draft', 'published']),
});

// Bad: Encoding assumptions
const projectSchema = z.object({
  title: z.string().min(10).max(100).regex(/^[A-Z]/),
  // ... 50 lines of "rules"
});
```

### 3. Conversation as Interface

**The chat IS the interface. Everything else is optional.**

- No forms unless the user asks for forms
- No wizards unless the user wants step-by-step
- No modals interrupting the flow
- The agent can do everything through conversation

### 4. Graceful Degradation

**When the agent can't do something perfectly, it should do it well enough.**

```typescript
// Bad: Binary success/failure
if (!canAnalyzeImage) throw new Error("Analysis failed");

// Good: Do what you can
if (!canAnalyzeImage) {
  // Use what we have, explain limitations
  return { partial: true, reason: "Image quality low", bestGuess: {...} };
}
```

### 5. User Intent Over System State

**The agent should care about what the user wants, not what step they're on.**

- "I want to publish this" → Skip to publish, validate only what's needed
- "Let me see a preview" → Show preview, no matter where they are
- "Start over" → Clear state, no confirmation dialogs

### 6. Explain, Don't Enforce

**When something seems wrong, explain. Don't block.**

```
// Bad: Silent rejection
Error: Description must be 400-600 words.

// Good: Collaborative improvement
"This description is quite brief at 150 words. Published portfolios
with more detail tend to rank better in search. Would you like me
to expand on the techniques used, or is brevity intentional for this project?"
```

---

## What This Means for Our Codebase

### Current State (Over-Engineered)

```
src/
├── lib/
│   ├── chat/
│   │   ├── tool-schemas.ts      # Rigid input/output schemas
│   │   ├── tools-runtime.ts     # Execution logic with chains
│   │   └── tool-orchestrator.ts # Forced sequencing
│   ├── agents/
│   │   ├── story-extractor.ts   # Prescriptive extraction
│   │   └── ui-composer.ts       # Better: token-based creativity
│   └── interview/
│       ├── question-bank.ts     # Fixed questions
│       └── flow-controller.ts   # Forced flow
```

### Target State (Agentic)

```
src/
├── lib/
│   ├── tools/
│   │   ├── definitions.ts       # Tool capabilities (what, not when)
│   │   └── executors.ts         # Simple execution (no orchestration)
│   └── agent/
│       ├── system-prompt.ts     # Philosophy, not rules
│       └── context.ts           # State, not workflow position
```

### Migration Path

1. **Remove orchestration layers** - Let the model call tools directly
2. **Simplify schemas** - Storage requirements only
3. **Delete question banks** - The model knows what to ask
4. **Remove step tracking** - Conversation is the state
5. **Trust tool outputs** - Stop validating model decisions

---

## The Litmus Test

Before adding any agent logic, ask:

1. **Would a smart human need this rule?** If a competent person wouldn't need the constraint, neither does the model.

2. **Am I solving a real problem or an imagined one?** Most "guardrails" prevent problems that never happen.

3. **Does this enable or constrain?** Tools enable. Workflows constrain.

4. **Would I want this if I were the user?** Friction is bad. Trust is good.

5. **Can the model figure this out?** Almost always, yes.

---

## Summary

| Instead of... | Do this... |
|---------------|------------|
| Rigid schemas | Minimal storage types |
| Forced wizards | Conversational flow |
| Tool chains | Independent tools |
| Validation everywhere | Boundary validation only |
| State machines | Natural conversation |
| Confidence thresholds | Graceful uncertainty |
| Error rejection | Collaborative explanation |
| Our assumptions | Model's knowledge |

**The best agent code is code we delete.**

---

## References

- `/docs/execution/agentic-ui-implementation.md` - Example of token-based creativity
- `/src/lib/design/tokens.ts` - Constrained creativity done right
- This document: The north star for agent development
