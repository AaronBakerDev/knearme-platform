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
import { createAdminClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import {
  generateContractorSchema,
  generateProjectListSchema,
  schemaToString,
} from '@/lib/seo/structured-data';
import { getPublicUrl } from '@/lib/storage/upload';
import {
  ContractorAboutAndContact,
  ContractorProfileFooter,
  ContractorProfileHeader,
  ContractorProjectsSection,
  type ProjectWithCover,
} from '@/components/portfolio/ContractorProfileSections';
import { logger } from '@/lib/logging';
import type { Contractor, Project, ProjectImage } from '@/types/database';

/** Number of projects to show per page */
const PROJECTS_PER_PAGE = 12;

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
    logger.error('[generateStaticParams] Error fetching contractors', { error });
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

  const { data: publishedProjectsData } = await supabase
    .from('projects')
    .select('project_images!project_images_project_id_fkey(storage_path, alt_text, display_order)')
    .eq('contractor_id', contractor.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1);

  const publishedProjects = publishedProjectsData as ProjectWithImages[] | null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';
  const businessName = contractor.business_name || 'Contractor';
  const cityName = contractor.city || 'your area';
  const stateName = contractor.state || '';
  const title = `${businessName} | Contractor in ${cityName}${stateName ? `, ${stateName}` : ''}`;
  const description =
    contractor.description?.slice(0, 160) ||
    `${businessName} provides professional services in ${cityName}${stateName ? `, ${stateName}` : ''}. View their portfolio of completed projects.`;

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
      title: businessName,
      description,
      type: 'profile',
      url: `${siteUrl}/businesses/${city}/${slug}`,
      images: imageUrl ? [{ url: imageUrl, alt: imageAlt }] : [],
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title: businessName,
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
  const totalPages = Math.max(1, Math.ceil(totalProjects / PROJECTS_PER_PAGE));
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
          <ContractorProfileHeader contractor={contractor} totalProjects={totalProjects} />
          <ContractorAboutAndContact
            contractor={contractor}
            contactAddress={contactAddress}
            contactPhone={contactPhone}
            contactWebsite={contactWebsite}
            hasContactInfo={hasContactInfo}
          />
          <ContractorProjectsSection
            projects={projectsWithCovers}
            hasPublishedProjects={hasPublishedProjects}
            city={city}
            slug={slug}
            validatedPage={validatedPage}
            totalPages={totalPages}
          />
        </main>

        <ContractorProfileFooter contractor={contractor} />
      </div>
    </>
  );
}

// ISR: Revalidate every hour
export const revalidate = 3600;
