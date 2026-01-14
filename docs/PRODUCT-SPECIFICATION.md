# KnearMe Product Specification Plan

## Overview

**Product:** AI-powered project portfolio platform for masonry contractors
**Vision:** "Instagram meets Dribbble for masonry—every job becomes a portfolio showcase"
**Core Value:** Contractors post in 30 seconds, AI does the content creation

---

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Codebase** | Start fresh | Clean architecture, no technical debt |
| **Interface** | PWA first, native later | Faster to MVP, validate before native investment |
| **MVP Scope** | AI Interview only | Validate core flow before integrations |
| **Launch Market** | Local city | Easier recruitment, in-person onboarding |
| **AI Input** | Voice-first + text fallback | Optimized for contractors on-the-go |
| **Edit Control** | Guided editing | AI highlights editable sections |
| **Tech Stack** | TBD (architect recommendation) | Based on requirements analysis |

---

## Specification Areas to Flesh Out

### 1. Information Architecture & Data Models

**Status:** Needs specification

**What to define:**
- Core entities: Projects, Contractors, Locations, Categories, Materials
- Relationships between entities
- Database schema design
- Content taxonomy (project types, materials, techniques)

**Key decisions:**
- [ ] How granular should project categories be? (e.g., "chimney" vs "chimney repair" vs "chimney rebuild")
- [ ] How to handle multi-location contractors?
- [ ] What metadata is required vs optional for projects?

---

### 2. URL Architecture & SEO Structure

**Status:** Researched (SEO subagent complete)

**Recommended structure:**
```
/[city]/masonry/[project-type]/[project-slug]
Example: /boston/masonry/chimney-repair/historic-brownstone-rebuild-2024

/contractors/[business-name-city]
Example: /contractors/heritage-masonry-boston

/[city]/masonry/
Example: /boston/masonry/ (city hub page)
```

**Key decisions:**
- [ ] Single domain or subdomains per city?
- [ ] How to handle contractors serving multiple cities?
- [ ] When to auto-generate city/category pages? (Threshold: 10+ projects OR 3+ contractors)

---

### 3. User Flows & UX Specifications

**Status:** Needs detailed wireframes

#### Flow A: Contractor Onboarding
```
Landing → Sign Up → Connect Jobber (optional) → Add First Project → Profile Live
```

#### Flow B: AI Interview (Project Creation)
```
Upload Photos → AI Analyzes → AI Asks 3-5 Questions → Voice/Text Response
→ AI Generates Write-up → Contractor Reviews → Approve/Edit → Published
```

#### Flow C: Jobber Integration (Auto-Creation)
```
Job Marked Complete in Jobber → Webhook Fires → AI Generates Showcase
→ Push Notification → Contractor Approves → Published
```

#### Flow D: Homeowner Discovery
```
Search/Browse → Filter by Location/Type → View Project → View Contractor Profile
→ Contact Contractor
```

**Key decisions:**
- [ ] Mobile-first or responsive web?
- [ ] Native app or PWA?
- [ ] SMS-based flow or app-only?

---

### 4. AI System Design

**Status:** Needs specification

**Components to define:**

#### 4.1 Image Analysis System
- Input: 1-10 photos from contractor
- Output: Project type guess, materials detected, before/after classification
- Tech: GPT-4V or Claude Vision

#### 4.2 Conversational Interview System
- Input: Photos + contractor voice/text responses
- Output: Professional project description (400-600 words)
- Behavior: 3-5 questions, voice-first, smart defaults

#### 4.3 Auto-Generation System (Jobber Integration)
- Input: Job data (type, location, notes, photos) from Jobber API
- Output: Draft project showcase
- Behavior: Generate without interview, contractor approves

#### 4.4 SEO Content Optimization
- Ensure descriptions include: location, project type, materials, techniques
- Generate structured data (Schema.org)
- Create SEO-optimized titles

