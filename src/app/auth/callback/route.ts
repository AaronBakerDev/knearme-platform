import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Auth callback handler for Supabase OAuth and email verification.
 * Exchanges the auth code for a session, creates contractor record for new OAuth users,
 * and redirects appropriately.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user has completed profile setup
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: contractorData } = await supabase
          .from('contractors')
          .select('business_name, city, services')
          .eq('auth_user_id', user.id)
          .single();

        const contractor = contractorData as { business_name: string | null; city: string | null; services: string[] | null } | null;

        // For new OAuth users, create a contractor record if one doesn't exist
        if (!contractor) {
          const adminClient = createAdminClient();
          await adminClient
            .from('contractors')
            .insert({
              auth_user_id: user.id,
              email: user.email,
              // Leave other fields null - user will complete in profile setup
            });

          // New user, redirect to profile setup
          return NextResponse.redirect(`${origin}/profile/setup`);
        }

        // If profile incomplete, redirect to setup
        if (!contractor.business_name || !contractor.city || !contractor.services?.length) {
          return NextResponse.redirect(`${origin}/profile/setup`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
