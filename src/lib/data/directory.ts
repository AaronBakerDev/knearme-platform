/**
 * Data layer for directory feature (public business listings).
 *
 * Provides query functions for:
 * - State-level directory pages (all states, single state with cities)
 * - City-level directory pages (single city with categories)
 * - Category-level directory pages (business listings for a category)
 * - Individual business detail pages
 *
 * URL Structure:
 * - /directory → All states
 * - /directory/[state] → Cities in state
 * - /directory/[state]/[city] → Categories in city
 * - /directory/[state]/[city]/[category] → Business listings
 * - /directory/[state]/[city]/[category]/[business] → Business detail
 *
 * Used by: app/(public)/directory/[...] pages
 *
 * @see /docs/11-seo-discovery/page-templates/directory.md
 * @see /src/types/directory.ts for type definitions
 */

import { createAdminClient } from '@/lib/supabase/server';
import type { DirectoryPlace, StateStats, CityStats, CategoryStats } from '@/types/directory';

/**
 * Get statistics for all states in the directory.
 * Returns states sorted by business count (descending).
 *
 * @returns Array of state statistics
 *
 * @example
 * const states = await getStateStats();
 * // Returns: [
 * //   { state_slug: 'colorado', state_name: 'Colorado', business_count: 150, city_count: 12, avg_rating: 4.5 },
 * //   ...
 * // ]
 */
export async function getStateStats(): Promise<StateStats[]> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('directory_places')
    .select('province_state, state_slug, city_slug, rating')
    .not('state_slug', 'is', null);

  if (error) {
    console.error('[getStateStats] Error:', error);
    return [];
  }

  type PlaceRow = {
    province_state: string;
    state_slug: string;
    city_slug: string;
    rating: number | null;
  };
  const places = (data || []) as PlaceRow[];

  // Aggregate by state
  const stateMap = new Map<string, {
    state_slug: string;
    state_name: string;
    business_count: number;
    cities: Set<string>;
    ratings: number[];
  }>();

  places.forEach((place) => {
    if (!place.state_slug) return;

    const existing = stateMap.get(place.state_slug);
    if (existing) {
      existing.business_count++;
      if (place.city_slug) existing.cities.add(place.city_slug);
      if (place.rating !== null) existing.ratings.push(place.rating);
    } else {
      stateMap.set(place.state_slug, {
        state_slug: place.state_slug,
        state_name: place.province_state,
        business_count: 1,
        cities: place.city_slug ? new Set([place.city_slug]) : new Set(),
        ratings: place.rating !== null ? [place.rating] : [],
      });
    }
  });

  // Convert to final format
  return Array.from(stateMap.values())
    .map((state) => ({
      state_slug: state.state_slug,
      state_name: state.state_name,
      business_count: state.business_count,
      city_count: state.cities.size,
      avg_rating: state.ratings.length > 0
        ? state.ratings.reduce((sum, r) => sum + r, 0) / state.ratings.length
        : null,
    }))
    .sort((a, b) => b.business_count - a.business_count);
}

/**
 * Get statistics for a single state by slug.
 * Returns null if state not found.
 *
 * @param stateSlug - The state slug (e.g., 'colorado')
 * @returns State statistics or null
 *
 * @example
 * const state = await getStateBySlug('colorado');
 * if (!state) return notFound();
 */
export async function getStateBySlug(stateSlug: string): Promise<StateStats | null> {
  const states = await getStateStats();
  return states.find((s) => s.state_slug === stateSlug) || null;
}

/**
 * Get all cities for a specific state, sorted by business count (descending).
 *
 * @param stateSlug - The state slug (e.g., 'colorado')
 * @returns Array of city statistics
 *
 * @example
 * const cities = await getCitiesForState('colorado');
 * // Returns: [
 * //   { city_slug: 'denver', city_name: 'Denver', business_count: 75, ... },
 * //   ...
 * // ]
 */
