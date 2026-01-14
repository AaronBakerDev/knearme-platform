import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Signs out the current user and redirects to login.
 */
export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
}
