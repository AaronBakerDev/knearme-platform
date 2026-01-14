# EPIC-001: Authentication & Onboarding

> **Version:** 1.0
> **Last Updated:** December 8, 2025
> **Status:** Ready for Development
> **Priority:** Must Have (MVP)

---

## Overview

Enable contractors to create accounts, authenticate, and set up their business profiles. This epic covers the complete authentication flow from signup through profile completion, establishing the foundation for all authenticated features.

### Business Value

- **Gate to Value**: Users can't create projects without an account
- **Data Ownership**: Associates projects with verified contractor identities
- **SEO Foundation**: Profile data powers contractor pages and project attribution
- **Trust Signal**: Verified accounts increase homeowner confidence

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Signup completion rate | >70% | Funnel analytics |
| Time to profile completion | <5 min | Event timestamps |
| Email verification rate | >85% | Auth provider data |
| Profile completeness score | >80% | Required fields filled |

---

## User Stories

### US-001-01: Email Signup

**As a** contractor visiting KnearMe for the first time
**I want to** create an account with my email and password
**So that** I can start building my project portfolio

#### Acceptance Criteria

- Given I am on the signup page
- When I enter a valid email and password (min 8 chars, 1 number, 1 letter)
- Then my account is created and I receive a verification email
- And I am redirected to the profile setup flow

- Given I enter an email already registered
- When I submit the signup form
- Then I see an error "This email is already registered" with a login link

- Given I enter an invalid email format
- When I try to submit
- Then I see inline validation "Please enter a valid email"

#### Technical Notes

- **Endpoint**: `POST /api/auth/signup`
- **Provider**: Supabase Auth
- **Database**: Creates row in `auth.users` + triggers `contractors` row creation
- **Rate Limiting**: 5 signup attempts per email per hour

```typescript
// Signup flow
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password,
  options: {
    emailRedirectTo: `${origin}/auth/callback?next=/profile/setup`
  }
})
```

---

### US-001-02: Email Verification

**As a** newly registered contractor
**I want to** verify my email address
**So that** my account is secured and I can receive notifications

#### Acceptance Criteria

- Given I have signed up with a valid email
- When I click the verification link in my email
- Then my email is marked as verified
- And I am redirected to the profile setup page

- Given I haven't received the verification email
- When I click "Resend verification email"
- Then a new email is sent (max 3 per hour)
- And I see "Verification email sent"

- Given the verification link has expired (>24 hours)
- When I click it
- Then I see "Link expired" with option to resend

#### Technical Notes

- **Provider**: Supabase Auth handles email verification
- **Template**: Custom email template with KnearMe branding
- **Expiry**: 24 hours
- **Redirect**: `/auth/callback` handles token exchange

---

### US-001-03: Login

**As a** returning contractor
**I want to** log in with my email and password
**So that** I can access my projects and portfolio

#### Acceptance Criteria

- Given I have a verified account
- When I enter correct credentials
- Then I am logged in and redirected to dashboard
- And my session persists for 7 days

- Given I enter incorrect credentials
- When I submit the login form
- Then I see "Invalid email or password" (generic for security)

- Given I haven't verified my email
- When I try to log in
- Then I see "Please verify your email first" with resend option

#### Technical Notes

