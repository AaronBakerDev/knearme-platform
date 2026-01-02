'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { OnboardingChat } from '@/components/onboarding';

/**
 * Profile setup page - Conversation-first onboarding.
 *
 * Uses the Discovery Agent to gather business information through
 * natural dialogue. No form wizard fallback - we're all-in on chat.
 *
 * If AI is unavailable, shows a retry option (not a form).
 *
 * @see /src/lib/agents/discovery.ts - Discovery Agent
 * @see /docs/philosophy/agentic-first-experience.md - Design philosophy
 */
export default function ProfileSetupPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize and check auth
  useEffect(() => {
    const initialize = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Check onboarding status
      try {
        const res = await fetch('/api/onboarding');
        if (res.ok) {
          const data = await res.json();

          // If already has complete profile, redirect to dashboard
          if (data.hasCompleteProfile) {
            router.push('/dashboard');
            router.refresh();
            return;
          }

          setStatus('ready');
        } else {
          const data = await res.json().catch(() => ({}));
          setErrorMessage(data.error || 'Failed to start onboarding');
          setStatus('error');
        }
      } catch {
        setErrorMessage('Unable to connect. Please check your internet connection.');
        setStatus('error');
      }
    };

    initialize();
  }, [router]);

  const handleRetry = () => {
    setStatus('loading');
    setErrorMessage(null);
    // Re-run the initialization by triggering a re-render
    window.location.reload();
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-muted/30 to-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Preparing your setup experience...</p>
        </div>
      </div>
    );
  }

  // Error state - retry option, not a form
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-muted/30 to-background">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              {errorMessage || "We couldn't start your setup. Please try again."}
            </p>
          </div>
          <Button onClick={handleRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Chat mode - the only mode
  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] sm:h-[calc(100vh-8rem)]">
      <div className="flex-1 max-w-2xl mx-auto w-full">
        <OnboardingChat className="h-full" />
      </div>
    </div>
  );
}
