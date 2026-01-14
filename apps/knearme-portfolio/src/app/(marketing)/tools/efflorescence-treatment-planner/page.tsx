/**
 * Efflorescence Cause + Treatment Planner (Homeowner tool).
 *
 * Deterministic guidance; no AI.
 */

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { EfflorescenceTreatmentWidget } from '@/components/tools/EfflorescenceTreatmentWidget'
import { generateToolMetadata } from '@/lib/seo/tool-metadata'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = generateToolMetadata('efflorescence-treatment-planner')

function WidgetSkeleton() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-48 w-full' />
    </div>
  )
}

export default function EfflorescenceTreatmentPlannerPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Efflorescence Planner', url: '/tools/efflorescence-treatment-planner' },
  ]

  return (
    <ToolLayout
      title='Efflorescence Cause + Treatment Planner'
      description='Figure out why you&apos;re seeing white powder on brick and get a safe DIY cleaning + prevention plan.'
      breadcrumbs={breadcrumbs}
    >
      <Suspense fallback={<WidgetSkeleton />}>
        <EfflorescenceTreatmentWidget />
      </Suspense>
    </ToolLayout>
  )
}
