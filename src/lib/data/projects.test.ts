/**
 * Unit tests for project data utilities.
 *
 * Tests the fetchRelatedProjects algorithm for diverse matching.
 *
 * @see src/lib/data/projects.ts
 */

import { describe, expect, it, vi } from 'vitest';
import { fetchRelatedProjects } from './projects';

// =============================================================================
// Mock Supabase Client
// =============================================================================

interface MockProject {
  id: string;
  title: string;
  slug: string;
  city_slug: string;
  city: string;
  project_type_slug: string;
  project_type: string;
  business_id: string;
  business: { name: string } | null;
  project_images: Array<{ storage_path: string; alt_text: string | null; display_order: number }>;
}

function createMockSupabase(projects: MockProject[]) {
  return {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: projects }),
  };
}

// =============================================================================
// Helper to create mock projects
// =============================================================================

function createProject(overrides: Partial<MockProject> = {}): MockProject {
  const id = overrides.id || `proj-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id,
    title: overrides.title ?? `Project ${id}`,
    slug: overrides.slug ?? `project-${id}`,
    city_slug: overrides.city_slug ?? 'denver-co',
    city: overrides.city ?? 'Denver',
    project_type_slug: overrides.project_type_slug ?? 'chimney-repair',
    project_type: overrides.project_type ?? 'Chimney Repair',
    business_id: overrides.business_id ?? 'biz-1',
    business: overrides.business ?? { name: 'Acme Masonry' },
    project_images: overrides.project_images ?? [
      { storage_path: 'images/cover.jpg', alt_text: 'Cover', display_order: 0 },
    ],
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('fetchRelatedProjects', () => {
  const currentProject = {
    id: 'current-project',
    business_id: 'biz-1',
    city_slug: 'denver-co',
    project_type_slug: 'chimney-repair',
  };

  it('returns empty array when no projects exist', async () => {
    const supabase = createMockSupabase([]);

    const result = await fetchRelatedProjects(supabase, currentProject);

    expect(result).toEqual([]);
  });

  it('returns projects from same business first (up to 2), then fills remaining', async () => {
    const projects = [
      createProject({ id: 'p1', business_id: 'biz-1', city_slug: 'denver-co' }),
      createProject({ id: 'p2', business_id: 'biz-1', city_slug: 'denver-co' }),
      createProject({ id: 'p3', business_id: 'biz-1', city_slug: 'denver-co' }),
    ];
    const supabase = createMockSupabase(projects);

    const result = await fetchRelatedProjects(supabase, currentProject);

    // First 2 are priority (same business), 3rd fills remaining
    // Default limit is 6, so all 3 are included
    expect(result.length).toBe(3);
    expect(result[0].id).toBe('p1');
    expect(result[1].id).toBe('p2');
    expect(result[2].id).toBe('p3');
  });

  it('includes same type/other city projects after same business', async () => {
    const projects = [
      createProject({ id: 'same-biz', business_id: 'biz-1' }),
      createProject({ id: 'same-type-1', business_id: 'biz-2', project_type_slug: 'chimney-repair', city_slug: 'boulder-co' }),
      createProject({ id: 'same-type-2', business_id: 'biz-3', project_type_slug: 'chimney-repair', city_slug: 'lakewood-co' }),
    ];
    const supabase = createMockSupabase(projects);

    const result = await fetchRelatedProjects(supabase, currentProject);

    expect(result.length).toBe(3);
    expect(result[0].id).toBe('same-biz');
    expect(result[1].id).toBe('same-type-1');
    expect(result[2].id).toBe('same-type-2');
  });

  it('includes same city/other type projects', async () => {
    const projects = [
      createProject({ id: 'same-city-1', business_id: 'biz-2', city_slug: 'denver-co', project_type_slug: 'tuckpointing' }),
      createProject({ id: 'same-city-2', business_id: 'biz-3', city_slug: 'denver-co', project_type_slug: 'brick-repair' }),
    ];
    const supabase = createMockSupabase(projects);

    const result = await fetchRelatedProjects(supabase, currentProject);

    expect(result.length).toBe(2);
    expect(result[0].id).toBe('same-city-1');
    expect(result[1].id).toBe('same-city-2');
  });

  it('respects the limit parameter', async () => {
    const projects = [
      createProject({ id: 'p1', business_id: 'biz-1' }),
      createProject({ id: 'p2', business_id: 'biz-1' }),
      createProject({ id: 'p3', business_id: 'biz-2', project_type_slug: 'chimney-repair', city_slug: 'boulder-co' }),
      createProject({ id: 'p4', business_id: 'biz-3', city_slug: 'denver-co', project_type_slug: 'tuckpointing' }),
      createProject({ id: 'p5', business_id: 'biz-4', city_slug: 'denver-co', project_type_slug: 'brick-repair' }),
    ];
    const supabase = createMockSupabase(projects);

    const result = await fetchRelatedProjects(supabase, currentProject, 3);

    expect(result.length).toBe(3);
  });

  it('deduplicates projects across categories', async () => {
    // Same project should not appear twice
    const sameBizProject = createProject({ id: 'dup', business_id: 'biz-1' });
    const supabase = createMockSupabase([sameBizProject, sameBizProject]);

    const result = await fetchRelatedProjects(supabase, currentProject);

    expect(result.length).toBe(1);
    expect(result[0].id).toBe('dup');
  });

  it('includes cover image from first image by display_order', async () => {
    const project = createProject({
      id: 'p1',
      business_id: 'biz-1',
      project_images: [
        { storage_path: 'images/second.jpg', alt_text: 'Second', display_order: 1 },
        { storage_path: 'images/first.jpg', alt_text: 'First', display_order: 0 },
      ],
    });
    const supabase = createMockSupabase([project]);

    const result = await fetchRelatedProjects(supabase, currentProject);

    expect(result[0].cover_image?.storage_path).toBe('images/first.jpg');
    expect(result[0].cover_image?.alt_text).toBe('First');
  });

  it('handles projects without images', async () => {
    const project = createProject({
      id: 'no-images',
      business_id: 'biz-1',
      project_images: [],
    });
    const supabase = createMockSupabase([project]);

    const result = await fetchRelatedProjects(supabase, currentProject);

    expect(result[0].cover_image).toBeUndefined();
  });

  it('includes business_name from joined business', async () => {
    const project = createProject({
      id: 'p1',
      business_id: 'biz-1',
      business: { name: 'Premium Masonry LLC' },
    });
    const supabase = createMockSupabase([project]);

    const result = await fetchRelatedProjects(supabase, currentProject);

    expect(result[0].business_name).toBe('Premium Masonry LLC');
  });

  it('handles null business gracefully', async () => {
    // Create project directly without helper to test null business
    const project: MockProject = {
      id: 'p1',
      title: 'Project p1',
      slug: 'project-p1',
      city_slug: 'denver-co',
      city: 'Denver',
      project_type_slug: 'chimney-repair',
      project_type: 'Chimney Repair',
      business_id: 'biz-1',
      business: null,
      project_images: [],
    };
    const supabase = createMockSupabase([project]);

    const result = await fetchRelatedProjects(supabase, currentProject);

    expect(result[0].business_name).toBeUndefined();
  });

  it('prioritizes diverse results in correct order', async () => {
    const projects = [
      // Same business (should get 2)
      createProject({ id: 'biz-1', business_id: 'biz-1' }),
      createProject({ id: 'biz-2', business_id: 'biz-1' }),
      createProject({ id: 'biz-3', business_id: 'biz-1' }),
      // Same type, other city (should get 2)
      createProject({ id: 'type-1', business_id: 'biz-2', project_type_slug: 'chimney-repair', city_slug: 'boulder-co' }),
      createProject({ id: 'type-2', business_id: 'biz-3', project_type_slug: 'chimney-repair', city_slug: 'lakewood-co' }),
      // Same city, other type (should get 2)
      createProject({ id: 'city-1', business_id: 'biz-4', city_slug: 'denver-co', project_type_slug: 'tuckpointing' }),
      createProject({ id: 'city-2', business_id: 'biz-5', city_slug: 'denver-co', project_type_slug: 'brick-repair' }),
    ];
    const supabase = createMockSupabase(projects);

    const result = await fetchRelatedProjects(supabase, currentProject, 6);

    expect(result.length).toBe(6);
    // First 2: same business
    expect(result[0].id).toBe('biz-1');
    expect(result[1].id).toBe('biz-2');
    // Next 2: same type, other city
    expect(result[2].id).toBe('type-1');
    expect(result[3].id).toBe('type-2');
    // Last 2: same city, other type
    expect(result[4].id).toBe('city-1');
    expect(result[5].id).toBe('city-2');
  });

  it('fills remaining slots from all categories when under limit', async () => {
    const projects = [
      createProject({ id: 'biz-1', business_id: 'biz-1' }),
      createProject({ id: 'biz-2', business_id: 'biz-1' }),
      createProject({ id: 'biz-3', business_id: 'biz-1' }),
      createProject({ id: 'biz-4', business_id: 'biz-1' }),
    ];
    const supabase = createMockSupabase(projects);

    const result = await fetchRelatedProjects(supabase, currentProject, 4);

    // Should fill to limit even though only 2 "priority" slots for same business
    expect(result.length).toBe(4);
  });
});
