# Interactive Comparison Tool

## Concept

Instead of static "A vs B" articles, provide an interactive tool where homeowners compare contractors themselves using our analyzed review data.

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPARISON TOOL                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Compare Denver Chimney Repair Contractors                       │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐    │
│  │ + Add Contractor│  │ + Add Contractor│  │+ Add (up to 4)│    │
│  └─────────────────┘  └─────────────────┘  └───────────────┘    │
│           │                    │                                 │
│           ▼                    ▼                                 │
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │  A1 Chimney     │  │  Chimney Kings  │                       │
│  │  ⭐ 4.3 (107)   │  │  ⭐ 4.7 (92)    │                       │
│  └─────────────────┘  └─────────────────┘                       │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│                                                                  │
│  COMPARISON RESULTS                                              │
│                                                                  │
│  Rating           ████████░░ 4.3    █████████░ 4.7              │
│  Reviews          ██████████ 107    ████████░░ 92               │
│  Response Time    ⚡ Fast           ⚡ Fast                      │
│  Price Mentions   $$$               $$                           │
│  Best For         Emergency         Scheduled                    │
│                                                                  │
│  ───────────────────────────────────────────────────────────    │
│  WHAT CUSTOMERS SAY                                              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Communication                                            │    │
│  │ A1: "They called back within an hour..."                │    │
│  │ Kings: "Easy to schedule online..."                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  [📧 Email me this comparison]  [📞 Get quotes from both]       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Why This is Better Than Static Articles

| Factor | Static Articles | Interactive Tool |
|--------|-----------------|------------------|
| **Scale** | Write thousands of A vs B pages | One tool handles all combinations |
| **Freshness** | Stale after a month | Real-time from database |
| **User intent** | We guess what they want | They tell us their shortlist |
| **Engagement** | Passive reading | Active interaction |
| **Lead capture** | Generic CTA | "Email me this comparison" = high intent |
| **SEO** | Each page needs to rank | Tool page + dynamic URLs |
| **Maintenance** | Update every article | Update data, tool reflects it |

---

## User Flow

```
1. User lands on category page (e.g., "Best Chimney Repair Denver")
       │
       ▼
2. Browses contractor cards, sees "Add to Compare" button
       │
       ▼
3. Selects 2-4 contractors they're considering
       │
       ▼
4. Clicks "Compare Selected"
       │
       ▼
5. Tool shows side-by-side analysis from our review data
       │
       ▼
6. CTAs:
   - "Email this comparison" (lead capture)
   - "Get quotes from these contractors" (lead gen)
   - "Share this comparison" (generates unique URL)
```

---

## Comparison Dimensions

Data we can compare (from review analysis):

| Dimension | Data Source | Display |
|-----------|-------------|---------|
| Overall Rating | `review_contractors.rating` | Star rating + bar |
| Review Count | `review_contractors.review_count` | Number + bar |
| Strengths | `review_analysis.strengths` | Theme tags |
| Weaknesses | `review_analysis.weaknesses` | Theme tags |
| Best For | `review_analysis.best_for` | Text badges |
| Price Level | `review_analysis.price_mentions` | $/$$/$$$  |
| Response Quality | `review_analysis.response_quality` | Score/description |
| Sentiment Trend | `review_analysis.sentiment_trend` | Arrow up/down/stable |
| Sample Quotes | `review_data` | Expandable quotes |

---

## Technical Implementation

### URL Structure

```
/compare?ids=uuid1,uuid2,uuid3

# Or with slugs:
/denver-co/chimney-repair/compare?c=a1-chimney,chimney-kings
```

### API Endpoint

```typescript
// GET /api/compare?ids=uuid1,uuid2,uuid3
// Returns comparison data for up to 4 contractors

interface ComparisonResponse {
  contractors: Array<{
    id: string;
    name: string;
    slug: string;
    rating: number;
    review_count: number;
    analysis: {
      strengths: Array<{ theme: string; frequency: number }>;
      weaknesses: Array<{ theme: string; frequency: number }>;
      best_for: string[];
      price_level: string;
      sample_quotes: string[];
    };
  }>;
  generated_at: string;
}
```

### Component Structure

```
src/components/compare/
├── CompareButton.tsx        # "Add to Compare" on contractor cards
├── CompareDrawer.tsx        # Floating drawer showing selected
├── ComparisonTable.tsx      # Main comparison grid
├── DimensionRow.tsx         # Single comparison dimension
├── QuoteCarousel.tsx        # Review quotes side-by-side
└── CompareActions.tsx       # Email/Share/Get Quotes CTAs
```

---

## Lead Capture

### "Email This Comparison"

```
┌─────────────────────────────────────────────────┐
│  Save this comparison                           │
│                                                 │
│  We'll email you:                               │
│  ✓ This side-by-side comparison                 │
│  ✓ Direct contact info for each contractor      │
│  ✓ Questions to ask when you call               │
│                                                 │
│  Email: [____________________]                  │
│                                                 │
│  [Send Comparison]                              │
└─────────────────────────────────────────────────┘
```

**Value to user**: Saves research, provides next steps
**Value to us**: High-intent lead, know which contractors they want

### "Get Quotes"

```
┌─────────────────────────────────────────────────┐
│  Get free quotes from these contractors         │
│                                                 │
│  ☑ A1 Chimney                                  │
│  ☑ Chimney Kings                               │
│  ☐ HomeStrong                                  │
│                                                 │
│  Your Info:                                     │
│  Name: [____________________]                   │
│  Phone: [____________________]                  │
│  Project: [Chimney repair ▼]                    │
│                                                 │
│  [Request Quotes]                               │
└─────────────────────────────────────────────────┘
```

**Value to user**: One form, multiple quotes
**Value to us**: Lead to sell to contractors

---

## SEO Considerations

The tool itself won't rank for "A vs B" queries initially, but:

1. **Canonical comparison URLs**: `/compare?c=a1-chimney,chimney-kings` can be indexed
2. **User-generated content**: Shared comparisons create linkable pages
3. **Long-tail capture**: "compare chimney contractors denver" → tool page
4. **Internal links**: Category pages link to "Compare these contractors"

---

## Analytics to Track

| Metric | Why It Matters |
|--------|----------------|
| Comparisons created | Tool engagement |
| Contractors per comparison | User behavior |
| Most compared contractors | Popular matchups |
| Comparison → Email capture rate | Funnel conversion |
| Comparison → Quote request rate | Lead quality |
| Time on comparison page | Engagement depth |

---

## Future Enhancements

1. **AI-generated summary**: "Based on reviews, A1 is better for emergencies while Chimney Kings is better for scheduled maintenance"

2. **"People also compared"**: Show common comparison pairs

3. **Saved comparisons**: Login to save and revisit

4. **Notification**: "A1 Chimney just got 5 new reviews - see updated comparison"

5. **Embed widget**: Let contractors embed their comparison on their site
