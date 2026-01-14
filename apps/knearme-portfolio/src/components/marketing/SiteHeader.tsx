import { SiteHeaderClient } from "@/components/marketing/SiteHeaderClient";
import { getAuthStatus } from "@/lib/auth/auth-status";

/**
 * Server wrapper for the marketing header.
 *
 * Reads the Supabase session from cookies so the header can reflect
 * authenticated state on first render.
 */
export async function SiteHeader() {
  const authStatus = await getAuthStatus();

  return (
    <SiteHeaderClient
      isAuthenticated={authStatus.isAuthenticated}
      hasCompleteProfile={authStatus.hasCompleteProfile}
    />
  );
}
