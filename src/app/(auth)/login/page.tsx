'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { buildAuthCallbackUrl } from '@/lib/auth/redirects';
import {
  Button,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
  Checkbox,
  FormError,
} from '@/components/ui';
import {
  AuthCard,
  AuthCardContainer,
  AuthCardHeader,
  AuthEmailField,
  AuthGoogleButton,
  AuthPasswordField,
  AuthShell,
  AuthSocialDivider,
} from '@/components/auth';
import { Loader2 } from 'lucide-react';
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
          redirectTo: buildAuthCallbackUrl(window.location.origin, redirectTo),
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
    <AuthShell>
      <AuthCardContainer className="animate-in fade-in zoom-in-95 duration-500">
        <AuthCard>
          <AuthCardHeader>
            <CardTitle className="text-3xl font-bold tracking-tight">Welcome back</CardTitle>
            <CardDescription className="text-base">
              Enter your credentials to access your account
            </CardDescription>
          </AuthCardHeader>
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

              <AuthEmailField
                value={email}
                onChange={(next) => {
                  setEmail(next);
                  if (error) setError(null);
                }}
                disabled={loading || navigating}
                inputRef={emailRef}
              />

              <AuthPasswordField
                id="password"
                label="Password"
                autoComplete="current-password"
                labelAction={(
                  <Link
                    href="/reset-password"
                    className="text-sm font-medium text-primary hover:underline underline-offset-4"
                  >
                    Forgot password?
                  </Link>
                )}
                value={password}
                onChange={(next) => {
                  setPassword(next);
                  if (error) setError(null);
                  if (unverifiedEmail) setUnverifiedEmail(null);
                }}
                disabled={loading || navigating}
                inputRef={passwordRef}
              />

              <div className="flex items-center space-x-2 pb-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <label htmlFor="remember" className="text-sm font-normal cursor-pointer text-muted-foreground">
                  Remember me for 30 days
                </label>
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

              <AuthSocialDivider />

              <AuthGoogleButton
                onClick={handleGoogleLogin}
                loading={googleLoading}
                disabled={loading || googleLoading || navigating}
              />

              <p className="text-sm text-muted-foreground text-center">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="font-medium text-primary hover:underline underline-offset-4 transition-colors">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </AuthCard>
      </AuthCardContainer>
    </AuthShell>
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
    <Suspense
      fallback={
        <AuthShell>
          <AuthCardContainer>
            <AuthCard>
              <AuthCardHeader>
                <CardTitle className="text-3xl font-bold tracking-tight">Welcome back</CardTitle>
                <CardDescription>Loading...</CardDescription>
              </AuthCardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </AuthCard>
          </AuthCardContainer>
        </AuthShell>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