- **Endpoint**: `POST /api/auth/login`
- **Session**: JWT stored in httpOnly cookie
- **Duration**: 7 days, refreshable
- **Rate Limiting**: 5 failed attempts triggers 15-minute lockout

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password
})
```

---

### US-001-04: Password Reset

**As a** contractor who forgot my password
**I want to** reset it via email
**So that** I can regain access to my account

#### Acceptance Criteria

- Given I am on the password reset page
- When I enter my registered email
- Then I receive a reset link (even if email not found, for security)
- And I see "If this email exists, you'll receive a reset link"

- Given I click a valid reset link
- When I enter a new password meeting requirements
- Then my password is updated
- And I am logged in automatically

- Given the reset link has expired (>1 hour)
- When I click it
- Then I see "Link expired" with option to request new one

#### Technical Notes

- **Endpoint**: `POST /api/auth/reset-password`
- **Expiry**: 1 hour
- **One-time use**: Link invalidated after use
- **Logging**: Log reset attempts for security monitoring

---

### US-001-05: Profile Setup - Business Info

**As a** newly verified contractor
**I want to** set up my business profile
**So that** my portfolio pages are properly branded

#### Acceptance Criteria

- Given I have verified my email
- When I land on profile setup
- Then I see a multi-step form starting with business info

- Given I am on the business info step
- When I fill in required fields (business name, city, state)
- Then I can proceed to the next step

- Given I skip profile setup
- When I try to create a project
- Then I am redirected back to complete profile first

**Required Fields:**
| Field | Type | Validation |
|-------|------|------------|
| Business Name | Text | 2-100 chars |
| City | Text | 2-50 chars |
| State | Select | 2-letter code |

**Optional Fields:**
| Field | Type | Notes |
|-------|------|-------|
| Profile Photo | Image | Max 5MB, square recommended |
| Business Description | Textarea | Max 500 chars |

#### Technical Notes

- **Endpoint**: `PATCH /api/contractors/profile`
- **Database**: Updates `contractors` table
- **Slug Generation**: `city_slug` auto-generated from city+state
- **Storage**: Profile photo to `profile-images` bucket

```sql
UPDATE contractors
SET business_name = $1,
    city = $2,
    state = $3,
    city_slug = slugify($2 || '-' || $3)
