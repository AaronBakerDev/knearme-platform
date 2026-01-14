'use client'

/**
 * Shared layout wrapper for homeowner tool pages.
 *
 * Provides consistent:
 * - Breadcrumb header
 * - Hero (title + description)
 * - Constrained content width
 *
 * Tools are designed to be fast, scannable, and mobile-first.
 */

import type { ReactNode } from 'react'
import { Breadcrumbs, type BreadcrumbItem } from '@/components/seo/Breadcrumbs'
import { cn } from '@/lib/utils'

interface ToolLayoutProps {
  title: string
  description: string
  breadcrumbs: BreadcrumbItem[]
  children: ReactNode
  /** Optional right-side hero content (e.g., mini stats) */
  heroAside?: ReactNode
  /** Mobile sticky results bar slot - appears at bottom on mobile */
  stickyBar?: ReactNode
  /** Optional progress bar slot - appears above main content */
  progressBar?: ReactNode
  className?: string
}

export function ToolLayout({
  title,
  description,
  breadcrumbs,
  children,
  heroAside,
  stickyBar,
  progressBar,
  className,
}: ToolLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      <header className='border-b bg-gradient-to-b from-muted/40 to-background'>
        <div className='container mx-auto px-4 py-4'>
          <Breadcrumbs items={breadcrumbs} />
        </div>

        <div className='container mx-auto px-4 py-10 md:py-14'>
          <div className='flex flex-col gap-6 md:flex-row md:items-end md:justify-between'>
            <div className='max-w-3xl'>
              <h1 className='text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-balance mb-3'>
                {title}
              </h1>
              <p className='text-lg md:text-xl text-muted-foreground leading-relaxed'>
                {description}
              </p>
            </div>

            {heroAside && (
              <div className='md:min-w-[240px]'>
                {heroAside}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className='container mx-auto px-4 py-8 md:py-12'>
        <div className='max-w-4xl mx-auto'>
          {progressBar && <div className='mb-6'>{progressBar}</div>}
          {children}
        </div>
      </main>

      {stickyBar}
    </div>
  )
}

export default ToolLayout

