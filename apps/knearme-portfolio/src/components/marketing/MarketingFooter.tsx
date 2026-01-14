/**
 * Marketing Footer - CMS-Driven Navigation
 *
 * Server component that fetches navigation from Payload CMS and renders
 * the full marketing footer with multi-column links and legal section.
 *
 * Falls back to hardcoded defaults when CMS is not configured,
 * ensuring the footer always renders correctly.
 *
 * Used on: Landing page, Blog, Learn, Services, Tools, About, Contact
 *
 * @see /src/payload/globals/Navigation.ts for CMS schema
 * @see /src/lib/payload/client.ts for getMarketingNav()
 */
import Link from 'next/link'
import { getMarketingNav, type MarketingNavigation, type MarketingFooterColumn, type LegalLink } from '@/lib/payload/client'
import { getAuthCta, getAuthStatus } from '@/lib/auth/auth-status'
import { LIVE_TOOLS } from '@/lib/tools/catalog'

/**
 * Default footer configuration when CMS is not configured.
 * Mirrors the structure of the original SiteFooter.
 */
const DEFAULT_FOOTER: Pick<MarketingNavigation, 'footerColumns' | 'footerLegal'> = {
  footerColumns: [
    {
      title: 'Services',
      links: [
        { label: 'Chimney Repair', href: '/services/chimney-repair' },
        { label: 'Foundation Repair', href: '/services/foundation-repair' },
        { label: 'Tuckpointing', href: '/services/tuckpointing' },
        { label: 'Brick Repair', href: '/services/brick-repair' },
        { label: 'Stone Masonry', href: '/services/stone-masonry' },
        { label: 'All Services', href: '/services' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Learning Center', href: '/blog' },
        { label: 'Browse Projects', href: '/denver-co/masonry' },
        { label: 'How It Works', href: '/#how-it-works' },
        { label: 'Portfolio Examples', href: '/examples' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Contact', href: '/contact' },
        { label: 'Pricing', href: '/pricing' },
      ],
    },
  ],
  footerLegal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
}

/**
 * Learning center links (hardcoded - not CMS managed)
 */
const LEARNING_CENTER_LINKS = [
  { href: '/blog', label: 'All Guides' },
  { href: '/blog/signs-chimney-needs-repair', label: 'Signs Chimney Needs Repair' },
  { href: '/blog/foundation-waterproofing', label: 'Foundation Waterproofing' },
  { href: '/blog/historic-brick-restoration', label: 'Historic Brick Restoration' },
  { href: '/blog/masonry-restoration-costs', label: 'Masonry Restoration Costs' },
]

const LEARNING_CATEGORIES = [
  { href: '/blog?category=chimney', label: 'Chimney' },
  { href: '/blog?category=waterproofing', label: 'Waterproofing' },
  { href: '/blog?category=costs', label: 'Cost Guides' },
  { href: '/blog?category=restoration', label: 'Historic Restoration' },
  { href: '/blog?category=maintenance', label: 'Maintenance' },
  { href: '/blog?category=hiring', label: 'Hiring' },
]

export async function MarketingFooter() {
  // Fetch navigation from CMS
  const cmsNav = await getMarketingNav()

  // Fetch auth state for CTA
  const authStatus = await getAuthStatus()
  const authCta = getAuthCta(authStatus)

  // Merge with defaults - CMS data takes precedence if present
  const footerColumns: MarketingFooterColumn[] =
    cmsNav.footerColumns.length > 0 ? cmsNav.footerColumns : DEFAULT_FOOTER.footerColumns
  const footerLegal: LegalLink[] =
    cmsNav.footerLegal.length > 0 ? cmsNav.footerLegal : DEFAULT_FOOTER.footerLegal

  return (
    <footer className="border-t bg-zinc-50 dark:bg-zinc-950">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-6 rounded-md bg-zinc-900 dark:bg-zinc-50 flex items-center justify-center text-white dark:text-black font-bold text-xs">
                K
              </div>
              <span className="text-lg font-bold">KnearMe</span>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground mb-4">
              The easiest way for masons and contractors to build a professional portfolio and rank
              on Google.
            </p>
            <p className="text-xs text-muted-foreground">
              Find masonry contractors in{' '}
              <Link href="/denver-co/masonry" className="hover:text-foreground">
                Denver
              </Link>
              ,{' '}
              <Link href="/lakewood-co/masonry" className="hover:text-foreground">
                Lakewood
              </Link>
              ,{' '}
              <Link href="/aurora-co/masonry" className="hover:text-foreground">
                Aurora
              </Link>
              , and more cities.
            </p>
          </div>

          {/* Dynamic CMS Columns */}
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-foreground">{column.title}</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="hover:text-foreground"
                      target={link.newTab ? '_blank' : undefined}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Learning Center Column (hardcoded) */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Learning Center</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {LEARNING_CENTER_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-4">
              <p className="text-xs font-semibold text-foreground mb-2">Article Categories</p>
              <div className="flex flex-wrap gap-2">
                {LEARNING_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    className="text-xs rounded-full border border-muted-foreground/20 px-3 py-1 hover:border-foreground hover:text-foreground transition-colors"
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Tools Column (hardcoded - pulls from catalog) */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Tools</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/tools" className="hover:text-foreground">
                  Tools Hub
                </Link>
              </li>
              {LIVE_TOOLS.map((tool) => (
                <li key={tool.slug}>
                  <Link href={`/tools/${tool.slug}`} className="hover:text-foreground">
                    {tool.footerLabel ?? tool.title}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Auth CTA */}
            <div className="mt-6">
              <Link
                href={authCta?.href ?? '/signup'}
                className="text-sm font-medium text-primary hover:underline"
              >
                {authCta?.label ?? 'Get Started'} →
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} KnearMe. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {footerLegal.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
