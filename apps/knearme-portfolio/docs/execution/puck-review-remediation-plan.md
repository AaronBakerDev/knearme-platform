# Puck Visual Editor - Review Remediation Execution Plan

**Created:** 2026-01-14
**Based on:** Multi-agent code review of 57 completed PRD features
**Total Issues:** 17 (4 critical, 8 high priority, 5 medium priority)

---

## Executive Summary

The Puck Visual Editor integration scored 8.5-9.2/10 across all review areas. This plan addresses identified issues in priority order, focusing on accessibility compliance first, then code quality improvements.

**Estimated Total Effort:** 8-12 hours
**Recommended Approach:** Address in 3 phases over 2-3 work sessions

---

## Phase 1: Critical Accessibility Fixes (MUST DO)

**Effort:** 2-3 hours
**Impact:** WCAG compliance, keyboard users, screen readers

### 1.1 Testimonials Carousel Keyboard Navigation

**File:** `src/components/puck/Testimonials.tsx`
**Lines:** 194-204
**Issue:** Carousel indicators are decorative divs, not interactive buttons

**Implementation:**
```typescript
// Replace decorative dots with accessible tab buttons
<div className="mt-4 flex justify-center gap-2" role="tablist" aria-label="Testimonials">
  {items.map((_, i) => (
    <button
      key={i}
      onClick={() => scrollToIndex(i)}
      className={cn(
        "h-2 w-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        currentIndex === i ? "bg-primary" : "bg-muted-foreground/30"
      )}
      aria-label={`View testimonial ${i + 1} of ${items.length}`}
      role="tab"
      aria-selected={currentIndex === i}
    />
  ))}
</div>
```

**Additional Requirements:**
- Add `scrollToIndex` function using `scrollIntoView` or ref-based positioning
- Track `currentIndex` with IntersectionObserver on carousel items
- Add left/right arrow key navigation

**Verification:**
- [ ] Tab through carousel - focus visible on indicators
- [ ] Arrow keys navigate between testimonials
- [ ] Screen reader announces "Testimonial 1 of 3"

---

### 1.2 Navigation Sidebar Focus Indicators

**File:** `src/app/(payload)/custom.scss`
**Lines:** 224-269
**Issue:** No visible focus state for keyboard navigation

**Implementation:**
```scss
// Add to .nav-group__content a styles
.nav-group__content a {
  // ... existing styles ...

  &:focus-visible {
    outline: 2px solid var(--color-base-500);
    outline-offset: -2px;
    background-color: rgba(var(--color-base-500-rgb), 0.12);
  }

  // Ensure focus is visible in dark mode too
  [data-theme='dark'] & {
    &:focus-visible {
      outline-color: var(--color-base-400);
    }
  }
}
```

**Verification:**
- [ ] Tab through Payload admin sidebar
- [ ] Focus ring visible on each nav item
- [ ] Works in both light and dark mode

---

### 1.3 Dark Mode Contrast Fix

**File:** `src/app/(payload)/custom.scss`
**Lines:** 550-556
**Issue:** Navigation text may fail WCAG AA (4.5:1 contrast)

**Implementation:**
```scss
[data-theme='dark'] {
  .nav-group__toggle {
    color: var(--theme-elevation-700); // Increased from 550

    &:hover {
      color: var(--theme-elevation-800);
    }
  }

  .nav-group__content a {
    color: var(--theme-elevation-750); // Increased from 600

    &:hover,
    &.active {
      color: var(--theme-elevation-900);
    }
  }
}
```

**Verification:**
- [ ] Use browser DevTools or axe to check contrast ratios
- [ ] All navigation text ≥ 4.5:1 contrast in dark mode
- [ ] Run Lighthouse accessibility audit

---

### 1.4 Table Block Horizontal Scroll

**File:** `src/lib/puck/config.tsx`
**Lines:** 1831-1874
**Issue:** Wide tables overflow on mobile without scroll

**Implementation:**
```typescript
// Wrap table in scroll container
render: ({ headers, rows, striped, bordered }) => {
  // ... existing logic ...

  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="min-w-full inline-block align-middle">
        <ShadcnTable className={cn(bordered && 'border')}>
          {/* ... existing table content ... */}
        </ShadcnTable>
      </div>
    </div>
  )
}
```

**Verification:**
- [ ] View table on 320px mobile viewport
- [ ] Table scrolls horizontally without breaking layout
- [ ] Scroll indicator visible (shadow or fade)

---

## Phase 2: Code Quality & Type Safety (SHOULD DO)

**Effort:** 3-4 hours
**Impact:** Maintainability, type safety, performance

