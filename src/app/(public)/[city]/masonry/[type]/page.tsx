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
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Building2, Wrench, ArrowRight, Hammer, Calendar } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import {
  generateProjectListSchema,
  generateServiceSchema,
  schemaToString,
} from '@/lib/seo/structured-data';
import { getPublicUrl } from '@/lib/storage/upload';
import { MASONRY_SERVICES } from '@/lib/constants/services';
import type { Contractor, Project, ProjectImage } from '@/types/database';

type PageParams = {
  params: Promise<{
    city: string;
    type: string;
  }>;
};

/**
 * Type for project with contractor and cover image.
 */
type ProjectWithDetails = Project & {
  contractor: Contractor;
  cover_image?: ProjectImage;
};

/**
 * Service description templates for SEO-optimized content.
 * These are used to generate unique, city-specific descriptions.
 *
 * Variables available: {city}, {state}, {projectCount}, {contractorCount}
 */
const SERVICE_DESCRIPTIONS: Record<string, {
  headline: string;
  description: string;
  features: string[];
}> = {
  'chimney-repair': {
    headline: 'Professional Chimney Repair & Rebuild Services',
    description: 'Find expert chimney repair contractors in {city}. From minor mortar repairs to complete chimney rebuilds, browse completed projects and connect with local masonry professionals who specialize in chimney restoration.',
    features: ['Chimney cap installation', 'Crown repair', 'Flashing repair', 'Tuckpointing', 'Complete rebuilds'],
  },
  'tuckpointing': {
    headline: 'Expert Tuckpointing & Repointing Services',
    description: 'Browse tuckpointing projects in {city} to see the quality of work from local masonry contractors. Tuckpointing restores the mortar joints between bricks, preventing water damage and improving your home\'s appearance.',
    features: ['Mortar joint repair', 'Historic preservation', 'Color matching', 'Structural reinforcement', 'Weather sealing'],
  },
  'brick-repair': {
    headline: 'Brick Repair & Replacement Specialists',
    description: 'Need brick repair in {city}? Browse completed brick repair and replacement projects from local contractors. From cracked bricks to full wall restorations, find the right mason for your project.',
    features: ['Crack repair', 'Brick replacement', 'Spalling repair', 'Efflorescence removal', 'Brick cleaning'],
  },
  'stone-work': {
    headline: 'Stone Work & Veneer Installation',
    description: 'Explore stone masonry projects in {city}. Natural stone and veneer add timeless beauty to any property. See how local contractors transform homes with expert stone installation.',
    features: ['Natural stone installation', 'Stone veneer', 'Flagstone patios', 'Stone columns', 'Decorative accents'],
  },
  'retaining-walls': {
    headline: 'Professional Retaining Wall Construction',
    description: 'Looking for retaining wall contractors in {city}? Browse completed retaining wall projects that combine structural engineering with aesthetic design to manage slopes and create usable outdoor spaces.',
    features: ['Block retaining walls', 'Stone retaining walls', 'Drainage solutions', 'Tiered walls', 'Landscaping integration'],
  },
  'concrete-work': {
    headline: 'Quality Concrete Work & Construction',
    description: 'Find concrete contractors in {city} who deliver quality results. From driveways to patios, browse completed concrete projects and see the craftsmanship of local professionals.',
    features: ['Driveways', 'Patios', 'Sidewalks', 'Foundations', 'Decorative concrete'],
  },
  'foundation-repair': {
    headline: 'Foundation Repair & Restoration',
    description: 'Foundation problems require expert solutions. Browse foundation repair projects in {city} to find contractors experienced in stabilizing and restoring residential and commercial foundations.',
    features: ['Crack repair', 'Wall stabilization', 'Waterproofing', 'Underpinning', 'Structural assessment'],
  },
  'fireplace': {
    headline: 'Fireplace Construction & Restoration',
    description: 'Add warmth and character to your home with expert fireplace construction in {city}. Browse fireplace projects from local masons who specialize in both traditional and modern designs.',
    features: ['Indoor fireplaces', 'Outdoor fireplaces', 'Fire pits', 'Hearth construction', 'Chimney integration'],
  },
  'outdoor-living': {
    headline: 'Outdoor Living Space Construction',
    description: 'Transform your backyard in {city} with professional outdoor living construction. Browse patios, outdoor kitchens, and more from local masonry contractors.',
    features: ['Outdoor kitchens', 'Patios', 'Pergola bases', 'Built-in seating', 'Fire features'],
  },
  'commercial': {
    headline: 'Commercial Masonry Services',
    description: 'Browse commercial masonry projects in {city}. From storefront facades to large-scale construction, see how local contractors deliver quality workmanship on commercial properties.',
    features: ['Storefront construction', 'Building facades', 'Structural masonry', 'ADA compliance', 'Code compliance'],
  },
  'restoration': {
    headline: 'Historic Restoration & Preservation',
    description: 'Historic buildings require specialized masonry skills. Browse restoration projects in {city} from contractors who understand preservation techniques and period-appropriate materials.',
    features: ['Historic preservation', 'Period-accurate materials', 'Landmark compliance', 'Gentle cleaning', 'Documentation'],
  },
  'waterproofing': {
    headline: 'Masonry Waterproofing & Sealing',
    description: 'Protect your masonry investment with professional waterproofing in {city}. Browse completed sealing and waterproofing projects that extend the life of brick, stone, and concrete.',
    features: ['Brick sealing', 'Basement waterproofing', 'Foundation coating', 'Drainage systems', 'Moisture barriers'],
  },
};

