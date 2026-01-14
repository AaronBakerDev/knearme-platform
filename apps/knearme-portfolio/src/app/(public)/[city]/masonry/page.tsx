/**
 * City Hub Page - SEO-optimized landing page for masonry services in a city.
 *
 * URL Structure: /{city-slug}/masonry
 * Example: /denver-co/masonry
 *
 * Features:
 * - Server-rendered for SEO
 * - Lists all published projects in the city
 * - Shows contractors serving the area
 * - JSON-LD structured data for local services
 *
 * @see /docs/02-requirements/capabilities.md SEO capabilities
 * @see /src/lib/seo/structured-data.ts for schema generators
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Building2, Wrench } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { PublicBreadcrumbHeader } from '@/components/seo/PublicBreadcrumbHeader';
import { NearbyCities, fetchCitiesWithProjects } from '@/components/seo/NearbyCities';
import { ProjectGridCard } from '@/components/seo/ProjectGridCard';
import { ServiceProviderCard } from '@/components/seo/ServiceProviderCard';
import {
  generateProjectListSchema,
  schemaToString,
} from '@/lib/seo/structured-data';
import {
  buildOpenGraphMeta,
  buildTwitterMeta,
  selectCoverImage,
  type CoverImage,
} from '@/lib/seo/metadata-helpers';
import { getPublicUrl } from '@/lib/storage/upload';
import { formatCityName, getCanonicalUrl } from '@/lib/constants/page-descriptions';
import { logger } from '@/lib/logging';
import type { Contractor, Project, ProjectImage } from '@/types/database';

type PageParams = {
  params: Promise<{
    city: string;
  }>;
};

/**
 * Type for project with contractor and cover image.
 */
type ProjectWithDetails = Project & {
  contractor: Contractor;
  cover_image?: CoverImage;
};

/**
 * Generate static params for pre-rendering city hub pages.
 * Only generates for cities with published projects.
 */
export async function generateStaticParams() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    logger.info('[generateStaticParams] Skipping: SUPABASE_SERVICE_ROLE_KEY not configured');
    return [];
  }

  try {
    const supabase = createAdminClient();

    // Get unique city slugs with published projects
    const { data: projects } = await supabase
      .from('projects')
      .select('city_slug')
      .eq('status', 'published')
      .not('city_slug', 'is', null)
      .limit(500) as { data: Array<{ city_slug: string }> | null };

    if (!projects) return [];

    // Get unique cities
    const cities = new Set<string>();
    projects.forEach((p) => cities.add(p.city_slug));

    return Array.from(cities).map((city) => ({ city }));
  } catch (error) {
    logger.error('[generateStaticParams] Error fetching cities', { error });
    return [];
  }
}

