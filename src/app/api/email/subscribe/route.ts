/**
 * Email Subscription API Route
 *
 * Handles email subscriptions via Loops.so for lead capture.
 * Used by EmailCaptureDialog and other email collection forms.
 *
 * POST /api/email/subscribe
 * Body: { email: string, source?: string, firstName?: string, ... }
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { subscribeEmail, LoopsApiError } from '@/lib/email/loops'

/**
 * Request validation schema
 */
const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
  source: z.string().optional().default('Website'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  /** Tool name if subscribing via tool PDF download */
  toolName: z.string().optional(),
  /** Any additional custom properties */
  properties: z.record(z.string(), z.unknown()).optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = subscribeSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { email, source, firstName, lastName, toolName, properties } =
      validationResult.data

    // Build the source string (e.g., "PDF Download - SEO Analyzer")
    const finalSource = toolName ? `${source} - ${toolName}` : source

    // Subscribe the email via Loops
    const result = await subscribeEmail(email, finalSource, {
      firstName,
      lastName,
      ...properties,
    })

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed',
      contactId: result.id,
    })
  } catch (error) {
    console.error('Email subscription error:', error)

    // Handle Loops API errors
    if (error instanceof LoopsApiError) {
      // 409 means contact already exists - that's okay, treat as success
      if (error.statusCode === 409) {
        return NextResponse.json({
          success: true,
          message: 'Already subscribed',
        })
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: error.statusCode }
      )
    }

    // Handle missing API key
    if (
      error instanceof Error &&
      error.message.includes('LOOPS_API_KEY')
    ) {
      console.error('LOOPS_API_KEY not configured')
      return NextResponse.json(
        {
          success: false,
          error: 'Email service not configured',
        },
        { status: 503 }
      )
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to subscribe',
      },
      { status: 500 }
    )
  }
}
