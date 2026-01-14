# Testing Guide — KnearMe Contractor Dashboard

This guide covers what to test, how to test it, and what to look for.

## Testing Approach

### Mindset

Think like a contractor using this app for the first time:
- They're busy and want things to work quickly
- They may be on a phone at a job site
- They might have slow internet
- They need clear guidance at every step

### What to Look For

| Category | Examples |
|----------|----------|
| **Usability** | Can you complete tasks without confusion? Are buttons and labels clear? |
| **Visual** | Do elements align? Are colors consistent? Does text fit properly? |
| **Responsiveness** | Does it work on mobile, tablet, desktop? |
| **Performance** | Are pages fast? Do images load smoothly? |
| **Errors** | Are error messages helpful? Can you recover from mistakes? |
| **Accessibility** | Can you navigate with keyboard? Is contrast sufficient? |

---

## Test Areas

### 1. Authentication Flows

**Location:** `/login`, `/signup`, `/reset-password`

**Test Credentials (Existing Accounts):**
- Email: `hi+fmb@aaronbaker.co`
- Password: `Test1234!`
- Use for staging/preview only; do not change password or profile data unless instructed

| Test Case | Steps | Expected |
|-----------|-------|----------|
| Login success | Enter valid email/password, click Login | Redirect to dashboard |
| Login failure | Enter wrong password | Show error message, stay on page |
| Signup flow | Fill all fields, submit | Email sent, redirect to verification notice |
| Password reset | Request reset, check email, set new password | Password updated, can login |
| Session persistence | Login, close browser, reopen | Still logged in |
| Logout | Click logout | Redirect to login, session cleared |

**Things to check:**
- [ ] Error messages are helpful (not just "Error occurred")
- [ ] Password requirements are clear
- [ ] Form validates before submission
- [ ] Loading states show during API calls

---

### 2. Contractor Profile Setup

**Location:** `/profile/setup` (first-time) and `/profile/edit`

This is a 3-step wizard for new contractors.

| Step | What to Test |
|------|--------------|
| Step 1 | Business name, contact info, service area |
| Step 2 | Services offered (multi-select) |
| Step 3 | Profile photo upload |

**Test scenarios:**
- [ ] Complete wizard from start to finish
- [ ] Leave fields empty — are required fields enforced?
- [ ] Enter very long business name — does it handle overflow?
- [ ] Upload a large image — does compression work?
- [ ] Navigate back between steps — is data preserved?
- [ ] Return later — can you pick up where you left off?

---

### 3. Project Creation (AI Interview Wizard)

**Location:** `/projects/new`

This is the core feature — a 6-step wizard.

| Step | Description | Key Tests |
|------|-------------|-----------|
| 1. Upload | Add project photos | Multiple images, before/after categorization |
| 2. Analysis | AI analyzes images | Waiting state, analysis results display |
| 3. Interview | Voice recording Q&A | Mic permissions, recording UI, transcription |
| 4. Generation | AI creates content | Loading state, generated content display |
| 5. Review | Edit AI content | Text editing, regeneration option |
| 6. Publish | Final confirmation | Preview, publish action |

**Critical tests:**
- [ ] Upload 1 image vs 5 images vs 10 images
- [ ] Upload very large images (10MB+) — compression working?
- [ ] Record audio — does transcription appear?
- [ ] Skip questions vs answer all questions
- [ ] Edit generated content — do changes save?
- [ ] Navigate back and forth between steps
- [ ] Abandon mid-wizard — what happens to draft?
- [ ] Browser refresh at each step — data preserved?

**Voice recording specific:**
- [ ] Microphone permission prompt appears
- [ ] Recording indicator visible while speaking
- [ ] Playback works before proceeding
- [ ] Transcription accuracy (spot check a few)

---

### 4. Projects List

**Location:** `/projects`

| Test Case | Expected |
|-----------|----------|
| View projects | List shows with thumbnails, titles, status |
| Filter by status | Draft/Published/Archived filters work |
| Search | Search by title or description |
| Pagination | If many projects, pagination works |
| Empty state | New users see helpful "Create your first project" message |

---

### 5. Project Edit

**Location:** `/projects/[id]/edit`

| Tab | What to Test |
|-----|--------------|
| Content | Edit title, description, project details |
| Images | Reorder, delete, add new images |
| SEO | Meta title, description preview |

**Test scenarios:**
- [ ] Edit content and save — changes persist
- [ ] Reorder images via drag-and-drop
- [ ] Delete an image — removed immediately?
- [ ] Add images to existing project
- [ ] Unsaved changes warning if navigating away

---

### 6. Public Portfolio Pages

**Location:** `/{city}/masonry/{type}/{slug}`

Example: `/denver-co/masonry/chimney-rebuild/historic-brick-chimney-2025`

| Test Case | Expected |
|-----------|----------|
| Page loads | Title, images, description display correctly |
| Images gallery | Can view all project images |
| Mobile layout | Content readable, images scale |
| SEO meta | View page source — meta tags present |
| Share | URL works when shared |

---

## Device & Browser Matrix

Test on at least these combinations:

### Priority 1 (Must Test)
- [ ] iPhone Safari (latest iOS)
- [ ] Android Chrome
- [ ] Desktop Chrome

### Priority 2 (Should Test)
- [ ] Desktop Safari
- [ ] Desktop Firefox
- [ ] iPad

### Priority 3 (Nice to Test)
- [ ] Desktop Edge
- [ ] Older Android devices

---

## Slow Connection Testing

Simulate slow connections to find loading/timeout issues:

1. **Chrome DevTools** → Network tab → Throttle to "Slow 3G"
2. Test:
   - [ ] Image upload progress
   - [ ] AI generation waiting states
   - [ ] Voice recording under poor connection
   - [ ] Form submissions

---

## Accessibility Checklist

- [ ] Can complete all flows using keyboard only (Tab, Enter, Space)
- [ ] Focus states visible when tabbing
- [ ] Images have alt text
- [ ] Sufficient color contrast
- [ ] Screen reader announces form errors

---

## Common Edge Cases to Test

| Scenario | Where to Test |
|----------|---------------|
| Very long text input | Business name, project title, descriptions |
| Special characters | `&`, `<`, `>`, quotes in text fields |
| Empty states | New account with no projects |
| Interrupted flows | Refresh mid-wizard, lose connection |
| Concurrent edits | Open same project in two tabs |
| File type errors | Upload non-image file |

---

## Reporting Issues

Found something? Use the [Bug Report Template](./bug-reporting-template.md) for bugs or [UX Feedback Guide](./ux-feedback-guide.md) for improvement suggestions.
