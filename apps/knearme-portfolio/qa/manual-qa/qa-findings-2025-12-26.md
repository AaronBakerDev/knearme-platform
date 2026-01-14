# QA Findings Report — 2025-12-26

**Tester:** Claude (automated)
**Environment:** Localhost (`:3000`)
**Test Account:** `hi+fmb@aaronbaker.co`

---

## Summary

| Category | Count |
|----------|-------|
| **P1 Bugs (Critical)** | 1 |
| **P2 Bugs (High)** | 1 |
| **UX Issues** | 4 |

---

## Bugs

### Bug #1 — IndexedDB Version Mismatch (P1 Critical)

**Location:** Multiple files sharing same IndexedDB database

**Error:**
```
Failed to open IndexedDB: The requested version (X) is less than the existing version (3).
```

**Impact:**
- Chat conversation data is lost during project creation
- User entered 3 messages about a chimney rebuild project
- All messages disappeared after the third submission
- Offline draft queue completely broken

**Root Cause Analysis:**

Three files share the SAME IndexedDB database (`knearme-offline`) but use DIFFERENT versions:

| File | DB_VERSION | Status |
|------|------------|--------|
| `src/lib/offline/draft-queue.ts` | 3 | ✅ Current |
| `src/lib/wizard/wizard-storage.ts` | **2** | ❌ **STALE** |
| `src/lib/chat/chat-storage.ts` | 3 | ✅ Current |

When one module opens the database at version 3, then another tries version 2, IndexedDB throws an error and the session data is lost.

**Additional Finding:** `wizard-storage.ts` is **dead code** - the new chat-based UI (`chat-storage.ts`) replaced the old wizard. The file is only referenced in a `.bak` backup file.

**Fix Required:**
1. **Option A (Quick):** Update `wizard-storage.ts:14` to `DB_VERSION = 3`
2. **Option B (Clean):** Delete `wizard-storage.ts` since it's unused dead code

---

### Bug #2 — Chat Input Truncates Long Messages (P2)

**Location:** `/projects/new` — Chat input field

**Issue:** When typing a long message, the input field only shows the end of the text. User cannot see or review full message before sending.

**Steps to Reproduce:**
1. Go to `/projects/new`
2. Type a message longer than ~50 characters
3. Only the last portion is visible in the input field

**Expected:** Input should expand or show full text, or allow scrolling within input.

---

## UX Issues

### UX #1 — Preview Panel Never Updates

**Location:** `/projects/new` — Right panel

**Issue:** After 3 chat exchanges providing project details, the preview panel still shows empty state with "Tell me about your project and add some photos to see it come together."

**Expected:** Preview should progressively update as user provides information, showing generated title, description draft, etc.

**Impact:** User has no feedback that their input is being captured or processed.

---

### UX #2 — No Progress Indicator in Chat Flow

**Location:** `/projects/new`

**Issue:** User has no idea how many questions remain or when the AI will generate content. The conversation feels open-ended without clear milestones.

**Suggestion:** Add a subtle progress indicator (e.g., "Step 2 of 5" or progress dots) so users know how far along they are.

---

### UX #3 — Project Card Click Should Navigate

**Location:** `/projects` list

**Current:** Clicking a project card highlights it but doesn't navigate. Users must use 3-dot menu → Edit.

**Suggestion:** Make entire card clickable to open project edit page.

**Priority:** Medium

---

### UX #4 — City Field Lacks Validation

**Location:** `/profile/edit`

**Current:** Free text allows typos (e.g., "Hmailton" instead of "Hamilton")

**Suggestion:** Add city autocomplete to prevent typos and improve SEO consistency.

**Priority:** Low

---

## Project Creation Flow Test Results

### What Worked ✅
- Chat interface loads correctly
- AI responds with relevant follow-up questions
- Conversational tone is friendly and appropriate
- Visual distinction between user (teal) and AI (white) messages
- Fast response times

### What Failed ❌
- Conversation data lost after 3 exchanges (IndexedDB bug)
- Preview panel never populated
- No progress indication
- Long input text truncated

---

## Test Coverage

| Area | Status | Notes |
|------|--------|-------|
| Login/Auth | ✅ | Session persisted |
| Dashboard | ✅ | Stats correct |
| Projects List | ✅ | Grid/filters work |
| Project Edit | ✅ | Tabs functional |
| Project Creation | ❌ | **Critical bugs found** |
| Profile Edit | ✅ | Form works |
| Mobile | ❌ | Not tested |

---

## Priority Actions

1. **FIX IMMEDIATELY:** IndexedDB version mismatch in `draft-queue.ts`
2. **Fix before launch:** Chat input truncation
3. **Fix before launch:** Preview panel should update during conversation
4. **Nice to have:** Progress indicator in chat flow

---

*Report updated: 2025-12-26*
