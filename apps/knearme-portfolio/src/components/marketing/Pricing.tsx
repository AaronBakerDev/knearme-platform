import { getPricingTiers, type PricingTier } from "@/lib/payload/client";
import { PricingCards } from "./PricingCards";

/**
 * Pricing Section
 *
 * Server Component that fetches pricing tiers from Payload CMS
 * and delegates rendering to the PricingCards client component.
 *
 * Two-tier pricing with annual toggle:
 * - Free: 5 published projects (keep them live)
 * - Pro: $29/mo or $290/year (save $58)
 *
 * Includes 30-day money-back guarantee for Pro tier.
 *
 * Data flow:
 * 1. Fetches pricing tiers from Payload CMS via getPricingTiers()
 * 2. Falls back to hardcoded content on failure
 * 3. Passes data to PricingCards client component for interactivity
 *
 * @see PAY-012 in PRD for acceptance criteria
 * @see src/lib/payload/client.ts for getPricingTiers() implementation
 * @see src/components/marketing/PricingCards.tsx for client-side rendering
 */

/**
 * Hardcoded fallback pricing tiers
 * Used when CMS is unavailable or returns no data
 */
const FALLBACK_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    description: "Try it on a real job",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      { text: "Publish up to 5 projects" },
      { text: "Keep them live forever" },
      { text: "Describe the job by voice" },
      { text: "Shareable project links" },
    ],
    ctaText: "Get Started Free",
    ctaLink: "/signup",
    ctaVariant: "outline",
    isHighlighted: false,
    order: 1,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "pro",
    name: "Pro",
    description: "For contractors ready to grow",
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: [
      { text: "Unlimited projects" },
      { text: "Everything in Free" },
      { text: "Voice included (fair use)" },
      { text: "Get found locally" },
      { text: "Priority support" },
    ],
    ctaText: "Start Free Trial",
    ctaLink: "/signup",
    ctaVariant: "default",
    isHighlighted: true,
    badge: "Most Popular",
    order: 2,
    createdAt: "",
    updatedAt: "",
  },
];

type PricingProps = {
  authCta?: { href: string; label: string } | null;
};

/**
 * Pricing Server Component
 *
 * Fetches pricing tiers from Payload CMS and renders via PricingCards.
 * Falls back to hardcoded content if CMS fetch fails.
 */
export async function Pricing({ authCta }: PricingProps) {
  // Fetch pricing tiers from Payload CMS
  let tiers: PricingTier[] = FALLBACK_TIERS;

  try {
    const cmsTiers = await getPricingTiers();

    // Only use CMS data if we got results
    if (cmsTiers && cmsTiers.length > 0) {
      tiers = cmsTiers;
    }
  } catch (error) {
    // Log error but continue with fallback data
    console.error("[Pricing] Failed to fetch from CMS, using fallback:", error);
  }

  return <PricingCards tiers={tiers} authCta={authCta} />;
}
