/**
 * Directory Search API Route
 *
 * GET /api/directory/search?q={query}
 *
 * Searches across directory_places (business names) and city names.
 * Returns limited results for autocomplete suggestions.
 *
 * Query Parameters:
 * - q: Search query string (required, min 2 characters)
 *
 * Response:
 * {
 *   cities: CityStats[],      // Up to 5 matching cities
 *   businesses: DirectoryPlace[]  // Up to 5 matching businesses
 * }
 *
 * @see /src/components/directory/DirectorySearch.tsx for client component
 * @see /src/lib/data/directory.ts for searchDirectory function
 */

import { NextResponse } from 'next/server';
import { searchDirectory } from '@/lib/data/directory';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    // Validate query parameter
    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        cities: [],
        businesses: [],
      });
    }

    // Perform search
    const results = await searchDirectory(query.trim());

    return NextResponse.json(results);
  } catch (error) {
    console.error('[Directory Search API] Error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
