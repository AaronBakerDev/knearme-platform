/**
 * Chimney Water Intrusion Risk Checklist (Homeowner tool).
 *
 * Deterministic scoring + fix order; no AI.
 */

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { ChimneyWaterIntrusionRiskWidget } from '@/components/tools/ChimneyWaterIntrusionRiskWidget'
import { generateToolMetadata } from '@/lib/seo/tool-metadata'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = generateToolMetadata('chimney-water-intrusion-risk-checklist')

function WidgetSkeleton() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-48 w-full' />
    </div>
  )
}

export default function ChimneyWaterIntrusionRiskChecklistPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Chimney Leak Checklist', url: '/tools/chimney-water-intrusion-risk-checklist' },
  ]

  return (
    <ToolLayout
      title='Chimney Water Intrusion Risk Checklist'
      description='Score chimney leak risk and get a conservative fix order before sealing.'
      breadcrumbs={breadcrumbs}
    >
      <Suspense fallback={<WidgetSkeleton />}>
        <ChimneyWaterIntrusionRiskWidget />
      </Suspense>
    </ToolLayout>
  )
}