export async function getCitiesForState(stateSlug: string): Promise<CityStats[]> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('directory_places')
    .select('city, city_slug, province_state, state_slug, category_slug, rating')
    .eq('state_slug', stateSlug)
    .not('city_slug', 'is', null);

  if (error) {
    console.error('[getCitiesForState] Error:', error);
    return [];
  }

  type PlaceRow = {
    city: string[];
    city_slug: string;
    province_state: string;
    state_slug: string;
    category_slug: string;
    rating: number | null;
  };
  const places = (data || []) as PlaceRow[];

  // Aggregate by city
  const cityMap = new Map<string, {
    city_slug: string;
    city_name: string;
    state_slug: string;
    state_name: string;
    business_count: number;
    categories: Set<string>;
    ratings: number[];
  }>();

  places.forEach((place) => {
    if (!place.city_slug) return;

    const cityName = Array.isArray(place.city) && place.city.length > 0
      ? (place.city[0] ?? place.city_slug)
      : place.city_slug;

    const existing = cityMap.get(place.city_slug);
    if (existing) {
      existing.business_count++;
      if (place.category_slug) existing.categories.add(place.category_slug);
      if (place.rating !== null) existing.ratings.push(place.rating);
    } else {
      cityMap.set(place.city_slug, {
        city_slug: place.city_slug,
        city_name: cityName,
        state_slug: place.state_slug,
        state_name: place.province_state,
        business_count: 1,
        categories: place.category_slug ? new Set([place.category_slug]) : new Set(),
        ratings: place.rating !== null ? [place.rating] : [],
      });
    }
  });

  // Convert to final format
  return Array.from(cityMap.values())
    .map((city) => ({
      state_slug: city.state_slug,
      city_slug: city.city_slug,
      city_name: city.city_name,
      state_name: city.state_name,
      business_count: city.business_count,
      category_count: city.categories.size,
      avg_rating: city.ratings.length > 0
        ? city.ratings.reduce((sum, r) => sum + r, 0) / city.ratings.length
        : null,
    }))
    .sort((a, b) => b.business_count - a.business_count);
}

/**
 * Get statistics for a single city by state and city slug.
 * Returns null if city not found.
 *
 * @param stateSlug - The state slug (e.g., 'colorado')
 * @param citySlug - The city slug (e.g., 'denver')
 * @returns City statistics or null
 *
 * @example
 * const city = await getCityStats('colorado', 'denver');
 * if (!city) return notFound();
 */
export async function getCityStats(
  stateSlug: string,
  citySlug: string
): Promise<CityStats | null> {
  const cities = await getCitiesForState(stateSlug);
  return cities.find((c) => c.city_slug === citySlug) || null;
}

/**
 * Get category breakdown for a specific city.
 * Returns categories sorted by business count (descending).
 *
 * @param stateSlug - The state slug (e.g., 'colorado')
 * @param citySlug - The city slug (e.g., 'denver')
 * @returns Array of category statistics
 *
 * @example
 * const categories = await getCategoriesForCity('colorado', 'denver');
 * // Returns: [
 * //   { category_slug: 'masonry-contractor', category_name: 'Masonry Contractor', business_count: 25, avg_rating: 4.6 },
 * //   ...
 * // ]
 */
export async function getCategoriesForCity(
  stateSlug: string,
  citySlug: string
): Promise<CategoryStats[]> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('directory_places')
    .select('category, category_slug, rating')
    .eq('state_slug', stateSlug)
    .eq('city_slug', citySlug)
    .not('category_slug', 'is', null);

  if (error) {
    console.error('[getCategoriesForCity] Error:', error);
    return [];
  }

  type PlaceRow = {
    category: string;
    category_slug: string;
    rating: number | null;
  };
  const places = (data || []) as PlaceRow[];

  // Aggregate by category
  const categoryMap = new Map<string, {
    category_slug: string;
    category_name: string;
    business_count: number;
    ratings: number[];
  }>();

  places.forEach((place) => {
    if (!place.category_slug) return;

    const existing = categoryMap.get(place.category_slug);
    if (existing) {
      existing.business_count++;
      if (place.rating !== null) existing.ratings.push(place.rating);
    } else {
      categoryMap.set(place.category_slug, {
        category_slug: place.category_slug,
        category_name: place.category,
        business_count: 1,
        ratings: place.rating !== null ? [place.rating] : [],
      });
    }
  });

  // Convert to final format
  return Array.from(categoryMap.values())
    .map((category) => ({
      category_slug: category.category_slug,
      category_name: category.category_name,
      business_count: category.business_count,
      avg_rating: category.ratings.length > 0
        ? category.ratings.reduce((sum, r) => sum + r, 0) / category.ratings.length
        : null,
    }))
    .sort((a, b) => b.business_count - a.business_count);
}

/**
 * Filter options for business listings.
 */
export interface ListingFilters {
  minRating?: number;
  hasWebsite?: boolean;
  hasPhone?: boolean;
}

