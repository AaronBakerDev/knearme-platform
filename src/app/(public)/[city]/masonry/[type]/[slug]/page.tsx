/**
 * Public Project Detail Page - SEO-optimized portfolio showcase.
 *
 * URL Structure: /{city-slug}/masonry/{project-type-slug}/{project-slug}
 * Example: /denver-co/masonry/chimney-rebuild/historic-brick-restoration-abc123
 *
 * Features:
 * - Server-rendered for SEO
 * - JSON-LD structured data
 * - OpenGraph meta tags
 * - Responsive image gallery
 *
 * @see /docs/02-requirements/capabilities.md SEO capabilities
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Calendar, Wrench, ArrowLeft, Phone, Globe } from 'lucide-react';
import sanitizeHtml from 'sanitize-html';
import { createAdminClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PhotoGallery } from '@/components/portfolio/PhotoGallery';
import { DescriptionBlocks } from '@/components/portfolio/DescriptionBlocks';
import { DynamicPortfolioRenderer, type PortfolioImage } from '@/components/portfolio/DynamicPortfolioRenderer';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import type { DesignTokens } from '@/lib/design/tokens';
import type { SemanticBlock } from '@/lib/design/semantic-blocks';
import { RelatedProjects } from '@/components/seo/RelatedProjects';
import { fetchRelatedProjects } from '@/lib/data/projects';
import {
  generateProjectSchema,
  schemaToString,
} from '@/lib/seo/structured-data';
import { getPublicUrl } from '@/lib/storage/upload';
import { sanitizeDescriptionBlocks } from '@/lib/content/description-blocks';
import { formatProjectLocation } from '@/lib/utils/location';
import { slugify } from '@/lib/utils/slugify';
import { isDemoSlug, getDemoProject, getAllDemoProjects, type DemoProject } from '@/lib/data/demo-projects';
import type { Project, Contractor, ProjectImage } from '@/types/database';

type PageParams = {
  params: Promise<{
    city: string;
    type: string;
    slug: string;
  }>;
};

/**
 * Generate static params for pre-rendering published projects.
 * Includes demo projects for the Examples page.
 * Returns empty array for DB projects if admin client unavailable (falls back to ISR).
 */
export async function generateStaticParams() {
  // Always include demo projects for static generation
  const demoParams = getAllDemoProjects().map((p) => ({
    city: p.city_slug,
    type: p.project_type_slug,
    slug: p.slug,
  }));

  // Skip DB static generation if service role key is missing
  // Next.js will use ISR/dynamic rendering instead
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('[generateStaticParams] Skipping DB projects: SUPABASE_SERVICE_ROLE_KEY not configured');
    return demoParams;
  }

  try {
    const supabase = createAdminClient();

    const { data: projects } = await supabase
      .from('projects')
      .select('city_slug, project_type_slug, slug')
      .eq('status', 'published')
      .not('city_slug', 'is', null)
      .not('project_type_slug', 'is', null)
      .not('slug', 'is', null)
      .limit(100) as { data: Array<{ city_slug: string; project_type_slug: string; slug: string }> | null };

    if (!projects) return demoParams;

    const dbParams = projects.map((p) => ({
      city: p.city_slug,
      type: p.project_type_slug,
      slug: p.slug,
    }));

    return [...demoParams, ...dbParams];
  } catch (error) {
    console.error('[generateStaticParams] Error fetching projects:', error);
    return demoParams;
  }
}

// Type for project with nested relations
type ProjectWithRelations = Project & {
  contractor: Contractor;
  project_images: ProjectImage[];
  portfolio_layout?: unknown; // JSONB column for AI-generated layouts
};

const ALLOWED_DESCRIPTION_TAGS = ['p', 'strong', 'em', 'ul', 'ol', 'li', 'br'];

function hasHtmlTags(text: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(text);
}

