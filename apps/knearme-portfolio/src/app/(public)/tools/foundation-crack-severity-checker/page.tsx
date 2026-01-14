/**
 * Foundation Crack Severity Checker (Homeowner tool).
 *
 * Deterministic triage; no AI.
 */

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { FoundationCrackCheckerWidget } from '@/components/tools/FoundationCrackCheckerWidget'
import { generateToolMetadata } from '@/lib/seo/tool-metadata'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = generateToolMetadata('foundation-crack-severity-checker')

function WidgetSkeleton() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-48 w-full' />
    </div>
  )
}

export default function FoundationCrackSeverityCheckerPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Foundation Crack Checker', url: '/tools/foundation-crack-severity-checker' },
  ]

  return (
    <ToolLayout
      title='Foundation Crack Severity Checker'
      description='Answer a few quick questions to understand whether your foundation crack is likely cosmetic, monitor‑worthy, or needs prompt professional inspection.'
      breadcrumbs={breadcrumbs}
    >
      <Suspense fallback={<WidgetSkeleton />}>
        <FoundationCrackCheckerWidget />
      </Suspense>
    </ToolLayout>
  )
}
