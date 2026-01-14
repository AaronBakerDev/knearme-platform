/**
 * Basement Leak Source Triage + Fix-Order Tool (Homeowner tool).
 *
 * Deterministic triage; no AI.
 */

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { BasementLeakTriageWidget } from '@/components/tools/BasementLeakTriageWidget'
import { generateToolMetadata } from '@/lib/seo/tool-metadata'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = generateToolMetadata('basement-leak-triage')

function WidgetSkeleton() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-48 w-full' />
    </div>
  )
}

export default function BasementLeakTriagePage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Basement Leak Triage', url: '/tools/basement-leak-triage' },
  ]

  return (
    <ToolLayout
      title='Basement Leak Source Triage'
      description='Answer a few quick questions to identify the most likely basement leak source and a conservative fix order.'
      breadcrumbs={breadcrumbs}
    >
      <Suspense fallback={<WidgetSkeleton />}>
        <BasementLeakTriageWidget />
      </Suspense>
    </ToolLayout>
  )
}

