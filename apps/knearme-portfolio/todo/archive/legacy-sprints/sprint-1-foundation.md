# Sprint 1: Foundation

> **Status:** 🔄 Current
> **Epic References:** EPIC-001 (Auth), EPIC-002 (partial)
> **Estimated Duration:** 1 week

## Overview

Set up the project foundation: Next.js, Supabase, authentication, and basic UI components.

---

## 1. Project Initialization

### Next.js Setup
- [x] Create Next.js 14 project with App Router
  ```bash
  npx create-next-app@latest knearme-portfolio --typescript --tailwind --eslint --app --src-dir
  ```
- [x] Configure TypeScript strict mode in `tsconfig.json`
- [x] Set up path aliases (`@/components`, `@/lib`, etc.)
- [x] Create folder structure:
  ```
  src/
  ├── app/
  │   ├── (auth)/
  │   ├── (dashboard)/
  │   ├── (marketing)/
  │   └── (portfolio)/
  ├── components/
  │   ├── ui/
  │   └── forms/
  ├── lib/
  │   ├── supabase/
  │   └── utils/
  └── types/
  ```
- [x] Add `.env.local` with placeholder variables
- [x] Configure `.gitignore` for environment files

### UI Framework
- [x] Install and configure shadcn/ui
  ```bash
  npx shadcn-ui@latest init
  ```
- [x] Install base components: Button, Input, Card, Form, Dialog, Toast
- [x] Set up Tailwind CSS custom theme (colors, fonts)
- [x] Create base layout component with responsive container
- [x] Add Inter font via `next/font`

### Development Tools
- [x] Configure ESLint with strict rules
- [ ] Set up Prettier with Tailwind plugin
- [ ] Add husky + lint-staged for pre-commit hooks
- [ ] Create VS Code workspace settings

---

## 2. Supabase Configuration

### Project Setup
- [x] Create new Supabase project for KnearMe
- [x] Note project URL and anon key
- [x] Configure environment variables:
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  ```

### Database Schema
- [x] Create `contractors` table
  ```sql
  CREATE TABLE contractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    business_name TEXT,
    city TEXT,
    state TEXT,
    city_slug TEXT,
    services TEXT[],
    service_areas TEXT[],
    description TEXT,
    profile_photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [x] Create `projects` table
  ```sql
  CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
    title TEXT,
    description TEXT,
    project_type TEXT,
    project_type_slug TEXT,
    materials TEXT[],
    techniques TEXT[],
    city TEXT,
    city_slug TEXT,
    duration TEXT,
    status TEXT DEFAULT 'draft',
    slug TEXT UNIQUE,
    seo_title TEXT,
    seo_description TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
  );
  ```
- [x] Create `project_images` table
  ```sql
  CREATE TABLE project_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    image_type TEXT,
    alt_text TEXT,
    display_order INT DEFAULT 0,
    width INT,
    height INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [x] Create `interview_sessions` table
  ```sql
  CREATE TABLE interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    questions JSONB,
    image_analysis JSONB,
    raw_transcripts TEXT[],
    generated_content JSONB,
    status TEXT DEFAULT 'in_progress',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [x] Create indexes for common queries
- [x] Set up `updated_at` trigger function

### Row Level Security (RLS)
- [x] Enable RLS on all tables
- [x] Create policy: contractors can only see their own data
- [x] Create policy: contractors can only manage their own projects
- [x] Create policy: published projects are publicly readable
- [x] Create policy: published contractor profiles are readable
- [ ] Test RLS policies with different user contexts

### Storage Buckets
- [x] Create `profile-images` bucket (public)
- [x] Create `project-images` bucket (public)
- [x] Configure storage policies for authenticated uploads
- [ ] Set up image transformation rules (if using Supabase Image Transforms)

---

## 3. Authentication

### Supabase Auth Setup
- [x] Configure email/password auth in Supabase dashboard
- [ ] Customize email templates (verification, password reset)
- [x] Set up redirect URLs for auth callbacks
- [x] Configure session duration (7 days)

### Auth Callback Route
- [x] Create `/app/auth/callback/route.ts`
  ```typescript
  // Handle OAuth and magic link callbacks
  // Exchange code for session
  // Redirect to appropriate page
  ```

### Client-Side Auth
- [x] Create Supabase browser client (`lib/supabase/client.ts`)
- [x] Create Supabase server client (`lib/supabase/server.ts`)
- [ ] Create auth context provider
- [ ] Create `useAuth` hook for auth state

