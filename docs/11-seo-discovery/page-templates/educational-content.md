# Educational Content Page Template

**Priority:** P2 (Phase 3)
**Status:** Not Implemented
**Target:** March - June 2025

## Overview

Educational Content pages are **in-depth articles and how-to guides** targeting informational keywords and homeowner pain points. These pages build domain authority, capture top-of-funnel traffic, and guide homeowners toward city/service pages.

**Business Purpose:**
- Capture informational search queries ("how to", "what is", "signs you need")
- Build trust through value-first content
- Internal linking to transactional pages (city hubs, service pages)
- Long-term SEO authority building

## Route Configuration

### File Location

**Option A:** `/learn/` route group (recommended)
```
app/(public)/learn/[slug]/page.tsx
```

**Option B:** `/resources/` route group
```
app/(public)/resources/[slug]/page.tsx
```

**Recommendation:** Use `/learn/` for clarity and SEO (clearer user intent)

### URL Pattern
```
/learn/{article-slug}
```

### Example URLs
- `/learn/signs-your-chimney-needs-repair`
- `/learn/choosing-the-right-masonry-contractor`
- `/learn/understanding-masonry-restoration-costs`
- `/learn/tuckpointing-vs-repointing-differences`
- `/learn/how-to-prevent-brick-spalling`
- `/learn/chimney-crown-repair-guide`

## Content Types

### 1. Educational Articles

**Purpose:** Answer "what", "why", "when" questions
**Length:** 1,500-2,500 words
**Target Keywords:** Informational queries

**Examples:**
- "Signs Your Chimney Needs Repair"
- "Understanding Masonry Restoration Costs"
- "What is Efflorescence and How to Remove It"

**Structure:**
```markdown
# [Article Title] (H1)

[Introduction: Problem statement, 150-200 words]

## [Section 1: Main Topic Overview] (H2)
[300-400 words]

## [Section 2: Deep Dive] (H2)
[400-500 words]

## [Section 3: Practical Advice] (H2)
[300-400 words]

## Real Project Examples (H2)
[2-3 embedded project cards with descriptions]

## When to Hire a Professional (H2)
[200-300 words]

## Find Local Contractors (H2)
[CTA section with links to city hubs]

## Related Resources (H2)
[Links to 3-4 related articles or service pages]
```

### 2. Problem-Solution Guides

**Purpose:** Answer "how to fix" questions
**Length:** 1,500-2,500 words
**Target Keywords:** "how to {solve problem}"

**Examples:**
- "How to Fix Chimney Crown Cracks: Complete Guide"
- "Repointing Brick Walls: Step-by-Step Process"
- "Preventing Efflorescence on Brick Surfaces"

**Structure:**
```markdown
# How to [Solve Problem]: Complete Guide (H1)

[Introduction: Problem overview, why it happens, 150-200 words]

## Understanding the Problem (H2)
[What causes it, severity levels, 300-400 words]

## DIY vs Professional Repair (H2)
[Decision tree: when to DIY, when to hire, 200-300 words]

## Tools & Materials Needed (H2)
[Bulleted list with explanations]

## Step-by-Step Process (H2)
### Step 1: [Action] (H3)
### Step 2: [Action] (H3)
### Step 3: [Action] (H3)
[Numbered steps with images, 600-800 words total]

## Professional Solution (H2)
[What contractors do differently, benefits, 200-300 words]

## Featured Projects (H2)
[Before/after examples from portfolio]

## Find a Contractor (H2)
[CTA with city links]
```

## Data Requirements

### Content Storage: MDX Files

**Recommended Approach:** MDX (Markdown with JSX components)
**Directory:** `content/learn/{slug}.mdx`

**Example File Structure:**
```
content/
└── learn/
    ├── signs-chimney-needs-repair.mdx
    ├── choosing-masonry-contractor.mdx
    ├── masonry-restoration-costs.mdx
    └── tuckpointing-vs-repointing.mdx
```

### MDX Frontmatter

