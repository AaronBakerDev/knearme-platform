# Universal Portfolio Agents: Architecture Vision

> **Core Belief:** Any business that does work worth showing can benefit from a portfolio. The agents should discover what that means for each business, not assume it.

---

## The Fundamental Shift

### From This (Current)
```
Trade Config → Prescribed Schema → Rigid Workflow → Fixed Output
     ↓                ↓                  ↓              ↓
  Masonry      materials/techniques   5-phase       before/after
```

### To This (Vision)
```
Discovery → Understanding → Emergence → Adaptation
    ↓            ↓              ↓            ↓
 Any business   Their story   Natural flow   Their portfolio
```

---

## Who Could Use This?

| Category | Examples | Portfolio Focus |
|----------|----------|-----------------|
| **Construction** | Masonry, plumbing, electrical, roofing, HVAC | Problem → Solution, Before/After |
| **Creative** | Photographers, videographers, graphic designers | Style, Vision, Range |
| **Artisan** | Jewelers, furniture makers, potters, welders | Craftsmanship, Process, Detail |
| **Home Services** | Landscapers, interior designers, organizers | Transformation, Aesthetic |
| **Events** | Caterers, florists, DJs, wedding planners | Experiences, Moments, Atmosphere |
| **Beauty** | Makeup artists, hair stylists, tattoo artists | Artistry, Before/After, Style Range |
| **Professional** | Consultants, coaches, trainers | Results, Testimonials, Methodology |

**Each has different:**
- Visual needs (process vs. result vs. action)
- Story structure (problem/solution vs. creative vision vs. transformation)
- Key metrics (materials vs. style vs. outcomes)
- SEO patterns (location vs. specialty vs. style)

---

## Agent Architecture

### Core Principle: Personas, Not Procedures

Each agent receives:
1. **Persona** - Who they are, their expertise, their perspective
2. **Context** - Who the user is, their business, their goals
3. **Tools** - What capabilities they have
4. **Autonomy** - Freedom to decide what's needed and when to hand off

### The Agent Team

```
┌─────────────────────────────────────────────────────────────────┐
│                         AGENT TEAM                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │  DISCOVERY   │────▶│    STORY     │────▶│   CONTENT    │    │
│  │    AGENT     │     │    AGENT     │     │    AGENT     │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│         │                    │                    │             │
│         │                    │                    │             │
│         ▼                    ▼                    ▼             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   VISUAL     │◀───▶│   LAYOUT     │◀───▶│   QUALITY    │    │
│  │    AGENT     │     │    AGENT     │     │    AGENT     │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│                                                                  │
│  Agents can hand off to ANY other agent based on context        │
│  No fixed sequence. Emergent collaboration.                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Agent Personas

### 1. Discovery Agent

**Persona:**
> "I'm curious about businesses. I want to understand what you do, who you serve, and what makes your work special. I don't assume anything—I discover."

**Responsibilities:**
- Understand the nature of the business
- Learn their vocabulary (they say "projects" or "pieces" or "events"?)
- Discover what "good work" means in their context
- Identify what their potential customers care about

**Tools:**
- `conversationTool` - Natural dialogue
- `businessProfileTool` - Store discovered attributes
- `handoffTool` - Pass context to other agents

**NOT responsible for:**
- Forcing business types into categories
- Assuming what their portfolio should look like
- Following a script

**Example Discovery:**
```
User: "I make custom furniture"

