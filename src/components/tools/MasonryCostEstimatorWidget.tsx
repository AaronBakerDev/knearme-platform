'use client'

/**
 * Masonry Cost Estimator widget.
 *
 * Shared between the full tool page and city cost SEO wrappers.
 * Uses deterministic national v2 base ranges + multipliers.
 *
 * Services are fetched dynamically from /api/services to ensure
 * consistency with the Service Catalog.
 *
 * @see src/lib/services/catalog.ts
 */

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { Calculator, MapPin, Loader2 } from 'lucide-react'
import {
  Card, CardContent, CardHeader, CardTitle,
  Label, Input, Badge, Button,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui'
import { SERVICE_CONTENT } from '@/lib/constants/service-content'
import { estimateCost, type AccessTier, type SeverityTier } from '@/lib/tools/cost-estimator'
import type { ServiceId } from '@/lib/constants/services'
import { logger } from '@/lib/logging'

/** Service option from API */
interface ServiceOption {
  id: string
  label: string
  icon: string
}
import { useUrlState, ShareableLinkButton } from '@/components/tools/ToolSharing'
import { StickyResultsBar } from '@/components/tools/ToolResults'
import { PDFExportButton } from '@/components/tools/ToolPDF'

const SEVERITY_OPTIONS: Array<{ value: SeverityTier; label: string; helper: string }> = [
  { value: 'minor', label: 'Minor', helper: 'Cosmetic mortar cracks or small areas' },
  { value: 'standard', label: 'Standard', helper: 'Typical deterioration needing repair' },
  { value: 'structural', label: 'Structural', helper: 'Leaning, rebuild-level, or major failure' },
]

const ACCESS_OPTIONS: Array<{ value: AccessTier; label: string }> = [
  { value: 'single', label: 'Single story / easy access' },
  { value: 'two-story', label: 'Two story' },
  { value: 'steep', label: 'Steep or complex roof' },
  { value: 'limited', label: 'Limited access / staging needed' },
]

const NEXT_STEP_LINKS: Partial<Record<ServiceId, { href: string; label: string }>> = {
  'chimney-repair': { href: '/tools/chimney-repair-urgency-checklist', label: 'Check repair urgency' },
  tuckpointing: { href: '/tools/tuckpointing-calculator', label: 'Estimate mortar + labor' },
  'brick-repair': { href: '/tools/brick-replacement-calculator', label: 'Estimate brick count' },
  'foundation-repair': { href: '/tools/foundation-crack-severity-checker', label: 'Check crack severity' },
  'retaining-walls': { href: '/tools/retaining-wall-planner', label: 'Plan a retaining wall' },
} as const

interface ResultsContentProps {
  estimate: {
    low: number
    high: number
    typical: number
    unitLabel: string
    assumptions: string[]
  }
  serviceContent: {
    label: string
    costFactors: Array<{
      label: string
      description: string
      typicalRange?: string
    }>
  }
  nextStep?: { href: string; label: string }
  getShareableUrl: () => string
  toolState: Record<string, unknown>
}

/**
 * Results content component (used in desktop sidebar and mobile sheet).
 * Extracted as separate component to avoid recreation on each render.
 */
function ResultsContent({ estimate, serviceContent, nextStep, getShareableUrl, toolState }: ResultsContentProps) {
  return (
    <>
      <Card className='border-0 shadow-sm'>
        <CardHeader>
          <CardTitle>Estimated cost range</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='rounded-xl bg-muted/40 p-4 text-center'>
            <div className='text-sm text-muted-foreground mb-1'>Typical range</div>
            <div className='text-3xl font-bold tracking-tight'>
              ${estimate.low.toLocaleString()} – ${estimate.high.toLocaleString()}
            </div>
            <div className='text-sm text-muted-foreground mt-1'>
              Typical: ${estimate.typical.toLocaleString()}
            </div>
          </div>

          <Badge variant='secondary' className='w-fit'>
            Planning‑level estimate
          </Badge>

          <div className='text-xs text-muted-foreground leading-relaxed space-y-1'>
            {estimate.assumptions.map((a) => (
              <p key={a}>• {a}</p>
            ))}
          </div>

          {/* Action buttons */}
          <div className='flex flex-col gap-2'>
            <div className='flex gap-2'>
              <ShareableLinkButton
                getUrl={getShareableUrl}
                variant='outline'
                size='sm'
                className='flex-1'
              />
              <PDFExportButton
                toolSlug='masonry-cost-estimator'
                toolName='Masonry Cost Estimator'
                inputs={toolState}
                results={{
                  estimate: {
                    low: estimate.low,
                    high: estimate.high,
                    typical: estimate.typical,
                    unitLabel: estimate.unitLabel,
                  },
                  assumptions: estimate.assumptions,
                  serviceLabel: serviceContent.label,
                }}
                variant='outline'
                size='sm'
                className='flex-1'
              />
            </div>

            {nextStep && (
              <Button asChild className='w-full'>
                <Link href={nextStep.href}>{nextStep.label}</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cost Drivers */}
      <Card className='border-0 shadow-sm'>
        <CardHeader>
          <CardTitle className='text-base'>What drives cost for {serviceContent.label}?</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 text-sm'>
          {serviceContent.costFactors.map((f) => (
            <div key={f.label} className='rounded-lg border bg-background p-3'>
              <div className='font-medium'>{f.label}</div>
              <div className='text-muted-foreground text-xs mt-1'>{f.description}</div>
              {f.typicalRange && (
                <div className='text-xs mt-2'>Typical impact: {f.typicalRange}</div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  )
}

export interface MasonryCostEstimatorWidgetProps {
  /** Service ID - accepts string for compatibility with Service Catalog */
  initialServiceId?: string
}

export function MasonryCostEstimatorWidget({ initialServiceId = 'chimney-repair' }: MasonryCostEstimatorWidgetProps) {
  // Dynamic services from API
  const [services, setServices] = useState<ServiceOption[]>([])
  const [isLoadingServices, setIsLoadingServices] = useState(true)

  // Fetch services from catalog API
  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await fetch('/api/services?trade=masonry')
        if (res.ok) {
          const data = await res.json()
          setServices(data.services || [])
        }
      } catch (error) {
        logger.error('[MasonryCostEstimatorWidget] Failed to fetch services', { error })
      } finally {
        setIsLoadingServices(false)
      }
    }
    fetchServices()
  }, [])

  // URL-synced state for all form fields
  const defaultState = {
    serviceId: initialServiceId,
    size: 10,
    severity: 'standard' as SeverityTier,
    access: 'single' as AccessTier,
    historic: false,
  }

  const { state, setState, getShareableUrl } = useUrlState(defaultState)

  // Cast to ServiceId for type safety - cost estimator still uses legacy constant lookups
  const typedServiceId = state.serviceId as ServiceId
  const serviceContent = SERVICE_CONTENT[typedServiceId]

  const estimate = useMemo(() => {
    return estimateCost({
      serviceId: typedServiceId,
      size: state.size,
      severity: state.severity,
      access: state.access,
      historic: state.historic
    })
  }, [typedServiceId, state.size, state.severity, state.access, state.historic])

  const nextStep = NEXT_STEP_LINKS[typedServiceId]

  return (
    <>
      <div className='grid gap-6 lg:grid-cols-[1fr,360px]'>
      {/* Form */}
      <Card className='border-0 shadow-sm'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Calculator className='h-5 w-5 text-primary' />
            Your Project Details
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Service */}
          <div className='space-y-2'>
            <Label>Service type</Label>
            <Select
              value={state.serviceId}
              onValueChange={(v) => setState({ serviceId: v as ServiceId })}
              disabled={isLoadingServices}
            >
              <SelectTrigger>
                {isLoadingServices ? (
                  <span className='flex items-center gap-2 text-muted-foreground'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Loading services...
                  </span>
                ) : (
                  <SelectValue placeholder='Select a service' />
                )}
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className='flex items-center gap-2'>
                      <span>{s.icon}</span>
                      <span>{s.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className='text-xs text-muted-foreground'>
              Pick the repair you&rsquo;re planning. We&rsquo;ll show typical costs for that service.
            </p>
          </div>

          {/* Size */}
          <div className='space-y-2'>
            <Label>Approximate size ({estimate.unitLabel})</Label>
            <Input
              type='number'
              min={1}
              step={1}
              value={state.size}
              onChange={(e) => setState({ size: Math.max(1, Number(e.target.value) || 1) })}
            />
            <p className='text-xs text-muted-foreground'>
              Example: chimney height in feet, wall area in sq ft, or crack length in ft.
            </p>
          </div>

          {/* Location note (national estimator) */}
          <div className='rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground leading-relaxed flex gap-2'>
            <MapPin className='h-4 w-4 mt-0.5 shrink-0' />
            This calculator uses national planning averages. City‑specific cost pages provide local context, but the math is not localized yet.
          </div>

          {/* Severity */}
          <div className='space-y-2'>
            <Label>Severity</Label>
            <div className='grid gap-2 sm:grid-cols-3'>
              {SEVERITY_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type='button'
                  onClick={() => setState({ severity: o.value })}
                  className={
                    state.severity === o.value
                      ? 'rounded-lg border border-primary bg-primary/5 p-3 text-left'
                      : 'rounded-lg border p-3 text-left hover:bg-muted/40'
                  }
                >
                  <div className='font-medium'>{o.label}</div>
                  <div className='text-xs text-muted-foreground mt-1'>{o.helper}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Access */}
          <div className='space-y-2'>
            <Label>Access / height</Label>
            <Select value={state.access} onValueChange={(v) => setState({ access: v as AccessTier })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCESS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Historic */}
          <div className='flex items-center justify-between rounded-lg border p-3'>
            <div>
              <div className='font-medium'>Historic material matching needed?</div>
              <div className='text-xs text-muted-foreground'>
                Older homes or specialty brick/stone often cost more.
              </div>
            </div>
            <input
              type='checkbox'
              className='h-5 w-5 accent-primary'
              checked={state.historic}
              onChange={(e) => setState({ historic: e.target.checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Results - Desktop sidebar */}
      <div className='hidden lg:block space-y-6'>
        <ResultsContent
          estimate={estimate}
          serviceContent={serviceContent}
          nextStep={nextStep}
          getShareableUrl={getShareableUrl}
          toolState={state}
        />
      </div>
    </div>

      {/* Mobile sticky results bar */}
      <StickyResultsBar
        summary={`$${estimate.low.toLocaleString()} – $${estimate.high.toLocaleString()}`}
        summaryLabel="Estimated cost range"
      >
        <ResultsContent
          estimate={estimate}
          serviceContent={serviceContent}
          nextStep={nextStep}
          getShareableUrl={getShareableUrl}
          toolState={state}
        />
      </StickyResultsBar>
    </>
  )
}

export default MasonryCostEstimatorWidget
