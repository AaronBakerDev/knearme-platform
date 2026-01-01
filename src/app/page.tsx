import { HeroSection } from "@/components/marketing/HeroSection";
import { StatsBar } from "@/components/marketing/StatsBar";
import { PainPoints } from "@/components/marketing/PainPoints";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { VideoDemo } from "@/components/marketing/VideoDemo";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { Comparison } from "@/components/marketing/Comparison";
import { PortfolioShowcase } from "@/components/marketing/PortfolioShowcase";
// Testimonials removed until we have real users
import { Pricing } from "@/components/marketing/Pricing";
import { FAQ } from "@/components/marketing/FAQ";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";

/**
 * KnearMe Landing Page
 *
 * Converts contractors into signups by communicating:
 * "Turn your finished work into your best salesperson."
 *
 * Core insight: 92% of homeowners trust referrals. When they can't get one,
 * they Google. The contractor with visible proof gets the call.
 *
 * Section flow optimized for conversion:
 * 1. Hero - Value prop + primary CTA (phone mockups showing voice→publish)
 * 2. Stats - Product capabilities (what you can do, not fake metrics)
 * 3. Pain Points - Connect with frustrations
 * 4. How It Works - Show simplicity (4 steps)
 * 5. Video Demo - See it in action (most persuasive)
 * 6. Features - Key differentiators
 * 7. Comparison - Why KnearMe vs alternatives
 * 8. Portfolio Showcase - Demonstrate quality
 * 9. Pricing - Clear tiers with annual option + guarantee
 * 10. FAQ - Handle objections
 * 11. Final CTA - Convert
 *
 * Note: Testimonials removed until we have real users
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col font-sans">
      <SiteHeader />
      <main className="flex-1">
        {/* Above the fold */}
        <HeroSection />
        <StatsBar />

        {/* Problem & Solution */}
        <PainPoints />
        <HowItWorks />
        <VideoDemo />

        {/* Differentiation */}
        <FeatureGrid />
        <Comparison />

        {/* Social Proof */}
        <PortfolioShowcase />
        {/* Testimonials removed until we have real users */}

        {/* Conversion */}
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}
