# Sprint 8: Content Authority Building

> **Status:** 🔄 In Progress
> **Epic References:** EPIC-005 (SEO), SEO-DISCOVERY-STRATEGY.md
> **Estimated Duration:** 8-12 weeks
> **Timing:** March - June 2025
> **Last Updated:** 2025-12-10 (Articles 2-8 written)

## Overview

Build topical authority through national service landing pages, educational content hub, and strategic backlink acquisition. This sprint focuses on content marketing and off-page SEO to complement the technical foundation from Sprint 7.

---

## 1. National Service Landing Pages

### Route Implementation
- [x] Create route: `app/(marketing)/services/[type]/page.tsx` ✅ (Already implemented)
- [x] Implement `generateStaticParams()` for all service types ✅
- [x] Configure ISR with 86400s revalidation (daily) ✅

### Service Pages (8 Total)
- [x] `/services/chimney-repair` ✅
- [x] `/services/tuckpointing` ✅
- [x] `/services/brick-repair` ✅
- [x] `/services/stone-masonry` ✅
- [x] `/services/foundation-repair` ✅
- [x] `/services/historic-restoration` ✅
- [x] `/services/masonry-waterproofing` ✅
- [x] `/services/efflorescence-removal` ✅

### Page Content Sections
- [x] Hero with service overview (200-300 words) ✅
- [x] "What is [Service]?" section (500+ words) ✅
- [x] Common problems addressed (bullet list) ✅
- [ ] Process overview (4-6 steps)
- [ ] Cost factors section
- [x] FAQ section (6-10 Q&A pairs) ✅
- [x] "Find [Service] by City" section with links ✅

### SEO Implementation
- [x] Implement FAQ schema for all Q&A sections ✅
- [ ] Add HowTo schema for process sections
- [x] Create unique meta titles and descriptions ✅
- [ ] Generate service-specific OG images
- [x] Add breadcrumbs ✅

---

## 2. Educational Content Infrastructure

### Content Route Setup
- [x] Create route: `app/(marketing)/learn/[slug]/page.tsx` ✅ (2025-12-10)
- [x] Set up MDX content directory: `content/learn/` ✅ (2025-12-10)
- [x] Configure MDX with next-mdx-remote ✅ (2025-12-10)
- [x] Implement reading time calculation ✅ (2025-12-10)

### Article Template Components
- [x] Create ArticleLayout component (inline in page) ✅ (2025-12-10)
- [x] Implement table of contents generation (sidebar) ✅ (2025-12-10)
- [x] Add social share buttons ✅ (2025-12-10)
- [x] Create author bio section ✅ (2025-12-10)
- [x] Implement related articles section ✅ (2025-12-10)

### Structured Data for Articles
- [x] Implement Article JSON-LD schema ✅ (2025-12-10)
- [x] Add datePublished and dateModified ✅ (2025-12-10)
- [x] Include author and publisher info ✅ (2025-12-10)
- [x] Add image and headline metadata ✅ (2025-12-10)

### HowTo Schema Implementation
- [x] Create `generateHowToSchema()` function ✅ (Already exists in structured-data.ts)
- [ ] Implement for step-by-step guides
- [ ] Include supply list and tools
- [ ] Add estimated time and cost

---

## 3. Content Production (8 Articles)

### Article 1: Signs Your Chimney Needs Repair
- [x] Research and outline (15 signs) ✅ (2025-12-10)
- [x] Write 1500+ word article ✅ (2025-12-10)
- [ ] Create custom images (diagrams of damage types)
- [x] Implement FAQ schema ✅ (2025-12-10)
- [ ] Peer review and edit

### Article 2: Understanding Masonry Restoration Costs
- [x] Research national average costs ✅ (2025-12-10)
- [x] Create cost breakdown table ✅ (2025-12-10)
- [x] Write 2000+ word article ✅ (2025-12-10)
- [ ] Include cost calculator (interactive)
- [x] Add regional pricing notes ✅ (2025-12-10)

### Article 3: Choosing the Right Masonry Contractor
- [x] Outline 10 key factors ✅ (2025-12-10)
- [x] Write 1800+ word article ✅ (2025-12-10)
- [ ] Create contractor checklist (downloadable)
- [x] Include red flags section ✅ (2025-12-10)
- [x] Add "Questions to Ask" section ✅ (2025-12-10)

### Article 4: Tuckpointing vs Repointing Guide
- [x] Explain terminology differences ✅ (2025-12-10)
- [x] Write 1500+ word comparison article ✅ (2025-12-10)
- [ ] Create visual comparison images
- [x] Include when-to-use decision tree ✅ (2025-12-10)
- [x] Add cost comparison ✅ (2025-12-10)

### Article 5: Historic Brick Restoration Guide
- [x] Research preservation standards ✅ (2025-12-10)
- [x] Write 2000+ word guide ✅ (2025-12-10)
- [ ] Include case studies (with photos)
- [ ] Implement HowTo schema
- [x] Add resources and citations ✅ (2025-12-10)

### Article 6: Foundation Waterproofing Guide
- [x] Explain waterproofing methods ✅ (2025-12-10)
- [x] Write 1800+ word guide ✅ (2025-12-10)
- [x] Create method comparison table ✅ (2025-12-10)
- [x] Include DIY vs professional section ✅ (2025-12-10)
- [x] Add cost estimates ✅ (2025-12-10)

