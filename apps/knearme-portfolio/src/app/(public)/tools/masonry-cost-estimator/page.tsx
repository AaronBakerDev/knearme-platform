/**
 * Masonry Repair Cost Estimator (Homeowner tool).
 *
 * Deterministic MVP: conservative national averages + coarse multipliers.
 * See PRD: docs/12-homeowner-tools/masonry-cost-estimator.md
 */

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ShieldCheck } from 'lucide-react'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { MasonryCostEstimatorWidget } from '@/components/tools/MasonryCostEstimatorWidget'
import { generateToolMetadata } from '@/lib/seo/tool-metadata'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = generateToolMetadata('masonry-cost-estimator', {
  title: 'Masonry Repair Cost Estimator | Free Homeowner Tool | KnearMe',
})

function WidgetSkeleton() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-48 w-full' />
    </div>
  )
}

export default function MasonryCostEstimatorPage() {

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Cost Estimator', url: '/tools/masonry-cost-estimator' },
  ]

  return (
    <ToolLayout
      title='Masonry Repair Cost Estimator'
      description='Get a transparent, planning-level cost range for common masonry repairs in your area. Actual bids vary — use this to budget and plan next steps.'
      breadcrumbs={breadcrumbs}
      heroAside={
        <div className='rounded-xl border bg-background/60 p-4 text-sm'>
          <div className='flex items-center gap-2 mb-2 text-primary font-medium'>
            <ShieldCheck className='h-4 w-4' />
            Planning estimate
          </div>
          <p className='text-muted-foreground leading-relaxed'>
            Based on conservative national averages and common job factors.
          </p>
        </div>
      }
    >
      <Suspense fallback={<WidgetSkeleton />}>
        <MasonryCostEstimatorWidget />
      </Suspense>
    </ToolLayout>
  )
}
