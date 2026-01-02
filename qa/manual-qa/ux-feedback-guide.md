# UX/UI Feedback Guide

Not a bug? Use this guide to submit UX improvements and UI suggestions.

---

## Bugs vs Feedback

| Type | Definition | Example |
|------|------------|---------|
| **Bug** | Something broken or not working as designed | Button doesn't respond to clicks |
| **UX Feedback** | Something works but could be better | Flow is confusing, too many steps |
| **UI Feedback** | Visual improvements | Text too small, colors unclear |

**Rule of thumb:** If it's *broken*, file a bug. If it *works but frustrates*, file feedback.

---

## Feedback Categories

### Usability
Issues with how easy the app is to use.

Examples:
- "I didn't know I could drag to reorder images"
- "The 'Save' button is hard to find"
- "I expected clicking the logo to go home"
- "The form validation felt aggressive"

### Accessibility
Issues affecting users with disabilities.

Examples:
- "Can't tell which field has focus when tabbing"
- "Text contrast too low on gray buttons"
- "No indication when action completes (for screen readers)"
- "Touch targets too small on mobile"

### Visual Design
Issues with aesthetics and visual hierarchy.

Examples:
- "Spacing feels inconsistent between sections"
- "This page feels cluttered"
- "The success message blends into the background"
- "Font size too small on project cards"

### Performance Perception
Issues with how fast/slow things feel.

Examples:
- "No feedback while images upload"
- "Feels like nothing happened after clicking"
- "Loading state lasts too long without progress"
- "Page jump when content loads"

### Information Architecture
Issues with where things are and how they're organized.

Examples:
- "Expected 'Settings' under my profile menu"
- "Didn't realize I could edit published projects"
- "Terminology is confusing — what's a 'showcase'?"
- "Navigation order doesn't match my mental model"

---

## Feedback Template

Copy this template when submitting feedback:

```markdown
## Feedback Title
[Brief description: "Image upload needs progress indicator"]

## Category
[Usability / Accessibility / Visual Design / Performance / Information Architecture]

## Where in the App
- **Page/Flow:** [e.g., Project creation, Step 1]
- **URL:** [if applicable]

## Current Experience
Describe what currently happens and why it's suboptimal.

## Suggested Improvement
Describe how it could be better. Be specific if possible.

## Impact
- **Who is affected:** [All users / New users / Mobile users / etc.]
- **How often:** [Every time / Sometimes / Edge case]
- **Severity:** [Frustrating / Annoying / Minor inconvenience]

## Screenshots / Mockups (Optional)
[Attach any visuals that help explain]

## Additional Context
[Anything else relevant]
```

---

## Priority Indicators

When submitting feedback, indicate impact:

| Level | Description | Examples |
|-------|-------------|----------|
| **High Impact** | Affects core flows, frustrates most users | Unclear how to publish, confusing wizard |
| **Medium Impact** | Noticeable but not blocking | Awkward button placement, unclear labels |
| **Low Impact** | Nice-to-have, polish items | Slightly off spacing, minor visual tweaks |

---

## Good Feedback Examples

### Example 1: Usability

```markdown
## Feedback Title
Voice recording step needs clearer instructions

## Category
Usability

## Where in the App
- **Page/Flow:** Project creation, Step 3 (Voice Interview)
- **URL:** /projects/new

## Current Experience
The page shows "Answer the following questions" with a record button, but it's not clear:
- How long each answer should be
- If I can re-record
- What the AI will do with my answers

First-time users may feel uncertain about what to say.

## Suggested Improvement
Add brief context before the questions:
- "Speak naturally for 30-60 seconds per question"
- "You can re-record any answer"
- "Your answers help AI write your project description"

## Impact
- **Who is affected:** All first-time users
- **How often:** Every first project
- **Severity:** Frustrating

## Additional Context
I hesitated for 30+ seconds before recording because I wasn't sure what was expected.
```

### Example 2: Visual Design

```markdown
## Feedback Title
Project status badges need better visual distinction

## Category
Visual Design

## Where in the App
- **Page/Flow:** Projects list
- **URL:** /projects

## Current Experience
Draft, Published, and Archived badges all look similar — small gray text with subtle background differences. Hard to scan project status at a glance.

## Suggested Improvement
Use distinct colors:
- Draft: Yellow/orange badge
- Published: Green badge
- Archived: Gray badge

## Impact
- **Who is affected:** Users with multiple projects
- **How often:** Every time viewing project list
- **Severity:** Minor inconvenience

## Screenshots
[Attached: projects_list_badges.png]
```

### Example 3: Accessibility

```markdown
## Feedback Title
Form error messages only use color to indicate errors

## Category
Accessibility

## Where in the App
- **Page/Flow:** Signup form
- **URL:** /signup

## Current Experience
When form validation fails, the field border turns red and error text appears in red below. Users with color blindness may miss this.

## Suggested Improvement
Add an error icon (!) next to fields with errors, or add "Error:" prefix to error messages.

## Impact
- **Who is affected:** Users with color vision deficiency (~8% of males)
- **How often:** Every form error
- **Severity:** Frustrating for affected users

## Additional Context
WCAG 2.1 guideline 1.4.1 requires not using color alone to convey information.
```

---

## Where to Submit Feedback

| Method | Best For |
|--------|----------|
| **GitHub Issues** | All feedback (use `enhancement` label) |
| **Slack #knearme-qa** | Quick observations, discussions |
| **Notion/Coda** | If the team has a feedback board |

### GitHub Labels for Feedback
- `enhancement` — For all UX/UI feedback
- `accessibility` — A11y-specific
- `design` — Visual design items
- `good-first-issue` — Simple improvements for new contributors

---

## Tips for Effective Feedback

1. **Be specific** — "The button is confusing" vs "The blue button says 'Continue' but I expected it to save my work"

2. **Describe the problem, not just the solution** — Let the team understand the issue; they may have a better fix

3. **Include context** — Were you a first-time user? On mobile? In a hurry?

4. **One topic per submission** — Easier to track and discuss

5. **It's okay to be uncertain** — "I'm not sure why, but this felt off" is valid feedback

6. **Positive feedback counts too** — If something delighted you, share that!

---

## Feedback vs Feature Requests

| Feedback | Feature Request |
|----------|-----------------|
| Improve existing flow | Add new capability |
| "This button should be more visible" | "Add a dark mode" |
| "Image upload is confusing" | "Support video uploads" |

Both are valuable! Just label them appropriately so the team can prioritize.
