/**
 * Public Contractor Profile Page - SEO-optimized contractor showcase.
 *
 * URL Structure: /contractors/{city-slug}/{contractor-id}
 * Example: /contractors/denver-co/abc123-def456
 *
 * Features:
 * - Server-rendered for SEO
 * - JSON-LD LocalBusiness structured data
 * - OpenGraph meta tags
 * - Project portfolio grid
 *
 * @see /docs/02-requirements/capabilities.md SEO capabilities
 * @see /src/lib/seo/structured-data.ts for schema generators
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Briefcase, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';

/** Number of projects to show per page */
const PROJECTS_PER_PAGE = 12;
import {
  generateContractorSchema,
  generateProjectListSchema,
  schemaToString,
} from '@/lib/seo/structured-data';
import { getPublicUrl } from '@/lib/storage/upload';
import { slugify } from '@/lib/utils/slugify';
import type { Contractor, Project, ProjectImage } from '@/types/database';

type PageParams = {
  params: Promise<{
    city: string;
    id: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
};

/**
 * Type for project with cover image for display.
 */
type ProjectWithCover = Project & {
  cover_image?: ProjectImage;
};

/**
 * Type for contractor with projects and their images.
 */
type ContractorWithProjectsAndImages = Contractor & {
  projects: (Project & { project_images: ProjectImage[] })[];
};

/**
 * Generate static params for pre-rendering contractor profiles.
 * Only generates for contractors with published projects.
 */
export async function generateStaticParams() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('[generateStaticParams] Skipping: SUPABASE_SERVICE_ROLE_KEY not configured');
    return [];
  }

  try {
    const supabase = createAdminClient();

    // Get contractors with at least one published project
    const { data: contractors } = await supabase
      .from('contractors')
      .select(`
        id,
        city_slug,
        projects!inner(status)
      `)
      .eq('projects.status', 'published')
      .not('city_slug', 'is', null)
      .limit(100) as { data: Array<{ id: string; city_slug: string }> | null };

    if (!contractors) return [];

    // Deduplicate (join may return multiples)
    const unique = new Map<string, { city: string; id: string }>();
    contractors.forEach((c) => {
      if (!unique.has(c.id)) {
        unique.set(c.id, { city: c.city_slug, id: c.id });
      }
    });

    return Array.from(unique.values());
  } catch (error) {
    console.error('[generateStaticParams] Error fetching contractors:', error);
    return [];
  }
}

