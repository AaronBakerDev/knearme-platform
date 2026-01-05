import Link from 'next/link';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowUpRight,
  Camera,
  ChevronRight,
  Clock,
  Eye,
  FolderOpen,
  MapPin,
  Pencil,
  Plus,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { resolveProjectImageUrl } from '@/lib/storage/project-images';
import { logger } from '@/lib/logging';
import type { Project, ProjectImage } from '@/types/database';

/**
 * Contractor dashboard - Craftsman Workshop aesthetic.
 *
 * Design principles:
 * - The contractor's work is the star
 * - Warm, professional, trustworthy
 * - Clear hierarchy: primary action prominently placed
 * - Minimal chrome, maximum showcase
 *
 * @see EPIC-004-portfolio.md US-004-09
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get contractor profile
  const { data: contractorData } = await supabase
    .from('contractors')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  if (!contractorData) {
    redirect('/profile/setup');
  }

  // Type assertion for the contractor data
  const contractor = contractorData as {
    id: string;
    profile_slug: string | null;
    business_name: string | null;
    city: string | null;
    city_slug: string | null;
    state: string | null;
    services: string[] | null;
    email: string;
  };

  // Check if profile is complete
  if (!contractor.business_name || !contractor.city || !contractor.services?.length) {
    redirect('/profile/setup');
  }

  // Get accurate published/draft counts
  const [publishedCountRes, draftCountRes] = await Promise.all([
    supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('contractor_id', contractor.id)
      .eq('status', 'published'),
    supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('contractor_id', contractor.id)
      .eq('status', 'draft'),
  ]);

  const publishedCount = publishedCountRes.count ?? 0;
  const draftCount = draftCountRes.count ?? 0;

  // Get projects with images
  const { data: projectsData, error: projectsError, count: totalCount } = await supabase
    .from('projects')
    .select('*, project_images!project_images_project_id_fkey(id, storage_path, image_type, display_order)', { count: 'exact' })
    .eq('contractor_id', contractor.id)
    .order('created_at', { ascending: false })
    .limit(6);

  if (projectsError) {
    logger.error('[Dashboard] Projects query error', { error: projectsError });
  }

  type ProjectRow = Pick<Project, 'id' | 'title' | 'project_type' | 'city' | 'status'> & {
    project_images: ProjectImage[];
  };
  const projects = (projectsData ?? []) as ProjectRow[];
  const hasProjects = projects.length > 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-24 md:pb-8">
      {/* Header Strip - Minimal, functional */}
      <header className="flex items-center justify-between py-4 md:py-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-terracotta-subtle flex items-center justify-center">
            <span className="text-terracotta font-craftsman text-lg md:text-xl">
              {contractor.business_name?.charAt(0) || 'K'}
            </span>
          </div>
          <div>
            <h1 className="font-craftsman text-lg md:text-xl text-foreground">
              {contractor.business_name}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {contractor.city}, {contractor.state}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9" asChild title="Edit Profile">
            <Link href="/profile/edit">
              <Pencil className="w-4 h-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" asChild title="View Public Profile">
            <Link
              href={`/businesses/${contractor.city_slug}/${contractor.profile_slug || contractor.id}`}
              target="_blank"
            >
              <Eye className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="py-6 md:py-10 space-y-8 md:space-y-12">
        {/* Primary Action - Add New Project */}
        <Link href="/projects/new" className="block group">
          <div className="dashboard-card-primary p-6 md:p-8 relative overflow-hidden grain-overlay">
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Camera className="w-5 h-5 text-terracotta" />
                  <span className="text-xs font-medium uppercase tracking-wider text-terracotta/80">
                    Add to your portfolio
                  </span>
                </div>
                <h2 className="font-craftsman text-2xl md:text-3xl text-foreground mb-2">
                  Document Your Next Project
                </h2>
                <p className="text-sm md:text-base text-muted-foreground max-w-md">
                  Upload photos of your finished work. We&apos;ll help you create a professional showcase that wins more jobs.
                </p>
              </div>
              <div className="hidden md:flex items-center justify-center w-16 h-16 rounded-full bg-terracotta text-white group-hover:scale-110 transition-transform duration-300">
                <Plus className="w-8 h-8" />
              </div>
            </div>

            {/* Decorative element */}
            <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-terracotta/10 blur-2xl" />
          </div>
        </Link>

        {/* Stats Strip - Understated */}
        <div className="flex items-center gap-6 md:gap-10 text-sm">
          <div className="flex items-center gap-2">
            <span className="stat-dot stat-dot-published" />
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{publishedCount}</span> live
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="stat-dot stat-dot-draft" />
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{draftCount}</span> draft{draftCount !== 1 ? 's' : ''}
            </span>
          </div>
          {(totalCount ?? 0) > 0 && (
            <Link
              href="/projects"
              className="ml-auto text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group"
            >
              View all
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          )}
        </div>

        {/* Projects Section */}
        {!hasProjects ? (
          /* Empty State */
          <div className="empty-state-bg rounded-2xl p-8 md:p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-craftsman text-xl md:text-2xl mb-3">
                Your work deserves to be seen
              </h3>
              <p className="text-muted-foreground mb-6">
                Every job you complete is proof of your skill. Start building your portfolio
                and let your craftsmanship speak for itself.
              </p>
              <Button asChild size="lg" className="bg-terracotta hover:bg-terracotta/90 text-white">
                <Link href="/projects/new">
                  <Camera className="w-4 h-4 mr-2" />
                  Add Your First Project
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          /* Project Gallery */
          <div className="space-y-4">
            <h2 className="font-craftsman text-lg md:text-xl">Your Work</h2>

            {/* Project Grid - Visual showcase */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {projects.map((project, index) => {
                const coverImage = project.project_images?.find(img => img.image_type === 'after')
                  || project.project_images?.[0];
                const isPublished = project.status === 'published';
                const imageUrl = coverImage
                  ? resolveProjectImageUrl({
                      projectId: project.id,
                      imageId: coverImage.id,
                      storagePath: coverImage.storage_path,
                      isPublished,
                    })
                  : null;

                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group block animate-fade-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="project-thumb aspect-[4/3] relative">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={project.title || 'Project'}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FolderOpen className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}

                      {/* Status indicator */}
                      <div className="absolute top-2 left-2 z-10">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-1.5 py-0.5 ${
                            isPublished
                              ? 'bg-sage-subtle text-sage border-0'
                              : 'bg-background/80 backdrop-blur-sm'
                          }`}
                        >
                          {isPublished ? 'Live' : <><Clock className="w-2.5 h-2.5 mr-0.5" /> Draft</>}
                        </Badge>
                      </div>

                      {/* Hover overlay with title */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                        <div className="w-full">
                          <p className="text-white text-sm font-medium truncate">
                            {project.title || 'Untitled'}
                          </p>
                          <p className="text-white/70 text-xs truncate">
                            {project.project_type || 'Masonry'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}

              {/* Add More Card */}
              <Link href="/projects/new" className="group block">
                <div className="aspect-[4/3] rounded-xl border-2 border-dashed border-border hover:border-terracotta/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground group-hover:text-terracotta">
                  <Plus className="w-6 h-6" />
                  <span className="text-xs font-medium">Add Project</span>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Quick Links - Secondary actions */}
        {hasProjects && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link href="/projects" className="group">
              <div className="dashboard-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Manage Projects</p>
                    <p className="text-xs text-muted-foreground">Edit, publish, or archive</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link href="/profile/edit" className="group">
              <div className="dashboard-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Pencil className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Update Profile</p>
                    <p className="text-xs text-muted-foreground">Business info & services</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border md:hidden z-40">
        <Button asChild className="w-full bg-terracotta hover:bg-terracotta/90 text-white h-12">
          <Link href="/projects/new">
            <Plus className="w-5 h-5 mr-2" />
            Add New Project
          </Link>
        </Button>
      </div>
    </div>
  );
}