Discovery Agent thinking:
- This is craftsmanship work
- Portfolios probably focus on pieces, not before/after
- Materials and techniques matter, but so does design aesthetic
- Customers care about quality, uniqueness, durability
- They might work with interior designers or direct to consumers
```

---

### 2. Story Agent

**Persona:**
> "Every piece of work has a story. I listen for what makes this one special—not to fit it into a template, but to let it tell itself."

**Responsibilities:**
- Extract narratives from conversation
- Identify what's compelling about this particular work
- Adapt story structure to business type
- Recognize when the story is "enough" (no word count minimums)

**Tools:**
- `extractNarrativeTool` - Capture story elements
- `identifyHighlightsTool` - Find what's special
- `handoffTool` - Pass to Content or Visual agent

**Adapts to context:**
- Contractor: "What problem did you solve? How?"
- Artist: "What inspired this piece? What were you trying to express?"
- Event planner: "What was the vision? How did you bring it to life?"
- Consultant: "What challenge did the client face? What was the outcome?"

---

### 3. Visual Agent

**Persona:**
> "I see what's in the images and understand what they're saying about the work. I organize them to tell a visual story, not to fit a template."

**Responsibilities:**
- Analyze uploaded images
- Categorize based on what they show (not forced categories)
- Suggest organization that makes sense for this content
- Identify which images best represent the work

**Tools:**
- `analyzeImagesTool` - Understand image content
- `categorizeVisualsTool` - Organize by meaning, not template
- `suggestHeroTool` - Identify strongest visual
- `handoffTool` - Pass to Layout agent

**Adapts categories to content:**
- Construction: before, after, process, detail
- Photography: portrait, landscape, action, detail
- Furniture: piece, detail, in-situ, process
- Events: venue, food, moments, decor
- Tattoo: fresh, healed, detail, placement

---

### 4. Content Agent

**Persona:**
> "I write in the voice of the business, not in the voice of AI. I create content that sounds like them talking about their best work."

**Responsibilities:**
- Generate portfolio content from story and context
- Match voice to business type and personality
- Structure content appropriately (narrative vs. list vs. specs)
- Create SEO-friendly content without forcing keywords

**Tools:**
- `generateContentTool` - Create portfolio text
- `matchVoiceTool` - Adapt to business personality
- `seoOptimizeTool` - Natural keyword integration
- `handoffTool` - Pass to Layout or Quality agent

**Voice adaptation:**
- Contractor: Professional, problem-solving, trustworthy
- Artist: Expressive, personal, conceptual
- Event planner: Warm, detailed, experience-focused
- Consultant: Results-oriented, credible, clear

---

### 5. Layout Agent

**Persona:**
> "I compose visual presentations that let the work shine. The layout serves the content, not the other way around."

**Responsibilities:**
- Compose page layouts based on content type
- Select design tokens that match business aesthetic
- Arrange visual and text elements effectively
- Create cohesive portfolio presentation

**Tools:**
- `composeLayoutTool` - Generate semantic blocks
- `selectDesignTokensTool` - Choose appropriate aesthetics
- `previewTool` - Show composition to user
- `handoffTool` - Pass to Quality agent

**Layout adaptation:**
- Construction: Hero result, before/after comparison, details
- Photography: Gallery-focused, minimal text, image-forward
- Furniture: Large product shots, detail callouts, specs
- Events: Narrative flow, moment captures, atmosphere shots

---

### 6. Quality Agent

**Persona:**
> "I ensure the portfolio represents the work well. My standards adapt to what this business needs, not a fixed checklist."

**Responsibilities:**
- Assess if portfolio is ready to publish
- Identify gaps specific to this business type
- Suggest improvements without blocking progress
- Validate from customer perspective

**Tools:**
- `assessReadinessTool` - Contextual quality check
- `identifyGapsTool` - What's missing for this type?
- `suggestImprovementsTool` - Non-blocking recommendations
- `approveTool` - Confirm publish-ready

**Contextual standards:**
- Photographer: "Do we show range? Is the style clear?"
- Contractor: "Is the problem/solution clear? Do we show the result?"
- Artisan: "Does the craftsmanship come through? Are details visible?"
- Event planner: "Can we feel the experience? Is the scope clear?"

---

## Handoff Protocol

Agents communicate through structured handoffs:

```typescript
interface AgentHandoff {
  from: AgentType;
  to: AgentType;
  context: {
    businessUnderstanding: BusinessContext;
    workCompleted: string;
    currentState: unknown;
    suggestedNextStep: string;
  };
  artifacts: Artifact[];
}
```

**Handoff is agent-initiated, not orchestrator-forced.**

Examples:
- Discovery → Story: "I understand this is a custom furniture maker. They value craftsmanship and unique designs. Ready for story extraction."
- Story → Visual: "I have the narrative about their walnut dining table commission. Can you analyze the images to complement the story?"
- Visual → Layout: "Images are categorized: finished piece (3), detail shots (4), process (2). The grain detail shots are particularly strong."
- Layout → Quality: "Composed a gallery-forward layout with minimal text. Before publishing, can you assess if this represents their work well?"

---

## Schema-Free Content

### Current Problem
```typescript
// Forces all portfolios into contractor mold
interface Project {
  title: string;
  description: string;  // 400-600 words
  materials: string[];  // Assumes physical materials
  techniques: string[];  // Assumes trade techniques
  problem: string;
  solution: string;
  images: { type: 'before' | 'after' | 'progress' | 'detail' }[];
}
```

### Vision: Emergent Structure
```typescript
interface PortfolioItem {
  id: string;
  businessId: string;

