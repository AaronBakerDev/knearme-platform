# Article Types

## Overview

We produce three tiers of content, each serving different search intents and funnel stages.

```
AWARENESS          CONSIDERATION         DECISION
(broad searches)   (comparing options)   (final validation)
      │                   │                    │
      ▼                   ▼                    ▼
┌──────────┐       ┌──────────────┐     ┌────────────────┐
│ Category │       │  Individual  │     │   Comparison   │
│ Roundups │  ───► │   Profiles   │ ──► │    Articles    │
└──────────┘       └──────────────┘     └────────────────┘
```

---

## Tier 1: Category Roundups

**Purpose**: Capture broad local service searches, feature multiple contractors

**Search Intent**: "best [service] [city]", "[service] near me"

**Volume**: 1 per service category per city (10 per city based on our search terms)

### Template Structure

```markdown
# Best [Service] in [City]: Top [N] Contractors for 2025

**Last Updated**: [Date]
**Based on**: Analysis of [X] Google reviews across [Y] contractors

[Introduction: What to look for in a [service] contractor]

## Our Top Picks

### 1. [Contractor Name] - Best Overall
**Rating**: ⭐ [X.X] ([N] reviews)
**What Customers Love**: [2-3 bullet points from review analysis]
**Potential Concerns**: [1 balanced point if any]
**Best For**: [Project type or customer type]
[Claim Profile CTA]

### 2. [Contractor Name] - Best Value
...

### 3-10. [Additional contractors]
...

## How We Ranked These Contractors
[Methodology explanation - builds trust]

## What to Ask Before Hiring
[Educational content - adds value]

## Frequently Asked Questions
[FAQ schema markup opportunities]

---
*Based on analysis of [X] public Google reviews.
Contractors can [claim their profile] to add additional information.*
```

### Example: Denver Chimney Repair

```markdown
# Best Chimney Repair in Denver: Top 10 Contractors for 2025

**Last Updated**: December 30, 2024
**Based on**: Analysis of 3,247 Google reviews across 87 contractors

Finding reliable chimney repair in Denver's climate means...

## Our Top Picks

### 1. A1 Chimney - Best Overall
**Rating**: ⭐ 4.3 (107 reviews)
**What Customers Love**:
- Fast response times, especially for emergencies
- Transparent pricing with detailed estimates
- Knowledgeable technicians who explain issues

**Best For**: Emergency repairs, annual inspections

[→ View Full Profile] [→ Claim This Listing]
```

---

## Tier 2: Individual Contractor Profiles

**Purpose**: Deep-dive on specific contractors, capture branded searches

**Search Intent**: "[business name] reviews", "[business name] [city]"

**Volume**: 1 per contractor with 10+ reviews (319 in Denver alone)

### Template Structure

```markdown
# [Contractor Name] Reviews: What [N] Denver Customers Say

**Rating**: ⭐ [X.X] based on [N] Google reviews
**Location**: [City, State]
**Services**: [List from category appearances]

## The Bottom Line
[2-3 sentence AI summary of overall reputation]

## What Customers Love
### [Theme 1: e.g., "Communication"]
[Quote] - [Reviewer Name]
[Analysis of this pattern]

### [Theme 2: e.g., "Quality of Work"]
...

## Areas for Improvement
[Balanced, fair criticism if patterns exist]

## Who This Contractor Is Best For
[Ideal customer profile based on review analysis]

## Recent Review Highlights
[3-5 recent reviews with dates]

## Business Information
- **Phone**: [if available]
- **Website**: [if available]
- **Address**: [if available]
- **Services**: [list]

---
*Is this your business? [Claim your profile] to respond to reviews
and add portfolio photos.*
```

### Data Requirements

| Field | Source | Required |
|-------|--------|----------|
| Business name | DataForSEO Maps | Yes |
| Rating | DataForSEO Maps | Yes |
| Review count | DataForSEO Maps | Yes |
| Reviews text | DataForSEO Reviews | Yes |
| Themes | Claude analysis | Yes |
| Contact info | DataForSEO Maps | Optional |
| Photos | Contractor-provided | Optional (upsell) |

---

## Tier 3: Interactive Comparison Tool

**Purpose**: Let users build their own comparisons from our data

**Search Intent**: "[company A] vs [company B]", "compare [service] contractors"

**Implementation**: Interactive tool, not static articles

> **See [06-comparison-tool.md](./06-comparison-tool.md) for full specification**

### Why a Tool Instead of Articles

| Static Articles | Interactive Tool |
|-----------------|------------------|
| Write N × N combinations | One tool, infinite comparisons |
| Goes stale | Always fresh from live data |
| We guess matchups | User picks their shortlist |
| Passive consumption | Active engagement |

### User Flow

1. User browses category roundup
2. Clicks "Add to Compare" on 2-4 contractors
3. Opens comparison tool
4. Side-by-side analysis powered by our review data
5. CTAs: "Email this comparison" or "Get quotes"

---

## Specialty Content (Future)

Additional article types once core content is established:

| Type | Example | Trigger |
|------|---------|---------|
| **Neighborhood Guide** | "Best Masonry in Capitol Hill" | Location data in reviews |
| **Project Type Guide** | "Denver Historic Brick Restoration" | Keyword mentions in reviews |
| **Seasonal Content** | "Chimney Prep Before Winter" | Timely, evergreen hybrid |
| **Price Guide** | "Tuckpointing Costs in Denver" | Price mentions in reviews |
| **FAQ Articles** | "How Long Does Tuckpointing Last?" | Question mining from reviews |

---

## Quality Thresholds

| Article Type | Min Reviews | Min Rating | Min Contractors |
|--------------|-------------|------------|-----------------|
| Category Roundup | N/A | 4.0+ to be featured | 5 |
| Individual Profile | 10 | 3.5+ (below = no article) | 1 |
| Comparison | 20 each | 4.0+ | 2 |

---

## Content Differentiation

What makes our articles unique (vs generic "Top 10" listicles):

1. **Data-backed claims**: "Based on 169 reviews" not "in our opinion"
2. **Theme extraction**: AI identifies patterns humans miss
3. **Balanced perspective**: Acknowledge weaknesses fairly
4. **Fresh data**: Reviews analyzed, not scraped once
5. **Local specificity**: Denver climate, regulations, neighborhoods
