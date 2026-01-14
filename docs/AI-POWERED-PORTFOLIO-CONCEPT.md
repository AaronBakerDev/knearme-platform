# KnearMe: AI-Powered Project Showcases for Masonry Contractors

## Executive Summary

**The Problem:** Contractors don't update their portfolios because creating content is work they don't have time for.

**The Solution:** Make the portfolio build itself through AI + job management integration.

**The Flow:**
```
Job completed in Jobber
        ↓
AI sees: photos, job type, location, customer
        ↓
AI generates: professional project write-up
        ↓
Contractor reviews on phone: "Looks good" → Approve
        ↓
Published to KnearMe portfolio
        ↓
Optional: Share to Instagram/Facebook
```

**The contractor's effort: 30 seconds to approve.**

---

## Market Research Findings

### The Masonry Market

- **$32-40 billion market** with ~95,000 masonry businesses in the USA
- Most employ **fewer than 5 people**
- **Highly fragmented** - top 3 companies control less than 1% of revenue
- Low barriers to entry, reputation-driven

Sources:
- [IBISWorld Masonry Industry Statistics](https://www.ibisworld.com/industry-statistics/market-size/masonry-united-states/)
- [Anything Research - Masonry Contractors](https://www.anythingresearch.com/industry/Masonry-Contractors.htm)

### Why Contractors Don't Update Websites

- Construction companies are "notorious for having non-existent or bad websites"
- Many rely on word-of-mouth: "We've gotten this far without a good website, why do we need it now?"
- Time constraints - they're too busy doing the actual work
- An outdated website affects credibility and makes it hard for potential clients to trust

Sources:
- [Design Hero - Construction Website Mistakes](https://www.design-hero.com/business-tips/construction-industry-website-mistakes/)
- [Iron Cloud Creative - Fixing Outdated Construction Websites](https://ironcloudcreative.com/blog/how-to-fix-an-outdated-construction-website/)

### Construction Content on Social Media is HUGE

Successful contractor influencers:
- **Eddy Lopez (@ez_home)** - 2.6 million TikTok followers
- **RRBuildings** - 1.7M TikTok + 777K YouTube + 416K Instagram
- **@bricklayermaz** (UK bricklayer) - 586K TikTok followers

Content that works: before/after, process videos, day-in-the-life, humor

Sources:
- [Construction Dive - TikTok Construction Influencers](https://www.constructiondive.com/news/tiktok-construction-influencer-skillsusa/752502/)
- [Construction Dive - 9 Construction Social Media Influencers](https://www.constructiondive.com/news/9-construction-social-media-influencers-to-watch/608341/)

### The Gap: No "Behance for Construction"

- **Behance/Dribbble** - for designers, not trades
- **Houzz** - expensive ($249/mo), designer-focused
- **Instagram/TikTok** - general purpose, not searchable by trade/location
- **Nextdoor** - small sample sizes, no vetting
- **Traditional directories** - static listings, not social

**Nobody has built a portfolio social network specifically for construction trades.**

---

## Product Vision

### What This Is

"Instagram meets Dribbble for masonry contractors—a social portfolio where every job you complete becomes a permanent showcase that builds your reputation."

### What This Is NOT

| Not This | But This |
|----------|----------|
| Angi/HomeAdvisor (lead gen marketplace) | Portfolio showcase with organic discovery |
| Houzz (designer-focused, expensive) | Trades-first, free to post |
| Traditional directory (static listings) | Living, social feed of work |
| Instagram (general purpose) | Purpose-built for showing craftsmanship |

---

## Three Paths to Content Creation

### Path 1: Job Management Integration (Lowest Friction)

**How it works:**
1. Contractor connects Jobber/ServiceTitan/Housecall Pro
2. Job completion triggers webhook
3. KnearMe pulls: job type, photos, location, notes
4. AI generates project showcase
5. Push notification: "New project ready for review"
6. Contractor approves or edits → Published

**Supported platforms (all have APIs):**
- **Jobber** - GraphQL API, Zapier integration with "New Job Completion" trigger
- **ServiceTitan** - V2 APIs with open access, 30+ direct integrations
- **Housecall Pro** - API available, works with Zapier/Pipedream

**What the AI receives:**
- Job type (masonry repair, new installation, restoration)
- Location (city, state)
- Photos attached to job
- Technician notes
- Customer info (with permission)

**What the AI generates:**
```
🧱 Stone Retaining Wall | Denver, CO

Completed a 40-foot stone retaining wall for a hillside
property in Washington Park. The client needed structural
support while maintaining the home's craftsman aesthetic.

We used locally-sourced Colorado sandstone with a dry-stack
technique, incorporating drainage behind the wall to prevent
water damage. Total project time: 3 days.

#masonry #retainingwall #denver #stonework
```

Sources:
- [Jobber API Documentation](https://developer.getjobber.com/docs/)
- [Jobber Zapier Integration](https://zapier.com/apps/jobber/integrations/webhook/1524681/create-posts-in-webhooks-by-zapier-from-new-job-completions-in-jobber)
- [ServiceTitan vs Housecall Pro Comparison](https://www.servicetitan.com/comparison/servicetitan-vs-housecall-pro)

### Path 2: AI Interview (Medium Friction, High Quality)

For jobs not in a management system, or when contractors want richer stories.

**How it works:**
1. Contractor opens KnearMe app after finishing a job
2. Uploads photos
3. AI interviewer asks 3-5 quick questions:
   - "What was the problem the customer had?"
   - "How did you solve it?"
   - "Anything unusual about this job?"
   - "How long did it take?"
4. Contractor responds via **voice or text**
5. AI generates polished write-up
6. Contractor approves → Published

**Example conversation:**
```
KnearMe: "Nice photos! What kind of job was this?"
Contractor: "Chimney rebuild, the whole thing was falling apart"

KnearMe: "What was wrong with it specifically?"
Contractor: "Mortar was shot, bricks were crumbling, probably 50 years old"

KnearMe: "How did you fix it?"
Contractor: "Tore it down to the roofline, rebuilt with new brick to match"

KnearMe: "How long did it take?"
Contractor: "About 4 days with my crew"

→ AI generates professional write-up
```

**Voice input is key.** Contractors can talk on the drive home. They won't type paragraphs.

### Path 3: Quick Post (Lowest Quality, Still Better Than Nothing)

**How it works:**
1. Upload photos
2. AI auto-detects: project type, materials (from image analysis)
3. Generates basic caption
4. One-tap publish

**For contractors who just want something up fast.**

---

## The AI Interview: Detailed UX Design

### Principles

1. **Fast** - 5 questions max, under 2 minutes
2. **Voice-first** - Talking > typing for contractors
3. **Smart defaults** - AI guesses, contractor confirms
4. **Forgiving** - Incomplete answers still produce content

### Sample Flow

```
┌─────────────────────────────────────────┐
│         📸 3 photos uploaded            │
│                                         │
│  AI: "Looks like a chimney rebuild!     │
│       Is that right?"                   │
│                                         │
│  [Yes, chimney] [No, different job]     │
└─────────────────────────────────────────┘
            │
            ▼ (User taps "Yes")
┌─────────────────────────────────────────┐
│  AI: "What was the main issue?"         │
│                                         │
│  🎤 [Hold to speak]                     │
│                                         │
│  Common answers:                        │
│  • Crumbling mortar                     │
│  • Leaning chimney                      │
│  • Storm damage                         │
└─────────────────────────────────────────┘
            │
            ▼ (User says "bricks were falling apart")
┌─────────────────────────────────────────┐
│  AI: "Got it! How did you fix it?"      │
│                                         │
│  🎤 [Hold to speak]                     │
│                                         │
│  • Full rebuild                         │
│  • Tuckpointing                         │
│  • Partial repair                       │
└─────────────────────────────────────────┘
            │
            ▼ (User says "rebuilt from the roofline up")
┌─────────────────────────────────────────┐
│  AI: "Last one—how long did it take?"   │
│                                         │
│  • 1 day    • 2-3 days                  │
│  • 4-5 days • 1 week+                   │
└─────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│  📝 Here's your project showcase:       │
│                                         │
│  "Chimney Rebuild | [Location]          │
│                                         │
│   This chimney had seen better days—    │
│   bricks were falling apart and the     │
│   mortar had completely deteriorated.   │
│   We rebuilt it from the roofline up    │
│   using matching brick to preserve the  │
│   home's character. Total time: 3 days."│
│                                         │
│  [Edit] [Approve & Publish]             │
└─────────────────────────────────────────┘
```

---

## Technical Architecture

### AI Components Needed

| Component | Purpose | Tools |
|-----------|---------|-------|
| Image analysis | Detect project type, materials from photos | GPT-4V, Claude Vision |
| Text generation | Write project descriptions | GPT-4, Claude |
| Voice transcription | Convert voice notes to text | Whisper, Deepgram |
| Conversational AI | Interview flow | Custom prompt engineering |

### Integration Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CONTRACTOR'S WORLD                   │
├─────────────────────────────────────────────────────────┤
│  Jobber / ServiceTitan / Housecall Pro / Photos app    │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼ (Webhook on job complete)
┌─────────────────────────────────────────────────────────┐
│                      KNEARME AI                         │
├─────────────────────────────────────────────────────────┤
│  1. Receive job data + photos                           │
│  2. Analyze images (project type, materials)            │
│  3. Generate project write-up                           │
│  4. Push notification to contractor                     │
│  5. Contractor approves/edits                           │
│  6. Publish to portfolio                                │
│  7. Optional: cross-post to Instagram/Facebook          │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    HOMEOWNER'S WORLD                    │
├─────────────────────────────────────────────────────────┤
│  Browse projects by location/type → Contact contractor  │
└─────────────────────────────────────────────────────────┘
```

---

## Why This Is Defensible

### 1. The Integration Moat
Building Jobber/ServiceTitan integrations takes time. Once you're connected, contractors won't switch easily. You become part of their workflow.

### 2. The Data Moat
Every approved post trains your AI to write better masonry descriptions. Over time, your AI understands masonry terminology, common problems, regional materials better than generic AI tools.

### 3. The Content Moat
The portfolio content lives on KnearMe. The more projects posted, the more valuable your SEO, the more homeowners find you, the more contractors join.

### 4. The Workflow Moat
Once a contractor sets up "approve on phone after each job," it becomes habit. They're not going back to manually updating their website.

---

## Competitive Landscape

| Tool | What It Does | Gap |
|------|--------------|-----|
| Narrato ($48/mo) | AI social media captions | Generic, no job integration |
| SocialBee | AI-powered social scheduling | No contractor focus, no portfolio |
| Ocoya | AI social media management | Generic, no project structure |
| Hootsuite AI | Construction social tools | Scheduling, not creation |
| **KnearMe** | AI + Job Integration + Portfolio | **Unique combination** |

**Nobody is doing: Job Management → AI → Portfolio → Social**

Sources:
- [Pro Remodeler - 4 AI Tools for Content Creating Contractors](https://www.proremodeler.com/home/article/55184596/4-ai-tools-for-the-content-creating-contractor)
- [SocialBee](https://socialbee.com/)
- [Ocoya](https://www.ocoya.com/)

---

## Product Roadmap: Phased Approach

### Phase 1: AI Interview MVP (Month 1-2)
- Mobile app or SMS-based interface
- Upload photos → AI asks questions → Generate write-up
- Simple approval flow
- Basic portfolio page

**Validate:** Will contractors use the AI interview flow?

### Phase 2: Jobber Integration (Month 3-4)
- Connect via Zapier first (faster than custom API)
- Trigger on job completion
- Pull job details and photos
- Auto-generate project showcase
- Push notification for approval

**Validate:** Is auto-creation from Jobber more valuable than interview?

### Phase 3: Multi-Platform + Cross-Posting (Month 5-6)
- Add ServiceTitan, Housecall Pro integrations
- One-tap cross-post to Instagram, Facebook
- "Share to your website" embed widget

**Validate:** Do contractors want cross-posting, or is the portfolio enough?

### Phase 4: Homeowner Discovery (Month 6+)
- SEO optimization for project pages
- Browse/search interface for homeowners
- "Request similar project" contact flow

---

## Pricing Model

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 3 projects/month, basic portfolio |
| **Pro** | $29/mo | Unlimited projects, Jobber integration, cross-posting |
| **Business** | $79/mo | Team accounts, analytics, priority support |

**Why this works:**
- Free tier gets contractors started (network effect)
- Pro tier unlocks the automation (real value)
- Business tier for bigger operations

---

## Validation Questions

### For Contractors:
1. "If you could approve a project showcase on your phone in 30 seconds after each job, would you do it?"
2. "Would you connect your Jobber account to auto-create posts?"
3. "Would you pay $29/month for this?"

### For You:
1. Can you build the AI interview flow in 2-3 weeks?
2. Can you get 20 masons to try it?
3. Does the Jobber integration provide enough data?

---

## Assessment: Before vs After

| Factor | Before (Directory Only) | After (AI + Integration) |
|--------|-------------------------|--------------------------|
| Differentiation | Low (another directory) | **High** (AI + workflow) |
| Contractor adoption | Hard (they're busy) | **Easier** (30-second approval) |
| Content quality | Variable (manual posts) | **Consistent** (AI-generated) |
| Defensibility | Low | **Medium-High** (integrations + data) |
| Monetization | Unclear | **Clear** (SaaS subscription) |

---

## Recommended Next Steps

### Week 1-2: Contractor Validation
- Find 20 masonry contractors (your city + 2 others)
- Show them the concept (mockup or deck)
- Ask: "Would you post your projects here?"
- Ask: "What would make this valuable to you?"

### Week 3-4: Build Minimal Version
- AI interview flow (voice + text input)
- Photo upload
- AI-generated write-up
- Approval flow
- Basic portfolio page

### Week 5-8: Seed Content
- Manually onboard 20 contractors
- Help them post their first 3-5 projects
- Get to 100 projects in one metro area

### Week 9-12: Validate Homeowner Interest
- SEO: "masonry projects [city]"
- Social: Share beautiful projects
- Measure: Do homeowners browse? Contact?

---

## Final Verdict

**Is this worth pursuing?** Yes, with the AI + integration approach.

The key insight: **Contractors have the content (photos from every job), they just need someone to turn it into a portfolio.** The AI does that work for them.

**The MVP to build:**
1. Upload photos
2. AI asks 3-5 questions (voice input)
3. AI generates project showcase
4. One-tap approve
5. Portfolio page that accumulates all projects

**If contractors will spend 2 minutes after each job to build their portfolio, you have a product. If not, iterate on the friction until they will.**