  // Core content - flexible structure
  content: {
    title: string;
    body: ContentBlock[];  // Semantic blocks, structure emerges
    metadata: Record<string, unknown>;  // Business-specific attributes
  };

  // Visual assets - category emerges from content
  visuals: {
    images: Image[];
    organization: VisualOrganization;  // Agent-determined
  };

  // Business context - discovered, not assumed
  context: {
    businessType: string;  // Inferred
    vocabulary: Record<string, string>;  // Their terms
    customerFocus: string[];  // What their customers care about
  };

  // SEO - adapted to business type
  seo: {
    focus: string;  // Could be location, style, specialty
    content: SeoContent;
  };

  status: 'draft' | 'published';
}
```

---

## Discovery Flow (Not Interview Script)

### Current Problem
```
Step 1: Upload photos (required)
Step 2: Answer 5 questions (required)
Step 3: Review content (required)
Step 4: Publish
```

### Vision: Natural Conversation

The Discovery Agent leads a natural conversation. The flow emerges from context:

**For a contractor:**
```
"Tell me about a project you're proud of."
→ They describe the problem, the solution, the outcome
→ Story Agent extracts narrative
→ "Got any photos?" → Visual Agent processes
→ Content generated, reviewed, published
```

**For a photographer:**
```
"What kind of work do you want to showcase?"
→ They describe their style, their specialty
→ "Let's see some of your favorites" → Visual Agent analyzes
→ Story Agent identifies themes
→ Content generated, reviewed, published
```

**For an event planner:**
```
"Tell me about an event you loved creating."
→ They describe the vision, the execution, the moments
→ "Show me some captures from the day" → Visual Agent processes
→ Content woven around the experience
→ Published
```

**The agents adapt. The flow is not prescribed.**

---

## Parallel Execution

When appropriate, agents work in parallel:

```
┌─────────────────────────────────────────────────────────┐
│                   PARALLEL EXECUTION                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  User uploads images + describes work                    │
│                    │                                     │
│         ┌─────────┴─────────┐                           │
│         ▼                   ▼                           │
│  ┌─────────────┐    ┌─────────────┐                    │
│  │   VISUAL    │    │   STORY     │                    │
│  │   AGENT     │    │   AGENT     │                    │
│  │  (images)   │    │ (narrative) │                    │
│  └─────────────┘    └─────────────┘                    │
│         │                   │                           │
│         └─────────┬─────────┘                           │
│                   ▼                                     │
│           ┌─────────────┐                               │
│           │   CONTENT   │                               │
│           │    AGENT    │                               │
│           │  (combine)  │                               │
│           └─────────────┘                               │
│                   │                                     │
│                   ▼                                     │
│           ┌─────────────┐                               │
│           │   LAYOUT    │                               │
│           │    AGENT    │                               │
│           └─────────────┘                               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Agents decide when parallel execution helps.** Not prescribed by orchestrator.

---

## What Changes in the Codebase

### Remove Entirely
- `src/lib/trades/config.ts` - No trade configs
- `MASONRY_CONFIG` - No hardcoded trade
- `NATIONAL_SERVICE_TYPES` - No service type constants
- Fixed interview questions - No question banks
- Phase state machine - No forced phases
- Magic number thresholds - No arbitrary gates

### Replace With
```typescript
// src/lib/agents/personas.ts
export const AGENT_PERSONAS = {
  discovery: {
    role: "I understand businesses and what makes their work special.",
    capabilities: ["conversation", "business_profiling", "handoff"],
    autonomy: "full",  // Decides own flow
  },
  story: {
    role: "I find and extract the compelling narrative in any work.",
    capabilities: ["narrative_extraction", "highlight_identification", "handoff"],
    autonomy: "full",
  },
  visual: {
    role: "I analyze and organize visuals to tell the story of the work.",
    capabilities: ["image_analysis", "categorization", "hero_selection", "handoff"],
    autonomy: "full",
  },
  content: {
    role: "I write in the voice of the business, creating content that sounds like them.",
    capabilities: ["content_generation", "voice_matching", "seo_optimization", "handoff"],
    autonomy: "full",
  },
  layout: {
    role: "I compose visual presentations that let the work shine.",
    capabilities: ["layout_composition", "design_tokens", "preview", "handoff"],
    autonomy: "full",
  },
  quality: {
    role: "I ensure the portfolio represents the work well for this type of business.",
    capabilities: ["readiness_assessment", "gap_identification", "approval", "handoff"],
    autonomy: "full",
  },
};
```

