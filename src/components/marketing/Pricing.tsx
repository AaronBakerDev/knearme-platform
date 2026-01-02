"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

/**
 * Pricing Section
 *
 * Two-tier pricing with annual toggle:
 * - Free: 5 published projects (keep them live)
 * - Pro: $29/mo or $290/year (save $58)
 *
 * Includes 30-day money-back guarantee for Pro tier.
 */

const tiers = [
  {
    name: "Free",
    description: "Try it on a real job",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "Publish up to 5 projects",
      "Keep them live forever",
      "Describe the job by voice",
      "Shareable project links",
    ],
    cta: "Get Started Free",
    ctaVariant: "outline" as const,
    highlight: false,
  },
  {
    name: "Pro",
    description: "For contractors ready to grow",
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: [
      "Unlimited projects",
      "Everything in Free",
      "Voice included (fair use)",
      "Get found locally",
      "Priority support",
    ],
    cta: "Start Free Trial",
    ctaVariant: "default" as const,
    highlight: true,
  },
];

type PricingProps = {
  authCta?: { href: string; label: string } | null;
};

export function Pricing({ authCta }: PricingProps) {
  const [isAnnual, setIsAnnual] = useState(false);

  const getPrice = (tier: (typeof tiers)[0]) => {
    if (tier.monthlyPrice === 0) return "$0";
    return isAnnual ? `$${tier.yearlyPrice}` : `$${tier.monthlyPrice}`;
  };

  const getPeriod = (tier: (typeof tiers)[0]) => {
    if (tier.monthlyPrice === 0) return "/month";
    return isAnnual ? "/year" : "/month";
  };

  const getSavings = (tier: (typeof tiers)[0]) => {
    if (tier.monthlyPrice === 0) return null;
    const yearlySavings = tier.monthlyPrice * 12 - tier.yearlyPrice;
    return yearlySavings;
  };

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
              <Badge variant="secondary" className="ml-2 text-xs">
                Save $58
              </Badge>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative ${tier.highlight ? "border-primary ring-2 ring-primary shadow-lg" : ""}`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="px-4">Most Popular</Badge>
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
                        className={`text-sm ${index === 0 && tier.highlight ? "font-medium" : ""}`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href={authCta?.href ?? "/signup"} className="block">
                  <Button variant={tier.ctaVariant} className="w-full h-11">
                    {authCta?.label ?? tier.cta}
                  </Button>
                </Link>

                {/* Guarantee badge for Pro */}
                {tier.highlight && (
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
