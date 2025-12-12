/**
 * Masonry Repair Cost Estimator (Homeowner tool).
 *
 * Deterministic MVP: conservative national averages + coarse multipliers.
 * See PRD: docs/12-homeowner-tools/masonry-cost-estimator.md
 */

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Calculator, MapPin, ShieldCheck } from 'lucide-react'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SERVICE_CONTENT } from '@/lib/constants/service-content'
import { MASONRY_SERVICES, type ServiceId } from '@/lib/constants/services'
import { estimateCost, type AccessTier, type SeverityTier } from '@/lib/tools/cost-estimator'

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

const CITY_TIER_OPTIONS = [
  { value: 'B', label: 'Typical cost area (baseline)' },
  { value: 'A', label: 'Lower cost area' },
  { value: 'C', label: 'Higher cost area' },
] as const

export default function MasonryCostEstimatorPage() {
  const [serviceId, setServiceId] = useState<ServiceId>('chimney-repair')
  const [size, setSize] = useState<number>(10)
  const [severity, setSeverity] = useState<SeverityTier>('standard')
  const [access, setAccess] = useState<AccessTier>('single')
  const [historic, setHistoric] = useState(false)
  const [cityTier, setCityTier] = useState<'A' | 'B' | 'C'>('B')

  const serviceContent = SERVICE_CONTENT[serviceId]

  const estimate = useMemo(() => {
    return estimateCost({ serviceId, size, severity, access, historic, cityTier })
  }, [serviceId, size, severity, access, historic, cityTier])

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Cost Estimator', url: '/tools/masonry-cost-estimator' },
  ]

  return (
    <ToolLayout
      title='Masonry Repair Cost Estimator'
      description='Get a transparent, planning-level cost range for common masonry repairs in your area. Actual bids vary — use this to budget and plan next steps.'
      breadcrumbs={breadcrumbs}
      heroAside={
        <div className='rounded-xl border bg-background/60 p-4 text-sm'>
          <div className='flex items-center gap-2 mb-2 text-primary font-medium'>
            <ShieldCheck className='h-4 w-4' />
            Planning estimate
          </div>
          <p className='text-muted-foreground leading-relaxed'>
            Based on conservative national averages and common job factors.
          </p>
        </div>
      }
    >
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
              <Select value={serviceId} onValueChange={(v) => setServiceId(v as ServiceId)}>
                <SelectTrigger>
                  <SelectValue placeholder='Select a service' />
                </SelectTrigger>
                <SelectContent>
                  {MASONRY_SERVICES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground'>
                Pick the repair you’re planning. We’ll show typical costs for that service.
              </p>
            </div>

            {/* Size */}
            <div className='space-y-2'>
              <Label>Approximate size ({estimate.unitLabel})</Label>
              <Input
                type='number'
                min={1}
                step={1}
                value={size}
                onChange={(e) => setSize(Math.max(1, Number(e.target.value) || 1))}
              />
              <p className='text-xs text-muted-foreground'>
                Example: chimney height in feet, wall area in sq ft, or crack length in ft.
              </p>
            </div>

            {/* City tier */}
            <div className='space-y-2'>
              <Label className='flex items-center gap-2'>
                <MapPin className='h-4 w-4 text-muted-foreground' />
                Local cost level
              </Label>
              <Select value={cityTier} onValueChange={(v) => setCityTier(v as 'A' | 'B' | 'C')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CITY_TIER_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground'>
                Until we have local pricing, choose the option closest to your market.
              </p>
            </div>

            {/* Severity */}
            <div className='space-y-2'>
              <Label>Severity</Label>
              <div className='grid gap-2 sm:grid-cols-3'>
                {SEVERITY_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type='button'
                    onClick={() => setSeverity(o.value)}
                    className={
                      severity === o.value
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
              <Select value={access} onValueChange={(v) => setAccess(v as AccessTier)}>
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
                checked={historic}
                onChange={(e) => setHistoric(e.target.checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className='space-y-6'>
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

              <Button asChild className='w-full'>
                <Link href='/tools/chimney-repair-urgency-checklist'>Check repair urgency</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Drivers */}
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
        </div>
      </div>
    </ToolLayout>
  )
}
