/**
 * Tools Hub Index.
 *
 * Public landing page for homeowner tools.
 * Each tool targets a high-intent keyword cluster and feeds into
 * service/city pages for local proof.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { Calculator, AlertTriangle, Wrench, Layers } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com'

export const metadata: Metadata = {
  title: 'Homeowner Tools | Masonry Calculators & Checklists | KnearMe',
  description:
    'Free, practical tools for homeowners planning masonry repairs: cost estimator, chimney safety checklist, tuckpointing calculator, and more.',
  alternates: {
    canonical: `${SITE_URL}/tools`,
  },
  openGraph: {
    title: 'Homeowner Tools | KnearMe',
    description: 'Practical masonry calculators and checklists for homeowners.',
    type: 'website',
    url: `${SITE_URL}/tools`,
  },
}

const TOOLS = [
  {
    slug: 'masonry-cost-estimator',
    title: 'Masonry Repair Cost Estimator',
    description: 'Get a planning-level cost range for common masonry repairs in your city.',
    icon: Calculator,
    badge: 'New',
    disabled: false,
  },
  {
    slug: 'chimney-repair-urgency-checklist',
    title: 'Chimney Repair Urgency Checklist',
    description: 'Quickly understand how serious your chimney symptoms are and what to do next.',
    icon: AlertTriangle,
    badge: 'New',
    disabled: false,
  },
  {
    slug: 'tuckpointing-calculator',
    title: 'Tuckpointing Material + Labor Calculator',
    description: 'Estimate mortar volume, bags needed, and labor time for tuckpointing.',
    icon: Wrench,
    badge: 'New',
    disabled: false,
  },
  {
    slug: 'brick-replacement-calculator',
    title: 'Brick Replacement Calculator',
    description: 'Estimate brick count and a planning budget for spot brick replacement.',
    icon: Calculator,
    badge: 'New',
    disabled: false,
  },
  {
    slug: 'retaining-wall-planner',
    title: 'Retaining Wall Planner',
    description: 'Estimate blocks, base gravel, drainage needs, and safety limits for a straight retaining wall.',
    icon: Layers,
    badge: 'New',
    disabled: false,
  },
] as const

export default function ToolsIndexPage() {
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
  ]

  return (
    <div className='min-h-screen bg-background'>
      <header className='border-b bg-gradient-to-b from-muted/40 to-background'>
        <div className='container mx-auto px-4 py-4'>
          <Breadcrumbs items={breadcrumbItems} />
        </div>
        <div className='container mx-auto px-4 py-10 md:py-14'>
          <div className='max-w-3xl'>
            <div className='flex items-center gap-2 mb-4'>
              <Calculator className='h-6 w-6 text-primary' />
              <span className='text-sm font-medium text-primary'>Homeowner Tools</span>
            </div>
            <h1 className='text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4'>
              Practical Masonry Tools for Homeowners
            </h1>
            <p className='text-lg md:text-xl text-muted-foreground leading-relaxed'>
              Budget repairs, scope your project, and understand urgency with free, easy tools built for real homes.
            </p>
          </div>
        </div>
      </header>

      <main className='container mx-auto px-4 py-8 md:py-12'>
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {TOOLS.map((tool) => {
            const Icon = tool.icon
            const card = (
              <Card className='h-full border-0 shadow-sm hover:shadow-md transition-shadow duration-200'>
                <CardHeader className='space-y-3'>
                  <div className='flex items-start justify-between'>
                    <div className='h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center'>
                      <Icon className='h-6 w-6 text-primary' />
                    </div>
                    {tool.badge && (
                      <Badge variant={tool.disabled ? 'secondary' : 'default'} className='text-xs'>
                        {tool.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className='text-xl'>{tool.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground leading-relaxed'>{tool.description}</p>
                </CardContent>
              </Card>
            )

            if (tool.disabled) {
              return (
                <div key={tool.slug} className='opacity-70'>
                  {card}
                </div>
              )
            }

            return (
              <Link key={tool.slug} href={`/tools/${tool.slug}`} className='group'>
                {card}
              </Link>
            )
          })}
        </div>

        <section className='mt-12 rounded-2xl border bg-muted/30 p-6 md:p-8 max-w-3xl mx-auto text-center'>
          <h2 className='text-2xl font-semibold mb-3'>More tools coming soon</h2>
          <p className='text-muted-foreground'>
            We’re building a full library of masonry planning tools. If there’s a tool you want, email us and we’ll prioritize it.
          </p>
          <a href='mailto:hello@knearme.com' className='text-primary font-medium hover:underline inline-block mt-4'>
            Request a tool
          </a>
        </section>
      </main>
    </div>
  )
}
