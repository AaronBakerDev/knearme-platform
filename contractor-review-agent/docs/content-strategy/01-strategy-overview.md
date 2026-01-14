# Strategy Overview

## The Core Insight

**92% of homeowners trust referrals.** When they can't get one, they Google. The contractor with visible proof of quality work gets the call.

We're building a content engine that:
1. Aggregates and analyzes public Google reviews
2. Surfaces what homeowners actually care about
3. Presents contractors in a positive, trustworthy light
4. Converts contractors into paying customers

## Marketplace Cold-Start Solution

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRADITIONAL MARKETPLACE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐              ┌──────────────┐                │
│   │  Contractors │◄── need ───►│  Homeowners  │                │
│   │   (Supply)   │              │   (Demand)   │                │
│   └──────────────┘              └──────────────┘                │
│          │                             │                         │
│          └──── Neither comes first ────┘                         │
│                        ↓                                         │
│                    STUCK                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      OUR SOLUTION                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────────────────────────────────────────┐          │
│   │              REVIEW-BASED ARTICLES               │          │
│   │   "Best Chimney Repair in Denver (2025)"         │          │
│   └──────────────────────────────────────────────────┘          │
│              │                           │                       │
│              ▼                           ▼                       │
│   ┌──────────────────┐        ┌──────────────────┐              │
│   │   Contractors    │        │    Homeowners    │              │
│   │   Featured free  │        │   Find via SEO   │              │
│   │   See traffic    │        │   Trust content  │              │
│   │   Sign up        │        │   Contact pros   │              │
│   └──────────────────┘        └──────────────────┘              │
│              │                           │                       │
│              └───────── FLYWHEEL ────────┘                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Why This Works

### For Homeowners
| Pain Point | Our Solution |
|------------|--------------|
| "There are 100 contractors - who's actually good?" | Curated lists based on review analysis |
| "Reviews are overwhelming to read" | AI summarizes themes and patterns |
| "How do I know these reviews are real?" | We cite Google review data with counts |
| "I want local recommendations" | City + service specific content |

### For Contractors
| Pain Point | Our Solution |
|------------|--------------|
| "I have great reviews but no visibility" | We feature you in roundup articles |
| "SEO is expensive and confusing" | We rank for your keywords, you get traffic |
| "Lead gen sites charge too much" | Claim your profile for free, upgrade for more |
| "I can't compete with big companies online" | Small contractors with great reviews shine |

## The Business Model

```
PHASE 1: Build the Content Engine (Current)
├── Discover contractors (DataForSEO Google Maps)
├── Collect reviews (DataForSEO Reviews API)
├── Analyze with Claude (themes, sentiment, insights)
└── Generate articles (SEO-optimized, unique content)

PHASE 2: Drive Traffic
├── Publish articles on owned domain
├── Build internal links and topic clusters
├── Rank for local service searches
└── Track traffic and engagement

PHASE 3: Convert Contractors
├── "Claim Your Profile" CTAs in articles
├── Outreach to featured contractors
├── Show traffic/lead data as proof of value
└── Upsell to KnearMe portfolio or premium placement

PHASE 4: Monetize
├── Lead generation fees
├── Premium article placement
├── KnearMe portfolio subscriptions
└── Advertising/sponsorship
```

## Competitive Advantage

| Competitor | Their Model | Our Advantage |
|------------|-------------|---------------|
| **Yelp** | User reviews, pay-to-play ranking | AI analysis adds unique value, no extortion |
| **Angi** | Lead gen, contractor pays per lead | Content-first, contractors come to us |
| **HomeAdvisor** | Matching service, high fees | Free exposure, lower barrier |
| **Thumbtack** | Bidding system | We feature quality, not lowest bidder |
| **Google** | Raw reviews, no curation | We synthesize and recommend |

**Our moat**: 43K+ reviews analyzed by AI = unique content that can't be easily replicated.

## Key Metrics to Track

| Metric | Why It Matters |
|--------|----------------|
| Articles published | Content velocity |
| Organic traffic | Demand validation |
| Contractor claims | Supply-side conversion |
| Leads generated | Value to contractors |
| Revenue per contractor | Business sustainability |

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Contractors upset about being featured | Only positive framing, 4.0+ rating threshold |
| Google penalizes AI content | Human editing pass, unique insights, proper sourcing |
| DataForSEO costs scale poorly | Cache data, don't re-scrape unnecessarily |
| Legal challenges | Public data only, proper attribution |
| Competitors copy strategy | First-mover advantage, brand trust, data depth |
