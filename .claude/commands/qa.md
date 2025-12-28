# QA Testing Command

Run manual QA testing on the KnearMe contractor dashboard using Chrome browser automation.

## Instructions

1. **Read the QA documentation** at `todo/manual-qa/` to understand testing scope
2. **Use Chrome browser tools** (mcp__claude-in-chrome__*) for all testing
3. **Test the specified area** or run a full test pass if no area specified

## Testing Areas

When the user specifies an area, focus on that:
- `auth` — Login, signup, password reset flows
- `profile` — Profile setup wizard and edit page
- `projects` — Project creation wizard, list, and edit
- `upload` — Image upload and compression
- `voice` — Voice recording and transcription
- `public` — Public portfolio pages
- `full` — Complete test pass of all areas

## Test Environment

- **Staging URL**: https://knearme-portfolio.vercel.app
- **Production URL**: https://knearme.co
- Default to staging unless user specifies production

## Testing Process

1. Open Chrome and navigate to the test environment
2. Take screenshots of any issues found
3. Document bugs using the format in `todo/manual-qa/bug-reporting-template.md`
4. Log UX/UI feedback using `todo/manual-qa/ux-feedback-guide.md`
5. Report findings to the user with severity ratings (P0-P3)

## User Input

$ARGUMENTS

If no arguments provided, ask the user which area to test or if they want a full test pass.
