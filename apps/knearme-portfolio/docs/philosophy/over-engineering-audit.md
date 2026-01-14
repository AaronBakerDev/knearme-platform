# Over-Engineering Audit: Detailed Findings & Remediation

> **Audit Date:** January 2, 2026
> **Purpose:** Identify all areas where the agent is over-constrained, with concrete implementation plans
> **Philosophy Reference:** See [agent-philosophy.md](./agent-philosophy.md) for guiding principles

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Category 1: Masonry-Specific Hardcoding](#category-1-masonry-specific-hardcoding)
3. [Category 2: Rigid Workflow Constraints](#category-2-rigid-workflow-constraints)
4. [Category 3: Magic Numbers & Thresholds](#category-3-magic-numbers--thresholds)
5. [Category 4: Over-Prescriptive Prompts](#category-4-over-prescriptive-prompts)
6. [Category 5: UI Assumptions](#category-5-ui-assumptions)
7. [Category 6: Memory & Context Constraints](#category-6-memory--context-constraints)
8. [Implementation Phases](#implementation-phases)
9. [Migration Checklist](#migration-checklist)

---

## Executive Summary

The agent system has **systemic over-engineering** across 6 areas. The core philosophy violation:

> **We tell the AI HOW to work instead of WHAT outcome we want.**

### Quick Stats

| Category | Files Affected | Severity | Fix Complexity |
|----------|---------------|----------|----------------|
| Masonry-specific hardcoding | 12+ | CRITICAL | Medium |
| Rigid workflow constraints | 6 | HIGH | High |
| Magic numbers/thresholds | 8 | HIGH | Low |
| Over-prescriptive prompts | 5 | MEDIUM | Low |
| UI assumptions | 6 | MEDIUM | Medium |
| Memory/context constraints | 4 | LOW | Low |

---

## Category 1: Masonry-Specific Hardcoding

### Finding 1.1: Trade Config Architecture Blocker

**File:** `src/lib/trades/config.ts`

**Lines 137-139:**
```typescript
export function getTradeConfig(): TradeConfig {
  return MASONRY_CONFIG;  // No dynamic lookup; masonry is hard-coded
}
```

**Lines 48-131:** `MASONRY_CONFIG` is the ONLY trade configuration with:
- Lines 54-67: Only masonry project types
- Lines 68-81: Only masonry materials
- Lines 82-93: Only masonry techniques
- Lines 94-105: Only masonry-specific problems
- Lines 106-111: Only masonry certifications

**Impact:** Cannot support any other trade without code changes.

**Implementation Plan:**
```typescript
// BEFORE
export function getTradeConfig(): TradeConfig {
  return MASONRY_CONFIG;
}

// AFTER
export function getTradeConfig(trade?: string): TradeConfig {
  // 1. Accept trade parameter
  // 2. Look up from database or config map
  // 3. Fallback to generic config, not masonry
  const configs: Record<string, TradeConfig> = {
    masonry: MASONRY_CONFIG,
    // Add other trades or load dynamically
  };
  return trade ? configs[trade] ?? GENERIC_CONFIG : GENERIC_CONFIG;
}
```

---

### Finding 1.2: Image Analysis Prompt Hardcoded to Masonry

**File:** `src/lib/ai/prompts.ts`

**Line 24:**
```typescript
"You are an expert masonry consultant..."
```

**Lines 28-36:** Lists specific masonry types, materials, techniques:
```typescript
"1. **Project Type**: Identify the primary type of masonry work shown..."
"2. **Materials**: List specific materials visible (e.g., red clay brick, limestone...)"
```

**Line 60:** Returns `"not_masonry"` as failure case.

**Impact:** AI is locked into masonry domain regardless of actual contractor trade.

**Implementation Plan:**
```typescript
// BEFORE (line 24)
"You are an expert masonry consultant..."

// AFTER
"You are an expert construction consultant. Analyze these project images..."
// Remove specific masonry examples, let model identify from image context
// Remove "not_masonry" failure case - let model describe what it sees
```

---

### Finding 1.3: Content Generator Masonry Text

**File:** `src/lib/agents/content-generator.ts`

**Line 119:**
```typescript
return `Generate portfolio content for this masonry project:
```

**Impact:** Even with trade-agnostic prompts elsewhere, the generation step hardcodes "masonry."

**Implementation Plan:**
```typescript
// BEFORE
return `Generate portfolio content for this masonry project:

// AFTER
return `Generate portfolio content for this ${tradeConfig.displayName || 'construction'} project:
```

---

### Finding 1.4: Tool Schema Masonry Examples

**File:** `src/lib/chat/tool-schemas.ts`

**Line 50:**
```typescript
project_type: z
  .string()
  .optional()
  .describe('Type of masonry project (chimney, tuckpointing, stone repair, brick repair, etc.)'),
```

**Line 62:**
```typescript
materials_mentioned: z
  .array(z.string())
  .optional()
  .describe('Materials mentioned (brick types, mortar, stone, etc.)'),
```

**Impact:** AI sees masonry examples in tool descriptions, biasing extraction.

**Implementation Plan:**
```typescript
// BEFORE (line 50)
.describe('Type of masonry project (chimney, tuckpointing, stone repair, brick repair, etc.)'),

// AFTER
.describe('Type of project based on the work described'),
```

---

### Finding 1.5: Quality Checker Masonry Suggestions

**File:** `src/lib/agents/quality-checker.ts`

**Lines 20-32:**
```typescript
const FIELD_SUGGESTIONS: Record<string, string> = {
  project_type: 'Select the type of masonry project (e.g., chimney rebuild, tuckpointing)',
  // ...
};
```

**Implementation Plan:**
```typescript
// BEFORE
project_type: 'Select the type of masonry project (e.g., chimney rebuild, tuckpointing)',

// AFTER
project_type: 'Select the type of project you completed',
```

---

### Finding 1.6: Default Interview Questions

**File:** `src/lib/ai/prompts.ts`

**Lines 184-210:** `DEFAULT_INTERVIEW_QUESTIONS` Q2:
```typescript
{
  id: 'q2',
  text: 'What type of masonry work did you do on this project?',
  purpose: 'Identifies the service type',
},
```

**Implementation Plan:**
```typescript
// BEFORE
text: 'What type of masonry work did you do on this project?',

// AFTER
text: 'What type of work did you do on this project?',
// Or remove default questions entirely - let model generate contextually
```

---

### Finding 1.7: National Service Types Hardcoded

**File:** `src/lib/data/services.ts`

**Lines 250-259:**
```typescript
export const NATIONAL_SERVICE_TYPES = [
  'chimney-repair',
  'tuckpointing',
  'brick-repair',
  'stone-masonry',
  'foundation-repair',
  'historic-restoration',
  'masonry-waterproofing',
  'efflorescence-removal',
] as const;
```

**Impact:** All masonry services, no mechanism for other trades.

**Implementation Plan:**
- Move to database lookup by contractor trade
- Or make function that accepts trade parameter
- Remove hardcoded constant

---

### Finding 1.8: Story Extractor Comments & Examples

**File:** `src/lib/agents/story-extractor.ts`

**Multiple locations:**
- Line 12: `* - projectType: Derived from trade config (e.g., chimney-rebuild for masonry)`
- Line 66: `* For masonry: chimney-rebuild, tuckpointing, stone-veneer, etc.`
- Line 83: `.describe('Project type: chimney-rebuild, tuckpointing, stone-veneer, etc.')`
- Line 211: `Include specific variants when mentioned (e.g., "reclaimed red brick" not just "brick")`
- Line 238: Example uses "We rebuilt a chimney in Denver..."

**Implementation Plan:**
- Change all masonry examples to generic construction examples
- Or remove examples entirely - the model knows what a project type looks like

---

## Category 2: Rigid Workflow Constraints

### Finding 2.1: Orchestrator State Machine

**File:** `src/lib/agents/orchestrator.ts`

**Lines 61-73:**
```typescript
type Phase = 'gathering' | 'images' | 'generating' | 'review' | 'ready';

export function determinePhase(state: SharedProjectState): Phase {
  if (state.readyToPublish) return 'ready';
  if (state.title && state.description) return 'review';
  if (state.readyForContent) return 'generating';
  if (state.readyForImages) return 'images';
  return 'gathering';
}
```

**Impact:** Forces linear workflow: gather → images → generate → review → ready. No flexibility.

**Implementation Plan:**
```typescript
// OPTION A: Remove phases entirely, let agent decide flow
// OPTION B: Make phases advisory, not enforced

// BEFORE: Binary phase gates
if (state.readyForImages) return 'images';

// AFTER: Agent decides what to do next based on context
// Remove determinePhase(), let system prompt guide flow
```

---

### Finding 2.2: Quick Action Types Enum

**File:** `src/lib/chat/tool-schemas.ts`

**Lines 211-218:**
```typescript
type: z.enum([
  'addPhotos',
  'generate',
  'openForm',
  'showPreview',
  'composeLayout',
  'checkPublishReady',
  'insert',
])
```

**Impact:** Agent can only suggest 7 predefined actions. Cannot suggest novel workflows.

**Implementation Plan:**
```typescript
// BEFORE: Fixed enum
type: z.enum([...])

// AFTER: Open string with suggestions
type: z.string().describe('Action type (e.g., addPhotos, generate, showPreview, or any relevant action)')
```

---

### Finding 2.3: Image Category Enum

**File:** `src/lib/chat/tool-schemas.ts`

**Line 116:**
```typescript
.array(z.enum(['before', 'after', 'progress', 'detail']))
```

**Impact:** Only 4 image categories. Cannot add 'hero', 'gallery', 'testimonial', 'location', etc.

**Implementation Plan:**
```typescript
// BEFORE
.array(z.enum(['before', 'after', 'progress', 'detail']))

// AFTER
.array(z.string()).describe('Image categories (e.g., before, after, progress, detail, hero, gallery)')
```

---

### Finding 2.4: Editable Field Allowlists

**File:** `src/lib/chat/tool-schemas.ts`

**Lines 389-403:**
```typescript
const updateFieldStringFields = [
  'title',
  'description',
  'seo_title',
  'seo_description',
  'city',
  'state',
] as const;

const updateFieldArrayFields = ['tags', 'materials', 'techniques'] as const;
```

**Impact:** Agent cannot modify 60% of project fields (project_type, challenge, solution, duration, proud_of, hero_image_id, status).

**Implementation Plan:**
```typescript
// OPTION A: Remove allowlist, validate at database level
// OPTION B: Make allowlist configurable per context

// For now, expand the list to include all editable fields
const updateFieldStringFields = [
  'title', 'description', 'seo_title', 'seo_description',
  'city', 'state', 'neighborhood', 'project_type',
  'customer_problem', 'solution_approach', 'duration', 'proud_of',
] as const;
```

---

### Finding 2.5: Regeneratable Sections Limited

**File:** `src/lib/chat/tool-schemas.ts`

**Line 457:**
```typescript
export const regeneratableSections = ['title', 'description', 'seo'] as const;
```

**Impact:** Cannot regenerate materials, techniques, challenge/solution, or custom sections.

**Implementation Plan:**
```typescript
// BEFORE
export const regeneratableSections = ['title', 'description', 'seo'] as const;

// AFTER
export const regeneratableSections = [
  'title', 'description', 'seo',
  'materials', 'techniques', 'challenge', 'solution', 'highlight',
  'all'  // Allow full regeneration
] as const;
```

---

## Category 3: Magic Numbers & Thresholds

### Finding 3.1: Ready-for-Images Gate

**File:** `src/lib/agents/story-extractor.ts`

**Lines 37-47:**
```typescript
const MIN_PROBLEM_WORDS = 8;
const MIN_SOLUTION_WORDS = 8;
const MIN_MATERIALS_FOR_IMAGES = 1;
const CLARIFICATION_THRESHOLD = 0.7;
```

**Lines 722-748:**
```typescript
export function checkReadyForImages(state: Partial<SharedProjectState>): boolean {
  if (!state.projectType) return false;
  if (problemWordCount < MIN_PROBLEM_WORDS) return false;
  if (solutionWordCount < MIN_SOLUTION_WORDS) return false;
  if (materialCount < MIN_MATERIALS_FOR_IMAGES) return false;
  return true;
}
```

**Impact:** Binary gating with arbitrary thresholds. Not all trades need materials. Word counts are arbitrary.

**Implementation Plan:**
```typescript
// OPTION A: Remove thresholds entirely, let model decide
export function checkReadyForImages(state: Partial<SharedProjectState>): boolean {
  // Just check that we have SOMETHING to work with
  const hasBasicInfo = state.projectType || state.customerProblem || state.solutionApproach;
  return Boolean(hasBasicInfo);
}

// OPTION B: Make the model decide via tool call
// Remove this function, add a tool "assessReadiness" that returns model judgment
```

---

### Finding 3.2: Ready-for-Images Tool Description

**File:** `src/lib/chat/tool-schemas.ts`

**Lines 91-101:**
```typescript
ready_for_images: z
  .boolean()
  .optional()
  .describe(
    'ONLY set true when ALL conditions are met: ' +
      '(1) specific project type confirmed (not "brick work"), ' +
      '(2) customer_problem is at least ~8+ words, ' +
      '(3) solution_approach is at least ~8+ words, ' +
      '(4) at least 1 specific material mentioned. '
  ),
```

**Impact:** Hardcoded rules in schema description. "(not 'brick work')" is masonry-specific.

**Implementation Plan:**
```typescript
// BEFORE
.describe('ONLY set true when ALL conditions are met: ...')

// AFTER
.describe('Set to true when you have enough context to meaningfully request project photos')
// Trust the model to judge "enough context"
```

---

### Finding 3.3: Session History Limit

**File:** `src/lib/chat/memory.ts`

**Line 183:**
```typescript
export async function buildSessionContext(
  projectId: string,
  limit = 5   // <-- Magic number
): Promise<SessionContext> {
```

**Impact:** Arbitrary limit of 5 previous sessions. No reasoning for this number.

**Implementation Plan:**
```typescript
// OPTION A: Increase limit
limit = 10

// OPTION B: Make dynamic based on context size
// Calculate how much history fits in context window

// OPTION C: Remove limit, let context management handle truncation
```

---

### Finding 3.4: Text Truncation

**File:** `src/lib/chat/prompt-context.ts`

**Lines 15-21 and 136:**
```typescript
function normalizeText(value?: string | null, maxLength = 200): string | null {
  // ...truncates at maxLength
}
// Line 136: Differentiators truncated at 180 chars
```

**Impact:** Arbitrary truncation could cut important context mid-sentence.

**Implementation Plan:**
```typescript
// BEFORE: Hard truncation
if (trimmed.length <= maxLength) return trimmed;
return `${trimmed.slice(0, Math.max(0, maxLength - 3))}...`;

// AFTER: Intelligent truncation or no truncation
// Let context management handle overall size
// Or truncate at sentence boundaries
```

---

### Finding 3.5: Completeness Weights

**File:** `src/components/chat/hooks/useCompleteness.ts`

**Lines 34-44:**
```typescript
const WEIGHTS = {
  images: 20,
  project_type: 15,
  city: 10,
  state: 5,
  materials: 12,
  customer_problem: 12,
  solution_approach: 12,
  duration: 8,
  proud_of: 6,
};
```

**Impact:** Weights assume masonry field importance. "materials" might not matter for service trades.

**Implementation Plan:**
```typescript
// OPTION A: Make weights configurable per trade
export function getWeights(trade: string): Record<string, number> {
  // Return trade-specific weights
}

// OPTION B: Let the model assess completeness
// Remove weight system, add a tool for model to assess project quality
```

---

## Category 4: Over-Prescriptive Prompts

### Finding 4.1: Numbered Interview Steps

**File:** `src/lib/chat/chat-prompts.ts`

**Lines 41-46:**
```
## Interview strategy (collaborative)
1) Start with a wide-open prompt.
2) Propose a story angle based on what you heard, and get a quick yes/no.
3) Ask 2-3 targeted follow-ups (scope, constraint, outcome).
4) Recap what you have so far and invite corrections.
5) Ask for location early (city/state). Photos are optional and never blocking.
```

**Impact:** Prescribes exact 5-step process. Model should adapt to contractor, not follow script.

**Implementation Plan:**
```
// BEFORE: Numbered steps
1) Start with...
2) Propose...
3) Ask 2-3...

// AFTER: Principles, not steps
## Interview approach
- Listen first, guide second
- Adapt your questions to what the contractor wants to share
- Some contractors want deep conversation, others just want quick publishing
- Photos and details are helpful but never blocking
```

---

### Finding 4.2: Tool Usage Rules

**File:** `src/lib/chat/chat-prompts.ts`

**Lines 54-59:**
```
## Tool usage rules
- After each contractor message with project info: call extractProjectData.
- Update description blocks only when a new detail improves the story.
- Call showPortfolioPreview after meaningful updates to show momentum.
```

**Impact:** "After each message" is prescriptive. Model should decide when extraction helps.

**Implementation Plan:**
```
// BEFORE: Prescriptive rules
- After each contractor message with project info: call extractProjectData.

// AFTER: Outcome-focused guidance
## Tools
You have tools for extracting data, previewing content, and generating portfolios.
Use them when they would help the contractor see progress or when you need structured data.
```

---

### Finding 4.3: Forbidden Words

**File:** `src/lib/chat/chat-prompts.ts`

**Lines 36-39:**
```
## Voice and tone
- No jargon like "case study", "SEO", or "AI".
```

**Impact:** If contractor uses these terms, agent can't naturally mirror them.

**Implementation Plan:**
```
// BEFORE: Forbidden words
- No jargon like "case study", "SEO", or "AI".

// AFTER: Guidance, not prohibition
- Use the contractor's language. If they say "portfolio" or "project," mirror that.
- Avoid leading with technical terms unless the contractor does.
```

---

### Finding 4.4: Deduplication Rules in Prompt

**File:** `src/lib/agents/story-extractor.ts`

**Lines 169-223:**
```
DEDUPLICATION RULES (CRITICAL):
1. PREFER SPECIFIC over generic - if a specific material is mentioned...
2. NO SUBSTRINGS - if "X installation" is a technique...
3. NO CROSS-CONTAMINATION - items should appear in only ONE list...
```

**Impact:** Telling the model HOW to extract instead of trusting it. Models understand deduplication.

**Implementation Plan:**
```
// BEFORE: Detailed rules
DEDUPLICATION RULES (CRITICAL):
1. PREFER SPECIFIC over generic...

// AFTER: Simple expectation
Extract materials and techniques mentioned. Prefer specific terms over generic ones.
```

---

## Category 5: UI Assumptions

### Finding 5.1: Project Type Formatting Map

**File:** `src/components/chat/hooks/useProjectData.ts`

**Lines 70-93:**
```typescript
const typeMap: Record<string, string> = {
  'chimney-rebuild': 'Chimney Rebuild',
  'chimney-repair': 'Chimney Repair',
  'tuckpointing': 'Tuckpointing',
  // ... all masonry types
};
```

**Impact:** Hardcoded masonry types for display formatting.

**Implementation Plan:**
```typescript
// BEFORE: Hardcoded map
const typeMap: Record<string, string> = {...};

// AFTER: Dynamic formatting
function formatProjectType(slug: string): string {
  // Title case the slug or lookup from trade config
  return slug.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}
```

---

### Finding 5.2: Image Priority Order

**File:** `src/components/chat/hooks/useProjectData.ts`

**Lines 124-140:**
```typescript
const priorityOrder: (string | undefined)[] = [
  'after',
  'detail',
  'progress',
  'before',
  undefined,
];
```

**Impact:** Assumes before/after workflow typical of masonry. Other trades have different patterns.

**Implementation Plan:**
```typescript
// OPTION A: Make configurable per trade
// OPTION B: Let model decide via tool call
// OPTION C: Use more generic ordering (featured, supporting, context)
```

---

### Finding 5.3: Fixed Preview Data Structure

**File:** `src/components/chat/hooks/useProjectData.ts`

**Lines 34-61:** `ProjectPreviewData` interface has hardcoded fields:
- `materials` (string array)
- `techniques` (string array)
- `problem` / `solution` (narrative fields)
- `duration` (time-based)
- `highlight` (singular achievement)

**Impact:** Not all trades fit this structure. Electrical work might need specs, HVAC needs efficiency ratings.

**Implementation Plan:**
```typescript
// OPTION A: Make fields dynamic
interface ProjectPreviewData {
  title: string;
  type: string;
  attributes: Record<string, string | string[]>;  // Flexible key-value
  // ...
}

// OPTION B: Support trade-specific extensions
```

---

### Finding 5.4: Hero Image Grid Layout

**File:** `src/components/chat/LivePortfolioCanvas.tsx`

**Lines 78-150:** Fixed 1+2 image grid (1 large primary, 2 small secondary).

**Impact:** Assumes showcase-style layout. Some trades need equal-weight galleries or process sequences.

**Implementation Plan:**
- Make layout configurable via design tokens
- Let agent choose layout pattern via composition tool
- Support more grid variants

---

### Finding 5.5: Before/After Layout Assumption

**File:** `src/lib/agents/ui-composer.ts`

**Lines 256-284:**
```typescript
const hasBeforeAfter =
  state.images.some((img) => img.imageType === 'before') &&
  state.images.some((img) => img.imageType === 'after');

if (hasBeforeAfter) {
  // before-after block ...
}
```

**Impact:** Assumes before/after is primary pattern. Electrician's "before" is inside a wall.

**Implementation Plan:**
- Check if trade config indicates before/after is relevant
- Make layout selection more intelligent
- Let agent compose layouts based on available content, not assumptions

---

## Category 6: Memory & Context Constraints

### Finding 6.1: KeyFact Type Taxonomy

**File:** `src/lib/chat/memory.ts`

**Lines 27-36:**
```typescript
export interface KeyFact {
  type: 'preference' | 'correction' | 'context' | 'instruction';
  content: string;
  timestamp: string;
  source?: string;
}
```

**Impact:** Only 4 fact types. What if contractor reveals they work on historic homes? Is that "context" or "preference"?

**Implementation Plan:**
```typescript
// BEFORE: Fixed types
type: 'preference' | 'correction' | 'context' | 'instruction';

// AFTER: Open type with suggestions
type: string;  // Let model categorize
// Or remove type entirely - just store facts
```

---

### Finding 6.2: Preferences Schema

**File:** `src/lib/chat/memory.ts`

**Lines 45-49:**
```typescript
preferences: {
  tone?: 'formal' | 'casual' | 'professional';
  focusAreas?: string[];
  avoidTopics?: string[];
};
```

**Impact:** Locked to tone + focus + avoidance. What about "always mention emergency service" or "lead with quality"?

**Implementation Plan:**
```typescript
// BEFORE: Fixed preference structure
preferences: {
  tone?: 'formal' | 'casual' | 'professional';
  focusAreas?: string[];
  avoidTopics?: string[];
};

// AFTER: Flexible preferences
preferences: Record<string, unknown>;  // Store any preference
// Or: preferences: string[];  // Just list of preference statements
```

---

## Implementation Phases

### Phase 1: Quick Wins (1-2 hours)

**Goal:** Remove masonry-specific language without architectural changes.

| File | Change |
|------|--------|
| `src/lib/ai/prompts.ts:24` | "masonry consultant" → "construction consultant" |
| `src/lib/ai/prompts.ts:28-36` | Remove masonry examples |
| `src/lib/ai/prompts.ts:189` | "masonry work" → "project work" |
| `src/lib/agents/content-generator.ts:119` | "masonry project" → "project" |
| `src/lib/chat/tool-schemas.ts:50,62` | Remove masonry examples from descriptions |
| `src/lib/agents/quality-checker.ts:22` | Remove "chimney rebuild, tuckpointing" |

---

### Phase 2: Relax Constraints (2-4 hours)

**Goal:** Remove magic numbers and rigid workflows.

| File | Change |
|------|--------|
| `src/lib/agents/story-extractor.ts:37-47` | Remove or make thresholds configurable |
| `src/lib/agents/story-extractor.ts:722-748` | Simplify `checkReadyForImages()` |
| `src/lib/chat/tool-schemas.ts:91-101` | Simplify `ready_for_images` description |
| `src/lib/chat/tool-schemas.ts:211-218` | Open up quick action types |
| `src/lib/chat/tool-schemas.ts:116` | Open up image categories |
| `src/lib/chat/chat-prompts.ts:41-46` | Convert steps to principles |
| `src/lib/chat/chat-prompts.ts:54-59` | Remove prescriptive tool rules |

---

### Phase 3: Architecture Changes (1 day)

**Goal:** Enable multi-trade support properly.

| File | Change |
|------|--------|
| `src/lib/trades/config.ts` | Make `getTradeConfig()` parameterized |
| `src/lib/trades/config.ts` | Create `GENERIC_CONFIG` |
| `src/lib/data/services.ts` | Make `NATIONAL_SERVICE_TYPES` dynamic |
| `src/lib/agents/orchestrator.ts` | Remove rigid phase machine or make advisory |
| Multiple | Inject trade context at system prompt level |

---

### Phase 4: UI Flexibility (Parallel)

**Goal:** Let agent generate custom layouts.

| File | Change |
|------|--------|
| `src/components/chat/hooks/useProjectData.ts:70-93` | Remove hardcoded typeMap |
| `src/components/chat/hooks/useProjectData.ts:124-140` | Make image priority configurable |
| `src/components/chat/hooks/useCompleteness.ts:34-44` | Make weights trade-configurable |
| `src/components/chat/LivePortfolioCanvas.tsx` | Support more layout variants |

---

## Migration Checklist

### Before Starting
- [ ] Read [agent-philosophy.md](./agent-philosophy.md) to understand principles
- [ ] Review this audit document
- [ ] Identify which phase to start with

### Phase 1 Checklist
- [ ] `src/lib/ai/prompts.ts` - Remove masonry-specific language
- [ ] `src/lib/agents/content-generator.ts` - Parameterize trade
- [ ] `src/lib/chat/tool-schemas.ts` - Generalize descriptions
- [ ] `src/lib/agents/quality-checker.ts` - Remove masonry suggestions
- [ ] Test: Agent should work with generic "construction" framing

### Phase 2 Checklist
- [ ] `src/lib/agents/story-extractor.ts` - Remove magic numbers
- [ ] `src/lib/chat/tool-schemas.ts` - Open up enums
- [ ] `src/lib/chat/chat-prompts.ts` - Convert rules to principles
- [ ] Test: Agent should adapt flow to contractor needs

### Phase 3 Checklist
- [ ] `src/lib/trades/config.ts` - Add trade parameter
- [ ] Create `GENERIC_CONFIG` for fallback
- [ ] Inject trade context at prompt level
- [ ] Test: System should work without masonry config

### Phase 4 Checklist
- [ ] `useProjectData.ts` - Dynamic formatting
- [ ] `useCompleteness.ts` - Configurable weights
- [ ] Layout components - Support more variants
- [ ] Test: UI should handle unknown project types gracefully

---

## Success Criteria

After remediation, the agent should:

1. **Work for any trade** without code changes
2. **Adapt workflow** to contractor preferences
3. **Generate appropriate content** without masonry assumptions
4. **Accept any project structure** that makes sense
5. **Trust model judgment** over hardcoded thresholds

---

## References

- [agent-philosophy.md](./agent-philosophy.md) - Guiding principles
- [universal-portfolio-agents.md](./universal-portfolio-agents.md) - Vision for business-agnostic agents
- `src/lib/design/tokens.ts` - Good example of constrained creativity
- `docs/execution/agentic-ui-implementation.md` - Token-based approach

---

> **Key Principle:** The best agent code is code we delete.

---

## Next Step: Universal Portfolio Vision

The audit above assumes relaxing trade constraints to be "trade-agnostic." But the real vision is bigger:

**Any business that does work worth showing can benefit from a portfolio.**

See [universal-portfolio-agents.md](./universal-portfolio-agents.md) for the full vision:
- Photographers, artists, event planners, artisans
- Agent personas instead of prescribed procedures
- Emergent workflows via agent handoffs
- Schema-free content that adapts to business type
- Quality assessment that's contextual, not checklist-based
