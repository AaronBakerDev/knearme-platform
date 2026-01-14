/**
 * Portfolio Header - Minimal Navigation
 *
 * Server component for portfolio/UGC pages with minimal chrome.
 * Shows only logo and back link, keeping focus on the business's work.
 *
 * Used on: Business profiles, project showcases, city listings
 *
 * The header style can be configured via CMS:
 * - 'minimal': Logo + back link
 * - 'hidden': No header at all
 *
 * @see /src/payload/globals/Navigation.ts for CMS schema
 * @see /src/lib/payload/client.ts for getPortfolioNav()
 */
import Link from 'next/link'
import { getPortfolioNav } from '@/lib/payload/client'
import { ArrowLeft } from 'lucide-react'

type PortfolioHeaderProps = {
  /**
   * Optional back link destination. If not provided, uses root path.
   */
  backHref?: string
  /**
   * Optional custom back text. Overrides CMS setting.
   */
  backText?: string
}

export async function PortfolioHeader({ backHref = '/', backText }: PortfolioHeaderProps = {}) {
  // Fetch navigation config from CMS
  const nav = await getPortfolioNav()

  // If header is hidden, render nothing
  if (nav.headerStyle === 'hidden') {
    return null
  }

  // Use custom backText if provided, otherwise use CMS config
  const displayBackText = backText || nav.backText

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/30 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm group-hover:shadow transition-shadow">
            K
          </div>
          <span className="text-lg font-semibold tracking-tight hidden sm:block">KnearMe</span>
        </Link>

        {/* Back Link */}
        <Link
          href={backHref}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden xs:inline">{displayBackText}</span>
        </Link>
      </div>
    </header>
  )
}
