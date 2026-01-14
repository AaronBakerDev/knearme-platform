/**
 * Marketing Header - CMS-Driven Navigation
 *
 * Server component that fetches navigation from Payload CMS and renders
 * the full marketing header with nav links, dropdowns, and CTA button.
 *
 * Used on: Landing page, Blog, Learn, Services, Tools, About, Contact
 *
 * @see /src/payload/globals/Navigation.ts for CMS schema
 * @see /src/lib/payload/client.ts for getMarketingNav()
 */
import { getMarketingNav, type MarketingNavigation } from '@/lib/payload/client'
import { getAuthStatus } from '@/lib/auth/auth-status'
import { MarketingHeaderClient } from './MarketingHeaderClient'

/**
 * Default navigation links when CMS is not configured.
 * These mirror the current SiteHeader structure.
 */
const DEFAULT_NAV: MarketingNavigation = {
  headerLinks: [
    { label: 'Services', href: '/services' },
    { label: 'Browse Projects', href: '/denver-co/masonry' },
    { label: 'Tools', href: '/tools' },
    { label: 'Learn', href: '/learn' },
    { label: 'About', href: '/about' },
  ],
  headerCta: {
    label: 'Get Started',
    href: '/signup',
    variant: 'default',
  },
  footerColumns: [],
  footerLegal: [],
}

/**
 * Server component wrapper for marketing header.
 * Fetches CMS navigation and auth status, passes to client component.
 */
export async function MarketingHeader() {
  // Fetch navigation from CMS (falls back to defaults internally)
  const cmsNav = await getMarketingNav()

  // Merge with defaults - CMS data takes precedence if present
  const navigation: MarketingNavigation = {
    headerLinks: cmsNav.headerLinks.length > 0 ? cmsNav.headerLinks : DEFAULT_NAV.headerLinks,
    headerCta: {
      label: cmsNav.headerCta.label || DEFAULT_NAV.headerCta.label,
      href: cmsNav.headerCta.href || DEFAULT_NAV.headerCta.href,
      variant: cmsNav.headerCta.variant || DEFAULT_NAV.headerCta.variant,
    },
    footerColumns: cmsNav.footerColumns,
    footerLegal: cmsNav.footerLegal,
  }

  // Get auth status for conditional rendering
  const authStatus = await getAuthStatus()

  return (
    <MarketingHeaderClient
      navigation={navigation}
      isAuthenticated={authStatus.isAuthenticated}
      hasCompleteProfile={authStatus.hasCompleteProfile}
    />
  )
}
