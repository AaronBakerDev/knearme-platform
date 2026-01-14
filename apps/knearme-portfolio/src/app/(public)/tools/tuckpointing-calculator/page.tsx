/**
 * Tuckpointing Material + Labor Calculator (Homeowner tool).
 *
 * Deterministic MVP: mortar volume, bag count, labor time.
 */

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Info } from 'lucide-react'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { TuckpointingCalculatorWidget } from '@/components/tools/TuckpointingCalculatorWidget'
import { generateToolMetadata } from '@/lib/seo/tool-metadata'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = generateToolMetadata('tuckpointing-calculator')

function WidgetSkeleton() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-48 w-full' />
    </div>
  )
}

export default function TuckpointingCalculatorPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Tuckpointing Calculator', url: '/tools/tuckpointing-calculator' },
  ]

  return (
    <ToolLayout
      title='Tuckpointing Material + Labor Calculator'
      description='Estimate mortar volume, bags needed, and typical labor time for tuckpointing or repointing your wall.'
      breadcrumbs={breadcrumbs}
      heroAside={
        <div className='rounded-xl border bg-background/60 p-4 text-sm'>
          <div className='flex items-center gap-2 mb-2 text-primary font-medium'>
            <Info className='h-4 w-4' />
            Planning tool
          </div>
          <p className='text-muted-foreground leading-relaxed'>
            Great for DIY scoping and comparing contractor bids.
          </p>
        </div>
      }
    >
      <Suspense fallback={<WidgetSkeleton />}>
        <TuckpointingCalculatorWidget />
      </Suspense>
    </ToolLayout>
  )
}
