/**
 * National Service Landing Page - SEO-optimized page for service types.
 *
 * URL Structure: /services/{service-type-slug}
 * Example: /services/chimney-repair
 *
 * Design: "Craft & Earth" aesthetic with:
 * - Dramatic hero with gradient and stats
 * - Editorial typography with serif headlines
 * - Animated project gallery
 * - Interactive FAQ accordion
 * - City discovery section with hover effects
 *
 * @see /docs/11-seo-discovery/page-templates/national-service.md
 * @see /src/lib/seo/structured-data.ts for schema generators
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin,
  Building2,
  Hammer,
  Calendar,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Users,
  Star,
} from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import {
  Badge, Button, Card, CardContent,
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from '@/components/ui';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import {
  generateFAQSchema,
  generateNationalServiceSchema,
  generateServiceHowToSchema,
  schemaToString,
} from '@/lib/seo/structured-data';
import { getPublicUrl } from '@/lib/storage/upload';
import {
  getCitiesByServiceType,
  getFeaturedProjectsByService,
  getProjectCountByService,
  getContractorCountByService,
} from '@/lib/data/services';
import { getServiceBySlug, getServiceSlugs, getServiceCatalog } from '@/lib/services';
import { RelatedArticles } from '@/components/content/RelatedArticles';
import { SERVICE_ICONS } from '@/lib/constants/page-descriptions';

type PageParams = {
  params: Promise<{
    type: string;
  }>;
};

// SERVICE_ICONS imported from @/lib/constants/page-descriptions

/**
 * Generate static params for national service pages.
 * Dynamically fetches service types from database.
 */
export async function generateStaticParams() {
  const slugs = await getServiceSlugs();
  return slugs.map((slug) => ({ type: slug }));
}

/**
 * Generate SEO metadata for the service page.
 */
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { type } = await params;

  // Validate service type exists in catalog
  const service = await getServiceBySlug(type);
  if (!service) {
    return { title: 'Service Not Found' };
  }

  const serviceId = service.serviceId;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';

  // Fetch cover image from most recent project for OG
  const supabase = createAdminClient();
  const { data: projectData } = await supabase
    .from('projects')
    .select('project_images!project_images_project_id_fkey(storage_path, alt_text, display_order)')
    .eq('project_type_slug', serviceId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .single();

  type ProjectWithImages = {
    project_images: Array<{ storage_path: string; alt_text: string | null; display_order: number }>;
  };
  const project = projectData as ProjectWithImages | null;

  let imageUrl: string | undefined;
  let imageAlt: string | undefined;

  if (project?.project_images?.length) {
    const sortedImages = [...project.project_images].sort(
      (a, b) => a.display_order - b.display_order
    );
    const coverImage = sortedImages[0];
    if (coverImage) {
      imageUrl = getPublicUrl('project-images', coverImage.storage_path);
      imageAlt = coverImage.alt_text || `${service.label} project example`;
    }
  }

  const title = `${service.label}: Complete Guide, Costs & Local Contractors | KnearMe`;
  const description = `Everything you need to know about ${service.label.toLowerCase()}: what it is, when you need it, typical costs, and how to find qualified contractors in your area.`;

  return {
    title,
    description,
    keywords: service.keywords.join(', '),
    openGraph: {
      title: `${service.label} Guide & Contractors`,
      description,
      type: 'article',
      url: `${siteUrl}/services/${type}`,
      images: imageUrl ? [{ url: imageUrl, alt: imageAlt }] : [],
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: `${siteUrl}/services/${type}`,
    },
  };
}

/**
 * National Service Landing Page Component.
 */
