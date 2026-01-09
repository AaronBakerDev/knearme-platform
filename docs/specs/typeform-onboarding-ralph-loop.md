# Typeform Onboarding - Ralph Loop Prompt

> **Purpose:** Persistent implementation loop until we have a beautiful, WOW agent onboarding experience
> **Spec:** `docs/specs/typeform-onboarding-spec.md`
> **Branch:** `feature/typeform-onboarding`
> **Completion Promise:** `ONBOARDING WOW COMPLETE`

---

## RALPH LOOP INSTRUCTIONS

**On each iteration:**

1. **Check progress** - Read `.claude/.ralph-progress.json` to see what's done
2. **Identify next task** - Find first incomplete phase/checkpoint
3. **Do the work** - Implement, test, verify
4. **Update progress** - Write to `.claude/.ralph-progress.json`
5. **Check if done** - If ALL checkpoints pass, output completion promise

**Completion signal:**
When ALL phases complete and manual QA criteria met, output:
```
<promise>ONBOARDING WOW COMPLETE</promise>
```

**Progress tracking file:** `.claude/.ralph-progress.json`
```json
{
  "phase": 1,
  "checkpoints": {
    "phase1_tool_correctness_tests": false,
    "phase1_hallucination_fixed": false,
    "phase1_profile_saves": false,
    "phase2_review_extraction_tests": false,
    "phase2_reviews_in_state": false,
    "phase3_web_search_works": false,
    "phase4_bio_synthesis_quality": false,
    "phase5_reveal_artifact_built": false,
    "phase5_wow_confirmed": false,
    "phase6_project_suggestions_work": false,
    "phase7_e2e_passes": false,
    "phase7_manual_qa_approved": false
  },
  "lastIteration": "2026-01-08T22:00:00Z",
  "notes": ""
}
```

---

## Mission

Build and iterate on the Discovery Agent onboarding experience until it delivers a genuine "wow" moment. Do not stop until:

1. The agent reliably saves profiles (no hallucination)
2. Reviews are extracted and displayed
3. Bio is synthesized from reviews + web content
4. Reveal artifact creates excitement
5. All tests pass
6. Manual QA confirms delight

---

## Success Criteria (Definition of Done)

### Functional Requirements

- [ ] User enters business name → agent finds it via DataForSEO
- [ ] User confirms business → agent calls `confirmBusiness` AND `saveProfile`
- [ ] Profile is persisted to database with all fields
- [ ] Reviews are extracted and stored
- [ ] Bio is generated blending reviews + web content
- [ ] Reveal artifact displays: profile summary, rating, bio, review highlights
- [ ] Project suggestions shown IF photo-reviews or web portfolio exists
- [ ] Clear CTA to dashboard or first project

### Quality Bar

- [ ] Conversation feels natural, not robotic
- [ ] Bio reads like a human wrote it
- [ ] Reveal creates genuine excitement ("They know my business!")
- [ ] No dead ends or confusing states
- [ ] Graceful handling of edge cases (no results, sparse data)

### Test Coverage

- [ ] Unit tests for state management functions
- [ ] Tool correctness tests (deterministic)
- [ ] Integration tests with mocked AI
- [ ] E2E test for happy path
- [ ] Golden output fixtures for bio quality

---

## Implementation Loop

### Phase 1: Fix Foundation (TDD)

**Goal:** Agent actually saves when it says it does

**Steps:**
1. Read current implementation:
   - `src/lib/agents/discovery.ts`
   - `src/app/api/onboarding/route.ts`
   - `src/lib/agents/index.ts`

2. Write failing test:
   ```
   tests/agents/discovery-tool-correctness.test.ts
   - Test: "after confirmation, saveProfile MUST be called"
   - Test: "state is complete after saveProfile"
   - Test: "guardrail triggers after N turns with incomplete state"
   ```

3. Fix implementation:
   - Update system prompt with explicit tool requirements
   - Add guardrail logic for N-turn threshold
   - Ensure state extraction works correctly

4. Run tests until green

5. Manual test: Go through onboarding, verify profile saves

**Checkpoint:** Can complete onboarding and see profile in database? If no, loop. If yes, continue.

---

### Phase 2: Review Extraction (TDD)

