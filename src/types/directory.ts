/**
 * TypeScript types for the directory feature.
 *
 * The directory feature provides public browsing of businesses extracted from Google Maps data.
 * Data is organized hierarchically: State → City → Category → Business
 *
 * @see /docs/11-seo-discovery/ for directory architecture documentation
 * @see /src/lib/data/directory.ts for data layer implementation
 */

/**
 * Individual business listing from the directory.
 * Sourced from Google Maps data scraped and stored in the `directory_places` table.
 */
export interface DirectoryPlace {
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

/**
 * State-level statistics for directory pages.
 * Used on: /directory and /directory/[state] pages
 */
export interface StateStats {
  state_slug: string;
  state_name: string;
  business_count: number;
  city_count: number;
  avg_rating: number | null;
}

/**
 * City-level statistics for directory pages.
 * Used on: /directory/[state] and /directory/[state]/[city] pages
 */
export interface CityStats {
  state_slug: string;
  city_slug: string;
  city_name: string;
  state_name: string;
  business_count: number;
  category_count: number;
  avg_rating: number | null;
}

/**
 * Category-level statistics for directory pages.
 * Used on: /directory/[state]/[city] to show category breakdown
 */
export interface CategoryStats {
  category_slug: string;
  category_name: string;
  business_count: number;
  avg_rating: number | null;
}
