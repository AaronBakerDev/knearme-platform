# Directory UI Components

React components for the KnearMe directory feature, built with shadcn/ui and Tailwind CSS.

## Components

### StarRating

Display business ratings with filled/half/empty stars.

```tsx
import { StarRating } from '@/components/directory';

<StarRating
  rating={4.5}
  count={123}
  size="md"
/>
// Output: ★★★★☆ 4.5 (123 reviews)
```

**Props:**
- `rating: number | null` - Rating value (0-5). Null shows "No reviews yet"
- `count: number | null` - Number of reviews. Null hides count
- `size?: 'sm' | 'md' | 'lg'` - Visual size (default: 'md')
- `className?: string` - Additional CSS classes

---

### BusinessCard

Display individual business listing in a card format.

```tsx
import { BusinessCard } from '@/components/directory';

<BusinessCard
  business={place}
  stateSlug="colorado"
/>
```

**Props:**
- `business: DirectoryPlace` - Business listing data
- `stateSlug: string` - State slug for routing (e.g., 'colorado', 'utah')

**Features:**
- Star rating display
- Category badge
- Truncated address (max 60 chars)
- Clickable phone number (tel: link)
- External website link
- "View Details" button linking to detail page

**Detail page URL:** `/directory/{stateSlug}/{citySlug}/{categorySlug}/{businessSlug}`

---

### CategoryCard

Display category option with icon, count, and description.

```tsx
import { CategoryCard } from '@/components/directory';
import { DIRECTORY_CATEGORIES } from '@/lib/constants/directory-categories';

const category = {
  category_slug: 'masonry-contractor',
  category_name: 'Masonry Contractor',
  business_count: 42,
  avg_rating: 4.5
};

<CategoryCard
  category={category}
  meta={DIRECTORY_CATEGORIES['masonry-contractor']}
  stateSlug="colorado"
  citySlug="denver-co"
/>
```

**Props:**
- `category: CategoryStats` - Category statistics (name, slug, count)
- `meta: DirectoryCategoryMeta` - Category metadata (icon, description, etc.)
- `stateSlug: string` - State slug for routing
- `citySlug: string` - City slug for routing

**Features:**
- Dynamic Lucide icon (from metadata)
- Business count badge
- Average rating display
- Hover effects (shadow, border, icon color change)

**Category page URL:** `/directory/{stateSlug}/{citySlug}/{categorySlug}`

---

### StateGrid

Grid of state cards for the directory landing page.

```tsx
import { StateGrid } from '@/components/directory';

<StateGrid states={stateStats} />
```

**Props:**
- `states: StateStats[]` - Array of state statistics

**Features:**
- Responsive 3-column grid (1 col mobile, 2 col tablet, 3 col desktop)
- Sorted by business count (descending)
- Shows business count, city count, and average rating
- Links to state page: `/directory/{stateSlug}`

---

### CityGrid

Grid of city cards for state directory pages.

```tsx
import { CityGrid } from '@/components/directory';

<CityGrid
  cities={cityStats}
  stateSlug="colorado"
/>
```

**Props:**
- `cities: CityStats[]` - Array of city statistics
- `stateSlug: string` - State slug for routing

**Features:**
- Responsive 3-column grid
- Sorted by business count (descending)
- Shows business count, category count, and average rating
- Links to city page: `/directory/{stateSlug}/{citySlug}`

---

### DirectoryBreadcrumbs

Navigation breadcrumbs with JSON-LD structured data for SEO.

```tsx
import { DirectoryBreadcrumbs } from '@/components/directory';

<DirectoryBreadcrumbs
  items={[
    { name: 'Find Contractors', href: '/directory' },
    { name: 'Colorado', href: '/directory/colorado' },
    { name: 'Denver', href: '/directory/colorado/denver-co' },
    { name: 'Masonry Contractors', href: '/directory/colorado/denver-co/masonry-contractor' },
  ]}
/>
```

**Props:**
- `items: Array<{ name: string; href: string }>` - Breadcrumb items (in order)
- `className?: string` - Additional CSS classes

**Features:**
- Automatically prepends "Home" link
- Generates JSON-LD `BreadcrumbList` schema for SEO
- Responsive (horizontal scroll on mobile if needed)
- Chevron separators between items
- Home icon on first item
- Current page highlighted (not clickable)

---

## Usage Example

Complete example for a city category listing page:

```tsx
// app/directory/[state]/[city]/[category]/page.tsx

import {
  DirectoryBreadcrumbs,
  BusinessCard
} from '@/components/directory';
import { getBusinessesByCategory } from '@/lib/data/directory';

export default async function CategoryPage({
  params
}: {
  params: { state: string; city: string; category: string }
}) {
  const businesses = await getBusinessesByCategory(
    params.state,
    params.city,
    params.category
  );

  return (
    <div className="container py-8">
      <DirectoryBreadcrumbs
        items={[
          { name: 'Find Contractors', href: '/directory' },
          { name: 'Colorado', href: `/directory/${params.state}` },
          { name: 'Denver', href: `/directory/${params.state}/${params.city}` },
          { name: 'Masonry Contractors', href: `/directory/${params.state}/${params.city}/${params.category}` },
        ]}
      />

      <h1 className="text-3xl font-bold mt-8 mb-6">
        Masonry Contractors in Denver
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {businesses.map((business) => (
          <BusinessCard
            key={business.id}
            business={business}
            stateSlug={params.state}
          />
        ))}
      </div>
    </div>
  );
}
```

