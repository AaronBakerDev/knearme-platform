import { Clock, Camera, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Pain Points Section
 *
 * Connects with contractor frustrations:
 * - "Too busy to write" - Primary frustration across all trades
 * - "Great work, no proof" - Work gets done but never documented
 * - "Invisible online" - Missing visibility for local customers
 *
 * Design: Dashed border cards with destructive-tinted icons
 * to visually communicate "problems" before showing solutions.
 */

const painPoints = [
  {
    icon: Clock,
    title: '"I do great work—but who knows?"',
    description:
      "You finish amazing projects every week, but by the time you get home, documenting them is the last thing on your mind. That work never gets shown off.",
  },
  {
    icon: Camera,
    title: '"My phone is full of project photos"',
    description:
      "Hundreds of before-and-afters sitting in your camera roll. You know they could win you jobs—if only you had time to do something with them.",
  },
  {
    icon: Search,
    title: '"Customers can\'t find my best work"',
    description:
      "Homeowners searching for contractors in your area find competitors instead. Your portfolio is outdated or doesn't exist at all.",
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
            Contractors do amazing work every day—but rarely have time to document it.
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
