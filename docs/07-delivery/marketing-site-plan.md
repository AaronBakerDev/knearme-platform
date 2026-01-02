# Marketing Site & SEO Implementation Plan

> **Based on:** `docs/01-vision/vision.md`, `docs/02-requirements/user-journeys.md` (J1), and `docs/02-requirements/epics/EPIC-005-seo.md`.

## Overview

The "Marketing Part" of KnearMe serves two distinct audiences effectively:
1.  **Businesses (Primary for MVP):** The **Landing Page** (`/`) must convert visitors into signups by promising effortless portfolio building.
2.  **Clients (Secondary/SEO):** The **Project Pages** (`/[city]/masonry/...`) and **Business Profiles** (`/businesses/[city]/[slug]`) act as landing pages for organic search traffic.

This plan focuses on implementing the **Business Acquisition Landing Page** and the **SEO Infrastructure** required to make the platform discoverable.

---

## Phase 1: Landing Page (Business Acquisition)
**Target Audience:** "Mike the Mason"
**Goal:** Convert visitors to Signups (Start Free).

### 1.1 Page Structure (`src/app/page.tsx`)
Based on `user-journeys.md` Screen 1.

#### Sections
1.  **Hero Section**
    -   **Headline:** "Build Your Portfolio in 30 Seconds Per Project"
    -   **Subhead:** "Upload photos, answer a few questions by voice, and AI does the rest."
    -   **CTA:** "Get Started Free" (Links to `/signup`)
    -   **Visual:** Split screen or hero image showing "Before -> After" transformation or the mobile app UI.

2.  **How It Works (The "Magic" Flow)**
    -   Visual breakdown of the 4 steps:
        1.  📸 **Upload** (Snap photos)
        2.  🎤 **Voice** (Speak to the app)
        3.  ✨ **AI** (Generates content)
        4.  ✅ **Publish** (Live portfolio)

3.  **Value Proposition Grid**
    -   "No typing required"
    -   "SEO optimized automatically"
    -   "Look professional instantly"

4.  **Social Proof / Trust**
    -   "Trusted by [X]+ Businesses"
    -   Testimonial carousel (optional for MVP, use placeholders if needed).

5.  **CTA Footer**
    -   "Ready to showcase your work?"
    -   Secondary "Get Started" button.

### 1.2 Components to Build
-   `src/components/marketing/HeroSection.tsx`
-   `src/components/marketing/FeatureGrid.tsx`
-   `src/components/marketing/HowItWorks.tsx`
-   `src/components/marketing/TrustBar.tsx`
-   `src/components/ui/cta-button.tsx` (High contrast, large touch target)

---

## Phase 2: SEO Infrastructure
**Target Audience:** Google Search Bot
**Goal:** Index all published projects and profiles.

### 2.1 Metadata Strategy (`EPIC-005-seo.md`)
Implement Next.js Metadata API in `layout.tsx` and dynamic pages.

-   **Global Metadata (`src/app/layout.tsx`)**:
    -   Default title: "KnearMe | Masonry Portfolio Platform"
    -   Default OG Image.
    -   Canonical URL formatting.

-   **Dynamic Metadata**:
    -   **Project Page**: `src/app/(public)/[city]/masonry/[type]/[slug]/page.tsx`
    -   **Profile Page**: `src/app/(public)/businesses/[city]/[slug]/page.tsx`
    -   *Action*: Implement `generateMetadata()` fetching real data from Supabase.

### 2.2 Structured Data (JSON-LD)
Implement `Script` tags with JSON-LD in dynamic pages.

-   **Project Page**: `Article` type, `ImageGallery`.
-   **Profile Page**: `LocalBusiness` type.
-   *Helper*: Create `src/lib/seo/schema-generator.ts` to map DB types to Schema.org objects.

### 2.3 Sitemap & Robots
-   **Robots.txt**: `src/app/robots.ts`
    -   Allow `/`
    -   Disallow `/dashboard`, `/api`
-   **Sitemap**: `src/app/sitemap.ts`
    -   Fetch all `published` projects.
    -   Fetch all active businesses (contractors table).
    -   Generate XML URLs dynamically.

---

## Phase 3: Public Page Layouts
Although part of "Product", these are marketing pages for the businesses.

-   **Layout**: `src/app/(public)/layout.tsx`
    -   **Header**: "KnearMe" Logo (Home link), "For Businesses" (CTA).
    -   **Footer**: Links to About, Terms, Privacy, "Build Your Portfolio".

---

## Execution Checklist
 
 ### Marketing Home
 - [x] Design & Build `HeroSection`
 - [x] Design & Build `HowItWorks` section
 - [x] Assemble `src/app/page.tsx`
 - [x] Add analytics events to "Get Started" buttons (Partially - buttons exist)
 
 ### SEO Engine
 - [x] Implement `robots.ts`
 - [x] Implement `sitemap.ts` (Dynamic fetching)
 - [x] Create `SchemaGenerator` utility (`src/lib/seo/structured-data.ts`)
 - [ ] Add `generateMetadata` to Project Page
 - [ ] Add `generateMetadata` to Contractor Profile Page