### 2.1 Consolidate MediaRef Type Definitions

**Files to modify:**
- `src/types/puck.ts` (source of truth)
- `src/lib/puck/config.tsx` (remove local definition)
- `src/components/puck/Hero.tsx` (import from types)
- `src/components/puck/ImageGallery.tsx` (import from types)
- `src/components/puck/Testimonials.tsx` (import from types)

**Implementation:**
```typescript
// src/types/puck.ts - Single source of truth
export interface MediaRef {
  id: string
  url: string
  alt: string
  width?: number
  height?: number
  thumbnailUrl?: string
  mimeType?: string
  filename?: string
}

// All other files import from here
import type { MediaRef } from '@/types/puck'
```

**Verification:**
- [ ] `npm run typecheck` passes
- [ ] No duplicate MediaRef definitions in codebase
- [ ] Search: `interface MediaRef` returns only types/puck.ts

---

### 2.2 Fix Race Condition in Editor Save Handler

**File:** `src/app/(payload)/admin/puck/[...path]/client.tsx`
**Lines:** 160-193
**Issue:** Multiple rapid clicks can trigger duplicate saves

**Implementation:**
```typescript
// Add ref for synchronous save tracking
const isSavingRef = useRef(false)

const handlePublish = useCallback(
  async (publishData: Data) => {
    // Synchronous check prevents race condition
    if (isSavingRef.current) return

    isSavingRef.current = true
    setIsSaving(true)

    try {
      const response = await fetch(`/api/puck/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: publishData }),
      })

      if (!response.ok) {
        throw new Error('Failed to save')
      }

      toast.success('Page saved successfully')
    } catch (error) {
      toast.error('Failed to save page')
      console.error('[Puck Editor] Save error:', error)
    } finally {
      isSavingRef.current = false
      setIsSaving(false)
    }
  },
  [slug] // Remove isSaving from deps since we use ref
)
```

**Verification:**
- [ ] Rapidly click Publish 5 times
- [ ] Network tab shows only 1 request
- [ ] No console errors about state updates

---

### 2.3 Replace PricingTable Inline Style Mutations

**File:** `src/components/puck/PricingTable.tsx`
**Lines:** 133-146
**Issue:** Direct DOM manipulation via onMouseEnter/onMouseLeave

**Implementation:**
```typescript
// Remove inline handlers, use Framer Motion whileHover
<motion.div
  className={cn(
    'relative flex flex-col rounded-2xl border p-6',
    isHighlighted && 'border-primary bg-primary/5'
  )}
  variants={cardVariants}
  initial="hidden"
  animate={inView ? 'visible' : 'hidden'}
  whileHover={
    !shouldReduceMotion
      ? {
          y: -8,
          boxShadow: isHighlighted
            ? '0 0 50px hsl(var(--primary) / 0.5), 0 25px 30px -5px rgb(0 0 0 / 0.15)'
            : '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        }
      : undefined
  }
  style={
    isHighlighted && !shouldReduceMotion
      ? { boxShadow: '0 0 30px hsl(var(--primary) / 0.3), 0 20px 25px -5px rgb(0 0 0 / 0.1)' }
      : undefined
  }
  transition={{ duration: 0.2 }}
>
```

**Also remove:**
- `isHovered` state (lines ~90)
- `onMouseEnter`/`onMouseLeave` handlers

**Verification:**
- [ ] Hover over pricing tiers - smooth animation
- [ ] No React warnings about state updates
- [ ] Performance: check for style recalculations in DevTools

---

### 2.4 Centralize Dark Color Detection

**New file:** `src/lib/utils/color.ts`

**Implementation:**
```typescript
/**
 * Determines if a color is "dark" (low luminance)
 * Used for auto-contrast text color selection
 *
 * @param color - CSS color value (hex, hsl, rgb, or CSS variable)
 * @returns true if color luminance < 0.5
 */
export function isColorDark(color: string): boolean {
  // Handle CSS variables - can't compute, assume light for safety
  if (color.startsWith('var(') || color.startsWith('hsl(var(')) {
    return false
  }

  // Handle transparent/none
  if (!color || color === 'transparent' || color === 'none') {
    return false
  }

  let r = 0, g = 0, b = 0

  // Parse hex
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16)
      g = parseInt(hex[1] + hex[1], 16)
      b = parseInt(hex[2] + hex[2], 16)
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16)
      g = parseInt(hex.slice(2, 4), 16)
      b = parseInt(hex.slice(4, 6), 16)
    }
  }

  // Parse rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (rgbMatch) {
    r = parseInt(rgbMatch[1], 10)
    g = parseInt(rgbMatch[2], 10)
    b = parseInt(rgbMatch[3], 10)
  }

  // Parse hsl/hsla
  const hslMatch = color.match(/hsla?\((\d+),\s*(\d+)%?,\s*(\d+)%?/)
  if (hslMatch) {
    const [, h, s, l] = hslMatch.map(Number)
    // Quick check: if lightness < 50%, it's dark
    return l < 50
  }

  // Calculate relative luminance (WCAG formula)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance < 0.5
}
```

**Update these files to import and use:**
- `src/components/puck/Hero.tsx` (line 156)
- `src/components/puck/CTABanner.tsx` (line 112)

**Verification:**
- [ ] `#000000` returns true (dark)
- [ ] `#ffffff` returns false (light)
- [ ] `hsl(0, 0%, 20%)` returns true
- [ ] Hero/CTABanner text contrast correct with various backgrounds

