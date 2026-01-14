/**
 * Masonry Maintenance Scheduler (Homeowner tool).
 *
 * Page wrapper using ToolLayout + MasonryMaintenanceSchedulerWidget.
 */

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { MasonryMaintenanceSchedulerWidget } from '@/components/tools/MasonryMaintenanceSchedulerWidget'
import { generateToolMetadata } from '@/lib/seo/tool-metadata'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = generateToolMetadata('masonry-maintenance-scheduler')

function WidgetSkeleton() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-48 w-full' />
    </div>
  )
}

export default function MasonryMaintenanceSchedulerPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Maintenance Scheduler', url: '/tools/masonry-maintenance-scheduler' },
  ]

  return (
    <ToolLayout
      title='Masonry Maintenance Scheduler'
      description='Generate a simple yearly masonry inspection and maintenance plan for your home.'
      breadcrumbs={breadcrumbs}
    >
      <Suspense fallback={<WidgetSkeleton />}>
        <MasonryMaintenanceSchedulerWidget />
      </Suspense>
    </ToolLayout>
  )
}
