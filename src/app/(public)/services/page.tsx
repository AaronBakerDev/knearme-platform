/**
 * Services Index Page - Hub for all masonry service types.
 *
 * URL: /services
 *
 * Design: "Craft & Earth" aesthetic with:
 * - Dramatic hero with textured gradient
 * - Asymmetric bento-grid layout
 * - Animated service cards with hover effects
 * - Editorial typography with serif headlines
 *
 * @see /docs/11-seo-discovery/page-templates/national-service.md
 */

import { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  MapPin,
  Sparkles,
  Shield,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { SERVICE_CONTENT } from '@/lib/constants/service-content';
import { getServiceTypes } from '@/lib/data/services';
import { createAdminClient } from '@/lib/supabase/server';
import type { ServiceId } from '@/lib/constants/services';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';

export const metadata: Metadata = {
  title: 'Masonry Services | Find Local Contractors | KnearMe',
  description:
    'Browse masonry services including chimney repair, tuckpointing, brick repair, stone work, foundation repair, and more. Find qualified contractors in your area.',
  keywords: [
    'masonry services',
    'chimney repair',
    'tuckpointing',
    'brick repair',
    'stone masonry',
    'foundation repair',
    'masonry contractors',
  ].join(', '),
  openGraph: {
    title: 'Masonry Services | KnearMe',
    description: 'Browse masonry services and find qualified contractors in your area.',
    type: 'website',
    url: `${SITE_URL}/services`,
  },
  alternates: {
    canonical: `${SITE_URL}/services`,
  },
};

/**
 * Service card data with stats.
 */
interface ServiceCardData {
  id: ServiceId;
  urlSlug: string;
  label: string;
  shortDescription: string;
  keywords: string[];
  projectCount: number;
  cityCount: number;
}

/**
 * Fetch service statistics from database.
 */
type ServiceStats = {
  projectCount: number;
  cityCount: number;
  cities: Set<string>;
};

async function getServiceStats(): Promise<Map<string, ServiceStats>> {
  const supabase = createAdminClient();
  const stats = new Map<string, ServiceStats>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('projects')
    .select('project_type_slug, city_slug')
    .eq('status', 'published');

  if (error) {
    console.error('[getServiceStats] Error:', error);
    return stats;
  }

  type ProjectRow = { project_type_slug: string; city_slug: string };
  const projects = (data || []) as ProjectRow[];

  // Aggregate stats per service type
  projects.forEach((project) => {
    if (!project.project_type_slug) return;

    const existing = stats.get(project.project_type_slug);
    if (existing) {
      existing.projectCount++;
      if (project.city_slug && !existing.cities.has(project.city_slug)) {
        existing.cities.add(project.city_slug);
        existing.cityCount++;
      }
    } else {
      const cities = new Set<string>();
      if (project.city_slug) cities.add(project.city_slug);
      stats.set(project.project_type_slug, {
        projectCount: 1,
        cityCount: project.city_slug ? 1 : 0,
        cities,
      });
    }
  });

  return stats;
}

/**
 * Service icon mapping for visual variety.
 */
const SERVICE_ICONS: Record<string, string> = {
  'chimney-repair': '🏠',
  tuckpointing: '🧱',
  'brick-repair': '🔨',
  'stone-masonry': '🪨',
  'foundation-repair': '🏗️',
  'historic-restoration': '🏛️',
  'masonry-waterproofing': '💧',
  'efflorescence-removal': '✨',
};

export default async function ServicesIndexPage() {
  // Fetch service types from database and stats in parallel
  const [serviceTypes, stats] = await Promise.all([
    getServiceTypes(),
    getServiceStats(),
  ]);

  // Build service cards from database + SERVICE_CONTENT
  const serviceCards: ServiceCardData[] = [];

  serviceTypes.forEach((serviceType) => {
    const serviceId = serviceType.service_id as ServiceId;
    const content = SERVICE_CONTENT[serviceId];

    // Use database data, fallback to SERVICE_CONTENT for rich content
    const serviceStats = stats.get(serviceId) || { projectCount: 0, cityCount: 0 };

    serviceCards.push({
      id: serviceId,
      urlSlug: serviceType.url_slug,
      label: serviceType.label || content?.label || serviceId,
      shortDescription: serviceType.short_description || content?.shortDescription || '',
      keywords: content?.keywords.slice(0, 3) || [],
      projectCount: serviceStats.projectCount,
      cityCount: serviceStats.cityCount,
    });
  });

  // Sort by project count descending
  serviceCards.sort((a, b) => b.projectCount - a.projectCount);

  // Calculate totals
  const totalProjects = serviceCards.reduce((sum, s) => sum + s.projectCount, 0);
  const totalCities = new Set(
    serviceCards.flatMap((s) => Array.from(stats.get(s.id)?.cities || []))
  ).size;

  // Breadcrumbs
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Services', url: '/services' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative bg-hero-gradient hero-pattern overflow-hidden">
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 pt-4">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* Hero Content */}
        <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
          <div className="max-w-4xl">
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-6 animate-fade-up opacity-0 stagger-1">
              <div className="h-px w-12 bg-primary/60" />
              <span className="text-sm font-semibold tracking-wide uppercase text-primary">
                Professional Masonry
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display tracking-tight text-balance mb-6 animate-fade-up opacity-0 stagger-2">
              Expert Masonry Services
              <span className="block text-muted-foreground mt-2">
                Built to Last
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 animate-fade-up opacity-0 stagger-3">
              Discover comprehensive guides to masonry services. From chimney repair to
              historic restoration, find the expertise you need and connect with
              qualified contractors in your area.
            </p>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-8 md:gap-12 animate-fade-up opacity-0 stagger-4">
              <div className="stat-block">
                <span className="stat-value text-primary">{serviceCards.length}</span>
                <span className="stat-label">Service Types</span>
              </div>
              <div className="stat-block">
                <span className="stat-value">{totalProjects.toLocaleString()}</span>
                <span className="stat-label">Projects Completed</span>
              </div>
              <div className="stat-block">
                <span className="stat-value">{totalCities.toLocaleString()}</span>
                <span className="stat-label">Cities Served</span>
              </div>
            </div>
          </div>

          {/* Decorative Element */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-full opacity-10 pointer-events-none hidden lg:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--primary)_1px,_transparent_1px)] bg-[size:24px_24px]" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-16 lg:py-20">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-16">
          {serviceCards.map((service, index) => {
            // First two cards are featured (larger)
            const isFeatured = index < 2;
            const icon = SERVICE_ICONS[service.urlSlug] || '🔧';

            return (
              <Link
                key={service.id}
                href={`/services/${service.urlSlug}`}
                className={`group ${isFeatured && index === 0 ? 'lg:col-span-2 lg:row-span-2' : ''}`}
              >
                <Card
                  className={`
                    card-interactive h-full border-0 shadow-depth overflow-hidden
                    ${isFeatured && index === 0 ? 'bg-gradient-to-br from-primary/5 via-card to-card' : 'bg-card'}
                  `}
                >
                  <CardContent className={`p-6 ${isFeatured && index === 0 ? 'lg:p-8' : ''} h-full flex flex-col`}>
                    {/* Icon & Badge Row */}
                    <div className="flex items-start justify-between mb-4">
                      <span
                        className={`
                          ${isFeatured && index === 0 ? 'text-4xl lg:text-5xl' : 'text-3xl'}
                          transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3
                        `}
                        role="img"
                        aria-hidden="true"
                      >
                        {icon}
                      </span>
                      {service.projectCount > 0 && (
                        <Badge variant="secondary" className="badge-earth text-xs">
                          {service.projectCount} projects
                        </Badge>
                      )}
                    </div>

                    {/* Title */}
                    <h2
                      className={`
                        font-display tracking-tight mb-2 group-hover:text-primary transition-colors
                        ${isFeatured && index === 0 ? 'text-2xl lg:text-3xl' : 'text-xl'}
                      `}
                    >
                      {service.label}
                    </h2>

                    {/* Description */}
                    <p
                      className={`
                        text-muted-foreground mb-4 flex-grow
                        ${isFeatured && index === 0 ? 'text-base lg:text-lg line-clamp-3' : 'text-sm line-clamp-2'}
                      `}
                    >
                      {service.shortDescription}
                    </p>

                    {/* Keywords (featured only) */}
                    {isFeatured && index === 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {service.keywords.map((keyword) => (
                          <Badge key={keyword} variant="outline" className="text-xs bg-background/50">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {service.cityCount > 0 && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {service.cityCount} cities
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        Explore
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Value Proposition Section */}
        <section className="bg-section-gradient rounded-3xl p-8 md:p-12 lg:p-16 mb-16 texture-grain">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display tracking-tight mb-4">
              Why Choose KnearMe?
            </h2>
            <p className="text-muted-foreground text-lg">
              We connect homeowners with verified masonry professionals who showcase
              their actual work, not stock photos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: 'Verified Work',
                description: 'Real project photos from actual contractors',
              },
              {
                icon: Sparkles,
                title: 'AI-Powered',
                description: 'Smart matching to find the right pro',
              },
              {
                icon: MapPin,
                title: 'Local Experts',
                description: 'Contractors who know your area',
              },
              {
                icon: Clock,
                title: 'Fast Response',
                description: 'Get quotes from pros quickly',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-card rounded-2xl p-6 shadow-depth hover:shadow-elevated transition-shadow"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden rounded-3xl bg-primary p-8 md:p-12 lg:p-16 text-primary-foreground">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:32px_32px]" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-sm font-medium mb-6">
              <CheckCircle2 className="h-4 w-4" />
              Free to get started
            </span>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display tracking-tight mb-4">
              Are You a Masonry Contractor?
            </h2>
            <p className="text-lg md:text-xl opacity-90 mb-8">
              Showcase your craftsmanship, attract local homeowners, and grow your
              business with a professional portfolio that ranks on Google.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                variant="secondary"
                className="rounded-full px-8 text-primary font-semibold shadow-lg hover:shadow-xl transition-shadow"
                asChild
              >
                <Link href="/signup">Create Your Portfolio</Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="rounded-full px-8 text-primary-foreground hover:bg-white/10"
                asChild
              >
                <Link href="/#how-it-works">See How It Works</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// ISR: Revalidate every hour
export const revalidate = 3600;