/**
 * Generate metadata for SEO including OG/Twitter images.
 *
 * Uses contractor's profile photo if available, otherwise falls back
 * to the cover image of their most recent published project.
 */
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { city, id } = await params;
  const supabase = createAdminClient();

  // Include profile_photo_url and first published project image for OG
  const { data } = await supabase
    .from('contractors')
    .select(`
      business_name, city, state, description, services, profile_photo_url, city_slug,
      projects(project_images(storage_path, alt_text, display_order))
    `)
    .eq('id', id)
    .eq('projects.status', 'published')
    .limit(1, { foreignTable: 'projects' })
    .single();

  type ContractorWithProject = Partial<Contractor> & {
    projects?: Array<{
      project_images: Array<{ storage_path: string; alt_text: string | null; display_order: number }>;
    }>;
  };
  const contractor = data as ContractorWithProject | null;

  if (!contractor) {
    return {
      title: 'Contractor Not Found',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';
  const title = `${contractor.business_name} | Masonry Contractor in ${contractor.city}, ${contractor.state}`;
  const description =
    contractor.description?.slice(0, 160) ||
    `${contractor.business_name} provides professional masonry services in ${contractor.city}, ${contractor.state}. View their portfolio of completed projects.`;

  // OG image priority: profile photo > first project cover image
  let imageUrl: string | undefined;
  let imageAlt: string | undefined;

  if (contractor.profile_photo_url) {
    imageUrl = contractor.profile_photo_url;
    imageAlt = contractor.business_name || 'Contractor profile';
  } else if (contractor.projects?.[0]?.project_images?.length) {
    const sortedImages = [...contractor.projects[0].project_images].sort(
      (a, b) => a.display_order - b.display_order
    );
    const coverImage = sortedImages[0];
    if (coverImage) {
      imageUrl = getPublicUrl('project-images', coverImage.storage_path);
      imageAlt = coverImage.alt_text || `${contractor.business_name} portfolio`;
    }
  }

  return {
    title,
    description,
    keywords: contractor.services?.join(', '),
    openGraph: {
      title: contractor.business_name || 'Masonry Contractor',
      description,
      type: 'profile',
      url: `${siteUrl}/contractors/${city}/${id}`,
      images: imageUrl ? [{ url: imageUrl, alt: imageAlt }] : [],
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title: contractor.business_name || 'Masonry Contractor',
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: `${siteUrl}/contractors/${city}/${id}`,
    },
  };
}

/**
 * Public Contractor Profile Page Component.
 */
export default async function ContractorProfilePage({ params, searchParams }: PageParams) {
  const { city, id } = await params;
  const { page: pageParam } = await searchParams;
  const supabase = createAdminClient();

  // Parse current page from URL (1-indexed)
  const currentPage = Math.max(1, parseInt(pageParam || '1', 10) || 1);

  // Fetch contractor with published projects and their images
  const { data, error } = await supabase
    .from('contractors')
    .select(`
      *,
      projects(
        *,
        project_images(*)
      )
    `)
    .eq('id', id)
    .eq('city_slug', city)
    .single();

  // Type assertion for query result
  const contractor = data as ContractorWithProjectsAndImages | null;

  if (error || !contractor) {
    notFound();
  }

  // Filter to only published projects and sort by most recent
  const allPublishedProjects = contractor.projects
    .filter((p) => p.status === 'published')
    .sort((a, b) => {
      const dateA = new Date(a.published_at || a.created_at).getTime();
      const dateB = new Date(b.published_at || b.created_at).getTime();
      return dateB - dateA;
    });

  // If no published projects, show 404
  // (Contractor profiles are only public if they have published work)
  if (allPublishedProjects.length === 0) {
    notFound();
  }

  // Pagination calculations
  const totalProjects = allPublishedProjects.length;
  const totalPages = Math.ceil(totalProjects / PROJECTS_PER_PAGE);
  const validatedPage = Math.min(currentPage, totalPages);
  const startIndex = (validatedPage - 1) * PROJECTS_PER_PAGE;
  const paginatedProjects = allPublishedProjects.slice(startIndex, startIndex + PROJECTS_PER_PAGE);

  // Add cover image to each project (first image by display_order)
  const projectsWithCovers: ProjectWithCover[] = paginatedProjects.map((project) => {
    const sortedImages = project.project_images.sort(
      (a, b) => a.display_order - b.display_order
    );
    return {
      ...project,
      cover_image: sortedImages[0],
    };
  });

  // Generate structured data (use all published for complete list schema)
  const contractorSchema = generateContractorSchema(contractor);
  const projectListSchema = generateProjectListSchema(
    allPublishedProjects.map((p) => ({ ...p, contractor })),
    `Projects by ${contractor.business_name}`
  );

  // Breadcrumb items for navigation and schema
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Contractors', url: '/contractors' },
    { name: contractor.business_name || 'Contractor', url: `/contractors/${city}/${id}` },
  ];

  return (
    <>
      {/* JSON-LD Structured Data (Breadcrumbs handles its own schema) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaToString(contractorSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaToString(projectListSchema) }}
      />

      <div className="min-h-screen bg-background">
        {/* Header with Breadcrumbs */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Profile Header */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-gradient-to-br from-muted/40 to-muted/20 rounded-2xl p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Profile Photo */}
                <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden flex-shrink-0 bg-muted ring-4 ring-background shadow-lg">
                  {contractor.profile_photo_url ? (
                    <Image
                      src={contractor.profile_photo_url}
                      alt={contractor.business_name || 'Contractor'}
                      fill
                      className="object-cover"
                      sizes="144px"
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMSAxIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4="
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-3xl">
                      {contractor.business_name?.charAt(0) || 'C'}
                    </div>
                  )}
                </div>

                {/* Business Info */}
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
                    {contractor.business_name}
                  </h1>

                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/80 text-sm shadow-sm">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {contractor.city}, {contractor.state}
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/80 text-sm shadow-sm">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span>{totalProjects} Projects</span>
                    </div>
                  </div>

                  {/* Services */}
                  {contractor.services && contractor.services.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {contractor.services.map((service) => (
                        <Badge key={service} variant="secondary" className="bg-background/60 hover:bg-background/80">
                          <Briefcase className="h-3 w-3 mr-1 text-primary" />
                          {service}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Description */}
                  {contractor.description && (
                    <p className="text-muted-foreground max-w-2xl leading-relaxed">
                      {contractor.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Service Areas - linked to city hub pages */}
          {contractor.service_areas && contractor.service_areas.length > 0 && (
            <div className="max-w-4xl mx-auto mb-12">
              <div className="bg-muted/30 rounded-xl p-5">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Service Areas
                </h2>
                <div className="flex flex-wrap gap-2">
                  {contractor.service_areas.map((area) => {
                    const citySlug = slugify(area);
                    return (
                      <Link key={area} href={`/${citySlug}/masonry`}>
                        <Badge
                          variant="outline"
                          className="cursor-pointer bg-background hover:bg-primary/10 hover:border-primary/30 transition-all"
                        >
                          <MapPin className="h-3 w-3 mr-1 text-primary" />
                          {area}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Projects Grid */}
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 tracking-tight">Project Portfolio</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectsWithCovers.map((project) => (
                <Link
                  key={project.id}
                  href={`/${project.city_slug}/masonry/${project.project_type_slug}/${project.slug}`}
                  className="group"
                >
                  <Card className="overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 h-full border-0 bg-card">
                    {/* Project Image */}
                    <div className="relative aspect-video bg-muted overflow-hidden">
                      {project.cover_image ? (
                        <Image
                          src={getPublicUrl('project-images', project.cover_image.storage_path)}
                          alt={project.cover_image.alt_text || project.title || 'Project'}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          placeholder="blur"
                          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMSAxIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4="
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                          <Building2 className="h-12 w-12" />
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                    </div>

                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {project.title}
                      </h3>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {project.project_type && (
                          <Badge variant="outline" className="text-xs">
                            {project.project_type}
                          </Badge>
                        )}
                        {project.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {project.city}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav
                className="flex items-center justify-center gap-2 mt-8"
                aria-label="Project portfolio pagination"
              >
                {/* Previous Button */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={validatedPage <= 1}
                  asChild={validatedPage > 1}
                >
                  {validatedPage > 1 ? (
                    <Link href={`/contractors/${city}/${id}?page=${validatedPage - 1}`}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Link>
                  ) : (
                    <span>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </span>
                  )}
                </Button>

                {/* Page Indicator */}
                <span className="text-sm text-muted-foreground px-4">
                  Page {validatedPage} of {totalPages}
                </span>

                {/* Next Button */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={validatedPage >= totalPages}
                  asChild={validatedPage < totalPages}
                >
                  {validatedPage < totalPages ? (
                    <Link href={`/contractors/${city}/${id}?page=${validatedPage + 1}`}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  ) : (
                    <span>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </span>
                  )}
                </Button>
              </nav>
            )}
          </div>
        </main>

        {/* Footer CTA */}
        <footer className="mt-12 py-12 bg-gradient-to-b from-muted/30 to-muted/10">
          <div className="container mx-auto px-4 text-center">
            <p className="text-lg font-medium mb-2">
              Interested in masonry services in {contractor.city}, {contractor.state}?
            </p>
            <p className="text-muted-foreground">
              Contact {contractor.business_name} to discuss your project.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}

// ISR: Revalidate every hour
export const revalidate = 3600;
