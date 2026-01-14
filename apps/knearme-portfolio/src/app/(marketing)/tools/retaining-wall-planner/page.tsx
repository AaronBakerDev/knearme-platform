/**
 * Retaining Wall Planner (Homeowner tool).
 *
 * Deterministic MVP: materials + safety guidance.
 * See PRD: docs/12-homeowner-tools/retaining-wall-planner.md
 */

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { RetainingWallPlannerWidget } from '@/components/tools/RetainingWallPlannerWidget'
import { generateToolMetadata } from '@/lib/seo/tool-metadata'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = generateToolMetadata('retaining-wall-planner')

function WidgetSkeleton() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-48 w-full' />
    </div>
  )
}

export default function RetainingWallPlannerPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Retaining Wall Planner', url: '/tools/retaining-wall-planner' },
  ]

  return (
    <ToolLayout
      title='Retaining Wall Planner'
      description='Plan a straight retaining wall in under a minute. Estimate blocks, base gravel, backfill, drainage, and safety limits before you start digging.'
      breadcrumbs={breadcrumbs}
    >
      <Suspense fallback={<WidgetSkeleton />}>
        <RetainingWallPlannerWidget />
      </Suspense>
    </ToolLayout>
  )
}