---

### 2.5 Add Input Validation to Media API

**File:** `src/app/api/puck/media/route.ts`
**Line:** 81
**Issue:** `parseInt()` can return NaN for invalid input

**Implementation:**
```typescript
// Replace current limit parsing
const limitParam = searchParams.get('limit')
const parsedLimit = limitParam ? parseInt(limitParam, 10) : 50
const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
  ? Math.min(parsedLimit, 100)
  : 50

// Also validate page parameter
const pageParam = searchParams.get('page')
const parsedPage = pageParam ? parseInt(pageParam, 10) : 1
const page = Number.isFinite(parsedPage) && parsedPage > 0
  ? parsedPage
  : 1
```

**Verification:**
- [ ] `GET /api/puck/media?limit=abc` returns 50 items (default)
- [ ] `GET /api/puck/media?limit=-5` returns 50 items
- [ ] `GET /api/puck/media?limit=200` returns 100 items (max)

---

## Phase 3: Polish & Optimization (NICE TO HAVE)

**Effort:** 2-3 hours
**Impact:** Performance, maintainability, DX

### 3.1 Fix CSS Specificity Issues

**File:** `src/app/(payload)/custom.scss`
**Lines:** 128-176
**Issue:** Generic selectors like `.card`, `input` may conflict

**Implementation:**
```scss
// Scope all custom styles to Payload admin context
// Option 1: Use data attribute (safest)
[data-payload-admin] {
  .card {
    transition: all 0.2s ease;
    border: 1px solid var(--theme-elevation-150);
  }

  input:focus,
  textarea:focus,
  select:focus {
    border-color: var(--color-base-500);
    box-shadow: 0 0 0 3px rgba(var(--color-base-500-rgb), 0.15);
  }
}

// Option 2: Use Payload's own classes as parent
.payload-drawer,
.collection-list,
.document-drawer {
  .card { /* styles */ }
}
```

**Verification:**
- [ ] Styles only apply within Payload admin
- [ ] No conflicts with marketing site components
- [ ] Inspect elements to verify specificity

---

### 3.2 Remove Unnecessary Client-Side Theme Detection

**Files:**
- `src/payload/components/common/StatusBadge.tsx`
- `src/payload/components/media/MediaGridView.tsx`

**Implementation:**
1. Remove `isDark` state and MutationObserver
2. Move color definitions to CSS custom properties in `custom.scss`
3. Use CSS variables that automatically change based on `[data-theme]`

```scss
// Add to custom.scss
:root {
  --status-draft-bg: hsl(45, 90%, 95%);
  --status-draft-text: hsl(40, 80%, 35%);
  --status-draft-dot: hsl(45, 90%, 50%);

  --status-published-bg: hsl(142, 70%, 95%);
  --status-published-text: hsl(142, 70%, 30%);
  --status-published-dot: hsl(142, 70%, 45%);

  --status-archived-bg: hsl(220, 10%, 95%);
  --status-archived-text: hsl(220, 10%, 40%);
  --status-archived-dot: hsl(220, 10%, 60%);
}

[data-theme='dark'] {
  --status-draft-bg: hsla(45, 60%, 25%, 0.3);
  --status-draft-text: hsl(45, 80%, 70%);
  --status-draft-dot: hsl(45, 80%, 55%);

  // ... other dark mode values
}
```

```typescript
// StatusBadge.tsx - simplified
const badgeStyles: React.CSSProperties = {
  backgroundColor: `var(--status-${status}-bg)`,
  color: `var(--status-${status}-text)`,
  // ...
}
```

**Verification:**
- [ ] StatusBadge colors correct in light mode
- [ ] StatusBadge colors correct in dark mode
- [ ] No hydration warnings in console
- [ ] No MutationObserver in React DevTools

---

### 3.3 Add Rate Limiting to Media API