**Key decisions:**
- [ ] Which AI provider? (OpenAI vs Anthropic vs both)
- [ ] Voice transcription provider? (Whisper vs Deepgram)
- [ ] How to handle AI errors/hallucinations?
- [ ] Content moderation approach?

---

### 5. Integration Architecture

**Status:** Needs specification

#### 5.1 Jobber Integration
- Auth: OAuth 2.0
- Trigger: "New Job Completion" webhook
- Data: Job type, photos, location, technician notes
- Approach: Zapier first, then native API

#### 5.2 ServiceTitan Integration (Phase 2)
- V2 APIs with open access
- Similar flow to Jobber

#### 5.3 Housecall Pro Integration (Phase 2)
- API available via Pipedream
- Similar flow

#### 5.4 Social Media Cross-Posting (Phase 3)
- Instagram API (Business accounts)
- Facebook Pages API
- One-tap cross-post from approved project

**Key decisions:**
- [ ] Start with Zapier or build native integration?
- [ ] How to handle photo sync from job management systems?
- [ ] Rate limiting and error handling strategy?

---

### 6. Technical Architecture

**Status:** Needs specification

**Frontend:**
- Framework: React/Next.js or Astro?
- UI: shadcn/ui + Tailwind
- State: TanStack Query
- Mobile: PWA or React Native?

**Backend:**
- API: Node.js/Express or Edge Functions?
- Database: Supabase PostgreSQL
- Storage: Supabase Storage (images)
- Auth: Supabase Auth

**AI Pipeline:**
- Image Analysis: GPT-4V/Claude Vision
- Text Generation: GPT-4/Claude
- Voice: Whisper/Deepgram
- Queue: Background jobs for generation

**Infrastructure:**
- Hosting: Vercel/Cloudflare
- CDN: For image delivery
- Monitoring: Error tracking, analytics

**Key decisions:**
- [ ] Leverage existing knearme-supabase codebase or start fresh?
- [ ] Monorepo or separate services?
- [ ] Edge functions or traditional backend?

---

### 7. SEO Implementation Details

**Status:** Researched (from SEO subagent)

#### 7.1 Structured Data (Schema.org)
- Project pages: ImageObject + HowTo + LocalBusiness
- Contractor profiles: LocalBusiness + AggregateRating
- Category pages: ItemList

#### 7.2 Image Optimization
- Format: WebP primary, JPEG fallback
- Sizes: Thumbnail 400x300 (<30KB), Medium 1200x900 (<150KB), Full 2400x1800 (<400KB)
- Alt text formula: "[What's in image] - [Context] - [Location]"

#### 7.3 Core Web Vitals Targets
- LCP: ≤ 2.5s
- INP: ≤ 200ms
- CLS: ≤ 0.1

#### 7.4 Content Requirements
- Project descriptions: 400-600 words
- Structure: Problem → Solution → Results → Location context
- Keywords: Location + project type + materials

---

### 8. Content Taxonomy

**Status:** Needs specification

#### 8.1 Project Types (Masonry)
```
- Chimney
  - Chimney Repair
  - Chimney Rebuild
  - Chimney Liner
  - Chimney Cap
- Brick Work
  - Tuckpointing
  - Brick Repair
  - Brick Replacement
- Stone Work
  - Retaining Walls
  - Stone Veneer
  - Stone Steps
- Concrete
  - Foundation Repair
  - Concrete Steps
  - Decorative Concrete
- Restoration
  - Historic Restoration
  - Waterproofing
```

#### 8.2 Materials
- Brick (various types)
- Stone (limestone, granite, sandstone, etc.)
- Concrete
- Mortar types (lime, portland, etc.)

#### 8.3 Techniques
- Tuckpointing
- Repointing
- Flashing
- Waterproofing
- Dry-stack
- Wet-set

---

### 9. Pricing & Monetization

