'use client';

/**
 * ProjectPublicPreview - Client-rendered public project layout for preview parity.
 *
 * Mirrors the public project detail page UI, but accepts data via props
 * so it can be used inside the chat preview panel.
 */

import Link from 'next/link';
import Image from 'next/image';
import DOMPurify from 'dompurify';
import { ArrowLeft, Calendar, ChevronRight, Home, MapPin, Wrench } from 'lucide-react';
import { Badge, Card, CardContent, Button } from '@/components/ui';
import { PhotoGallery } from '@/components/portfolio/PhotoGallery';
import { DescriptionBlocksClient } from '@/components/portfolio/DescriptionBlocksClient';
import { RelatedProjects } from '@/components/seo/RelatedProjects';
import { getPublicUrl } from '@/lib/storage/upload';
import { formatProjectLocation } from '@/lib/utils/location';
import { cn } from '@/lib/utils';
import type { Project, Business, Contractor, ProjectImage } from '@/types/database';
import type { RelatedProject } from '@/lib/data/projects';
import { sanitizeDescriptionBlocks, hasHtmlTags } from '@/lib/content/description-blocks';

type PreviewImage = ProjectImage & { url?: string };

type BreadcrumbItem = {
  name: string;
  url: string;
};

const MAX_BREADCRUMBS = 5;
const ALLOWED_DESCRIPTION_TAGS = ['p', 'strong', 'em', 'ul', 'ol', 'li', 'br'];

function buildBreadcrumbItems(project: Project): BreadcrumbItem[] {
  const citySlug = project.city_slug || '';
  const typeSlug = project.project_type_slug || '';
  const projectSlug = project.slug || '';

  return [
    { name: 'Home', url: '/' },
    { name: project.city || 'Projects', url: citySlug ? `/${citySlug}` : '/' },
    { name: 'Masonry', url: citySlug ? `/${citySlug}/masonry` : '/' },
    {
      name: project.project_type || 'Project',
      url: citySlug && typeSlug ? `/${citySlug}/masonry/${typeSlug}` : '/',
    },
    {
      name: project.title || 'Project',
      url:
        citySlug && typeSlug && projectSlug
          ? `/${citySlug}/masonry/${typeSlug}/${projectSlug}`
          : '/',
    },
  ];
}

