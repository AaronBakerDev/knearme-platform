'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Loader2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

/**
 * Password reset confirmation page.
 * User sets their new password after clicking the reset link.
 *
 * @see EPIC-001-auth.md US-001-04
 */
export default function ResetPasswordConfirmPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(true);
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
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Password Updated</CardTitle>
              <CardDescription className="text-base mt-2">
                Your password has been successfully reset
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground pb-8">
              <p>You can now log in with your new password.</p>
            </CardContent>
            <CardFooter className="pb-8">
              <Button className="w-full h-10" onClick={() => router.push('/login')}>
                Go to Login
              </Button>
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
            <CardTitle className="text-3xl font-bold tracking-tight">Set New Password</CardTitle>
            <CardDescription className="text-base">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              {error && (
                <div className="flex items-center gap-3 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md animate-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9 h-10 transition-all focus-visible:ring-2"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
                <p className="text-xs text-muted-foreground ml-1">
                  8+ characters, at least 1 letter and 1 number
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9 h-10 transition-all focus-visible:ring-2"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
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
                    Updating...
                  </>
                ) : (
                  'Update Password'
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
