# Directory Component Hierarchy

Visual guide showing how directory components are used across different page types.

## Page Structure Flow

```
/directory
└─ Directory Landing Page
   ├─ DirectoryBreadcrumbs: ["Home", "Find Contractors"]
   └─ StateGrid
       └─ [State Cards] → Links to /directory/{state}

/directory/{state}
└─ State Directory Page
   ├─ DirectoryBreadcrumbs: ["Home", "Find Contractors", "{State}"]
   └─ CityGrid
       └─ [City Cards] → Links to /directory/{state}/{city}

/directory/{state}/{city}
└─ City Directory Page
   ├─ DirectoryBreadcrumbs: ["Home", "Find Contractors", "{State}", "{City}"]
   └─ Category Grid (using CategoryCard)
       └─ [Category Cards] → Links to /directory/{state}/{city}/{category}

/directory/{state}/{city}/{category}
└─ Category Listing Page
   ├─ DirectoryBreadcrumbs: ["Home", "Find Contractors", "{State}", "{City}", "{Category}"]
   └─ Business Grid (using BusinessCard)
       └─ [Business Cards] → Links to /directory/{state}/{city}/{category}/{slug}

/directory/{state}/{city}/{category}/{slug}
└─ Business Detail Page
   ├─ DirectoryBreadcrumbs: ["Home", "Find Contractors", "{State}", "{City}", "{Category}", "{Business}"]
   ├─ Business Info (name, rating, contact)
   ├─ StarRating (reused in header)
   └─ Business Details (description, photos, map, etc.)
```

## Component Dependencies

```
DirectoryBreadcrumbs
├─ generateBreadcrumbSchema (@/lib/seo/structured-data)
└─ shadcn/ui components: none (uses plain HTML)

StarRating
├─ lucide-react: Star, StarHalf
└─ @/lib/utils: cn

BusinessCard
├─ DirectoryPlace type (@/types/directory)
├─ StarRating (this folder)
├─ lucide-react: MapPin, Phone, ExternalLink
└─ shadcn/ui: Card, Badge, Button

CategoryCard
├─ CategoryStats type (@/types/directory)
├─ DirectoryCategoryMeta type (@/lib/constants/directory-categories)
├─ lucide-react: * (dynamic import based on meta.icon)
└─ shadcn/ui: Card, Badge

StateGrid
├─ StateStats type (@/types/directory)
├─ lucide-react: MapPin, Building2
└─ shadcn/ui: Card, Badge

CityGrid
├─ CityStats type (@/types/directory)
├─ lucide-react: Building2, Tag, Star
└─ shadcn/ui: Card, Badge
```

## Responsive Grid Breakpoints

All grid components use the same Tailwind breakpoints:

```css
/* Mobile: 1 column */
grid-cols-1

/* Tablet (md: 768px): 2 columns */
md:grid-cols-2

/* Desktop (lg: 1024px): 3 columns */
lg:grid-cols-3
```

## Component Import Map

```typescript
// Single import
import { BusinessCard } from '@/components/directory/BusinessCard';

// Barrel import (recommended)
import {
  BusinessCard,
  CategoryCard,
  StateGrid,
  CityGrid,
  DirectoryBreadcrumbs,
  StarRating,
} from '@/components/directory';
```

## Data Flow

```
Database (directory_places table)
  ↓
Data Layer (/src/lib/data/directory.ts)
  ├─ getStates() → StateStats[]
  ├─ getCitiesByState(stateSlug) → CityStats[]
  ├─ getCategoriesByCity(stateSlug, citySlug) → CategoryStats[]
  ├─ getBusinessesByCategory(...) → DirectoryPlace[]
  └─ getBusinessBySlug(...) → DirectoryPlace
  ↓
Server Components (Next.js App Router)
  ├─ /app/directory/page.tsx
  ├─ /app/directory/[state]/page.tsx
  ├─ /app/directory/[state]/[city]/page.tsx
  ├─ /app/directory/[state]/[city]/[category]/page.tsx
  └─ /app/directory/[state]/[city]/[category]/[slug]/page.tsx
  ↓
Directory Components (this folder)
  ├─ StateGrid
  ├─ CityGrid
  ├─ CategoryCard
  ├─ BusinessCard
  ├─ DirectoryBreadcrumbs
  └─ StarRating
  ↓
shadcn/ui Primitives
  ├─ Card
  ├─ Badge
  └─ Button
```

## SEO Schema Generation

