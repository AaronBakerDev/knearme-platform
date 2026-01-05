'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { buildAuthCallbackUrl } from '@/lib/auth/redirects';
import {
  Button,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
  PasswordRequirements,
  validatePassword,
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
import { Loader2, MailCheck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Signup page for new contractors.
 * Handles email/password signup with validation.
 *
 * @see EPIC-001-auth.md US-001-01
 */
export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  /**
   * Resend verification email from success screen.
   */
  const handleResendVerification = async () => {
    if (!email) return;

    setResendingVerification(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to resend verification email');
      }

      toast.success('Verification email sent! Check your inbox.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend verification email');
    } finally {
      setResendingVerification(false);
    }
  };

  /**
   * Handle Google OAuth sign-up.
   * New users will be redirected to profile setup after OAuth.
   */
  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: buildAuthCallbackUrl(window.location.origin, '/profile/setup'),
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
    } catch {
      setError('Failed to connect to Google. Please try again.');
      setGoogleLoading(false);
    }
  };

  // Focus first error
  useEffect(() => {
    if (!error) return;
    const target =
      error.toLowerCase().includes('password')
        ? passwordRef.current ?? confirmRef.current
        : emailRef.current;
    target?.focus({ preventScroll: false });
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength using imported function
    if (!validatePassword(password)) {
      setError('Please ensure your password meets all requirements');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: buildAuthCallbackUrl(window.location.origin, '/profile/setup'),
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('This email is already registered. Please log in instead.');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      setSuccess(true);
      toast.success('Account created! Check your email to verify.');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthShell>
        <AuthCardContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <AuthCard>
            <AuthCardHeader className="text-center pb-2 pt-10">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <MailCheck className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
              <CardDescription className="text-base mt-2">
                We&apos;ve sent a verification link to <strong className="text-foreground">{email}</strong>
              </CardDescription>
            </AuthCardHeader>
            <CardContent className="text-center text-muted-foreground pb-8">
              <p>Click the link in your email to verify your account and continue setting up your portfolio.</p>
              <p className="mt-4 text-sm">
                Didn&apos;t receive the email?{' '}
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
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pb-8">
              <Button variant="outline" className="w-full h-10 hover:bg-muted" onClick={() => setSuccess(false)}>
                Use a different email
              </Button>
              <Link href="/login" className="text-sm font-medium text-primary hover:underline underline-offset-4 transition-colors">
                Already verified? Log in
              </Link>
            </CardFooter>
          </AuthCard>
        </AuthCardContainer>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthCardContainer className="animate-in fade-in zoom-in-95 duration-500">
        <AuthCard>
          <AuthCardHeader>
            <CardTitle className="text-3xl font-bold tracking-tight">Create Account</CardTitle>
            <CardDescription className="text-base">
              Start building your professional portfolio
            </CardDescription>
          </AuthCardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              <FormError message={error} className="flex flex-col gap-1" />
              {error && error.includes('already registered') && (
                <Link href="/login" className="flex items-center gap-1 font-medium hover:underline ml-1 text-sm">
                  Go to login <ArrowRight className="h-3 w-3" />
                </Link>
              )}

              <AuthEmailField
                value={email}
                onChange={(next) => {
                  setEmail(next);
                  if (error) setError(null);
                }}
                disabled={loading}
                inputRef={emailRef}
              />

              <div className="space-y-2">
                <AuthPasswordField
                  id="password"
                  label="Password"
                  value={password}
                  onChange={(next) => {
                    setPassword(next);
                    if (error) setError(null);
                  }}
                  disabled={loading}
                  inputRef={passwordRef}
                />
                <PasswordRequirements password={password} className="mt-2 ml-1" />
              </div>

              <div className="space-y-2">
                <AuthPasswordField
                  id="confirmPassword"
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={(next) => {
                    setConfirmPassword(next);
                    if (error) setError(null);
                  }}
                  disabled={loading}
                  inputRef={confirmRef}
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive ml-1">Passwords do not match</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-6 pb-8">
              <Button
                type="submit"
                className="w-full h-10 text-base font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                disabled={loading || googleLoading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              <AuthSocialDivider />

              <AuthGoogleButton
                onClick={handleGoogleSignup}
                loading={googleLoading}
                disabled={loading || googleLoading}
              />

              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline underline-offset-4 transition-colors">
                  Log in
                </Link>
              </p>
            </CardFooter>
          </form>
        </AuthCard>
      </AuthCardContainer>
    </AuthShell>
  );
}
