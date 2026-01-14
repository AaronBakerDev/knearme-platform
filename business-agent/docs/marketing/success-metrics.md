# SEO Success Metrics & Monitoring

> **Version:** 1.0
> **Last Updated:** December 2024
> **Status:** Active
> **Purpose:** Define KPIs, targets, and monitoring processes for SEO performance

---

## 1. Overview

This document defines measurable success criteria for the SEO & Discovery strategy. All metrics are tracked monthly and reviewed quarterly for strategic adjustments.

**Source:** `/docs/11-seo-discovery/SEO-DISCOVERY-STRATEGY.md` Section 8

**Measurement Philosophy:**
- **Leading Indicators:** Indexed pages, backlinks, content production (predict future success)
- **Lagging Indicators:** Organic clicks, rankings, conversions (measure current success)
- **Vanity Metrics to Avoid:** Social shares, total traffic (doesn't correlate with business goals)

---

## 2. SEO Performance KPIs

### 2.1 Core SEO Metrics

| Metric | Baseline (Dec 2024) | 3-Month Target (Mar 2025) | 6-Month Target (Jun 2025) | 12-Month Target (Dec 2025) | Tool |
|--------|---------------------|---------------------------|---------------------------|----------------------------|------|
| **Indexed Pages** | 50 | 200 | 500 | 2,000 | Google Search Console |
| **Organic Clicks/Month** | 50 | 500 | 2,000 | 8,000 | Google Search Console |
| **Organic Impressions/Month** | 1,000 | 10,000 | 50,000 | 200,000 | Google Search Console |
| **Average CTR** | 5% | 5% | 4% | 4% | Google Search Console |
| **Average Position (Top 50 Keywords)** | Not ranking | 35 | 20 | 12 | Ahrefs / local-beacon |

**Definitions:**
- **Indexed Pages:** Pages successfully crawled and indexed by Google (GSC Coverage report)
- **Organic Clicks:** Users clicking from Google search results to site
- **Organic Impressions:** Times site appeared in search results
- **Average CTR:** Clicks ÷ Impressions (expected to decrease as more long-tail keywords rank)
- **Average Position:** Mean ranking position across tracked keywords (lower is better)

**Monitoring:**
- **Weekly:** Check GSC for sudden drops in clicks or impressions
- **Monthly:** Export GSC data to spreadsheet for trend analysis
- **Quarterly:** Compare to targets, adjust strategy if >20% variance

---

### 2.2 Keyword Ranking Metrics

| Metric | Baseline (Dec 2024) | 3-Month Target (Mar 2025) | 6-Month Target (Jun 2025) | 12-Month Target (Dec 2025) | Tool |
|--------|---------------------|---------------------------|---------------------------|----------------------------|------|
| **Keywords in Top 10** | 0 | 5 | 25 | 100 | Ahrefs / local-beacon |
| **Keywords in Top 20** | 0 | 10 | 50 | 200 | Ahrefs / local-beacon |
| **Keywords in Top 50** | 0 | 25 | 100 | 300 | Ahrefs / local-beacon |
| **Featured Snippets Won** | 0 | 0 | 2 | 5 | Manual tracking + GSC |

**Target Keywords (50-100 tracked):**

**Phase 2 (Priority Keywords):**
- "chimney repair in Denver"
- "tuckpointing in Lakewood"
- "masonry contractors Denver"
- "brick repair Aurora CO"
- "Denver masonry"
- (45 more city + service combinations)

**Phase 3 (Add Informational Keywords):**
- "how much does chimney repair cost"
- "tuckpointing vs repointing"
- "how to choose a masonry contractor"
- (20 more informational queries)

**Monitoring:**
- **Weekly:** Check rank tracker for position changes
- **Monthly:** Identify keywords moving up (top 20 → top 10) for optimization
- **Quarterly:** Add new keywords, remove irrelevant keywords

---

### 2.3 Backlink Metrics

| Metric | Baseline (Dec 2024) | 3-Month Target (Mar 2025) | 6-Month Target (Jun 2025) | 12-Month Target (Dec 2025) | Tool |
|--------|---------------------|---------------------------|---------------------------|----------------------------|------|
| **Referring Domains (Backlinks)** | 1 | 5 | 15 | 50 | Ahrefs |
| **Domain Authority (DA)** | 10 | 15 | 25 | 40 | Moz |
| **Dofollow Backlinks** | 1 | 4 | 12 | 40 | Ahrefs |
| **Toxic Backlinks** | 0 | 0 | 0 | 0 | Ahrefs (monitor) |

**Backlink Sources:**
- **Phase 2:** Local directories (BBB, chambers of commerce), contractor websites
- **Phase 3:** Guest posts, PR mentions, industry associations
- **Phase 4:** Contractor partnerships, content syndication

**Quality Criteria:**
- Domain Authority >20
- Relevant niche (construction, home improvement, local)
- Dofollow (passes link equity)
- Not from link farms or PBNs

**Monitoring:**
- **Bi-weekly:** Check Ahrefs for new backlinks
- **Monthly:** Identify and disavow toxic backlinks (if any)
- **Quarterly:** Analyze backlink gaps vs. competitors

---

### 2.4 Technical SEO Metrics

| Metric | Baseline (Dec 2024) | 3-Month Target (Mar 2025) | 6-Month Target (Jun 2025) | 12-Month Target (Dec 2025) | Tool |
|--------|---------------------|---------------------------|---------------------------|----------------------------|------|
| **Core Web Vitals - LCP** | 2.1s | <2.5s | <2.0s | <1.5s | PageSpeed Insights, GSC |
| **Core Web Vitals - CLS** | 0.08 | <0.1 | <0.05 | <0.05 | PageSpeed Insights, GSC |
| **Core Web Vitals - INP** | 50ms | <200ms | <200ms | <200ms | PageSpeed Insights, GSC |
| **Mobile Usability Score** | 95 | 98 | 100 | 100 | Google Search Console |
| **Crawl Errors (404s, 500s)** | 0 | 0 | 0 | 0 | Google Search Console |

**Core Web Vitals Definitions:**
- **LCP (Largest Contentful Paint):** Time to render largest element (target: <2.5s)
- **CLS (Cumulative Layout Shift):** Visual stability (target: <0.1)
- **INP (Interaction to Next Paint):** Responsiveness (target: <200ms; replaces FID in 2024)

**Monitoring:**
- **Weekly:** Check PageSpeed Insights for top 5 pages
- **Monthly:** Review GSC "Core Web Vitals" report
- **Quarterly:** Full site audit with Screaming Frog or Sitebulb

---

### 2.5 Rich Results Metrics

| Metric | Baseline (Dec 2024) | 3-Month Target (Mar 2025) | 6-Month Target (Jun 2025) | 12-Month Target (Dec 2025) | Tool |
|--------|---------------------|---------------------------|---------------------------|----------------------------|------|
| **Pages with Valid Structured Data** | 50 | 200 | 500 | 2,000 | Google Search Console |
| **Rich Result Impressions/Month** | 0 | 1,000 | 10,000 | 50,000 | Google Search Console |
| **Rich Result Clicks/Month** | 0 | 100 | 1,000 | 5,000 | Google Search Console |
| **Rich Result CTR** | N/A | 10% | 10% | 10% | GSC (Rich Results report) |

**Rich Result Types:**
- **Breadcrumbs:** All public pages (Phase 2)
- **FAQ:** National Service pages, Educational articles (Phase 3)
- **HowTo:** Problem-solution guides (Phase 3)
- **AggregateRating:** Contractor profiles (Phase 3+, requires reviews)

**Monitoring:**
- **Monthly:** Check GSC "Enhancements" > "Rich Results" for errors
- **Quarterly:** Validate random sample with Rich Results Test

---

## 3. Business Outcome KPIs

### 3.1 Contractor Acquisition Metrics

| Metric | Baseline (Dec 2024) | 3-Month Target (Mar 2025) | 6-Month Target (Jun 2025) | 12-Month Target (Dec 2025) | Measurement Method |
|--------|---------------------|---------------------------|---------------------------|----------------------------|-------------------|
| **Contractor Signups (Total)** | 5 | 25 | 75 | 250 | Supabase `contractors` table |
| **Contractor Signups (Organic Search)** | 0 | 5 | 20 | 100 | GA4 attribution (source: `organic`) |
| **Contractor Signups (Content)** | 0 | 3 | 10 | 40 | GA4 attribution (landing page: `/learn/*`, `/guides/*`) |
| **Contractor Signups (Referral)** | 0 | 3 | 10 | 30 | Referral code tracking (future) |
| **Active Contractors (≥1 Published Project)** | 3 | 15 | 50 | 150 | SQL: `SELECT COUNT(DISTINCT contractor_id) FROM projects WHERE status='published'` |

**Attribution Method (GA4):**
- **Organic Search:** `utm_source=google` OR `source/medium=google/organic`
- **Content-Attributed:** Landing page matches `/learn/*` or `/guides/*`
- **Referral:** `utm_source=contractor_referral`

**Monitoring:**
- **Weekly:** Check new contractor signups in Supabase
- **Monthly:** Analyze GA4 acquisition reports
- **Quarterly:** Cohort analysis (retention by signup source)

---

### 3.2 Content Production Metrics

| Metric | Baseline (Dec 2024) | 3-Month Target (Mar 2025) | 6-Month Target (Jun 2025) | 12-Month Target (Dec 2025) | Measurement Method |
|--------|---------------------|---------------------------|---------------------------|----------------------------|-------------------|
| **Projects Published** | 15 | 75 | 300 | 1,200 | Supabase `projects` table (status=published) |
| **Avg Projects per Contractor** | 5 | 5 | 6 | 8 | Total projects / active contractors |
| **Service Type by City Pages** | 0 | 60 | 60 | 300 | Manual count (10 cities × 6 services → 50 cities × 6) |
| **National Service Pages** | 0 | 0 | 8 | 8 | Manual count |
| **Educational Articles** | 0 | 4 | 8 | 12 | Manual count |
| **Problem-Solution Guides** | 0 | 4 | 8 | 12 | Manual count |

**Monitoring:**
- **Weekly:** Track project publish rate (target: 10-20 projects/week by Phase 3)
- **Monthly:** Review content calendar vs. actual production
- **Quarterly:** Analyze content performance (traffic, conversions)

---

### 3.3 User Engagement Metrics

| Metric | Baseline (Dec 2024) | 3-Month Target (Mar 2025) | 6-Month Target (Jun 2025) | 12-Month Target (Dec 2025) | Tool |
|--------|---------------------|---------------------------|---------------------------|----------------------------|------|
| **Avg Session Duration** | 1:30 | 2:00 | 2:30 | 3:00 | GA4 |
| **Pages per Session** | 2.0 | 3.0 | 3.5 | 4.0 | GA4 |
| **Bounce Rate** | 60% | 50% | 45% | 40% | GA4 |
| **Contractor Profile Clicks (from Projects)** | 10/week | 50/week | 200/week | 500/week | GA4 custom event |

**Engagement Strategy:**
- **Related Projects Component:** Increase pages/session (Phase 2)
- **Internal Linking:** Reduce bounce rate (Phase 2-3)
- **High-Quality Content:** Increase session duration (Phase 3)

**Monitoring:**
- **Weekly:** Check GA4 "Engagement" report
- **Monthly:** Identify low-engagement pages for optimization
- **Quarterly:** A/B test layouts to improve engagement

---

## 4. Measurement Tools & Setup

### 4.1 Tool Stack

| Tool | Use Case | Cost | Access |
|------|----------|------|--------|
| **Google Search Console** | Indexed pages, clicks, impressions, keyword rankings, crawl errors | Free | Required |
| **Google Analytics 4** | Traffic sources, user behavior, conversions, custom events | Free | Required |
| **Ahrefs** | Keyword research, backlinks, competitor analysis, rank tracking | $99-199/mo | Recommended |
| **PageSpeed Insights** | Core Web Vitals, performance scores | Free | Required |
| **Screaming Frog SEO Spider** | Site audits, broken links, structured data validation | Free (500 URLs) / $259/yr | Optional |
| **rank-tracking/local-beacon** | Self-hosted rank tracker (workspace tool) | Free (self-hosted) | Alternative to Ahrefs |
| **Schema Markup Validator** | Validate JSON-LD | Free | Required |

### 4.2 Google Search Console Setup

**Status:** To be completed in Phase 2

**Steps:**
1. Add property: `https://knearme.com`
2. Verify ownership via DNS TXT record or HTML file upload
3. Submit sitemap: `https://knearme.com/sitemap.xml`
4. Enable email notifications for critical issues

**Key Reports:**
- **Performance:** Clicks, impressions, CTR, average position
- **Coverage:** Indexed pages, crawl errors
- **Enhancements:** Rich results, Core Web Vitals, mobile usability
- **Links:** Internal and external links

**Monitoring Frequency:** Daily (automated email alerts), Weekly (manual review)

---

### 4.3 Google Analytics 4 Setup

**Status:** To be completed in Phase 2

**Steps:**
1. Create GA4 property
2. Install tracking code via `@next/third-parties/google` or `react-ga4`
3. Configure custom events:
   - `project_view` (when user views project detail page)
   - `contractor_profile_click` (when user clicks contractor CTA)
   - `contractor_signup` (when contractor completes registration)
   - `related_project_click` (when user clicks related project link)

**Key Reports:**
- **Acquisition:** Traffic sources, campaigns, channels
- **Engagement:** Pages per session, session duration, bounce rate
- **Conversions:** Goal completions (contractor signups)

**Monitoring Frequency:** Weekly (traffic trends), Monthly (detailed analysis)

**Privacy Compliance:**
- No PII collected (no email, phone in GA4)
- Cookie consent banner (Phase 2+)
- GDPR/CCPA compliant

---

### 4.4 Rank Tracking Setup

**Option A: Ahrefs Rank Tracker**
- **Cost:** $99-199/mo (included in Ahrefs subscription)
- **Limits:** 500-10,000 tracked keywords
- **Frequency:** Daily updates
- **Features:** Keyword difficulty, SERP features, competitor tracking

**Option B: Self-Hosted (rank-tracking/local-beacon)**
- **Cost:** Free (existing workspace tool)
- **Limits:** Unlimited keywords
- **Frequency:** Daily updates (configurable)
- **Features:** Custom dashboards, PostGIS geospatial queries

**Decision (Phase 2):** Start with Ahrefs for ease of use; migrate to local-beacon if budget constrained

**Initial Keywords to Track:** 50 keywords (expand to 100 in Phase 3)

**Monitoring Frequency:** Weekly (position changes), Monthly (trends)

---

## 5. Reporting & Dashboards

### 5.1 Weekly SEO Dashboard

**Audience:** SEO Lead, Product Lead

**Metrics:**
- Indexed pages (GSC)
- Organic clicks (GSC, last 7 days vs. prior 7 days)
- Keyword position changes (rank tracker, top 10 movers)
- Crawl errors (GSC)
- Core Web Vitals status (GSC)

**Format:** Google Sheets dashboard (automated with GSC API)

**Review:** Every Monday morning (15 minutes)

---

### 5.2 Monthly SEO Report

**Audience:** Leadership, Stakeholders

**Sections:**
1. **Executive Summary** (1 page)
   - Key wins and losses
   - Progress vs. targets
   - Action items for next month

2. **SEO Performance** (2 pages)
   - Indexed pages, organic clicks, impressions
   - Keyword rankings (top 10 movers)
   - Backlinks (new referring domains)

3. **Technical SEO** (1 page)
   - Core Web Vitals trends
   - Crawl errors fixed
   - Schema validation issues

4. **Content Production** (1 page)
   - Projects published
   - Articles/guides published
   - Top-performing content

5. **Business Outcomes** (1 page)
   - Contractor signups (organic vs. referral)
   - Revenue impact (if applicable)
   - Next month's priorities

**Format:** PDF or Google Slides

**Review:** First Friday of each month (1 hour meeting)

---

### 5.3 Quarterly Strategy Review

**Audience:** Leadership, SEO Lead, Product Lead

**Agenda:**
1. Review 3-month performance vs. targets
2. Identify underperforming areas
3. Adjust strategy and roadmap
4. Update keyword targets
5. Review competitive landscape
6. Budget review and allocation

**Duration:** 2 hours

**Cadence:** End of March, June, September, December

---

## 6. Success Thresholds & Alerts

### 6.1 Green/Yellow/Red Thresholds

**Indexed Pages:**
- 🟢 Green: ≥90% of target
- 🟡 Yellow: 70-89% of target
- 🔴 Red: <70% of target

**Organic Clicks:**
- 🟢 Green: ≥80% of target
- 🟡 Yellow: 50-79% of target
- 🔴 Red: <50% of target

**Core Web Vitals:**
- 🟢 Green: 100% pages pass (LCP <2.5s, CLS <0.1, INP <200ms)
- 🟡 Yellow: 90-99% pages pass
- 🔴 Red: <90% pages pass

**Contractor Signups (Organic):**
- 🟢 Green: ≥80% of target
- 🟡 Yellow: 50-79% of target
- 🔴 Red: <50% of target

### 6.2 Automated Alerts

**Google Search Console Email Alerts:**
- New manual action
- New security issue
- Sudden drop in indexed pages (>20%)

**Custom Alerts (via Scripts or Tools):**
- Core Web Vitals degradation (>10% increase in LCP)
- Keyword ranking drop (>10 positions for top 10 keywords)
- Backlink spike (potential negative SEO attack)
- Site downtime (>5 minutes)

**Alert Delivery:** Email + Slack (if team uses Slack)

---

## 7. Benchmarking & Competitive Analysis

### 7.1 Competitor Tracking

**Top Competitors:**
1. **Houzz** (DA 91)
2. **Angi** (DA 83)
3. **Yelp** (DA 93)
4. **HomeAdvisor** (DA 82)

**Metrics to Track (Monthly):**
- Domain Authority (Moz)
- Backlinks (Ahrefs)
- Top-ranking keywords (Ahrefs "Organic Keywords")
- Content velocity (new pages/month)

**Tool:** Ahrefs "Competitors" feature

**Monitoring:** Monthly review of competitor rankings for shared keywords

---

### 7.2 Industry Benchmarks

**Average Organic CTR by Position (2024 Data):**
- Position 1: 28-35%
- Position 2: 15-20%
- Position 3: 10-13%
- Position 4-10: 2-8%

**Average Time to Rank:**
- Top 10: 6-12 months for medium-competition keywords
- Top 20: 3-6 months for low-competition keywords

**Content Velocity:**
- High-growth sites: 20-50 new pages/month
- KNearMe Target (Phase 3): 10-15 new pages/month

---

## 8. Optimization Workflow

### 8.1 Low-Hanging Fruit Identification

**Monthly Process:**
1. **Export GSC "Queries" report** (filter: impressions >100, position 11-20)
2. **Identify top 10 keywords** with highest impressions (high visibility, just outside top 10)
3. **Analyze ranking pages** (which page ranks for each keyword?)
4. **Optimize on-page SEO:**
   - Update H1/title tag to include keyword
   - Add keyword to first 100 words
   - Improve content quality (add 200-300 words)
   - Add internal links from high-authority pages
5. **Monitor for 2 weeks** (check rank tracker for position changes)

**Success Rate:** 30-50% of optimized pages improve 3+ positions

---

### 8.2 Content Refresh Workflow

**Quarterly Process:**
1. **Identify stale content** (published >6 months ago, traffic declining)
2. **Update statistics and dates** (e.g., "2024" → "2025")
3. **Add new sections** based on GSC "Queries" (new related keywords)
4. **Improve readability** (headings, bullet points, images)
5. **Update meta description** (improve CTR)
6. **Request re-indexing** via GSC

**Target:** Refresh 10-20 pages/quarter

---

## 9. Contingency Plans

### 9.1 Traffic Drop Response Plan

**If organic traffic drops >20% week-over-week:**

1. **Check Google Search Console** for manual actions or security issues
2. **Check site uptime** (is site accessible?)
3. **Check Core Web Vitals** (performance regression?)
4. **Check recent code changes** (did deploy break SEO tags?)
5. **Check Google algorithm update** (MozCast, SEMrush Sensor)
6. **Analyze GSC "Coverage" report** (sudden de-indexing?)

**Escalation:** If no obvious cause within 24 hours, consult SEO expert

---

### 9.2 Ranking Drop Response Plan

**If top keyword drops >10 positions:**

1. **Check if competitor outranked us** (Ahrefs "SERP" report)
2. **Check if SERP features changed** (new featured snippet, local pack?)
3. **Analyze content quality gap** (is competitor content better?)
4. **Check backlinks** (did we lose a key backlink?)
5. **Optimize page** (improve content, add internal links)

**Timeline:** Re-evaluate after 2 weeks of optimization

---

## 10. Document Maintenance

### 10.1 Update Cadence

**Monthly:**
- Update actual metrics vs. targets (Section 2-3 tables)
- Add new keywords to tracking list
- Review and adjust thresholds if needed

**Quarterly:**
- Review success criteria for next quarter
- Update baseline metrics
- Adjust roadmap based on performance

**Annually:**
- Full strategy review
- Competitor benchmarking refresh
- Tool stack evaluation (switch tools if needed)

---

## 11. Document References

**Related Documentation:**
- `/docs/11-seo-discovery/SEO-DISCOVERY-STRATEGY.md` - Overall strategy (source)
- `/docs/11-seo-discovery/implementation-phases.md` - Roadmap and timelines
- `/docs/11-seo-discovery/keyword-targeting.md` - Keyword strategy

**External Resources:**
- [Google Search Console Help](https://support.google.com/webmasters)
- [Google Analytics 4 Help](https://support.google.com/analytics)
- [Ahrefs Academy](https://ahrefs.com/academy)
- [Moz SEO Guide](https://moz.com/beginners-guide-to-seo)

---

**Last Updated:** December 2024
**Owner:** SEO Lead
**Review Cadence:** Monthly (metrics), Quarterly (strategy)
