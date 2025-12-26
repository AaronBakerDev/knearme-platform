import Link from 'next/link';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { CheckCircle2, ChevronRight, Clock, FolderOpen, Plus, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getPublicUrl } from '@/lib/storage/upload';
import { CompactStatsStrip, StickyMobileCTA } from '@/components/dashboard';

/**
 * Contractor dashboard showing project overview and quick actions.
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
    business_name: string | null;
    city: string | null;
    state: string | null;
    services: string[] | null;
    email: string;
  };

  // Check if profile is complete
  if (!contractor.business_name || !contractor.city || !contractor.services?.length) {
    redirect('/profile/setup');
  }

  // Get accurate published/draft counts (not limited to recent list)
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

  // Get projects with counts and images
  // Use explicit FK hint to avoid ambiguity with hero_image_id FK
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: projectsData, error: projectsError, count: totalCount } = await (supabase as any)
    .from('projects')
    .select('*, project_images!project_images_project_id_fkey(id, storage_path, image_type, display_order)', { count: 'exact' })
    .eq('contractor_id', contractor.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Log errors for debugging (RLS issues can cause silent failures)
  if (projectsError) {
    console.error('[Dashboard] Projects query error:', JSON.stringify(projectsError, null, 2));
  }

  // Type the projects array
  type ProjectImage = {
    id: string;
    storage_path: string;
    image_type: string;
    display_order: number;
  };
  type ProjectRow = {
    id: string;
    title: string | null;
    project_type: string | null;
    city: string | null;
    status: string;
    project_images: ProjectImage[];
  };
  const projects = (projectsData ?? []) as ProjectRow[];

  return (
    <div className="space-y-4 md:space-y-8 pb-24 md:pb-0">
      {/* Welcome section - compact on mobile */}
      <div className="bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl p-4 md:p-6">
        <h1 className="text-xl md:text-3xl font-bold tracking-tight">
          Welcome back, {contractor.business_name}
        </h1>
        <p className="text-muted-foreground text-sm md:text-base mt-1 flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-4 h-4 md:w-5 md:h-5 rounded-full bg-primary/10">
            <User className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary" />
          </span>
          {contractor.city}, {contractor.state}
        </p>
      </div>

      {/* Stats strip - compact horizontal layout */}
      <CompactStatsStrip
        stats={[
          { label: 'Published', value: publishedCount, color: 'green' },
          { label: 'Drafts', value: draftCount, color: 'orange' },
          { label: 'Total', value: totalCount ?? 0, color: 'blue' },
        ]}
      />

      {/* Recent projects or empty state */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>Your latest portfolio additions</CardDescription>
          </div>
          {(totalCount ?? 0) > 0 && (
            <Button variant="outline" asChild>
              <Link href="/projects">View All</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!projects || projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <FolderOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Start building your portfolio by adding photos of your best masonry work.
                Our AI will help you create professional descriptions.
              </p>
              <Button asChild>
                <Link href="/projects/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Project
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-1 md:space-y-2">
              {projects.map((project, index) => {
                const coverImage = project.project_images?.find(img => img.image_type === 'after')
                  || project.project_images?.[0];
                const imageUrl = coverImage ? getPublicUrl('project-images', coverImage.storage_path) : null;
                const isLast = index === projects.length - 1;

                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}/edit`}
                    className={`group flex items-center justify-between p-2.5 md:p-3 md:border md:rounded-xl hover:bg-muted/50 transition-all duration-200 ${!isLast ? 'border-b md:border-b-0' : ''}`}
                  >
                    <div className="flex items-center gap-2.5 md:gap-3 min-w-0 flex-1">
                      {/* Thumbnail - smaller on mobile */}
                      <div className="relative w-10 h-10 md:w-14 md:h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={project.title || 'Project'}
                            fill
                            className="object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FolderOpen className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      {/* Project info - truncate on mobile */}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm md:text-base group-hover:text-primary transition-colors truncate">
                          {project.title || 'Untitled Project'}
                        </h4>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">
                          {project.project_type || 'Masonry Project'} • {project.city || contractor.city}
                        </p>
                      </div>
                    </div>
                    {/* Status badge + chevron */}
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <Badge
                        variant={project.status === 'published' ? 'default' : 'secondary'}
                        className={project.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0' : ''}
                      >
                        {project.status === 'published' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {project.status === 'draft' && <Clock className="w-3 h-3 mr-1" />}
                        {project.status}
                      </Badge>
                      {/* Chevron for mobile tap affordance */}
                      <ChevronRight className="w-4 h-4 text-muted-foreground md:hidden" aria-hidden="true" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions - hidden on mobile, use sticky CTA instead */}
      <div className="hidden md:grid gap-6 md:grid-cols-2">
        <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/50 hover:shadow-md transition-all duration-200">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-lg">Add New Project</CardTitle>
            <CardDescription>
              Upload photos and let AI create your project description
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" size="lg">
              <Link href="/projects/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed hover:border-muted-foreground/30 hover:shadow-md transition-all duration-200">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg">Complete Your Profile</CardTitle>
            <CardDescription>
              Add more details to help customers find and trust you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full" size="lg">
              <Link href="/profile/edit">Edit Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Sticky CTA for mobile */}
      <StickyMobileCTA />
    </div>
  );
}
