/**
 * Tuckpointing Material + Labor Calculator (Homeowner tool).
 *
 * Deterministic MVP: mortar volume, bag count, labor time.
 */

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Wrench, Info } from 'lucide-react'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { estimateTuckpointing, type BrickType } from '@/lib/tools/tuckpointing'

const BRICK_TYPES: Array<{ value: BrickType; label: string; helper: string }> = [
  { value: 'standard', label: 'Standard brick', helper: 'Most homes built after ~1950' },
  { value: 'historic', label: 'Historic / soft brick', helper: 'Older homes, special mortar matching' },
  { value: 'stone-veneer', label: 'Stone veneer / irregular', helper: 'Wider joints, fewer per sq ft' },
]

export default function TuckpointingCalculatorPage() {
  const [wallLengthFt, setWallLengthFt] = useState(25)
  const [wallHeightFt, setWallHeightFt] = useState(8)
  const [jointDepthIn, setJointDepthIn] = useState(0.75)
  const [deteriorationPercent, setDeteriorationPercent] = useState(60)
  const [brickType, setBrickType] = useState<BrickType>('standard')

  const result = useMemo(() => {
    return estimateTuckpointing({
      wallLengthFt,
      wallHeightFt,
      jointDepthIn,
      deteriorationPercent,
      brickType,
    })
  }, [wallLengthFt, wallHeightFt, jointDepthIn, deteriorationPercent, brickType])

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Tuckpointing Calculator', url: '/tools/tuckpointing-calculator' },
  ]

  return (
    <ToolLayout
      title='Tuckpointing Material + Labor Calculator'
      description='Estimate mortar volume, bags needed, and typical labor time for tuckpointing or repointing your wall.'
      breadcrumbs={breadcrumbs}
      heroAside={
        <div className='rounded-xl border bg-background/60 p-4 text-sm'>
          <div className='flex items-center gap-2 mb-2 text-primary font-medium'>
            <Info className='h-4 w-4' />
            Planning tool
          </div>
          <p className='text-muted-foreground leading-relaxed'>
            Great for DIY scoping and comparing contractor bids.
          </p>
        </div>
      }
    >
      <div className='grid gap-6 lg:grid-cols-[1fr,360px]'>
        {/* Form */}
        <Card className='border-0 shadow-sm'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Wrench className='h-5 w-5 text-primary' />
              Wall details
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Wall length (ft)</Label>
                <Input type='number' min={1} value={wallLengthFt} onChange={(e) => setWallLengthFt(Number(e.target.value) || 1)} />
                <p className='text-xs text-muted-foreground'>Example: 20–40 ft for one wall face.</p>
              </div>

              <div className='space-y-2'>
                <Label>Wall height (ft)</Label>
                <Input type='number' min={1} value={wallHeightFt} onChange={(e) => setWallHeightFt(Number(e.target.value) || 1)} />
                <p className='text-xs text-muted-foreground'>Example: 6–10 ft for one story.</p>
              </div>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Mortar depth to remove (in)</Label>
                <Input type='number' min={0.25} step={0.25} value={jointDepthIn} onChange={(e) => setJointDepthIn(Number(e.target.value) || 0.5)} />
                <p className='text-xs text-muted-foreground'>Most repointing removes 3/4&quot;–1&quot;.</p>
              </div>

              <div className='space-y-2'>
                <Label>% of joints failing</Label>
                <Input type='number' min={0} max={100} value={deteriorationPercent} onChange={(e) => setDeteriorationPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} />
                <p className='text-xs text-muted-foreground'>Use 100% if repointing the full wall.</p>
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Brick type</Label>
              <Select value={brickType} onValueChange={(v) => setBrickType(v as BrickType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BRICK_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground'>
                {BRICK_TYPES.find((t) => t.value === brickType)?.helper}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className='space-y-6'>
          <Card className='border-0 shadow-sm'>
            <CardHeader>
              <CardTitle>Materials estimate</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='rounded-xl bg-muted/40 p-4 space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span>Wall area</span>
                  <span className='font-medium'>{result.wallAreaSqFt} sq ft</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span>Affected area</span>
                  <span className='font-medium'>{result.affectedAreaSqFt} sq ft</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span>Linear ft of joints</span>
                  <span className='font-medium'>{result.linearFeetJoints.toLocaleString()} ft</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span>Mortar volume</span>
                  <span className='font-medium'>{result.mortarVolumeCuFt} cu ft</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span>Bags needed (80lb)</span>
                  <span className='font-medium'>{result.bagsNeeded}</span>
                </div>
              </div>

              <Badge variant='secondary'>Planning estimate</Badge>

              <div className='text-xs text-muted-foreground leading-relaxed'>
                Assumes standard Type N mortar and typical 3/8&quot; joints. Buy an extra bag or two for waste.
              </div>

              <Button asChild className='w-full'>
                <Link href='/tools/masonry-cost-estimator'>Estimate total repair cost</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className='border-0 shadow-sm'>
            <CardHeader>
              <CardTitle className='text-base'>Labor + material cost guidance</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3 text-sm'>
              <div className='rounded-lg border bg-background p-3'>
                <div className='font-medium'>Labor time (typical)</div>
                <div className='text-muted-foreground text-xs mt-1'>
                  {result.laborHoursLow} – {result.laborHoursHigh} hours for the affected area.
                </div>
              </div>
              <div className='rounded-lg border bg-background p-3'>
                <div className='font-medium'>Mortar material cost</div>
                <div className='text-muted-foreground text-xs mt-1'>
                  ${result.materialCostLow} – ${result.materialCostHigh} for bags.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ToolLayout>
  )
}
