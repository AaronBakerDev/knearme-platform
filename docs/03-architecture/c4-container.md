# C4 Model: Container Diagram

> **Version:** 1.3
> **Last Updated:** December 31, 2025
> **Level:** 2 - Container

---

## Overview

The Container diagram shows the high-level technology choices and how responsibilities are distributed.

---

## Container Diagram

```mermaid
C4Container
    title Container Diagram for KnearMe Platform

    Person(contractor, "Contractor", "Uses mobile PWA")

    Container_Boundary(knearme, "KnearMe Platform") {
    Container(pwa, "PWA Client", "Next.js, React", "Chat-first project intake, photo upload, portfolio viewing")
    Container(api, "API Routes", "Next.js API", "REST + streaming chat endpoints for data operations and AI tools")
    Container(ai_pipeline, "AI Pipeline", "TypeScript", "AI SDK runtime for chat agent, vision, transcription, generation, summarization")
    }

    ContainerDb(postgres, "PostgreSQL", "Supabase", "Stores contractors, projects, interviews, images metadata")
    ContainerDb(storage, "Object Storage", "Supabase Storage", "Stores project images with CDN delivery")

    System_Ext(gemini, "Google Gemini API", "Gemini 3.0 Flash (vision + generation + chat)")
    System_Ext(openai, "OpenAI API", "Whisper (transcription only)")
    System_Ext(auth, "Supabase Auth", "Email/password authentication")

    Rel(contractor, pwa, "Uses", "HTTPS")
    Rel(pwa, api, "Calls", "HTTPS/JSON")
    Rel(api, ai_pipeline, "Invokes")
    Rel(ai_pipeline, gemini, "Vision/Gen", "HTTPS/JSON")
    Rel(ai_pipeline, openai, "Transcribe", "HTTPS/JSON")
    Rel(api, postgres, "Reads/Writes", "PostgreSQL")
    Rel(api, storage, "Uploads/Downloads", "HTTPS")
    Rel(pwa, auth, "Authenticates", "HTTPS")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

---

## Simplified Diagram (Markdown Compatible)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           KnearMe Platform                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     PWA Client (Next.js)                            │   │
│  │                                                                     │   │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │   │
│  │   │   Auth UI    │  │   Chat       │  │  Portfolio   │            │   │
│  │   │              │  │   Wizard     │  │    Pages     │            │   │
│  │   │  • Login     │  │              │  │              │            │   │
│  │   │  • Signup    │  │  • Chat      │  │  • Profile   │            │   │
│  │   │  • Profile   │  │  • Photos    │  │  • Projects  │            │   │
│  │   │              │  │  • Generate  │  │  • Detail    │            │   │
│  │   └──────────────┘  └──────────────┘  └──────────────┘            │   │
│  └────────────────────────────┬────────────────────────────────────────┘   │
│                               │                                             │
│                               ▼  API Calls (REST/JSON)                      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     API Routes (Next.js)                            │   │
│  │                                                                     │   │
│  │   /api/auth/*       /api/projects/*     /api/chat/*                │   │
│  │   /api/contractors/* /api/ai/*          /api/upload/*              │   │
│  │                                                                     │   │
│  └───────┬─────────────────────┬───────────────────────┬───────────────┘   │
│          │                     │                       │                    │
│          ▼                     ▼                       ▼                    │
│  ┌──────────────┐     ┌──────────────┐        ┌──────────────┐            │
│  │ AI Pipeline  │     │  PostgreSQL  │        │   Storage    │            │
│  │              │     │  (Supabase)  │        │  (Supabase)  │            │
│  │  • Chat agent │     │              │        │              │            │
│  │  • Vision     │     │  contractors │        │  /images/*   │            │
│  │  • Transcribe │     │  projects    │        │              │            │
│  └──────┬───────┘     │  project_images │     └──────────────┘            │
│         │             │  chat_sessions  │                                  │
│         ▼             └──────────────┘                                     │
│  ┌──────────────┐  ┌──────────────┐                                        │
│  │  Gemini API  │  │  OpenAI API  │                                        │
│  │ (Chat/Gen)  │  │  (Whisper)   │                                        │
│  └──────────────┘  └──────────────┘                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Container Descriptions

### 1. PWA Client

| Attribute | Value |
|-----------|-------|
| **Technology** | Next.js 14, React 18, TypeScript |
| **Purpose** | User interface for contractors and public visitors |
| **Key Features** | Chat wizard, voice recording, photo capture |
| **Deployment** | Vercel Edge Network |

**Responsibilities:**
- Render contractor dashboard and chat wizard
- Capture photos via device camera
- Record voice via MediaRecorder API
- Display AI-generated content for approval
- Render SEO-optimized portfolio pages (SSR)

### 2. API Routes

| Attribute | Value |
|-----------|-------|
| **Technology** | Next.js API Routes, TypeScript |
| **Purpose** | Backend logic and data operations |
| **Authentication** | Supabase Auth (JWT verification) |
| **Deployment** | Vercel Serverless Functions |

**Responsibilities:**
- Handle authentication callbacks
- CRUD operations for projects and contractors
- Stream chat responses and tool execution (`/api/chat`)
- Persist chat sessions, messages, and context loading
- Orchestrate AI pipeline calls
- Generate signed upload URLs for storage
- Generate SEO metadata

### 3. AI Pipeline

| Attribute | Value |
|-----------|-------|
| **Technology** | TypeScript, Vercel AI SDK |
| **Purpose** | Orchestrate all AI operations |
| **External Dependencies** | Google Gemini API, OpenAI API (Whisper) |
| **Location** | Internal module, called by API routes |

**Responsibilities:**
- Send images to Gemini 3.0 Flash for analysis
- Send audio to Whisper for transcription
- Stream chat responses with tool calling (Account Manager persona + tools)
- Send prompts to Gemini 3.0 Flash for content generation
- Summarize conversations for context compaction
- Handle retries and error cases
- Validate and parse AI responses with Zod schemas

### 4. PostgreSQL Database

| Attribute | Value |
|-----------|-------|
| **Technology** | PostgreSQL 15 (Supabase hosted) |
| **Purpose** | Persistent data storage |
| **Security** | Row Level Security (RLS) enabled |
| **Connection** | Pooled connections via Supabase client |

**Tables:**
- `contractors` - User profiles and business info
- `projects` - Project records with status
- `project_images` - Image metadata and paths
- `chat_sessions` - Per-project chat session state
- `chat_messages` - Persisted chat messages + tool parts
- `interview_sessions` - AI interview state and transcripts
- `categories` - Project type taxonomy

### 5. Object Storage

| Attribute | Value |
|-----------|-------|
| **Technology** | Supabase Storage (S3-compatible) |
| **Purpose** | Store and serve project images |
| **Features** | CDN delivery, image transformations |
| **Security** | Signed URLs for uploads, public read for published |

**Buckets:**
- `project-images` - Original and transformed images
- `voice-recordings` - Audio files (temporary, deleted after transcription)

---

## Data Flow: Chat-First Project Creation

```mermaid
sequenceDiagram
    participant C as PWA Client
    participant API as API Routes
    participant AI as AI Pipeline
    participant GEM as Gemini
    participant OAI as OpenAI (Whisper)
    participant DB as PostgreSQL
    participant S3 as Storage

    C->>API: POST /api/projects (draft)
    API->>DB: Insert project record
    DB-->>API: Project ID
    API-->>C: Project ID

    C->>API: GET /api/chat/sessions/by-project/:id
    API->>DB: select/create chat_sessions
    DB-->>API: session
    API-->>C: session metadata

    C->>API: POST /api/chat (stream)
    API->>AI: streamText + tools
    AI->>GEM: Chat + extraction
    GEM-->>AI: Tool calls + text
    AI-->>API: Streamed response
    API-->>C: Tokens + tool parts

    C->>API: POST /api/chat/sessions/:id/messages
    API->>DB: Insert chat_messages
    DB-->>API: OK

    C->>API: POST /api/upload (request signed URL)
    API->>S3: Generate signed upload URL
    S3-->>API: Signed URL
    API-->>C: Upload URL

    C->>S3: Upload images directly
    S3-->>C: Success + paths

    C->>API: POST /api/ai/analyze-images
    API->>AI: analyzeProjectImages(paths)
    AI->>GEM: Gemini 3.0 Flash vision request
    GEM-->>AI: Project type, materials
    AI-->>API: Analysis result
    API-->>C: Display confirmation

    C->>API: POST /api/ai/transcribe
    API->>AI: transcribeAudio(blob)
    AI->>OAI: Whisper request
    OAI-->>AI: Transcript
    AI-->>API: Text response
    API-->>C: Show transcript

    C->>API: POST /api/chat ("Generate the portfolio content now.")
    API->>AI: generatePortfolioContent tool
    AI->>GEM: Gemini 3.0 Flash request
    GEM-->>AI: Generated content
    AI-->>API: Tool result
    API-->>C: Preview for approval

    C->>API: POST /api/projects/:id/publish
    API->>DB: Update project status
    DB-->>API: Published
    API-->>C: Published! Redirect to project page