export default async function NationalServicePage({ params }: PageParams) {
  const { type } = await params;

  // Validate service type exists in catalog
  const service = await getServiceBySlug(type);
  if (!service) {
    notFound();
  }

  const serviceId = service.serviceId;

  // Fetch data in parallel
  const [cities, featuredProjects, projectCount, contractorCount, allServices] = await Promise.all([
    getCitiesByServiceType(serviceId),
    getFeaturedProjectsByService(serviceId, 6),
    getProjectCountByService(serviceId),
    getContractorCountByService(serviceId),
    getServiceCatalog(), // For related services lookup
  ]);

  // Build related services lookup
  const servicesById = new Map(allServices.map((s) => [s.serviceId, s]));

  const icon = service.iconEmoji || SERVICE_ICONS[type] || '🔧';

  // Breadcrumb items
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Services', url: '/services' },
    { name: service.label, url: `/services/${type}` },
  ];

  // Generate structured data
  const faqSchema = service.faqs?.length ? generateFAQSchema(service.faqs) : null;

  const serviceSchema = generateNationalServiceSchema(
    {
      name: service.label,
      slug: type,
      description: service.shortDescription,
    },
    cities.map((c) => ({ cityName: c.cityName, state: c.state })),
    { projectCount, contractorCount }
  );

  const processSchema = generateServiceHowToSchema(
    {
      name: service.label,
      slug: type,
      description: service.shortDescription,
    },
    service.processSteps
  );

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaToString(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaToString(processSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaToString(faqSchema) }}
        />
      )}

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <header className="relative bg-hero-gradient hero-pattern overflow-hidden">
          {/* Breadcrumbs */}
          <div className="container mx-auto px-4 pt-4">
            <Breadcrumbs items={breadcrumbItems} />
          </div>

          {/* Hero Content */}
          <div className="container mx-auto px-4 py-16 md:py-20 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Content */}
              <div>
                {/* Icon */}
                <span
                  className="inline-block text-5xl md:text-6xl mb-6 animate-fade-up opacity-0 stagger-1"
                  role="img"
                  aria-label={service.label}
                >
                  {icon}
                </span>

                {/* Headline */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-display tracking-tight text-balance mb-6 animate-fade-up opacity-0 stagger-2">
                  {service.label}
                </h1>

                {/* Subheadline */}
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-8 animate-fade-up opacity-0 stagger-3">
                  {service.shortDescription}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-4 mb-8 animate-fade-up opacity-0 stagger-4">
                  <Button size="lg" className="rounded-full px-8 shadow-depth" asChild>
                    <a href="#find-contractors">Find Local Contractors</a>
                  </Button>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="rounded-full px-8"
                    asChild
                  >
                    <a href={`/tools/masonry-cost-estimator?service=${serviceId}`}>Estimate Cost</a>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full px-8"
                    asChild
                  >
                    <a href="#faq">View FAQs</a>
                  </Button>
                </div>
              </div>

              {/* Right: Stats Cards */}
              <div className="grid grid-cols-2 gap-4 animate-fade-up opacity-0 stagger-5">
                <Card className="border-0 shadow-depth bg-card">
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Hammer className="h-6 w-6 text-primary" />
                    </div>
                    <span className="block text-3xl md:text-4xl font-display text-primary mb-1">
                      {projectCount.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">Projects</span>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-depth bg-card">
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <span className="block text-3xl md:text-4xl font-display mb-1">
                      {contractorCount.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">Contractors</span>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-depth bg-card">
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <span className="block text-3xl md:text-4xl font-display mb-1">
                      {cities.length.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">Cities</span>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-depth bg-card">
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Star className="h-6 w-6 text-primary" />
                    </div>
                    <span className="block text-3xl md:text-4xl font-display mb-1">
                      4.8
                    </span>
                    <span className="text-sm text-muted-foreground">Avg Rating</span>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </header>

        <main>
          {/* About Section */}
          <section className="container mx-auto px-4 py-16 md:py-20">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-3xl md:text-4xl font-display">
                  What is {service.label}?
                </h2>
              </div>

              <div className="mb-8 rounded-2xl border bg-muted/30 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Planning your project?</h3>
                  <p className="text-sm text-muted-foreground">
                    Use our tools to budget and scope repairs before you request bids.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="secondary" className="rounded-full">
                    <Link href={`/tools/masonry-cost-estimator?service=${serviceId}`}>Cost Estimator</Link>
                  </Button>
                  {serviceId === 'chimney-repair' && (
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href="/tools/chimney-repair-urgency-checklist">Check Urgency</Link>
                    </Button>
                  )}
                  {serviceId === 'tuckpointing' && (
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href="/tools/tuckpointing-calculator">Materials Calculator</Link>
                    </Button>
                  )}
                  {serviceId === 'brick-repair' && (
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href="/tools/brick-replacement-calculator">Brick Count Calculator</Link>
                    </Button>
                  )}
                  {serviceId === 'foundation-repair' && (
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href="/tools/foundation-crack-severity-checker">Check Crack Severity</Link>
                    </Button>
                  )}
                  {serviceId === 'efflorescence-removal' && (
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href="/tools/efflorescence-treatment-planner">Treatment Planner</Link>
                    </Button>
                  )}
                  {serviceId === 'waterproofing' && (
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href="/tools/waterproofing-risk-checklist">Moisture Risk Checklist</Link>
                    </Button>
                  )}
                </div>
              </div>
              <div
                className="prose-earth max-w-[72ch] leading-relaxed prose-headings:tracking-tight prose-p:text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: service.longDescription }}
              />
            </div>
          </section>

          {/* Common Issues Section */}
          <section className="bg-section-gradient py-16 md:py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-display">
                    Common Issues We Address
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {service.commonIssues.map((issue, index) => (
                    <div
                      key={index}
                      className="group flex items-start gap-4 p-5 bg-card rounded-2xl shadow-depth hover:shadow-elevated transition-all duration-300"
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-foreground">{issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Process Overview */}
          {service.processSteps.length > 0 && (
            <section className="container mx-auto px-4 py-16 md:py-20">
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-3xl md:text-4xl font-display">Process Overview</h2>
                    <p className="text-muted-foreground">
                      How professional contractors handle {service.label.toLowerCase()} from start to finish
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {service.processSteps.map((step, index) => (
                    <Card
                      key={step.title}
                      className="border-0 shadow-depth bg-card h-full"
                    >
                      <CardContent className="p-6 space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="h-10 w-10 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <div>
                            <h3 className="font-semibold text-lg">{step.title}</h3>
                            {step.duration && (
                              <Badge variant="outline" className="mt-1">
                                {step.duration}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-muted-foreground">{step.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Cost Factors */}
          {service.costFactors.length > 0 && (
            <section className="bg-section-gradient py-16 md:py-20">
              <div className="container mx-auto px-4">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Lightbulb className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-3xl md:text-4xl font-display">Cost Factors</h2>
                    <p className="text-muted-foreground">
                      What typically drives the price of {service.label.toLowerCase()}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {service.costFactors.map((factor) => (
                    <Card key={factor.label} className="border-0 shadow-depth bg-card h-full">
                      <CardContent className="p-5 space-y-2">
                        <h3 className="font-semibold">{factor.label}</h3>
                        <p className="text-muted-foreground text-sm">{factor.description}</p>
                        {factor.typicalRange && (
                          <Badge variant="secondary" className="w-fit">
                            {factor.typicalRange}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Featured Projects Section */}
          {featuredProjects.length > 0 && (
            <section className="container mx-auto px-4 py-16 md:py-20">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-display">
                    Featured Projects
                  </h2>
                </div>
                <Link
                  href={`/denver-co/masonry/${serviceId}`}
                  className="hidden md:flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all"
                >
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/${project.city_slug}/masonry/${project.project_type_slug}/${project.slug}`}
                    className="group"
                  >
                    <Card className="card-interactive h-full border-0 shadow-depth overflow-hidden">
                      {/* Project Image */}
                      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                        {project.cover_image ? (
                          <Image
                            src={getPublicUrl('project-images', project.cover_image.storage_path)}
                            alt={project.cover_image.alt_text || project.title || 'Project'}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            placeholder="blur"
                            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMSAxIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4="
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                            <Building2 className="h-16 w-16 opacity-30" />
                          </div>
                        )}
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>

                      <CardContent className="p-5">
                        <h3 className="font-semibold text-lg line-clamp-2 mb-3 group-hover:text-primary transition-colors">
                          {project.title}
                        </h3>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />
                            {project.business?.city || project.city},{' '}
                            {project.business?.state || ''}
                          </span>
                          {project.published_at && (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              {new Date(project.published_at).toLocaleDateString('en-US', {
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Mobile View All Link */}
              <div className="mt-6 text-center md:hidden">
                <Button variant="outline" className="rounded-full" asChild>
                  <Link href={`/denver-co/masonry/${serviceId}`}>
                    View All Projects
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </section>
          )}

          {/* Find by City Section */}
          {cities.length > 0 && (
            <section
              id="find-contractors"
              className="bg-section-gradient py-16 md:py-20 scroll-mt-8"
            >
              <div className="container mx-auto px-4">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-3xl md:text-4xl font-display">
                      Find {service.label} by City
                    </h2>
                    <p className="text-muted-foreground mt-1">
                      Connect with local contractors in your area
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {cities.slice(0, 24).map((city) => (
                    <Link
                      key={city.citySlug}
                      href={`/${city.citySlug}/masonry/${serviceId}`}
                      className="group"
                    >
                      <Card className="card-interactive border-0 shadow-depth">
                        <CardContent className="p-5 flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold group-hover:text-primary transition-colors">
                              {city.cityName}, {city.state}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {city.projectCount}{' '}
                              {city.projectCount === 1 ? 'project' : 'projects'}
                            </p>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {cities.length > 24 && (
                  <p className="text-center text-muted-foreground mt-8">
                    + {cities.length - 24} more cities available
                  </p>
                )}
              </div>
            </section>
          )}

          {/* FAQ Section */}
          {service.faqs && service.faqs.length > 0 && (
            <section id="faq" className="container mx-auto px-4 py-16 md:py-20 scroll-mt-8">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Lightbulb className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-display">
                    Frequently Asked Questions
                  </h2>
                </div>

                <Accordion type="single" collapsible className="space-y-4">
                  {service.faqs.map((faq, index) => (
                    <AccordionItem
                      key={index}
                      value={`item-${index}`}
                      className="bg-card rounded-2xl shadow-depth border-0 px-6 overflow-hidden"
                    >
                      <AccordionTrigger className="text-left py-5 hover:no-underline [&[data-state=open]>div]:bg-primary/10">
                        <div className="flex items-center gap-4">
                          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 transition-colors">
                            <span className="text-sm font-semibold text-muted-foreground">
                              {index + 1}
                            </span>
                          </div>
                          <span className="font-semibold">{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-5 pl-12">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </section>
          )}

          {/* Related Articles Section */}
          <RelatedArticles
            serviceSlug={serviceId}
            title={`${service.label} Guides`}
            className="container mx-auto px-4 py-16 md:py-20"
          />

          {/* Related Services Section */}
          {service.relatedServices.length > 0 && (
            <section className="container mx-auto px-4 pb-16 md:pb-20">
              <div className="max-w-4xl mx-auto">
                <Card className="border-0 shadow-depth bg-gradient-to-br from-primary/5 via-card to-card">
                  <CardContent className="p-8">
                    <h2 className="text-xl font-display mb-6">Related Services</h2>
                    <div className="flex flex-wrap gap-3">
                      {service.relatedServices.map((relatedId) => {
                        const related = servicesById.get(relatedId);
                        if (!related) return null;

                        return (
                          <Link key={relatedId} href={`/services/${related.urlSlug}`}>
                            <Badge
                              variant="secondary"
                              className="cursor-pointer bg-background hover:bg-primary/10 hover:border-primary/30 border border-transparent transition-all px-4 py-2 text-sm"
                            >
                              <span className="mr-2">{related.iconEmoji}</span>
                              {related.label}
                            </Badge>
                          </Link>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          )}
        </main>

        {/* Footer CTA */}
        <footer className="bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 py-16 md:py-20">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-sm font-medium mb-6">
                <CheckCircle2 className="h-4 w-4" />
                Verified contractors only
              </span>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-display tracking-tight mb-4">
                Need Professional {service.label}?
              </h2>
              <p className="text-lg md:text-xl opacity-90 mb-8">
                Browse projects from verified contractors and find the right professional
                for your {service.label.toLowerCase()} needs.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  variant="secondary"
                  className="rounded-full px-8 text-primary font-semibold shadow-lg"
                  asChild
                >
                  <Link href="/signup">List Your Business</Link>
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="rounded-full px-8 text-primary-foreground hover:bg-white/10"
                  asChild
                >
                  <Link href="/services">Browse All Services</Link>
                </Button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

// ISR: Revalidate daily
export const revalidate = 86400;
