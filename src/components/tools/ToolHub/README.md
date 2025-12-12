# ToolHub Components

Reusable components for the tools section UX overhaul.

## Components

### 1. ToolCategorySection
Displays a category header with its tools in a responsive grid.

```tsx
import { ToolCategorySection } from '@/components/tools/ToolHub'
import { TOOLS_CATALOG } from '@/lib/tools/catalog'

const costPlanningTools = TOOLS_CATALOG.filter(t => t.category === 'cost-planning')

<ToolCategorySection
  category="cost-planning"
  tools={costPlanningTools}
/>
```

**Features:**
- Category icon + label + description header
- 2-3 column responsive grid
- Automatic coming soon badges
- ToolMetricsBadge for each tool
- Hover effects and transitions

---

### 2. ToolStartHere
Prominent "Start Here" recommendation card for first-time users.

```tsx
import { ToolStartHere } from '@/components/tools/ToolHub'
import { getToolBySlug } from '@/lib/tools/catalog'

const recommendedTool = getToolBySlug('masonry-cost-estimator')

<ToolStartHere tool={recommendedTool} />
```

**Features:**
- Eye-catching design with primary color accent
- "Start Here" badge with sparkles icon
- Brief explanation of why it's recommended
- Clear CTA button
- Decorative gradient background

---

### 3. ToolFAQSection
SEO-optimized FAQ accordion with structured data.

```tsx
import { ToolFAQSection, DEFAULT_TOOL_FAQS } from '@/components/tools/ToolHub'

// Use default FAQs
<ToolFAQSection faqs={DEFAULT_TOOL_FAQS} />

// Or provide custom FAQs
<ToolFAQSection faqs={[
  {
    question: 'How accurate are estimates?',
    answer: 'Our estimates are planning-level ranges...'
  }
]} />
```

**Features:**
- Clean accordion UI (shadcn/ui)
- Automatic JSON-LD FAQPage schema injection
- Default FAQs exported for reuse
- SEO-optimized for featured snippets

**Default FAQs:**
1. How accurate are these masonry cost estimates?
2. Do I need to create an account to use these tools?
3. Can I save or share my estimate?
4. What should I do after using a cost estimator?
5. Are these tools useful for contractors?

---

### 4. ToolMetricsBadge
Small badge showing tool complexity and time.

```tsx
import { ToolMetricsBadge } from '@/components/tools/ToolHub'

<ToolMetricsBadge
  inputCount={5}
  estimatedTime="~2 min"
  complexity="simple"
/>
```

**Features:**
- Clock icon + time estimate
- Input count with dynamic pluralization
- Optional complexity badge (hidden for "simple")
- Subtle styling (text-muted-foreground)

**Complexity Levels:**
- `simple` - No badge shown
- `moderate` - Shows "Moderate" badge
- `detailed` - Shows "Detailed" badge

---

## Example: Complete Tools Hub Page

```tsx
import {
  ToolCategorySection,
  ToolStartHere,
  ToolFAQSection,
  DEFAULT_TOOL_FAQS
} from '@/components/tools/ToolHub'
import { TOOLS_CATALOG, TOOL_CATEGORIES } from '@/lib/tools/catalog'

export default function ToolsHubPage() {
  const recommendedTool = TOOLS_CATALOG.find(t => t.slug === 'masonry-cost-estimator')

  // Group tools by category
  const toolsByCategory = Object.keys(TOOL_CATEGORIES).reduce((acc, category) => {
    acc[category] = TOOLS_CATALOG.filter(t => t.category === category)
    return acc
  }, {})

  return (
    <div className="container max-w-7xl mx-auto px-4 py-12 space-y-16">
      {/* Hero Section */}
      <div className="space-y-6">
        <h1 className="text-4xl font-bold">Homeowner Tools</h1>
        <p className="text-xl text-muted-foreground">
          Free calculators and guides to help you plan your masonry project.
        </p>
      </div>

      {/* Start Here Card */}
      {recommendedTool && <ToolStartHere tool={recommendedTool} />}

      {/* Category Sections */}
      {Object.entries(TOOL_CATEGORIES)
        .sort(([, a], [, b]) => a.order - b.order)
        .map(([category]) => (
          <ToolCategorySection
            key={category}
            category={category}
            tools={toolsByCategory[category]}
          />
        ))}

      {/* FAQ Section */}
      <ToolFAQSection faqs={DEFAULT_TOOL_FAQS} />
    </div>
  )
}
```

---

## Updating Tool Metadata

To add metrics to tools in the catalog:

```typescript
// src/lib/tools/catalog.ts
{
  slug: 'masonry-cost-estimator',
  title: 'Masonry Repair Cost Estimator',
  // ... other fields
  category: 'cost-planning',
  inputCount: 5,
  estimatedTime: '~2 min',
  complexity: 'simple',
  relatedTools: ['tuckpointing-calculator', 'brick-replacement-calculator'],
  relatedServices: ['masonry-repair', 'tuckpointing'],
}
```

---

## Styling Notes

- Uses shadcn/ui components (Card, Badge, Button, Accordion)
- Responsive grid: 1 column mobile, 2 columns tablet, 3 columns desktop
- Primary color accents for CTAs and highlights
- Muted colors for coming soon states
- Hover effects and smooth transitions
- Dark mode compatible

---

## SEO Considerations

**ToolFAQSection** automatically injects JSON-LD structured data for FAQPage:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How accurate are these masonry cost estimates?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Our cost estimators provide planning-level ranges..."
      }
    }
  ]
}
```

This helps Google show rich snippets in search results.

---

## File Structure

```
src/components/tools/ToolHub/
├── index.ts                    # Barrel exports
├── README.md                   # This file
├── ToolCategorySection.tsx     # Category + tools grid
├── ToolStartHere.tsx           # "Start Here" recommendation
├── ToolFAQSection.tsx          # FAQ accordion + schema
└── ToolMetricsBadge.tsx        # Metrics badge
```

---

## Next Steps

1. **Update tools catalog** with inputCount, estimatedTime, complexity, relatedTools, relatedServices
2. **Implement hub page** using ToolCategorySection and ToolStartHere
3. **Add FAQs** to hub page using ToolFAQSection
4. **Test responsiveness** on mobile, tablet, desktop
5. **Verify JSON-LD** using Google's Rich Results Test