```

---

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14 + React 18 | PWA with SSR |
| **Styling** | Tailwind CSS + shadcn/ui | Design system |
| **State** | TanStack Query + Zustand | Server + client state |
| **Backend** | Next.js API Routes | Serverless functions |
| **Database** | Supabase PostgreSQL | Relational data |
| **Storage** | Supabase Storage | Images with CDN |
| **Auth** | Supabase Auth | Email/password |
| **AI** | Gemini 3.0 Flash + Whisper | Vision, generation, chat + transcription |
| **Hosting** | Vercel | Deployment, CDN, edge |

---

## Security Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                    PUBLIC (No Auth Required)                     │
│                                                                 │
│    • Landing page                                               │
│    • Published project pages                                    │
│    • Contractor profile pages                                   │
│    • Login/Signup forms                                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 AUTHENTICATED (JWT Required)                     │
│                                                                 │
│    • Dashboard                                                  │
│    • Create/edit projects                                       │
│    • AI chat flow                                               │
│    • Profile management                                         │
│    • Upload signed URLs                                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  INTERNAL (Server-side Only)                     │
│                                                                 │
│    • AI API calls (Gemini + Whisper, API keys protected)        │
│    • Database direct access (service role)                      │
│    • Storage admin operations                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## References

- [C4 Model - Container Diagram](https://c4model.com/#ContainerDiagram)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Architecture](https://supabase.com/docs/guides/architecture)
