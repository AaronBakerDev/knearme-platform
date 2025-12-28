# Sprint 5: Polish & PWA

> **Status:** 🔄 In Progress (~31% complete - 50/161 tasks)
> **Epic References:** EPIC-005 (PWA), NFR (Performance, Accessibility)
> **Estimated Duration:** 1 week
> **Last Updated:** 2025-12-10

## Overview

Polish the user experience, implement PWA features, optimize performance, and ensure accessibility compliance.

---

## 1. PWA Implementation

### Web App Manifest (US-005-10)
- [x] Create `/app/manifest.ts` ✅ Implemented with shortcuts and full configuration
- [x] Create app icons (192px, 512px, maskable) ✅ SVG icons in public/icons/
- [x] Add Apple touch icons ✅ 180/167/152px PNG icons generated
- [x] Configure splash screens (iOS) ✅ 20 device-specific splash images + AppleSplashScreens component

### Service Worker (US-005-11)
- [x] Install and configure `@ducanh2912/next-pwa` ✅ v10.2.9 installed, webpack build configured
- [x] Configure caching strategies: ✅ Implemented in next.config.ts
  ```javascript
  // Static assets: Cache First
  // API calls: Network First
  // Images: Stale While Revalidate
  ```
- [x] Handle offline fallback page ✅ /~offline route with auto-reconnect
- [x] Implement background sync for drafts ✅ IndexedDB queue + useOfflineSync hook

### Install Prompt (US-005-12)
- [x] Create `components/pwa/InstallPrompt.tsx` ✅ Full implementation
- [x] Detect `beforeinstallprompt` event ✅ With iOS fallback instructions
- [x] Show custom "Add to Home Screen" banner ✅ Styled card with dismiss
- [x] Track install conversions ✅ Console logging (can extend to analytics)
- [x] Dismiss and don't show again option ✅ 30-day localStorage persistence

### Offline Experience
- [x] Create `/app/~offline/page.tsx` ✅ Friendly offline page
- [x] Show friendly offline message ✅ With helpful tips
- [x] Display cached content if available ✅ Service worker handles caching
- [x] Indicate when back online ✅ Auto-reload when connection restored
- [x] Queue actions for sync ✅ IndexedDB draft queue + OfflineIndicator component

### Push Notifications (Phase 2 Prep)
- [x] Set up notification permission request
- [x] Store push subscription in database
- [x] Document notification triggers for later

---

## 2. Error Handling & Edge Cases

### Global Error Boundary
- [x] Create `/app/error.tsx` ✅ Already existed, improved with Link component
- [x] Show user-friendly error message ✅
- [x] Include "Report Issue" option ✅ GitHub issue link with pre-filled error context
- [x] Log errors to monitoring service

### Not Found Handling
- [x] Create `/app/not-found.tsx` ✅ Implemented with helpful navigation
- [x] Show helpful 404 page ✅
- [ ] Suggest similar content
- [x] Link to home/dashboard ✅

### API Error Responses
- [x] Standardize error response format:
  ```typescript
  {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'User-friendly message',
      details: { field: 'reason' }
    }
  }
  ```
- [x] Map all error codes to messages
- [ ] Localize error messages (English only for MVP)

### Network Error Handling
- [x] Detect offline state ✅ OfflineIndicator + useOfflineSync hook
- [x] Show offline indicator ✅ OfflineIndicator component in contractor layout
- [x] Queue failed requests for retry ✅ IndexedDB queue via useOfflineSync
- [x] Show retry button on failures ✅ "Sync Now" button in OfflineIndicator

### Form Validation Errors
- [x] Consistent inline error styling
- [x] Focus first error field
- [x] Clear errors on input change
- [x] Show success states

---

## 3. Loading States

### Skeleton Loaders
- [x] Create `components/ui/Skeleton.tsx` ✅ Already exists (shadcn/ui)
- [x] Dashboard skeleton ✅ Updated loading.tsx to match layout
- [x] Project card skeleton ✅ Updated loading.tsx with gradient header
- [x] Profile page skeleton ✅ Edit page + setup wizard loading.tsx
- [x] Match actual content layout ✅ Skeletons match cards, headers, grids

### Progress Indicators
- [x] Image upload progress
- [x] AI generation progress
- [x] Page transition indicator
- [x] Form submission spinner

### Optimistic Updates
- [ ] Implement for project status changes
- [ ] Implement for profile updates
- [ ] Rollback on failure

---

## 4. Accessibility (WCAG 2.1 AA)

### Keyboard Navigation
- [ ] Test all interactive elements
- [ ] Ensure logical tab order
- [x] Add skip links ✅ Added to contractor layout
- [ ] Handle focus management in modals
- [ ] Escape key closes modals

