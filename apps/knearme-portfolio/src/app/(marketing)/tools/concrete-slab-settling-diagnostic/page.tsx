/**
 * Concrete Slab / Patio Settling Diagnostic (Homeowner tool).
 *
 * Deterministic diagnostic; no AI.
 */

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { ConcreteSlabSettlingDiagnosticWidget } from '@/components/tools/ConcreteSlabSettlingDiagnosticWidget'
import { generateToolMetadata } from '@/lib/seo/tool-metadata'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = generateToolMetadata('concrete-slab-settling-diagnostic')

function WidgetSkeleton() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-48 w-full' />
    </div>
  )
}

export default function ConcreteSlabSettlingDiagnosticPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Concrete Settling Diagnostic', url: '/tools/concrete-slab-settling-diagnostic' },
  ]

  return (
    <ToolLayout
      title='Concrete Slab Settling Diagnostic'
      description='Diagnose why a concrete patio, slab, or sidewalk is sinking and get a conservative repair path.'
      breadcrumbs={breadcrumbs}
    >
      <Suspense fallback={<WidgetSkeleton />}>
        <ConcreteSlabSettlingDiagnosticWidget />
      </Suspense>
    </ToolLayout>
  )
}