/**
 * Get paginated business listings for a specific category in a city.
 * Returns businesses sorted by rating (descending), then rating_count (descending).
 *
 * @param stateSlug - The state slug (e.g., 'colorado')
 * @param citySlug - The city slug (e.g., 'denver')
 * @param categorySlug - The category slug (e.g., 'masonry-contractor')
 * @param page - Page number (1-indexed)
 * @param limit - Number of results per page
 * @param filters - Optional filter criteria
 * @returns Array of business listings
 *
 * @example
 * const businesses = await getCategoryListings('colorado', 'denver', 'masonry-contractor', 1, 20);
 * // Returns 20 businesses for page 1
 *
 * @example
 * const filtered = await getCategoryListings('colorado', 'denver', 'masonry-contractor', 1, 20, {
 *   minRating: 4,
 *   hasWebsite: true
 * });
 * // Returns 20 businesses with 4+ stars and a website
 */
export async function getCategoryListings(
  stateSlug: string,
  citySlug: string,
  categorySlug: string,
  page: number = 1,
  limit: number = 20,
  filters?: ListingFilters
): Promise<DirectoryPlace[]> {
  const supabase = createAdminClient();

  const offset = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('directory_places')
    .select('*')
    .eq('state_slug', stateSlug)
    .eq('city_slug', citySlug)
    .eq('category_slug', categorySlug);

  // Apply filters
  if (filters) {
    if (filters.minRating !== undefined) {
      query = query.gte('rating', filters.minRating);
    }
    if (filters.hasWebsite) {
      query = query.not('website', 'is', null);
    }
    if (filters.hasPhone) {
      query = query.not('phone_number', 'is', null);
    }
  }

  // Apply sorting and pagination
  query = query
    .order('rating', { ascending: false, nullsFirst: false })
    .order('rating_count', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    console.error('[getCategoryListings] Error:', error);
    return [];
  }

  return (data || []) as DirectoryPlace[];
}

/**
 * Get a single business by its complete slug path.
 * Returns null if business not found.
 *
 * @param stateSlug - The state slug (e.g., 'colorado')
 * @param citySlug - The city slug (e.g., 'denver')
 * @param categorySlug - The category slug (e.g., 'masonry-contractor')
 * @param businessSlug - The business slug (e.g., 'acme-masonry')
 * @returns Business details or null
 *
 * @example
 * const business = await getBusinessBySlug('colorado', 'denver', 'masonry-contractor', 'acme-masonry');
 * if (!business) return notFound();
 */
export async function getBusinessBySlug(
  stateSlug: string,
  citySlug: string,
  categorySlug: string,
  businessSlug: string
): Promise<DirectoryPlace | null> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('directory_places')
    .select('*')
    .eq('state_slug', stateSlug)
    .eq('city_slug', citySlug)
    .eq('category_slug', categorySlug)
    .eq('slug', businessSlug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('[getBusinessBySlug] Error:', error);
    return null;
  }

  return data as DirectoryPlace | null;
}

/**
 * Get all businesses for a specific state (for sitemap generation).
 * Returns minimal data needed for URLs: state, city, category, and business slug.
 *
 * @param stateSlug - The state slug (e.g., 'colorado')
 * @returns Array of businesses with URL components
 *
 * @example
 * const businesses = await getBusinessesForState('colorado');
 * // Returns: [
 * //   { state_slug: 'colorado', city_slug: 'denver', category_slug: 'masonry-contractor', slug: 'acme-masonry' },
 * //   ...
 * // ]
 */
export async function getBusinessesForState(
  stateSlug: string
): Promise<Array<{ state_slug: string; city_slug: string; category_slug: string; slug: string }>> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('directory_places')
    .select('state_slug, city_slug, category_slug, slug')
    .eq('state_slug', stateSlug)
    .not('slug', 'is', null)
    .not('city_slug', 'is', null)
    .not('category_slug', 'is', null);

  if (error) {
    console.error('[getBusinessesForState] Error:', error);
    return [];
  }

  return (data || []) as Array<{
    state_slug: string;
    city_slug: string;
    category_slug: string;
    slug: string;
  }>;
}

