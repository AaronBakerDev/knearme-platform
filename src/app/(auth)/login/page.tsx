'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  PasswordInput,
  FormError,
} from '@/components/ui';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/** Key for storing "Remember me" preference in localStorage */
const REMEMBER_ME_KEY = 'knearme_remember_session';

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
  const [rememberMe, setRememberMe] = useState(true); // Default to true for better UX
  const [error, setError] = useState<string | null>(
    authError === 'auth_callback_error' ? 'Authentication failed. Please try again.' : null
  );
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [navigating, setNavigating] = useState(false); // Loading transition after login
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null); // For resend verification
  const [resendingVerification, setResendingVerification] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  /**
   * Handle "Remember me" preference.
   * When unchecked, signs out user when browser/tab closes.
   */
  useEffect(() => {
    if (rememberMe) {
      // Remove the beforeunload handler if it exists
      localStorage.setItem(REMEMBER_ME_KEY, 'true');
    } else {
      localStorage.setItem(REMEMBER_ME_KEY, 'false');
    }
  }, [rememberMe]);

  // Set up beforeunload handler based on remember me preference
  useEffect(() => {
    const handleBeforeUnload = () => {
      const shouldRemember = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
      if (!shouldRemember) {
        // Sign out on browser close if "Remember me" is unchecked
        const supabase = createClient();
        supabase.auth.signOut();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  /**
   * Resend verification email for unverified accounts.
   */
  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;

    setResendingVerification(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unverifiedEmail }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to resend verification email');
      }

      toast.success('Verification email sent! Check your inbox.');
      setUnverifiedEmail(null);
      setError(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend verification email');
    } finally {
      setResendingVerification(false);
    }
  };

  /**
   * Handle Google OAuth sign-in.
   * Redirects to Google for authentication, then returns to /auth/callback.
   */
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setGoogleLoading(false);
      }
      // Note: If successful, browser redirects - no need to handle success here
    } catch {
      setError('Failed to connect to Google. Please try again.');
      setGoogleLoading(false);
    }
  };

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
          setUnverifiedEmail(null);
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Please verify your email before logging in.');
          setUnverifiedEmail(email); // Enable resend verification
        } else {
          setError(signInError.message);
          setUnverifiedEmail(null);
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
      setNavigating(true); // Show loading transition
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setUnverifiedEmail(null);
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

              {/* Resend verification email option */}
              {unverifiedEmail && (
                <div className="flex items-center justify-center">
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="text-primary h-auto p-0"
                    onClick={handleResendVerification}
                    disabled={resendingVerification}
                  >
                    {resendingVerification ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Resend verification email'
                    )}
                  </Button>
                </div>
              )}

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
                    disabled={loading || navigating}
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
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                  <PasswordInput
                    id="password"
                    placeholder="••••••••"
                    className="pl-9 h-10 transition-all focus-visible:ring-2"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                      if (unverifiedEmail) setUnverifiedEmail(null);
                    }}
                    required
                    disabled={loading || navigating}
                    autoComplete="current-password"
                    ref={passwordRef}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pb-2">
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

            <CardFooter className="flex flex-col gap-4 pt-2 pb-8">
              <Button
                type="submit"
                className="w-full h-10 text-base font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                disabled={loading || googleLoading || navigating}
              >
                {navigating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting...
                  </>
                ) : loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-10 text-base font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                onClick={handleGoogleLogin}
                disabled={loading || googleLoading || navigating}
              >
                {googleLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continue with Google
                  </>
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
