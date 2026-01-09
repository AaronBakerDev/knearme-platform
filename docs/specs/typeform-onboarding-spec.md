# Typeform-Style Agentic Onboarding

> **Status:** Draft - Decisions Made, Ready for Implementation
> **Branch:** `feature/typeform-onboarding`
> **Created:** 2026-01-03
> **Updated:** 2026-01-08

## Vision

A progressive disclosure form interface that **looks like a Typeform** but is powered by **agentic research** behind the scenes. The user experiences a smooth, guided questionnaire while AI agents work in parallel to research and enrich the contractor's profile.

---

## Core Concept

### The Problem with Chat Interface
- Chat can feel open-ended and overwhelming
- Users may not know what to say or ask
- Less structured = harder to ensure we collect everything needed
- May feel less "professional" for business onboarding

### The Typeform Approach
- One question at a time (focused attention)
- Progressive disclosure (don't overwhelm)
- Feels like a polished application/form
- Clear progress indication
- Keyboard-driven (Enter to continue)

### The Agentic Twist
- **Looks like a form, acts like an agent**
- When user identifies their company → agent searches and confirms
- Background research happens while user continues answering
- Dynamic questions based on what agents discover
- Results presented as "here's what we found about you"

---

## User Journey (Draft)

### Phase 1: Company Discovery
1. "What's your company name?"
2. Agent searches (DataforSEO / web search)
3. "Is this you?" → Shows business card with address, phone, etc.
4. User confirms → Triggers deep research

### Phase 2: Parallel Collection + Research
**Foreground (User-facing):**
- Continue collecting info via form questions
- Service types, years in business, etc.

**Background (Agent research):**
- Website analysis (what do they do, their messaging)
- Review mining (what customers say about them)
- Image gathering from web presence
- Bio/about content extraction
- Social media presence

### Phase 3: Research Reveal
- "Here's what we found about you"
- Show reviews, suggested bio, discovered images
- "People are saying great things about you..."
- Let them approve/edit what we found

### Phase 4: Value Proposition
- Explain what we'll build for them
- Portfolio/hub for showcasing projects
- Google indexable (no ranking promises)
- Something in addition to their website
- Project interview process explanation

### Phase 5: Project Collection
- Interview for specific projects
- This may still be chat-like?
- Or structured project form?

---

## Open Questions

### UX/Interface
1. Where does chat fit in, if at all?
2. How do we show "agent is researching" state?
3. How dynamic should questions be based on research?
4. What's the transition from form → project interviews?

### Agent Architecture
1. What's the current agent system?
2. How do research agents coordinate?
3. What APIs do we have access to? (DataforSEO, web search, etc.)
4. How do we store/surface research results?

### Business Logic
1. What's the minimum info needed before research starts?
2. What if we can't find them? (New business, no web presence)
3. How do we handle multiple business matches?
4. What's the approval flow for discovered content?

### Technical
1. How does this integrate with existing onboarding?
2. Database schema changes needed?
3. Real-time updates as research completes?

---

## Interview Notes

> *Captured during discovery session*

### Session 1 - 2026-01-03

**Topic: Core Vision & Known Issues**

**Cost Optimization:**
- DataForSEO vs web search — use whatever is cheaper for business lookup
- DataForSEO for business profile data (reviews, details)
- Web search for website content, supporting links, multiple locations

**Known Bug: "Agent Reset"**
- After finding a business, agent falls back to weird/broken messaging
- Breaks the conversational flow

**Root Cause Analysis (from code audit):**
1. **Two implementations exist:** `runDiscoveryAgent()` in discovery.ts has retry logic, but `route.ts` uses `streamText()` directly - the retry logic never runs
2. **Empty response handling:** When tool calls produce no text, assistant message is skipped (route.ts:522). Next turn sees incomplete history
3. **Generic retry prompt:** discovery.ts:565-570 says "ask the next most useful question" - too vague, causes off-topic responses
4. **State context not emphasized:** Model gets state but not "here's what just happened"

**Fix Approach:**
- Ensure every tool call produces a response (either from model or fallback)
- Add "what just happened" context to system prompt
- Wire up `runDiscoveryAgent()` properly OR add resilience to route.ts

**Resilience Requirement:**
- Account Manager must continue conversation if subagent fails
- Don't let tool failures break the experience
- Graceful degradation: "We couldn't find everything, but let's continue..."

**Handoff UX Pattern:**
- Subagent results should feel like team updates, not tool responses
- Example: "Hey, the team just got back with what they found about your company..."
- Account Manager is the face; subagents are the "team" working behind the scenes

**Research Agent Scope:**
- DataForSEO: Business profiles, reviews, ratings, photos
- Web Search: Website content, about pages, service descriptions, multiple locations
- Both are "research" tools, different data sources

### Session 2 - 2026-01-03 (Post Empty Response Fix)

**What worked well:**
- Empty response fix worked - no more "reset" behavior
- Multiple locations handled gracefully (asked user to pick)
- Services extracted from Google listing (custom homes, additions, major renovations)
- Agent asked clarifying questions naturally

**What's still missing:**
- NO REVEAL after profile completion
- Just ends with "good luck with the next project!"
- No summary of what was gathered
- No excitement about the business
- No transition to "here's what we can do for you"

**The gap visualized:**
```
CURRENT FLOW:
┌─────────────────────────────────────────┐
│ Collect info → Save profile → "Good luck!" │
└─────────────────────────────────────────┘

DESIRED FLOW:
┌─────────────────────────────────────────────────────────────┐
│ Collect info → Save profile → REVEAL ARTIFACT → Next steps │
│                               ↓                             │
│                    "Here's your business!"                  │
│                    • Name, address, services                │
│                    • Rating: 4.8 ⭐ (if available)          │
│                    • "You do serious work!"                 │
│                    • [Create Your First Project] CTA        │
└─────────────────────────────────────────────────────────────┘
```

### Session 3 - 2026-01-08 (Spec Review & Decisions)

**Topic: Reveal Artifact Contents**

Essential for MVP:
- **Reviews** - Actual snippets from customers
- **Bio** - Synthesized from BOTH reviews AND web results (not just regurgitating reviews)

Later phase:
- **Photos** - Images from Google listing

**Topic: Bio Generation Approach**

The agent should blend:
- What customers say (reviews) → credibility, social proof
- What the business says about itself (website) → their own voice, services, positioning

This creates a more comprehensive bio than either source alone.

**Topic: Agent Hallucination Bug**

Observed issue: Agent says "we're all set!" but never calls `saveProfile`. State shows incomplete but conversation claims completion.

**Fix approach: BOTH prompt engineering AND guardrails**
1. Prompt engineering: Make system prompt explicit - "You MUST call saveProfile before saying completion phrases"
2. Guardrails: After N turns, if state is incomplete, force a "let me save what we have" flow

**Topic: Project Suggestions**

When to suggest projects:
1. **Primary**: Only from reviews that have photos attached
2. **Fallback**: Find project opportunities from web results (portfolio pages, past work)
3. **If nothing found**: No project suggestion, but profile description should be solid

Timing: During the onboarding reveal (not after, not in dashboard)

**Topic: Profile Customization (Future Phase)**

Vision: "Lovable for profiles" - AI generates custom profile design based on business understanding

Approach: **AI Configurator** (not full generative UI)
```
┌─────────────────────────────────────────────────────────────┐
│  DESIGN SYSTEM (we control)                                 │
│  • 3-4 base layouts (hero styles, grid options)             │
│  • Color palette tokens (warm, cool, bold, muted)           │
│  • Typography pairings (traditional, modern, friendly)      │
│  • Component variants (card styles, section treatments)     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  AI CONFIGURATOR (agent decides)                            │
│  Based on understanding:                                    │
│  • "Historic restoration, family business, premium"         │
│  → Selects: traditional typography, warm palette,           │
│    heritage layout, testimonial-forward sections            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  OUTPUT: Custom-feeling profile that always looks good      │
└─────────────────────────────────────────────────────────────┘
```

**Decision:** This is Phase 2. Nail the reveal + project flow first, then level up profile styling.

---

## Architecture Audit Findings (2026-01-03)

### What Already Exists

**Discovery Agent** (`src/lib/agents/discovery.ts`) - COMPLETE
- Full persona with system prompt
- Tools: `showBusinessSearchResults`, `webSearchBusiness`, `confirmBusiness`, `saveProfile`
- DataForSEO integration for business lookup
- Web search fallback
- Conversation persistence

**Business Discovery Flow** - WORKING
```
User: "My company is ABC Masonry"
  → Agent calls showBusinessSearchResults (DataForSEO)
  → Returns business cards with name, address, phone, website
  → User confirms selection
  → Agent calls confirmBusiness → saveProfile
  → Profile auto-populated → redirect to dashboard
```

**Artifact System** - COMPLETE
- `BusinessSearchResultsArtifact.tsx` - Renders search results as cards
- Rich card/preview patterns used throughout app
- Ready to extend with new artifact types

### What's Missing (The Real Gaps)

| Gap | Description | Priority | Phase |
|-----|-------------|----------|-------|
| **Agent Hallucination Fix** | Model says "done" without calling `saveProfile` | CRITICAL | 1 |
| **Review Mining** | Search finds business but doesn't extract reviews | HIGH | 1 |
| **Bio Synthesis** | No blending of reviews + web content into bio | HIGH | 1 |
| **Discovery Reveal** | No "look what we found about you" moment | HIGH | 1 |
| **Web Search Depth** | Web search agent stubbed (34 lines) | HIGH | 1 |
| **Project Drafting** | Can't create draft projects from review content | MEDIUM | 1 |
| **Image Extraction** | Can't pull photos from Google reviews | LOW | 3 |
| **AI Profile Config** | No custom profile styling based on understanding | LOW | 2 |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CURRENT STATE                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User Input ─→ Discovery Agent ─→ DataForSEO Search        │
│                      │                   │                  │
│                      │                   ▼                  │
│                      │         Business Cards (artifact)    │
│                      │                   │                  │
│                      │                   ▼                  │
│                      │         User Confirms Selection      │
│                      │                   │                  │
│                      ▼                   ▼                  │
│              Save Profile ←──── Auto-populate fields        │
│                      │                                      │
│                      ▼                                      │
│              Redirect to Dashboard                          │
│                                                             │
│  ❌ NO REVIEW MINING                                        │
│  ❌ NO "DELIGHT" REVEAL                                     │
│  ❌ NO PROJECT DRAFTING                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Revised Scope: Agent Enhancement (Not Interface Rebuild)

**Key Insight:** Don't rebuild the interface. Enhance the agent's capabilities.

---

### Phase 1: Reveal MVP (Current Focus)

**Goal:** The "wow" moment after profile completion

**Agent Fixes:**
- [ ] Fix hallucination bug: Prompt engineering + guardrails to ensure `saveProfile` is called
- [ ] Add review extraction to DataForSEO calls
- [ ] Add web search for website content (about pages, service descriptions)
- [ ] Create `showDiscoveryReveal` tool

**Bio Generation:**
- [ ] Synthesize bio from BOTH reviews AND web results
- [ ] Agent blends customer voice + business voice

**Reveal Artifact:**
- [ ] Build `DiscoveryRevealArtifact` component
- [ ] Display: Profile summary, rating, synthesized bio, review highlights
- [ ] Project suggestions (conditional - see below)

**Project Suggestions (in Reveal):**
- [ ] If reviews have photos → suggest projects from those reviews
- [ ] Else if web portfolio exists → suggest projects from website
- [ ] Else → no project suggestions, but bio is solid

**Flow:**
```
Onboarding Complete
       ↓
   REVEAL ARTIFACT
   ├── Profile summary (name, rating, services)
   ├── Bio (synthesized from reviews + website)
   ├── Review highlights (2-3 best quotes)
   │
   └── Project Suggestions (conditional)
       ├── IF photo-reviews exist → "We found projects in your reviews!"
       ├── ELSE IF web portfolio → "We found work on your website!"
       └── ELSE → No projects, profile is ready

       ↓
   [Go to Dashboard] or [Create First Project]
```

---

### Phase 2: AI-Configured Profiles (Future)

**Goal:** "Lovable for profiles" - custom design based on business understanding

**Prerequisites:**
- Phase 1 complete and stable
- Design system with configurable tokens built

**Work:**
- [ ] Build design system (layouts, palettes, typography, components)
- [ ] Create AI configurator that maps `understanding` → design choices
- [ ] Profile generation that always looks good

---

### Phase 3: Photo Extraction (Future)

**Goal:** Pull project photos from Google reviews

**Work:**
- [ ] Investigate DataForSEO photo capabilities
- [ ] Add photo extraction to reveal artifact
- [ ] Auto-attach photos to suggested projects

---

## Testing Strategy

### Unit Tests

**Tool Functions:**
- `processDiscoveryToolCalls()` - verify state updates correctly
- Bio synthesis logic - mock reviews + web content, verify blended output
- Project suggestion filtering - verify photo-review detection

**State Management:**
- `isDiscoveryComplete()` - test edge cases (partial data, missing fields)
- `getMissingDiscoveryFields()` - verify accurate missing field detection
- Guardrail trigger logic - verify N-turn threshold behavior

### Integration Tests

**API Route (`/api/onboarding`):**
- Mock Supabase + AI provider
- Verify tool calls update conversation state
- Verify `saveProfile` persists to database
- Test hallucination guardrail: incomplete state after N turns → forced save

**DataForSEO Integration:**
- Mock DataForSEO responses (with reviews, without reviews, no results)
- Verify review extraction parses correctly
- Verify graceful handling of API errors

### E2E Tests (Playwright)

**Happy Path:**
```
1. New user signs up
2. Enters business name
3. Selects from search results
4. Confirms business
5. Reveal artifact displays with bio + reviews
6. Project suggestion shown (if applicable)
7. Clicks "Go to Dashboard"
8. Verify profile saved correctly
```

**Edge Cases:**
- Business not found → manual entry flow
- No reviews available → bio from web only
- No web presence → minimal profile, no suggestions
- Agent hallucination → guardrail forces save

### Mock Fixtures

Create fixtures for:
- `fixtures/dataforseo-business-with-reviews.json`
- `fixtures/dataforseo-business-no-reviews.json`
- `fixtures/dataforseo-no-results.json`
- `fixtures/web-search-portfolio-page.json`
- `fixtures/web-search-about-page.json`

### CI Integration

- Unit + integration tests run on every PR
- E2E tests run on merge to main
- Manual QA checklist for reveal artifact UX

---

## Agent Evaluation (LLM-as-a-Judge + Deterministic)

> Research: [DeepEval Agent Evaluation](https://deepeval.com/guides/guides-ai-agent-evaluation), [LLM-as-a-Judge Best Practices](https://www.confident-ai.com/blog/why-llm-as-a-judge-is-the-best-llm-evaluation-method)

### Two-Layer Evaluation Approach

Agents have two layers that need different evaluation methods:

| Layer | What to Test | Method | Tools |
|-------|--------------|--------|-------|
| **Action Layer** | Tool selection, parameter correctness, execution | Deterministic | DeepEval `ToolCorrectnessMetric` |
| **Reasoning Layer** | Decision quality, conversation flow, output quality | LLM-as-Judge | Custom rubrics |

### 1. Deterministic Tool Evaluation

**Tool Correctness** - Did the agent call the right tools?

```typescript
// Test case: User confirms business → agent should save
const testCase = {
  input: "Yes, that's my business - Fix My Brick at 498 Glancaster Rd",
  toolsCalled: ["confirmBusiness"],  // What agent actually did
  expectedTools: ["confirmBusiness", "saveProfile"],  // What it should do
  score: 0.5  // Missing saveProfile = hallucination bug detected!
}
```

**Metrics:**
- `toolSelectionAccuracy` = correct tools / expected tools
- `argumentCorrectness` = correct params / total params
- `executionSuccess` = successful calls / total calls

### 2. LLM-as-Judge Evaluation

**Bio Quality Rubric:**
```
Score 1-5 on:
- Accuracy: Does the bio accurately represent the business?
- Voice blend: Does it combine customer praise with business positioning?
- Professionalism: Is it polished and suitable for a portfolio?
- Specificity: Does it mention specific services/strengths?
```

**Conversation Quality Rubric:**
```
Score 1-5 on:
- Natural flow: Did the agent ask appropriate follow-ups?
- Information gathering: Did it collect all required fields?
- Tone: Was it friendly and professional?
- Recovery: Did it handle unclear inputs gracefully?
```

**Reveal Delight Rubric:**
```
Score 1-5 on:
- Impact: Does the reveal create a "wow" moment?
- Completeness: Are all discovered elements presented?
- Accuracy: Is the information correct?
- Call-to-action: Is the next step clear?
```

### 3. Evaluation Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│  EVAL PIPELINE                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Run agent on test scenario (recorded conversation)      │
│                    ↓                                        │
│  2. Extract tool calls from trace                           │
│                    ↓                                        │
│  3. DETERMINISTIC: Score tool correctness                   │
│     - Expected tools called? ✓/✗                            │
│     - Correct parameters? ✓/✗                               │
│     - State updated correctly? ✓/✗                          │
│                    ↓                                        │
│  4. LLM-JUDGE: Score quality metrics                        │
│     - Bio quality (1-5)                                     │
│     - Conversation flow (1-5)                               │
│     - Reveal impact (1-5)                                   │
│                    ↓                                        │
│  5. Aggregate scores + flag regressions                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4. Test Scenarios (Golden Dataset)

Create recorded conversations for evaluation:

| Scenario | Input | Expected Behavior |
|----------|-------|-------------------|
| **Happy path** | Real business with reviews | Find → Confirm → Save → Reveal with bio + reviews |
| **No results** | Fake business name | Graceful fallback to manual entry |
| **Multiple locations** | Chain business | Ask user to select location |
| **Sparse reviews** | Business with 1-2 reviews | Bio from web content primarily |
| **No web presence** | New business | Minimal profile, no project suggestions |
| **Hallucination test** | Business confirmed | MUST call saveProfile (regression test) |

### 5. Implementation Options

**Option A: DeepEval (Python)**
- Purpose-built for agent evaluation
- `ToolCorrectnessMetric` + `LLMJudgeMetric`
- Requires Python test harness calling our API

**Option B: Custom TypeScript Evaluator**
- Build evaluation into our test suite
- Use Gemini/GPT-4 as judge via API
- More control, less setup

**Option C: Hybrid**
- Deterministic checks in TypeScript (tool correctness)
- LLM-judge via separate Python script or API call
- Best of both worlds

### 6. CI Integration

```yaml
# On PR
- Run deterministic tool tests (fast, blocking)
- Run 3 critical path evals (medium, blocking)

# Nightly
- Run full evaluation suite (20+ scenarios)
- Generate quality report
- Alert on regressions
```

### 7. Human Spot-Checks

Even with automated evals, include:
- Weekly review of 5 random real conversations
- Compare LLM-judge scores to human assessment
- Calibrate rubrics based on disagreements

---

## Success Metrics

- Onboarding completion rate (baseline TBD)
- Time from start to first "wow" moment
- Accuracy of discovered data
- User engagement with suggested content (accept/edit/reject)

---

## Technical Requirements

### APIs Available
- **DataForSEO** - Already integrated for business search
- **DataForSEO Reviews API** - Need to investigate if included in plan
- ~~Google Places API~~ - NOT AVAILABLE
- **Web search** - For website content, about pages, supporting links

### New Components
- `DiscoveryRevealArtifact.tsx` - Rich display of discovered info
- `ProjectSuggestionArtifact.tsx` - Draft project from review
- `ReviewHighlightCard.tsx` - Individual review display

### Agent Changes
- Extend Discovery Agent with new tools
- Add review mining capability
- Add project suggestion logic

---

## References

### Current Implementation
- Discovery Agent: `src/lib/agents/discovery.ts`
- Onboarding Chat: `src/components/onboarding/OnboardingChat.tsx`
- Business Search Artifact: `src/components/chat/artifacts/BusinessSearchResultsArtifact.tsx`
- Tool Schemas: `src/lib/chat/tool-schemas.ts`
- DataForSEO Client: `src/lib/tools/business-discovery/client.ts`

### Agent Architecture
- Orchestrator: `src/lib/agents/orchestrator.ts`
- Subagents: `src/lib/agents/subagents/`
- Tool Executors: `src/lib/chat/tool-executors.ts`