```yaml
---
title: "Signs Your Chimney Needs Repair"
description: "Learn the 7 warning signs that indicate your chimney needs professional repair, from visible cracks to water leaks."
publishedAt: "2025-03-15"
updatedAt: "2025-03-15"
author: "KNearMe Editorial Team"
category: "Chimney"
tags: ["chimney repair", "home maintenance", "masonry"]
featuredImage: "/images/learn/chimney-repair-signs.jpg"
relatedProjects: ["project-slug-1", "project-slug-2"]
relatedArticles: ["choosing-masonry-contractor", "chimney-crown-repair-guide"]
targetKeywords: ["chimney repair signs", "when to repair chimney"]
---
```

### Query: Fetch Related Projects

```typescript
/**
 * Fetch related projects by tags or service type.
 * Used to embed project examples in educational content.
 */
export async function getRelatedProjectsByTags(
  tags: string[],
  limit: number = 3
): Promise<ProjectWithContractor[]> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      contractor:contractors(id, business_name, city, state, city_slug),
      project_images(storage_path, alt_text, display_order)
    `)
    .overlaps('tags', tags)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[getRelatedProjectsByTags] Error:', error);
    return [];
  }

  return (data || []).map((project) => {
    const sortedImages = (project.project_images || []).sort(
      (a, b) => a.display_order - b.display_order
    );
    return { ...project, cover_image: sortedImages[0] };
  });
}
```

## Page Structure

### 1. Article Header

**Components:**
- Breadcrumb navigation
- Article category badge
- H1 heading (article title)
- Author byline
- Publication date
- Reading time estimate

**Example:**
```tsx
<header className="max-w-3xl mx-auto mb-8">
  <Breadcrumbs items={[
    { name: 'Home', url: '/' },
    { name: 'Learn', url: '/learn' },
    { name: article.title, url: `/learn/${article.slug}` },
  ]} />

  <Badge variant="secondary" className="mb-4">
    {article.category}
  </Badge>

  <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
    {article.title}
  </h1>

  <div className="flex items-center gap-4 text-sm text-muted-foreground">
    <span>By {article.author}</span>
    <span>•</span>
    <time dateTime={article.publishedAt}>
      {formatDate(article.publishedAt)}
    </time>
    <span>•</span>
    <span>{estimateReadingTime(article.content)} min read</span>
  </div>
</header>
```

### 2. Article Body (Prose)

**Styling:** Tailwind Typography plugin (`prose` classes)
**Max Width:** 65ch (optimal reading width)
**Components:** MDX allows embedding React components

**Example MDX:**
```mdx
## Signs Your Chimney Needs Repair

Your chimney works hard to vent smoke and gases safely out of your home. Over time,
exposure to weather, heat, and moisture can cause damage that compromises both safety
and efficiency. Here are 7 warning signs to watch for:

### 1. Visible Cracks in the Chimney Structure

Cracks in the brick or mortar joints allow water to penetrate, leading to accelerated
deterioration. Even small cracks can expand during freeze-thaw cycles common in Colorado.

<ProjectExample slug="historic-brick-chimney-restoration" />

### 2. White Staining (Efflorescence)

White, powdery deposits on your chimney exterior indicate water is seeping through the
masonry, dissolving salts and depositing them on the surface.

