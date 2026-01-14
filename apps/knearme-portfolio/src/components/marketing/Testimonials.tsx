import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { getTestimonials, type Testimonial as TestimonialType } from "@/lib/payload/client";

/**
 * Testimonials Section
 *
 * Showcases customer success stories and social proof.
 * Positioned to build trust before pricing section.
 *
 * Data flow:
 * 1. Fetches testimonials from Payload CMS via getTestimonials()
 * 2. Falls back to hardcoded content on failure
 *
 * @see PAY-021 in PRD for acceptance criteria
 * @see src/lib/payload/client.ts for getTestimonials() implementation
 * @see src/payload/collections/Testimonials.ts for collection schema
 */

/**
 * Hardcoded fallback testimonials
 * Used when CMS is unavailable or returns no data
 */
const FALLBACK_TESTIMONIALS: {
  name: string;
  role: string;
  content: string;
  rating: number;
  initials: string;
}[] = [
  {
    name: "Mike R.",
    role: "Rocky Mountain Masonry",
    content:
      "A customer told me they hired me because they saw my chimney work online. That one project paid for a year of KnearMe.",
    rating: 5,
    initials: "MR",
  },
  {
    name: "Carlos M.",
    role: "Heritage Brickwork",
    content:
      "I used to lose jobs to guys with flashy websites. Now my work speaks for itself. Three new customers last month found me through my projects.",
    rating: 5,
    initials: "CM",
  },
  {
    name: "Tom K.",
    role: "Keystone Masonry",
    content:
      "My nephew set up my website years ago with three photos. Now I've got 40 projects and customers actually call me saying they found me on Google.",
    rating: 5,
    initials: "TK",
  },
];

/**
 * Extract plain text content from testimonial
 * Handles both string content (from fallback) and Lexical rich text (from CMS)
 */
function getContentText(
  testimonial: TestimonialType | (typeof FALLBACK_TESTIMONIALS)[0]
): string {
  const content = testimonial.content;

  // If it's a string, return as-is (fallback data)
  if (typeof content === "string") {
    return content;
  }

  // If it's Lexical rich text, extract text content
  // Lexical stores content in root.children[].children[].text
  if (content && typeof content === "object") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const root = (content as any).root;
      if (root?.children) {
        return root.children
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((paragraph: any) => {
            if (paragraph.children) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return paragraph.children.map((node: any) => node.text || "").join("");
            }
            return "";
          })
          .join("\n\n");
      }
    } catch {
      // Fall back to empty string if parsing fails
      return "";
    }
  }

  return "";
}

/**
 * Get initials from a name
 * E.g., "Mike Rodriguez" -> "MR", "Carlos" -> "C"
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

/**
 * Get avatar URL from testimonial
 * Returns undefined if no avatar or if it's fallback data
 */
function getAvatarUrl(
  testimonial: TestimonialType | (typeof FALLBACK_TESTIMONIALS)[0]
): string | undefined {
  if ("avatar" in testimonial && testimonial.avatar) {
    // CMS data - avatar is a MediaReference
    const avatar = testimonial.avatar;
    if (typeof avatar === "object" && "url" in avatar) {
      return avatar.url as string;
    }
  }
  return undefined;
}

/**
 * Testimonials Server Component
 *
 * Fetches testimonials from Payload CMS and renders cards.
 * Falls back to hardcoded content if CMS fetch fails.
 */
export async function Testimonials() {
  // Fetch testimonials from Payload CMS
  let testimonials: (TestimonialType | (typeof FALLBACK_TESTIMONIALS)[0])[] =
    FALLBACK_TESTIMONIALS;

  try {
    const cmsTestimonials = await getTestimonials({ featuredOnly: false, limit: 6 });

    // Only use CMS data if we got results
    if (cmsTestimonials && cmsTestimonials.length > 0) {
      testimonials = cmsTestimonials;
    }
  } catch (error) {
    // Log error but continue with fallback data
    console.error("[Testimonials] Failed to fetch from CMS, using fallback:", error);
  }

  return (
    <section className="py-24 bg-zinc-50 dark:bg-zinc-900/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Contractors Winning More Jobs
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => {
            const name = testimonial.name;
            const role = testimonial.role || "";
            const content = getContentText(testimonial);
            const rating = testimonial.rating || 5;
            const initials = "initials" in testimonial ? testimonial.initials : getInitials(name);
            const avatarUrl = getAvatarUrl(testimonial);

            return (
              <Card key={"id" in testimonial ? testimonial.id : index} className="border-none shadow-sm bg-background">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4 text-amber-500">
                    {[...Array(rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mb-6 text-muted-foreground italic">{content}</p>
                  <div className="flex items-center gap-4">
                    <Avatar>
                      {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">{role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
