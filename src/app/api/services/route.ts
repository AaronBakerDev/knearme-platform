/**
 * Services API — Public endpoint for service catalog data.
 *
 * GET /api/services
 *   Returns all published services for use in forms and UI.
 *
 * Query params:
 *   - trade: Filter by trade (e.g., 'masonry')
 *
 * @see src/lib/services/catalog.ts
 */

import { NextResponse } from 'next/server';
import { getServiceCatalog, getServicesByTrade } from '@/lib/services';
import { logger } from '@/lib/logging';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trade = searchParams.get('trade');

    const services = trade
      ? await getServicesByTrade(trade)
      : await getServiceCatalog();

    // Return simplified shape for forms
    const options = services.map((s) => ({
      id: s.serviceId,
      label: s.label,
      icon: s.iconEmoji,
      shortDescription: s.shortDescription,
    }));

    return NextResponse.json({ services: options });
  } catch (error) {
    logger.error('[GET /api/services] Error', { error });
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

// Cache for 1 hour (services rarely change)
export const revalidate = 3600;
