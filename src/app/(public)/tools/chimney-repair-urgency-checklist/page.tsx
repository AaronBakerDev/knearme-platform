/**
 * Chimney Repair Urgency Checklist (Homeowner tool).
 *
 * Rules-based scoring; no AI.
 * See PRD: docs/12-homeowner-tools/chimney-repair-urgency-checklist.md
 */

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { scoreChimneyUrgency, type ChimneyChecklistInputs } from '@/lib/tools/chimney-urgency'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const DEFAULT_INPUTS: ChimneyChecklistInputs = {
  mortar_cracks: false,
  spalling_bricks: false,
  efflorescence: false,
  water_leak: false,
  crown_damage: false,
  flashing_gap: false,
  leaning: false,
  firebox_debris: false,
  old_chimney: false,
}

const SYMPTOMS: Array<{
  key: keyof ChimneyChecklistInputs
  label: string
  helper: string
}> = [
  {
    key: 'mortar_cracks',
    label: 'Cracked or missing mortar joints',
    helper: 'Gaps or crumbling mortar between bricks.',
  },
  {
    key: 'spalling_bricks',
    label: 'Bricks flaking or breaking (spalling)',
    helper: 'Brick faces popping off or crumbling.',
  },
  {
    key: 'efflorescence',
    label: 'White staining on bricks (efflorescence)',
    helper: 'Powdery white streaks from moisture.',
  },
  {
    key: 'water_leak',
    label: 'Water leaking near chimney',
    helper: 'Dampness, stains, or dripping during rain.',
  },
  {
    key: 'crown_damage',
    label: 'Crown cracked or missing',
    helper: 'Top cement cap has cracks or holes.',
  },
  {
    key: 'flashing_gap',
    label: 'Flashing separated from roof',
    helper: 'Visible gaps where chimney meets shingles.',
  },
  {
    key: 'leaning',
    label: 'Chimney leaning or tilting',
    helper: 'Chimney not plumb or visibly shifting.',
  },
  {
    key: 'firebox_debris',
    label: 'Debris or odors in fireplace',
    helper: 'Bits of mortar/brick or strong musty smell.',
  },
  {
    key: 'old_chimney',
    label: 'Chimney is 25+ years old with no repairs',
    helper: 'Older chimneys often have hidden wear.',
  },
]

function tierCopy(tier: 'monitor' | 'schedule' | 'urgent') {
  switch (tier) {
    case 'monitor':
      return {
        title: 'Monitor / Routine Maintenance',
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        icon: CheckCircle2,
        body: 'Your symptoms suggest minor or early-stage issues. Plan routine maintenance and re-check after heavy weather.',
      }
    case 'schedule':
      return {
        title: 'Schedule an Inspection & Repair',
        color: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200',
        icon: AlertTriangle,
        body: 'You’re showing common repair indicators. A mason should inspect and repair soon to prevent bigger damage.',
      }
    case 'urgent':
      return {
        title: 'Urgent Repair Needed',
        color: 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200',
        icon: ShieldAlert,
        body: 'Your symptoms may indicate structural or safety risks. Avoid using the fireplace and contact a pro immediately.',
      }
  }
}

export default function ChimneyUrgencyChecklistPage() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS)

  const result = useMemo(() => scoreChimneyUrgency(inputs), [inputs])
  const tierMeta = tierCopy(result.tier)
  const TierIcon = tierMeta.icon

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Chimney Checklist', url: '/tools/chimney-repair-urgency-checklist' },
  ]

  return (
    <ToolLayout
      title='Chimney Repair Urgency Checklist'
      description='Answer a few quick questions to understand whether your chimney issues are minor, need scheduling, or require urgent repair.'
      breadcrumbs={breadcrumbs}
    >
      <div className='grid gap-6 lg:grid-cols-[1fr,360px]'>
        {/* Checklist */}
        <Card className='border-0 shadow-sm'>
          <CardHeader>
            <CardTitle>Check any symptoms you see</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {SYMPTOMS.map((s) => (
              <label key={s.key} className='flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/40 cursor-pointer'>
                <input
                  type='checkbox'
                  className='mt-1 h-5 w-5 accent-primary'
                  checked={inputs[s.key]}
                  onChange={(e) => setInputs((prev) => ({ ...prev, [s.key]: e.target.checked }))}
                />
                <div>
                  <div className='font-medium'>{s.label}</div>
                  <div className='text-xs text-muted-foreground mt-1'>{s.helper}</div>
                </div>
              </label>
            ))}

            <div className='text-xs text-muted-foreground leading-relaxed pt-2'>
              This checklist is informational only — it doesn’t replace a professional inspection.
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className='space-y-6'>
          <Card className='border-0 shadow-sm'>
            <CardHeader>
              <CardTitle>Urgency result</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className={cn('rounded-xl p-4', tierMeta.color)}>
                <div className='flex items-center gap-2 mb-2 font-semibold'>
                  <TierIcon className='h-5 w-5' />
                  {tierMeta.title}
                </div>
                <p className='text-sm leading-relaxed'>{tierMeta.body}</p>
                <div className='text-xs mt-3'>Urgency score: {result.score}</div>
              </div>

              {result.likelyRepairs.length > 0 && (
                <div>
                  <Label className='text-sm'>Likely repairs</Label>
                  <ul className='mt-2 space-y-1 text-sm'>
                    {result.likelyRepairs.map((r) => (
                      <li key={r}>• {r}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Button asChild className='w-full'>
                <Link href='/tools/masonry-cost-estimator'>Estimate cost</Link>
              </Button>
            </CardContent>
          </Card>

          {result.reasons.length > 0 && (
            <Card className='border-0 shadow-sm'>
              <CardHeader>
                <CardTitle className='text-base'>Why this result?</CardTitle>
              </CardHeader>
              <CardContent className='text-sm space-y-2'>
                {result.reasons.map((reason) => (
                  <p key={reason}>• {reason}</p>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