/**
 * Generate metadata for SEO including OG/Twitter images.
 *
 * Uses the cover image of the first published project in the city
 * for social sharing previews.
 */
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { city } = await params;
  const cityName = formatCityName(city);
  const supabase = createAdminClient();

  // Fetch first published project's cover image for OG
  const { data: projectData } = await supabase
    .from('projects')
    .select(`project_images!project_images_project_id_fkey(storage_path, alt_text, display_order)`)
    .eq('city_slug', city)
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
  const imageAlt = coverImage?.alt_text || `Masonry project in ${cityName}`;

  const title = `Masonry Services in ${cityName} | Local Contractors & Projects`;
  const description = `Browse masonry projects and find local contractors in ${cityName}. View portfolios of chimney repair, tuckpointing, stone work, and more.`;
  const canonicalUrl = getCanonicalUrl(`/${city}/masonry`);

  return {
    title,
    description,
    keywords: `masonry ${cityName}, brick work ${cityName}, chimney repair ${cityName}, tuckpointing ${cityName}`,
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
 * City Hub Page Component.
 */
export default async function CityHubPage({ params }: PageParams) {
  const { city } = await params;
  const supabase = createAdminClient();

  // Fetch published projects in this city with contractors and images
  const { data: projectsData, error: projectsError } = await supabase
    .from('projects')
    .select(`
      *,
      contractor:contractors(*),
      project_images!project_images_project_id_fkey(*)
    `)
    .eq('city_slug', city)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);

  if (projectsError) {
    logger.error('[CityHubPage] Error fetching projects', { error: projectsError });
  }

  // Type assertion for query result
  type ProjectWithRelations = Project & {
    contractor: Contractor;
    project_images: ProjectImage[];
  };
  const projects = (projectsData || []) as ProjectWithRelations[];

  // If no projects in this city, show 404
  if (projects.length === 0) {
    notFound();
  }

  // Add cover image to each project
  const projectsWithDetails: ProjectWithDetails[] = projects.map((project) => ({
    ...project,
    cover_image: selectCoverImage(project.project_images) ?? undefined,
  }));

  // Get unique contractors serving this city
  const contractorsMap = new Map<string, Contractor>();
  projects.forEach((p) => {
    if (p.contractor && !contractorsMap.has(p.contractor.id)) {
      contractorsMap.set(p.contractor.id, p.contractor);
    }
  });
  const contractors = Array.from(contractorsMap.values());

  // Get unique project types for navigation
  const projectTypes = new Map<string, { slug: string; name: string; count: number }>();
  projects.forEach((p) => {
    if (p.project_type_slug && p.project_type) {
      const existing = projectTypes.get(p.project_type_slug);
      if (existing) {
        existing.count++;
      } else {
        projectTypes.set(p.project_type_slug, {
          slug: p.project_type_slug,
          name: p.project_type,
          count: 1,
        });
      }
    }
  });
  const sortedProjectTypes = Array.from(projectTypes.values()).sort(
    (a, b) => b.count - a.count
  );

  const cityName = formatCityName(city);

  // Fetch other cities for internal linking
  const otherCities = await fetchCitiesWithProjects(supabase, undefined, 12);

  // Breadcrumb items for navigation and schema
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: cityName, url: `/${city}` },
    { name: 'Masonry', url: `/${city}/masonry` },
  ];

  // Generate structured data
  const projectListSchema = generateProjectListSchema(
    projects.map((p) => ({ ...p, contractor: p.contractor })),
    `Masonry Projects in ${cityName}`
  );

  return (
    <>
      {/* JSON-LD Structured Data (Breadcrumbs handles its own schema) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaToString(projectListSchema) }}
      />

      <div className="min-h-screen bg-background">
        {/* Header with Breadcrumbs */}
        <PublicBreadcrumbHeader items={breadcrumbItems} />

        <main className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8 md:p-12">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                Masonry Services in {cityName}
              </h1>
              <p className="text-lg text-muted-foreground max-w-[72ch] mx-auto leading-relaxed">
                Browse {projects.length} completed projects from {contractors.length} local{' '}
                {contractors.length === 1 ? 'contractor' : 'contractors'}
              </p>
            </div>
          </div>

          {/* Project Type Navigation - Links to service type pages for SEO */}
          {sortedProjectTypes.length > 1 && (
            <div className="max-w-4xl mx-auto mb-12">
              <div className="bg-muted/30 rounded-xl p-5">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  Browse by Service Type
                </h2>
                <div className="flex flex-wrap gap-2">
                  {sortedProjectTypes.map((type) => (
                    <Link key={type.slug} href={`/${city}/masonry/${type.slug}`}>
                      <Badge
                        variant="secondary"
                        className="cursor-pointer bg-background hover:bg-primary/10 hover:border-primary/30 border border-transparent transition-all px-3 py-1.5"
                      >
                        {type.name} <span className="text-muted-foreground ml-1">({type.count})</span>
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Featured Contractors */}
          {contractors.length > 0 && (
            <div className="max-w-4xl mx-auto mb-12">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Local Contractors
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {contractors.slice(0, 4).map((contractor) => (
                  <ServiceProviderCard
                    key={contractor.id}
                    href={`/businesses/${contractor.city_slug}/${contractor.profile_slug || contractor.id}`}
                    name={contractor.business_name || 'Contractor'}
                    photoUrl={contractor.profile_photo_url}
                    subtitle={contractor.services?.slice(0, 2).join(', ') || ''}
                  />
                ))}
              </div>
              {contractors.length > 4 && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  + {contractors.length - 4} more contractors in this area
                </p>
              )}
            </div>
          )}

          {/* Projects Grid */}
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 tracking-tight">Recent Projects</h2>

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
                  badgeLabel={project.project_type || undefined}
                  subtitle={`by ${project.contractor.business_name}`}
                />
              ))}
            </div>
          </div>

          {/* Other Cities - Internal linking for SEO */}
          {otherCities.length > 1 && (
            <div className="max-w-4xl mx-auto mt-12">
              <NearbyCities
                cities={otherCities}
                currentCitySlug={city}
                title="Explore Other Cities"
                maxCities={8}
                showCount={true}
              />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-12 py-12 bg-gradient-to-b from-muted/30 to-muted/10">
          <div className="container mx-auto px-4 text-center">
            <p className="text-lg font-medium mb-2 max-w-[70ch] mx-auto leading-relaxed">
              Looking for masonry services in {cityName}?
            </p>
            <p className="text-muted-foreground max-w-[70ch] mx-auto leading-relaxed">
              Browse projects above to find the right contractor for your needs.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}

// ISR: Revalidate every hour
export const revalidate = 3600;
