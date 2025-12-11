# ADR-002: Supabase as Backend Platform

> **Status:** Accepted
> **Date:** December 8, 2025
> **Deciders:** Technical Architect
> **Related:** ADR-001 (Next.js), ADR-003 (OpenAI)

---

## Context

We need a backend platform that provides:

1. **PostgreSQL database** - Relational data for projects, contractors, images
2. **Authentication** - Email/password, future OAuth
3. **File storage** - Project photos with CDN delivery
4. **Real-time capabilities** - Future features (notifications)
5. **Managed infrastructure** - No DevOps overhead for MVP
6. **Cost-effective** - Affordable at low scale, scales with growth

The platform should minimize operational complexity while providing production-grade capabilities.

---

## Decision

**We will use Supabase as our primary backend platform.**

Specifically:
- **Supabase Auth** for authentication
- **Supabase PostgreSQL** for database
- **Supabase Storage** for image files
- **Supabase Edge Functions** for AI pipeline orchestration (if needed)
- **Row Level Security (RLS)** for data access control

---

## Consequences

### Positive

| Benefit | Details |
|---------|---------|
| **All-in-one platform** | Auth, DB, storage, realtime in one dashboard |
| **PostgreSQL** | Full SQL capabilities, JSONB for flexible data |
| **Generous free tier** | 500MB DB, 1GB storage, 50K MAU - sufficient for MVP |
| **Built-in auth** | Email/password, magic links, OAuth providers ready |
| **Storage with CDN** | Automatic image optimization and global delivery |
| **Row Level Security** | Database-level access control; secure by default |
| **Excellent DX** | Auto-generated TypeScript types, realtime subscriptions |
| **Open source** | Can self-host if needed; no complete vendor lock-in |

### Negative

| Trade-off | Mitigation |
|-----------|------------|
| **Vendor dependency** | Core is open-source; can migrate to self-hosted |
| **Limited Edge Functions** | Use Next.js API routes for complex logic |
| **Learning RLS** | Security model requires understanding; investment upfront |
| **Cold starts** | Edge Functions have cold start latency; warm with cron |

### Neutral

- Need to manage connection pooling for serverless
- Database schema changes through migrations (standard)
- Some features require paid tier ($25/mo Pro)

---

## Alternatives Considered

### 1. Firebase

| Aspect | Evaluation |
|--------|------------|
| **Pros** | Mature, excellent mobile SDKs, realtime DB |
| **Cons** | NoSQL (Firestore), Google lock-in, complex pricing |
| **Why not** | Relational data model fits better; Firestore queries limited |

### 2. PlanetScale + Clerk + S3

| Aspect | Evaluation |
|--------|------------|
| **Pros** | Best-in-class for each service |
| **Cons** | Multiple vendors, complex integration, higher cost |
| **Why not** | Operational complexity; Supabase consolidates |

### 3. Self-hosted PostgreSQL + Custom Auth

| Aspect | Evaluation |
|--------|------------|
| **Pros** | Full control, no vendor dependency |
| **Cons** | DevOps overhead, security responsibility |
| **Why not** | Not viable for MVP timeline; add complexity later if needed |

### 4. Neon (Serverless Postgres) + separate services

| Aspect | Evaluation |
|--------|------------|
| **Pros** | Excellent serverless Postgres, branching |
| **Cons** | Still need separate auth and storage |
| **Why not** | Supabase provides comparable DB plus integrated services |

---

## Implementation Details

### Authentication Strategy

```typescript
// Client-side auth initialization
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient()

// Email signup
await supabase.auth.signUp({
  email: 'mike@heritage-masonry.com',
  password: 'securePassword123'
})

// Session management handled automatically
// Access token refreshed in middleware
```

### Database Connection

```typescript
// Server Component / API Route
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const supabase = createServerComponentClient({ cookies })

// Query with RLS automatically applied
const { data: projects } = await supabase
  .from('projects')
  .select('*')
  .eq('status', 'published')
```

### Storage for Images

```typescript
// Upload to Supabase Storage
const { data, error } = await supabase.storage
  .from('project-images')
  .upload(`${projectId}/${fileName}`, file, {
    cacheControl: '3600',
    upsert: false
  })

// Get public URL with transformation
const { data: { publicUrl } } = supabase.storage
  .from('project-images')
  .getPublicUrl(path, {
    transform: {
      width: 800,
      height: 600,
      resize: 'cover'
    }
  })
```

### Row Level Security Example

```sql
-- Projects table RLS policies

-- Anyone can read published projects
CREATE POLICY "Public can view published projects"
ON projects FOR SELECT
USING (status = 'published');

-- Contractors can only modify their own projects
CREATE POLICY "Contractors can modify own projects"
ON projects FOR ALL
USING (auth.uid() = contractor_id);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xyzabc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server-side only
```

---

## Cost Projection

| Tier | Monthly Cost | Capacity |
|------|--------------|----------|
| **Free** | $0 | 500MB DB, 1GB storage, 50K MAU |
| **Pro** | $25 | 8GB DB, 100GB storage, 100K MAU |
| **Team** | $599 | Larger limits, SOC2, priority support |

**MVP Expectation:** Stay on Free tier for first 2-3 months, upgrade to Pro when storage exceeds 1GB (approximately 300-500 projects with 5 images each).

---

## Migration Path

If we need to migrate away from Supabase:

1. **Database** - Export PostgreSQL dump; import to any Postgres host
2. **Auth** - More complex; would need user re-authentication or token migration
3. **Storage** - Script to download and re-upload to S3/Cloudflare R2
4. **RLS** - Rewrite as application-level middleware

Estimated migration effort: 2-4 weeks if required.

---

## Validation

This decision will be validated by:

1. **Auth flow** - Signup/login works without issues in Sprint 1
2. **Storage performance** - Image load times < 500ms
3. **Query performance** - API responses < 200ms for typical queries
4. **Cost** - Stay within Free tier limits for first month

---

## References

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Image Transformations](https://supabase.com/docs/guides/storage/image-transformations)

---

*This ADR is subject to revision if significant blockers are discovered during implementation.*
