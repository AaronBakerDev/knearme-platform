# Testing Strategy

> **Version:** 1.0
> **Last Updated:** December 26, 2025
> **Scope:** MVP Testing Approach

---

## Testing Philosophy

For MVP, we prioritize:
1. **Critical path coverage** - The AI interview flow must work
2. **Integration reliability** - Supabase + AI provider connections (Gemini + Whisper)
3. **Mobile-first validation** - Primary use case is phone
4. **Fast feedback** - Catch issues before they reach users

---

## Test Pyramid

```
                    ┌───────────┐
                   /             \
                  /   E2E Tests   \     ~10% of tests
                 /   (Critical     \    Playwright
                /     User Flows)   \
               /─────────────────────\
              /                       \
             /   Integration Tests     \    ~30% of tests
            /   (API + Database)        \   Vitest
           /─────────────────────────────\
          /                               \
         /        Unit Tests               \    ~60% of tests
        /   (Components + Utils)            \   Vitest + React Testing Library
       /─────────────────────────────────────\
```

---

## Test Categories

### 1. Unit Tests

**Coverage Target:** 70% for utility functions, 50% for components

**What to test:**
- Utility functions (slug generation, validation)
- React hooks (useVoiceRecorder, useAuth)
- Form validation logic
- AI prompt builders
- SEO metadata generators

**Tools:** Vitest, React Testing Library

**Example:**

```typescript
// lib/utils/slug.test.ts
import { describe, it, expect } from 'vitest';
import { generateProjectSlug } from './slug';

describe('generateProjectSlug', () => {
  it('creates URL-safe slug from title', () => {
    const slug = generateProjectSlug('Historic Chimney Rebuild in Denver');
    expect(slug).toBe('historic-chimney-rebuild-in-denver');
  });

  it('handles special characters', () => {
    const slug = generateProjectSlug("Mike's Masonry & More!");
    expect(slug).toBe('mikes-masonry-more');
  });

  it('appends suffix for uniqueness', () => {
    const slug = generateProjectSlug('Chimney Rebuild', '2025');
    expect(slug).toBe('chimney-rebuild-2025');
  });
});
```

### 2. Integration Tests

**Coverage Target:** Critical API endpoints, database operations

**What to test:**
- API route handlers (request/response)
- Database queries (CRUD operations)
- Supabase Auth integration
- File upload flow
- RLS policy enforcement

**Tools:** Vitest, Supabase local, MSW (Mock Service Worker)

**Example:**

```typescript
// api/projects/route.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { POST } from './route';

describe('POST /api/projects', () => {
  let testContractor: { id: string };

  beforeAll(async () => {
    // Set up test contractor in local Supabase
  });

  afterAll(async () => {
    // Clean up test data
  });

  it('creates a draft project', async () => {
    const request = new Request('http://localhost/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        title: 'Test Chimney Project',
        description: 'Test description...',
        project_type: 'Chimney Rebuild',
        city: 'Denver',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.status).toBe('draft');
    expect(data.data.slug).toContain('test-chimney-project');
  });

  it('rejects unauthenticated requests', async () => {
    const request = new Request('http://localhost/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
```

### 3. E2E Tests

**Coverage Target:** 100% of critical user flows

**Critical Flows to Test:**

| Flow | Priority | Automated |
|------|----------|-----------|
| Contractor signup | P0 | Yes |
| First project creation (full interview) | P0 | Yes |
| Project approval and publish | P0 | Yes |
| View published project (public) | P0 | Yes |
| Contractor login | P0 | Yes |
| Profile editing | P1 | Yes |
| Project editing | P1 | Yes |
| Voice recording fallback to text | P1 | Manual |

**Tools:** Playwright

**Example:**

```typescript
// e2e/project-creation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Project Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test contractor
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@contractor.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('complete project creation with AI interview', async ({ page }) => {
    // Navigate to new project
    await page.click('text=Add Project');
    await expect(page).toHaveURL('/projects/new');

    // Upload photos
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      'fixtures/chimney-before.jpg',
      'fixtures/chimney-after.jpg',
    ]);

    // Wait for AI analysis
    await expect(page.locator('text=Looks like')).toBeVisible({ timeout: 10000 });

    // Confirm project type
    await page.click('text=Yes, that\'s right');

    // Answer interview questions (text fallback)
    await page.click('text=Type instead');
    await page.fill('textarea', 'The chimney was falling apart, bricks crumbling.');
    await page.click('text=Next');

    await page.fill('textarea', 'Rebuilt from roofline with matching brick.');
    await page.click('text=Next');

    await page.click('text=3-4 days');

    // Wait for AI generation
    await expect(page.locator('text=Your Project Showcase')).toBeVisible({ timeout: 15000 });

    // Verify generated content exists
    await expect(page.locator('h1')).toContainText('Chimney');

    // Approve and publish
    await page.click('text=Approve & Publish');

    // Verify success
    await expect(page.locator('text=Published!')).toBeVisible();
  });

  test('handles AI analysis failure gracefully', async ({ page }) => {
    // Mock AI failure
    await page.route('**/api/ai/analyze-images', (route) => {
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'AI Error' }) });
    });

    await page.click('text=Add Project');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(['fixtures/chimney-before.jpg']);

    // Should show manual selection fallback
    await expect(page.locator('text=Select project type')).toBeVisible();
  });
});
```

