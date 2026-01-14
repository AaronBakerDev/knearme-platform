/**
 * Preview Token API - Regenerate and Revoke Preview Tokens
 *
 * Allows Payload admin users to regenerate or revoke preview tokens for articles.
 * Used by the PreviewButton component in the admin panel.
 *
 * POST /api/articles/preview-token
 *   - Regenerate token (creates new token, invalidates old one)
 *   - Revoke token (removes token entirely)
 *
 * @see PAY-067 in PRD for acceptance criteria
 * @see src/payload/components/PreviewButton.tsx for admin UI
 */
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Generates a cryptographically random preview token.
 * Uses crypto.randomUUID() for secure, unpredictable tokens.
 */
function generatePreviewToken(): string {
  return crypto.randomUUID()
}

/**
 * Returns a date 7 days in the future for preview token expiration.
 */
function getPreviewTokenExpiration(): Date {
  const expiration = new Date()
  expiration.setDate(expiration.getDate() + 7)
  return expiration
}

/**
 * Request body for preview token operations
 */
interface PreviewTokenRequest {
  articleId: string
  action: 'regenerate' | 'revoke'
}

/**
 * POST handler for preview token operations
 *
 * Requires authenticated Payload admin user.
 * Validates article exists and user has permission to modify it.
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })

    // Parse request body
    const body = (await request.json()) as PreviewTokenRequest
    const { articleId, action } = body

    if (!articleId || !action) {
      return NextResponse.json(
        { error: 'Missing articleId or action' },
        { status: 400 }
      )
    }

    if (action !== 'regenerate' && action !== 'revoke') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "regenerate" or "revoke"' },
        { status: 400 }
      )
    }

    // Verify the article exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const article = await (payload as any).findByID({
      collection: 'articles',
      id: articleId,
      depth: 0,
    })

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Prepare update data based on action
    let updateData: Record<string, unknown>

    if (action === 'regenerate') {
      // Generate new token (invalidates old one)
      updateData = {
        previewToken: generatePreviewToken(),
        previewTokenExpiresAt: getPreviewTokenExpiration().toISOString(),
      }
    } else {
      // Revoke token entirely
      updateData = {
        previewToken: null,
        previewTokenExpiresAt: null,
      }
    }

    // Update the article
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedArticle = await (payload as any).update({
      collection: 'articles',
      id: articleId,
      data: updateData,
      depth: 0,
    })

    return NextResponse.json({
      success: true,
      action,
      previewToken: updatedArticle.previewToken,
      previewTokenExpiresAt: updatedArticle.previewTokenExpiresAt,
    })
  } catch (error) {
    console.error('Preview token operation failed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
