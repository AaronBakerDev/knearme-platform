/**
 * Unit tests for /api/projects endpoint.
 *
 * Tests GET (list projects) and POST (create project) operations.
 * Uses the shared Supabase mock utilities for consistent testing patterns.
 *
 * @see src/app/api/projects/route.ts
 * @see src/lib/testing/supabase-mock.ts
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';
import { createMockSupabase, createMockDb, type DbRow } from '@/lib/testing/supabase-mock';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

// =============================================================================
// Mock Setup
// =============================================================================

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}));

// Mock next/headers for bearer auth (async function in Next.js 14+)
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(null), // No bearer token by default
  }),
}));

// Mock KPI tracking
vi.mock('@/lib/observability/kpi-events', () => ({
  trackProjectCreated: vi.fn().mockResolvedValue(undefined),
}));

// =============================================================================
// Test Helpers
// =============================================================================

function createRequest(method: string, body?: unknown, searchParams?: URLSearchParams): NextRequest {
  const url = new URL('http://localhost:3000/api/projects');
  if (searchParams) {
    searchParams.forEach((value, key) => url.searchParams.set(key, value));
  }
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  return new NextRequest(url, init);
}

// =============================================================================
// Tests
// =============================================================================

describe('/api/projects', () => {
  let db: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    db = createMockDb();
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // GET /api/projects
  // ---------------------------------------------------------------------------

  describe('GET /api/projects', () => {
    beforeEach(() => {
      // Set up common test data
      db.contractors.push({
        id: 'contractor-1',
        auth_user_id: 'user-1',
        business_name: 'Acme Masonry',
        city: 'Denver',
        state: 'CO',
        email: 'test@example.com',
      });
    });

    it('returns 401 when user is not authenticated', async () => {
      const client = createMockSupabase(db, null);
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

      const request = createRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
      expect(data.error.message).toContain('Authentication required');
    });

    it('returns empty array when no projects exist', async () => {
      const client = createMockSupabase(db, { id: 'user-1', email: 'test@example.com' });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

      const request = createRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.projects).toEqual([]);
      expect(data.total).toBe(0);
    });

    it('returns list of projects for authenticated contractor', async () => {
      // Add some projects
      db.projects.push(
        {
          id: 'project-1',
          contractor_id: 'contractor-1',
          title: 'Brick Chimney Repair',
          status: 'published',
          created_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 'project-2',
          contractor_id: 'contractor-1',
          title: 'Stone Wall Construction',
          status: 'draft',
          created_at: '2024-01-16T10:00:00Z',
        }
      );

      const client = createMockSupabase(db, { id: 'user-1', email: 'test@example.com' });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

      const request = createRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.projects).toHaveLength(2);
      // Note: Mock doesn't support count queries, so total is 0
      expect(typeof data.total).toBe('number');
    });

    it('filters projects by status', async () => {
      db.projects.push(
        { id: 'project-1', contractor_id: 'contractor-1', status: 'published' },
        { id: 'project-2', contractor_id: 'contractor-1', status: 'draft' },
        { id: 'project-3', contractor_id: 'contractor-1', status: 'published' }
      );

      const client = createMockSupabase(db, { id: 'user-1', email: 'test@example.com' });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

      const params = new URLSearchParams({ status: 'published' });
      const request = createRequest('GET', undefined, params);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // All returned projects should be published
      expect(data.projects.every((p: DbRow) => p.status === 'published')).toBe(true);
    });

    it('respects pagination parameters', async () => {
      // Add 5 projects
      for (let i = 1; i <= 5; i++) {
        db.projects.push({
          id: `project-${i}`,
          contractor_id: 'contractor-1',
          title: `Project ${i}`,
          status: 'draft',
        });
      }

      const client = createMockSupabase(db, { id: 'user-1', email: 'test@example.com' });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

      const params = new URLSearchParams({ limit: '2', offset: '0' });
      const request = createRequest('GET', undefined, params);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.limit).toBe(2);
      expect(data.offset).toBe(0);
    });

    it('only returns projects for the authenticated contractor', async () => {
      // Add a contractor with projects
      db.projects.push(
        { id: 'project-1', contractor_id: 'contractor-1', title: 'My Project', status: 'draft' },
        { id: 'project-2', contractor_id: 'other-contractor', title: 'Not My Project', status: 'draft' }
      );

      const client = createMockSupabase(db, { id: 'user-1', email: 'test@example.com' });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

      const request = createRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should only get projects for contractor-1
      expect(data.projects.every((p: DbRow) => p.contractor_id === 'contractor-1')).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/projects
  // ---------------------------------------------------------------------------

  describe('POST /api/projects', () => {
    beforeEach(() => {
      db.contractors.push({
        id: 'contractor-1',
        auth_user_id: 'user-1',
        business_name: 'Acme Masonry',
        city: 'Denver',
        state: 'CO',
        email: 'test@example.com',
      });
    });

    it('returns 401 when user is not authenticated', async () => {
      const client = createMockSupabase(db, null);
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

      const request = createRequest('POST', { title: 'New Project' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('creates a draft project with empty body', async () => {
      const client = createMockSupabase(db, { id: 'user-1', email: 'test@example.com' });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

      const request = createRequest('POST', {});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.project).toBeDefined();
      expect(data.project.status).toBe('draft');
      expect(data.project.contractor_id).toBe('contractor-1');
    });

    it('creates a project with title and description', async () => {
      const client = createMockSupabase(db, { id: 'user-1', email: 'test@example.com' });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

      const request = createRequest('POST', {
        title: 'Historic Brick Chimney Repair',
        description: 'Complete restoration of a 1920s brick chimney.',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.project.title).toBe('Historic Brick Chimney Repair');
      expect(data.project.description).toBe('Complete restoration of a 1920s brick chimney.');
    });

    it('creates a project with project type and location', async () => {
      const client = createMockSupabase(db, { id: 'user-1', email: 'test@example.com' });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

      const request = createRequest('POST', {
        project_type: 'Chimney Repair',
        city: 'Boulder',
        state: 'CO',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.project.project_type).toBe('Chimney Repair');
      expect(data.project.city).toBe('Boulder');
      expect(data.project.state).toBe('CO');
      expect(data.project.city_slug).toBe('boulder-co');
      expect(data.project.project_type_slug).toBe('chimney-repair');
    });

    it('uses contractor location as default when not provided', async () => {
      const client = createMockSupabase(db, { id: 'user-1', email: 'test@example.com' });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

      const request = createRequest('POST', {
        title: 'Local Project',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.project.city).toBe('Denver');
      expect(data.project.state).toBe('CO');
    });

    it('generates unique slug from title', async () => {
      const client = createMockSupabase(db, { id: 'user-1', email: 'test@example.com' });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

      const request = createRequest('POST', {
        title: 'Historic Building Restoration',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.project.slug).toMatch(/^historic-building-restoration-[a-z0-9]+$/);
    });

    it('creates project with case-study narrative fields', async () => {
      const client = createMockSupabase(db, { id: 'user-1', email: 'test@example.com' });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

      const request = createRequest('POST', {
        title: 'Commercial Facade Repair',
        summary: 'Emergency repair of historic facade.',
        challenge: 'Crumbling mortar on a 100-year-old building.',
        solution: 'Used lime mortar to match original construction.',
        results: 'Building restored to original condition.',
        outcome_highlights: ['Preserved historic character', 'Extended building life by 50 years'],
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.project.summary).toBe('Emergency repair of historic facade.');
      expect(data.project.challenge).toBe('Crumbling mortar on a 100-year-old building.');
      expect(data.project.solution).toBe('Used lime mortar to match original construction.');
      expect(data.project.results).toBe('Building restored to original condition.');
      expect(data.project.outcome_highlights).toEqual([
        'Preserved historic character',
        'Extended building life by 50 years',
      ]);
    });

    it('returns validation error for title exceeding max length', async () => {
      const client = createMockSupabase(db, { id: 'user-1', email: 'test@example.com' });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

      // 201 characters
      const longTitle = 'A'.repeat(201);
      const request = createRequest('POST', { title: longTitle });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('includes empty project_images array in response', async () => {
      const client = createMockSupabase(db, { id: 'user-1', email: 'test@example.com' });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

      const request = createRequest('POST', { title: 'New Project' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.project.project_images).toEqual([]);
    });
  });
});
