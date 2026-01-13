import Script from "next/script";
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
import { getAuthCta, getAuthStatus } from "@/lib/auth/auth-status";
import { getFAQs, getPricingTiers } from "@/lib/payload/client";
import { generateFAQSchema, generatePricingSchema } from "@/lib/seo/structured-data";

/**
 * Fallback FAQ data for structured data when CMS is unavailable
 * @see src/components/marketing/FAQ.tsx for display component fallback
 */
const FALLBACK_FAQS = [
  {
    question: "Can I really do this from my phone?",
    answer: "Yes, KnearMe is built mobile-first. Upload photos from your camera roll, record your voice description, and publish—all from your phone or tablet. No computer needed.",
  },
  {
    question: "What if I'm not good at speaking or describing my work?",
    answer: "Just talk like you're explaining the job to a customer. We turn your natural explanation into professional copy.",
  },
  {
    question: "How long until my projects show up on Google?",
    answer: "Your project pages are live instantly and shareable immediately. Google typically indexes new pages within 1-4 weeks.",
  },
];

/**
 * Fallback pricing data for structured data when CMS is unavailable
 * @see src/components/marketing/Pricing.tsx for display component fallback
 */
const FALLBACK_TIERS = [
  {
    id: "free",
    name: "Free",
    description: "Try it on a real job",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [{ text: "Publish up to 5 projects" }, { text: "Keep them live forever" }],
    ctaLink: "/signup",
  },
  {
    id: "pro",
    name: "Pro",
    description: "For contractors ready to grow",
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: [{ text: "Unlimited projects" }, { text: "Everything in Free" }, { text: "Priority support" }],
    ctaLink: "/signup",
  },
];

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
 *
 * @see PAY-025 for FAQ and Product structured data (SEO)
 */
export default async function Home() {
  const authStatus = await getAuthStatus();
  const authCta = getAuthCta(authStatus);

  // Fetch data for structured data generation (SEO)
  // These queries are parallel to optimize load time
  let faqData: Array<{ question: string; answer: string }> = FALLBACK_FAQS;
  let pricingData = FALLBACK_TIERS;

  try {
    const [cmsFaqs, cmsTiers] = await Promise.all([
      getFAQs({ showOnLandingOnly: true }),
      getPricingTiers(),
    ]);

    // Use CMS data if available, extract question/answer from FAQ type
    if (cmsFaqs && cmsFaqs.length > 0) {
      faqData = cmsFaqs.map((faq) => ({
        question: faq.question || "",
        answer: typeof faq.answer === "string" ? faq.answer : extractTextFromLexical(faq.answer),
      }));
    }

    if (cmsTiers && cmsTiers.length > 0) {
      pricingData = cmsTiers.map((tier) => ({
        id: tier.id,
        name: tier.name,
        description: tier.description || "",
        monthlyPrice: tier.monthlyPrice,
        yearlyPrice: tier.yearlyPrice,
        features: tier.features || [],
        ctaLink: tier.ctaLink || "/signup",
      }));
    }
  } catch (error) {
    // Log error but continue with fallback data
    console.error("[Home] Failed to fetch structured data content:", error);
  }

  // Generate JSON-LD structured data for SEO
  const faqSchema = generateFAQSchema(faqData);
  const pricingSchema = generatePricingSchema(pricingData);

  return (
    <div className="flex min-h-screen flex-col font-sans">
      {/* SEO Structured Data - FAQPage and Product schemas */}
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="pricing-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }}
      />

      <SiteHeader />
      <main className="flex-1">
        {/* Above the fold */}
        <HeroSection authCta={authCta} />
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
        <Pricing authCta={authCta} />
        <FAQ />
        <FinalCTA authCta={authCta} />
      </main>
      <SiteFooter />
    </div>
  );
}

/**
 * Extract plain text from Lexical rich text content
 * Used for structured data generation from CMS FAQ answers
 */
function extractTextFromLexical(content: unknown): string {
  if (!content || typeof content !== "object") return "";

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const root = (content as any).root;
    if (root?.children) {
      return root.children
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((paragraph: any) => {
          if (paragraph.children) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return paragraph.children.map((node: any) => node.text || "").join("");
          }
          return "";
        })
        .join(" ");
    }
  } catch {
    return "";
  }

  return "";
}
