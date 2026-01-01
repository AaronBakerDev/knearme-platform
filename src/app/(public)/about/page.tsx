/**
 * About Page
 *
 * Tells the KnearMe story in a way that resonates with contractors.
 * Focuses on understanding their world, not tech features.
 *
 * @see /src/components/marketing/SiteHeader.tsx - Navigation
 * @see /CLAUDE.md - Brand voice guidelines
 */

import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Hammer,
  Camera,
  Target,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Phone,
  Search,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About KnearMe | Built for Contractors Who Do Great Work",
  description:
    "KnearMe helps masonry contractors turn their finished projects into shareable proof that wins more jobs. No marketing degree required.",
  openGraph: {
    title: "About KnearMe",
    description: "Built for contractors who do great work",
  },
};

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6">
              Our Story
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6">
              We Believe Your Work
              <span className="text-primary block mt-1">Should Speak for Itself</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              But it can&apos;t if nobody sees it. KnearMe exists because too many
              skilled contractors lose jobs to competitors with better websites—not
              better work.
            </p>
          </div>
        </div>
      </section>

      {/* The Problem We Saw */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">The Problem We Saw</h2>
                <div className="space-y-4 text-lg text-muted-foreground">
                  <p>
                    Talk to any masonry contractor and you&apos;ll hear the same story:
                  </p>
                  <p className="italic border-l-4 border-primary pl-4 py-2">
                    &ldquo;I get most of my work from referrals. When someone can&apos;t
                    get a referral, they Google it. And those people end up calling
                    my competitor—even though my work is better.&rdquo;
                  </p>
                  <p>
                    The problem isn&apos;t skill. It&apos;s visibility. Homeowners can&apos;t
                    hire you if they can&apos;t find you. And they can&apos;t trust you if
                    they can&apos;t see your work.
                  </p>
                </div>
              </div>
              <div className="bg-muted/50 rounded-2xl p-8">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium">Referrals dry up</p>
                      <p className="text-sm text-muted-foreground">
                        One slow month and the phone stops ringing
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <Search className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-medium">Homeowners Google instead</p>
                      <p className="text-sm text-muted-foreground">
                        When they can&apos;t get a name, they search
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">Photos close the deal</p>
                      <p className="text-sm text-muted-foreground">
                        The contractor with visible work gets the call
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

        {/* Our Approach */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Our Approach</h2>
                <p className="text-lg text-muted-foreground">
                  We don&apos;t try to turn contractors into marketers. We turn your
                  existing work into your marketing.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-8">
                <div className="bg-background rounded-xl p-6 shadow-sm">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                    <Camera className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Start With Your Work</h3>
                  <p className="text-muted-foreground">
                    You already take photos on the job site. We just make them
                    work harder for you.
                  </p>
                </div>

                <div className="bg-background rounded-xl p-6 shadow-sm">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                    <MessageSquare className="h-6 w-6 text-purple-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Talk, Don&apos;t Type</h3>
                  <p className="text-muted-foreground">
                    Describe your project like you&apos;re telling a customer. We
                    handle the writing.
                  </p>
                </div>

                <div className="bg-background rounded-xl p-6 shadow-sm">
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Shows Up When They Search</h3>
                  <p className="text-muted-foreground">
                    When a homeowner Googles &ldquo;chimney repair Denver,&rdquo; your work
                    can be what they find.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What We're Not */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">What We&apos;re Not</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="border rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center">
                      <span className="text-red-500 text-sm">✕</span>
                    </div>
                    <span className="font-medium">Not a website builder</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You don&apos;t need another WordPress site to maintain. We give
                    you project pages that just work.
                  </p>
                </div>

                <div className="border rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center">
                      <span className="text-red-500 text-sm">✕</span>
                    </div>
                    <span className="font-medium">Not a lead gen service</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No shared leads, no bidding wars. Customers find you directly
                    through your work.
                  </p>
                </div>

                <div className="border rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center">
                      <span className="text-red-500 text-sm">✕</span>
                    </div>
                    <span className="font-medium">Not social media</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No algorithm, no daily posting, no hoping the right person
                    sees your stuff.
                  </p>
                </div>

                <div className="border rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </div>
                    <span className="font-medium">Just proof that wins jobs</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Shareable project pages that build trust and show up when
                    local homeowners search.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Built For Contractors */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
                <Hammer className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold mb-6">Built for Contractors</h2>
              <p className="text-lg text-muted-foreground mb-8">
                We started with masonry because specificity matters. A chimney
                rebuild is different from a kitchen remodel. A tuckpointing job
                has different challenges than a new patio. We understand that—and
                our tools reflect it.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  "Chimney Repair",
                  "Tuckpointing",
                  "Foundation Work",
                  "Brick Restoration",
                  "Stone Masonry",
                  "Historic Preservation",
                ].map((service) => (
                  <Badge key={service} variant="secondary" className="text-sm py-1">
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Show Off Your Work?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start free. No credit card required. See how it feels to have
              your projects working for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/examples">
                <Button size="lg" variant="outline">
                  See Example Portfolios
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