**Status:** Draft exists, needs validation

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 3 projects/month, basic portfolio, KnearMe branding |
| Pro | $29/mo | Unlimited projects, Jobber integration, remove branding |
| Business | $79/mo | Team accounts, analytics, priority support, API access |

**Key decisions:**
- [ ] Free tier limits?
- [ ] Trial period for Pro?
- [ ] Annual discount?

---

### 10. MVP Scope Definition

**Status:** FINALIZED

#### MVP Must-Haves (Phase 1) - 4-6 weeks

**Contractor Side:**
- [ ] Contractor signup/auth (Supabase Auth - email/password)
- [ ] Basic profile setup (business name, city, services)
- [ ] Photo upload (multi-photo, from camera or gallery)
- [ ] AI image analysis (detect project type, materials)
- [ ] AI interview flow (3-5 questions, voice-first)
- [ ] Voice transcription (Whisper API)
- [ ] AI-generated project showcase (400-600 words)
- [ ] Guided editing (editable: title, description, tags)
- [ ] One-tap publish
- [ ] Portfolio page (all projects, filterable)

**Public/SEO Side:**
- [ ] SEO-optimized project URLs (/[city]/masonry/[type]/[slug])
- [ ] Project detail pages with Schema.org markup
- [ ] Contractor profile pages
- [ ] Mobile-responsive PWA
- [ ] Core Web Vitals optimized (LCP < 2.5s)
- [ ] Image optimization pipeline (WebP, responsive sizes)

**Infrastructure:**
- [ ] Supabase PostgreSQL database
- [ ] Supabase Storage for images
- [ ] AI pipeline (OpenAI GPT-4V + GPT-4)
- [ ] Background job queue for generation
- [ ] Error tracking and monitoring

#### MVP Explicitly NOT Included
- ❌ Jobber/ServiceTitan integration (Phase 2)
- ❌ Homeowner accounts/browse (Phase 2)
- ❌ Contact contractor form (Phase 2)
- ❌ Social media cross-posting (Phase 3)
- ❌ Analytics dashboard (Phase 3)
- ❌ Native mobile app (Phase 3)

#### Post-MVP Phases

**Phase 2 (Month 2-3):**
- Jobber integration via Zapier
- Homeowner browse/search interface
- Contact contractor flow
- Basic analytics (views, contacts)

**Phase 3 (Month 4-6):**
- ServiceTitan/Housecall Pro integrations
- Social media cross-posting
- Team accounts
- Native mobile app (if validated)

---

## Questions to Resolve

### Architecture Questions
1. Build on existing knearme-supabase codebase or start fresh?
2. Mobile app (React Native) vs PWA vs mobile web?
3. Single Next.js app or separate frontend/backend?

### UX Questions
1. SMS-based flow as alternative to app?
2. How much editing control for contractors on AI output?
3. Should homeowners create accounts or anonymous browse?

### Business Questions
1. Launch in one city or multiple?
2. Which job management platform to prioritize?
3. Free tier limits (3 projects? 5? Unlimited with branding?)

### AI Questions
1. Voice-only interview option or always include text?
2. How to handle projects AI can't categorize?
3. Human review for first N posts per contractor?

---

## Architect Recommendation: Tech Stack

Based on requirements (PWA, voice-first, SEO-critical, AI-heavy), I recommend:

### Frontend: Next.js 14 (App Router)

**Why Next.js over alternatives:**
- **Server Components** - SEO-critical pages pre-rendered
- **API Routes** - Backend in same codebase (faster MVP)
- **Image Optimization** - Built-in next/image for WebP, srcset
- **PWA Support** - next-pwa plugin well-maintained
- **Voice/Media** - Good Web Audio API support

**Why not Astro:** Great for static content, but the AI interview flow needs rich interactivity. Astro islands would add complexity.

**Why not Remix:** Excellent choice, but Next.js has larger ecosystem and easier Vercel deployment.

### Backend: Supabase

