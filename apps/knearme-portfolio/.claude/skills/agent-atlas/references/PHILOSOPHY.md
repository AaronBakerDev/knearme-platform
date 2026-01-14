# Philosophy Reference: Let the Model Be Agentic

> **North Star:** "The model has all the knowledge in the world. Stop telling it what to do."

This document summarizes the core principles guiding agent development. For full context, see the authoritative sources in `docs/philosophy/`.

---

## The Fundamental Belief

Large language models are remarkably capable. When we over-engineer agents with rigid schemas, forced workflows, and prescriptive chains, we:

- **Limit their creativity** and adaptability
- **Create brittle systems** that break on edge cases
- **Waste engineering effort** solving problems the model already knows how to solve
- **Build complexity** that obscures rather than enables

**The goal is not to control the agent. The goal is to give it the right tools and get out of the way.**

---

## Core Principles

| Principle | What It Means | What It Replaces |
|-----------|---------------|------------------|
| **Tools Over Workflows** | Give capabilities. Don't prescribe when to use them. | Tool chains, forced sequences, orchestrators |
| **Minimal Schemas** | Capture storage needs, not business rules | Rigid validation, word count limits, field requirements |
| **Conversation as Interface** | The chat IS the interface. Forms are fallbacks. | Wizards, modals, step-by-step flows |
| **Graceful Degradation** | Do well enough when perfect isn't possible | Binary success/failure, blocking errors |
| **User Intent Over System State** | Care about what the user wants, not what step they're on | Phase gates, progress tracking, state machines |
| **Explain, Don't Enforce** | When something seems wrong, explain—don't block | Validation errors, rejection messages |
| **Context Over Gates** | Rich inputs (images, docs) enhance thinking, not block progress | `readyForImages` flags, phase transitions, blocking requirements |

---

## The Litmus Test

Before adding ANY agent logic, ask these five questions:

### 1. Would a smart human need this rule?
If a competent person wouldn't need the constraint, neither does the model.

### 2. Am I solving a real problem or an imagined one?
Most "guardrails" prevent problems that never happen.

### 3. Does this enable or constrain?
Tools enable. Workflows constrain.

### 4. Would I want this if I were the user?
Friction is bad. Trust is good.

### 5. Can the model figure this out?
Almost always, yes.

---

## Anti-Patterns to Avoid

### Category 1: Prescriptive Data Schemas

**Bad:**
```typescript
const projectSchema = z.object({
  title: z.string().max(100),
  description: z.string().min(400).max(600),  // Why 400? Why 600?
  materials: z.array(z.string()).min(1).max(10),  // Why require materials?
});
```

**Better:**
```typescript
const projectSchema = z.object({
  title: z.string(),
  content: z.unknown(),  // Let structure emerge
  status: z.enum(['draft', 'published']),
});
```

**Why:** The model knows what makes good content. We don't need to tell it "400-600 words." Accept that different projects have different structures.

---

### Category 2: Forced Wizard Steps

**Bad:**
```
Step 1: Upload photos (required)
Step 2: Answer 5 questions (required)
Step 3: Review AI content (required)
Step 4: Publish
```

**Better:**
```
Conversation → User shares what they want → AI generates → Publish
```

**Why:** Not every project needs 5 questions. Some users want photos + AI magic. Others want deep control. The user's intent determines the flow.

---

### Category 3: Tool Chains and Orchestration

**Bad:**
```typescript
const toolChain = [
  'analyzeImages',      // Must run first
  'extractStory',       // Must run after images
  'generateContent',    // Must run after story
];
```

**Better:**
```typescript
const tools = {
  analyzeImages,    // "I can look at photos"
  extractStory,     // "I can find narratives"
  generateContent,  // "I can write"
  saveProject,      // "I can persist"
};
// The model decides when and what order to use them
```

**Why:** The model knows when it has enough information. Chains prevent adaptation.

---

### Category 4: Magic Numbers and Thresholds

**Bad:**
```typescript
const MIN_PROBLEM_WORDS = 8;
const MIN_SOLUTION_WORDS = 8;
const CLARIFICATION_THRESHOLD = 0.7;

if (problemWordCount < MIN_PROBLEM_WORDS) return false;
```

**Better:**
```typescript
const hasEnoughContext = Boolean(
  state.projectType || state.customerProblem || state.solutionApproach
);
// Or: let the model decide via a tool call
```

**Why:** Why 8 words? Why not 7 or 9? These numbers are arbitrary. Trust the model to judge "enough."

---

### Category 5: Masonry-Specific Language

**Bad (throughout codebase):**
```typescript
"You are an expert masonry consultant..."
"Type of masonry project (chimney, tuckpointing...)"
"Select the type of masonry project..."
```

