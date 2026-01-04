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
  const { data: business, error: businessError } = await (supabase as any)
    .from('businesses')
    .select('name, city, state, services, address, phone')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (businessError) {
    console.error('[getAuthStatus] Failed to load business profile:', businessError);
  }

  const profile = business as {
    name?: string;
    city?: string;
    state?: string;
    services?: string[];
    address?: string;
    phone?: string;
  } | null;
  const hasCompleteProfile = Boolean(
    profile?.name &&
      profile?.city &&
      profile?.state &&
      profile?.services?.length &&
      profile?.address &&
      profile?.phone
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
