/**
 * Brick Replacement Count + Budget Tool (Homeowner tool).
 *
 * Simple page wrapper using ToolLayout + BrickReplacementCalculatorWidget.
 */

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { BrickReplacementCalculatorWidget } from '@/components/tools/BrickReplacementCalculatorWidget'
import { generateToolMetadata } from '@/lib/seo/tool-metadata'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = generateToolMetadata('brick-replacement-calculator')

function WidgetSkeleton() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-48 w-full' />
    </div>
  )
}

export default function BrickReplacementCalculatorPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Brick Replacement', url: '/tools/brick-replacement-calculator' },
  ]

  return (
    <ToolLayout
      title='Brick Replacement Calculator'
      description='Estimate how many bricks you need to replace and get a planning budget for materials and labor.'
      breadcrumbs={breadcrumbs}
    >
      <Suspense fallback={<WidgetSkeleton />}>
        <BrickReplacementCalculatorWidget />
      </Suspense>
    </ToolLayout>
  )
}
