/**
 * Chimney Repair Urgency Checklist (Homeowner tool).
 *
 * Rules-based scoring; no AI.
 * See PRD: docs/12-homeowner-tools/chimney-repair-urgency-checklist.md
 */

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { ChimneyUrgencyChecklistWidget } from '@/components/tools/ChimneyUrgencyChecklistWidget'
import { generateToolMetadata } from '@/lib/seo/tool-metadata'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = generateToolMetadata('chimney-repair-urgency-checklist')

function WidgetSkeleton() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-48 w-full' />
    </div>
  )
}

export default function ChimneyUrgencyChecklistPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Chimney Checklist', url: '/tools/chimney-repair-urgency-checklist' },
  ]

  return (
    <ToolLayout
      title='Chimney Repair Urgency Checklist'
      description='Answer a few quick questions to understand whether your chimney issues are minor, need scheduling, or require urgent repair.'
      breadcrumbs={breadcrumbs}
    >
      <Suspense fallback={<WidgetSkeleton />}>
        <ChimneyUrgencyChecklistWidget />
      </Suspense>
    </ToolLayout>
  )
}