function renderDescription(description: string | null | undefined, blocks: unknown) {
  const parsedBlocks = sanitizeDescriptionBlocks(blocks);
  if (parsedBlocks.length > 0) {
    return <DescriptionBlocks blocks={parsedBlocks} />;
  }

  if (!description) {
    return null;
  }

  if (hasHtmlTags(description)) {
    const safeHtml = sanitizeHtml(description, {
      allowedTags: ALLOWED_DESCRIPTION_TAGS,
      allowedAttributes: {},
      disallowedTagsMode: 'discard',
    });

    return (
      <article
        className="prose prose-lg prose-earth max-w-none mb-8"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    );
  }

  return (
    <article className="prose prose-lg prose-earth max-w-none mb-8">
      {description.split(/\n\s*\n/).map((paragraph, idx) => (
        <p key={idx}>{paragraph}</p>
      ))}
    </article>
  );
}

function buildDemoProjectSchema(demoProject: DemoProject): Record<string, unknown> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';
  const projectUrl = `${siteUrl}/${demoProject.city_slug}/masonry/${demoProject.project_type_slug}/${demoProject.slug}`;
  const primaryImage = demoProject.images[0];

  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': projectUrl,
    name: demoProject.title,
    description: demoProject.description,
    datePublished: demoProject.published_at,
    dateModified: demoProject.published_at,
    creator: {
      '@type': 'LocalBusiness',
      name: demoProject.contractor.business_name,
      address: {
        '@type': 'PostalAddress',
        addressLocality: demoProject.contractor.city,
        addressRegion: demoProject.contractor.state,
      },
    },
    image: demoProject.images.map((img) => ({
      '@type': 'ImageObject',
      url: img.url,
      caption: img.alt_text,
    })),
    thumbnailUrl: primaryImage ? primaryImage.url : undefined,
    keywords: demoProject.tags.join(', '),
    about: {
      '@type': 'Thing',
      name: demoProject.project_type,
    },
    material: demoProject.materials,
    locationCreated: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: demoProject.city,
        addressRegion: demoProject.state,
      },
    },
  };
}