---

## AI Testing Strategy

### Mock vs Real AI Calls

| Environment | Strategy | Rationale |
|-------------|----------|-----------|
| Unit tests | Mock all AI | Speed, cost |
| Integration tests | Mock with realistic responses | Consistency |
| E2E tests (CI) | Mock AI | Speed, flakiness |
| E2E tests (manual) | Real AI | Validate actual behavior |

### AI Mock Fixtures

```typescript
// fixtures/ai-mocks.ts
export const mockImageAnalysis = {
  project_type: 'Chimney Rebuild',
  project_type_slug: 'chimney-rebuild',
  confidence: 0.92,
  materials: ['red brick', 'portland mortar'],
  image_classifications: [
    { path: 'test/1.jpg', type: 'before' },
    { path: 'test/2.jpg', type: 'after' },
  ],
};

export const mockGeneration = {
  title: 'Historic Brick Chimney Rebuild in Denver',
  description: 'This 1920s chimney had seen better days...',
  tags: ['chimney', 'rebuild', 'denver', 'brick'],
  seo_title: 'Chimney Rebuild Denver | Heritage Masonry',
  seo_description: 'Professional chimney rebuild services in Denver...',
};
```

---

## Mobile Testing

### Device Matrix

| Device | OS Version | Browser | Priority |
|--------|------------|---------|----------|
| iPhone 13 | iOS 16+ | Safari | P0 |
| iPhone 11 | iOS 15 | Safari | P1 |
| Pixel 6 | Android 12+ | Chrome | P0 |
| Samsung Galaxy S21 | Android 11 | Chrome | P1 |

### Mobile-Specific Tests

- [ ] Camera capture works
- [ ] Gallery picker works
- [ ] Voice recording works
- [ ] Hold-to-record interaction
- [ ] Touch targets are 44px+
- [ ] Keyboard doesn't obscure inputs
- [ ] Offline indicator shows
- [ ] Add to Home Screen works

### Testing with Playwright Mobile

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'Mobile Safari', use: { ...devices['iPhone 13'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
});
```

---

## Test Data Management

### Seed Data

```sql
-- test/seed.sql
-- Test contractor
INSERT INTO contractors (id, auth_user_id, email, business_name, city, state, city_slug, services)
VALUES (
  'test-contractor-uuid',
  'test-auth-user-uuid',
  'test@contractor.com',
  'Test Masonry LLC',
  'Denver',
  'CO',
  'denver-co',
  ARRAY['chimney', 'tuckpointing']
);

-- Test project (published)
INSERT INTO projects (id, contractor_id, title, description, project_type, city, city_slug, status, slug)
VALUES (
  'test-project-uuid',
  'test-contractor-uuid',
  'Test Chimney Project',
  'Test description...',
  'Chimney Rebuild',
  'Denver',
  'denver-co',
  'published',
  'test-chimney-project-denver'
);
```

### Test Isolation

```typescript
// test/setup.ts
import { beforeEach, afterEach } from 'vitest';
import { supabaseAdmin } from './utils';

beforeEach(async () => {
  // Seed test data
  await supabaseAdmin.rpc('seed_test_data');
});

afterEach(async () => {
  // Clean up
  await supabaseAdmin.rpc('cleanup_test_data');
});
```

---

## CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run test:unit

  integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: supabase/postgres:15.1.0.117
        env:
          POSTGRES_PASSWORD: postgres
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
        env:
          MOCK_AI: true

  deploy-preview:
    needs: [unit, integration, e2e]
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## Quality Gates

### PR Merge Requirements

| Gate | Threshold | Required |
|------|-----------|----------|
| Unit tests pass | 100% | Yes |
| Integration tests pass | 100% | Yes |
| E2E critical paths pass | 100% | Yes |
| Code coverage (new code) | >70% | No (advisory) |
| No security vulnerabilities | High/Critical | Yes |
| Lighthouse score (mobile) | >80 | No (advisory) |

### Pre-Launch Requirements

| Check | Status | Owner |
|-------|--------|-------|
| All P0 E2E tests pass | ⬜ | Dev |
| Mobile device testing complete | ⬜ | QA |
| Security checklist complete | ⬜ | Dev |
| Load testing (100 concurrent) | ⬜ | Dev |
| Staging deployment verified | ⬜ | Dev |

---

## Test Commands

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI (debugging)
npm run test:e2e:ui

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- path/to/test.ts
```

---

## References

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