- **Auth** - Email/password, social login ready
- **Database** - PostgreSQL with Row Level Security
- **Storage** - Images with CDN, signed URLs
- **Realtime** - For future features (live updates)
- **Edge Functions** - For AI pipeline if needed

### AI Pipeline

- **Image Analysis:** OpenAI GPT-4V (best for construction photos)
- **Text Generation:** OpenAI GPT-4o (fast, cost-effective)
- **Voice Transcription:** OpenAI Whisper API (accurate, simple)
- **Queue:** Supabase Edge Functions + pg_cron or Inngest

### Hosting

- **Vercel** - Seamless Next.js deployment
- **Supabase** - Managed backend
- **Cloudflare** - CDN for images (optional optimization)

---

## Database Schema (MVP)

```sql
-- Contractors (users)
contractors (
  id uuid PRIMARY KEY,
  email text UNIQUE,
  business_name text,
  city text,
  state text,
  city_slug text,
  services text[], -- array of service types
  created_at timestamp,
  updated_at timestamp
)

-- Projects
projects (
  id uuid PRIMARY KEY,
  contractor_id uuid REFERENCES contractors,
  title text,
  description text, -- AI-generated, 400-600 words
  project_type text, -- chimney-repair, retaining-wall, etc.
  project_type_slug text,
  materials text[],
  techniques text[],
  city text,
  city_slug text,
  duration text, -- "3 days", "1 week", etc.
  status text, -- draft, published, archived
  slug text UNIQUE,
  seo_title text,
  seo_description text,
  created_at timestamp,
  published_at timestamp
)

-- Project Images
project_images (
  id uuid PRIMARY KEY,
  project_id uuid REFERENCES projects,
  storage_path text,
  image_type text, -- before, after, process
  alt_text text,
  display_order int,
  width int,
  height int,
  created_at timestamp
)

-- AI Interview Sessions
interview_sessions (
  id uuid PRIMARY KEY,
  project_id uuid REFERENCES projects,
  questions jsonb, -- [{question, answer, voice_url}]
  image_analysis jsonb, -- AI detected types, materials
  raw_transcripts text[],
  generated_content jsonb, -- AI output before approval
  status text, -- in_progress, completed, approved
  created_at timestamp
)

-- Categories (lookup)
categories (
  id uuid PRIMARY KEY,
  name text,
  slug text UNIQUE,
  parent_id uuid REFERENCES categories,
  seo_title text,
  seo_description text
)
```

---

## AI Interview Flow (Detailed)

### Step 1: Photo Upload
```
User uploads 1-10 photos
↓
AI Vision analyzes all photos:
- Detect project type (chimney, retaining wall, etc.)
- Identify materials (brick, stone, concrete)
- Classify as before/after/process
- Extract location from EXIF if available
```

### Step 2: Confirm Detection
```
AI: "Looks like a chimney rebuild with red brick. Is that right?"

[Yes, that's right] [No, let me describe it]

If No → Text input for project type
```

### Step 3: Interview Questions (Voice-First)
```
Q1: "What was the problem the customer had?"
    🎤 [Hold to speak] or [Type instead]

Q2: "How did you solve it?"
    🎤 [Hold to speak] or [Type instead]

Q3: "Anything special about this job?"
    🎤 [Hold to speak] or [Skip]

Q4: "How long did it take?"
    Quick select: [1 day] [2-3 days] [4-5 days] [1 week+]
```

### Step 4: AI Generation
```
Processing... (5-10 seconds)
↓
AI generates:
- Title: "Historic Brick Chimney Rebuild in [City]"
- Description: 400-600 words
- Tags: #masonry #chimney #[city] #brickwork
- SEO meta description
```

### Step 5: Guided Editing
```
┌─────────────────────────────────────────┐
│  📝 Your Project Showcase               │
│                                         │
│  Title: [Editable field]                │
│  "Historic Brick Chimney Rebuild..."    │
│                                         │
│  Description: [Editable rich text]      │
│  "This 1920s chimney had seen better    │
│   days—the mortar was crumbling..."     │
│                                         │
│  Tags: [Editable chips]                 │
│  #masonry #chimney #boston #brickwork   │
│                                         │
│  [Regenerate] [Approve & Publish]       │
└─────────────────────────────────────────┘
```