```
DirectoryBreadcrumbs
  ├─ Generates: BreadcrumbList schema
  └─ Embedded in: <script type="application/ld+json">

Business Detail Page (future)
  ├─ Generates: LocalBusiness schema (from structured-data.ts)
  ├─ Generates: AggregateRating schema (if ratings exist)
  └─ Generates: FAQPage schema (from category metadata)

Category Listing Page (future)
  ├─ Generates: Service schema (from structured-data.ts)
  └─ Generates: ItemList schema (for business listings)
```

## Theme Support

All components support dark mode via Tailwind CSS variables:

```css
/* Light mode */
bg-card, text-card-foreground, border

/* Dark mode (automatic via next-themes) */
dark:bg-card, dark:text-card-foreground, dark:border
```

Colors automatically adapt:
- Primary/secondary/destructive variants
- Muted text colors
- Star rating yellow (same in both modes)
- Border hover effects

## Interactive States

### Hover Effects

**StateGrid / CityGrid / CategoryCard:**
- Border: `hover:border-primary/50`
- Shadow: `hover:shadow-md`
- Text: `group-hover:text-primary`
- Icon (CategoryCard): `group-hover:bg-primary group-hover:text-primary-foreground`

**BusinessCard:**
- Shadow: `hover:shadow-md`
- Title link: `hover:text-primary`

### Focus States

All interactive elements (links, buttons) use shadcn/ui focus-visible states:
- Ring: `focus-visible:ring-ring/50`
- Border: `focus-visible:border-ring`

## Accessibility Features

### ARIA Attributes

**StarRating:**
- `aria-label` on star container: "4.5 out of 5 stars"

**DirectoryBreadcrumbs:**
- `aria-label="Breadcrumb navigation"` on nav
- `aria-current="page"` on current breadcrumb

### Semantic HTML

**DirectoryBreadcrumbs:**
```html
<nav aria-label="Breadcrumb navigation">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/directory">Find Contractors</a></li>
    <li><span aria-current="page">Colorado</span></li>
  </ol>
</nav>
```

**Grid Components:**
- Use semantic links (`<Link>`) for navigation
- Proper heading hierarchy (h1 → h2 → h3)
- Descriptive link text (no "click here")

### Keyboard Navigation

- All links/buttons are keyboard accessible (tab navigation)
- Focus visible states for all interactive elements
- No keyboard traps or hidden interactive elements

## Performance Optimizations

### Image Optimization

Currently no images in these components. When adding business photos:
- Use `next/image` component
- Set proper width/height
- Use lazy loading
- Provide alt text

### Code Splitting

Components use barrel exports for tree-shaking:
```typescript
// Only imports what you use
import { BusinessCard } from '@/components/directory';
```

### Server Components

All components are React Server Components by default (no 'use client'):
- Rendered on server (faster initial load)
- No JavaScript sent to client for static content
- Only interactive parts (links, buttons) hydrated

## Testing Checklist

When testing these components:

1. **Responsive Design**
   - [ ] Test on mobile (< 768px)
   - [ ] Test on tablet (768px - 1024px)
   - [ ] Test on desktop (> 1024px)
   - [ ] Check grid layouts at each breakpoint

2. **Dark Mode**
   - [ ] Toggle dark mode (all components readable)
   - [ ] Check star colors (yellow in both modes)
   - [ ] Check hover states (visible in dark mode)

3. **Accessibility**
   - [ ] Tab through all interactive elements
   - [ ] Test with screen reader
   - [ ] Check ARIA labels on ratings
   - [ ] Verify semantic HTML structure

4. **SEO**
   - [ ] Inspect JSON-LD schema in breadcrumbs
   - [ ] Validate schema with Google Rich Results Test
   - [ ] Check link hrefs (proper routing)

5. **Content**
   - [ ] Test with long business names (truncation)
   - [ ] Test with missing ratings (shows "No reviews yet")
   - [ ] Test with missing address/phone/website
   - [ ] Test with empty states (no businesses/cities/states)

## Future Enhancements

Potential additions to this component library:

1. **DirectoryMap** - Interactive map view of businesses
2. **DirectoryFilter** - Filter sidebar (price, rating, distance)
3. **DirectorySort** - Sort dropdown (rating, distance, name)
4. **BusinessHours** - Display open/closed status
5. **DirectoryPagination** - Paginate large result sets
6. **DirectorySearch** - Search input with autocomplete
7. **DirectorySidebar** - Category/filter sidebar
8. **DirectoryHero** - Hero section with search
9. **DirectoryStats** - Aggregate stats display
10. **DirectoryReviews** - Review cards/list component