/**
 * Get total business count with optional filters.
 * Used for pagination and stats display.
 *
 * @param stateSlug - Optional state filter
 * @param citySlug - Optional city filter (requires stateSlug)
 * @param categorySlug - Optional category filter (requires stateSlug and citySlug)
 * @param filters - Optional ListingFilters (minRating, hasWebsite, hasPhone)
 * @returns Total count of businesses matching filters
 *
 * @example
 * const total = await getTotalBusinessCount(); // All businesses
 * const stateTotal = await getTotalBusinessCount('colorado'); // Colorado only
 * const cityTotal = await getTotalBusinessCount('colorado', 'denver'); // Denver only
 * const categoryTotal = await getTotalBusinessCount('colorado', 'denver', 'masonry-contractor');
 * const filteredTotal = await getTotalBusinessCount('colorado', 'denver', 'masonry-contractor', { minRating: 4 });
 */
export async function getTotalBusinessCount(
  stateSlug?: string,
  citySlug?: string,
  categorySlug?: string,
  filters?: ListingFilters
): Promise<number> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('directory_places')
    .select('*', { count: 'exact', head: true });

  if (stateSlug) {
    query = query.eq('state_slug', stateSlug);
  }
  if (citySlug) {
    query = query.eq('city_slug', citySlug);
  }
  if (categorySlug) {
    query = query.eq('category_slug', categorySlug);
  }

  // Apply listing filters
  if (filters) {
    if (filters.minRating !== undefined) {
      query = query.gte('rating', filters.minRating);
    }
    if (filters.hasWebsite) {
      query = query.not('website', 'is', null);
    }
    if (filters.hasPhone) {
      query = query.not('phone_number', 'is', null);
    }
  }

  const { count, error } = await query;

  if (error) {
    console.error('[getTotalBusinessCount] Error:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Search across cities and businesses for autocomplete suggestions.
 * Returns limited results (5 cities, 5 businesses) for dropdown display.
 *
 * @param query - Search query string
 * @returns Object with matching cities and businesses
 *
 * @example
 * const results = await searchDirectory('denver');
 * // Returns: { cities: [...], businesses: [...] }
 */
export async function searchDirectory(query: string): Promise<{
  cities: CityStats[];
  businesses: DirectoryPlace[];
}> {
  const supabase = createAdminClient();

  // Search cities (ILIKE for case-insensitive partial match)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cityData, error: cityError } = await (supabase as any)
    .from('directory_places')
    .select('city, city_slug, province_state, state_slug, rating')
    .ilike('city_slug', `%${query}%`)
    .not('city_slug', 'is', null)
    .limit(100); // Get more to aggregate

  if (cityError) {
    console.error('[searchDirectory] City search error:', cityError);
  }

  // Aggregate city results
  const cityMap = new Map<string, {
    city_slug: string;
    city_name: string;
    state_slug: string;
    state_name: string;
    business_count: number;
    category_count: number;
    ratings: number[];
  }>();

  type CityRow = {
    city: string[];
    city_slug: string;
    province_state: string;
    state_slug: string;
    rating: number | null;
  };

  (cityData || []).forEach((place: CityRow) => {
    if (!place.city_slug) return;

    const cityName = Array.isArray(place.city) && place.city.length > 0
      ? (place.city[0] ?? place.city_slug)
      : place.city_slug;

    const existing = cityMap.get(place.city_slug);
    if (existing) {
      existing.business_count++;
      if (place.rating !== null) existing.ratings.push(place.rating);
    } else {
      cityMap.set(place.city_slug, {
        city_slug: place.city_slug,
        city_name: cityName,
        state_slug: place.state_slug,
        state_name: place.province_state,
        business_count: 1,
        category_count: 0, // Not tracking for search
        ratings: place.rating !== null ? [place.rating] : [],
      });
    }
  });

  const cities: CityStats[] = Array.from(cityMap.values())
    .map((city) => ({
      state_slug: city.state_slug,
      city_slug: city.city_slug,
      city_name: city.city_name,
      state_name: city.state_name,
      business_count: city.business_count,
      category_count: city.category_count,
      avg_rating: city.ratings.length > 0
        ? city.ratings.reduce((sum, r) => sum + r, 0) / city.ratings.length
        : null,
    }))
    .sort((a, b) => b.business_count - a.business_count)
    .slice(0, 5); // Limit to 5 cities

  // Search businesses (ILIKE for case-insensitive partial match)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: businessData, error: businessError } = await (supabase as any)
    .from('directory_places')
    .select('*')
    .ilike('title', `%${query}%`)
    .order('rating', { ascending: false, nullsFirst: false })
    .order('rating_count', { ascending: false, nullsFirst: false })
    .limit(5);

  if (businessError) {
    console.error('[searchDirectory] Business search error:', businessError);
  }

  const businesses = (businessData || []) as DirectoryPlace[];

  return {
    cities,
    businesses,
  };
}

/**
 * Extended DirectoryPlace with calculated distance.
 */
export type DirectoryPlaceWithDistance = DirectoryPlace & {
  distance_miles: number;
};

/**
 * Get nearby businesses using Haversine formula for distance calculation.
 * Returns businesses within a radius, sorted by distance.
 *
 * Uses SQL-based Haversine formula:
 * distance = 3959 * acos(cos(radians(lat1)) * cos(radians(lat2)) *
 *            cos(radians(lon2) - radians(lon1)) +
 *            sin(radians(lat1)) * sin(radians(lat2)))
 *
 * @param latitude - Center point latitude
 * @param longitude - Center point longitude
 * @param excludeSlug - Business slug to exclude from results (current business)
 * @param radiusMiles - Search radius in miles (default: 25)
 * @param limit - Maximum number of results (default: 6)
 * @returns Array of businesses with distance, sorted by distance
 *
 * @example
 * const nearby = await getNearbyBusinesses(39.7392, -104.9903, 'acme-masonry', 25, 6);
 * // Returns: [
 * //   { ...businessData, distance_miles: 2.3 },
 * //   { ...businessData, distance_miles: 5.1 },
 * //   ...
 * // ]
 */
export async function getNearbyBusinesses(
  latitude: number,
  longitude: number,
  excludeSlug: string,
  radiusMiles: number = 25,
  limit: number = 6
): Promise<DirectoryPlaceWithDistance[]> {
  const supabase = createAdminClient();

  // Use Haversine formula to calculate distance in SQL
  // Earth radius in miles: 3959
  const query = `
    SELECT *,
      (3959 * acos(
        cos(radians($1)) * cos(radians(latitude)) *
        cos(radians(longitude) - radians($2)) +
        sin(radians($1)) * sin(radians(latitude))
      )) AS distance_miles
    FROM directory_places
    WHERE latitude IS NOT NULL
      AND longitude IS NOT NULL
      AND slug != $3
      AND (3959 * acos(
        cos(radians($1)) * cos(radians(latitude)) *
        cos(radians(longitude) - radians($2)) +
        sin(radians($1)) * sin(radians(latitude))
      )) < $4
    ORDER BY distance_miles ASC
    LIMIT $5
  `;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .rpc('exec_sql', {
      query,
      params: [latitude, longitude, excludeSlug, radiusMiles, limit],
    });

  if (error) {
    // If RPC doesn't work, fall back to fetching all and filtering in JS
    console.warn('[getNearbyBusinesses] RPC query failed, using fallback:', error);
    return getNearbyBusinessesFallback(latitude, longitude, excludeSlug, radiusMiles, limit);
  }

  return (data || []) as DirectoryPlaceWithDistance[];
}

/**
 * Fallback implementation for getNearbyBusinesses.
 * Fetches all businesses and calculates distance in JavaScript.
 * Used when SQL RPC is not available.
 *
 * @private
 */
async function getNearbyBusinessesFallback(
  latitude: number,
  longitude: number,
  excludeSlug: string,
  radiusMiles: number,
  limit: number
): Promise<DirectoryPlaceWithDistance[]> {
  const supabase = createAdminClient();

  // Fetch all businesses with coordinates
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('directory_places')
    .select('*')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .neq('slug', excludeSlug);

  if (error) {
    console.error('[getNearbyBusinessesFallback] Error:', error);
    return [];
  }

  const places = (data || []) as DirectoryPlace[];

  // Calculate distance for each business using Haversine formula
  const placesWithDistance = places.map((place) => {
    const distance = haversineDistance(
      latitude,
      longitude,
      place.latitude!,
      place.longitude!
    );

    return {
      ...place,
      distance_miles: distance,
    };
  });

  // Filter by radius and sort by distance
  return placesWithDistance
    .filter((place) => place.distance_miles < radiusMiles)
    .sort((a, b) => a.distance_miles - b.distance_miles)
    .slice(0, limit);
}

/**
 * Calculate distance between two points using Haversine formula.
 * Returns distance in miles.
 *
 * @param lat1 - Latitude of point 1
 * @param lon1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lon2 - Longitude of point 2
 * @returns Distance in miles
 *
 * @private
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians.
 * @private
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
