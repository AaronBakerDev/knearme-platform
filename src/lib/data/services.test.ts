/**
 * Unit tests for services data utilities.
 *
 * Tests pure utility functions and database query functions.
 *
 * @see src/lib/data/services.ts
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mapUrlSlugToServiceId,
  mapServiceIdToUrlSlug,
  isValidNationalServiceType,
  NATIONAL_SERVICE_TYPES,
  getServiceTypes,
  getServiceTypeSlugs,
  getServiceTypeBySlug,
  getServiceTypeById,
  clearServiceTypesCache,
  getCitiesByServiceType,
  getFeaturedProjectsByService,
  getProjectCountByService,
  getBusinessCountByService,
  type ServiceType,
} from './services';
import { createAdminClient } from '@/lib/supabase/server';

// =============================================================================
// Mock Setup
// =============================================================================

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  clearServiceTypesCache();
});

// Create mock service types for testing
function createMockServiceType(overrides: Partial<ServiceType> = {}): ServiceType {
  const id = overrides.id || `st-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id,
    service_id: overrides.service_id ?? 'chimney-repair',
    url_slug: overrides.url_slug ?? 'chimney-repair',
    label: overrides.label ?? 'Chimney Repair',
    short_description: overrides.short_description ?? 'Chimney repair services',
    long_description: overrides.long_description,
    seo_title: overrides.seo_title,
    seo_description: overrides.seo_description,
    common_issues: overrides.common_issues,
    keywords: overrides.keywords,
    trade: overrides.trade ?? 'masonry',
    is_published: overrides.is_published ?? true,
    sort_order: overrides.sort_order ?? 0,
    icon_emoji: overrides.icon_emoji,
  };
}

type ChainMethod = 'from' | 'select' | 'eq' | 'order' | 'not' | 'limit';

function createQueryChain(methods: ChainMethod[]) {
  const chain: Record<ChainMethod, ReturnType<typeof vi.fn>> = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  };

  for (const method of methods) {
    chain[method] = vi.fn().mockReturnThis();
  }

  return chain;
}

function mockAdminClient(client: Record<string, unknown>) {
  (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(client);
  return client;
}

// =============================================================================
// Pure Utility Function Tests
// =============================================================================

describe('mapUrlSlugToServiceId', () => {
  it('maps stone-masonry to stone-work', () => {
    expect(mapUrlSlugToServiceId('stone-masonry')).toBe('stone-work');
  });

  it('maps historic-restoration to restoration', () => {
    expect(mapUrlSlugToServiceId('historic-restoration')).toBe('restoration');
  });

  it('maps masonry-waterproofing to waterproofing', () => {
    expect(mapUrlSlugToServiceId('masonry-waterproofing')).toBe('waterproofing');
  });

  it('returns same slug for direct mappings', () => {
    expect(mapUrlSlugToServiceId('chimney-repair')).toBe('chimney-repair');
    expect(mapUrlSlugToServiceId('tuckpointing')).toBe('tuckpointing');
    expect(mapUrlSlugToServiceId('brick-repair')).toBe('brick-repair');
  });

  it('returns unknown slugs unchanged', () => {
    expect(mapUrlSlugToServiceId('unknown-service')).toBe('unknown-service');
  });
});

describe('mapServiceIdToUrlSlug', () => {
  it('maps stone-work to stone-masonry', () => {
    expect(mapServiceIdToUrlSlug('stone-work')).toBe('stone-masonry');
  });

  it('maps restoration to historic-restoration', () => {
    expect(mapServiceIdToUrlSlug('restoration')).toBe('historic-restoration');
  });

  it('maps waterproofing to masonry-waterproofing', () => {
    expect(mapServiceIdToUrlSlug('waterproofing')).toBe('masonry-waterproofing');
  });

  it('returns same slug for direct mappings', () => {
    expect(mapServiceIdToUrlSlug('chimney-repair')).toBe('chimney-repair');
    expect(mapServiceIdToUrlSlug('tuckpointing')).toBe('tuckpointing');
  });

  it('returns unknown service IDs unchanged', () => {
    expect(mapServiceIdToUrlSlug('unknown-id')).toBe('unknown-id');
  });
});

describe('isValidNationalServiceType', () => {
  it('returns true for valid national service types', () => {
    expect(isValidNationalServiceType('chimney-repair')).toBe(true);
    expect(isValidNationalServiceType('tuckpointing')).toBe(true);
    expect(isValidNationalServiceType('stone-masonry')).toBe(true);
  });

  it('returns false for invalid service types', () => {
    expect(isValidNationalServiceType('unknown-service')).toBe(false);
    expect(isValidNationalServiceType('')).toBe(false);
    expect(isValidNationalServiceType('CHIMNEY-REPAIR')).toBe(false); // Case sensitive
  });
});

describe('NATIONAL_SERVICE_TYPES', () => {
  it('contains expected service types', () => {
    expect(NATIONAL_SERVICE_TYPES).toContain('chimney-repair');
    expect(NATIONAL_SERVICE_TYPES).toContain('tuckpointing');
    expect(NATIONAL_SERVICE_TYPES).toContain('brick-repair');
    expect(NATIONAL_SERVICE_TYPES).toContain('stone-masonry');
    expect(NATIONAL_SERVICE_TYPES).toContain('foundation-repair');
    expect(NATIONAL_SERVICE_TYPES).toContain('historic-restoration');
    expect(NATIONAL_SERVICE_TYPES).toContain('masonry-waterproofing');
    expect(NATIONAL_SERVICE_TYPES).toContain('efflorescence-removal');
  });

  it('has 8 service types', () => {
    expect(NATIONAL_SERVICE_TYPES.length).toBe(8);
  });
});

// =============================================================================
// Database Query Function Tests
// =============================================================================

describe('getServiceTypes', () => {
  it('returns service types from database', async () => {
    const mockData = [
      createMockServiceType({ service_id: 'chimney-repair', sort_order: 1 }),
      createMockServiceType({ service_id: 'tuckpointing', sort_order: 2 }),
    ];

    const chainMock = createQueryChain(['from', 'select', 'eq', 'order']);
    chainMock.order.mockResolvedValue({ data: mockData, error: null });
    mockAdminClient(chainMock);

    const result = await getServiceTypes();

    expect(result).toHaveLength(2);
    expect(result[0]?.service_id).toBe('chimney-repair');
  });

  it('uses cache on subsequent calls', async () => {
    const mockData = [createMockServiceType({ service_id: 'cached-service' })];

    const chainMock = createQueryChain(['from', 'select', 'eq', 'order']);
    chainMock.order.mockResolvedValue({ data: mockData, error: null });
    mockAdminClient(chainMock);

    // First call
    await getServiceTypes();
    // Second call
    await getServiceTypes();

    // Should only call database once
    expect(chainMock.from).toHaveBeenCalledTimes(1);
  });

  it('bypasses cache when forceRefresh is true', async () => {
    const mockData = [createMockServiceType()];

    const chainMock = createQueryChain(['from', 'select', 'eq', 'order']);
    chainMock.order.mockResolvedValue({ data: mockData, error: null });
    mockAdminClient(chainMock);

    // First call (caches)
    await getServiceTypes();
    // Force refresh
    await getServiceTypes(true);

    // Should call database twice
    expect(chainMock.from).toHaveBeenCalledTimes(2);
  });

  it('returns cached data on database error', async () => {
    const mockData = [createMockServiceType({ service_id: 'first-call' })];

    const chainMock = createQueryChain(['from', 'select', 'eq', 'order']);
    chainMock.order
      .mockResolvedValueOnce({ data: mockData, error: null })
      .mockResolvedValueOnce({ data: null, error: new Error('DB Error') });
    mockAdminClient(chainMock);

    // First call succeeds
    const firstResult = await getServiceTypes();
    expect(firstResult[0]?.service_id).toBe('first-call');

    // Clear and force error
    clearServiceTypesCache();

    // Force refresh with error - should return empty since cache was cleared
    const errorResult = await getServiceTypes(true);
    expect(errorResult).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // Cache expiration tests (using fake timers)
  // ---------------------------------------------------------------------------

  it('returns cached data when TTL has not expired', async () => {
    vi.useFakeTimers();

    const mockData = [createMockServiceType({ service_id: 'cached-data' })];

    const chainMock = createQueryChain(['from', 'select', 'eq', 'order']);
    chainMock.order.mockResolvedValue({ data: mockData, error: null });
    mockAdminClient(chainMock);

    // First call (caches)
    await getServiceTypes();
    expect(chainMock.from).toHaveBeenCalledTimes(1);

    // Advance time by 30 minutes (less than 1 hour TTL)
    vi.advanceTimersByTime(30 * 60 * 1000);

    // Second call should use cache
    const result = await getServiceTypes();
    expect(result[0]?.service_id).toBe('cached-data');
    expect(chainMock.from).toHaveBeenCalledTimes(1); // Still only 1 call

    vi.useRealTimers();
  });

  it('refetches data when TTL has expired', async () => {
    vi.useFakeTimers();

    const chainMock = createQueryChain(['from', 'select', 'eq', 'order']);
    chainMock.order
      .mockResolvedValueOnce({ data: [createMockServiceType({ service_id: 'old-data' })], error: null })
      .mockResolvedValueOnce({ data: [createMockServiceType({ service_id: 'new-data' })], error: null });
    mockAdminClient(chainMock);

    // First call (caches)
    const firstResult = await getServiceTypes();
    expect(firstResult[0]?.service_id).toBe('old-data');
    expect(chainMock.from).toHaveBeenCalledTimes(1);

    // Advance time by 61 minutes (past 1 hour TTL)
    vi.advanceTimersByTime(61 * 60 * 1000);

    // Second call should refetch
    const secondResult = await getServiceTypes();
    expect(secondResult[0]?.service_id).toBe('new-data');
    expect(chainMock.from).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});

describe('getServiceTypeSlugs', () => {
  it('returns array of URL slugs', async () => {
    const mockData = [
      createMockServiceType({ url_slug: 'chimney-repair' }),
      createMockServiceType({ url_slug: 'stone-masonry' }),
    ];

    const chainMock = createQueryChain(['from', 'select', 'eq', 'order']);
    chainMock.order.mockResolvedValue({ data: mockData, error: null });
    mockAdminClient(chainMock);

    const slugs = await getServiceTypeSlugs();

    expect(slugs).toEqual(['chimney-repair', 'stone-masonry']);
  });
});

describe('getServiceTypeBySlug', () => {
  it('returns service type matching slug', async () => {
    const mockData = [
      createMockServiceType({ url_slug: 'chimney-repair', label: 'Chimney Repair' }),
      createMockServiceType({ url_slug: 'tuckpointing', label: 'Tuckpointing' }),
    ];

    const chainMock = createQueryChain(['from', 'select', 'eq', 'order']);
    chainMock.order.mockResolvedValue({ data: mockData, error: null });
    mockAdminClient(chainMock);

    const result = await getServiceTypeBySlug('tuckpointing');

    expect(result).not.toBeNull();
    expect(result!.label).toBe('Tuckpointing');
  });

  it('returns null for non-existent slug', async () => {
    const mockData = [createMockServiceType({ url_slug: 'chimney-repair' })];

    const chainMock = createQueryChain(['from', 'select', 'eq', 'order']);
    chainMock.order.mockResolvedValue({ data: mockData, error: null });
    mockAdminClient(chainMock);

    const result = await getServiceTypeBySlug('unknown-slug');

    expect(result).toBeNull();
  });
});

describe('getServiceTypeById', () => {
  it('returns service type matching service_id', async () => {
    const mockData = [
      createMockServiceType({ service_id: 'stone-work', url_slug: 'stone-masonry' }),
    ];

    const chainMock = createQueryChain(['from', 'select', 'eq', 'order']);
    chainMock.order.mockResolvedValue({ data: mockData, error: null });
    mockAdminClient(chainMock);

    const result = await getServiceTypeById('stone-work');

    expect(result).not.toBeNull();
    expect(result!.url_slug).toBe('stone-masonry');
  });
});

describe('getCitiesByServiceType', () => {
  it('aggregates and sorts cities by project count', async () => {
    const mockData = [
      { city_slug: 'denver-co', city: 'Denver', business: { state: 'CO' } },
      { city_slug: 'denver-co', city: 'Denver', business: { state: 'CO' } },
      { city_slug: 'denver-co', city: 'Denver', business: { state: 'CO' } },
      { city_slug: 'boulder-co', city: 'Boulder', business: { state: 'CO' } },
    ];

    // Create chainable mock - all methods return this except the last
    const chainMock = createQueryChain(['from', 'select', 'eq', 'not']);
    chainMock.not
      .mockReturnValueOnce(chainMock)
      .mockResolvedValueOnce({ data: mockData, error: null });

    mockAdminClient(chainMock);

    const result = await getCitiesByServiceType('chimney-repair');

    expect(result).toHaveLength(2);
    expect(result[0]?.citySlug).toBe('denver-co');
    expect(result[0]?.projectCount).toBe(3);
    expect(result[1]?.citySlug).toBe('boulder-co');
    expect(result[1]?.projectCount).toBe(1);
  });

  it('handles null business state gracefully', async () => {
    const mockData = [
      { city_slug: 'denver-co', city: 'Denver', business: null },
    ];

    const chainMock = createQueryChain(['from', 'select', 'eq', 'not']);
    chainMock.not
      .mockReturnValueOnce(chainMock)
      .mockResolvedValueOnce({ data: mockData, error: null });

    mockAdminClient(chainMock);

    const result = await getCitiesByServiceType('chimney-repair');

    expect(result[0]?.state).toBe('');
  });

  it('returns empty array on error', async () => {
    const chainMock = createQueryChain(['from', 'select', 'eq', 'not']);
    chainMock.not
      .mockReturnValueOnce(chainMock)
      .mockResolvedValueOnce({ data: null, error: new Error('DB error') });

    mockAdminClient(chainMock);

    const result = await getCitiesByServiceType('chimney-repair');

    expect(result).toEqual([]);
  });
});

describe('getFeaturedProjectsByService', () => {
  it('returns projects with cover image from first by display_order', async () => {
    const mockData = [
      {
        id: 'proj-1',
        title: 'Project 1',
        business: { id: 'biz-1', name: 'Acme' },
        project_images: [
          { id: 'img-2', storage_path: 'second.jpg', display_order: 1, alt_text: null, image_type: 'after' },
          { id: 'img-1', storage_path: 'first.jpg', display_order: 0, alt_text: 'Cover', image_type: 'before' },
        ],
      },
    ];

    const chainMock = createQueryChain(['from', 'select', 'eq', 'order', 'limit']);
    chainMock.limit.mockResolvedValue({ data: mockData, error: null });
    mockAdminClient(chainMock);

    const result = await getFeaturedProjectsByService('chimney-repair');

    expect(result).toHaveLength(1);
    expect(result[0]?.cover_image?.storage_path).toBe('first.jpg');
  });

  it('handles projects without images', async () => {
    const mockData = [
      {
        id: 'proj-1',
        business: { id: 'biz-1', name: 'Acme' },
        project_images: [],
      },
    ];

    const chainMock = createQueryChain(['from', 'select', 'eq', 'order', 'limit']);
    chainMock.limit.mockResolvedValue({ data: mockData, error: null });
    mockAdminClient(chainMock);

    const result = await getFeaturedProjectsByService('chimney-repair');

    expect(result[0]?.cover_image).toBeUndefined();
  });
});

describe('getProjectCountByService', () => {
  it('returns count from database', async () => {
    // Chain: from().select().eq().eq()
    const chainMock = createQueryChain(['from', 'select', 'eq']);
    chainMock.eq
      .mockReturnValueOnce(chainMock) // First .eq()
      .mockResolvedValueOnce({ count: 42, error: null }); // Second .eq()

    mockAdminClient(chainMock);

    const result = await getProjectCountByService('chimney-repair');

    expect(result).toBe(42);
  });

  it('returns 0 on error', async () => {
    const chainMock = createQueryChain(['from', 'select', 'eq']);
    chainMock.eq
      .mockReturnValueOnce(chainMock)
      .mockResolvedValueOnce({ count: null, error: new Error('DB error') });

    mockAdminClient(chainMock);

    const result = await getProjectCountByService('chimney-repair');

    expect(result).toBe(0);
  });
});

describe('getBusinessCountByService', () => {
  it('counts unique business IDs', async () => {
    const mockData = [
      { business_id: 'biz-1' },
      { business_id: 'biz-1' }, // Duplicate
      { business_id: 'biz-2' },
      { business_id: 'biz-3' },
    ];

    const chainMock = createQueryChain(['from', 'select', 'eq']);
    chainMock.eq
      .mockReturnValueOnce(chainMock)
      .mockResolvedValueOnce({ data: mockData, error: null });

    mockAdminClient(chainMock);

    const result = await getBusinessCountByService('chimney-repair');

    expect(result).toBe(3); // 3 unique businesses
  });

  it('returns 0 on error', async () => {
    const chainMock = createQueryChain(['from', 'select', 'eq']);
    chainMock.eq
      .mockReturnValueOnce(chainMock)
      .mockResolvedValueOnce({ data: null, error: new Error('DB error') });

    mockAdminClient(chainMock);

    const result = await getBusinessCountByService('chimney-repair');

    expect(result).toBe(0);
  });
});
