/**
 * GET /api/directory/categories
 *
 * Returns category statistics for a given city.
 * Used by RelatedCategories component to show business counts.
 *
 * Query params:
 * - state: State slug (required)
 * - city: City slug (required)
 *
 * @example
 * GET /api/directory/categories?state=colorado&city=denver
 *
 * Response:
 * [
 *   { category_slug: 'masonry-contractor', category_name: 'Masonry Contractor', business_count: 25, avg_rating: 4.5 },
 *   ...
 * ]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCategoriesForCity } from '@/lib/data/directory';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const stateSlug = searchParams.get('state');
    const citySlug = searchParams.get('city');

    if (!stateSlug || !citySlug) {
      return NextResponse.json(
        { error: 'Missing required parameters: state and city' },
        { status: 400 }
      );
    }

    const categories = await getCategoriesForCity(stateSlug, citySlug);

    return NextResponse.json(categories);
  } catch (error) {
    console.error('[GET /api/directory/categories] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category statistics' },
      { status: 500 }
    );
  }
}