**Goal:** Get reviews from DataForSEO and store them

**Steps:**
1. Read DataForSEO client:
   - `src/lib/tools/business-discovery/client.ts`
   - Check what data is already being returned

2. Write failing test:
   ```
   tests/tools/dataforseo-review-extraction.test.ts
   - Test: "extracts review text from DataForSEO response"
   - Test: "handles response with no reviews"
   - Test: "identifies reviews with photos"
   ```

3. Create mock fixtures:
   ```
   tests/fixtures/dataforseo-business-with-reviews.json
   tests/fixtures/dataforseo-business-no-reviews.json
   ```

4. Implement review extraction

5. Run tests until green

6. Manual test: Onboard a real business, verify reviews appear in state

**Checkpoint:** Reviews extracted and visible in conversation state? If no, loop. If yes, continue.

---

### Phase 3: Web Search Enhancement

**Goal:** Get website content for bio synthesis

**Steps:**
1. Read current web search implementation:
   - `src/lib/agents/subagents/` (find web search agent)
   - Check if it's stubbed or functional

2. If stubbed, implement:
   - Search for business website
   - Extract about page content
   - Extract service descriptions
   - Find portfolio/past work pages

3. Write tests:
   ```
   tests/tools/web-search-extraction.test.ts
   - Test: "extracts about page content"
   - Test: "finds portfolio pages"
   - Test: "handles no website gracefully"
   ```

4. Run tests until green

**Checkpoint:** Web content available for bio synthesis? If no, loop. If yes, continue.

---

### Phase 4: Bio Synthesis

**Goal:** Generate quality bio from reviews + web content

**Steps:**
1. Design bio synthesis prompt:
   - Input: reviews array, web content, business info
   - Output: 2-3 paragraph bio
   - Style: blend customer voice + business positioning

2. Create golden inputs:
   ```
   tests/fixtures/bio-synthesis-input-rich.json (many reviews, full website)
   tests/fixtures/bio-synthesis-input-sparse.json (few reviews, minimal web)
   tests/fixtures/bio-synthesis-input-reviews-only.json
   tests/fixtures/bio-synthesis-input-web-only.json
   ```

3. Implement bio synthesis function

4. Generate outputs, manually review quality

5. Save good outputs as golden fixtures

6. Set up LLM-judge eval script:
   ```
   scripts/eval-bio-quality.ts
   - Rubric: accuracy, voice blend, professionalism, specificity
   - Score 1-5 on each dimension
   - Flag if any dimension < 3
   ```

7. Iterate until bio quality consistently scores 4+ on all dimensions

**Checkpoint:** Bio reads naturally and represents business well? If no, loop. If yes, continue.

---

### Phase 5: Reveal Artifact

**Goal:** Build the "wow" moment UI

**Steps:**
1. Design artifact component:
   ```
   src/components/chat/artifacts/DiscoveryRevealArtifact.tsx
   ```

   Contents:
   - Business card (name, address, rating)
   - Generated bio
   - Review highlights (2-3 best quotes)
   - Project suggestions (if applicable)
   - CTA buttons

2. Create with mock data first, iterate on design

3. Add snapshot tests

4. Create `showDiscoveryReveal` tool:
   - Add to discovery tools
   - Add to tool executor
   - Wire up artifact rendering

5. Integrate into onboarding flow:
   - Called after `saveProfile`
   - Replaces the "good luck" ending

6. Manual test: Go through full onboarding, evaluate reveal impact

**Checkpoint:** Does the reveal create a "wow" moment? Show to someone unfamiliar - do they react positively? If no, loop. If yes, continue.

---

### Phase 6: Project Suggestions

**Goal:** Suggest projects from reviews or web portfolio

**Steps:**
1. Implement project suggestion logic:
   ```
   src/lib/agents/project-suggestions.ts
   - Filter reviews for those with photos
   - Parse web portfolio for project mentions
   - Generate draft project from content
   ```

2. Write tests:
   ```
   tests/agents/project-suggestions.test.ts
   - Test: "only suggests from reviews with photos"
   - Test: "falls back to web portfolio"
   - Test: "returns empty if no sources"
   ```

3. Build suggestion UI in reveal artifact:
   - "We found projects in your reviews!" OR
   - "We found work on your website!" OR
   - (nothing if no sources)

