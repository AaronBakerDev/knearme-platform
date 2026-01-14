/**
 * Masonry Waterproofing Risk + Decision Checklist (Homeowner tool).
 *
 * Page wrapper using ToolLayout + WaterproofingRiskChecklistWidget.
 */

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { WaterproofingRiskChecklistWidget } from '@/components/tools/WaterproofingRiskChecklistWidget'
import { generateToolMetadata } from '@/lib/seo/tool-metadata'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = generateToolMetadata('waterproofing-risk-checklist')

function WidgetSkeleton() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-48 w-full' />
    </div>
  )
}

export default function WaterproofingRiskChecklistPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Waterproofing Checklist', url: '/tools/waterproofing-risk-checklist' },
  ]

  return (
    <ToolLayout
      title='Masonry Waterproofing Risk Checklist'
      description='Score moisture risk for brick or stone masonry and get a conservative “what to do first” plan.'
      breadcrumbs={breadcrumbs}
    >
      <Suspense fallback={<WidgetSkeleton />}>
        <WaterproofingRiskChecklistWidget />
      </Suspense>
    </ToolLayout>
  )
}

