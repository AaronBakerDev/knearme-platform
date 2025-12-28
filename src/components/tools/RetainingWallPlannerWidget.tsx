'use client'

/**
 * Retaining Wall Planner widget.
 *
 * Deterministic MVP: materials + safety guidance.
 * See PRD: docs/12-homeowner-tools/retaining-wall-planner.md
 */

import { useMemo } from 'react'
import Link from 'next/link'
import { Ruler, Layers, ShieldAlert, Droplets } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { estimateRetainingWall, type BlockType, type SoilType, type DrainageOption } from '@/lib/tools/retaining-wall'
import { useUrlState, ShareableLinkButton } from '@/components/tools/ToolSharing'
import { StickyResultsBar } from '@/components/tools/ToolResults'
import { PDFExportButton } from '@/components/tools/ToolPDF'

const BLOCK_OPTIONS: Array<{ value: BlockType; label: string; helper: string }> = [
  { value: 'segmental', label: 'Segmental blocks', helper: 'Standard interlocking retaining wall blocks' },
  { value: 'stone', label: 'Natural stone', helper: 'Irregular larger stones, more mortar/backfill' },
  { value: 'concrete', label: 'Concrete blocks', helper: 'Large concrete wall blocks' },
]

const SOIL_OPTIONS: Array<{ value: SoilType; label: string; helper: string }> = [
  { value: 'loam', label: 'Loam (typical)', helper: 'Well‑draining, easiest to work with' },
  { value: 'sand', label: 'Sand', helper: 'Fast draining but can slump' },
  { value: 'clay', label: 'Clay', helper: 'Holds water; needs strong drainage' },
]

const DRAINAGE_OPTIONS: Array<{ value: DrainageOption; label: string; helper: string }> = [
  { value: 'gravel', label: 'Gravel backfill', helper: 'Drainage gravel only' },
  { value: 'pipe', label: 'Perforated drain pipe', helper: 'Pipe + gravel (recommended)' },
  { value: 'none', label: 'None', helper: 'Not recommended except very small walls' },
]

type DiyDifficulty = 'easy' | 'moderate' | 'pro' | 'engineer'

const DIY_TIER_BADGE = {
  easy: { label: 'DIY Friendly', variant: 'default' },
  moderate: { label: 'Moderate DIY', variant: 'secondary' },
  pro: { label: 'Pro Recommended', variant: 'destructive' },
  engineer: { label: 'Engineer Required', variant: 'destructive' },
} as const satisfies Record<DiyDifficulty, { label: string; variant: 'default' | 'secondary' | 'destructive' }>

interface ResultsContentProps {
  estimate: {
    wallAreaSqFt: number
    blocksNeeded: number
    blocksWithWaste: number
    baseGravelCuYd: number
    backfillCuYd: number
    drainagePipeFt: number
    diyDifficulty: DiyDifficulty
    warnings: string[]
    assumptions: string[]
  }
  getShareableUrl: () => string
  toolState: Record<string, unknown>
}

/**
 * Results content component (used in desktop sidebar and mobile sheet).
 * Extracted as separate component to avoid duplication.
 */
