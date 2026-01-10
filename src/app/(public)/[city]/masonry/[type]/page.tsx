/**
 * Service Type by City Page - SEO-optimized landing page for specific masonry services in a city.
 *
 * URL Structure: /{city-slug}/masonry/{service-type-slug}
 * Example: /denver-co/masonry/chimney-repair
 *
 * Features:
 * - Server-rendered for SEO
 * - Lists all published projects of this type in the city
 * - Shows contractors who offer this service
 * - Service-specific SEO descriptions
 * - JSON-LD structured data for services
 *
 * @see /docs/SEO-DISCOVERY-STRATEGY.md for programmatic SEO architecture
 * @see /src/lib/seo/structured-data.ts for schema generators
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Building2, Wrench, ArrowRight, Hammer, Calendar } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { Badge, Button } from '@/components/ui';
import { PublicBreadcrumbHeader } from '@/components/seo/PublicBreadcrumbHeader';
import { ProjectGridCard } from '@/components/seo/ProjectGridCard';
import { ServiceProviderCard } from '@/components/seo/ServiceProviderCard';
import {
  generateProjectListSchema,
  generateServiceSchema,
  schemaToString,
} from '@/lib/seo/structured-data';
import {
  buildOpenGraphMeta,
  buildTwitterMeta,
  selectCoverImage,
  type CoverImage,
} from '@/lib/seo/metadata-helpers';
import { SERVICE_TYPE_DESCRIPTIONS } from '@/lib/seo/service-type-descriptions';
import { getPublicUrl } from '@/lib/storage/upload';
import { getServiceById } from '@/lib/services';
import { formatCityName, formatServiceName, getCanonicalUrl } from '@/lib/constants/page-descriptions';
import { logger } from '@/lib/logging';
import type { Business, Project, ProjectImage } from '@/types/database';

type PageParams = {
  params: Promise<{
    city: string;
    type: string;
  }>;
};

/**
 * Type for project with business and cover image.
 */
type ProjectWithDetails = Project & {
  business: Business;
  cover_image?: CoverImage;
};

/**
 * Get service info from Service Catalog.
 */
async function getServiceInfo(typeSlug: string): Promise<{ id: string; label: string; icon: string }> {
  const service = await getServiceById(typeSlug);
  if (service) {
    return { id: service.serviceId, label: service.label, icon: service.iconEmoji };
  }
  return { id: typeSlug, label: formatServiceName(typeSlug), icon: '🔧' };
}

/**
 * Generate static params for pre-rendering service type pages.
 * Generates for all city + service type combinations with published projects.
 */
export async function generateStaticParams() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    logger.info('[generateStaticParams] Skipping: SUPABASE_SERVICE_ROLE_KEY not configured');
    return [];
  }

  try {
    const supabase = createAdminClient();

    // Get unique city + service type combinations with published projects
    const { data: projects } = await supabase
      .from('projects')
      .select('city_slug, project_type_slug')
      .eq('status', 'published')
      .not('city_slug', 'is', null)
      .not('project_type_slug', 'is', null)
      .limit(1000) as { data: Array<{ city_slug: string; project_type_slug: string }> | null };

    if (!projects) return [];

    // Build unique combinations
    const combinations = new Set<string>();
    projects.forEach((p) => {
      combinations.add(`${p.city_slug}|${p.project_type_slug}`);
    });

    return Array.from(combinations).map((combo) => {
      const [city, type] = combo.split('|');
      return { city, type };
    });
  } catch (error) {
    logger.error('[generateStaticParams] Error fetching combinations', { error });
    return [];
  }
}

