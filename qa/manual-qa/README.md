# Manual QA — KnearMe Contractor Dashboard

Welcome, testers! This folder contains everything you need to perform manual QA on the KnearMe contractor dashboard.

## Quick Start

1. **Get access** to the staging environment (see below)
2. **Read** the [Testing Guide](./testing-guide.md) to understand what to test
3. **Use** the [Bug Report Template](./bug-reporting-template.md) when you find issues
4. **Submit** UX/UI suggestions using the [UX Feedback Guide](./ux-feedback-guide.md)

## Testing Environment

| Environment | URL | Notes |
|-------------|-----|-------|
| Staging | `https://knearme-portfolio.vercel.app` | Preview deployments |
| Production | `https://knearme.co` | Live site (be careful!) |
| Local | `http://localhost:3000` | For devs only |

**Test Credentials (Existing Accounts):**
- Email: `hi+fmb@aaronbaker.co`
- Password: `Test1234!`
- Use for staging/preview only; do not change password or profile data unless instructed

## What We're Testing

The contractor dashboard includes:

- **Authentication** — Login, signup, password reset, email verification
- **Profile Setup** — 3-step business profile wizard
- **Project Creation** — 6-step AI-powered interview wizard
- **Projects List** — View, filter, search, edit projects
- **Image Upload** — Multi-image upload with compression
- **Voice Recording** — Audio interviews with AI transcription
- **Public Portfolio** — SEO-optimized project showcase pages

## Documents in This Folder

| Document | Purpose |
|----------|---------|
| [testing-guide.md](./testing-guide.md) | What to test and how |
| [bug-reporting-template.md](./bug-reporting-template.md) | How to report bugs |
| [ux-feedback-guide.md](./ux-feedback-guide.md) | How to submit UX/UI feedback |

## Key Testing Focus Areas

When testing, pay special attention to:

1. **UX Issues** — Confusing flows, unclear instructions, poor error messages
2. **UI Problems** — Layout breaks, visual glitches, accessibility issues
3. **Bugs** — Features not working, data not saving, unexpected errors
4. **Edge Cases** — Empty states, very long text, slow connections

## Submitting Feedback

**Where to submit:**
- GitHub Issues: [Create Issue](https://github.com/your-org/knearme-portfolio/issues/new)
- Slack: `#knearme-qa` channel
- Email: qa@knearme.co

**Response time:**
- P0 (Critical): Immediate response
- P1 (High): Same day
- P2 (Medium): Within 2-3 days
- P3 (Low): Backlog

## Questions?

Contact the development team on Slack or open a discussion in GitHub.