/**
 * Get service info from MASONRY_SERVICES constant.
 */
function getServiceInfo(typeSlug: string) {
  const service = MASONRY_SERVICES.find((s) => s.id === typeSlug);
  return service || { id: typeSlug, label: formatServiceName(typeSlug), icon: '🔧' };
}

/**
 * Format service type slug to display name.
 * @example "chimney-repair" -> "Chimney Repair"
 */
function formatServiceName(typeSlug: string): string {
  return typeSlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Extract city name from slug for display.
 * @example "denver-co" -> "Denver, CO"
 */
function formatCityName(citySlug: string): string {
  const parts = citySlug.split('-');
  if (parts.length < 2) return citySlug;

  const state = parts.pop()?.toUpperCase() || '';
  const city = parts
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return `${city}, ${state}`;
}

/**
 * Generate static params for pre-rendering service type pages.
 * Generates for all city + service type combinations with published projects.
 */
export async function generateStaticParams() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('[generateStaticParams] Skipping: SUPABASE_SERVICE_ROLE_KEY not configured');
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
    console.error('[generateStaticParams] Error fetching combinations:', error);
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
  const serviceInfo = getServiceInfo(type);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';
  const supabase = createAdminClient();

  // Fetch first published project's cover image for OG
  const { data: projectData } = await supabase
    .from('projects')
    .select(`project_images(storage_path, alt_text, display_order)`)
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

  // Get cover image URL from first project
  let imageUrl: string | undefined;
  let imageAlt: string | undefined;

  if (project?.project_images?.length) {
    const sortedImages = [...project.project_images].sort(
      (a, b) => a.display_order - b.display_order
    );
    const coverImage = sortedImages[0];
    if (coverImage) {
      imageUrl = getPublicUrl('project-images', coverImage.storage_path);
      imageAlt = coverImage.alt_text || `${serviceInfo.label} project in ${cityName}`;
    }
  }

  const title = `${serviceInfo.label} in ${cityName} | Projects & Contractors`;

  // Use service-specific description or generate generic one
  const serviceDesc = SERVICE_DESCRIPTIONS[type];
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

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${siteUrl}/${city}/masonry/${type}`,
      images: imageUrl ? [{ url: imageUrl, alt: imageAlt }] : [],
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: `${siteUrl}/${city}/masonry/${type}`,
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
      contractor:contractors(*),
      project_images(*)
    `)
    .eq('city_slug', city)
    .eq('project_type_slug', type)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);

  if (projectsError) {
    console.error('[ServiceTypePage] Error fetching projects:', projectsError);
  }

  // Type assertion for query result
  type ProjectWithRelations = Project & {
    contractor: Contractor;
    project_images: ProjectImage[];
  };
  const projects = (projectsData || []) as ProjectWithRelations[];

  // If no projects of this type in this city, show 404
  if (projects.length === 0) {
    notFound();
  }

  // Add cover image to each project
  const projectsWithDetails: ProjectWithDetails[] = projects.map((project) => {
    const sortedImages = project.project_images.sort(
      (a, b) => a.display_order - b.display_order
    );
    return {
      ...project,
      cover_image: sortedImages[0],
    };
  });

  // Get unique contractors who have done this type of work
  const contractorsMap = new Map<string, Contractor>();
  projects.forEach((p) => {
    if (p.contractor && !contractorsMap.has(p.contractor.id)) {
      contractorsMap.set(p.contractor.id, p.contractor);
    }
  });
  const contractors = Array.from(contractorsMap.values());

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
  const serviceInfo = getServiceInfo(type);
  const serviceDesc = SERVICE_DESCRIPTIONS[type];

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
    projects.map((p) => ({ ...p, contractor: p.contractor })),
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
      contractorCount: contractors.length,
      providers: contractors.slice(0, 5).map((c) => ({
        name: c.business_name || 'Contractor',
        id: c.id,
        citySlug: c.city_slug || city,
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
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8 md:p-12">
              <div className="text-4xl mb-4">{serviceInfo.icon}</div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                {serviceInfo.label} in {cityName}
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                {serviceDesc?.headline || `Professional ${serviceInfo.label.toLowerCase()} services`}
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Hammer className="h-4 w-4" />
                  {projects.length} completed {projects.length === 1 ? 'project' : 'projects'}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {contractors.length} local {contractors.length === 1 ? 'contractor' : 'contractors'}
                </span>
              </div>
            </div>
          </div>

          {/* Service Description (SEO content) */}
          {serviceDesc && (
            <div className="max-w-4xl mx-auto mb-12">
              <div className="prose prose-gray max-w-none">
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

          {/* Contractors Section */}
          {contractors.length > 0 && (
            <div className="max-w-4xl mx-auto mb-12">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Contractors Offering {serviceInfo.label}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {contractors.slice(0, 4).map((contractor) => (
                  <Link
                    key={contractor.id}
                    href={`/contractors/${contractor.city_slug}/${contractor.id}`}
                    className="group"
                  >
                    <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-0 bg-card">
                      <CardContent className="p-4 flex items-center gap-4">
                        {/* Contractor Photo */}
                        <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-muted ring-2 ring-background shadow-sm">
                          {contractor.profile_photo_url ? (
                            <Image
                              src={contractor.profile_photo_url}
                              alt={contractor.business_name || 'Contractor'}
                              fill
                              className="object-cover"
                              sizes="56px"
                              placeholder="blur"
                              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMSAxIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4="
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-lg">
                              {contractor.business_name?.charAt(0) || 'C'}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                            {contractor.business_name}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {contractor.services?.slice(0, 2).join(', ')}
                          </p>
                        </div>

                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              {contractors.length > 4 && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  + {contractors.length - 4} more contractors offering this service
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

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="truncate">
                          by {project.contractor.business_name}
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
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </main>

        {/* Footer CTA */}
        <footer className="mt-12 py-12 bg-gradient-to-b from-muted/30 to-muted/10">
          <div className="container mx-auto px-4 text-center">
            <p className="text-lg font-medium mb-2">
              Need {serviceInfo.label.toLowerCase()} in {cityName}?
            </p>
            <p className="text-muted-foreground mb-6">
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