4. Add accept/skip flow

5. Run tests until green

**Checkpoint:** Project suggestions appear when appropriate and look good? If no, loop. If yes, continue.

---

### Phase 7: E2E & Polish

**Goal:** Full flow works beautifully end-to-end

**Steps:**
1. Write Playwright E2E test:
   ```
   tests/e2e/onboarding-happy-path.spec.ts
   - Sign up new user
   - Enter business name
   - Select from results
   - Confirm business
   - Verify reveal artifact appears
   - Verify profile saved
   - Navigate to dashboard
   ```

2. Run E2E test, fix any failures

3. Add edge case E2E tests:
   - Business not found
   - No reviews
   - Multiple locations

4. Polish pass:
   - Loading states
   - Error handling
   - Animations/transitions
   - Mobile responsiveness

5. Manual QA checklist:
   - [ ] Flow feels smooth
   - [ ] No jarring transitions
   - [ ] Copy is engaging
   - [ ] Reveal is exciting
   - [ ] CTAs are clear
   - [ ] Works on mobile

**Checkpoint:** Would you be proud to show this to a customer? If no, loop. If yes, DONE.

---

## Loop Control

After each phase checkpoint:

```
IF checkpoint passed:
  → Continue to next phase
ELSE:
  → Identify what's broken
  → Fix it
  → Re-run checkpoint
  → Loop until passed
```

After all phases complete:

```
IF all checkpoints passed AND manual QA approved:
  → Create PR
  → Document what was built
  → STOP
ELSE:
  → Identify gaps
  → Return to relevant phase
  → Loop
```

---

## Key Files to Reference

**Spec:**
- `docs/specs/typeform-onboarding-spec.md`

**Current Implementation:**
- `src/lib/agents/discovery.ts` - Discovery Agent
- `src/app/api/onboarding/route.ts` - Onboarding API
- `src/components/onboarding/OnboardingChat.tsx` - Chat UI
- `src/components/chat/artifacts/BusinessSearchResultsArtifact.tsx` - Existing artifact
- `src/lib/tools/business-discovery/client.ts` - DataForSEO client
- `src/lib/chat/tool-schemas.ts` - Tool definitions
- `src/lib/chat/tool-executors.ts` - Tool execution

**Tests (to create):**
- `tests/agents/discovery-tool-correctness.test.ts`
- `tests/tools/dataforseo-review-extraction.test.ts`
- `tests/tools/web-search-extraction.test.ts`
- `tests/agents/project-suggestions.test.ts`
- `tests/e2e/onboarding-happy-path.spec.ts`

---

## Reminders

- **TDD for deterministic logic** - write test first, then implement
- **Golden outputs for AI** - record good outputs, use as regression baseline
- **Manual QA matters** - automated tests catch bugs, humans catch "meh"
- **Ship when WOW** - don't stop at "works", stop at "delightful"

---

## Start Command

**Use the Ralph prompt file:**

```bash
/ralph-loop "Read and follow docs/specs/RALPH-PROMPT.md" --completion-promise "ONBOARDING WOW COMPLETE" --max-iterations 50
```

**Files:**
- `docs/specs/RALPH-PROMPT.md` - Concise loop prompt (use this)
- `docs/specs/typeform-onboarding-ralph-loop.md` - Detailed implementation guide (this file)
- `docs/specs/typeform-onboarding-spec.md` - Full spec with decisions

---

## First Iteration Bootstrap

If `.claude/.ralph-progress.json` doesn't exist, create it:

```json
{
  "phase": 1,
  "checkpoints": {
    "phase1_tool_correctness_tests": false,
    "phase1_hallucination_fixed": false,
    "phase1_profile_saves": false,
    "phase2_review_extraction_tests": false,
    "phase2_reviews_in_state": false,
    "phase3_web_search_works": false,
    "phase4_bio_synthesis_quality": false,
    "phase5_reveal_artifact_built": false,
    "phase5_wow_confirmed": false,
    "phase6_project_suggestions_work": false,
    "phase7_e2e_passes": false,
    "phase7_manual_qa_approved": false
  },
  "lastIteration": "",
  "notes": "Starting fresh"
}
```

Then begin Phase 1: Fix Foundation.
