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
**Status**: ✅ FIXED
**Location**: `src/components/chat/ChatWizard.tsx:2261-2263`

**Symptoms**:
- Every time `showPortfolioPreview` tool is called, a full-screen modal opens
- On desktop, this is redundant (sidebar preview already visible)
- Forces user to dismiss modal repeatedly

**Fix Applied**:
```typescript
// Only open overlay on mobile - desktop has the sidebar preview visible
if (isMobile) {
  setShowPreviewOverlay(true);
}
```
The `useIsMobile()` hook is used to gate the overlay display to mobile viewports only.

---

### 5. Recurring Chunk Loading Errors
**Severity**: MEDIUM (development mode issue)
**Status**: ⚡ KNOWN ISSUE (dev mode only)
**Location**: Next.js build/chunk loading

**Symptoms**:
- Error: "Loading chunk app/(public)/layout failed"
- Appears multiple times during session
- Requires clicking "Try Again" to recover

**Root Cause**:
This is a common Next.js development mode issue, NOT a production bug:
1. **Browser cache** - Old chunk hashes cached while dev server regenerates new ones
2. **HMR conflicts** - Hot Module Reload can't update all chunks atomically
3. **Multiple dev servers** - Running on alternate ports (3000 vs 3001) causes cache misses

**Workaround** (development only):
```bash
# Clear .next cache and restart
rm -rf .next && npm run dev

# Or hard refresh in browser
# Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
```

**Production Status**: Not reproducible in production builds - chunk hashes are stable after `npm run build`.

---

## Medium Issues (UX Degradation)

### 6. Duplicate/Redundant Material Extraction
**Severity**: MEDIUM
**Status**: ✅ FIXED
**Location**: `src/lib/agents/story-extractor.ts`

**Symptoms**:
- Materials list includes both generic and specific: "brick" AND "reclaimed Denver common brick"
- "flashing" appears as both material AND technique
- "flashing installation" and "flashing" both in techniques list

**Fix Applied**:
1. Updated AI extraction prompt with explicit deduplication rules and material/technique separation guidance
2. Added `deduplicateTerms()` helper that removes generic terms when specific exists
3. Added `separateMaterialsAndTechniques()` helper that moves technique terms (flashing, waterproofing, etc.) out of materials
4. Applied same deduplication logic to both AI and non-AI extraction paths
5. Migrated to new AI SDK pattern (`generateText` + `Output.object`)

**Key Changes**:
- `TECHNIQUE_TERMS` constant defines terms that are always techniques (flashing, waterproofing, etc.)
- `isGenericOf()` checks if one term is a generic version of another
- Both helpers applied after merging to ensure clean output

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
4. ~~**Preview Overlay on Desktop** - Quick fix, high annoyance~~ ✅ FIXED (2026-01-02 - `isMobile` check added)
5. ~~**Chunk Loading Errors** - May need build investigation~~ ⚡ KNOWN ISSUE (dev mode only - see workaround above)
6. ~~**Duplicate Extraction** - Agent prompt/logic improvement~~ ✅ FIXED (2026-01-02 - deduplication helpers added)
7. **Stale Quick Actions** - UI state management fix

### Historical Error Cards (Cosmetic)
The 63 "Try Again" buttons visible in test conversations are **data artifacts** from testing before fixes were applied. These are stored in conversation history and will persist until:
- User starts a fresh conversation for the project
- A "clear conversation" feature is added (future enhancement)
- Data cleanup migration is run

These do NOT indicate current bugs - the retry-blocking mechanism is working correctly.

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
