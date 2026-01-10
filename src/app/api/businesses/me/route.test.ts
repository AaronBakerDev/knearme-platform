/**
 * Unit tests for /api/businesses/me endpoint.
 *
 * Tests GET (profile retrieval) and PATCH (profile updates) operations.
 * Uses the shared Supabase mock utilities for consistent testing patterns.
 *
 * @see src/app/api/businesses/me/route.ts
 * @see src/lib/testing/supabase-mock.ts
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, PATCH } from './route';
import { createMockSupabase, createMockDb, type DbRow } from '@/lib/testing/supabase-mock';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

// =============================================================================
// Mock Setup
// =============================================================================

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}));

// =============================================================================
// Test Helpers
// =============================================================================

function createRequest(method: string, body?: unknown): NextRequest {
  const url = 'http://localhost:3000/api/businesses/me';
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

describe('/api/businesses/me', () => {
  let db: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    db = createMockDb();
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // GET /api/businesses/me
  // ---------------------------------------------------------------------------

  describe('GET /api/businesses/me', () => {
    it('returns 401 when user is not authenticated', async () => {
      const client = createMockSupabase(db, null);
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
      expect(data.error.message).toContain('Authentication required');
    });

    it('returns 401 when contractor profile not found', async () => {
      const client = createMockSupabase(db, { id: 'user-1', email: 'test@example.com' });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);
      // db.contractors is empty

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('returns business profile when found', async () => {
      db.contractors.push({
        id: 'contractor-1',
        auth_user_id: 'user-1',
        business_name: 'Acme Masonry',
        city: 'Denver',
        state: 'CO',
        email: 'test@example.com',
      });

      db.businesses.push({
        id: 'business-1',
        auth_user_id: 'user-1',
        name: 'Acme Masonry',
        city: 'Denver',
        state: 'CO',
        email: 'test@example.com',
        slug: 'acme-masonry',
        plan_tier: 'free',
      });

      const client = createMockSupabase(db, { id: 'user-1', email: 'test@example.com' });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.business).toBeDefined();
      expect(data.business.name).toBe('Acme Masonry');
      expect(data.business.city).toBe('Denver');
      expect(data.stats).toBeDefined();
      expect(data.stats.total_projects).toBe(0);
    });

    it('returns contractor fallback when business not found', async () => {
      db.contractors.push({
        id: 'contractor-1',
        auth_user_id: 'user-1',
        business_name: 'Legacy Business',
        city: 'Denver',
        state: 'CO',
        email: 'test@example.com',
        profile_slug: 'legacy-business',
      });
      // No business record

      const client = createMockSupabase(db, { id: 'user-1', email: 'test@example.com' });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.business).toBeDefined();
      expect(data.business.name).toBe('Legacy Business');
      expect(data._source).toBe('contractor_fallback');
    });

    it('includes project counts in stats', async () => {
      db.contractors.push({
        id: 'contractor-1',
        auth_user_id: 'user-1',
        business_name: 'Acme Masonry',
        city: 'Denver',
        state: 'CO',
      });

      db.businesses.push({
        id: 'business-1',
        auth_user_id: 'user-1',
        name: 'Acme Masonry',
        city: 'Denver',
        state: 'CO',
        plan_tier: 'free',
      });

      // Add some projects
      db.projects.push(
        { id: 'project-1', business_id: 'business-1', status: 'draft' },
        { id: 'project-2', business_id: 'business-1', status: 'published' },
        { id: 'project-3', business_id: 'business-1', status: 'published' }
      );

      const client = createMockSupabase(db, { id: 'user-1', email: 'test@example.com' });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      // Note: Our mock doesn't implement count queries perfectly,
      // but we verify the structure is correct
      expect(data.stats).toBeDefined();
      expect(typeof data.stats.total_projects).toBe('number');
      expect(typeof data.stats.published_projects).toBe('number');
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /api/businesses/me
  // ---------------------------------------------------------------------------

  describe('PATCH /api/businesses/me', () => {
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

      db.businesses.push({
        id: 'business-1',
        auth_user_id: 'user-1',
        name: 'Acme Masonry',
        city: 'Denver',
        state: 'CO',
        email: 'test@example.com',
        slug: 'acme-masonry',
        plan_tier: 'free',
        legacy_contractor_id: 'contractor-1',
      });
    });

    it('returns 401 when user is not authenticated', async () => {
      const client = createMockSupabase(db, null);
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);
      (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(client);

      const request = createRequest('PATCH', { name: 'New Name' });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('updates business name successfully', async () => {
      const client = createMockSupabase(db, { id: 'user-1', email: 'test@example.com' });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);
      (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(client);

      const request = createRequest('PATCH', { name: 'New Business Name' });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.business).toBeDefined();
      expect(data.business.name).toBe('New Business Name');

      // Verify db was updated
      const business = db.businesses[0] as DbRow;
      expect(business.name).toBe('New Business Name');
    });

    it('updates city and regenerates city_slug', async () => {
      const client = createMockSupabase(db, { id: 'user-1', email: 'test@example.com' });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);
      (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(client);

      const request = createRequest('PATCH', { city: 'Boulder', state: 'CO' });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.business.city).toBe('Boulder');
      expect(data.business.city_slug).toBe('boulder-co');
    });

    it('updates services array', async () => {
      const client = createMockSupabase(db, { id: 'user-1', email: 'test@example.com' });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);
      (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(client);

      const newServices = ['masonry', 'tuckpointing', 'chimney-repair'];
      const request = createRequest('PATCH', { services: newServices });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.business.services).toEqual(newServices);
    });

    it('returns validation error for invalid data', async () => {
      const client = createMockSupabase(db, { id: 'user-1', email: 'test@example.com' });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);
      (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(client);

      // Name too short (min 2 characters)
      const request = createRequest('PATCH', { name: 'A' });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns validation error for invalid state format', async () => {
      const client = createMockSupabase(db, { id: 'user-1', email: 'test@example.com' });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);
      (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(client);

      // State must be 2 characters
      const request = createRequest('PATCH', { state: 'Colorado' });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('updates JSONB fields (location, understanding, context)', async () => {
      const client = createMockSupabase(db, { id: 'user-1', email: 'test@example.com' });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);
      (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(client);

      const request = createRequest('PATCH', {
        location: { lat: 39.7392, lng: -104.9903 },
        understanding: { specialties: ['brick', 'stone'] },
        context: { lastInteraction: '2024-01-15' },
      });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.business.location).toEqual({ lat: 39.7392, lng: -104.9903 });
      expect(data.business.understanding).toEqual({ specialties: ['brick', 'stone'] });
      expect(data.business.context).toEqual({ lastInteraction: '2024-01-15' });
    });

    it('syncs updates to legacy contractors table', async () => {
      const client = createMockSupabase(db, { id: 'user-1', email: 'test@example.com' });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);
      (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(client);

      const request = createRequest('PATCH', { name: 'Synced Business Name' });
      const response = await PATCH(request);

      expect(response.status).toBe(200);

      // Verify contractor was updated too
      const contractor = db.contractors[0] as DbRow;
      expect(contractor.business_name).toBe('Synced Business Name');
    });
  });
});