[Learn more about efflorescence removal →](/learn/what-is-efflorescence)
```

### 3. Embedded Project Examples

**Component:** `<ProjectExample>` (custom MDX component)
**Purpose:** Visual examples from real projects
**Display:** Compact card with image, title, contractor, link

**Implementation:**
```tsx
// components/mdx/ProjectExample.tsx
export function ProjectExample({ slug }: { slug: string }) {
  const project = await getProjectBySlug(slug);
  if (!project) return null;

  return (
    <Card className="my-6 not-prose">
      <CardContent className="p-4 flex gap-4">
        <div className="relative w-24 h-24 flex-shrink-0">
          <Image
            src={getPublicUrl('project-images', project.cover_image.storage_path)}
            alt={project.title}
            fill
            className="object-cover rounded"
          />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold mb-1">{project.title}</h4>
          <p className="text-sm text-muted-foreground mb-2">
            by {project.contractor.business_name} in {project.city}
          </p>
          <Link
            href={`/${project.city_slug}/masonry/${project.project_type_slug}/${project.slug}`}
            className="text-sm text-primary hover:underline"
          >
            View project →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 4. Internal Linking Section

**Purpose:** Drive traffic to transactional pages
**Placement:** After main content, before related articles

**Example:**
```tsx
<section className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 my-8 not-prose">
  <h3 className="text-xl font-semibold mb-4">
    Need Chimney Repair? Find Local Contractors
  </h3>
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
    {topCities.map((city) => (
      <Link
        key={city.slug}
        href={`/${city.slug}/masonry/chimney-repair`}
        className="flex items-center gap-2 p-3 bg-background rounded-lg hover:shadow-md transition"
      >
        <MapPin className="h-4 w-4 text-primary" />
        <span>{city.name}</span>
      </Link>
    ))}
  </div>
</section>
```

### 5. Related Resources

**Display:** Card grid (2-3 related articles)
**Purpose:** Increase session duration, reduce bounce rate

**Example:**
```tsx
<section className="mt-12">
  <h2 className="text-2xl font-bold mb-6">Related Resources</h2>
  <div className="grid md:grid-cols-3 gap-6">
    {relatedArticles.map((article) => (
      <Link key={article.slug} href={`/learn/${article.slug}`}>
        <Card className="hover:shadow-md transition">
          <CardContent className="p-4">
            <Badge variant="secondary" className="mb-2">
              {article.category}
            </Badge>
            <h3 className="font-semibold mb-2">{article.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {article.description}
            </p>
          </CardContent>
        </Card>
      </Link>
    ))}
  </div>
</section>
```

## JSON-LD Structured Data

### Article Schema

```typescript
/**
 * Generate Article schema for educational content.
 */
export function generateArticleSchema(article: Article): object {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': article.title,
    'description': article.description,
    'image': article.featuredImage ? `${siteUrl}${article.featuredImage}` : undefined,
    'author': {
      '@type': 'Organization',
      'name': 'KNearMe',
      'url': siteUrl,
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'KNearMe',
      'logo': {
        '@type': 'ImageObject',
        'url': `${siteUrl}/logo.png`,
      },
    },
    'datePublished': article.publishedAt,
    'dateModified': article.updatedAt || article.publishedAt,
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `${siteUrl}/learn/${article.slug}`,
    },
    'keywords': article.tags.join(', '),
  };
}
```

### HowTo Schema (for Guides)

```typescript
/**
 * Generate HowTo schema for problem-solution guides.
 */
export function generateHowToSchema(guide: {
  title: string;
  description: string;
  steps: Array<{ name: string; text: string; image?: string }>;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    'name': guide.title,
    'description': guide.description,
    'step': guide.steps.map((step, index) => ({
      '@type': 'HowToStep',
      'position': index + 1,
      'name': step.name,
      'text': step.text,
      'image': step.image ? `${process.env.NEXT_PUBLIC_SITE_URL}${step.image}` : undefined,
    })),
  };
}
```

**Usage in MDX:**
```mdx
---
title: "How to Fix Chimney Crown Cracks"
howToSteps:
  - name: "Inspect the Damage"
    text: "Examine the chimney crown for cracks, spalling, or missing sections..."
  - name: "Clean the Surface"
    text: "Remove loose debris, dirt, and vegetation from the crown..."
  - name: "Apply Crown Sealant"
    text: "Use a flexible crown sealant designed for masonry applications..."
---
```

## SEO Metadata

### generateMetadata() Function

```typescript
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) return { title: 'Article Not Found' };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';
  const imageUrl = article.featuredImage ? `${siteUrl}${article.featuredImage}` : undefined;

  return {
    title: article.title,
    description: article.description,
    keywords: article.tags.join(', '),
    openGraph: {
      title: article.title,
      description: article.description,
      type: 'article',
      url: `${siteUrl}/learn/${slug}`,
      images: imageUrl ? [{ url: imageUrl, alt: article.title }] : [],
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt || article.publishedAt,
      authors: [article.author],
      section: article.category,
      tags: article.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: `${siteUrl}/learn/${slug}`,
    },
  };
}
```

## Content Production Workflow

### Planning Phase

1. **Keyword Research:**
   - Use Google Keyword Planner, Ahrefs, or AnswerThePublic
   - Identify informational queries with 500+ monthly searches
   - Prioritize questions homeowners are actively searching

2. **Content Calendar:**
   - Reference `/docs/content-planning/masonry/content-plan.md` Section 2
   - 8 educational articles planned
   - 8 problem-solution guides planned
   - Production: 2 articles/month = 8 months

### Creation Phase

**Step 1: Outline (AI-Generated)**
```
Prompt: Create a detailed outline for an educational article titled "{article title}".
Target audience: Homeowners researching masonry issues. Tone: Helpful, not salesy.
Include: Introduction, 3-5 main sections, practical advice, when to hire a pro, conclusion.
```

**Step 2: First Draft (AI-Assisted)**
```
Prompt: Write the introduction section (200 words) for an article about {topic}.
Start with a relatable problem statement, explain why it matters, and preview the article structure.
```

**Step 3: Human Editing (30-40%)**
- Fact-check technical details
- Add local insights (e.g., climate considerations)
- Insert internal links to city/service pages
- Add real project examples
- Optimize for target keywords (natural integration)

**Step 4: Visual Assets**
- Featured image (custom photography or high-quality stock)
- Step images for how-to guides
- Before/after photos from project portfolio
- Infographics (optional, Phase 4)

**Step 5: SEO Review**
- Target keyword in H1, meta title, first 100 words
- H2/H3 subheadings include related keywords
- Internal links to 2-3 city hubs and 1-2 service pages
- Alt text on all images
- Meta description under 160 characters

### Publication Phase

1. **Deploy MDX file** to `content/learn/{slug}.mdx`
2. **Update sitemap** (automatic if using dynamic sitemap)
3. **Submit to Google Search Console** for indexing
4. **Share on social media** (Twitter, LinkedIn, contractor email)
5. **Monitor performance** (Google Analytics, Search Console)

## Target Keywords (Examples)

### Educational Articles

**From Content Plan:**
| Article | Primary Keyword | Search Volume |
|---------|----------------|---------------|
| Signs Your Chimney Needs Repair | "chimney repair signs" | 720/mo |
| Understanding Masonry Costs | "masonry cost" | 1,100/mo |
| Choosing a Masonry Contractor | "how to find a good mason" | 720/mo |
| What is Efflorescence | "what is efflorescence" | 880/mo |
| Chimney Inspection Guide | "chimney inspection checklist" | 590/mo |
| Brick vs Stone Veneer | "brick vs stone veneer" | 480/mo |
| Historic Restoration Basics | "historic brick restoration" | 320/mo |
| Freeze-Thaw Damage | "freeze thaw damage brick" | 390/mo |

### Problem-Solution Guides

| Guide | Primary Keyword | Search Volume |
|-------|----------------|---------------|
| How to Fix Chimney Crown Cracks | "chimney crown repair" | 880/mo |
| Repointing Brick Walls | "how to repoint brick" | 1,200/mo |
| Preventing Brick Spalling | "brick spalling repair" | 480/mo |
| Waterproofing Masonry | "how to waterproof brick" | 720/mo |
| Removing Efflorescence | "how to remove efflorescence" | 590/mo |
| Fixing Mortar Joints | "repairing mortar joints" | 640/mo |
| Chimney Flashing Repair | "chimney flashing repair" | 720/mo |
| Stone Wall Restoration | "stone wall repair" | 530/mo |

**Total Target:** 16 articles (8 educational + 8 guides)

## Implementation Checklist

### Phase 3.1: Infrastructure

- [ ] Create route file: `app/(public)/learn/[slug]/page.tsx`
- [ ] Set up MDX support (next-mdx-remote or @next/mdx)
- [ ] Create `content/learn/` directory
- [ ] Build MDX custom components (ProjectExample, CityLinks, etc.)
- [ ] Implement `getArticleBySlug()` function
- [ ] Add `generateStaticParams()` for all articles

### Phase 3.2: Content Creation

- [ ] Write 8 educational articles (AI + human editing)
- [ ] Write 8 problem-solution guides
- [ ] Source or create featured images (16 total)
- [ ] Identify 2-3 related projects per article
- [ ] Create internal linking strategy (map articles → city/service pages)

### Phase 3.3: Page Components

- [ ] Build article header component
- [ ] Style prose content (Tailwind Typography)
- [ ] Create ProjectExample MDX component
- [ ] Create CityLinks MDX component
- [ ] Build related articles component
- [ ] Add social share buttons (optional)

### Phase 3.4: SEO Implementation

- [ ] Implement `generateMetadata()` for articles
- [ ] Add `generateArticleSchema()` to structured-data.ts
- [ ] Add `generateHowToSchema()` for guides
- [ ] Test JSON-LD with Google Rich Results Test
- [ ] Validate Open Graph tags with Facebook Debugger

### Phase 3.5: Hub Page (Optional)

- [ ] Create `/learn` index page
- [ ] List all articles with categories
- [ ] Add search/filter functionality
- [ ] Feature most popular articles

### Phase 3.6: Launch

- [ ] Update `app/sitemap.ts` to include articles
- [ ] Add links from homepage to featured articles
- [ ] Submit URLs to Google Search Console
- [ ] Monitor indexing and rankings

## Acceptance Criteria

### Functional Requirements

- ✅ URL `/learn/{slug}` resolves to article page
- ✅ MDX content renders correctly with components
- ✅ Related projects display with images and links
- ✅ Internal links to city/service pages work
- ✅ Related articles display at bottom
- ✅ Breadcrumbs navigate correctly

### SEO Requirements

- ✅ Unique `<title>` per article
- ✅ Unique meta description per article
- ✅ OpenGraph tags for social sharing
- ✅ Twitter card tags
- ✅ Canonical URL set correctly
- ✅ JSON-LD Article schema valid
- ✅ HowTo schema valid (for guides)
- ✅ H1 is article title

### Content Quality Requirements

- ✅ Content is 1,500-2,500 words
- ✅ Tone is helpful and educational
- ✅ Information is accurate and factual
- ✅ Target keyword integrated naturally
- ✅ Internal links to 3-5 transactional pages
- ✅ 2-3 project examples embedded

### Performance Requirements

- ✅ LCP < 2.5s
- ✅ CLS < 0.1
- ✅ FID < 100ms
- ✅ Images optimized (< 200KB each)
- ✅ Mobile-responsive

## Success Metrics (90 Days Post-Launch)

### SEO Performance

- ✅ 16 articles indexed in Google
- ✅ 10+ keywords in top 50
- ✅ 5+ keywords in top 20
- ✅ 1,000+ organic clicks/month

### Internal Linking Performance

- ✅ Average 2+ pages per session from articles
- ✅ 20%+ CTR on city hub links
- ✅ 15%+ CTR on project example links

### Conversion Performance

- ✅ 10%+ of article readers navigate to city pages
- ✅ 5%+ of article readers view contractor profiles
- ✅ 5+ contractor signups attributed to educational content

## Related Documentation

- [SEO Discovery Strategy](../../SEO-DISCOVERY-STRATEGY.md) - Section 4.4, 6.2
- [National Service Template](./national-service.md) - Related content type
- [Content Plan](../../../../docs/content-planning/masonry/content-plan.md) - Source content (Section 2)
- [EPIC-005: SEO](../../02-requirements/epics/EPIC-005-seo.md) - Requirements epic
