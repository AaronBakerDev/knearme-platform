/**
 * Portfolio Footer - Minimal Attribution
 *
 * Server component for portfolio/UGC pages with minimal footer.
 * Shows subtle attribution and essential legal links.
 *
 * Used on: Business profiles, project showcases, city listings
 *
 * @see /src/payload/globals/Navigation.ts for CMS schema
 * @see /src/lib/payload/client.ts for getPortfolioNav()
 */
import Link from 'next/link'
import { getPortfolioNav, type LegalLink } from '@/lib/payload/client'

/**
 * Default legal links when CMS is not configured.
 */
const DEFAULT_LEGAL_LINKS: LegalLink[] = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
]

export async function PortfolioFooter() {
  // Fetch navigation config from CMS
  const nav = await getPortfolioNav()

  // Use CMS links if available, otherwise defaults
  const legalLinks = nav.footerLinks.length > 0 ? nav.footerLinks : DEFAULT_LEGAL_LINKS

  return (
    <footer className="border-t border-border/30 bg-muted/30">
      <div className="container mx-auto py-6 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          {/* Attribution */}
          <p>
            {nav.footerText}{' '}
            <span className="mx-1">·</span>
            <Link href="/" className="hover:text-foreground transition-colors">
              Create your portfolio
            </Link>
          </p>

          {/* Legal Links */}
          <div className="flex items-center gap-4">
            {legalLinks.map((link, index) => (
              <span key={link.href} className="flex items-center gap-4">
                <Link href={link.href} className="hover:text-foreground transition-colors">
                  {link.label}
                </Link>
                {index < legalLinks.length - 1 && <span className="text-border">·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
