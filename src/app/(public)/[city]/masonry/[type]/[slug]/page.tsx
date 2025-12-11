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
import { MapPin, Calendar, Wrench, ArrowLeft, Building2 } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PhotoGallery } from '@/components/portfolio/PhotoGallery';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { RelatedProjects, fetchRelatedProjects } from '@/components/seo/RelatedProjects';
import {
  generateProjectSchema,
  schemaToString,
} from '@/lib/seo/structured-data';
import { getPublicUrl } from '@/lib/storage/upload';
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
 * Returns empty array if admin client unavailable (falls back to ISR).
 */
export async function generateStaticParams() {
  // Skip static generation if service role key is missing
  // Next.js will use ISR/dynamic rendering instead
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('[generateStaticParams] Skipping: SUPABASE_SERVICE_ROLE_KEY not configured');
    return [];
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

    if (!projects) return [];

    return projects.map((p) => ({
      city: p.city_slug,
      type: p.project_type_slug,
      slug: p.slug,
    }));
  } catch (error) {
    console.error('[generateStaticParams] Error fetching projects:', error);
    return [];
  }
}

// Type for project with nested relations
type ProjectWithRelations = Project & {
  contractor: Contractor;
  project_images: ProjectImage[];
};

/**
 * Generate metadata for SEO including OG/Twitter images.
 *
 * Fetches project data with cover image for social sharing previews.
 * OG images significantly improve click-through rates on social media.
 */
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();

  // Include project_images to get cover image for OG/Twitter
  const { data } = await supabase
    .from('projects')
    .select(`
      *,
      contractor:contractors(business_name, city, state),
      project_images(storage_path, alt_text, display_order)
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';

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
 */
export default async function ProjectPage({ params }: PageParams) {
  const { city, type, slug } = await params;
  const supabase = createAdminClient();

  // Fetch project with contractor and images
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      contractor:contractors(*),
      project_images(*)
    `)
    .eq('slug', slug)
    .eq('city_slug', city)
    .eq('project_type_slug', type)
    .eq('status', 'published')
    .single();

  // Type assertion for query result
  const project = data as ProjectWithRelations | null;

  if (error || !project) {
    notFound();
  }

  const contractor = project.contractor;
  const images = project.project_images.sort(
    (a, b) => a.display_order - b.display_order
  );

  // Generate structured data
  const projectSchema = generateProjectSchema(project as Project, contractor, images);

  // Fetch related projects using the enhanced algorithm
  // Shows: same contractor, same type in different cities, different types in same city
  const relatedProjects = await fetchRelatedProjects(supabase, {
    id: project.id,
    contractor_id: project.contractor_id,
    city_slug: city,
    project_type_slug: type,
  }, 6);

  // Breadcrumb items for navigation and schema
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: project.city || 'Projects', url: `/${city}` },
    { name: 'Masonry', url: `/${city}/masonry` },
    { name: project.project_type || 'Project', url: `/${city}/masonry/${type}` },
    { name: project.title || 'Project', url: `/${city}/masonry/${type}/${slug}` },
  ];

  // Format date
  const publishedDate = project.published_at
    ? new Date(project.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <>
      {/* JSON-LD Structured Data (project only - Breadcrumbs handles its own schema) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaToString(projectSchema) }}
      />

      <div className="min-h-screen bg-background">
        {/* Header with Breadcrumbs */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Back link */}
            <Link
              href={`/contractors/${contractor.city_slug}/${contractor.id}`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              More projects by {contractor.business_name}
            </Link>

            {/* Title & Meta */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">{project.title}</h1>

              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    {project.city}, {contractor.state}
                  </span>
                </div>
                {publishedDate && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{publishedDate}</span>
                  </div>
                )}
                {project.duration && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-sm">
                    <Wrench className="h-4 w-4 text-primary" />
                    <span>{project.duration}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Image Gallery with Lightbox */}
            {images.length > 0 && (
              <PhotoGallery
                images={images.map((img) => ({
                  id: img.id,
                  src: getPublicUrl('project-images', img.storage_path),
                  alt: img.alt_text || project.title || 'Project image',
                  width: img.width || undefined,
                  height: img.height || undefined,
                }))}
                title={project.title || 'Project Gallery'}
                className="mb-8"
              />
            )}

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <div className="bg-muted/30 rounded-lg p-4 mb-8">
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-background hover:bg-background/80">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <article className="prose prose-lg max-w-none mb-8">
              {project.description?.split('\n\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </article>

            {/* Materials & Techniques */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {project.materials && project.materials.length > 0 && (
                <Card className="border-0 bg-gradient-to-br from-muted/50 to-muted/30 shadow-sm">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Materials Used
                    </h3>
                    <ul className="space-y-2">
                      {project.materials.map((material) => (
                        <li key={material} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{material}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {project.techniques && project.techniques.length > 0 && (
                <Card className="border-0 bg-gradient-to-br from-muted/50 to-muted/30 shadow-sm">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Techniques
                    </h3>
                    <ul className="space-y-2">
                      {project.techniques.map((technique) => (
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

            {/* Contractor CTA */}
            <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 shadow-md">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Contractor Avatar */}
                    <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-muted ring-2 ring-primary/20">
                      {contractor.profile_photo_url ? (
                        <Image
                          src={contractor.profile_photo_url}
                          alt={contractor.business_name || 'Contractor'}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary font-semibold text-lg">
                          {contractor.business_name?.charAt(0) || 'C'}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{contractor.business_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {contractor.city}, {contractor.state} •{' '}
                        {contractor.services?.slice(0, 3).join(', ')}
                      </p>
                    </div>
                  </div>
                  <Button asChild size="lg" className="shadow-sm">
                    <Link href={`/contractors/${contractor.city_slug}/${contractor.id}`}>
                      View All Projects
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Related Projects - improves SEO via internal linking and keeps visitors engaged */}
            <RelatedProjects
              projects={relatedProjects}
              title="Related Projects"
              columns={3}
              showType={true}
              showCity={true}
            />
          </div>
        </main>
      </div>
    </>
  );
}
