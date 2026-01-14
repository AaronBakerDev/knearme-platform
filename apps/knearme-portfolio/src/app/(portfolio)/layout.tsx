import type { ReactNode } from 'react'
import { PortfolioHeader } from '@/components/portfolio/PortfolioHeader'
import { PortfolioFooter } from '@/components/portfolio/PortfolioFooter'
import { FloatingCta } from '@/components/portfolio/FloatingCta'

/**
 * Layout for portfolio/UGC pages (business profiles, project showcases).
 *
 * Uses minimal chrome so the business's work is the star.
 * The header is just logo + back link; footer is subtle attribution.
 * Optional floating CTA drives conversions without dominating the page.
 *
 * @see /src/components/portfolio/PortfolioHeader.tsx - Minimal header
 * @see /src/components/portfolio/PortfolioFooter.tsx - Subtle footer
 * @see /src/components/portfolio/FloatingCta.tsx - Optional CTA
 * @see /(marketing)/layout.tsx - Full layout for marketing pages
 */
export default function PortfolioLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col font-sans">
      <PortfolioHeader />
      <main className="flex-1">{children}</main>
      <PortfolioFooter />
      <FloatingCta />
    </div>
  )
}