### Signup Flow (US-001-01)
- [x] Create `/app/(auth)/signup/page.tsx`
- [x] Build signup form with email/password validation
- [ ] Implement password strength indicator
- [x] Handle signup submission with Supabase Auth
- [x] Show success message with verification instruction
- [x] Handle "email already registered" error
- [x] Add link to login page

### Login Flow (US-001-03)
- [x] Create `/app/(auth)/login/page.tsx`
- [x] Build login form with email/password
- [ ] Implement "remember me" option
- [x] Handle login submission
- [x] Redirect to dashboard on success
- [x] Show appropriate error messages
- [x] Add "Forgot password?" link
- [x] Add link to signup page

### Password Reset (US-001-04)
- [x] Create `/app/(auth)/reset-password/page.tsx`
- [x] Build email input form
- [x] Create `/app/(auth)/reset-password/confirm/page.tsx`
- [x] Build new password form
- [x] Handle reset flow with Supabase Auth

### Session Management (US-001-08)
- [x] Create middleware for protected routes (`middleware.ts`)
- [x] Implement session refresh logic
- [x] Create logout functionality
- [ ] Handle session expiry gracefully

### Google OAuth (US-001-09) - Should Have
- [ ] Configure Google OAuth in Supabase
- [ ] Add "Continue with Google" button
- [ ] Handle OAuth callback
- [ ] Sync profile data from Google

---

## 4. Profile Setup

### Profile Setup Flow (US-001-05, US-001-06, US-001-07)
- [x] Create `/app/(dashboard)/profile/setup/page.tsx`
- [x] Build multi-step form wizard component
- [x] Step 1: Business Info
  - [x] Business name input (required)
  - [x] City input (required)
  - [x] State select dropdown (required)
  - [x] Profile photo upload (optional)
  - [x] Business description textarea (optional)
- [x] Step 2: Services Selection
  - [x] Create service options list
  - [x] Build checkbox multi-select with icons
  - [x] Validate at least one service selected
- [x] Step 3: Service Areas
  - [x] Create chip input component
  - [x] Allow adding up to 20 areas
  - [x] Show added areas as removable chips
- [x] Progress indicator component
- [x] Save progress between steps
- [x] Final confirmation and redirect to dashboard

### Profile Data
- [x] Create contractor profile API route
- [x] Implement profile update logic
- [x] Generate `city_slug` from city + state
- [x] Handle profile photo upload to Supabase Storage

---

## 5. Basic Dashboard

### Dashboard Layout
- [x] Create `/app/(dashboard)/dashboard/page.tsx`
- [x] Build dashboard shell with sidebar navigation
- [x] Create responsive header with user menu
- [x] Implement logout functionality

### Dashboard Overview (US-004-09)
- [x] Show welcome message with business name
- [x] Display project counts (published, drafts)
- [x] Show recent projects list (last 5)
- [x] Add "Create New Project" CTA button
- [x] Handle empty state for new users

### Protected Route Wrapper
- [x] Create layout for `(contractor)` routes
- [x] Verify authentication in layout
- [x] Redirect unauthenticated users to login
- [x] Check profile completion, redirect if needed

---

## 6. API Routes Foundation

### Health Check
- [x] Create `/app/api/health/route.ts`
- [x] Return status and version info

### Contractor API
- [x] Create `/app/api/contractors/me/route.ts` (GET, PATCH)
- [x] Create `/app/api/contractors/[slug]/route.ts` (GET - public)

### Error Handling
- [x] Create standardized API error responses
- [x] Implement request validation with Zod
- [ ] Set up error logging

---

## 7. Testing & Quality

### Testing Setup
- [ ] Install and configure Vitest
- [ ] Set up testing utilities
- [ ] Create first unit tests for utilities
- [ ] Install Playwright for E2E tests

### Quality Checks
- [ ] Verify TypeScript has no errors
- [ ] Run ESLint, fix all issues
- [ ] Test auth flows manually
- [ ] Test RLS policies
- [ ] Verify mobile responsiveness

---

## Definition of Done

- [x] All auth flows working (signup, login, reset, logout)
- [x] Profile setup wizard complete
- [x] Dashboard loads with user data
- [ ] RLS policies tested and secure
- [x] No TypeScript errors
- [x] Mobile responsive
- [ ] Basic E2E test passing

---

## Notes

- Focus on functionality over polish in this sprint
- Use shadcn/ui defaults, customize styling in Sprint 5
- Keep components simple, refactor later as patterns emerge
