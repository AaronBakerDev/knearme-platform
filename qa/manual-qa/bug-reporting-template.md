# Bug Reporting Template

Use this template when reporting bugs found during manual QA.

---

## Bug Report Format

Copy and paste this template when creating a bug report:

```markdown
## Bug Title
[Short, descriptive title: "Login fails with valid credentials on Safari"]

## Environment
- **Browser:** [Chrome 120 / Safari 17 / Firefox 121 / Edge]
- **OS:** [macOS 14.2 / Windows 11 / iOS 17 / Android 14]
- **Device:** [Desktop / iPhone 15 / Pixel 8 / iPad]
- **Screen size:** [e.g., 1920x1080 or "Mobile portrait"]
- **URL:** [Full URL where bug occurred]
- **User type:** [New user / Existing user with projects]

## Severity
[P0 / P1 / P2 / P3] — See severity guide below

## Steps to Reproduce
1. Go to [URL]
2. Click on [element]
3. Enter [data]
4. Observe [behavior]

## Expected Behavior
What should have happened.

## Actual Behavior
What actually happened.

## Screenshots / Recording
[Attach screenshots or screen recording]

## Console Errors (if any)
[Open DevTools > Console, paste any red errors]

## Additional Context
[Any other relevant info: was this intermittent? Did it work before?]
```

---

## Severity Levels

| Level | Name | Description | Examples |
|-------|------|-------------|----------|
| **P0** | Critical | App unusable, data loss, security issue | Can't login, projects deleted, payments broken |
| **P1** | High | Major feature broken, no workaround | Can't create projects, images won't upload |
| **P2** | Medium | Feature partially broken, has workaround | Filter doesn't work, but search does |
| **P3** | Low | Minor issue, cosmetic, edge case | Typo, slight misalignment, rare scenario |

### How to Choose Severity

Ask yourself:
- **Can the user complete their goal?** No = P0/P1
- **Is there a workaround?** No = higher severity
- **How many users affected?** All users = higher severity
- **Is it visible/obvious?** Very visible = higher severity

---

## Bug Title Conventions

Write titles that describe the problem clearly:

**Good titles:**
- "Login button unresponsive after password error"
- "Project images don't upload on iOS Safari"
- "Voice recording fails when switching tabs"
- "Generated content missing on slow connections"

**Bad titles:**
- "Bug in login" (too vague)
- "Doesn't work" (what doesn't work?)
- "Error" (which error?)

---

## Capturing Evidence

### Screenshots
- Include the full screen when possible
- Highlight or annotate the problem area
- Capture any error messages

### Screen Recordings
- Use QuickTime (Mac), built-in recorder (Windows/iOS), or Loom
- Keep recordings short (under 60 seconds)
- Narrate what you're doing if possible

### Console Errors
1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Reproduce the bug
4. Copy any red error messages
5. Include in your report

---

## Where to Submit

| Method | Best For |
|--------|----------|
| **GitHub Issues** | All bugs (preferred) |
| **Slack #knearme-qa** | Quick questions, P0 issues |
| **Email qa@knearme.co** | If you don't have GitHub access |

### GitHub Issue Labels

When creating GitHub issues, use these labels:
- `bug` — For all bugs
- `P0-critical`, `P1-high`, `P2-medium`, `P3-low` — Severity
- `needs-triage` — If unsure about severity
- `mobile` — Mobile-specific issues
- `accessibility` — A11y issues

---

## Example Bug Report

```markdown
## Bug Title
Voice recording stops unexpectedly after 10 seconds on iOS Safari

## Environment
- **Browser:** Safari 17.2
- **OS:** iOS 17.2
- **Device:** iPhone 14 Pro
- **Screen size:** Mobile portrait
- **URL:** https://knearme.co/projects/new (Step 3)
- **User type:** New user

## Severity
P1 — High (core feature broken, no workaround)

## Steps to Reproduce
1. Go to /projects/new
2. Upload an image and proceed to Step 3 (Voice Interview)
3. Tap "Start Recording"
4. Speak for more than 10 seconds
5. Recording stops automatically at ~10 seconds

## Expected Behavior
Recording should continue until user taps "Stop Recording" (up to 2 minutes).

## Actual Behavior
Recording cuts off at approximately 10 seconds with no warning. The partial recording is saved.

## Screenshots / Recording
[Attached: screen_recording_ios.mov]

## Console Errors
Unable to access console on mobile Safari.

## Additional Context
- Works fine on desktop Safari
- Works fine on iOS Chrome
- Reproduced 3/3 times
- Microphone permissions granted
```

---

## Tips for Better Bug Reports

1. **Reproduce it twice** before reporting — is it consistent?
2. **One bug per report** — don't combine multiple issues
3. **Be specific** — "sometimes" is less helpful than "2 out of 5 attempts"
4. **Include context** — what were you doing before the bug?
5. **Check if already reported** — search existing issues first
