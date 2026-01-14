/**
 * Repoint vs Replace Brick/Stone Decision Tool (Homeowner tool).
 *
 * Deterministic decision tree; no AI.
 */

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { RepointVsReplaceDecisionWidget } from '@/components/tools/RepointVsReplaceDecisionWidget'
import { generateToolMetadata } from '@/lib/seo/tool-metadata'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = generateToolMetadata('repoint-vs-replace-decision')

function WidgetSkeleton() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-48 w-full' />
    </div>
  )
}

export default function RepointVsReplaceDecisionPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Repoint vs Replace', url: '/tools/repoint-vs-replace-decision' },
  ]

  return (
    <ToolLayout
      title='Repoint vs Replace Decision Tool'
      description='Decide whether your brick or stone needs repointing, replacement, or a rebuild consult.'
      breadcrumbs={breadcrumbs}
    >
      <Suspense fallback={<WidgetSkeleton />}>
        <RepointVsReplaceDecisionWidget />
      </Suspense>
    </ToolLayout>
  )
}

