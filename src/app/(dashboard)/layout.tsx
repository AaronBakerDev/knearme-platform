import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PushNotificationPrompt } from '@/components/pwa/PushNotificationPrompt';
import { AppProgressBar } from '@/components/navigation/app-progress-bar';
import { DashboardMobileNav } from '@/components/navigation/ContractorMobileNav';

/**
 * Layout for authenticated business dashboard pages.
 * Includes header with navigation and user menu.
 *
 * Accessibility features:
 * - Skip link for keyboard navigation
 * - Semantic landmarks (header, nav, main)
 * - ARIA labels on interactive elements
 *
 * @note Route group renamed from (contractor) to (dashboard) in Sub-Sprint 11.9
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Query from businesses table (primary source of truth as of Phase 11)
  const { data: businessData } = await supabase
    .from('businesses')
    .select('id, name, email')
    .eq('auth_user_id', user.id)
    .single();

  const business = businessData as { id: string; name: string | null; email: string } | null;

  // Determine if user has engaged (at least one project) before prompting for push notifications
  let projectCount: number | null = 0;
  if (business?.id) {
    const result = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business.id);
    projectCount = result.count;
  }

  const initials = business?.name
    ? business.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.slice(0, 2).toUpperCase() ?? 'KM';

  return (
    <div className="min-h-screen bg-background">
      <AppProgressBar
        height="3px"
        color="hsl(var(--primary))"
        options={{ showSpinner: false }}
        shallowRouting
      />
      {/* Skip link for keyboard navigation - visible on focus */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        role="banner"
      >
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-xl font-bold">
              KnearMe
            </Link>
            <nav
              className="hidden md:flex items-center gap-4"
              aria-label="Main navigation"
            >
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/projects/new"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                New Project
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/projects/new">+ New Project</Link>
            </Button>

            {/* Mobile Navigation */}
            <DashboardMobileNav
              businessName={business?.name ?? null}
              email={user.email ?? ''}
              initials={initials}
            />

            {/* Desktop User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full hidden md:flex"
                  aria-label="User menu"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-medium">
                      {business?.name ?? 'Your Business'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile/edit">Edit Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action="/auth/signout" method="post" className="w-full">
                    <button type="submit" className="w-full text-left">
                      Log out
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <PushNotificationPrompt eligible={(projectCount ?? 0) > 0} />

      {/* Main content */}
      <main
        id="main-content"
        className="container mx-auto px-4 py-6"
        role="main"
        aria-label="Main content"
      >
        {children}
      </main>
    </div>
  );
}
