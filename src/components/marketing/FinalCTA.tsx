import Link from "next/link";
import { CTAButton } from "@/components/ui/cta-button";
import { ArrowRight, Shield } from "lucide-react";

/**
 * Final CTA Section
 *
 * Strong closing section with:
 * - Compelling headline
 * - Clear value proposition
 * - Trust signals
 * - Primary CTA
 */

type FinalCTAProps = {
  authCta?: { href: string; label: string } | null;
};

export function FinalCTA({ authCta }: FinalCTAProps) {
  const primaryCta = authCta ?? { href: "/signup", label: "Create Your First Project" };

  return (
    <section className="relative bg-primary py-24 text-primary-foreground overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto px-4 text-center relative z-10">
        <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Your Best Work Deserves to Be Seen
        </h2>
        <p className="mb-10 text-lg opacity-90 sm:text-xl max-w-2xl mx-auto">
          Stop losing jobs to contractors with better websites.
          <br className="hidden sm:block" />
          Start building your online reputation today.
        </p>

        <Link href={primaryCta.href} className="inline-block group">
          <CTAButton
            size="lg"
            className="bg-background text-foreground hover:bg-zinc-100 shadow-xl hover:shadow-2xl px-8 h-14 text-lg"
          >
            {primaryCta.label}
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </CTAButton>
        </Link>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm opacity-80">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>30-day money-back guarantee</span>
          </div>
          <span className="hidden sm:inline">•</span>
          <span>No credit card required</span>
          <span className="hidden sm:inline">•</span>
          <span>2 minutes to your first project</span>
        </div>
      </div>
    </section>
  );
}