### Screen Reader Support
- [x] Add ARIA labels to icons ✅ User menu button, nav
- [x] Use semantic HTML throughout ✅ header, nav, main landmarks
- [ ] Announce dynamic content changes
- [ ] Label form inputs properly
- [ ] Describe images with alt text

### Visual Accessibility
- [ ] Verify 4.5:1 color contrast
- [ ] Add focus visible styles
- [ ] Don't rely on color alone
- [ ] Support reduced motion preference
- [ ] Test with high contrast mode

### Forms
- [ ] Associate labels with inputs
- [ ] Provide error descriptions
- [ ] Mark required fields
- [ ] Group related fields with fieldset

### Testing
- [ ] Run axe-core automated tests
- [ ] Test with VoiceOver (Mac/iOS)
- [ ] Test with NVDA (Windows)
- [ ] Keyboard-only navigation test

---

## 5. UI Polish

### Design Consistency
- [ ] Audit all spacing (use consistent scale)
- [ ] Verify typography hierarchy
- [ ] Ensure consistent border radius
- [ ] Standardize shadow usage
- [ ] Check icon consistency

### Animations & Transitions
- [ ] Page transitions (subtle fade)
- [ ] Button hover/active states
- [ ] Modal open/close animations
- [ ] Toast notifications
- [ ] Loading state transitions
- [ ] Respect `prefers-reduced-motion`

### Empty States
- [ ] Design empty state illustrations
- [ ] Add helpful copy for each empty state
- [ ] Include clear CTAs

### Success States
- [ ] Publish success celebration
- [ ] Profile complete success
- [ ] Clear visual feedback for all actions

### Dark Mode (Optional)
- [ ] Add theme toggle
- [ ] Define dark color palette
- [ ] Test all components in dark mode
- [ ] Persist preference

---

## 6. Performance Optimization

### Bundle Analysis
- [ ] Run `@next/bundle-analyzer`
- [ ] Identify large dependencies
- [ ] Code split where beneficial
- [ ] Tree shake unused code

### Image Optimization
- [ ] Verify all images use next/image
- [ ] Check blur placeholders working
- [ ] Audit image sizes
- [ ] Remove unused images

### JavaScript Optimization
- [ ] Minimize client-side JavaScript
- [ ] Use Server Components where possible
- [ ] Defer non-critical scripts
- [ ] Remove console.logs

### CSS Optimization
- [ ] Purge unused Tailwind classes
- [ ] Minimize CSS bundle
- [ ] Inline critical CSS

### Database Queries
- [ ] Add missing indexes
- [ ] Optimize N+1 queries
- [ ] Cache frequent queries
- [ ] Use connection pooling

### Caching Strategy
- [ ] Review all cache headers
- [ ] Implement edge caching
- [ ] Cache API responses where appropriate
- [ ] Set up cache invalidation

---

## 7. Testing

### Unit Tests
- [ ] Achieve > 70% coverage on utilities
- [ ] Test all validation functions
- [ ] Test state management

### Integration Tests
- [ ] Test API routes
- [ ] Test database operations
- [ ] Test auth flows

### E2E Tests
- [ ] Complete signup flow
- [ ] Complete project creation flow
- [ ] Complete publish flow
- [ ] Mobile viewport tests

### Visual Regression
- [ ] Set up Playwright screenshots
- [ ] Capture key pages/states
- [ ] Review diffs on PR

### Performance Tests
- [ ] Lighthouse CI on all page types
- [ ] Load testing with k6 (100 concurrent)
- [ ] Database query performance

### Cross-Browser Testing
- [ ] Chrome (desktop + mobile)
- [ ] Safari (desktop + iOS)
- [ ] Firefox
- [ ] Edge

---

## 8. Documentation

### README
- [ ] Project overview
- [ ] Getting started guide
- [ ] Environment setup
- [ ] Development commands

### API Documentation
- [ ] Document all API endpoints
- [ ] Include request/response examples
- [ ] Note authentication requirements

### Component Documentation
- [ ] Document key components
- [ ] Include usage examples
- [ ] Note props and variants

### Deployment Guide
- [ ] Document deployment process
- [ ] List environment variables
- [ ] Note post-deployment checks

---

## Definition of Done

- [ ] PWA installable on iOS and Android
- [ ] Service worker caching working
- [ ] Offline indicator shows correctly
- [ ] All accessibility tests passing
- [ ] Lighthouse scores:
  - Performance: ≥ 90
  - Accessibility: ≥ 90
  - Best Practices: ≥ 90
  - SEO: ≥ 90
- [ ] Test coverage: ≥ 70%
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Cross-browser tested

---

## Notes

- Polish is cumulative - keep refining throughout
- Accessibility is not optional - fix issues immediately
- Performance budgets are strict - don't regress
- Test on real devices, not just emulators
