/**
 * Examples Gallery Page
 *
 * Shows demo project portfolios to demonstrate what contractors can create.
 * Links to actual demo project pages at SEO-optimized URLs.
 *
 * @see /src/lib/data/demo-projects.ts - Demo project data source
 * @see /src/app/(public)/[city]/masonry/[type]/[slug]/page.tsx - Demo project rendering
 * @see /CLAUDE.md - Brand voice guidelines
 */

import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  MapPin,
  Calendar,
  CheckCircle2,
  Camera,
  Clock,
  ExternalLink,
} from "lucide-react";
import { getAllDemoProjects } from "@/lib/data/demo-projects";

export const metadata: Metadata = {
  title: "Portfolio Examples | See What You Can Create | KnearMe",
  description:
    "See real examples of professional project portfolios created with KnearMe. Chimney repairs, tuckpointing, foundation work, and more.",
  openGraph: {
    title: "Portfolio Examples | KnearMe",
    description: "See what your work could look like online",
  },
};

/**
 * Get demo projects formatted for the examples page display.
 * Pulls from centralized demo data to ensure consistency with actual demo pages.
 */
function getExamplesData() {
  const demoProjects = getAllDemoProjects();

  return demoProjects.map((project, idx) => {
    // Format date from ISO string
    const date = new Date(project.published_at);
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    // Get contractor initials from business name
    const initials = project.contractor.business_name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2);

    // Use first few materials as highlights for the card
    const highlights = project.materials.slice(0, 4);

    return {
      id: String(idx + 1),
      title: project.title,
      type: project.project_type,
      typeSlug: project.project_type_slug,
      location: `${project.city}, ${project.state}`,
      date: formattedDate,
      description: project.description_blocks.find((b) => b.type === "paragraph")?.content || "",
      highlights,
      images: [
        { type: "before", label: "Before" },
        { type: "process", label: "During work" },
        { type: "after", label: "Completed" },
      ],
      contractor: {
        name: project.contractor.business_name,
        initials,
      },
      gradient: getGradientForType(project.project_type_slug),
      href: `/${project.city_slug}/masonry/${project.project_type_slug}/${project.slug}`,
    };
  });
}

/**
 * Get a gradient color based on project type for visual variety.
 */
function getGradientForType(typeSlug: string): string {
  const gradients: Record<string, string> = {
    "chimney-repair": "from-amber-900/40 to-orange-900/20",
    "foundation-repair": "from-slate-800/40 to-zinc-900/20",
    tuckpointing: "from-red-900/40 to-rose-900/20",
    "stone-masonry": "from-stone-700/40 to-stone-900/20",
  };
  return gradients[typeSlug] || "from-gray-800/40 to-gray-900/20";
}

/** Type for formatted example project data */
type ExampleProject = ReturnType<typeof getExamplesData>[number];

/**
 * Project card component showing a demo portfolio.
 * Links to the actual demo project page at an SEO-optimized URL.
 */
function ProjectCard({ project }: { project: ExampleProject }) {
  return (
    <Link href={project.href} className="block group">
      <article className="bg-background rounded-2xl border shadow-sm overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all">
        {/* Image Gallery Preview */}
        <div className="relative">
          <div className="grid grid-cols-3 gap-0.5">
            {project.images.map((img, idx) => (
              <div
                key={idx}
                className={`aspect-[4/3] bg-gradient-to-br ${project.gradient} relative`}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white/30" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <span className="text-xs text-white/90">{img.label}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Project Type Badge */}
          <Badge className="absolute top-3 left-3 bg-background/90 text-foreground border-0 shadow-sm">
            {project.type}
          </Badge>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold leading-tight mb-2 group-hover:text-primary transition-colors">
                {project.title}
              </h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {project.location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {project.date}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-sm font-semibold flex-shrink-0">
              {project.contractor.initials}
            </div>
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">
            {project.description}
          </p>

          {/* Highlights */}
          <div className="space-y-2 mb-4">
            {project.highlights.slice(0, 3).map((highlight, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>{highlight}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              by {project.contractor.name}
            </span>
            <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:underline">
              View Project
              <ExternalLink className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function ExamplesPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6">
              Portfolio Examples
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
              This Is What Your Work
              <span className="text-primary block mt-1">Could Look Like Online</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Real project examples from masonry contractors. Photos, descriptions,
              and proof that builds trust with potential customers.
            </p>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" />
              <span>Before & After Photos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Professional Descriptions</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span>Shows Up on Google</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>No Marketing Skills Needed</span>
            </div>
          </div>
        </div>
      </section>

        {/* Projects Grid */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {getExamplesData().map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Mini */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-4">
                No Marketing Degree Required
              </h2>
              <p className="text-muted-foreground mb-8">
                No typing. No design skills. Just photos from your phone and a
                quick description of the job.
              </p>
              <div className="grid sm:grid-cols-3 gap-6 text-left">
                <div className="bg-background rounded-xl p-5 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm mb-3">
                    1
                  </div>
                  <h3 className="font-medium mb-1">Upload Photos</h3>
                  <p className="text-sm text-muted-foreground">
                    From your phone, right on the job site
                  </p>
                </div>
                <div className="bg-background rounded-xl p-5 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm mb-3">
                    2
                  </div>
                  <h3 className="font-medium mb-1">Describe It</h3>
                  <p className="text-sm text-muted-foreground">
                    Talk through the job like you&apos;re explaining it to a customer
                  </p>
                </div>
                <div className="bg-background rounded-xl p-5 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm mb-3">
                    3
                  </div>
                  <h3 className="font-medium mb-1">Share & Grow</h3>
                  <p className="text-sm text-muted-foreground">
                    Send to customers or show up on Google
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Your Work Deserves to Be Seen
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start building your portfolio today. Publish up to 5 projects for
              free and keep them live forever. No credit card needed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Create Your First Project
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/#how-it-works">
                <Button size="lg" variant="outline">
                  See How It Works
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
