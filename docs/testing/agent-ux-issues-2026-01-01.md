# Agent UX Testing Report - 2026-01-01

## Testing Scenario
End-to-end testing of the chat agent for creating portfolio projects.

**Test Case**: Chimney rebuild project in Boulder, Colorado with detailed materials and techniques.

---

## Critical Bugs (Blocking)

### 1. Content Generation Fails with "No project found"
**Severity**: CRITICAL (blocks core functionality)
**Status**: ✅ FIXED
**Location**: `src/lib/chat/tools-runtime.ts:335-344`

**Symptoms**:
- User asks agent to generate content
- Agent attempts `generatePortfolioContent` tool
- Returns error: "No project found. Please start by telling me about your project."
- Retries multiple times, all fail
- Preview panel shows project data exists

**Root Cause Analysis**:
~~- `loadProjectState(toolContext.projectId)` returns null~~
~~- Either `projectId` not being passed in request body, or DB query failing~~
~~- Race condition possible in `sendMessageWithContext` (line 1381-1393)~~

**ACTUAL Root Cause** (identified 2026-01-01):
- Supabase PostgREST error (PGRST201): "Could not embed because more than one relationship was found for 'projects' and 'project_images'"
- The `projects` table has TWO foreign key relationships to `project_images`:
  1. `project_images_project_id_fkey` (one-to-many: project has many images)
  2. `projects_hero_image_fk` (many-to-one: project.hero_image_id references project_images)
- PostgREST couldn't determine which relationship to use for the embedded join
- The query failed silently, returning null, which triggered the "No project found" error message

**Fix Applied**:
Changed the query in `src/lib/chat/tools-runtime.ts` from:
```typescript
project_images (...)
```
to:
```typescript
project_images!project_images_project_id_fkey (...)
```
This explicitly specifies which FK relationship to use for the join.

**Files**:
- `src/lib/chat/tools-runtime.ts:91-131` - loadProjectState function (FIXED)

---

### 2. Content Generation Retry Loop (Token Burn)
**Severity**: CRITICAL (burns tokens, 100+ second requests)
**Status**: ✅ FIXED
**Location**: `src/lib/chat/tools-runtime.ts:343-356`

**Symptoms**:
- User asks agent to generate content
- Rate limit error triggers (429)
- AI model retries `generatePortfolioContent` up to 10 times
- Single request takes 100+ seconds
- Logs show repeated "AI service is busy" errors

**Root Cause**:
- When rate limited, `generatePortfolioContent` returned `{ success: false, error: "..." }`
- AI model interpreted `success: false` as "tool failed, try again"
- The `retryable: true` flag from content-generator.ts was informational only
- AI model has no concept of "retryable" - it just sees failure and retries
- Even `success: true` with empty content caused retries
- Tool description instructions were ignored by AI model

**Fix Applied**:
Added per-request executor-level blocking using closure state. The AI model cannot bypass code:
```typescript
let contentGenerationAttempted = false;

generatePortfolioContent: async () => {
  // Block retries at executor level - AI model cannot bypass this
  if (contentGenerationAttempted) {
    return {
      success: false,
      error: 'Content generation already attempted in this request. Ask the user to try again.',
    };
  }
  contentGenerationAttempted = true;
  // ... proceed with generation
}
```

Also applied:
- Reduced `stepCountIs` from 10 to 5 as safety net
- Added explicit "do not retry" instructions to tool description
- Same blocking applied to `composePortfolioLayout`

**Files**:
- `src/lib/chat/tools-runtime.ts:312-356` - Per-request blocking via closure
- `src/app/api/chat/route.ts:476` - Reduced step count to 5

---

### 3. Chat Scroll Jumping During Tool Calls
**Severity**: HIGH (janky UX)
**Status**: ✅ FIXED
**Location**: `src/components/chat/ChatMessages.tsx:280-290`

**Symptoms**:
- During retry loop (or any rapid message stream), chat scrolls erratically
- User sees page "jumping" and loses scroll position
- 20+ scroll events fire in rapid succession

**Root Cause**:
- Each new message triggers `scrollToBottom()` immediately
- During retry loops, 20+ messages added rapidly (10 tool calls + 10 results)
- No debouncing on scroll events

**Fix Applied**:
Added 50ms debounce to scroll logic:
```typescript
const scrollDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// In the scroll effect:
if (scrollDebounceRef.current) {
  clearTimeout(scrollDebounceRef.current);
}
scrollDebounceRef.current = setTimeout(() => {
  scrollToBottom('smooth');
}, 50);
```

