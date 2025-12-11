import { Clock, Camera, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Pain Points Section
 *
 * Connects with contractor frustrations identified in personas.md:
 * - "Too busy to write" - Mike's primary frustration
 * - "Website is embarrassing" - Outdated online presence
 * - "Invisible on Google" - Missing local SEO visibility
 *
 * Design: Dashed border cards with destructive-tinted icons
 * to visually communicate "problems" before showing solutions.
 */

const painPoints = [
  {
    icon: Clock,
    title: '"Too busy to write"',
    description:
      "After 10 hours on a job site, the last thing you want to do is sit down and write about it. Marketing falls to the bottom of the list.",
  },
  {
    icon: Camera,
    title: '"Website is embarrassing"',
    description:
      "That 5-year-old site with 3 outdated photos doesn't show your best work. You know it. Your customers know it.",
  },
  {
    icon: Search,
    title: '"Invisible on Google"',
    description:
      'Homeowners searching for "chimney repair near me" can\'t find you. Meanwhile, competitors with worse work show up first.',
  },
];

export function PainPoints() {
  return (
    <section className="py-24 bg-zinc-50 dark:bg-zinc-900/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Sound familiar?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Most masonry contractors do amazing work but struggle to show it
            online.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {painPoints.map((point, index) => (
            <Card key={index} className="border-dashed">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                  <point.icon className="h-6 w-6 text-destructive" />
                </div>
                <CardTitle className="text-lg">{point.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{point.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
