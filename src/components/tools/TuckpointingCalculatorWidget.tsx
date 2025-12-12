'use client'

/**
 * Tuckpointing Calculator widget.
 *
 * Deterministic MVP: mortar volume, bag count, labor time.
 * Uses new UX components for sharing, PDF export, and mobile responsiveness.
 */

import { useMemo } from 'react'
import Link from 'next/link'
import { Wrench } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { estimateTuckpointing, type BrickType } from '@/lib/tools/tuckpointing'
import { useUrlState, ShareableLinkButton } from '@/components/tools/ToolSharing'
import { StickyResultsBar } from '@/components/tools/ToolResults'
import { PDFExportButton } from '@/components/tools/ToolPDF'

const BRICK_TYPES: Array<{ value: BrickType; label: string; helper: string }> = [
  { value: 'standard', label: 'Standard brick', helper: 'Most homes built after ~1950' },
  { value: 'historic', label: 'Historic / soft brick', helper: 'Older homes, special mortar matching' },
  { value: 'stone-veneer', label: 'Stone veneer / irregular', helper: 'Wider joints, fewer per sq ft' },
]

interface ResultsContentProps {
  result: ReturnType<typeof estimateTuckpointing>
  getShareableUrl: () => string
  toolState: Record<string, unknown>
}

/**
 * Results content component (used in desktop sidebar and mobile sheet).
 * Extracted to avoid duplication between desktop and mobile views.
 */
function ResultsContent({ result, getShareableUrl, toolState }: ResultsContentProps) {
  return (
    <>
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
                toolSlug='tuckpointing-calculator'
                toolName='Tuckpointing Calculator'
                inputs={toolState}
                results={{
                  wallAreaSqFt: result.wallAreaSqFt,
                  affectedAreaSqFt: result.affectedAreaSqFt,
                  linearFeetJoints: result.linearFeetJoints,
                  mortarVolumeCuFt: result.mortarVolumeCuFt,
                  bagsNeeded: result.bagsNeeded,
                  laborHoursLow: result.laborHoursLow,
                  laborHoursHigh: result.laborHoursHigh,
                  materialCostLow: result.materialCostLow,
                  materialCostHigh: result.materialCostHigh,
                }}
                variant='outline'
                size='sm'
                className='flex-1'
              />
            </div>

            <Button asChild className='w-full'>
              <Link href='/tools/masonry-cost-estimator'>Estimate total repair cost</Link>
            </Button>
          </div>
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
    </>
  )
}

export function TuckpointingCalculatorWidget() {
  // URL-synced state for all form fields
  const defaultState = {
    wallLengthFt: 25,
    wallHeightFt: 8,
    jointDepthIn: 0.75,
    deteriorationPercent: 60,
    brickType: 'standard' as BrickType,
  }

  const { state, setState, getShareableUrl } = useUrlState(defaultState)

  const result = useMemo(() => {
    return estimateTuckpointing({
      wallLengthFt: state.wallLengthFt,
      wallHeightFt: state.wallHeightFt,
      jointDepthIn: state.jointDepthIn,
      deteriorationPercent: state.deteriorationPercent,
      brickType: state.brickType,
    })
  }, [state.wallLengthFt, state.wallHeightFt, state.jointDepthIn, state.deteriorationPercent, state.brickType])

  return (
    <>
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
                <Input
                  type='number'
                  min={1}
                  value={state.wallLengthFt}
                  onChange={(e) => setState({ wallLengthFt: Number(e.target.value) || 1 })}
                />
                <p className='text-xs text-muted-foreground'>Example: 20–40 ft for one wall face.</p>
              </div>

              <div className='space-y-2'>
                <Label>Wall height (ft)</Label>
                <Input
                  type='number'
                  min={1}
                  value={state.wallHeightFt}
                  onChange={(e) => setState({ wallHeightFt: Number(e.target.value) || 1 })}
                />
                <p className='text-xs text-muted-foreground'>Example: 6–10 ft for one story.</p>
              </div>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Mortar depth to remove (in)</Label>
                <Input
                  type='number'
                  min={0.25}
                  step={0.25}
                  value={state.jointDepthIn}
                  onChange={(e) => setState({ jointDepthIn: Number(e.target.value) || 0.5 })}
                />
                <p className='text-xs text-muted-foreground'>Most repointing removes 3/4&quot;–1&quot;.</p>
              </div>

              <div className='space-y-2'>
                <Label>% of joints failing</Label>
                <Input
                  type='number'
                  min={0}
                  max={100}
                  value={state.deteriorationPercent}
                  onChange={(e) => setState({ deteriorationPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                />
                <p className='text-xs text-muted-foreground'>Use 100% if repointing the full wall.</p>
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Brick type</Label>
              <Select value={state.brickType} onValueChange={(v) => setState({ brickType: v as BrickType })}>
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
                {BRICK_TYPES.find((t) => t.value === state.brickType)?.helper}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Results - Desktop sidebar */}
        <div className='hidden lg:block space-y-6'>
          <ResultsContent
            result={result}
            getShareableUrl={getShareableUrl}
            toolState={state}
          />
        </div>
      </div>

      {/* Mobile sticky results bar */}
      <StickyResultsBar
        summary={`${result.bagsNeeded} bags • ${result.laborHoursLow}–${result.laborHoursHigh} hrs`}
        summaryLabel="Materials & labor"
      >
        <ResultsContent
          result={result}
          getShareableUrl={getShareableUrl}
          toolState={state}
        />
      </StickyResultsBar>
    </>
  )
}

export default TuckpointingCalculatorWidget
