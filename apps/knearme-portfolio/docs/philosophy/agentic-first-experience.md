# Agentic-First Experience: Complete UX & Data Model Vision

> **Core Belief:** The conversation IS the interface. Forms are fallbacks, not defaults.

---

## Table of Contents

1. [The Vision](#the-vision)
2. [Current State Problems](#current-state-problems)
3. [Agentic UX Journey](#agentic-ux-journey)
4. [Business Discovery Tools](#business-discovery-tools)
5. [Data Model Redesign](#data-model-redesign)
6. [UI Patterns](#ui-patterns)
7. [Agent-Driven Features](#agent-driven-features)
8. [Implementation Approach](#implementation-approach)

---

## The Vision

### From This (Current)
```
Signup → Form Wizard → Dashboard → Project Wizard → Forms → Publish
   ↓          ↓            ↓            ↓           ↓
  Email    3 steps      Fixed UI     6 steps    Edit tabs
```

### To This (Agentic)
```
Signup → Conversation → Conversation → Conversation → Publish
   ↓          ↓              ↓              ↓
  Email   "Tell me       "Show me        "Looks
         about your     your work"       good!"
         business"
```

**The entire experience is a conversation with agents who:**
- Discover what the business does
- Learn their vocabulary and voice
- Extract portfolio content naturally
- Compose presentations that fit their work
- Guide them to publishing

---

## Current State Problems

### 1. Onboarding is a Form Wizard

**Current Flow:**
```
Step 1: Business Name, City, State, Description
Step 2: Select Services (13 masonry checkboxes)
Step 3: Add Service Areas (manual text entry)
→ PATCH /api/contractors/me
→ Redirect to Dashboard
```

**Problems:**
- Forces users through 3 linear steps
- Assumes they know their "services" upfront
- No discovery of what makes their business special
- No learning of their vocabulary or voice
- Completion gated on 3 specific fields

### 2. Project Creation is a Wizard

**Current Flow:**
```
Step 1: Upload Photos (required)
Step 2: Image Analysis (AI)
Step 3: Voice Interview (5 questions)
Step 4: Content Generation (AI)
Step 5: Review & Edit
Step 6: Publish
```

**Problems:**
- 6 prescribed steps
- Assumes before/after photo workflow
- Fixed interview questions
- Masonry-specific extraction
- Linear progression required

### 3. Dashboard Assumes Fixed Structure

**Current Elements:**
- Stats strip (live/draft counts)
- Project grid (4:3 thumbnails)
- "Document Your Next Project" CTA
- Terracotta/craftsman aesthetic

**Problems:**
- Same layout for all business types
- Masonry-specific messaging
- No adaptation to business needs
- Fixed metrics (just project counts)

### 4. Data Model is Trade-Specific

**Rigid Columns:**
- `materials[]`, `techniques[]` - masonry concepts
- `client_type` enum - construction clients
- `budget_range` enum - construction budgets
- `image_type` enum - before/after/progress/detail

**Problems:**
- Column names assume masonry
- Enums don't fit other businesses
- URL structure hardcodes `/masonry/`

---

## Agentic UX Journey

### Phase 1: First Contact

**Current:** Email signup → Verification → Form wizard

**Agentic:**
```
Email signup → Verification → Conversation

Agent: "Welcome! I'm here to help you showcase your work.
       Tell me a bit about what you do."

User: "I'm a custom furniture maker in Denver"

Agent: "Nice! Custom furniture is such personal work.
       What kinds of pieces do you make most often?"

User: "Mostly dining tables and built-in shelving,
       but I do some commission work too"

Agent: [Extracts: trade=furniture, location=Denver,
        specialties=[dining tables, built-in shelving, commissions]]

Agent: "Got it. What name do people know your business by?"

User: "Rocky Mountain Woodworks"

Agent: [Extracts: business_name="Rocky Mountain Woodworks"]
       [Profile is now usable - no form required]

Agent: "Perfect. Want to show me a piece you're proud of?
       We can start building your portfolio right now."
```

**Key Differences:**
- Discovery through dialogue, not forms
- Business understanding emerges naturally
- No required fields blocking progress
- Immediate path to value (showing work)

---

## Business Discovery Tools

### The Power of Lookup

Instead of asking users to type their address, phone, and details, **agents can discover this information**.

We have access to DataForSEO's Google Maps and Reviews APIs (via `contractor-review-agent` project):

### Tool 1: Business Search (Google Maps)

**What it does:** Search for a business by name + location

**Returns:**
- Business name, full address
- Phone number, website
- Google rating (0-5 stars)
- Review count
- Business category
- GPS coordinates
- Operating hours
- Whether listing is claimed

**Example Flow:**
```
User: "I'm Rocky Mountain Woodworks"

Agent: [calls getGoogleMapsResults("Rocky Mountain Woodworks Denver")]

       "Found it! Is this you?

        Rocky Mountain Woodworks
        1234 Pine St, Denver, CO 80202
        ⭐ 4.8 (47 reviews)
        rockymountainwoodworks.com"

User: "That's me!"

Agent: [pre-populates profile automatically]
       - name: "Rocky Mountain Woodworks"
       - address: "1234 Pine St, Denver, CO 80202"
       - phone: "(303) 555-1234"
       - website: "rockymountainwoodworks.com"
       - google_rating: 4.8
       - google_reviews: 47

       "Perfect! Your profile is set up. You've got great reviews—
        want me to pull some highlights for your portfolio?"
```

### Tool 2: Review Import (Google Reviews)

**What it does:** Fetch actual reviews for a business

**Returns:**
- Full review text
- Star rating (1-5)
- Reviewer name
- Review date
- Owner responses
- Review images

**Example Flow:**
```
User: "Yeah, show me the reviews"

Agent: [calls getGoogleReviews(cid, "Denver,Colorado,United States")]

       "Here are your top reviews:

        ⭐⭐⭐⭐⭐ 'Incredible craftsmanship. The dining table
        they made for us is a work of art.' - Sarah M.

        ⭐⭐⭐⭐⭐ 'John took the time to understand exactly
        what we wanted. Exceeded expectations.' - Mike R.

        Want me to feature these on your portfolio?"

User: "Yes, use those!"

Agent: [adds testimonials to profile]
       "Done. Now let's add some photos of your work."
```

### Tool Integration Pattern

```typescript
// In Discovery Agent
import { DataForSEOClient } from '@/lib/dataforseo';

const tools = {
  searchBusiness: {
    description: "Search for a business by name and location",
    parameters: {
      query: "Business name and location",
    },
    execute: async ({ query }) => {
      const client = new DataForSEOClient(credentials);
      const { results } = await client.getGoogleMapsResults(query, 2840);
      return results.slice(0, 5);  // Top 5 matches
    }
  },

  getReviews: {
    description: "Fetch Google reviews for a business",
    parameters: {
      cid: "Google CID from search results",
      location: "City, State, Country"
    },
    execute: async ({ cid, location }) => {
      const client = new DataForSEOClient(credentials);
      const { results } = await client.getGoogleReviews(cid, location);
      return results?.reviews?.slice(0, 10);  // Top 10 reviews
    }
  },

  confirmBusiness: {
    description: "Confirm and save business details to profile",
    parameters: {
      businessData: "Business data from search",
      confirmed: "User confirmed this is their business"
    },
    execute: async ({ businessData }) => {
      await updateBusinessProfile(businessData);
      return { success: true, profile: businessData };
    }
  }
};
```

### What This Enables

| Current (Form) | Agentic (Discovery) |
|----------------|---------------------|
| "Enter your business name" | "What's your business called?" |
| "Enter your address" | Agent looks it up |
| "Enter your phone" | Agent looks it up |
| "Enter your website" | Agent looks it up |
| Manual entry of 8+ fields | Confirm one search result |

**Friction reduction:** 8 form fields → 1 confirmation

### Multiple Matches Handling

```
User: "I'm Smith Masonry"

Agent: [finds 3 matches]
       "I found a few businesses with that name:

        1. Smith Masonry LLC - 456 Oak Ave, Denver
           ⭐ 4.9 (89 reviews)

        2. Smith's Masonry & Repair - 789 Elm St, Aurora
           ⭐ 4.5 (23 reviews)

        3. John Smith Masonry - 321 Pine Rd, Lakewood
           ⭐ 4.7 (45 reviews)

        Which one is you?"

User: "The first one"

Agent: [confirms and populates profile]
```

### No Match Handling

```
User: "I'm brand new, just started last month"

Agent: "No problem! Since you're new, let's set up your
        profile from scratch. What's your business name?"

User: "Fresh Start Furniture"

Agent: "Great name! Where are you located?"

[Falls back to conversational discovery]
```

### Source Reference

**Tools available in:** `/Users/aaronbaker/knearme-workspace/contractor-review-agent`

**Key files:**
- `src/lib/dataforseo.ts` - DataForSEO client with both tools
- `src/lib/types.ts` - Type definitions and location codes
- `CLAUDE.md` - Full documentation

**Cost:** ~$0.001 per search, ~$0.00075 per 10 reviews fetched

---

## Agent Toolbox

### Philosophy: Give Agents the Right Tools

Agents are smart. They know how to conduct interviews, extract data, and generate content. But they need **tools** to interact with the world:

- Tools to **discover** (business lookup, image analysis)
- Tools to **persist** (save profiles, save portfolio items)
- Tools to **present** (preview layouts, show progress)
- Tools to **communicate** (ask for confirmation, request images)

### Complete Tool Inventory

#### Discovery Tools
| Tool | Purpose | Source |
|------|---------|--------|
| `searchBusiness` | Find business by name + location | DataForSEO (contractor-review-agent) |
| `getBusinessReviews` | Fetch Google reviews | DataForSEO (contractor-review-agent) |
| `analyzeImages` | Understand uploaded images | Gemini Vision API |
| `detectBusinessType` | Infer business type from context | Agent reasoning |

#### Profile Tools
| Tool | Purpose | Data |
|------|---------|------|
| `confirmBusiness` | Save confirmed business details | From search results |
| `updateProfile` | Update business understanding | From conversation |
| `savePreferences` | Store user preferences | Tone, focus, avoid topics |
| `recordFact` | Remember learned information | Cross-session memory |

#### Portfolio Tools
| Tool | Purpose | Data |
|------|---------|------|
| `createPortfolioItem` | Start new portfolio item | Basic metadata |
| `extractNarrative` | Structure story from conversation | Problem, solution, highlights |
| `categorizeImages` | Organize images by role | Agent-determined categories |
| `generateContent` | Create portfolio text | Title, description, SEO |
| `composeLayout` | Design page layout | Semantic blocks + tokens |
| `updatePortfolioItem` | Modify existing item | Any field |

#### Presentation Tools
| Tool | Purpose | Output |
|------|---------|--------|
| `showPreview` | Display current portfolio state | Live preview panel |
| `showBusinessCard` | Display confirmed business info | Profile summary |
| `showProgress` | Indicate what's complete | Completion status |
| `askConfirmation` | Request user confirmation | Yes/no choice |
| `requestImages` | Ask for image uploads | Upload prompt |
| `suggestNextStep` | Guide user forward | Action buttons |

#### Publishing Tools
| Tool | Purpose | Action |
|------|---------|--------|
| `validateForPublish` | Check if ready | Returns issues or OK |
| `publishItem` | Make item live | Status → published |
| `generateShareLink` | Create shareable URL | Public link |

### Tool Availability by Agent

| Agent | Primary Tools | Can Request From |
|-------|--------------|------------------|
| **Discovery** | searchBusiness, confirmBusiness, updateProfile | - |
| **Story** | extractNarrative, recordFact | Discovery for context |
| **Visual** | analyzeImages, categorizeImages | Story for narrative |
| **Content** | generateContent | Story + Visual for inputs |
| **Layout** | composeLayout, showPreview | Content + Visual for inputs |
| **Quality** | validateForPublish, suggestNextStep | All agents for assessment |

### Tool Design Principles

1. **Tools are capabilities, not commands**
   - Good: "I can search for businesses"
   - Bad: "Search when user says their name"

2. **Agents decide when to use tools**
   - Good: Agent calls `searchBusiness` when it seems helpful
   - Bad: System forces `searchBusiness` after name mentioned

3. **Tools return data, agents interpret**
   - Good: Tool returns search results, agent presents them
   - Bad: Tool decides what to show user

4. **Handoffs are tool-assisted**
   - When Discovery Agent has enough context, it calls `handoff(to: 'story', context: {...})`
   - Receiving agent gets full context

---

### Phase 2: First Portfolio Item

**Current:** Upload photos → Answer questions → Review content

**Agentic:**
```
User: [Uploads 4 photos of a walnut dining table]

Agent: [Visual Agent analyzes]
       "Beautiful piece. I can see the live edge detail and
       those hairpin legs. Tell me about this project."

User: "This was for a couple in Boulder. They wanted
       something that would be a conversation piece for
       dinner parties. Took me about 6 weeks."

Agent: [Story Agent extracts]
       "A conversation piece - I love that framing.
       What made this one special for you?"

User: "The grain on that slab was incredible. I spent
       two days just finding the right one at the mill."

Agent: [Extracts: highlight="grain selection", process="mill sourcing"]

Agent: [Content Agent generates, Layout Agent composes]
       "Here's what I'm thinking for your portfolio page..."
       [Shows preview]

User: "That looks great, but can you mention the
       hand-rubbed oil finish?"

Agent: [Updates content]
       "Done. Ready to publish, or want to add more pieces first?"
```

**Key Differences:**
- Images analyzed contextually (not assuming before/after)
- Story extracted through natural conversation
- User's words become the content voice
- Preview is collaborative, not final review step
- Publishing is casual, not ceremonial

---

### Phase 3: Ongoing Relationship

**Current:** Dashboard with static project list

**Agentic:**
```
[User returns after 2 weeks]

Agent: "Hey! I noticed you added that walnut table.
       Got any new pieces to show off?"

User: "Actually yeah, just finished a bookcase"

Agent: "Let's see it!"

[OR]

Agent: "Your table page has been getting some attention.
       Three people viewed it from Boulder searches.
       Want me to help you add more pieces to strengthen
       your Denver presence?"

[OR]

User: "I want to update my business description"

Agent: "Sure, what's changed?"

User: "I'm now doing more commission work than production pieces"

Agent: [Updates profile, adjusts content voice]
       "Got it. Want me to update your existing portfolio
       descriptions to emphasize the commission angle?"
```

**Key Differences:**
- Agent maintains relationship context
- Proactive suggestions based on activity
- Profile updates through conversation
- Content evolution, not static pages

---

### Phase 4: Multi-Project Portfolio

**Current:** Project list with filters

**Agentic:**
```
User: "I want to organize my portfolio better"

Agent: "You've got 8 pieces now. I could organize them by:
       - Type (tables, shelving, commissions)
       - Style (modern, rustic, mixed)
       - Or just your favorites up front

       What feels right for your business?"

User: "Let's do type, but put my best work first in each"

Agent: [Layout Agent recomposes]
       "Done. I put the walnut table first in Tables,
       and that floating shelf system first in Built-ins.
       Take a look."

[OR]

User: "A customer wants to see all my table work"

Agent: "Here's a shareable link to just your tables:
       rockymountainwoodworks.knearme.co/tables

       Want me to add anything specific for this customer?"
```

**Key Differences:**
- Organization through dialogue
- Agent suggests based on content understanding
- Dynamic views, not fixed portfolio structure
- Context-aware sharing

---

## Data Model Redesign

### Principle: Schema-Free Where Possible

The current model has ~40% rigid structure (enums, fixed columns) and ~60% flexible (JSONB, arrays). We need to flip this.

### Current Schema (Simplified)

```sql
-- contractors table
business_name TEXT
city TEXT
state TEXT
services TEXT[]           -- Masonry services
service_areas TEXT[]

-- projects table
title TEXT
description TEXT
project_type TEXT         -- "Chimney Rebuild"
project_type_slug TEXT    -- "chimney-rebuild"
materials TEXT[]          -- Masonry materials
techniques TEXT[]         -- Masonry techniques
client_type ENUM          -- residential/commercial/municipal
budget_range ENUM         -- <5k/5k-10k/etc
image_type ENUM           -- before/after/progress/detail
```

### Agentic Schema

```sql
-- businesses table (renamed from contractors)
CREATE TABLE businesses (
  id UUID PRIMARY KEY,
  auth_user_id UUID UNIQUE,

  -- Core identity (discovered through conversation)
  name TEXT,
  location JSONB,         -- {city, state, neighborhood, service_radius}

  -- Business understanding (agent-discovered)
  understanding JSONB,    -- {
                          --   type: "furniture_maker",
                          --   vocabulary: {work: "pieces", clients: "customers"},
                          --   voice: "warm, personal, craft-focused",
                          --   specialties: ["dining tables", "built-ins"],
                          --   differentiators: ["live edge", "local wood"]
                          -- }

  -- Agent memory
  context JSONB,          -- {
                          --   facts: [...],
                          --   preferences: {...},
                          --   conversation_summary: "..."
                          -- }

  -- Minimal required fields
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- portfolio_items table (renamed from projects)
CREATE TABLE portfolio_items (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses,

  -- Content (structure emerges from content)
  content JSONB,          -- {
                          --   title: "Live Edge Walnut Dining Table",
                          --   narrative: {...},  -- Agent-structured
                          --   highlights: [...],
                          --   specs: {...},      -- Business-type specific
                          -- }

  -- Visual organization (agent-determined)
  visuals JSONB,          -- {
                          --   hero_image_id: "...",
                          --   organization: "gallery" | "process" | "comparison",
                          --   categories: {...}  -- Emergent, not enum
                          -- }

  -- Layout (agent-composed)
  layout JSONB,           -- Semantic blocks + design tokens

  -- SEO (agent-generated, business-appropriate)
  seo JSONB,              -- {
                          --   title: "...",
                          --   description: "...",
                          --   focus: "style" | "location" | "specialty"
                          -- }

  -- Context
  context JSONB,          -- {
                          --   business_type: "furniture_maker",
                          --   customer_focus: ["design-conscious homeowners"],
                          --   extracted_from: "conversation" | "images"
                          -- }

  -- Metadata
  status TEXT DEFAULT 'draft',  -- draft/published/archived
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- images table (renamed from project_images)
CREATE TABLE images (
  id UUID PRIMARY KEY,
  portfolio_item_id UUID REFERENCES portfolio_items,

  storage_path TEXT,

  -- Agent-determined (not enum)
  role TEXT,              -- "hero", "detail", "process", "context", etc.
  analysis JSONB,         -- Vision agent results

  -- Display
  alt_text TEXT,
  display_order INT,

  created_at TIMESTAMPTZ
);

-- conversations table (new)
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses,
  portfolio_item_id UUID REFERENCES portfolio_items,  -- Optional

  -- Conversation type
  purpose TEXT,           -- "onboarding", "portfolio_creation", "editing", "support"

  -- State
  messages JSONB[],       -- Array of {role, content, timestamp, tool_calls}
  summary TEXT,           -- Compacted summary for context
  extracted JSONB,        -- What was learned from this conversation

  -- Agent memory
  active_agents TEXT[],   -- Which agents participated
  handoffs JSONB[],       -- Handoff log for debugging

  -- Metadata
  status TEXT,            -- "active", "completed", "archived"
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- agent_memory table (new)
CREATE TABLE agent_memory (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses,

  -- What agents know about this business
  facts JSONB[],          -- [{type, content, source, timestamp}]
  preferences JSONB,      -- {tone, focus_areas, avoid_topics, ...}
  patterns JSONB,         -- Learned patterns about this user

  -- Cross-conversation context
  relationship_summary TEXT,  -- "Furniture maker, values craft, prefers casual tone"

  updated_at TIMESTAMPTZ
);
```

### Key Changes

| Aspect | Before | After |
|--------|--------|-------|
| **Business identity** | Fixed columns | `understanding` JSONB |
| **Business vocabulary** | Assumed masonry | Discovered, stored in `understanding.vocabulary` |
| **Project structure** | Fixed columns (materials, techniques) | `content` JSONB, structure emerges |
| **Image categories** | Enum (before/after/progress/detail) | `role` TEXT, agent-determined |
| **Conversation history** | Partial (`chat_sessions`) | Full `conversations` table with purpose |
| **Agent memory** | `ai_context` JSONB | Dedicated `agent_memory` table |
| **URL structure** | `/masonry/{type}/{slug}` | `/{business_type}/{specialty}/{slug}` |

---

## UI Patterns

### Pattern 1: Conversation-First, Forms-Optional

**Principle:** Every screen can be a conversation. Forms exist for users who prefer them.

```
┌─────────────────────────────────────────────────────────────┐
│                    ONBOARDING SCREEN                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  "Welcome! I'm here to help you showcase            │   │
│  │   your work. Tell me about what you do."            │   │
│  │                                                      │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ I'm a custom furniture maker in Denver...    │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │                              [Send] [🎤 Voice]       │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Prefer to fill out a form? [Switch to form view]           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Pattern 2: Live Preview as Conversation Artifact

**Principle:** The preview updates as the conversation progresses. It's not a final step.

```
┌─────────────────────────────────────────────────────────────┐
│                  PORTFOLIO CREATION                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐  ┌───────────────────────────┐   │
│  │    CONVERSATION      │  │      LIVE PREVIEW         │   │
│  │                      │  │                           │   │
│  │  Agent: "Beautiful   │  │  ┌───────────────────┐   │   │
│  │   piece. Tell me     │  │  │                   │   │   │
│  │   about this one."   │  │  │   [HERO IMAGE]    │   │   │
│  │                      │  │  │                   │   │   │
│  │  You: "This was      │  │  └───────────────────┘   │   │
│  │   for a couple in    │  │                           │   │
│  │   Boulder..."        │  │  Live Edge Walnut Table   │   │
│  │                      │  │                           │   │
│  │  Agent: "A conver-   │  │  "A conversation piece    │   │
│  │   sation piece -     │  │   for dinner parties..."  │   │
│  │   I love that..."    │  │                           │   │
│  │                      │  │  ─────────────────────    │   │
│  │  [Input...]          │  │                           │   │
│  │                      │  │  [Publish] [Edit]         │   │
│  └──────────────────────┘  └───────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Pattern 3: Adaptive Dashboard

**Principle:** The dashboard adapts to the business type and current needs.

**For a new furniture maker:**
```
┌─────────────────────────────────────────────────────────────┐
│  Rocky Mountain Woodworks                    [Chat] [Edit]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  "You've got 1 piece in your portfolio. Let's add more      │
│   to show your range. Got any tables or shelving to show?"  │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │                 │  │                 │                   │
│  │  Walnut Table   │  │   + Add Piece   │                   │
│  │  [Published]    │  │                 │                   │
│  │                 │  │                 │                   │
│  └─────────────────┘  └─────────────────┘                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**For an established photographer:**
```
┌─────────────────────────────────────────────────────────────┐
│  Jane Doe Photography                        [Chat] [Edit]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  "Your wedding gallery is getting views from Boulder.        │
│   Want to add location tags to boost local discovery?"       │
│                                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Wedding │ │Portrait │ │ Events  │ │Commercial│           │
│  │   12    │ │    8    │ │    5    │ │    3    │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                              │
│  Recent: [Mountain Elopement] [Corporate Headshots] [+]     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**For a masonry contractor:**
```
┌─────────────────────────────────────────────────────────────┐
│  Denver Masonry Pros                         [Chat] [Edit]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  "That chimney rebuild in Lakewood turned out great.        │
│   The before/after really shows the transformation."        │
│                                                              │
│  3 Published  │  2 Drafts  │  Boulder area searches ↑       │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ [BEFORE/AFTER]  │  │ [BEFORE/AFTER]  │                   │
│  │ Chimney Rebuild │  │ Tuckpointing    │                   │
│  │ Lakewood        │  │ Denver          │                   │
│  └─────────────────┘  └─────────────────┘                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Pattern 4: Conversational Editing

**Principle:** Editing is a conversation, not a form.

```
User: "Can you make the title shorter?"

Agent: "Sure. Current: 'Live Edge Black Walnut Dining Table
       with Hairpin Legs for Boulder Couple'

       How about: 'Live Edge Walnut Table'
       or: 'Boulder Dining Table Commission'

       Or tell me what you'd prefer."

User: "The first one, but add 'Custom' at the start"

Agent: "Done. Title is now 'Custom Live Edge Walnut Table'"
```

**Forms still available:**
```
User: "I just want to edit the fields directly"

Agent: "No problem. Here's the edit form."
       [Shows traditional form view]
```

---

## Agent-Driven Features

### 1. Proactive Suggestions

Agents observe and suggest:

```typescript
// Agent notices patterns
if (business.portfolio_items.length === 1) {
  suggest("Add more pieces to show your range");
}

if (business.location && !business.portfolio_items.some(hasLocationTag)) {
  suggest("Add location tags to boost local discovery");
}

if (business.understanding.type === "photographer" &&
    business.portfolio_items.every(isWeddingPhotography)) {
  suggest("Show other work types to attract diverse clients");
}
```

### 2. Voice Matching

Agents learn and match business voice:

```typescript
// Discovery Agent learns voice
const voice = {
  formality: "casual",      // vs. "professional", "formal"
  personality: "warm",      // vs. "direct", "technical"
  focus: "craft",           // vs. "results", "experience"
  vocabulary: {
    work: "pieces",         // vs. "projects", "jobs"
    clients: "customers",   // vs. "clients", "homeowners"
    process: "making",      // vs. "building", "creating"
  }
};

// Content Agent uses voice
generateContent(portfolioItem, { voice: business.understanding.voice });
```

### 3. Cross-Item Learning

Agents improve over multiple portfolio items:

```typescript
// After first item
agent.learn({
  content_style: user.approved_content,
  layout_preference: user.approved_layout,
  image_organization: user.approved_organization,
});

// For subsequent items
generateContent(newItem, {
  ...defaults,
  style: agent.learned.content_style,
  layout: agent.learned.layout_preference,
});
```

### 4. Contextual Help

Agent provides help based on current context:

```
// User stares at empty upload screen
Agent: "Not sure what to show? Start with something
       you're proud of. It doesn't have to be perfect."

// User uploads blurry image
Agent: "This image is a bit blurry. Want to try another,
       or should I work with this one?"

// User hasn't added text after uploading
Agent: "Great photos! Tell me a bit about this work
       and I'll help turn it into portfolio content."
```

---

## Implementation Approach

### Phase 1: Data Model Foundation

**Goal:** Flexible schema that supports any business type.

1. Create new tables with JSONB structure:
   - `businesses` (from `contractors`)
   - `portfolio_items` (from `projects`)
   - `conversations` (new)
   - `agent_memory` (new)

2. Migrate existing data:
   - Map fixed columns to JSONB structures
   - Preserve all existing content
   - Add `business.understanding.type = "masonry"` for existing users

3. Create views for backward compatibility:
   - `contractors` view → `businesses` table
   - `projects` view → `portfolio_items` table

### Phase 2: Conversation Infrastructure

**Goal:** Every interaction can be a conversation.

1. Extend chat system:
   - Add `purpose` field to conversations
   - Support onboarding conversations
   - Support editing conversations

2. Create conversation entry points:
   - `/onboard` → Onboarding conversation
   - `/create` → Portfolio creation conversation
   - `/chat` → General conversation

3. Implement agent memory:
   - Store facts across conversations
   - Build relationship understanding
   - Enable voice matching

### Phase 3: Adaptive UI

**Goal:** UI adapts to business type and context.

1. Create adaptive dashboard:
   - Load layout based on `business.understanding.type`
   - Show relevant metrics for business type
   - Agent-driven suggestions

2. Create adaptive portfolio views:
   - Layout based on content type (gallery, comparison, process)
   - Organization based on business type
   - SEO focus based on business type

3. Implement form fallbacks:
   - Every conversation screen has "Switch to form" option
   - Forms use same data model
   - Changes sync both directions

### Phase 4: Agent Refinement

**Goal:** Agents become truly autonomous collaborators.

1. Refine agent personas:
   - Discovery Agent specialization
   - Business-type-aware Story Agent
   - Adaptive Layout Agent

2. Implement learning:
   - Cross-item learning
   - Voice matching
   - Preference tracking

3. Proactive features:
   - Suggestions based on portfolio gaps
   - SEO recommendations
   - Content improvement suggestions

---

## Success Criteria

After implementation:

1. **Any business can onboard** through conversation, no forms required
2. **Portfolio structure emerges** from content, not templates
3. **Voice matches the business** - content sounds like them
4. **UI adapts** to business type automatically
5. **Agents maintain relationship** - context persists across sessions
6. **Forms exist as fallback** - for users who prefer them
7. **Editing is conversational** - "make the title shorter" works

---

## The North Star

> **The best interface is no interface. The second best is a conversation.**

Users shouldn't have to learn our system. They should just talk about their work, and their portfolio appears.

---

## References

- [agent-philosophy.md](./agent-philosophy.md) - Core principles
- [over-engineering-audit.md](./over-engineering-audit.md) - What to remove
- [universal-portfolio-agents.md](./universal-portfolio-agents.md) - Agent architecture
- This document - Complete UX & data model vision
