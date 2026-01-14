/**
 * Paver Base + Materials Calculator (Homeowner tool).
 *
 * Page wrapper using ToolLayout + PaverBaseCalculatorWidget.
 */

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { PaverBaseCalculatorWidget } from '@/components/tools/PaverBaseCalculatorWidget'
import { generateToolMetadata } from '@/lib/seo/tool-metadata'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = generateToolMetadata('paver-base-calculator')

function WidgetSkeleton() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-48 w-full' />
    </div>
  )
}

export default function PaverBaseCalculatorPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Paver Base Calculator', url: '/tools/paver-base-calculator' },
  ]

  return (
    <ToolLayout
      title='Paver Base + Materials Calculator'
      description='Plan a brick or stone patio/walkway fast. Estimate gravel base, bedding sand, and excavation depth.'
      breadcrumbs={breadcrumbs}
    >
      <Suspense fallback={<WidgetSkeleton />}>
        <PaverBaseCalculatorWidget />
      </Suspense>
    </ToolLayout>
  )
}
