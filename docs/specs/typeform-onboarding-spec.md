# Typeform-Style Agentic Onboarding

> **Status:** Draft - Discovery Phase
> **Branch:** `feature/typeform-onboarding`
> **Created:** 2026-01-03

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

| Gap | Description | Priority |
|-----|-------------|----------|
| **Review Mining** | Search finds business but doesn't extract reviews | HIGH |
| **Discovery Reveal** | No "look what we found about you" moment | HIGH |
| **Image Extraction** | Can't pull photos from Google reviews | MEDIUM |
| **Project Drafting** | Can't create draft projects from review content | MEDIUM |
| **Web Search Depth** | Web search agent stubbed (34 lines) | MEDIUM |

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

### Phase 1: Discovery Agent Enhancement
- [ ] Add review extraction to DataForSEO calls (or separate API)
- [ ] Create `showDiscoveryReveal` tool for "what we found" moment
- [ ] Build `DiscoveryRevealArtifact` component (reviews, bio, highlights)

### Phase 2: Project Suggestion
- [ ] Add `suggestProjectFromReview` tool
- [ ] Build `ProjectSuggestionArtifact` component
- [ ] Wire into onboarding flow after business confirmation

### Phase 3: Polish
- [ ] Refine artifact designs
- [ ] Add loading states for background research
- [ ] Test end-to-end flow

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