**Better:**
```typescript
"You are an expert construction consultant..."
"Type of project based on the work described"
"Select the type of project you completed"
```

**Why:** The system should work for any business type, not just masonry.

---

### Category 6: Over-Prescriptive Prompts

**Bad:**
```
## Interview strategy
1) Start with a wide-open prompt.
2) Propose a story angle and get yes/no.
3) Ask 2-3 targeted follow-ups.
4) Recap and invite corrections.
5) Ask for location early.
```

**Better:**
```
## Interview approach
- Listen first, guide second
- Adapt questions to what the contractor wants to share
- Some want deep conversation, others want quick publishing
- Photos and details are helpful but never blocking
```

**Why:** Numbered steps are procedures. Principles allow adaptation.

---

### Category 7: Images as Gates (Instead of Context)

**Bad:**
```typescript
// Phase machine: gathering → images → generating
if (state.readyForImages) {
  transitionTo('images');  // Can't proceed without this gate
}

// Blocking on images before content generation
if (!state.images.length) {
  return { error: 'Please upload images first' };
}
```

**Better:**
```typescript
// Images enrich context, never block
const hasImages = state.images.length > 0;
const content = await generateContent({
  ...state,
  // Images inform writing when present, not required
  visualContext: hasImages ? analyzeImages(state.images) : null,
});

// Agent invites images naturally, not procedurally
// "Got any photos of that work?" - when it feels right
```

**Why Images Matter (But Shouldn't Gate):**

Images are **context that enriches the agent's thinking**:
- A before/after photo reveals transformation magnitude
- A detail shot shows craftsmanship worth highlighting
- A progress photo suggests process-focused storytelling

The agent should:
1. **Know images help** - They reveal what words can't (goal-aware)
2. **Invite them naturally** - "Got any pics?" when it fits the conversation
3. **Think differently when images arrive** - Adjust emphasis, questions, content
4. **Never block on them** - A project can publish without images

**The distinction:** Images are valuable context for agent reasoning, NOT a phase gate to pass through.

---

## The Vision: From Legacy to Agentic

### Current State (Legacy)

| Aspect | Current Implementation |
|--------|----------------------|
| **Business type** | Masonry contractors only |
| **Onboarding** | 3-step form wizard |
| **Project creation** | 6-step wizard |
| **Data model** | Fixed columns (materials, techniques) |
| **Agent workflow** | Rigid phases, magic numbers |
| **Business discovery** | Manual form entry |

### Target State (Agentic)

| Aspect | Target Vision |
|--------|---------------|
| **Business type** | Any business with work to show |
| **Onboarding** | Conversation with Discovery Agent |
| **Project creation** | Natural dialogue with Story Agent |
| **Data model** | JSONB, structure emerges |
| **Agent workflow** | Agent-initiated handoffs |
| **Business discovery** | DataForSEO lookup → 1 confirmation |

---

## Agent Personas (Not Procedures)

The platform envisions 6 agents, each with a persona, NOT a procedure:

| Agent | Persona | Key Autonomy |
|-------|---------|--------------|
| **Discovery** | "I don't assume—I discover what makes your work special" | Learns vocabulary, discovers business type |
| **Story** | "I let stories tell themselves, not force them into templates" | Adapts extraction to business type |
| **Visual** | "I see what's in images and organize them meaningfully" | Categorizes by content, not templates |
| **Content** | "I write in their voice, not AI voice" | Matches voice to business personality |
| **Layout** | "I compose presentations that let work shine" | Selects patterns based on content type |
| **Quality** | "I assess for THIS business, not a generic checklist" | Contextual standards |

**Critical:** These are personas with autonomy, not procedures with steps.

---

## Summary: What To Do

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
| Images as gates | Images as context that enriches thinking |

---

## Quick Reference Commands

```bash
# View full philosophy
Read docs/philosophy/agent-philosophy.md

# View specific issues to fix
Read docs/philosophy/over-engineering-audit.md

# View agent personas
Read docs/philosophy/universal-portfolio-agents.md

# View implementation roadmap
Read docs/philosophy/implementation-roadmap.md

# View UX and data model vision
Read docs/philosophy/agentic-first-experience.md
```

---

## The Mantra

**The best agent code is code we delete.**

---

## References

| Document | Purpose |
|----------|---------|
| `docs/philosophy/agent-philosophy.md` | Core beliefs (this reference is derived from it) |
| `docs/philosophy/over-engineering-audit.md` | 25+ specific issues with line numbers |
| `docs/philosophy/universal-portfolio-agents.md` | Agent personas and universal portfolio vision |
| `docs/philosophy/agentic-first-experience.md` | Complete UX journey and data model |
| `docs/philosophy/implementation-roadmap.md` | Concrete migration phases |
| `docs/philosophy/operational-excellence.md` | Testing, observability, resilience |
