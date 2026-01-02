import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export type AuthStatus = {
  isAuthenticated: boolean;
  hasCompleteProfile: boolean;
};

export type AuthCta = {
  href: string;
  label: string;
};

export const getAuthStatus = cache(async (): Promise<AuthStatus> => {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { isAuthenticated: false, hasCompleteProfile: false };
  }

  // Type assertion needed due to RLS type inference issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: contractor, error: contractorError } = await (supabase as any)
    .from('contractors')
    .select('business_name, city, services')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (contractorError) {
    console.error('[getAuthStatus] Failed to load contractor profile:', contractorError);
  }

  const profile = contractor as { business_name?: string; city?: string; services?: string[] } | null;
  const hasCompleteProfile = Boolean(
    profile?.business_name && profile?.city && profile?.services?.length
  );

  return { isAuthenticated: true, hasCompleteProfile };
});

export function getAuthCta(authStatus: AuthStatus): AuthCta | null {
  if (!authStatus.isAuthenticated) {
    return null;
  }

  if (!authStatus.hasCompleteProfile) {
    return { href: '/profile/setup', label: 'Finish Profile' };
  }

  return { href: '/dashboard', label: 'Go to Dashboard' };
}
