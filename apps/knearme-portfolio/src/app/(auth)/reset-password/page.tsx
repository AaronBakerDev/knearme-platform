'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Button, Input, Label,
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from '@/components/ui';
import { Mail, Loader2, ArrowLeft, MailCheck } from 'lucide-react';
import { FormError } from '@/components/ui/form-error';
import { toast } from 'sonner';

/**
 * Password reset request page.
 * Sends a password reset link to the user's email.
 *
 * @see EPIC-001-auth.md US-001-04
 */
export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!error) return;
    emailRef.current?.focus({ preventScroll: false });
    emailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password/confirm`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSuccess(true);
      toast.success('Reset link sent! Check your email.');
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
                We&apos;ve sent a password reset link to <strong className="text-foreground">{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground pb-8">
              <p>Click the link in your email to reset your password. The link will expire in 1 hour.</p>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pb-8">
              <Button variant="outline" className="w-full h-10 hover:bg-muted" onClick={() => setSuccess(false)}>
                Try a different email
              </Button>
              <Link href="/login" className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to login
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
            <CardTitle className="text-3xl font-bold tracking-tight">Reset Password</CardTitle>
            <CardDescription className="text-base">
              Enter your email and we&apos;ll send you a reset link
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
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-4 pb-8">
              <Button
                type="submit"
                className="w-full h-10 text-base font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
              <Link href="/login" className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to login
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