### Article 7: Stone Retaining Wall Cost Guide
- [x] Research material costs ✅ (2025-12-10)
- [x] Write 1700+ word cost guide ✅ (2025-12-10)
- [ ] Create cost per sq ft calculator
- [x] Include design considerations ✅ (2025-12-10)
- [ ] Add permit requirements by state

### Article 8: Efflorescence Prevention Guide
- [x] Explain causes and solutions ✅ (2025-12-10)
- [x] Write 1500+ word prevention guide ✅ (2025-12-10)
- [ ] Include before/after photos
- [x] Add DIY treatment steps ✅ (2025-12-10)
- [ ] Implement HowTo schema

---

## 4. Backlink Acquisition

### Industry Directory Submissions
- [ ] Submit to HomeAdvisor directory
- [ ] Submit to Angi (Angie's List)
- [ ] Submit to Thumbtack
- [ ] Submit to Houzz
- [ ] Submit to BuildZoom
- [ ] Submit to Porch
- [ ] Submit to Yelp for Business

### Association Partnerships
- [ ] Research masonry trade associations
- [ ] Reach out to 3-5 associations for partnership
- [ ] Offer to sponsor events or resources
- [ ] Get listed in member directories
- [ ] Propose guest blog contributions

### Local Business Blogs
- [ ] Identify 10 local business blogs in target cities
- [ ] Reach out with guest post pitches
- [ ] Write 5 guest posts (if accepted)
- [ ] Include natural backlinks to service pages
- [ ] Track referral traffic

### "Powered by KNearMe" Badge Program
- [ ] Design badge graphics (3 sizes)
- [ ] Create badge embed code
- [ ] Write badge program terms
- [ ] Add badge page to site
- [ ] Email program to existing contractors

### PR & Media Outreach
- [ ] Create press release template
- [ ] Identify 10 industry publications
- [ ] Pitch 3 story angles
- [ ] Respond to HARO requests (Help A Reporter Out)
- [ ] Track media mentions

---

## 5. Internal Linking Strategy

### Link Opportunities Audit
- [ ] Audit all service pages for linking opportunities
- [ ] Audit all articles for linking opportunities
- [ ] Create linking guidelines document
- [ ] Implement automated internal link suggestions

### Contextual Links
- [x] Add contextual links from articles to service pages ✅ (2025-12-10) - via relatedServices frontmatter
- [x] Add contextual links from service pages to articles ✅ (2025-12-10) - RelatedArticles component
- [x] Link related articles to each other ✅ (2025-12-10) - Related Articles section
- [ ] Add city-specific links where relevant

### Navigation Enhancements
- [x] Add "Learning Center" to main navigation ✅ (Already existed in SiteHeader.tsx)
- [ ] Create footer with article categories
- [x] Add service type dropdown menu ✅ (Already existed in SiteHeader.tsx)
- [x] Implement breadcrumbs on all pages ✅ (2025-12-10)

---

## 6. Content Promotion

### Email Marketing
- [ ] Set up email newsletter (Mailchimp/ConvertKit)
- [ ] Create welcome series for new contractors
- [ ] Send monthly roundup of new content
- [ ] Segment by service type interest

### Social Media
- [ ] Create LinkedIn company page
- [ ] Create Facebook business page
- [ ] Share articles on social (2x/week)
- [ ] Engage with masonry industry groups

### Content Syndication
- [ ] Identify syndication opportunities
- [ ] Republish on Medium with canonical tags
- [ ] Share on LinkedIn Articles
- [ ] Submit to industry forums

---

## 7. Performance Tracking

### Content Metrics
- [ ] Track article page views in GA4
- [ ] Monitor average time on page
- [ ] Track scroll depth
- [ ] Measure bounce rate

### SEO Metrics
- [ ] Track keyword rankings for article topics
- [ ] Monitor organic traffic growth
- [ ] Track backlinks acquired (weekly)
- [ ] Monitor Domain Authority (Moz/Ahrefs)

### Conversion Tracking
- [ ] Track CTA clicks on articles
- [ ] Monitor article-to-signup conversion rate
- [ ] Track referral traffic from backlinks
- [ ] Measure email newsletter signups

---

## Definition of Done

- [ ] 8 national service pages live
- [ ] 8 educational articles published (12,000+ total words)
- [ ] FAQ schema on all service pages
- [ ] HowTo schema on 4+ articles
- [ ] 10+ referring domains (backlinks)
- [ ] All articles added to sitemap
- [ ] Email newsletter active
- [ ] Social media accounts set up
- [ ] 25+ keywords in top 20 positions
- [ ] Organic traffic up 200% from Sprint 7 baseline

---

## Success Metrics (End of Sprint)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Indexed pages | 150+ | Google Search Console |
| Organic sessions | 2,000+/month | GA4 |
| Backlinks | 25+ | Ahrefs/Moz |
| Domain Authority | 20+ | Moz |
| Keywords top 10 | 15+ | GSC Performance |
| Keywords top 20 | 40+ | GSC Performance |
| Email subscribers | 100+ | Email platform |
| Avg session duration | > 2 min | GA4 |

---

## Notes

- Content quality over quantity - each article should be best-in-class
- Focus on answering real user questions (use AnswerThePublic, People Also Ask)
- Update articles quarterly to keep them fresh
- Monitor competitor content and differentiate
- Prioritize evergreen content over trending topics
- Use original images and diagrams - avoid stock photos
- Consider video content for future iterations
- Build email list aggressively - owned audience is key
- Track which articles drive most contractor signups
