import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, CheckCircle2, Mail, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PushNotificationSettings } from '@/components/settings/PushNotificationSettings';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: contractorData } = await supabase
    .from('contractors')
    .select('id, email, business_name, profile_slug, city, state, services, service_areas, city_slug, created_at')
    .eq('auth_user_id', user.id)
    .single();

  if (!contractorData) {
    redirect('/profile/setup');
  }

  const contractor = contractorData as {
    id: string;
    email: string;
    business_name: string | null;
    profile_slug: string | null;
    city: string | null;
    state: string | null;
    services: string[] | null;
    service_areas: string[] | null;
    city_slug: string | null;
    created_at: string | null;
  };

  const isProfileComplete = Boolean(
    contractor.business_name && contractor.city && contractor.state && contractor.services?.length,
  );

  const publicProfileUrl = contractor.city_slug
    ? `/contractors/${contractor.city_slug}/${contractor.profile_slug || contractor.id}`
    : null;

  const servicesCount = contractor.services?.length ?? 0;
  const serviceAreasCount = contractor.service_areas?.length ?? 0;
  const memberSince = contractor.created_at
    ? new Date(contractor.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile, account security, and notification preferences.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Profile &amp; Portfolio
              {isProfileComplete ? (
                <Badge className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Complete
                </Badge>
              ) : (
                <Badge variant="outline">Incomplete</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Control how your business appears to potential customers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Business</dt>
                <dd className="text-sm font-medium">
                  {contractor.business_name || 'Not set'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Location</dt>
                <dd className="text-sm font-medium">
                  {contractor.city && contractor.state
                    ? `${contractor.city}, ${contractor.state}`
                    : 'Not set'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Services</dt>
                <dd className="text-sm font-medium">{servicesCount}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Service areas</dt>
                <dd className="text-sm font-medium">{serviceAreasCount}</dd>
              </div>
            </dl>

            <Separator />

            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href={isProfileComplete ? '/profile/edit' : '/profile/setup'}>
                  {isProfileComplete ? 'Edit profile' : 'Complete profile'}
                </Link>
              </Button>
              {publicProfileUrl && (
                <Button variant="outline" asChild>
                  <Link href={publicProfileUrl}>
                    View public profile
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage login and security preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              {memberSince && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Member since</p>
                    <p className="text-sm text-muted-foreground">{memberSince}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href="/reset-password">Reset password</Link>
              </Button>
              <form action="/auth/signout" method="post">
                <Button type="submit" variant="ghost">
                  Log out
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Choose how KnearMe keeps you informed.</CardDescription>
          </CardHeader>
          <CardContent>
            <PushNotificationSettings />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
