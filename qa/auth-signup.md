# Auth Signup QA

Purpose: document user stories, happy-path acceptance, and edge cases for the `/signup` flow so we can automate coverage and track runs.

## User Stories (contractor-facing)
- **US-SU-01**: As a new contractor, I can create an account with email/password so I can start a portfolio.
- **US-SU-02**: As a user who mistypes, I get clear inline errors and focus moves to the first invalid field.
- **US-SU-03**: As a returning user, I’m redirected to login if I try to sign up with an already-registered email.
- **US-SU-04**: As a new user, I receive a verification email with a link that returns me to `/auth/callback?next=/profile/setup`.
- **US-SU-05**: As a security-conscious user, weak or mismatched passwords are rejected with specific guidance.

## Core Scenarios (happy + common errors)
| ID | Scenario | Preconditions / Inputs | Expected Result |
| --- | --- | --- | --- |
| SC-01 | Happy path signup | Fresh email `hi+<tag>@aaronbaker.co`, password meeting rules | Supabase `signUp` succeeds; success state shows “Check your email” with the input email; verification email sent. |
| SC-02 | Passwords mismatch | Password != Confirm | Form error “Passwords do not match”; focus moves to confirm field; no request sent. |
| SC-03 | Weak password | <8 chars or missing letter/number | Form error matching rule; focus to password; submit blocked. |
| SC-04 | Existing email | Email already registered | Inline error “already registered”; helper link to `/login` visible. |
| SC-05 | Double submit prevention | Click submit repeatedly while loading | Button disabled/spinner during request; only one request fired. |
| SC-06 | Empty required fields | Blank email or password | Native required validation stops submit; focus on first missing field. |

## Edge Cases to Cover
- Plus-alias addresses: `hi+alias@aaronbaker.co` should be accepted and stored verbatim.
- Emails with dots/uppercase should normalize consistently and still send verification.
- Leading/trailing whitespace trimmed or rejected without sending request.
- Network/API failure from Supabase should surface “unexpected error” state without crashing page.
- Rate limiting / 429 or `auth rate limit` error should show actionable message (today it would show raw error text).
- Redirect safety: `emailRedirectTo` must remain `${origin}/auth/callback?next=/profile/setup` and be HTTPS in production.
- Success state: “Use a different email” should return to form with previous values cleared.

## Test Data
- Email template: `hi+<purpose>-<date>@aaronbaker.co` (plus addressing for traceability).
- Strong password template: `QaTest123!` (8+ chars, letters, number, symbol).

## Automation Notes
- Target URL: `/signup` (Next.js route group `(auth)/signup`).
- Blocking dependencies: valid `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in env; outbound network to Supabase.
- Post-signup verification link delivery isn’t asserted in UI; need inbox hook or Supabase audit logs for end-to-end verification.
- Playwright MCP can drive a test inbox once wired: open mailbox, locate the Supabase verification email, and click the link to finish activation.