```typescript
// src/lib/agents/context.ts
export interface AgentContext {
  // Who is the user?
  business: {
    name: string;
    type: string;  // Discovered, not assumed
    vocabulary: Record<string, string>;  // Their terms
    voice: string;  // How they communicate
    customerFocus: string[];  // What their customers care about
  };

  // What are we working on?
  currentWork: {
    description: string;
    images: Image[];
    story: string;
    stage: string;  // Emergent, not prescribed
  };

  // What's been done?
  completedWork: Artifact[];

  // What do other agents need to know?
  sharedContext: Record<string, unknown>;
}
```

```typescript
// src/lib/agents/handoff.ts
export interface HandoffRequest {
  from: AgentType;
  to: AgentType;
  reason: string;  // Why this handoff makes sense
  context: AgentContext;
  artifacts: Artifact[];
  suggestedNextStep?: string;  // Hint, not command
}

export function requestHandoff(request: HandoffRequest): void {
  // Agents initiate handoffs, not orchestrator
  // Receiving agent decides how to proceed
}
```

---

## Quality Without Fixed Rules

### Current Problem
```typescript
// Fixed checklist regardless of business
const PUBLISH_REQUIREMENTS = {
  required: ['title', 'project_type', 'city', 'state'],
  minImages: 1,
  requireHeroImage: true,
  minDescriptionWords: 400,
};
```

### Vision: Contextual Quality
```typescript
// Quality Agent assesses based on business type
function assessQuality(item: PortfolioItem): QualityAssessment {
  // What matters for this type of business?
  const focus = inferQualityFocus(item.context.businessType);

  // Check what's relevant, not what's prescribed
  return {
    ready: evaluateReadiness(item, focus),
    suggestions: generateSuggestions(item, focus),
    blocking: [], // Almost nothing should block
    customerPerspective: wouldCustomerBeImpressed(item),
  };
}

function inferQualityFocus(businessType: string): QualityFocus {
  // Agent reasons about what matters
  // Not a lookup table
  // "For a photographer, strong visuals matter most"
  // "For a contractor, clear problem/solution matters"
  // "For an event planner, conveying the experience matters"
}
```

---

## SEO Without Trade Assumptions

### Current Problem
```
/{city}/masonry/{type}/{slug}
```

### Vision: Business-Adaptive URLs
```
/{location}/{specialty}/{identifier}

Examples:
/denver-co/masonry/chimney-rebuild/historic-restoration
/denver-co/wedding-photography/outdoor/mountain-elopement
/denver-co/custom-furniture/dining-tables/live-edge-walnut
/denver-co/event-planning/corporate/tech-conference-2025
```

**URL structure emerges from business type, not hardcoded.**

---

## Implementation Approach

### Phase 1: Core Agent Framework
1. Define agent personas (not procedures)
2. Implement handoff protocol
3. Create flexible content schema
4. Remove trade config dependencies

### Phase 2: Discovery First
1. Build Discovery Agent with full autonomy
2. Let it learn business context through conversation
3. Store discovered vocabulary and focus areas
4. No assumptions about what the business is

### Phase 3: Specialist Agents
1. Story Agent adapts extraction to business type
2. Visual Agent categorizes based on content, not templates
3. Content Agent matches voice to business
4. Layout Agent composes based on content type
5. Quality Agent assesses contextually

### Phase 4: Emergent Collaboration
1. Agents initiate handoffs based on context
2. Parallel execution when appropriate
3. No orchestrator prescribing flow
4. The agents collaborate naturally

---

## Success Criteria

After implementation:

1. **Onboard any business type** without code changes
2. **Portfolio structure emerges** from content, not templates
3. **Agents collaborate** based on context, not scripts
4. **Quality is contextual** - a great photographer portfolio differs from a great contractor portfolio
5. **Voice matches the business** - content sounds like them, not like AI
6. **Flow adapts** to what the user wants to share

---

## The North Star

> **Give agents personas, context, and tools. Let them figure out the rest.**

The models are smart. They know how to:
- Understand a business
- Extract a story
- Analyze images
- Write compelling content
- Compose layouts
- Assess quality

**Our job is to get out of their way.**

---

## References

- [agent-philosophy.md](./agent-philosophy.md) - Core principles
- [over-engineering-audit.md](./over-engineering-audit.md) - What to remove
- [agentic-first-experience.md](./agentic-first-experience.md) - Complete UX & data model vision
- This document - Agent architecture vision
