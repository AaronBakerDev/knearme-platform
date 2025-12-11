/**
 * RelatedProjects Component - Displays related projects for internal linking.
 *
 * Shows projects related to the current one based on:
 * 1. Same contractor (highest relevance)
 * 2. Same service type in different cities
 * 3. Different service types in same city
 *
 * This component is crucial for SEO:
 * - Improves internal linking structure
 * - Keeps visitors engaged longer (reduces bounce rate)
 * - Helps search engines discover more content
 *
 * @see /docs/SEO-DISCOVERY-STRATEGY.md for internal linking architecture
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getPublicUrl } from '@/lib/storage/upload';

import { RelatedProject } from '@/lib/data/projects';

type RelatedProjectsProps = {
  /** Array of related projects to display */
  projects: RelatedProject[];
  /** Title for the section */
  title?: string;
  /** Number of columns (2, 3, or 4) */
  columns?: 2 | 3 | 4;
  /** Additional CSS classes */
  className?: string;
  /** Show project type badge */
  showType?: boolean;
  /** Show contractor name */
  showContractor?: boolean;
  /** Show city name */
  showCity?: boolean;
};

/**
 * Grid column class mapping for responsive layouts.
 */
const columnClasses = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-4',
};

export function RelatedProjects({
  projects,
  title = 'Related Projects',
  columns = 4,
  className = '',
  showType = true,
  showContractor = false,
  showCity = false,
}: RelatedProjectsProps) {
  if (projects.length === 0) {
    return null;
  }

  return (
    <section className={`mt-12 ${className}`}>
      <h2 className="text-xl font-semibold mb-6">{title}</h2>
      <div className={`grid ${columnClasses[columns]} gap-4 md:gap-6`}>
        {projects.map((project) => (
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
                    alt={project.cover_image.alt_text || project.title || 'Related project'}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes={columns === 4 ? '(max-width: 768px) 50vw, 25vw' : '(max-width: 640px) 100vw, 33vw'}
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMSAxIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4="
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <Building2 className="h-8 w-8" />
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
              </div>

              <CardContent className="p-3">
                <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {project.title}
                </h3>
                <div className="flex flex-col gap-0.5 mt-1">
                  {showType && project.project_type && (
                    <p className="text-xs text-muted-foreground">
                      {project.project_type}
                    </p>
                  )}
                  {showContractor && project.contractor_business_name && (
                    <p className="text-xs text-muted-foreground">
                      by {project.contractor_business_name}
                    </p>
                  )}
                  {showCity && project.city && (
                    <p className="text-xs text-muted-foreground">
                      {project.city}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}


