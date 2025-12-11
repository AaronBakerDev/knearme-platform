import { Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Portfolio Showcase Section
 *
 * Displays sample project cards demonstrating the quality of AI-generated
 * content. Uses realistic fake data based on masonry project types from
 * vision.md (chimney, tuckpointing, stone work).
 *
 * Placeholder images show where contractor photos would appear.
 * In production, these would be real before/after images.
 */

const sampleProjects = [
  {
    title: "Historic Brick Chimney Restoration",
    type: "Chimney",
    location: "Denver, CO",
    description:
      "Complete rebuild of a 1920s chimney using reclaimed period-appropriate brick. Restored proper draft and structural integrity while maintaining the home's historic character.",
    gradient: "from-amber-900/20 to-orange-900/20",
    placeholder: "Chimney rebuild photo",
  },
  {
    title: "Commercial Building Repointing",
    type: "Tuckpointing",
    location: "Lakewood, CO",
    description:
      "Full tuckpointing of a 3-story commercial building facade. Matched original mortar color and tooling style to preserve the building's 1940s aesthetic.",
    gradient: "from-stone-900/20 to-gray-900/20",
    placeholder: "Tuckpointing photo",
  },
  {
    title: "Natural Stone Retaining Wall",
    type: "Stone Work",
    location: "Boulder, CO",
    description:
      "Custom-built 120-foot retaining wall using locally-sourced Colorado sandstone. Engineered for a steep grade with integrated drainage system.",
    gradient: "from-slate-900/20 to-zinc-900/20",
    placeholder: "Stone wall photo",
  },
];

export function PortfolioShowcase() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            See What You&apos;ll Get
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Real project showcases created by contractors like you.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {sampleProjects.map((project, index) => (
            <Card key={index} className="overflow-hidden group">
              {/* Image Placeholder */}
              <div
                className={`aspect-video bg-gradient-to-br ${project.gradient} flex items-center justify-center transition-transform group-hover:scale-105`}
              >
                <div className="text-center text-muted-foreground">
                  <Camera className="mx-auto h-10 w-10 opacity-50 mb-2" />
                  <p className="text-xs">{project.placeholder}</p>
                </div>
              </div>

              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{project.type}</Badge>
                  <Badge variant="outline">{project.location}</Badge>
                </div>
                <CardTitle className="text-lg leading-tight">
                  {project.title}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {project.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