function ResultsContent({ estimate, getShareableUrl, toolState }: ResultsContentProps) {
  const tierBadge = DIY_TIER_BADGE[estimate.diyDifficulty]

  return (
    <>
      {estimate.warnings.length > 0 && (
        <Card className='border-destructive/40 bg-destructive/5'>
          <CardHeader className='flex flex-row items-center gap-2'>
            <ShieldAlert className='h-5 w-5 text-destructive' />
            <CardTitle className='text-base'>Safety & permit notes</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 text-sm'>
            {estimate.warnings.map((w) => (
              <p key={w}>• {w}</p>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className='border-0 shadow-sm'>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle>Materials list</CardTitle>
          <Badge variant={tierBadge.variant}>{tierBadge.label}</Badge>
        </CardHeader>
        <CardContent className='space-y-5'>
          <div className='grid gap-3 rounded-lg bg-muted/40 p-4 text-sm'>
            <div className='flex items-center justify-between'>
              <span className='font-medium'>Wall face area</span>
              <span>{estimate.wallAreaSqFt} sq ft</span>
            </div>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center gap-2 font-medium'>
              <Layers className='h-4 w-4 text-primary' />
              Blocks
            </div>
            <ul className='text-sm space-y-1'>
              <li>Blocks needed: <strong>{estimate.blocksNeeded.toLocaleString()}</strong></li>
              <li>With waste: <strong>{estimate.blocksWithWaste.toLocaleString()}</strong> (includes ~8% overage)</li>
            </ul>
          </div>

          <div className='space-y-3'>
            <div className='font-medium'>Base / footing</div>
            <ul className='text-sm space-y-1'>
              <li>Base gravel: <strong>{estimate.baseGravelCuYd} cu yd</strong></li>
            </ul>
          </div>

          <div className='space-y-3'>
            <div className='font-medium'>Backfill & drainage</div>
            <ul className='text-sm space-y-1'>
              <li>Backfill gravel/soil: <strong>{estimate.backfillCuYd} cu yd</strong></li>
              {estimate.drainagePipeFt > 0 && (
                <li>Perforated drain pipe: <strong>{estimate.drainagePipeFt} ft</strong></li>
              )}
            </ul>
          </div>

          <div className='border-t pt-4 space-y-2'>
            <div className='text-xs font-medium uppercase text-muted-foreground'>Assumptions</div>
            <ul className='text-xs text-muted-foreground space-y-1'>
              {estimate.assumptions.map((a) => (
                <li key={a}>• {a}</li>
              ))}
            </ul>
          </div>

          {/* Action buttons */}
          <div className='flex flex-col gap-2 pt-2'>
            <div className='flex gap-2'>
              <ShareableLinkButton
                getUrl={getShareableUrl}
                variant='outline'
                size='sm'
                className='flex-1'
              />
              <PDFExportButton
                toolSlug='retaining-wall-planner'
                toolName='Retaining Wall Planner'
                inputs={toolState}
                results={{
                  wallAreaSqFt: estimate.wallAreaSqFt,
                  blocksNeeded: estimate.blocksNeeded,
                  blocksWithWaste: estimate.blocksWithWaste,
                  baseGravelCuYd: estimate.baseGravelCuYd,
                  backfillCuYd: estimate.backfillCuYd,
                  drainagePipeFt: estimate.drainagePipeFt,
                  diyDifficulty: estimate.diyDifficulty,
                  warnings: estimate.warnings,
                  assumptions: estimate.assumptions,
                }}
                variant='outline'
                size='sm'
                className='flex-1'
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className='border-0 bg-muted/30'>
        <CardContent className='py-4 text-sm flex flex-col gap-2'>
          <Link href='/tools/masonry-cost-estimator' className='underline'>
            Estimate total masonry costs
          </Link>
          <Link href='/services/retaining-walls' className='underline'>
            Learn about retaining wall services
          </Link>
        </CardContent>
      </Card>
    </>
  )
}

export function RetainingWallPlannerWidget() {
  // URL-synced state for all form fields
  const defaultState = {
    wallLength: 12,
    wallHeight: 3,
    blockType: 'segmental' as BlockType,
    soilType: 'loam' as SoilType,
    tieredSlope: false,
    drainage: 'pipe' as DrainageOption,
  }

  const { state, setState, getShareableUrl } = useUrlState(defaultState)

  const estimate = useMemo(() => {
    return estimateRetainingWall({
      wallLengthFt: state.wallLength,
      wallHeightFt: state.wallHeight,
      blockType: state.blockType,
      soilType: state.soilType,
      tieredSlope: state.tieredSlope,
      drainage: state.drainage,
    })
  }, [state.wallLength, state.wallHeight, state.blockType, state.soilType, state.tieredSlope, state.drainage])

  return (
    <>
      <div className='grid gap-6 lg:grid-cols-[1fr,360px]'>
        {/* Inputs */}
        <Card className='border-0 shadow-sm'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Ruler className='h-5 w-5 text-primary' />
              Wall details
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-5'>
            <div className='space-y-2'>
              <Label>Wall length (ft)</Label>
              <Input
                type='number'
                min={2}
                step={1}
                value={state.wallLength}
                onChange={(e) => setState({ wallLength: Math.max(2, Number(e.target.value) || 2) })}
              />
              <p className='text-xs text-muted-foreground'>Measure along the front face of the wall.</p>
            </div>

            <div className='space-y-2'>
              <Label>Wall height (ft)</Label>
              <Input
                type='number'
                min={1}
                step={0.5}
                value={state.wallHeight}
                onChange={(e) => setState({ wallHeight: Math.max(1, Number(e.target.value) || 1) })}
              />
              <p className='text-xs text-muted-foreground'>From finished grade to top of wall.</p>
            </div>

            <div className='space-y-2'>
              <Label>Block type</Label>
              <Select value={state.blockType} onValueChange={(v) => setState({ blockType: v as BlockType })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOCK_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground'>Choose the material you plan to build with.</p>
            </div>

            <div className='space-y-2'>
              <Label>Soil type</Label>
              <Select value={state.soilType} onValueChange={(v) => setState({ soilType: v as SoilType })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOIL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground'>Advanced — affects drainage guidance.</p>
            </div>

            <div className='flex items-center justify-between rounded-lg border p-3'>
              <div>
                <div className='font-medium'>Tiered / sloped site?</div>
                <div className='text-xs text-muted-foreground'>Multiple levels or a steep hillside.</div>
              </div>
              <input
                type='checkbox'
                className='h-5 w-5 accent-primary'
                checked={state.tieredSlope}
                onChange={(e) => setState({ tieredSlope: e.target.checked })}
              />
            </div>

            <div className='space-y-2'>
              <Label className='flex items-center gap-2'>
                <Droplets className='h-4 w-4 text-muted-foreground' />
                Drainage option
              </Label>
              <Select value={state.drainage} onValueChange={(v) => setState({ drainage: v as DrainageOption })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DRAINAGE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground'>{DRAINAGE_OPTIONS.find((d) => d.value === state.drainage)?.helper}</p>
            </div>
          </CardContent>
        </Card>

        {/* Results - Desktop sidebar */}
        <div className='hidden lg:block space-y-6'>
          <ResultsContent
            estimate={estimate}
            getShareableUrl={getShareableUrl}
            toolState={state}
          />
        </div>
      </div>

      {/* Mobile sticky results bar */}
      <StickyResultsBar
        summary={`${estimate.blocksWithWaste.toLocaleString()} blocks needed`}
        summaryLabel="Materials estimate"
      >
        <ResultsContent
          estimate={estimate}
          getShareableUrl={getShareableUrl}
          toolState={state}
        />
      </StickyResultsBar>
    </>
  )
}

export default RetainingWallPlannerWidget