/**
 * Generate metadata for SEO including OG/Twitter images.
 * Creates unique, service-specific meta descriptions.
 */
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { city, type } = await params;
  const cityName = formatCityName(city);
  const serviceInfo = await getServiceInfo(type);
  const supabase = createAdminClient();

  // Fetch first published project's cover image for OG
  const { data: projectData } = await supabase
    .from('projects')
    .select(`project_images!project_images_project_id_fkey(storage_path, alt_text, display_order)`)
    .eq('city_slug', city)
    .eq('project_type_slug', type)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .single();

  type ProjectWithImages = {
    project_images: Array<{ storage_path: string; alt_text: string | null; display_order: number }>;
  };
  const project = projectData as ProjectWithImages | null;

  const coverImage = selectCoverImage(project?.project_images);
  const imageUrl = coverImage
    ? getPublicUrl('project-images', coverImage.storage_path)
    : undefined;
  const imageAlt = coverImage?.alt_text || `${serviceInfo.label} project in ${cityName}`;

  const title = `${serviceInfo.label} in ${cityName} | Projects & Contractors`;

  // Use service-specific description or generate generic one
  const serviceDesc = SERVICE_TYPE_DESCRIPTIONS[type];
  const description = serviceDesc
    ? serviceDesc.description.replace('{city}', cityName)
    : `Browse ${serviceInfo.label.toLowerCase()} projects in ${cityName}. View completed work from local masonry contractors and find the right professional for your project.`;

  const keywords = [
    `${serviceInfo.label.toLowerCase()} ${cityName}`,
    `${type} contractors ${cityName}`,
    `masonry ${cityName}`,
    `${type} near me`,
    `${serviceInfo.label.toLowerCase()} services`,
  ].join(', ');
  const canonicalUrl = getCanonicalUrl(`/${city}/masonry/${type}`);

  return {
    title,
    description,
    keywords,
    openGraph: buildOpenGraphMeta({
      title,
      description,
      url: canonicalUrl,
      imageUrl,
      imageAlt,
    }),
    twitter: buildTwitterMeta({
      title,
      description,
      imageUrl,
    }),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

/**
 * Service Type by City Page Component.
 */
export default async function ServiceTypePage({ params }: PageParams) {
  const { city, type } = await params;
  const supabase = createAdminClient();

  // Fetch published projects of this type in this city
  const { data: projectsData, error: projectsError } = await supabase
    .from('projects')
    .select(`
      *,
      business:businesses(*),
      project_images!project_images_project_id_fkey(*)
    `)
    .eq('city_slug', city)
    .eq('project_type_slug', type)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);

  if (projectsError) {
    logger.error('[ServiceTypePage] Error fetching projects', { error: projectsError });
  }

  // Type assertion for query result
  type ProjectWithRelations = Project & {
    business: Business;
    project_images: ProjectImage[];
  };
  const projects = (projectsData || []) as ProjectWithRelations[];

  // If no projects of this type in this city, show 404
  if (projects.length === 0) {
    notFound();
  }

  // Add cover image to each project
  const projectsWithDetails: ProjectWithDetails[] = projects.map((project) => ({
    ...project,
    cover_image: selectCoverImage(project.project_images) ?? undefined,
  }));

  // Get unique businesses who have done this type of work
  const businessesMap = new Map<string, Business>();
  projects.forEach((p) => {
    if (p.business && !businessesMap.has(p.business.id)) {
      businessesMap.set(p.business.id, p.business);
    }
  });
  const businesses = Array.from(businessesMap.values());

  // Get other service types available in this city (for internal linking)
  const { data: otherTypesData } = await supabase
    .from('projects')
    .select('project_type_slug, project_type')
    .eq('city_slug', city)
    .eq('status', 'published')
    .neq('project_type_slug', type)
    .not('project_type_slug', 'is', null);

  const otherTypes = new Map<string, { slug: string; name: string; count: number }>();
  (otherTypesData || []).forEach((p: { project_type_slug: string; project_type: string }) => {
    if (p.project_type_slug && p.project_type) {
      const existing = otherTypes.get(p.project_type_slug);
      if (existing) {
        existing.count++;
      } else {
        otherTypes.set(p.project_type_slug, {
          slug: p.project_type_slug,
          name: p.project_type,
          count: 1,
        });
      }
    }
  });
  const sortedOtherTypes = Array.from(otherTypes.values()).sort(
    (a, b) => b.count - a.count
  );

  const cityName = formatCityName(city);
  const serviceInfo = await getServiceInfo(type);
  const serviceDesc = SERVICE_TYPE_DESCRIPTIONS[type];

  // Breadcrumb items for navigation and schema
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: cityName, url: `/${city}` },
    { name: 'Masonry', url: `/${city}/masonry` },
    { name: serviceInfo.label, url: `/${city}/masonry/${type}` },
  ];

  // Extract state from city name for structured data
  const cityParts = cityName.split(', ');
  const cityDisplayName = cityParts[0] || cityName;
  const stateCode = cityParts[1] || '';

  // Generate structured data - ItemList for projects
  const projectListSchema = generateProjectListSchema(
    projects.map((p) => ({ ...p, business: p.business })),
    `${serviceInfo.label} Projects in ${cityName}`
  );

  // Generate Service schema for SEO
  const serviceSchema = generateServiceSchema(
    {
      name: serviceInfo.label,
      slug: type,
      description: serviceDesc?.description.replace('{city}', cityName) ||
        `Professional ${serviceInfo.label.toLowerCase()} services in ${cityName}`,
    },
    {
      city: cityDisplayName,
      citySlug: city,
      state: stateCode,
    },
    {
      projectCount: projects.length,
      contractorCount: businesses.length,
      providers: businesses.slice(0, 5).map((b) => ({
        name: b.name || 'Business',
        slug: b.slug || b.id,
        citySlug: b.city_slug || city,
      })),
    }
  );

  return (
    <>
      {/* JSON-LD Structured Data - ItemList for projects */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaToString(projectListSchema) }}
      />
      {/* JSON-LD Structured Data - Service schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaToString(serviceSchema) }}
      />

      <div className="min-h-screen bg-background">
        {/* Header with Breadcrumbs */}
        <PublicBreadcrumbHeader items={breadcrumbItems} />

        <main className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8 md:p-12">
              <div className="text-4xl mb-4">{serviceInfo.icon}</div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                {serviceInfo.label} in {cityName}
              </h1>
              <p className="text-lg text-muted-foreground mb-6 max-w-[72ch] mx-auto leading-relaxed">
                {serviceDesc?.headline || `Professional ${serviceInfo.label.toLowerCase()} services`}
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Hammer className="h-4 w-4" />
                  {projects.length} completed {projects.length === 1 ? 'project' : 'projects'}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {businesses.length} local {businesses.length === 1 ? 'business' : 'businesses'}
                </span>
              </div>
            </div>
          </div>

          {/* Service Description (SEO content) */}
          {serviceDesc && (
            <div className="max-w-4xl mx-auto mb-12">
              <div className="prose prose-gray max-w-[72ch] leading-relaxed prose-headings:tracking-tight prose-p:text-muted-foreground">
                <p className="text-muted-foreground leading-relaxed">
                  {serviceDesc.description.replace('{city}', cityName)}
                </p>
              </div>
              {serviceDesc.features.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {serviceDesc.features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Businesses Section */}
          {businesses.length > 0 && (
            <div className="max-w-4xl mx-auto mb-12">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Businesses Offering {serviceInfo.label}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {businesses.slice(0, 4).map((business) => (
                  <ServiceProviderCard
                    key={business.id}
                    href={`/businesses/${business.city_slug}/${business.slug || business.id}`}
                    name={business.name || 'Business'}
                    photoUrl={business.profile_photo_url}
                    subtitle={business.services?.slice(0, 2).join(', ') || ''}
                  />
                ))}
              </div>
              {businesses.length > 4 && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  + {businesses.length - 4} more businesses offering this service
                </p>
              )}
            </div>
          )}

          {/* Other Services in City (Internal Linking) */}
          {sortedOtherTypes.length > 0 && (
            <div className="max-w-4xl mx-auto mb-12">
              <div className="bg-muted/30 rounded-xl p-5">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  Other Masonry Services in {cityName}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {sortedOtherTypes.slice(0, 8).map((serviceType) => (
                    <Link
                      key={serviceType.slug}
                      href={`/${city}/masonry/${serviceType.slug}`}
                    >
                      <Badge
                        variant="secondary"
                        className="cursor-pointer bg-background hover:bg-primary/10 hover:border-primary/30 border border-transparent transition-all px-3 py-1.5"
                      >
                        {serviceType.name} <span className="text-muted-foreground ml-1">({serviceType.count})</span>
                      </Badge>
                    </Link>
                  ))}
                </div>
                <Link
                  href={`/${city}/masonry`}
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-4"
                >
                  View all masonry services in {cityName}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Projects Grid */}
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 tracking-tight">
              {serviceInfo.label} Projects
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectsWithDetails.map((project) => (
                <ProjectGridCard
                  key={project.id}
                  href={`/${project.city_slug}/masonry/${project.project_type_slug}/${project.slug}`}
                  title={project.title || 'Project'}
                  imageUrl={project.cover_image
                    ? getPublicUrl('project-images', project.cover_image.storage_path)
                    : undefined}
                  imageAlt={project.cover_image?.alt_text || project.title}
                  meta={(
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="truncate">
                        by {project.business?.name || 'Unknown'}
                      </span>
                      {project.published_at && (
                        <span className="flex items-center gap-1 text-xs flex-shrink-0 ml-2">
                          <Calendar className="h-3 w-3" />
                          {new Date(project.published_at).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  )}
                />
              ))}
            </div>
          </div>
        </main>

        {/* Footer CTA */}
        <footer className="mt-12 py-12 bg-gradient-to-b from-muted/30 to-muted/10">
          <div className="container mx-auto px-4 text-center">
            <p className="text-lg font-medium mb-2 max-w-[70ch] mx-auto leading-relaxed">
              Need {serviceInfo.label.toLowerCase()} in {cityName}?
            </p>
            <p className="text-muted-foreground mb-6 max-w-[70ch] mx-auto leading-relaxed">
              Browse the projects above to find contractors who deliver quality work.
            </p>
            <Button asChild variant="outline">
              <Link href={`/${city}/masonry`}>
                View All Masonry Services in {cityName}
              </Link>
            </Button>
          </div>
        </footer>
      </div>
    </>
  );
}

// ISR: Revalidate every hour
export const revalidate = 3600;
