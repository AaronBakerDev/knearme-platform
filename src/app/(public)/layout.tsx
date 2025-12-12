import type { ReactNode } from 'react'
import { SiteHeader } from '@/components/marketing/SiteHeader'
import { SiteFooter } from '@/components/marketing/SiteFooter'

/**
 * Public site layout.
 *
 * Applies global navigation + footer to all public routes
 * (tools, services, learn, city pages, etc.).
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className='flex min-h-screen flex-col font-sans'>
      <SiteHeader />
      <main className='flex-1'>{children}</main>
      <SiteFooter />
    </div>
  )
}

