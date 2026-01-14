import type { ReactNode } from 'react'
import { MarketingHeader } from '@/components/marketing/MarketingHeader'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

/**
 * Layout for marketing pages (landing, blog, learn, services, tools, etc.).
 *
 * Uses full CMS-controlled navigation with CTAs to drive conversions.
 * These pages are about explaining KnearMe and converting visitors.
 *
 * @see /src/components/marketing/MarketingHeader.tsx - CMS-driven header
 * @see /src/components/marketing/MarketingFooter.tsx - CMS-driven footer
 * @see /(portfolio)/layout.tsx - Minimal layout for UGC pages
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col font-sans">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  )
}