**Files**:
- `src/components/chat/ChatMessages.tsx:197, 280-299` - Added scroll debouncing

---

### 4. Preview Overlay Opens on Desktop (Should be Mobile Only)
**Severity**: HIGH (annoying UX, interrupts workflow)
**Location**: `src/components/chat/ChatWizard.tsx:2219-2226`

**Symptoms**:
- Every time `showPortfolioPreview` tool is called, a full-screen modal opens
- On desktop, this is redundant (sidebar preview already visible)
- Forces user to dismiss modal repeatedly

**Code Comment Acknowledges Bug**:
```typescript
// Side-effect from showPortfolioPreview tool - open mobile preview overlay
// On desktop the preview is already visible in the split pane
```
But line 2226 calls `setShowPreviewOverlay(true)` unconditionally.

**Fix**: Add screen size check before opening overlay on desktop.

---

### 5. Recurring Chunk Loading Errors
**Severity**: HIGH (app stability)
**Location**: Next.js build/chunk loading

**Symptoms**:
- Error: "Loading chunk app/(public)/layout failed"
- Appears multiple times during session
- Requires clicking "Try Again" to recover

**Possible Causes**:
- Hot reload issues
- Build cache corruption
- Webpack chunk splitting problems

---

## Medium Issues (UX Degradation)

### 6. Duplicate/Redundant Material Extraction
**Severity**: MEDIUM
**Location**: `extractProjectData` tool / story-extractor agent

**Symptoms**:
- Materials list includes both generic and specific: "brick" AND "reclaimed Denver common brick"
- "flashing" appears as both material AND technique
- "flashing installation" and "flashing" both in techniques list

**Expected**: Deduplication or preference for specific over generic terms.

---

### 7. Stale Quick Action Chips
**Severity**: MEDIUM
**Location**: `suggestQuickActions` tool

**Symptoms**:
- After location is extracted, "Add location" chip still appears
- Should dynamically update based on what's already captured

---

### 8. Voice Transcription Spacing Issues
**Severity**: MEDIUM (cosmetic but unprofessional)
**Location**: Whisper transcription display

**Symptoms**:
- Raw transcription shows: "blo ck li", "es pecially"
- Should clean up spacing before displaying to user

---

## Low Issues (Polish)

### 9. Generic Opening Greeting
**Severity**: LOW
**Location**: `src/lib/chat/chat-prompts.ts`

**Current**: "Hey - how can I help today?"
**Better**: "What project are you proud of? Tell me about it." or similar project-focused greeting

---

### 10. Preview Challenge/Solution Too Brief
**Severity**: LOW
**Location**: Preview panel rendering

**Symptoms**:
- Challenge/Solution in preview very brief for portfolio quality
- Should expand or use full description once generated

---

## Positive Observations

1. **Location extraction works correctly** - "Boulder, CO" properly extracted from conversation
2. **Natural conversational flow** - Agent acknowledges details like "Two weeks is a long hunt"
3. **Smart follow-up questions** - Agent asks about before/after photos specifically
4. **Material/technique extraction generally good** - Captures reclaimed Denver common brick, type S mortar with lime
5. **Duration captured** - "1 week" correctly extracted
6. **Image upload UI triggers appropriately** - Agent shows upload prompt at right time

---

## Recommended Fix Priority

1. ~~**Content Generation Bug** - Blocking, investigate projectId passing~~ ✅ FULLY FIXED (2026-01-01 11:00PM - ChatWizard now passes projectId from route params to API)
2. ~~**Content Generation Retry Loop** - Burning tokens, 100+ second requests~~ ✅ VERIFIED FIXED (2026-01-01 10:38PM - executor-level blocking prevents retries, request time reduced from 100s+ to ~15s)
3. ~~**Chat Scroll Jumping** - Janky UX during tool calls~~ ✅ FIXED
4. **Preview Overlay on Desktop** - Quick fix, high annoyance
5. **Chunk Loading Errors** - May need build investigation
6. **Duplicate Extraction** - Agent prompt/logic improvement
7. **Stale Quick Actions** - UI state management fix

## Verification Summary (2026-01-01 11:00PM)

Content generation tested successfully:
- Title generated: "1920s Craftsman Chimney Rebuild in Boulder, CO" (46 chars)
- Description generated: 306 words
- SEO fields populated
- No "No project found" errors
- Retry blocking working (blocked retries show "already attempted" message)

---

*Tested by: Claude Code Agent Testing*
*Date: 2026-01-01*
