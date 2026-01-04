import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  Globe,
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  Star,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { Badge, Button, Card, CardContent } from '@/components/ui';
import { getPublicUrl } from '@/lib/storage/upload';
import { slugify } from '@/lib/utils/slugify';
import type { Contractor, Project, ProjectImage } from '@/types/database';

export type ProjectWithCover = Project & {
  cover_image?: ProjectImage;
};

type ContractorProfileHeaderProps = {
  contractor: Contractor;
  totalProjects: number;
};

export function ContractorProfileHeader({
  contractor,
  totalProjects,
}: ContractorProfileHeaderProps) {
  return (
    <div className="max-w-7xl mx-auto mb-16 animate-fade-up">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
        <div className="absolute inset-0 bg-muted/20 opacity-30 pointer-events-none" />

        <div className="relative p-8 md:p-12">
          <div className="flex flex-col md:flex-row gap-10 items-center md:items-start text-center md:text-left">
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
              <div className="absolute bottom-2 right-2 bg-background rounded-full p-1 shadow-lg ring-2 ring-primary/20">
                <CheckCircle2 className="h-6 w-6 text-primary fill-primary/10" />
              </div>
            </div>

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

              {contractor.services && contractor.services.length > 0 && (
                <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2 animate-fade-up stagger-4">
                  {contractor.services.map((service, idx) => (
                    <Badge
                      key={service}
                      variant="secondary"
                      className="bg-white/5 hover:bg-primary/20 hover:text-primary border-white/10 transition-all duration-300 animate-chip-slide-in"
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
  );
}

type ContractorAboutAndContactProps = {
  contractor: Contractor;
  contactAddress: string;
  contactPhone: string;
  contactWebsite: string;
  hasContactInfo: boolean;
};

export function ContractorAboutAndContact({
  contractor,
  contactAddress,
  contactPhone,
  contactWebsite,
  hasContactInfo,
}: ContractorAboutAndContactProps) {
  return (
    <div className="max-w-7xl mx-auto mb-20 grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-up stagger-5">
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
                  <a
                    href={`tel:${contactPhone}`}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
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
  );
}

type ContractorProjectsSectionProps = {
  projects: ProjectWithCover[];
  hasPublishedProjects: boolean;
  city: string;
  slug: string;
  validatedPage: number;
  totalPages: number;
};

export function ContractorProjectsSection({
  projects,
  hasPublishedProjects,
  city,
  slug,
  validatedPage,
  totalPages,
}: ContractorProjectsSectionProps) {
  return (
    <div className="max-w-7xl mx-auto mb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 px-1">
        <div>
          <h2 className="text-3xl md:text-4xl font-display tracking-tight mb-2">
            Project Portfolio
          </h2>
          <p className="text-muted-foreground">
            {hasPublishedProjects
              ? 'Detailed case studies and high-resolution visuals of recent masonry work.'
              : 'New project photos are on the way. Check back soon for finished work.'}
          </p>
        </div>
        <div className="hidden md:flex gap-2">
          <div className="h-10 w-1 rounded-full bg-primary/20" />
          <span className="text-sm font-medium text-muted-foreground self-center uppercase tracking-widest">
            Selected Works
          </span>
        </div>
      </div>

      {hasPublishedProjects ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, idx) => (
              <Link
                key={project.id}
                href={`/${project.city_slug}/masonry/${project.project_type_slug}/${project.slug}`}
                className="group block h-full animate-fade-up"
                style={{ animationDelay: `${0.1 + (idx % 3) * 0.1}s` }}
              >
                <Card className="overflow-hidden bg-card/40 border border-white/5 backdrop-blur-sm card-interactive h-full flex flex-col group">
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

                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm border-none shadow-xl">
                        View Project
                      </Badge>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                  </div>

                  <CardContent className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase tracking-widest font-bold border-primary/30 text-primary bg-primary/5"
                        >
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
                      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                        Full Project Story
                      </span>
                      <ChevronRight className="h-4 w-4 text-primary transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <nav
              className="flex items-center justify-center gap-2 mt-8"
              aria-label="Project portfolio pagination"
            >
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

              <span className="text-sm text-muted-foreground px-4">
                Page {validatedPage} of {totalPages}
              </span>

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
  );
}

type ContractorProfileFooterProps = {
  contractor: Contractor;
};

export function ContractorProfileFooter({ contractor }: ContractorProfileFooterProps) {
  const businessName = contractor.business_name || 'this contractor';
  const cityName = contractor.city || 'your area';

  return (
    <footer className="mt-20 py-20 bg-hero-gradient border-t border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full translate-y-1/2 pointer-events-none" />
      <div className="container relative mx-auto px-4 text-center">
        <h3 className="text-3xl md:text-4xl font-display mb-6 tracking-tight">
          Ready to start your own project?
        </h3>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Contact {businessName} today to discuss your vision and get a professional consultation for your masonry needs.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="rounded-full px-8 text-base font-semibold glow">
            Request a Consultation
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full px-8 text-base font-semibold border-white/10 hover:bg-white/5"
          >
            View More {cityName} Pros
          </Button>
        </div>
      </div>
    </footer>
  );
}