WHERE auth_user_id = auth.uid();
```

---

### US-001-06: Profile Setup - Services Selection

**As a** contractor setting up my profile
**I want to** select the services I offer
**So that** my portfolio is categorized correctly

#### Acceptance Criteria

- Given I am on the services selection step
- When I select at least one service
- Then I can proceed to the next step

- Given no services are selected
- When I try to continue
- Then I see "Please select at least one service"

**Service Options (Masonry):**
- Chimney Repair & Rebuild
- Tuckpointing
- Brick Repair
- Stone Work
- Retaining Walls
- Concrete Work
- Historic Restoration
- Waterproofing

#### Technical Notes

- **Database**: `services` column is `text[]` array
- **UI**: Checkbox multi-select with icons
- **Validation**: At least 1 service required

---

### US-001-07: Profile Setup - Service Areas

**As a** contractor setting up my profile
**I want to** list the areas I serve
**So that** I appear in location-based searches

#### Acceptance Criteria

- Given I am on the service areas step
- When I add cities/neighborhoods I serve
- Then they are saved to my profile
- And I can add up to 20 areas

- Given I enter an area
- When I type
- Then I see autocomplete suggestions (optional for MVP)

**Input Format:**
- Free text input with "Add" button
- Chip display for added areas
- Click to remove

#### Technical Notes

- **Database**: `service_areas` column is `text[]` array
- **SEO Impact**: Critical for local search ranking
- **Max Items**: 20 (prevent abuse)
- **Index**: GIN index for array search

---

### US-001-08: Session Management

**As a** logged-in contractor
**I want to** stay logged in across browser sessions
**So that** I don't have to log in every time

#### Acceptance Criteria

- Given I have logged in
- When I close and reopen the browser
- Then I remain logged in (for 7 days)

- Given my session is about to expire
- When I am actively using the app
- Then my session is silently refreshed

- Given I click "Log out"
- When confirmed
- Then my session is invalidated
- And I am redirected to the homepage

#### Technical Notes

- **Storage**: Refresh token in httpOnly cookie
- **Access Token**: Short-lived (1 hour), auto-refreshed
- **Logout**: Clears tokens, invalidates server session

```typescript
// Session check on protected routes
const { data: { session } } = await supabase.auth.getSession()
if (!session) {
  redirect('/login')
}
```

---

### US-001-09: Google OAuth (Should Have)

**As a** contractor who prefers social login
**I want to** sign up/log in with my Google account
**So that** I don't have to remember another password

#### Acceptance Criteria

- Given I am on the signup/login page
- When I click "Continue with Google"
- Then I am redirected to Google OAuth
- And upon approval, my account is created/logged in

- Given I sign up with Google
- When my account is created
- Then my name is pre-filled from Google profile
- And email is auto-verified

#### Technical Notes

- **Provider**: Supabase Auth with Google OAuth
- **Scopes**: `email`, `profile`
- **Profile Sync**: First name, last name, profile photo optional

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${origin}/auth/callback?next=/profile/setup`
  }
})
```

---

## Non-Functional Requirements

| Requirement | Target | Notes |
|-------------|--------|-------|
| Signup response time | <2s | Including email send |
| Login response time | <500ms | Auth check |
| Password hashing | bcrypt, cost 12 | Supabase default |
| Session security | httpOnly, secure, sameSite | Cookie flags |

---

## Dependencies

| Dependency | Type | Notes |
|------------|------|-------|
| Supabase Auth | External | Must be configured |
| Email provider | External | Supabase built-in or custom |
| EPIC-002 | Internal | Project creation needs auth |

---

## Out of Scope

- Apple Sign-In (iOS app requirement, Phase 3)
- Multi-factor authentication (not needed for MVP)
- Team/multi-user accounts (Phase 3)
- SSO for enterprise (not needed)

---

## UI/UX Specifications

### Signup Page

```
┌─────────────────────────────────────┐
│         Create Your Account          │
│                                       │
│  [Google Sign Up Button]              │
│                                       │
│  ─────── or ───────                   │
│                                       │
│  Email                                │
│  ┌─────────────────────────────────┐ │
│  │ you@company.com                 │ │
│  └─────────────────────────────────┘ │
│                                       │
│  Password                             │
│  ┌─────────────────────────────────┐ │
│  │ ••••••••                        │ │
│  └─────────────────────────────────┘ │
│  8+ chars, 1 letter, 1 number         │
│                                       │
│  [        Create Account        ]     │
│                                       │
│  Already have an account? Log in      │
└─────────────────────────────────────┘
```

### Profile Setup Flow

```
Step 1/3: Business Info
┌─────────────────────────────────────┐
│  Business Name *                      │
│  ┌─────────────────────────────────┐ │
│  │ Heritage Masonry LLC            │ │
│  └─────────────────────────────────┘ │
│                                       │
│  City *              State *          │
│  ┌──────────────┐   ┌───────────┐    │
│  │ Denver       │   │ CO ▼      │    │
│  └──────────────┘   └───────────┘    │
│                                       │
│  Profile Photo (optional)             │
│  ┌─────────────────────────────────┐ │
│  │   [Upload Photo]                │ │
│  └─────────────────────────────────┘ │
│                                       │
│  [Skip for Now]    [Continue →]       │
└─────────────────────────────────────┘
```

---

## Test Scenarios

| ID | Scenario | Expected Result |
|----|----------|-----------------|
| AUTH-T01 | Signup with valid email | Account created, verification sent |
| AUTH-T02 | Signup with existing email | Error shown, suggest login |
| AUTH-T03 | Login with correct creds | Redirected to dashboard |
| AUTH-T04 | Login with wrong password | Generic error, no hints |
| AUTH-T05 | 6th failed login attempt | 15-minute lockout |
| AUTH-T06 | Reset password flow | Password updated, logged in |
| AUTH-T07 | Expired reset link | Error with resend option |
| AUTH-T08 | Profile without services | Cannot proceed |
| AUTH-T09 | Session after 6 days | Still logged in |
| AUTH-T10 | Session after 8 days | Must re-login |

---

*This epic establishes the authentication foundation. All subsequent epics depend on US-001-01 through US-001-08 being complete.*
