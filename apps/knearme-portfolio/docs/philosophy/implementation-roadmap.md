# Implementation Roadmap: From Legacy to Agentic

> **Goal:** Evolve from masonry-specific MVP to universal agentic portfolio platform

---

## Current State Summary

### What Works (Keep)
- ✅ Core infrastructure (Next.js, Supabase, Vercel)
- ✅ Authentication flow
- ✅ Image upload and storage
- ✅ AI integration (Gemini, Whisper)
- ✅ Chat interface components
- ✅ Preview/canvas system
- ✅ Public portfolio pages
- ✅ SEO infrastructure

### What's Over-Engineered (Fix)
- ❌ Masonry-specific prompts and schemas
- ❌ Rigid phase state machine (orchestrator)
- ❌ Magic number thresholds (8 words, 1 material)
- ❌ Fixed interview questions
- ❌ Trade config hardcoded to masonry
- ❌ Form-based onboarding
- ❌ Prescribed workflows

### What's Missing (Build)
- 🔲 Business discovery tools (DataForSEO)
- 🔲 Conversation-first onboarding
- 🔲 Agent personas and handoff protocol
- 🔲 Flexible data model (JSONB)
- 🔲 Business type inference
- 🔲 Adaptive UI

---

## Implementation Phases

### Phase 0: Foundation (No Breaking Changes)
**Goal:** Set up for agentic development without breaking existing functionality

**Tasks:**
1. ✅ Create philosophy documentation (DONE)
2. ✅ Update CLAUDE.md with vision (DONE)
3. ✅ Document operational excellence strategy (DONE)
4. 🔲 Port DataForSEO client from contractor-review-agent
5. 🔲 Create `src/lib/tools/` directory for agent tools
6. 🔲 Set up feature flags for agentic features
7. 🔲 Implement circuit breaker infrastructure
8. 🔲 Create state transfer utilities (conversation ↔ form)

**Deliverables:**
- DataForSEO client at `src/lib/tools/business-discovery.ts`
- Feature flags at `src/lib/config/feature-flags.ts`
- Circuit breakers at `src/lib/agents/circuit-breaker.ts`
- State transfer at `src/lib/chat/state-transfer.ts`
- No changes to existing user experience

---

### Phase 1: Agentic Onboarding (Parallel Path)
**Goal:** New users can onboard through conversation instead of forms

**Tasks:**
1. 🔲 Create `/onboard` route (conversation-first)
2. 🔲 Build Discovery Agent with business search tool
3. 🔲 Implement business confirmation flow
4. 🔲 Auto-populate profile from confirmed search
5. 🔲 Add "Switch to form" fallback
6. 🔲 A/B test: conversation vs form completion rates

**Data Model Changes:**
```sql
-- Add to contractors table
ALTER TABLE contractors ADD COLUMN
  google_place_id TEXT,
  google_cid TEXT,
  discovered_data JSONB,  -- Raw from DataForSEO
  onboarding_method TEXT; -- 'conversation' | 'form'
```

**Success Criteria:**
- Users can onboard by saying business name
- Profile auto-populated from Google Maps data
- Completion rate >= form-based onboarding
- Time to first portfolio item reduced

---

### Phase 2: Relax Constraints (Incremental)
**Goal:** Remove masonry assumptions and magic numbers

**Tasks:**
1. 🔲 Remove masonry language from prompts (see audit)
2. 🔲 Remove magic number thresholds
3. 🔲 Make phase transitions advisory
4. 🔲 Open up image category enum
5. 🔲 Generalize tool schema descriptions

**Files to Modify:**
- `src/lib/ai/prompts.ts` - Remove masonry language
- `src/lib/agents/story-extractor.ts` - Remove thresholds
- `src/lib/agents/orchestrator.ts` - Make advisory
- `src/lib/chat/tool-schemas.ts` - Generalize
- `src/lib/agents/quality-checker.ts` - Remove suggestions

**Success Criteria:**
- Prompts contain no trade-specific language
- No magic number gates blocking progress
- Agent workflow feels natural, not forced

---

### Phase 3: Business Type Inference
**Goal:** System understands and adapts to business type

**Tasks:**
1. 🔲 Create business type inference from:
   - Google category (from DataForSEO)
   - Conversation context
   - Image analysis
2. 🔲 Store business understanding in JSONB
3. 🔲 Adapt prompts based on business type
4. 🔲 Adapt quality criteria based on business type

**Data Model Changes:**
```sql
-- Evolve contractors table
ALTER TABLE contractors ADD COLUMN
  understanding JSONB;  -- {type, vocabulary, voice, specialties}

-- Example value:
-- {
--   "type": "furniture_maker",
--   "vocabulary": {"work": "pieces", "clients": "customers"},
--   "voice": "warm, personal, craft-focused",
--   "specialties": ["dining tables", "built-ins"]
-- }
```

**Success Criteria:**
- System correctly infers business type 80%+ of time
- Content voice matches business type
- Quality checks adapt to business type

---

### Phase 4: Flexible Portfolio Structure
**Goal:** Portfolio content structure emerges from content, not templates

**Tasks:**
1. 🔲 Create flexible `content` JSONB column
2. 🔲 Migrate existing projects to new structure
3. 🔲 Update Content Agent to generate flexible structure
4. 🔲 Update Layout Agent to handle flexible content
5. 🔲 Update public pages to render flexible content

