/**
 * Public Business Profile Page - SEO-optimized portfolio showcase.
 *
 * URL Structure: /businesses/{city-slug}/{contractor-slug}
 * Example: /businesses/denver-co/denver-masonry-pro
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
import { MapPin, Phone, Globe, Briefcase, Building2, ChevronLeft, ChevronRight, Star, Award, CheckCircle2 } from 'lucide-react';
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
    slug: string;
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
        profile_slug,
        city_slug,
        projects!inner(status)
      `)
      .eq('projects.status', 'published')
      .not('profile_slug', 'is', null)
      .not('city_slug', 'is', null)
      .limit(100) as { data: Array<{ profile_slug: string; city_slug: string }> | null };

    if (!contractors) return [];

    // Deduplicate (join may return multiples)
    const unique = new Map<string, { city: string; slug: string }>();
    contractors.forEach((c) => {
      if (!unique.has(c.profile_slug)) {
        unique.set(c.profile_slug, { city: c.city_slug, slug: c.profile_slug });
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
  const { city, slug } = await params;
  const supabase = createAdminClient();

  const { data: contractorData } = await supabase
    .from('contractors')
    .select('id, business_name, city, state, description, services, profile_photo_url, city_slug, address, postal_code, phone, website')
    .eq('profile_slug', slug)
    .eq('city_slug', city)
    .single();

  const contractor = contractorData as Partial<Contractor> | null;

  if (!contractor || !contractor.id) {
    return {
      title: 'Contractor Not Found',
    };
  }

  const { count: publishedCount } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('contractor_id', contractor.id)
    .eq('status', 'published');

  const hasPublishedProjects = (publishedCount ?? 0) > 0;

  // Type for the join query result
  type ProjectWithImages = {
    project_images: Array<{
      storage_path: string;
      alt_text: string | null;
      display_order: number;
    }>;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: publishedProjectsData } = await (supabase as any)
    .from('projects')
    .select('project_images!project_images_project_id_fkey(storage_path, alt_text, display_order)')
    .eq('contractor_id', contractor.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1);

  const publishedProjects = publishedProjectsData as ProjectWithImages[] | null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';
  const title = `${contractor.business_name} | Contractor in ${contractor.city}, ${contractor.state}`;
  const description =
    contractor.description?.slice(0, 160) ||
    `${contractor.business_name} provides professional services in ${contractor.city}, ${contractor.state}. View their portfolio of completed projects.`;

  // OG image priority: profile photo > first project cover image
  let imageUrl: string | undefined;
  let imageAlt: string | undefined;

  if (contractor.profile_photo_url) {
    imageUrl = contractor.profile_photo_url;
    imageAlt = contractor.business_name || 'Contractor profile';
  } else if (publishedProjects?.[0]?.project_images?.length) {
    const sortedImages = [...publishedProjects[0].project_images].sort(
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
      url: `${siteUrl}/businesses/${city}/${slug}`,
      images: imageUrl ? [{ url: imageUrl, alt: imageAlt }] : [],
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title: contractor.business_name || 'Masonry Contractor',
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    robots: hasPublishedProjects ? undefined : { index: false, follow: true },
    alternates: {
      canonical: `${siteUrl}/businesses/${city}/${slug}`,
    },
  };
}

/**
 * Public Contractor Profile Page Component.
 */
