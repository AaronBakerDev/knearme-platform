/**
 * Tools Hub Index.
 *
 * Public landing page for homeowner tools.
 * Each tool targets a high-intent keyword cluster and feeds into
 * service/city pages for local proof.
 */

import type { Metadata } from 'next'
import { Calculator } from 'lucide-react'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { ToolCategorySection, ToolStartHere, ToolFAQSection, DEFAULT_TOOL_FAQS } from '@/components/tools/ToolHub'
import {
  TOOLS_CATALOG,
  COMING_SOON_TOOLS,
  getCategoryOrder,
  getToolsByCategory,
  getToolBySlug,
} from '@/lib/tools/catalog'
import Script from 'next/script'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com'

export const metadata: Metadata = {
  title: 'Free Masonry Calculators & Checklists | Homeowner Tools | KnearMe',
  description:
    'Free masonry tools for homeowners (no signup required): cost estimator, chimney safety checklist, tuckpointing calculator, brick replacement calculator, and more. Plan your project with confidence.',
  alternates: {
    canonical: `${SITE_URL}/tools`,
  },
  openGraph: {
    title: 'Free Masonry Calculators & Checklists | KnearMe',
    description: 'Free, practical masonry tools for homeowners. No signup required. Plan repairs, estimate costs, assess urgency.',
    type: 'website',
    url: `${SITE_URL}/tools`,
  },
}

// JSON-LD structured data for the tools hub page
const toolsHubSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Masonry Homeowner Tools',
  description: 'Free calculators and checklists for masonry repair planning',
  url: `${SITE_URL}/tools`,
  hasPart: TOOLS_CATALOG.filter((t) => t.status === 'live').map((tool) => ({
    '@type': 'WebPage',
    name: tool.title,
    description: tool.description,
    url: `${SITE_URL}/tools/${tool.slug}`,
  })),
}

export default function ToolsIndexPage() {
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
  ]

  // Get the recommended entry tool
  const recommendedTool = getToolBySlug('masonry-cost-estimator')

  // Get categories in order
  const categories = getCategoryOrder()

  return (
    <div className='min-h-screen bg-background'>
      {/* Structured Data for SEO */}
      <Script
        id="tools-hub-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(toolsHubSchema),
        }}
      />

      {/* Hero Section */}
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
              <span className='block mt-2 text-base font-medium text-primary'>
                No signup required. Always free.
              </span>
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='container mx-auto px-4 py-8 md:py-12 space-y-16'>
        {/* Start Here Section */}
        {recommendedTool && (
          <section>
            <ToolStartHere tool={recommendedTool} />
          </section>
        )}

        {/* Categorized Tool Sections */}
        {categories.map((category) => {
          const tools = getToolsByCategory(category)
          if (tools.length === 0) return null

          return (
            <ToolCategorySection
              key={category}
              category={category}
              tools={tools}
            />
          )
        })}

        {/* FAQ Section */}
        <ToolFAQSection faqs={DEFAULT_TOOL_FAQS} />

        {/* Coming Soon Section (if applicable) */}
        {COMING_SOON_TOOLS.length > 0 && (
          <section className='rounded-2xl border bg-muted/30 p-6 md:p-8 max-w-3xl mx-auto text-center'>
            <h2 className='text-2xl font-semibold mb-3'>More tools coming soon</h2>
            <p className='text-muted-foreground'>
              We&apos;re building a full library of masonry planning tools. If there&apos;s a tool you want, email us and we&apos;ll prioritize it.
            </p>
            <a
              href='mailto:hello@knearme.com'
              className='text-primary font-medium hover:underline inline-block mt-4'
            >
              Request a tool
            </a>
          </section>
        )}
      </main>
    </div>
  )
}
