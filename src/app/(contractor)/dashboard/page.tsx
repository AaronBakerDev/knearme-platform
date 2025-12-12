import Link from 'next/link';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { CheckCircle2, Clock, FolderOpen, Plus, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getPublicUrl } from '@/lib/storage/upload';

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
  const { data: projectsData, count: totalCount } = await supabase
    .from('projects')
    .select(`
      *,
      project_images (
        id,
        storage_path,
        image_type,
        display_order
      )
    `, { count: 'exact' })
    .eq('contractor_id', contractor.id)
    .order('created_at', { ascending: false })
    .limit(5);

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
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="bg-gradient-to-br from-muted/40 to-muted/20 rounded-2xl p-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {contractor.business_name}
        </h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10">
            <User className="w-3 h-3 text-primary" />
          </span>
          {contractor.city}, {contractor.state}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Published Projects</CardDescription>
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-4xl">{publishedCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Visible to potential customers
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Draft Projects</CardDescription>
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <CardTitle className="text-4xl">{draftCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Ready to complete and publish
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Total Projects</CardDescription>
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-4xl">{totalCount ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              All time portfolio projects
            </p>
          </CardContent>
        </Card>
      </div>

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
            <div className="space-y-3">
              {projects.map((project) => {
                const coverImage = project.project_images?.find(img => img.image_type === 'after')
                  || project.project_images?.[0];
                const imageUrl = coverImage ? getPublicUrl('project-images', coverImage.storage_path) : null;

                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}/edit`}
                    className="group flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={project.title || 'Project'}
                            fill
                            className="object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FolderOpen className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium group-hover:text-primary transition-colors">
                          {project.title || 'Untitled Project'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {project.project_type || 'Masonry Project'} • {project.city || contractor.city}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={project.status === 'published' ? 'default' : 'secondary'}
                        className={project.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0' : ''}
                      >
                        {project.status === 'published' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {project.status === 'draft' && <Clock className="w-3 h-3 mr-1" />}
                        {project.status}
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid gap-6 md:grid-cols-2">
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
    </div>
  );
}
