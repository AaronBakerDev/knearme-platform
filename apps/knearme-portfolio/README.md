# KnearMe Portfolio

AI-powered portfolio platform for contractors. Turn your finished work into your best salesperson.

Built with [Next.js](https://nextjs.org), [Supabase](https://supabase.com), and [Payload CMS](https://payloadcms.com).

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment (copy and fill in .env.local)
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Payload CMS - Content Management

The app includes Payload CMS for managing marketing content, blog articles, and site configuration. The CMS runs colocated with Next.js (same server, shared database).

### Accessing the Admin Panel

Navigate to [http://localhost:3000/admin](http://localhost:3000/admin) (or `/admin` on your deployed site).

**First-time setup:**
1. Visit `/admin` - you'll see a registration form
2. Create your admin account (email + password)
3. This first user becomes the site administrator

**Note:** Payload CMS uses its own authentication system, separate from Supabase auth. CMS users are stored in the `users` collection.

### Content Collections

| Collection | Purpose | Public URL |
|------------|---------|------------|
| **Articles** | Blog posts with rich content | `/blog/[slug]` |
| **Authors** | Blog post authors | `/blog/author/[slug]` |
| **Categories** | Blog organization | `/blog/category/[slug]` |
| **Tags** | Article tagging | Filter via `?tag=` |
| **FAQs** | Landing page FAQ section | Homepage |
| **Pricing Tiers** | Pricing section content | Homepage |
| **Testimonials** | Customer testimonials | Homepage |
| **Features** | Product feature highlights | Homepage |
| **Service Types** | SEO service descriptions | Service pages |
| **Media** | Centralized image/file storage | Used by other content |
| **Forms** | Dynamic form builder | Embeddable |
| **Redirects** | URL redirect management | Middleware |
| **Page Views** | Anonymous analytics | Admin dashboard |

### Creating Content

#### Blog Articles

1. Go to **Collections > Articles** in the admin
2. Click **Create New**
3. Fill in required fields:
   - **Title**: Article headline
   - **Slug**: URL identifier (auto-generated from title if left blank)
   - **Content**: Use the rich text editor for body content
   - **Author**: Select or create an author
4. Optional but recommended:
   - **Featured Image**: Hero image (1200x630px recommended)
   - **Category**: Primary category
   - **Tags**: Related topics
   - **Excerpt**: 160-character summary for cards/SEO
5. Set **Status** to "Published" when ready
6. Click **Save**

The article will be available at `/blog/[slug]` immediately (ISR revalidation triggers automatically).

#### Marketing Content (FAQs, Pricing, etc.)

1. Navigate to the relevant collection (e.g., **FAQs**)
2. Click **Create New**
3. Fill in the fields
4. Save - changes appear on the landing page

### Publishing Workflow

Articles support a full editorial workflow:

| Status | Visibility | Use Case |
|--------|------------|----------|
| **Draft** | Admin only | Work in progress |
| **Scheduled** | Auto-publishes at date | Future content |
| **Published** | Public | Live content |
| **Archived** | Admin only | Retired content |

**Publishing an article:**
1. Set **Status** to "Published"
2. Set **Published Date** (defaults to now)
3. Save

**Scheduling content:**
1. Set **Status** to "Scheduled"
2. Set **Published Date** to future date/time
3. Save - article auto-publishes when the date arrives

### SEO Fields

All public content types include SEO settings:

| Field | Purpose | Fallback |
|-------|---------|----------|
| **Meta Title** | Browser tab & search results | Content title |
| **Meta Description** | Search result snippet | Content excerpt |
| **OG Image** | Social share image | Featured image |
| **Canonical URL** | Duplicate content handling | None |
| **No Index** | Hide from search engines | False |

**Best practices:**
- Meta titles: 50-60 characters
- Meta descriptions: 150-160 characters
- OG images: 1200x630px

The admin shows a live **OG Preview** card so you can see how content will appear when shared on social media.

### Version History & Drafts

All content collections support versioning:

**Viewing versions:**
1. Open any document in the admin
2. Click the **Versions** tab
3. See all previous versions with timestamps

**Restoring a version:**
1. Click on a previous version
2. Review the content
3. Click **Restore this version**

**Autosave:**
- Articles autosave every second while editing
- Up to 25 versions are kept per document
- Drafts can be previewed via shareable preview links

### Preview Links (Drafts)

Draft articles get shareable preview URLs:

1. Save an article as **Draft** or **Scheduled**
2. Click the **Preview** button in the admin
3. Copy the preview URL (e.g., `/blog/preview/[token]`)
4. Share with stakeholders for review

**Features:**
- No login required to view preview
- Links expire after 7 days
- Preview pages include `noindex` meta tag
- Regenerate or revoke tokens via admin buttons

### Site Settings & Navigation

Access via **Globals** in the admin sidebar:

| Global | Purpose |
|--------|---------|
| **Site Settings** | Site name, tagline, contact info, social links, default SEO |
| **Navigation** | Header links, footer links, quick access links |
| **Newsletter** | Email signup configuration (provider, messaging) |

### Analytics Dashboard

View content performance at **Admin > Analytics** (custom view):

- Total page views
- Views over time (chart)
- Top performing articles
- Date range filtering

### Seed Scripts

Populate initial content:

```bash
# Seed all marketing content
npx tsx src/payload/seed/faqs.ts
npx tsx src/payload/seed/pricing.ts
npx tsx src/payload/seed/testimonials.ts
npx tsx src/payload/seed/features.ts
npx tsx src/payload/seed/service-types.ts

# Seed sample blog content
npx tsx src/payload/seed/articles.ts
```

### Environment Variables

Required for Payload CMS:

```bash
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

# Payload secret (generate with: openssl rand -base64 32)
PAYLOAD_SECRET=your-secret-here
```

### Type Generation

After modifying collections, regenerate TypeScript types:

```bash
npx payload generate:types
```

Types are output to `src/types/payload-types.ts`.

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth pages (login, signup)
│   ├── (dashboard)/        # Authenticated dashboard
│   ├── (marketing)/        # Marketing pages (full header/footer)
│   ├── (portfolio)/        # Public portfolio/UGC pages (minimal chrome)
│   ├── (payload)/          # Payload CMS admin
│   └── api/                # API routes
├── components/             # React components
├── lib/                    # Utilities and helpers
├── payload/                # Payload CMS configuration
│   ├── collections/        # Collection definitions
│   ├── globals/            # Global configs
│   ├── hooks/              # Payload hooks
│   └── seed/               # Seed scripts
└── types/                  # TypeScript types
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Payload CMS Documentation](https://payloadcms.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

## Deploy on Vercel

See [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for details.

Required Vercel environment variables:
- `DATABASE_URL`
- `PAYLOAD_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
