import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Pricing Section
 *
 * Two-tier pricing based on vision.md:
 * - Free: 3 projects (try before you buy)
 * - Pro: $29/mo unlimited projects
 *
 * Target: <5% monthly churn on Pro tier (vision.md line 79)
 * Key selling point: Time savings justifies $29/mo for busy contractors.
 */

const tiers = [
  {
    name: "Free",
    description: "Try it out, no commitment",
    price: "$0",
    period: "/month",
    features: [
      "3 project showcases",
      "AI-generated descriptions",
      "Voice interview",
      "Public portfolio page",
    ],
    cta: "Get Started Free",
    ctaVariant: "outline" as const,
    highlight: false,
  },
  {
    name: "Pro",
    description: "For growing contractors",
    price: "$29",
    period: "/month",
    features: [
      "Unlimited projects",
      "Everything in Free",
      "Priority AI processing",
      "Advanced SEO features",
      "Priority support",
    ],
    cta: "Start Free Trial",
    ctaVariant: "default" as const,
    highlight: true,
  },
];

export function Pricing() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple Pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free. Upgrade when you&apos;re ready.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative ${tier.highlight ? "border-primary ring-1 ring-primary" : ""}`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge>Most Popular</Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle>{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">
                    {tier.price}
                  </span>
                  <span className="text-muted-foreground">{tier.period}</span>
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

                <Link href="/signup" className="block">
                  <Button variant={tier.ctaVariant} className="w-full">
                    {tier.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
