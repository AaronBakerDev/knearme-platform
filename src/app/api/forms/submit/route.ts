/**
 * Form Submission API Route
 *
 * Handles dynamic form submissions from DynamicForm component.
 * Validates the form exists, stores submission in FormSubmissions collection,
 * and optionally sends email notifications.
 *
 * @see PAY-055 in PRD for acceptance criteria
 * @see src/payload/collections/FormSubmissions.ts
 */

import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload/payload.config'
import { z } from 'zod'
import { headers } from 'next/headers'

/**
 * Request body schema
 */
const SubmissionSchema = z.object({
  formId: z.string().min(1, 'Form ID is required'),
  formSlug: z.string().min(1, 'Form slug is required'),
  data: z.record(z.string(), z.unknown()),
  pageUrl: z.string().optional(),
})

/**
 * POST /api/forms/submit
 *
 * Submit a form response to the FormSubmissions collection.
 */
export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validation = SubmissionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { formId, formSlug, data, pageUrl } = validation.data

    // Initialize Payload
    const payload = await getPayload({ config })

    // Verify the form exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { docs: forms } = await (payload as any).find({
      collection: 'forms',
      where: {
        id: { equals: formId },
        slug: { equals: formSlug },
      },
      limit: 1,
    })

    if (!forms || forms.length === 0) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    const form = forms[0]

    // Get request metadata for tracking
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || undefined
    const forwardedFor = headersList.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0]?.trim() : undefined

    // Create submission record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const submission = await (payload as any).create({
      collection: 'form-submissions',
      data: {
        form: form.id,
        submissionData: data,
        submittedAt: new Date().toISOString(),
        pageUrl,
        userAgent,
        ipAddress,
      },
    })

    // TODO: Send email notification if configured
    // This could be implemented with a webhook, email service, or Payload email adapter
    // if (form.emailNotification?.enabled && form.emailNotification?.to) {
    //   await sendEmailNotification(form, data)
    // }

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      message: form.successMessage || 'Form submitted successfully',
    })
  } catch (error) {
    console.error('Form submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit form' },
      { status: 500 }
    )
  }
}
