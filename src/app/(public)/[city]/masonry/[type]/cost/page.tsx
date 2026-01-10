/**
 * City Cost Wrapper Page
 *
 * URL: /{city-slug}/masonry/{service-type-slug}/cost
 * Example: /denver-co/masonry/tuckpointing/cost
 *
 * Purpose:
 * - Rank for "{service} cost in {city}" queries.
 * - Provide city-specific context in copy.
 * - Embed the national masonry cost estimator with service pre-selected.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, Badge, Button } from '@/components/ui'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { MasonryCostEstimatorWidget } from '@/components/tools/MasonryCostEstimatorWidget'
import { getServiceById } from '@/lib/services'
import { formatCityName, formatServiceName, getCanonicalUrl } from '@/lib/constants/page-descriptions'

type PageParams = {
  params: Promise<{
    city: string
    type: string
  }>
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { city, type } = await params
  const cityName = formatCityName(city)
  const serviceName = formatServiceName(type)

  const title = `${serviceName} Cost in ${cityName} | Masonry Repair Estimator`
  const description = `See typical ${serviceName.toLowerCase()} costs in ${cityName}. Use our fast estimator to get a planning-level range and learn what drives price.`

  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(`/${city}/masonry/${type}/cost`),
    },
  }
}

export default async function CityMasonryCostPage({ params }: PageParams) {
  const { city, type } = await params

  const service = await getServiceById(type)
  if (!service) notFound()

  // Ensure the city exists; otherwise 404. We only need the slug check.
  const supabase = createAdminClient()
  const { data: cityRow } = await supabase
    .from('cities')
    .select('slug')
    .eq('slug', city)
    .single()

  if (!cityRow) notFound()

  const cityName = formatCityName(city)

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: cityName, url: `/${city}` },
    { name: 'Masonry', url: `/${city}/masonry` },
    { name: service.label, url: `/${city}/masonry/${service.serviceId}` },
    { name: 'Cost', url: `/${city}/masonry/${service.serviceId}/cost` },
  ]

  return (
    <div className='min-h-screen bg-background'>
      <header className='border-b bg-gradient-to-b from-muted/40 to-background'>
        <div className='container mx-auto px-4 py-4'>
          <Breadcrumbs items={breadcrumbs} />
        </div>

        <div className='container mx-auto px-4 py-10 md:py-14'>
          <div className='max-w-3xl'>
            <h1 className='text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-balance mb-3'>
              {service.label} Cost in {cityName}
            </h1>
            <p className='text-lg md:text-xl text-muted-foreground leading-relaxed'>
              Use the estimator below to get a transparent, planning‑level cost range. Local bids in {cityName} may vary based on access, material matching, and structural conditions.
            </p>
          </div>
        </div>
      </header>

      <main className='container mx-auto px-4 py-8 md:py-12'>
        <div className='max-w-5xl mx-auto space-y-8'>
          <Card className='border-0 shadow-sm'>
            <CardContent className='p-6 md:p-8 space-y-4 text-sm text-muted-foreground leading-relaxed'>
              <div className='flex items-center gap-2 text-primary font-medium'>
                <MapPin className='h-4 w-4' />
                Local context
              </div>
              <p>
                Nationally, {service.label.toLowerCase()} pricing is driven by the size of the repair, severity of deterioration, and job access. In {cityName}, costs are usually within the same national bands, but can trend higher or lower depending on labor rates and permit requirements.
              </p>
              <div className='flex flex-wrap gap-2'>
                <Badge variant='secondary'>National planning averages</Badge>
                <Badge variant='secondary'>Updated Dec 2025</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Embedded estimator */}
          <MasonryCostEstimatorWidget initialServiceId={service.serviceId} />

          <Card className='border-0 shadow-sm'>
            <CardContent className='p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
              <div>
                <h2 className='text-xl font-semibold mb-1'>Ready to get exact bids?</h2>
                <p className='text-sm text-muted-foreground'>
                  Compare 2–3 local contractors in {cityName} to confirm your final price.
                </p>
              </div>
              <div className='flex flex-wrap gap-3'>
                <Button asChild className='rounded-full'>
                  <Link href={`/${city}/masonry/${service.serviceId}#find-contractors`}>Find local pros</Link>
                </Button>
                <Button asChild variant='outline' className='rounded-full'>
                  <Link href={`/${city}/masonry/${service.serviceId}`}>See projects</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