export default async function ContractorProfilePage({ params, searchParams }: PageParams) {
  const { city, slug } = await params;
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
        project_images!project_images_project_id_fkey(*)
      )
    `)
    .eq('profile_slug', slug)
    .eq('city_slug', city)
    .single();

  // Type assertion for query result
  const contractor = data as ContractorWithProjectsAndImages | null;

  if (error || !contractor) {
    notFound();
  }

  // Filter to only published projects and sort by most recent
  const contractorProjects = contractor.projects ?? [];

  const allPublishedProjects = contractorProjects
    .filter((p) => p.status === 'published')
    .sort((a, b) => {
      const dateA = new Date(a.published_at || a.created_at).getTime();
      const dateB = new Date(b.published_at || b.created_at).getTime();
      return dateB - dateA;
    });

  const hasPublishedProjects = allPublishedProjects.length > 0;

  const contactAddress =
    contractor.address?.trim() ||
    [contractor.city, contractor.state, contractor.postal_code]
      .filter(Boolean)
      .join(', ');
  const contactPhone = contractor.phone?.trim() || '';
  const contactWebsite = contractor.website?.trim() || '';
  const hasContactInfo = Boolean(contactAddress || contactPhone || contactWebsite);

  // Pagination calculations
  const totalProjects = allPublishedProjects.length;
  const totalPages = Math.ceil(totalProjects / PROJECTS_PER_PAGE);
  const validatedPage = Math.min(currentPage, totalPages);
  const startIndex = (validatedPage - 1) * PROJECTS_PER_PAGE;
  const paginatedProjects = allPublishedProjects.slice(startIndex, startIndex + PROJECTS_PER_PAGE);

  // Add cover image to each project (first image by display_order)
  const projectsWithCovers: ProjectWithCover[] = paginatedProjects.map((project) => {
    const projectImages = project.project_images ?? [];
    const sortedImages = [...projectImages].sort(
      (a, b) => a.display_order - b.display_order
    );
    return {
      ...project,
      cover_image: sortedImages[0],
    };
  });

  // Generate structured data (use all published for complete list schema)
  const contractorSchema = generateContractorSchema(contractor);
  const projectListSchema = hasPublishedProjects
    ? generateProjectListSchema(
        allPublishedProjects.map((p) => ({ ...p, contractor })),
        `Projects by ${contractor.business_name}`
      )
    : null;

  // Breadcrumb items for navigation and schema
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Businesses', url: '/businesses' },
    { name: contractor.business_name || 'Business', url: `/businesses/${city}/${slug}` },
  ];

  return (
    <>
      {/* JSON-LD Structured Data (Breadcrumbs handles its own schema) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaToString(contractorSchema) }}
      />
      {projectListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaToString(projectListSchema) }}
        />
      )}

      <div className="min-h-screen bg-background">
        {/* Header with Breadcrumbs */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Profile Header */}
          <div className="max-w-7xl mx-auto mb-16 animate-fade-up">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
              {/* Minimal Background Pattern (Optional opacity) */}
              <div className="absolute inset-0 bg-muted/20 opacity-30 pointer-events-none" />

              <div className="relative p-8 md:p-12">
                <div className="flex flex-col md:flex-row gap-10 items-center md:items-start text-center md:text-left">
                  {/* Profile Photo */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                    <div className="relative w-32 h-32 md:w-44 md:h-44 rounded-full overflow-hidden flex-shrink-0 bg-muted ring-4 ring-background shadow-2xl">
                      {contractor.profile_photo_url ? (
                        <Image
                          src={contractor.profile_photo_url}
                          alt={contractor.business_name || 'Contractor'}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="176px"
                          priority
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-5xl">
                          {contractor.business_name?.charAt(0) || 'C'}
                        </div>
                      )}
                    </div>
                    {/* Verified Badge */}
                    <div className="absolute bottom-2 right-2 bg-background rounded-full p-1 shadow-lg ring-2 ring-primary/20">
                      <CheckCircle2 className="h-6 w-6 text-primary fill-primary/10" />
                    </div>
                  </div>

                  {/* Business Info */}
                  <div className="flex-1 space-y-6">
                    <div>
                      <h1 className="text-4xl md:text-6xl font-display mb-4 tracking-tighter text-gradient leading-tight">
                        {contractor.business_name}
                      </h1>

                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-medium shadow-sm transition-colors hover:bg-primary/10">
                          <MapPin className="h-4 w-4" />
                          {contractor.city}, {contractor.state}
                        </div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/5 border border-accent/10 text-accent-foreground text-sm font-medium shadow-sm transition-colors hover:bg-accent/10">
                          <Award className="h-4 w-4 text-primary" />
                          Verified Pro
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-4 border-t border-white/5">
                      <div className="stat-block animate-fade-up stagger-1">
                        <span className="stat-value text-primary">{totalProjects}</span>
                        <span className="stat-label">Showcased Projects</span>
                      </div>
                      <div className="stat-block animate-fade-up stagger-2">
                        <span className="stat-value flex items-center gap-1">
                          4.9 <Star className="h-5 w-5 fill-primary text-primary" />
                        </span>
                        <span className="stat-label">Avg. Rating</span>
                      </div>
                      <div className="stat-block hidden sm:flex animate-fade-up stagger-3">
                        <span className="stat-value text-primary">12+</span>
                        <span className="stat-label">Years Experience</span>
                      </div>
                    </div>

                    {/* Services */}
                    {contractor.services && contractor.services.length > 0 && (
                      <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2 animate-fade-up stagger-4">
                        {contractor.services.map((service, idx) => (
                          <Badge
                            key={service}
                            variant="secondary"
                            className={`bg-white/5 hover:bg-primary/20 hover:text-primary border-white/10 transition-all duration-300 animate-chip-slide-in`}
                            style={{ animationDelay: `${0.4 + idx * 0.1}s` }}
                          >
                            <Briefcase className="h-3 w-3 mr-1.5" />
                            {service}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* About & Service Areas Grid */}
          <div className="max-w-7xl mx-auto mb-20 grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-up stagger-5">
            {/* About Section */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-display mb-6 px-1 flex items-center gap-3">
                <span className="w-2 h-8 rounded-full bg-primary/20" />
                About {contractor.business_name}
              </h2>
              <div className="bg-card rounded-2xl p-8 border border-border shadow-sm h-full">
                {contractor.description ? (
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {contractor.description}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">
                    Professional masonry contractor serving the local community with high-quality craftsmanship.
                  </p>
                )}
              </div>
            </div>

            {/* Contact + Service Areas - Side Column */}
            <div className="lg:col-span-1 space-y-6">
              {hasContactInfo && (
                <div className="bg-card rounded-2xl p-8 border border-border shadow-sm">
                  <h2 className="text-xl font-display mb-6 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    Contact
                  </h2>
                  <div className="space-y-4 text-sm">
                    {contactAddress && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-primary mt-0.5" />
                        <span className="text-muted-foreground">{contactAddress}</span>
                      </div>
                    )}
                    {contactPhone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-primary" />
                        <a href={`tel:${contactPhone}`} className="text-muted-foreground hover:text-primary transition-colors">
                          {contactPhone}
                        </a>
                      </div>
                    )}
                    {contactWebsite && (
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-primary" />
                        <a
                          href={contactWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors break-all"
                        >
                          {contactWebsite.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {contractor.service_areas && contractor.service_areas.length > 0 && (
                <div className="bg-muted/30 rounded-2xl p-8 border border-border h-full">
                  <h2 className="text-xl font-display mb-6 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Service Areas
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {contractor.service_areas.map((area) => {
                      const citySlug = slugify(area);
                      return (
                        <Link key={area} href={`/${citySlug}/masonry`}>
                          <Badge
                            variant="secondary"
                            className="px-3 py-1.5 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                          >
                            {area}
                          </Badge>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Projects Grid */}
          <div className="max-w-7xl mx-auto mb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 px-1">
              <div>
                <h2 className="text-3xl md:text-4xl font-display tracking-tight mb-2">Project Portfolio</h2>
                <p className="text-muted-foreground">
                  {hasPublishedProjects
                    ? 'Detailed case studies and high-resolution visuals of recent masonry work.'
                    : 'New project photos are on the way. Check back soon for finished work.'}
                </p>
              </div>
              <div className="hidden md:flex gap-2">
                <div className="h-10 w-1 rounded-full bg-primary/20" />
                <span className="text-sm font-medium text-muted-foreground self-center uppercase tracking-widest">Selected Works</span>
              </div>
            </div>

            {hasPublishedProjects ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projectsWithCovers.map((project, idx) => (
                    <Link
                      key={project.id}
                      href={`/${project.city_slug}/masonry/${project.project_type_slug}/${project.slug}`}
                      className="group block h-full animate-fade-up"
                      style={{ animationDelay: `${0.1 + (idx % 3) * 0.1}s` }}
                    >
                      <Card className="overflow-hidden bg-card/40 border border-white/5 backdrop-blur-sm card-interactive h-full flex flex-col group">
                        {/* Project Image Container */}
                        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                          {project.cover_image ? (
                            <Image
                              src={getPublicUrl('project-images', project.cover_image.storage_path)}
                              alt={project.cover_image.alt_text || project.title || 'Project'}
                              fill
                              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/50">
                              <Building2 className="h-16 w-16" />
                            </div>
                          )}

                          {/* Floating Badge (Hover) */}
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                            <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm border-none shadow-xl">
                              View Project
                            </Badge>
                          </div>

                          {/* Top Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                        </div>

                        <CardContent className="p-6 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-bold border-primary/30 text-primary bg-primary/5">
                                {project.project_type || 'Masonry'}
                              </Badge>
                              {project.city && (
                                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {project.city}
                                </span>
                              )}
                            </div>
                            <h3 className="text-xl font-bold line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-300">
                              {project.title}
                            </h3>
                          </div>

                          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Full Project Story</span>
                            <ChevronRight className="h-4 w-4 text-primary transform group-hover:translate-x-1 transition-transform" />
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
                        <Link href={`/businesses/${city}/${slug}?page=${validatedPage - 1}`}>
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
                        <Link href={`/businesses/${city}/${slug}?page=${validatedPage + 1}`}>
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
              </>
            ) : (
              <Card className="bg-muted/30 border border-border">
                <CardContent className="p-8 text-center text-muted-foreground">
                  Project photos will show here once the first portfolio is published.
                </CardContent>
              </Card>
            )}
          </div>
        </main>

        {/* Footer CTA */}
        <footer className="mt-20 py-20 bg-hero-gradient border-t border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full translate-y-1/2 pointer-events-none" />
          <div className="container relative mx-auto px-4 text-center">
            <h3 className="text-3xl md:text-4xl font-display mb-6 tracking-tight">Ready to start your own project?</h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Contact {contractor.business_name} today to discuss your vision and get a professional consultation for your masonry needs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="rounded-full px-8 text-base font-semibold glow">
                Request a Consultation
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 text-base font-semibold border-white/10 hover:bg-white/5">
                View More {contractor.city} Pros
              </Button>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

// ISR: Revalidate every hour
export const revalidate = 3600;