## Type Definitions

See `/src/types/directory.ts` for complete type definitions:

```typescript
interface DirectoryPlace {
  id: number;
  title: string;
  category: string;
  rating: number | null;
  rating_count: number | null;
  address: string | null;
  city: string[];
  province_state: string;
  phone_number: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  cid: string;
  slug: string;
  state_slug: string;
  city_slug: string;
  category_slug: string;
}

interface StateStats {
  state_slug: string;
  state_name: string;
  business_count: number;
  city_count: number;
  avg_rating: number | null;
}

interface CityStats {
  state_slug: string;
  city_slug: string;
  city_name: string;
  state_name: string;
  business_count: number;
  category_count: number;
  avg_rating: number | null;
}

interface CategoryStats {
  category_slug: string;
  category_name: string;
  business_count: number;
  avg_rating: number | null;
}
```

## Category Metadata

Category metadata is defined in `/src/lib/constants/directory-categories.ts`:

```typescript
import { DIRECTORY_CATEGORIES, getCategoryMeta } from '@/lib/constants/directory-categories';

// Get category metadata
const masonryMeta = getCategoryMeta('masonry-contractor');
// Returns: { slug, name, icon, headline, description, services, faqs, ... }

// All categories
const allCategories = DIRECTORY_CATEGORIES;
```

**Available categories:**
- `masonry-contractor` (Hammer icon)
- `chimney-sweep` (Flame icon)
- `chimney-services` (Home icon)
- `roofing-contractor` (HardHat icon)
- `concrete-contractor` (Building2 icon)
- `general-contractor` (HardHat icon)
- `fireplace-store` (Flame icon)
- `stone-supplier` (Mountain icon)
- `masonry-supply-store` (Store icon)
- `construction-company` (Building icon)

## Styling

All components use:
- **shadcn/ui** primitives (Card, Badge, Button)
- **Tailwind CSS** utility classes
- **Lucide React** icons
- **Dark mode** support via CSS variables

### Customization

Override styles using className prop:

```tsx
<StarRating
  rating={4.5}
  count={123}
  className="text-lg"
/>

<BusinessCard
  business={place}
  stateSlug="colorado"
  // Card inherits hover:shadow-md, but you can customize via shadcn config
/>
```

## SEO Features

### Structured Data

`DirectoryBreadcrumbs` automatically generates JSON-LD schema:

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://knearme.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Find Contractors",
      "item": "https://knearme.com/directory"
    }
  ]
}
```

### Accessibility

- **ARIA labels** on star ratings
- **Semantic HTML** (nav, ol, li for breadcrumbs)
- **aria-current="page"** on current breadcrumb
- **Keyboard navigation** (all links/buttons focusable)
- **Screen reader friendly** (descriptive link text, icon labels)

## File Structure

```
src/components/directory/
├── index.ts                    # Barrel export
├── README.md                   # This file
├── StarRating.tsx             # Star rating component
├── BusinessCard.tsx           # Business listing card
├── CategoryCard.tsx           # Category option card
├── StateGrid.tsx              # State grid layout
├── CityGrid.tsx               # City grid layout
└── DirectoryBreadcrumbs.tsx   # Breadcrumb navigation
```

## Related Files

- **Types:** `/src/types/directory.ts`
- **Category metadata:** `/src/lib/constants/directory-categories.ts`
- **Structured data:** `/src/lib/seo/structured-data.ts`
- **Data layer:** `/src/lib/data/directory.ts` (to be implemented)
- **UI primitives:** `/src/components/ui/` (shadcn/ui)

## Next Steps

To use these components in your directory pages:

1. **Create data layer** at `/src/lib/data/directory.ts` with functions to fetch:
   - `getStates()` → StateStats[]
   - `getCitiesByState(stateSlug)` → CityStats[]
   - `getCategoriesByCity(stateSlug, citySlug)` → CategoryStats[]
   - `getBusinessesByCategory(...)` → DirectoryPlace[]

2. **Create directory routes** at `/app/directory/`:
   - `/app/directory/page.tsx` (landing, use StateGrid)
   - `/app/directory/[state]/page.tsx` (state, use CityGrid)
   - `/app/directory/[state]/[city]/page.tsx` (city, use CategoryCard grid)
   - `/app/directory/[state]/[city]/[category]/page.tsx` (category, use BusinessCard grid)
   - `/app/directory/[state]/[city]/[category]/[slug]/page.tsx` (business detail)

3. **Add to sitemap** at `/app/sitemap.ts`:
   - Generate dynamic sitemap entries for all directory pages

## Support

For issues or questions, see:
- **Project docs:** `/docs/11-seo-discovery/`
- **Component library:** https://ui.shadcn.com
- **Icons:** https://lucide.dev
