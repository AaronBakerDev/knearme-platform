/**
 * Puck Pages List API - List All Visual Pages
 *
 * Provides a paginated list endpoint for discovering Puck pages.
 * Useful for AI agents to discover existing pages before editing.
 *
 * Endpoints:
 * - GET /api/puck - List all pages with pagination and filtering
 *
 * @see PUCK-036 in PRD for acceptance criteria
 * @see docs/api/puck-pages.md for API documentation
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload/payload.config'

/**
 * Response type for the list endpoint
 * Mirrors Payload's paginated response structure
 */
interface ListPageResponse {
  id: string
  slug: string
  title: string
  status: 'draft' | 'published'
  updatedAt: string
  createdAt: string
}

interface PaginatedResponse {
  docs: ListPageResponse[]
  totalDocs: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  limit: number
}

/**
 * GET /api/puck
 *
 * List all Puck pages with pagination and optional status filtering.
 * Requires Payload authentication.
 *
 * Query Parameters:
 * - status (optional): Filter by 'draft' or 'published'
 * - page (optional): Page number (default: 1)
 * - limit (optional): Results per page (default: 10, max: 100)
 *
 * Returns:
 * - 200: Paginated list of pages
 * - 401: Not authenticated
 * - 500: Server error
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Initialize Payload and check authentication
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await headers() })

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')

    // Validate and parse pagination params
    const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(limitParam || '10', 10) || 10))

    // Build where clause for status filtering
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {}

    if (statusFilter === 'draft' || statusFilter === 'published') {
      where.status = { equals: statusFilter }
    }

    // Query the puck-pages collection with pagination
    // Using type assertion due to Payload TypeScript quirks with generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (payload as any).find({
      collection: 'puck-pages',
      where,
      page,
      limit,
      sort: '-updatedAt', // Most recently updated first
      // Only select fields needed for list view (excludes large puckData field)
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        updatedAt: true,
        createdAt: true,
      },
    })

    // Transform response to match documented API shape
    const response: PaginatedResponse = {
      docs: result.docs.map((doc: ListPageResponse) => ({
        id: doc.id,
        slug: doc.slug,
        title: doc.title,
        status: doc.status,
        updatedAt: doc.updatedAt,
        createdAt: doc.createdAt,
      })),
      totalDocs: result.totalDocs,
      page: result.page,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
      limit: result.limit,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[GET /api/puck] Error:', error)
    return NextResponse.json(
      { error: 'Failed to list pages' },
      { status: 500 }
    )
  }
}
