/**
 * Floating CTA - Portfolio Page Call-to-Action
 *
 * Server component that renders a floating CTA button on portfolio pages.
 * Positioned fixed at bottom-right, unobtrusive but always accessible.
 *
 * Can be enabled/disabled via CMS Navigation global.
 *
 * @see /src/payload/globals/Navigation.ts for CMS schema
 * @see /src/lib/payload/client.ts for getPortfolioNav()
 */
import Link from 'next/link'
import { getPortfolioNav } from '@/lib/payload/client'
import { ArrowRight } from 'lucide-react'

export async function FloatingCta() {
  // Fetch navigation config from CMS
  const nav = await getPortfolioNav()

  // If CTA is disabled, render nothing
  if (!nav.cta.enabled) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Link
        href={nav.cta.href || '/signup'}
        className="group flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 text-sm font-medium"
      >
        <span>{nav.cta.label || 'Need Similar Work?'}</span>
        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  )
}
