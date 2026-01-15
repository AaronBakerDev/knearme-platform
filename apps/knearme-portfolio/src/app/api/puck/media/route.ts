/**
 * Puck Media API - Fetch Payload Media for Visual Editor
 *
 * Provides search and list functionality for the Puck editor's
 * external field type to select images from the Payload Media library.
 *
 * Endpoints:
 * - GET /api/puck/media - List/search media items
 *
 * Query Parameters:
 * - query: Search term (searches alt text, filename, caption)
 * - folder: Filter by folder
 * - limit: Number of results (default: 50, max: 100)
 * - page: Page number (default: 1)
 *
 * @see PUCK-010 in PRD for acceptance criteria
 * @see src/payload/collections/Media.ts for Media collection structure
 */

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload/payload.config'
import type { Where } from 'payload'

/**
 * Media item type from Payload (subset of fields we need)
 * Full type includes auto-generated fields: id, filename, mimeType, filesize, url, sizes
 */
interface PayloadMediaItem {
  id: string
  filename: string
  alt: string
  caption?: string
  folder?: string
  url: string
  width?: number
  height?: number
  mimeType: string
  filesize: number
  sizes?: {
    thumbnail?: { url: string; width: number; height: number }
    card?: { url: string; width: number; height: number }
    featured?: { url: string; width: number; height: number }
  }
}

/**
 * Response format for Puck external field's fetchList
 * These fields are displayed in the selection modal table
 */
interface MediaListItem {
  id: string
  title: string
  description: string
  url: string
  alt: string
  width?: number
  height?: number
  thumbnailUrl?: string
}

const rateLimitMap = new Map<string, { count: number; timestamp: number }>()
const RATE_LIMIT = 60 // requests per minute
const WINDOW_MS = 60_000 // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now - record.timestamp > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, timestamp: now })
    return true
  }

  if (record.count >= RATE_LIMIT) {
    return false
  }

  record.count += 1
  return true
}

/**
 * GET /api/puck/media
 *
 * Retrieve media items for the Puck editor's external field selector.
 * Media is publicly readable (no auth required for read).
 *
 * Query params:
 * - query: Search term (optional)
 * - folder: Filter by folder (optional)
 * - limit: Max results (optional, default 50)
 * - page: Page number (optional, default 1)
 *
 * Returns:
 * - 200: Array of media items formatted for Puck external field
 * - 500: Server error
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const headersList = headers()
    const forwardedFor = headersList.get('x-forwarded-for')
    const ip = forwardedFor?.split(',')[0]?.trim() || headersList.get('x-real-ip') || 'unknown'

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || ''
    const folder = searchParams.get('folder') || ''
    const limitParam = searchParams.get('limit')
    const parsedLimit = limitParam ? parseInt(limitParam, 10) : 50
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, 100)
      : 50
    const pageParam = searchParams.get('page')
    const parsedPage = pageParam ? parseInt(pageParam, 10) : 1
    const page = Number.isFinite(parsedPage) && parsedPage > 0
      ? parsedPage
      : 1

    const payload = await getPayload({ config })

    // Build where clause for filtering
    const whereConditions: Where = {}

    // Search across alt, filename, and caption if query provided
    if (query) {
      whereConditions.or = [
        { alt: { contains: query } },
        { filename: { contains: query } },
        { caption: { contains: query } },
      ]
    }

    // Filter by folder if provided
    if (folder) {
      whereConditions.folder = { equals: folder }
    }

    // Only fetch images (not PDFs or other files)
    whereConditions.mimeType = { contains: 'image' }

    // Query the media collection
    // Using type assertion due to Payload TypeScript quirks with generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { docs } = await (payload as any).find({
      collection: 'media',
      where: Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
      limit,
      page,
      sort: '-createdAt', // Most recent first
    })

    // Transform to format expected by Puck external field
    const mediaItems: MediaListItem[] = (docs as PayloadMediaItem[]).map((item) => ({
      id: item.id,
      title: item.alt || item.filename,
      description: item.caption || `${item.width || '?'}x${item.height || '?'} - ${formatFileSize(item.filesize)}`,
      url: item.url,
      alt: item.alt,
      width: item.width,
      height: item.height,
      thumbnailUrl: item.sizes?.thumbnail?.url || item.url,
    }))

    return NextResponse.json(mediaItems)
  } catch (error) {
    console.error('[GET /api/puck/media] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    )
  }
}

/**
 * Format file size for display
 * @param bytes - File size in bytes
 * @returns Human-readable file size string
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
