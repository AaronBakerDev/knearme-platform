/**
 * Puck Pages API - CRUD Operations for Visual Page Data
 *
 * Provides full CRUD operations for Puck editor page data.
 * All operations require Payload authentication.
 *
 * Endpoints:
 * - GET /api/puck/[slug] - Get page data by slug (authenticated only)
 * - POST /api/puck/[slug] - Create or update page data (authenticated only)
 * - DELETE /api/puck/[slug] - Delete page by slug (authenticated only)
 *
 * @see PUCK-006 in PRD for GET/POST acceptance criteria
 * @see PUCK-037 in PRD for DELETE acceptance criteria
 * @see src/types/puck.ts for Zod validation schemas
 */

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload/payload.config'
import { z } from 'zod'
import { puckPageDataSchema } from '@/types/puck'

/**
 * Request body schema for POST requests
 * Validates the incoming page data before saving
 */
const SavePageSchema = z.object({
  puckData: puckPageDataSchema,
  title: z.string().min(1, 'Title is required'),
  status: z.enum(['draft', 'published']).optional().default('draft'),
})

type RouteContext = {
  params: Promise<{ slug: string }>
}

/**
 * GET /api/puck/[slug]
 *
 * Retrieve page data by slug for the Puck editor.
 * Requires Payload authentication.
 *
 * Returns:
 * - 200: Page data found { id, slug, title, puckData, status }
 * - 401: Not authenticated
 * - 404: Page not found
 * - 500: Server error
 */
export async function GET(
  request: Request,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { slug } = await context.params

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      )
    }

    // Initialize Payload and check authentication
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await headers() })

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Query the puck-pages collection by slug
    // Using type assertion due to Payload TypeScript quirks with generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { docs } = await (payload as any).find({
      collection: 'puck-pages',
      where: {
        slug: { equals: slug },
      },
      limit: 1,
    })

    if (!docs || docs.length === 0) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    const page = docs[0]

    return NextResponse.json({
      id: page.id,
      slug: page.slug,
      title: page.title,
      puckData: page.puckData,
      status: page.status,
      updatedAt: page.updatedAt,
    })
  } catch (error) {
    console.error('[GET /api/puck/[slug]] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch page' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/puck/[slug]
 *
 * Create or update page data from the Puck editor.
 * Requires Payload authentication.
 * Validates puckData against the Zod schema before saving.
 *
 * Request body:
 * - puckData: Puck editor data structure (validated)
 * - title: Page title
 * - status: 'draft' | 'published' (optional, defaults to 'draft')
 *
 * Returns:
 * - 200: Page updated successfully
 * - 201: Page created successfully
 * - 400: Validation error
 * - 401: Not authenticated
 * - 500: Server error
 */
export async function POST(
  request: Request,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { slug } = await context.params

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      )
    }

    // Initialize Payload and check authentication
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await headers() })

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = SavePageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten(),
        },
        { status: 400 }
      )
    }

    const { puckData, title, status } = validation.data

    // Check if page already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { docs: existingDocs } = await (payload as any).find({
      collection: 'puck-pages',
      where: {
        slug: { equals: slug },
      },
      limit: 1,
    })

    if (existingDocs && existingDocs.length > 0) {
      // Update existing page
      const existingPage = existingDocs[0]

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedPage = await (payload as any).update({
        collection: 'puck-pages',
        id: existingPage.id,
        data: {
          puckData,
          title,
          status,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Page updated successfully',
        id: updatedPage.id,
        slug: updatedPage.slug,
        status: updatedPage.status,
      })
    } else {
      // Create new page
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newPage = await (payload as any).create({
        collection: 'puck-pages',
        data: {
          slug,
          title,
          puckData,
          status,
        },
      })

      return NextResponse.json(
        {
          success: true,
          message: 'Page created successfully',
          id: newPage.id,
          slug: newPage.slug,
          status: newPage.status,
        },
        { status: 201 }
      )
    }
  } catch (error) {
    console.error('[POST /api/puck/[slug]] Error:', error)
    return NextResponse.json(
      { error: 'Failed to save page' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/puck/[slug]
 *
 * Delete a page by slug.
 * Requires Payload authentication.
 * Triggers ISR revalidation to remove the page from public routes.
 *
 * Returns:
 * - 200: Page deleted successfully
 * - 401: Not authenticated
 * - 404: Page not found
 * - 500: Server error
 *
 * @see PUCK-037 in PRD for acceptance criteria
 * @see src/payload/hooks/revalidate.ts for revalidation patterns
 */
export async function DELETE(
  request: Request,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { slug } = await context.params

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      )
    }

    // Initialize Payload and check authentication
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await headers() })

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Find the page by slug
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { docs } = await (payload as any).find({
      collection: 'puck-pages',
      where: {
        slug: { equals: slug },
      },
      limit: 1,
    })

    if (!docs || docs.length === 0) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    const page = docs[0]

    // Delete the page
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (payload as any).delete({
      collection: 'puck-pages',
      id: page.id,
    })

    // Trigger ISR revalidation for the deleted page's public URL
    // This ensures the page returns 404 immediately on the public route
    // Fire and forget - don't block the response
    triggerPageRevalidation(slug).catch((error) => {
      console.error('[DELETE /api/puck/[slug]] Revalidation error:', error)
    })

    return NextResponse.json({
      success: true,
      message: 'Page deleted successfully',
      slug,
    })
  } catch (error) {
    console.error('[DELETE /api/puck/[slug]] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete page' },
      { status: 500 }
    )
  }
}

/**
 * Trigger ISR revalidation for a Puck page.
 * Revalidates both the page URL and sitemap.
 *
 * @param slug - The page slug to revalidate
 */
async function triggerPageRevalidation(slug: string): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const secret = process.env.REVALIDATION_SECRET || process.env.PAYLOAD_SECRET || ''

  if (!secret) {
    console.warn('[DELETE /api/puck/[slug]] No revalidation secret configured, skipping')
    return
  }

  // Paths to revalidate: the page URL and sitemap
  // @see src/payload/hooks/revalidate.ts revalidatePaths.puckPage for the same paths
  const paths = [`/p/${slug}`, '/sitemap-main.xml']

  const revalidationPromises = paths.map(async (path) => {
    try {
      const response = await fetch(`${siteUrl}/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, secret, type: 'puck-page-delete' }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error(`[DELETE /api/puck/[slug]] Failed to revalidate ${path}:`, error)
      } else {
        console.log(`[DELETE /api/puck/[slug]] Successfully revalidated: ${path}`)
      }
    } catch (error) {
      console.warn(`[DELETE /api/puck/[slug]] Could not reach revalidation endpoint for ${path}:`, error)
    }
  })

  await Promise.all(revalidationPromises)
}
