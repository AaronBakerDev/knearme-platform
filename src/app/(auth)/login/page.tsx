'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { FormError } from '@/components/ui/form-error';
import { toast } from 'sonner';

/**
 * Login form component that uses searchParams.
 * Wrapped in Suspense by the parent component.
 */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/dashboard';
  const authError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(
    authError === 'auth_callback_error' ? 'Authentication failed. Please try again.' : null
  );
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Focus first error when present
  useEffect(() => {
    if (!error) return;
    (emailRef.current ?? passwordRef.current)?.focus({ preventScroll: false });
    (emailRef.current ?? passwordRef.current)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Please verify your email before logging in. Check your inbox for the verification link.');
        } else {
          setError(signInError.message);
        }
        return;
      }

      // Check if profile is complete
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: contractor } = await supabase
          .from('contractors')
          .select('business_name, city, services')
          .eq('auth_user_id', user.id)
          .single();

        // Redirect to profile setup if incomplete
        const profile = contractor as { business_name: string | null; city: string | null; services: string[] | null } | null;
        if (!profile?.business_name || !profile?.city || !profile?.services?.length) {
          router.push('/profile/setup');
          return;
        }
      }

      toast.success('Logged in successfully');
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/50 to-background">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-8 pt-10">
            <CardTitle className="text-3xl font-bold tracking-tight">Welcome back</CardTitle>
            <CardDescription className="text-base">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              <FormError message={error} />

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-9 h-10 transition-all focus-visible:ring-2"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    required
                    disabled={loading}
                    autoComplete="email"
                    ref={emailRef}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/reset-password"
                    className="text-sm font-medium text-primary hover:underline underline-offset-4"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9 h-10 transition-all focus-visible:ring-2"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    required
                    disabled={loading}
                    autoComplete="current-password"
                    ref={passwordRef}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer text-muted-foreground">
                  Remember me for 30 days
                </Label>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pb-8">
              <Button
                type="submit"
                className="w-full h-10 text-base font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="font-medium text-primary hover:underline underline-offset-4 transition-colors">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

/**
 * Login page for existing contractors.
 * Handles email/password authentication with redirect support.
 *
 * @see EPIC-001-auth.md US-001-03
 */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/50 to-background">
        <div className="w-full max-w-md">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center pb-8 pt-10">
              <CardTitle className="text-3xl font-bold tracking-tight">Welcome back</CardTitle>
              <CardDescription>Loading...</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
