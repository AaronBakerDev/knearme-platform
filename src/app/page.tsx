import { HeroSection } from "@/components/marketing/HeroSection";
import { PainPoints } from "@/components/marketing/PainPoints";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { PortfolioShowcase } from "@/components/marketing/PortfolioShowcase";
import { Testimonials } from "@/components/marketing/Testimonials";
import { Pricing } from "@/components/marketing/Pricing";
import { CTAButton } from "@/components/ui/cta-button";
import Link from "next/link";

/**
 * KnearMe Landing Page
 *
 * Converts masonry contractors into signups by communicating:
 * "Professional portfolios that build themselves in under 3 minutes"
 *
 * Section order optimized for conversion:
 * 1. Hero - Value prop + CTAs
 * 2. Pain Points - Connect with frustrations
 * 3. How It Works - Show simplicity
 * 4. Features - Key differentiators
 * 5. Portfolio Showcase - Demonstrate quality
 * 6. Testimonials - Social proof
 * 7. Pricing - Clear tiers
 * 8. Final CTA - Convert
 */
export default function Home() {
  return (
    <>
      <HeroSection />
      <PainPoints />
      <HowItWorks />
      <FeatureGrid />
      <PortfolioShowcase />
      <Testimonials />
      <Pricing />

      {/* Bottom CTA Section */}
      <section className="relative bg-primary py-24 text-primary-foreground overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Ready to Showcase Your Work?
          </h2>
          <p className="mb-10 text-lg opacity-90 sm:text-xl max-w-2xl mx-auto">
            Join contractors who are building their portfolios in minutes, not
            hours.
          </p>
          <Link href="/signup" className="inline-block group">
            <CTAButton
              size="lg"
              className="bg-background text-foreground hover:bg-zinc-100 shadow-xl hover:shadow-2xl px-8 h-14 text-lg"
            >
              Start Your Free Portfolio
            </CTAButton>
          </Link>
          <p className="mt-6 text-sm opacity-70 flex items-center justify-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-50" />
            No credit card required
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-50" />
            2 minutes to your first project
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-50" />
          </p>
        </div>
      </section>
    </>
  );
}