**Data Model Changes:**
```sql
-- Evolve projects table
ALTER TABLE projects ADD COLUMN
  content_v2 JSONB,  -- Flexible structure
  layout_v2 JSONB;   -- Semantic blocks

-- Deprecate fixed columns (keep for backward compat):
-- materials, techniques, challenge, solution, etc.
```

**Success Criteria:**
- New portfolios use flexible structure
- Existing portfolios continue to work
- Content structure varies by business type

---

### Phase 5: Full Agent Autonomy
**Goal:** Agents collaborate naturally, hand off based on context

**Tasks:**
1. 🔲 Implement agent personas (not procedures)
2. 🔲 Implement handoff protocol
3. 🔲 Remove orchestrator, let agents decide
4. 🔲 Implement cross-session memory
5. 🔲 Implement parallel agent execution

**Success Criteria:**
- Agents initiate handoffs, not orchestrator
- Conversation feels natural, not scripted
- System handles any business type gracefully

---

## MVP Definition: Agentic Onboarding

**The smallest slice that proves the vision:**

1. User goes to `/onboard`
2. Agent asks "What's your business called?"
3. User says "Rocky Mountain Woodworks"
4. Agent searches DataForSEO
5. Agent shows match: "Is this you at 1234 Pine St?"
6. User confirms
7. Profile is created with all data populated
8. Agent asks "Want to show me some of your work?"
9. Continue to portfolio creation (existing flow, but with context)

**What this proves:**
- Conversation > Forms
- Agent + Tools > Prescribed steps
- Discovery > Manual entry

**What this doesn't require:**
- Full data model migration
- Multi-agent handoffs
- Business type inference
- Flexible content structure

---

## Technical Dependencies

### Required for Phase 1
- DataForSEO credentials (already have via contractor-review-agent)
- Feature flag system (can use env vars initially)
- New route at `/onboard`

### Required for Later Phases
- Database migrations (Supabase)
- JSONB query patterns
- Agent memory persistence

---

## Operational Excellence (Cross-Cutting)

These capabilities should be built incrementally alongside the feature phases.

### Testing Strategy

| Phase | Testing Focus |
|-------|---------------|
| Phase 0 | Unit tests for feature flags, circuit breakers |
| Phase 1 | Conversation scenario tests, LLM-as-judge evaluation |
| Phase 2 | Integration tests for handoffs, state persistence |
| Phase 3+ | Regression suite, A/B test metrics collection |

**Key testing patterns:**
- Test behavior patterns, not exact strings
- Use fixtures for LLM response mocking
- Property-based testing for constraints
- LLM-as-judge for quality evaluation (helpfulness, accuracy, voice)

### Observability Strategy

| Component | Purpose |
|-----------|---------|
| Agent Logger | Structured logs with correlation IDs |
| Decision Capture | Store reasoning for debugging |
| State Snapshots | Time-travel debugging |
| Replay System | Reproduce issues from production |

**Key metrics:**
- `agent.latency.p95` - Response time (alert: >5s extractors, >15s generators)
- `agent.error_rate` - Failures per 100 invocations (alert: >5%)
- `agent.confidence.avg` - Quality indicator (alert: <0.6)
- `token.per_session.avg` - Cost tracking (alert: >50k)

### Resilience Strategy

| Mechanism | When Used |
|-----------|-----------|
| Feature Flags | Gate agentic features, A/B testing |
| Circuit Breakers | Auto-disable on error threshold (5 failures) |
| Kill Switch | Emergency manual disable |
| Form Fallback | Always available, preserves state |

**Fallback triggers:**
- Explicit user request ("use the form")
- Error rate > 30% of turns
- Confidence < 50%
- Response timeout > 30s
- Detected frustration signals

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing users | Parallel paths, feature flags |
| DataForSEO costs | Cache results, rate limit searches |
| Agent unpredictability | Fallback to forms, logging, circuit breakers |
| Data migration | Keep old columns, migrate incrementally |
| Quality regression | LLM-as-judge evaluation, regression suite |
| Production debugging | State snapshots, conversation replay |

---

## Success Metrics

### Phase 1 (Onboarding)
- Onboarding completion rate
- Time to profile completion
- User satisfaction (qualitative)

### Phase 2+ (Broader)
- Time to first published portfolio item
- Portfolio completion rate
- Content quality (human review)
- Business type diversity

---

## Timeline Estimate

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 0 | 1-2 days | None |
| Phase 1 | 1 week | Phase 0 |
| Phase 2 | 3-5 days | Phase 1 |
| Phase 3 | 1 week | Phase 2 |
| Phase 4 | 1-2 weeks | Phase 3 |
| Phase 5 | 2+ weeks | Phase 4 |

**MVP (Phases 0+1):** ~1.5 weeks

---

## Next Actions

1. **Port DataForSEO client** from contractor-review-agent
2. **Create feature flag** for agentic onboarding
3. **Build `/onboard` route** with conversation UI
4. **Create Discovery Agent** with search tool
5. **Test with real business names**

---

## References

- [agent-philosophy.md](./agent-philosophy.md) - Why
- [over-engineering-audit.md](./over-engineering-audit.md) - What to fix
- [universal-portfolio-agents.md](./universal-portfolio-agents.md) - Agent design
- [agentic-first-experience.md](./agentic-first-experience.md) - Full UX vision
- [operational-excellence.md](./operational-excellence.md) - Testing, observability, resilience