---

## Implementation Plan (4-6 Weeks)

### Week 1: Foundation
- [ ] Next.js project setup with TypeScript
- [ ] Supabase project + database schema
- [ ] Auth flow (signup, login, profile)
- [ ] Basic UI components (shadcn/ui)
- [ ] Image upload to Supabase Storage

### Week 2: AI Pipeline
- [ ] GPT-4V image analysis integration
- [ ] Whisper voice transcription
- [ ] Interview question flow (state machine)
- [ ] GPT-4 content generation prompts
- [ ] Background job processing

### Week 3: Core UX
- [ ] Photo upload experience (camera + gallery)
- [ ] Voice recording UI (hold-to-talk)
- [ ] AI interview conversation flow
- [ ] Guided editing interface
- [ ] Publish flow

### Week 4: Portfolio & SEO
- [ ] Contractor profile page
- [ ] Project detail pages
- [ ] SEO URL generation
- [ ] Schema.org structured data
- [ ] Image optimization pipeline
- [ ] PWA manifest + service worker

### Week 5: Polish & Launch Prep
- [ ] Error handling + edge cases
- [ ] Loading states + optimistic UI
- [ ] Core Web Vitals optimization
- [ ] Mobile testing
- [ ] Analytics setup

### Week 6: Soft Launch
- [ ] Deploy to production
- [ ] Onboard 5-10 local contractors
- [ ] Gather feedback
- [ ] Iterate on friction points

---

## Files to Create (New Repo Structure)

```
knearme-portfolio/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── projects/
│   │   │   ├── new/              # AI interview flow
│   │   │   └── [id]/edit/
│   │   └── profile/
│   ├── (marketing)/
│   │   ├── (home)/               # Landing page
│   │   ├── blog/
│   │   ├── learn/
│   │   ├── services/
│   │   ├── tools/
│   │   ├── about/
│   │   ├── contact/
│   │   └── examples/
│   ├── (portfolio)/
│   │   ├── [city]/
│   │   │   └── masonry/
│   │   │       └── [type]/
│   │   │           └── [slug]/   # Project detail
│   │   ├── businesses/
│   │   │   └── [city]/[slug]/    # Business profile
│   │   └── contractors/          # Legacy routes (redirects)
│   │       └── [city]/[slug]/
│   ├── (payload)/                # CMS admin
│   ├── api/
│   │   ├── ai/
│   │   │   ├── analyze-images/
│   │   │   ├── transcribe/
│   │   │   └── generate/
│   │   ├── projects/
│   │   └── upload/
│   └── layout.tsx
├── components/
│   ├── ui/                       # shadcn/ui
│   ├── interview/                # AI interview components
│   ├── portfolio/                # Project display
│   └── editor/                   # Guided editing
├── lib/
│   ├── supabase/
│   ├── ai/
│   │   ├── vision.ts
│   │   ├── whisper.ts
│   │   └── generate.ts
│   ├── seo/
│   └── utils/
├── types/
└── public/
```

---

## Success Metrics (MVP)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Contractor signups | 20 in first month | Supabase auth |
| Projects published | 100 in first month | Database count |
| Time to publish | < 3 minutes avg | Analytics events |
| Approval rate | > 80% first-try | Track regenerations |
| Mobile usage | > 70% | User agent analytics |

---

## Open Questions (For Implementation)

1. **Voice Recording:** Use browser MediaRecorder API or third-party SDK?
2. **AI Fallback:** What if GPT-4V can't detect project type?
3. **Content Policy:** How to handle inappropriate content?
4. **Rate Limits:** How many projects per day per free user?
5. **Image Limits:** Max photos per project? Max file size?
