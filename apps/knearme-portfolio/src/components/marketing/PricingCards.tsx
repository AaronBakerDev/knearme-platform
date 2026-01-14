"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Shield } from "lucide-react";
import {
  Button, Badge, Switch,
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui";
import { type PricingTier } from "@/lib/payload/client";

/**
 * Pricing Cards Client Component
 *
 * Renders the interactive pricing section with monthly/yearly toggle.
 * Receives pricing tier data from the Pricing server component.
 *
 * @see PAY-012 in PRD for acceptance criteria
 * @see src/components/marketing/Pricing.tsx for data fetching
 */

type PricingCardsProps = {
  tiers: PricingTier[];
  authCta?: { href: string; label: string } | null;
};

export function PricingCards({ tiers, authCta }: PricingCardsProps) {
  const [isAnnual, setIsAnnual] = useState(false);

  const getPrice = (tier: PricingTier) => {
    if (tier.monthlyPrice === 0) return "$0";
    return isAnnual ? `$${tier.yearlyPrice}` : `$${tier.monthlyPrice}`;
  };

  const getPeriod = (tier: PricingTier) => {
    if (tier.monthlyPrice === 0) return "/month";
    return isAnnual ? "/year" : "/month";
  };

  const getSavings = (tier: PricingTier) => {
    if (tier.monthlyPrice === 0) return null;
    const yearlySavings = tier.monthlyPrice * 12 - tier.yearlyPrice;
    return yearlySavings;
  };

  // Calculate max savings for the toggle badge
  const maxSavings = tiers.reduce((max, tier) => {
    const savings = getSavings(tier);
    return savings && savings > max ? savings : max;
  }, 0);

  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            One Price. More Jobs.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Most contractors earn back the cost with their first new customer.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Free covers 5 published projects. Pro keeps every project live and includes voice (fair use).
          </p>

          {/* Annual toggle */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <span
              className={`text-sm font-medium ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}
            >
              Monthly
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              aria-label="Toggle annual billing"
            />
            <span
              className={`text-sm font-medium ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}
            >
              Annual
              {maxSavings > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Save ${maxSavings}
                </Badge>
              )}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {tiers.map((tier) => (
            <Card
              key={tier.id}
              className={`relative ${tier.isHighlighted ? "border-primary ring-2 ring-primary shadow-lg" : ""}`}
            >
              {tier.badge && tier.isHighlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="px-4">{tier.badge}</Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">
                    {getPrice(tier)}
                  </span>
                  <span className="text-muted-foreground">{getPeriod(tier)}</span>
                  {isAnnual && getSavings(tier) && (
                    <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                      Save ${getSavings(tier)} per year
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <span
                        className={`text-sm ${index === 0 && tier.isHighlighted ? "font-medium" : ""}`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href={authCta?.href ?? tier.ctaLink ?? "/signup"} className="block">
                  <Button variant={tier.ctaVariant} className="w-full h-11">
                    {authCta?.label ?? tier.ctaText}
                  </Button>
                </Link>

                {/* Guarantee badge for highlighted tier */}
                {tier.isHighlighted && (
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
                    <Shield className="h-4 w-4" />
                    <span>30-day money-back guarantee</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom trust message */}
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No credit card required to start. Upgrade or cancel anytime.
        </p>
      </div>
    </section>
  );
}