/**
 * Generate metadata for SEO including OG/Twitter images.
 *
 * Handles both demo projects (static data) and real projects (from DB).
 * OG images significantly improve click-through rates on social media.
 */
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { city, type, slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';

  // Check for demo project first
  if (isDemoSlug(slug)) {
    const demoProject = getDemoProject(city, type, slug);
    if (demoProject) {
      const coverImage = demoProject.images[0];
      return {
        title: `${demoProject.seo_title} | Example Project`,
        description: demoProject.seo_description,
        keywords: demoProject.tags?.join(', '),
        openGraph: {
          title: `${demoProject.title} | Example Project`,
          description: demoProject.seo_description,
          type: 'article',
          url: `${siteUrl}/${city}/masonry/${type}/${slug}`,
          images: coverImage ? [{ url: coverImage.url, alt: coverImage.alt_text }] : [],
        },
        twitter: {
          card: 'summary_large_image',
          title: `${demoProject.title} | Example Project`,
          description: demoProject.seo_description,
          images: coverImage ? [coverImage.url] : [],
        },
      };
    }
  }

  // Fetch real project from database
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('projects')
    .select(`
      *,
      contractor:contractors(business_name, city, state),
      project_images!project_images_project_id_fkey(storage_path, alt_text, display_order)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  // Type assertion for the query result
  type ProjectWithImages = Project & {
    contractor: Partial<Contractor>;
    project_images: Array<{ storage_path: string; alt_text: string | null; display_order: number }>;
  };
  const project = data as ProjectWithImages | null;

  if (!project) {
    return {
      title: 'Project Not Found',
    };
  }

  const contractor = project.contractor;

  // Get cover image URL for OG/Twitter (first image by display_order)
  const sortedImages = [...(project.project_images || [])].sort(
    (a, b) => a.display_order - b.display_order
  );
  const coverImage = sortedImages[0];
  const imageUrl = coverImage
    ? getPublicUrl('project-images', coverImage.storage_path)
    : undefined;

  return {
    title: project.seo_title || `${project.title} | ${contractor?.business_name}`,
    description: project.seo_description || project.description?.slice(0, 160),
    keywords: project.tags?.join(', '),
    openGraph: {
      title: project.title || 'Masonry Project',
      description: project.seo_description || project.description?.slice(0, 160),
      type: 'article',
      url: `${siteUrl}/${project.city_slug}/masonry/${project.project_type_slug}/${project.slug}`,
      images: imageUrl
        ? [{ url: imageUrl, alt: coverImage?.alt_text || project.title || 'Project image' }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: project.title || 'Masonry Project',
      description: project.seo_description || project.description?.slice(0, 160),
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: `${siteUrl}/${project.city_slug}/masonry/${project.project_type_slug}/${project.slug}`,
    },
  };
}

/**
 * Public Project Page Component.
 *
 * Handles both demo projects (static data) and real projects (from DB).
 * Demo projects show a banner linking back to Examples page.
 */
export default async function ProjectPage({ params }: PageParams) {
  const { city, type, slug } = await params;

  // Check for demo project first
  const isDemo = isDemoSlug(slug);
  const demoProject = isDemo ? getDemoProject(city, type, slug) : null;

  // Variables we'll populate from either demo or DB
  let projectData: {
    id: string;
    title: string;
    description: string;
    description_blocks: unknown;
    portfolio_layout: {
      tokens: DesignTokens;
      blocks: SemanticBlock[];
      rationale?: string;
    } | null;
    city: string;
    neighborhood?: string;
    state: string;
    project_type: string;
    tags: string[];
    materials: string[];
    techniques: string[];
    duration?: string;
    published_at: string | null;
  };
  let contractorData: {
    id: string;
    profile_slug: string;
    business_name: string;
    city: string;
    city_slug: string;
    state: string;
    services: string[];
    profile_photo_url?: string;
    address?: string | null;
    postal_code?: string | null;
    phone?: string | null;
    website?: string | null;
  };
  let imagesData: Array<{
    id: string;
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
  let relatedProjects: Awaited<ReturnType<typeof fetchRelatedProjects>> = [];
  let projectSchema: Record<string, unknown> | null = null;

  if (demoProject) {
    // Use demo data
    projectData = {
      id: demoProject.id,
      title: demoProject.title,
      description: demoProject.description,
      description_blocks: demoProject.description_blocks,
      portfolio_layout: null, // Demo projects don't have dynamic layouts yet
      city: demoProject.city,
      neighborhood: demoProject.neighborhood,
      state: demoProject.state,
      project_type: demoProject.project_type,
      tags: demoProject.tags,
      materials: demoProject.materials,
      techniques: demoProject.techniques,
      duration: demoProject.duration,
      published_at: demoProject.published_at,
    };
    contractorData = {
      ...demoProject.contractor,
      profile_slug: slugify(demoProject.contractor.business_name),
      address: null,
      postal_code: null,
      phone: null,
      website: null,
    };
    imagesData = demoProject.images.map((img) => ({
      id: img.id,
      src: img.url,
      alt: img.alt_text,
    }));
    projectSchema = buildDemoProjectSchema(demoProject);
    // No related projects for demos
  } else {
    // Fetch from database
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        contractor:contractors(*),
        project_images!project_images_project_id_fkey(*)
      `)
      .eq('slug', slug)
      .eq('city_slug', city)
      .eq('project_type_slug', type)
      .eq('status', 'published')
      .single();

    const project = data as ProjectWithRelations | null;

    if (error || !project) {
      notFound();
    }

    const contractor = project.contractor;
    const images = project.project_images.sort(
      (a, b) => a.display_order - b.display_order
    );

    // Parse portfolio_layout from JSONB column
    let parsedLayout: typeof projectData.portfolio_layout = null;
    if (project.portfolio_layout) {
      try {
        const layout = project.portfolio_layout as {
          tokens?: unknown;
          blocks?: unknown[];
          rationale?: string;
        };
        if (layout.tokens && Array.isArray(layout.blocks)) {
          parsedLayout = {
            tokens: layout.tokens as DesignTokens,
            blocks: layout.blocks as SemanticBlock[],
            rationale: layout.rationale,
          };
        }
      } catch {
        // Invalid JSON, fall back to standard rendering
      }
    }

    projectData = {
      id: project.id,
      title: project.title || '',
      description: project.description || '',
      description_blocks: project.description_blocks,
      portfolio_layout: parsedLayout,
      city: project.city || '',
      neighborhood: project.neighborhood ?? undefined,
      state: project.state ?? contractor.state ?? '',
      project_type: project.project_type || '',
      tags: project.tags || [],
      materials: project.materials || [],
      techniques: project.techniques || [],
      duration: project.duration ?? undefined,
      published_at: project.published_at,
    };
    contractorData = {
      id: contractor.id,
      profile_slug: contractor.profile_slug || contractor.id,
      business_name: contractor.business_name || '',
      city: contractor.city || '',
      city_slug: contractor.city_slug || '',
      state: contractor.state || '',
      services: contractor.services || [],
      profile_photo_url: contractor.profile_photo_url ?? undefined,
      address: contractor.address ?? null,
      postal_code: contractor.postal_code ?? null,
      phone: contractor.phone ?? null,
      website: contractor.website ?? null,
    };
    imagesData = images.map((img) => ({
      id: img.id,
      src: getPublicUrl('project-images', img.storage_path),
      alt: img.alt_text || project.title || 'Project image',
      width: img.width || undefined,
      height: img.height || undefined,
    }));

    projectSchema = generateProjectSchema(project, contractor, images);

    // Fetch related projects
    relatedProjects = await fetchRelatedProjects(supabase, {
      id: project.id,
      business_id: project.business_id,
      city_slug: city,
      project_type_slug: type,
    }, 6);
  }

  // Common variables
  const locationLabel = formatProjectLocation({
    neighborhood: projectData.neighborhood,
    city: projectData.city,
    state: projectData.state,
  });

  // Breadcrumb items for navigation and schema
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: projectData.city || 'Projects', url: `/${city}` },
    { name: 'Masonry', url: `/${city}/masonry` },
    { name: projectData.project_type || 'Project', url: `/${city}/masonry/${type}` },
    { name: projectData.title || 'Project', url: `/${city}/masonry/${type}/${slug}` },
  ];

  // Format date
  const publishedDate = projectData.published_at
    ? new Date(projectData.published_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    : null;

  const contactAddress =
    contractorData.address?.trim() ||
    [contractorData.city, contractorData.state, contractorData.postal_code]
      .filter(Boolean)
      .join(', ');
  const contactPhone = contractorData.phone?.trim() || '';
  const contactWebsite = contractorData.website?.trim() || '';
  const hasContactInfo = Boolean(contactAddress || contactPhone || contactWebsite);

  return (
    <>
      {projectSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaToString(projectSchema) }}
        />
      )}

      <div className="min-h-screen bg-background">
        {/* Demo Banner */}
        {isDemo && (
          <div className="bg-primary text-primary-foreground">
            <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-sm font-medium text-center sm:text-left">
                This is a demo project. Your work will appear at shareable URLs like this one.
              </p>
              <Link
                href="/examples"
                className="text-sm font-semibold underline underline-offset-2 hover:no-underline whitespace-nowrap"
              >
                View All Examples
              </Link>
            </div>
          </div>
        )}

        {/* Header with Breadcrumbs */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Back link - different for demo vs real */}
            {isDemo ? (
              <Link
                href="/examples"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Examples
              </Link>
            ) : (
              <Link
                href={`/businesses/${contractorData.city_slug}/${contractorData.profile_slug}`}
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                More projects by {contractorData.business_name}
              </Link>
            )}

            {/* Title & Meta */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-display mb-4 tracking-tight">{projectData.title}</h1>

              <div className="flex flex-wrap gap-3">
                {locationLabel && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-medium">{locationLabel}</span>
                  </div>
                )}
                {publishedDate && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{publishedDate}</span>
                  </div>
                )}
                {projectData.duration && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-sm">
                    <Wrench className="h-4 w-4 text-primary" />
                    <span>{projectData.duration}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Layout - AI-generated portfolio page */}
            {projectData.portfolio_layout ? (
              <div className="mb-8">
                <DynamicPortfolioRenderer
                  tokens={projectData.portfolio_layout.tokens}
                  blocks={projectData.portfolio_layout.blocks}
                  images={imagesData.map((img): PortfolioImage => ({
                    id: img.id,
                    url: img.src,
                    alt: img.alt,
                    width: img.width || 800,
                    height: img.height || 600,
                  }))}
                />
              </div>
            ) : (
              <>
                {/* Image Gallery with Lightbox */}
                {imagesData.length > 0 && (
                  <PhotoGallery
                    images={imagesData}
                    title={projectData.title || 'Project Gallery'}
                    className="mb-8"
                  />
                )}

                {/* Tags */}
                {projectData.tags && projectData.tags.length > 0 && (
                  <div className="bg-muted/30 rounded-lg p-4 mb-8">
                    <div className="flex flex-wrap gap-2">
                      {projectData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="bg-background hover:bg-background/80">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {renderDescription(projectData.description, projectData.description_blocks)}

                {/* Materials & Techniques */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {projectData.materials && projectData.materials.length > 0 && (
                    <Card className="border-0 bg-gradient-to-br from-muted/50 to-muted/30 shadow-sm">
                      <CardContent className="pt-6">
                        <h3 className="font-display mb-4 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Materials Used
                        </h3>
                        <ul className="space-y-2">
                          {projectData.materials.map((material) => (
                            <li key={material} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>{material}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {projectData.techniques && projectData.techniques.length > 0 && (
                    <Card className="border-0 bg-gradient-to-br from-muted/50 to-muted/30 shadow-sm">
                      <CardContent className="pt-6">
                        <h3 className="font-display mb-4 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Techniques
                        </h3>
                        <ul className="space-y-2">
                          {projectData.techniques.map((technique) => (
                            <li key={technique} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>{technique}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}

            {/* Contractor CTA */}
            <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 shadow-md py-0">
              <CardContent className="py-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Contractor Avatar */}
                    <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-muted ring-2 ring-primary/20">
                      {contractorData.profile_photo_url ? (
                        <Image
                          src={contractorData.profile_photo_url}
                          alt={contractorData.business_name || 'Contractor'}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary font-semibold text-lg">
                          {contractorData.business_name?.charAt(0) || 'C'}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-display text-lg">{contractorData.business_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {contractorData.city}, {contractorData.state} •{' '}
                        {contractorData.services?.slice(0, 3).join(', ')}
                      </p>
                    </div>
                  </div>
                  {isDemo ? (
                    <Button asChild size="lg" className="shadow-sm">
                      <Link href="/signup">
                        Create Your Portfolio
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild size="lg" className="shadow-sm">
                      <Link href={`/businesses/${contractorData.city_slug}/${contractorData.profile_slug}`}>
                        View All Projects
                      </Link>
                    </Button>
                  )}
                </div>
                {!isDemo && hasContactInfo && (
                  <div className="mt-5 pt-5 border-t border-primary/10 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {contactAddress && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-primary mt-0.5" />
                        <span>{contactAddress}</span>
                      </div>
                    )}
                    {contactPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <a href={`tel:${contactPhone}`} className="hover:text-primary transition-colors">
                          {contactPhone}
                        </a>
                      </div>
                    )}
                    {contactWebsite && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        <a
                          href={contactWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors break-all"
                        >
                          {contactWebsite.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Projects - only for real projects */}
            {!isDemo && relatedProjects.length > 0 && (
              <RelatedProjects
                projects={relatedProjects}
                title="Related Projects"
                columns={3}
                showType={true}
                showCity={true}
              />
            )}

            {/* CTA for demo projects */}
            {isDemo && (
              <div className="mt-12 text-center py-12 bg-muted/30 rounded-2xl">
                <h2 className="text-2xl font-display mb-3">Want Your Work to Look Like This?</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create your first project in minutes. Upload photos, describe the job, and get a professional page like this one.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg">
                    <Link href="/signup">Get Started Free</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/examples">View More Examples</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
