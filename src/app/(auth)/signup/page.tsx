'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, Loader2, MailCheck, ArrowRight } from 'lucide-react';
import { FormError } from '@/components/ui/form-error';
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
  const [success, setSuccess] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

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

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return 'Password must be at least 8 characters';
    if (!/[a-zA-Z]/.test(pwd)) return 'Password must contain at least one letter';
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/profile/setup`,
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/50 to-background">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-2 pt-10">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <MailCheck className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
              <CardDescription className="text-base mt-2">
                We&apos;ve sent a verification link to <strong className="text-foreground">{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground pb-8">
              <p>Click the link in your email to verify your account and continue setting up your portfolio.</p>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pb-8">
              <Button variant="outline" className="w-full h-10 hover:bg-muted" onClick={() => setSuccess(false)}>
                Use a different email
              </Button>
              <Link href="/login" className="text-sm font-medium text-primary hover:underline underline-offset-4 transition-colors">
                Already verified? Log in
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/50 to-background">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-8 pt-10">
            <CardTitle className="text-3xl font-bold tracking-tight">Create Account</CardTitle>
            <CardDescription className="text-base">
              Start building your professional portfolio
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              <FormError
                message={error}
                className="flex flex-col gap-1"
              />
              {error && error.includes('already registered') && (
                <Link href="/login" className="flex items-center gap-1 font-medium hover:underline ml-1 text-sm">
                  Go to login <ArrowRight className="h-3 w-3" />
                </Link>
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
                    disabled={loading}
                    ref={emailRef}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
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
                    ref={passwordRef}
                  />
                </div>
                <p className="text-xs text-muted-foreground ml-1">
                  8+ characters, at least 1 letter and 1 number
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9 h-10 transition-all focus-visible:ring-2"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    required
                    disabled={loading}
                    ref={confirmRef}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-6 pb-8">
              <Button
                type="submit"
                className="w-full h-10 text-base font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                disabled={loading}
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
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline underline-offset-4 transition-colors">
                  Log in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
