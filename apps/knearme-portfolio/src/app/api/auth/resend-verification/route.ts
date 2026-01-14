import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { logger } from '@/lib/logging';

/**
 * Resend verification email to unverified accounts.
 *
 * @see src/app/(auth)/login/page.tsx - Used when login fails with unverified email
 * @see src/app/(auth)/signup/page.tsx - Used on signup success screen
 */

const requestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = requestSchema.parse(body);

    const supabase = await createClient();

    // Use Supabase's resend method
    // This will send a new verification email if the user exists and is unverified
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      // Don't expose whether the email exists for security
      // Return success even if email doesn't exist or is already verified
      logger.error('Resend verification error', { error: error.message });

      // Only return error for rate limiting
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a few minutes and try again.' },
          { status: 429 }
        );
      }
    }

    // Always return success to prevent email enumeration attacks
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email and is unverified, a verification email has been sent.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      );
    }

    logger.error('Resend verification error', { error });
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    );
  }
}