**File:** `src/app/api/puck/media/route.ts`
**Issue:** Public endpoint without rate limiting

**Implementation Options:**

**Option A: Simple in-memory rate limiting (development)**
```typescript
import { headers } from 'next/headers'

const rateLimitMap = new Map<string, { count: number; timestamp: number }>()
const RATE_LIMIT = 60 // requests per minute
const WINDOW_MS = 60000 // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now - record.timestamp > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, timestamp: now })
    return true
  }

  if (record.count >= RATE_LIMIT) {
    return false
  }

  record.count++
  return true
}

export async function GET(request: Request) {
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || 'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      { status: 429 }
    )
  }

  // ... rest of handler
}
```

**Option B: Use Vercel Edge Config or Upstash Redis (production)**
- More robust for serverless
- Persistent across deployments

**Verification:**
- [ ] Make 61 rapid requests - 61st returns 429
- [ ] Wait 1 minute - requests allowed again
- [ ] Log shows rate limit hits

---

### 3.4 Add Video Block Title Attribute

**File:** `src/lib/puck/config.tsx`
**Lines:** 1180-1187
**Issue:** Iframe missing accessible title

**Implementation:**
```typescript
<iframe
  src={embedUrl}
  title={caption || `Embedded ${url.includes('youtube') ? 'YouTube' : url.includes('vimeo') ? 'Vimeo' : ''} video`}
  className="absolute inset-0 h-full w-full"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
  loading="lazy"
/>
```

**Verification:**
- [ ] Inspect iframe - title attribute present
- [ ] Screen reader announces "Embedded YouTube video" or caption

---

### 3.5 Make Bento Featured Item Configurable

**File:** `src/components/puck/FeaturesGrid.tsx`
**Line:** 294
**Issue:** First item always marked as featured in bento layout

**Implementation:**
```typescript
// Update FeatureItem interface
interface FeatureItem {
  icon: string
  title: string
  description: string
  featured?: boolean // New field
}

// Update feature item field definition in config.tsx
{
  type: 'array',
  arrayFields: [
    // ... existing fields
    {
      name: 'featured',
      label: 'Featured (Bento)',
      type: 'radio',
      options: [
        { label: 'No', value: false },
        { label: 'Yes', value: true },
      ],
    },
  ],
}

// Update render logic
const isFeatured = variant === 'bento' && item.featured
```

**Verification:**
- [ ] In editor, mark 2nd item as featured
- [ ] Bento layout shows 2nd item spanning columns
- [ ] Multiple items can be featured (or add validation for single)

---

## Execution Checklist

### Phase 1: Critical Accessibility (Day 1)
- [ ] 1.1 Testimonials keyboard navigation
- [ ] 1.2 Navigation focus indicators
- [ ] 1.3 Dark mode contrast fix
- [ ] 1.4 Table horizontal scroll
- [ ] Run Lighthouse accessibility audit
- [ ] Commit: "fix: critical accessibility issues from review"

### Phase 2: Code Quality (Day 1-2)
- [ ] 2.1 Consolidate MediaRef types
- [ ] 2.2 Fix save race condition
- [ ] 2.3 Replace PricingTable inline styles
- [ ] 2.4 Centralize color detection
- [ ] 2.5 Add input validation to media API
- [ ] Run `npm run typecheck` and `npm run build`
- [ ] Commit: "refactor: type safety and code quality improvements"

### Phase 3: Polish (Day 2-3)
- [ ] 3.1 Fix CSS specificity
- [ ] 3.2 Remove client-side theme detection
- [ ] 3.3 Add rate limiting (optional)
- [ ] 3.4 Video title attribute
- [ ] 3.5 Bento featured item
- [ ] Final build verification
- [ ] Commit: "chore: polish and optimization from review"

---

## Verification Commands

```bash
# Type checking
npm run typecheck

# Build verification
npm run build

# Lint check
npm run lint

# Accessibility audit (manual)
# 1. Open Chrome DevTools > Lighthouse > Accessibility
# 2. Run on /admin and /p/[test-page]
# 3. Target: 90+ score
```

---

## Success Criteria

1. **Accessibility:** Lighthouse accessibility score ≥ 90
2. **Type Safety:** Zero TypeScript errors
3. **Build:** `npm run build` succeeds
4. **No Regressions:** All existing Puck editor functionality works
5. **Review Items:** All 17 issues addressed or documented as deferred

---

## Notes

- Issues are ordered by impact and effort
- Phase 1 is mandatory before production deployment
- Phase 2 improves long-term maintainability
- Phase 3 items can be deferred if time-constrained
- Each phase should be a separate commit for easy rollback
