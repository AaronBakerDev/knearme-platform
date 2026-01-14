import {
  Mic,
  Search,
  Layout,
  Zap,
  Shield,
  Globe,
  Star,
  Clock,
  Users,
  Camera,
  FileText,
  TrendingUp,
  MessageSquare,
  Settings,
  CheckCircle,
  Award,
  Heart,
  Target,
  Lightbulb,
  Rocket,
  type LucideIcon,
} from "lucide-react";
import { getFeatures, type Feature } from "@/lib/payload/client";

/**
 * Feature Grid Section
 *
 * Highlights key platform features to showcase value proposition.
 * Data flow:
 * 1. Fetches Features from Payload CMS via getFeatures()
 * 2. Falls back to hardcoded content on failure
 *
 * @see PAY-022 in PRD for acceptance criteria
 * @see src/lib/payload/client.ts for getFeatures() implementation
 */

/**
 * Icon mapping from CMS icon name strings to Lucide components
 * Maps the icon select options from Features.ts collection
 */
const ICON_MAP: Record<string, LucideIcon> = {
  Mic,
  Search,
  Layout,
  Zap,
  Shield,
  Globe,
  Star,
  Clock,
  Users,
  Camera,
  FileText,
  TrendingUp,
  MessageSquare,
  Settings,
  CheckCircle,
  Award,
  Heart,
  Target,
  Lightbulb,
  Rocket,
};

/**
 * Default icon when CMS icon name doesn't match
 */
const DEFAULT_ICON = Star;

/**
 * Hardcoded fallback features
 * Used when CMS is unavailable or returns no data
 */
const FALLBACK_FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Mic,
    title: "Voice-First Creation",
    description:
      "Describe your project like you're talking to a customer. We turn your words into polished case studies—no typing, no staring at a blank page.",
  },
  {
    icon: Search,
    title: "Built for Local Search",
    description:
      "Every project page is structured to help you show up when homeowners search for services in your area. Real visibility, not just a pretty portfolio.",
  },
  {
    icon: Layout,
    title: "Professional Without the Price Tag",
    description:
      "Clean, modern layouts that make your work look as good as it deserves. Mobile-friendly and ready to impress potential customers.",
  },
];

/**
 * Get the Lucide icon component for a CMS feature
 */
function getIconComponent(iconName: string | undefined): LucideIcon {
  if (!iconName) return DEFAULT_ICON;
  return ICON_MAP[iconName] || DEFAULT_ICON;
}

/**
 * FeatureGrid Server Component
 *
 * Fetches features from Payload CMS and renders a grid.
 * Falls back to hardcoded content if CMS fetch fails.
 */
export async function FeatureGrid() {
  // Fetch features from Payload CMS
  let features: (Feature | { icon: LucideIcon; title: string; description: string })[] =
    FALLBACK_FEATURES;

  try {
    const cmsFeatures = await getFeatures({ showOnLandingOnly: true });

    // Only use CMS data if we got results
    if (cmsFeatures && cmsFeatures.length > 0) {
      features = cmsFeatures;
    }
  } catch (error) {
    // Log error but continue with fallback data
    console.error("[FeatureGrid] Failed to fetch from CMS, using fallback:", error);
  }

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Built for Busy Contractors
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to turn finished projects into marketing that works.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {features.map((feature, index) => {
            // Determine icon: either direct LucideIcon (fallback) or string name (CMS)
            const IconComponent =
              "icon" in feature && typeof feature.icon === "string"
                ? getIconComponent(feature.icon)
                : "icon" in feature && typeof feature.icon === "function"
                  ? feature.icon
                  : DEFAULT_ICON;

            return (
              <div key={"id" in feature ? feature.id : index} className="flex flex-col items-start">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  <IconComponent className="h-6 w-6" />
                </div>
                <h3 className="mb-4 text-2xl font-bold text-foreground">{feature.title}</h3>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