function renderBreadcrumbs(items: BreadcrumbItem[]) {
  if (items.length === 0) return null;

  const shouldTruncate = items.length > MAX_BREADCRUMBS;
  const keepEnd = MAX_BREADCRUMBS - 2;

  const displayItems = shouldTruncate
    ? [items[0]!, { name: '...', url: '' }, ...items.slice(-keepEnd)]
    : items;

  const mobileItems =
    items.length > 3
      ? [items[0]!, { name: '...', url: '' }, ...items.slice(-2)]
      : items;

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className={cn(
          'hidden sm:flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto'
        )}
      >
        <ol className="flex items-center gap-1 flex-wrap">
          {displayItems.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === displayItems.length - 1;
            const isTruncation = item.url === '' && item.name === '...';

            return (
              <li key={`${item.url}-${index}`} className="flex items-center gap-1">
                {!isFirst && (
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/50" />
                )}

                {isTruncation ? (
                  <span className="text-muted-foreground/70" aria-hidden="true">
                    ...
                  </span>
                ) : isLast ? (
                  <span className="text-foreground font-medium">{item.name}</span>
                ) : (
                  <Link
                    href={item.url}
                    className="hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    {isFirst ? <Home className="h-4 w-4" /> : null}
                    {!isFirst && <span>{item.name}</span>}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <nav
        aria-label="Breadcrumb"
        className="sm:hidden flex items-center gap-1 text-xs text-muted-foreground overflow-x-auto"
      >
        <ol className="flex items-center gap-1">
          {mobileItems.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === mobileItems.length - 1;
            const isTruncation = item.url === '' && item.name === '...';

            return (
              <li key={`${item.url}-${index}`} className="flex items-center gap-1">
                {!isFirst && (
                  <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/50" />
                )}

                {isTruncation ? (
                  <span className="text-muted-foreground/70" aria-hidden="true">
                    ...
                  </span>
                ) : isLast ? (
                  <span className="text-foreground font-medium">{item.name}</span>
                ) : (
                  <Link href={item.url} className="hover:text-foreground transition-colors">
                    {isFirst ? <Home className="h-3.5 w-3.5" /> : item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

function renderDescription(description: string, blocks: unknown) {
  const parsedBlocks = sanitizeDescriptionBlocks(blocks);
  if (parsedBlocks.length > 0) {
    return <DescriptionBlocksClient blocks={parsedBlocks} />;
  }

  if (hasHtmlTags(description)) {
    const safeHtml = DOMPurify.sanitize(description, {
      ALLOWED_TAGS: ALLOWED_DESCRIPTION_TAGS,
      ALLOWED_ATTR: [],
    });

    return (
      <article
        className="prose prose-lg max-w-none mb-8"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    );
  }

  return (
    <article className="prose prose-lg max-w-none mb-8">
      {description.split(/\n\s*\n/).map((paragraph, idx) => (
        <p key={idx}>{paragraph}</p>
      ))}
    </article>
  );
}

interface ProjectPublicPreviewProps {
  project: Project;
  /** Business data - accepts both Business and legacy Contractor types */
  business: Business | Contractor;
  images: PreviewImage[];
  relatedProjects: RelatedProject[];
  showBreadcrumbs?: boolean;
  showBackLink?: boolean;
  className?: string;
  /** @deprecated Use `business` prop instead */
  contractor?: Contractor;
}

export function ProjectPublicPreview({
  project,
  business: businessProp,
  images,
  relatedProjects,
  showBreadcrumbs = true,
  showBackLink = true,
  className,
  contractor: deprecatedContractorProp,
}: ProjectPublicPreviewProps) {
  // Support deprecated contractor prop for backward compatibility
  const business = businessProp || deprecatedContractorProp!;
  // Normalize field names (Business uses 'name', Contractor uses 'business_name')
  const businessName = 'name' in business ? business.name : business.business_name;
  const sortedImages = [...images].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
  );

  const galleryImages = sortedImages.map((img) => ({
    id: img.id,
    src: img.url || getPublicUrl('project-images', img.storage_path),
    alt: img.alt_text || project.title || 'Project image',
    width: img.width || undefined,
    height: img.height || undefined,
  }));

  const publishedDate = project.published_at
    ? new Date(project.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const breadcrumbs = buildBreadcrumbItems(project);
  const locationLabel = formatProjectLocation({
    neighborhood: project.neighborhood,
    city: project.city,
    state: project.state ?? business.state,
  });

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {showBreadcrumbs && (
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            {renderBreadcrumbs(breadcrumbs)}
          </div>
        </header>
      )}

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {showBackLink && (
            <Link
              href={`/businesses/${business.city_slug || ''}/${('slug' in business ? business.slug : business.profile_slug) || business.id}`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              More projects by {businessName}
            </Link>
          )}

          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              {project.title}
            </h1>

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
              {project.duration && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-sm">
                  <Wrench className="h-4 w-4 text-primary" />
                  <span>{project.duration}</span>
                </div>
              )}
            </div>
          </div>

          {galleryImages.length > 0 && (
            <PhotoGallery
              images={galleryImages}
              title={project.title || 'Project Gallery'}
              className="mb-8"
            />
          )}

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

          {project.description && renderDescription(project.description, project.description_blocks)}

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

          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 shadow-md">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-muted ring-2 ring-primary/20">
                    {business.profile_photo_url ? (
                      <Image
                        src={business.profile_photo_url}
                        alt={businessName || 'Business'}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary font-semibold text-lg">
                        {businessName?.charAt(0) || 'B'}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{businessName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {business.city}, {business.state} •{' '}
                      {business.services?.slice(0, 3).join(', ')}
                    </p>
                  </div>
                </div>
                <Button asChild size="lg" className="shadow-sm">
                  <Link href={`/businesses/${business.city_slug || ''}/${('slug' in business ? business.slug : business.profile_slug) || business.id}`}>
                    View All Projects
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

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
  );
}
