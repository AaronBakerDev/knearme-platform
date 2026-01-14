/**
 * Outdoor Drainage Quick Planner (Homeowner tool).
 *
 * Deterministic planner; no AI.
 */

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { OutdoorDrainageQuickPlannerWidget } from '@/components/tools/OutdoorDrainageQuickPlannerWidget'
import { generateToolMetadata } from '@/lib/seo/tool-metadata'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = generateToolMetadata('outdoor-drainage-quick-planner')

function WidgetSkeleton() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-48 w-full' />
    </div>
  )
}

export default function OutdoorDrainageQuickPlannerPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Drainage Planner', url: '/tools/outdoor-drainage-quick-planner' },
  ]

  return (
    <ToolLayout
      title='Outdoor Drainage Quick Planner'
      description='Get a simple downspout and grading plan to protect masonry and foundations from moisture.'
      breadcrumbs={breadcrumbs}
    >
      <Suspense fallback={<WidgetSkeleton />}>
        <OutdoorDrainageQuickPlannerWidget />
      </Suspense>
    </ToolLayout>
  )
}

