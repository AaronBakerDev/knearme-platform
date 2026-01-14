/**
 * Site Footer with comprehensive navigation.
 *
 * Features:
 * - Brand info
 * - Services links (top services by search volume)
 * - Resources links (Learn, Browse Projects)
 * - Product links
 * - Legal links
 *
 * @see /src/app/page.tsx - Landing page
 */

import Link from "next/link";
import { LIVE_TOOLS } from "@/lib/tools/catalog";
import { getAuthCta, getAuthStatus } from "@/lib/auth/auth-status";

/**
 * Top services by search volume for footer links.
 */
const TOP_SERVICES = [
  { slug: "chimney-repair", label: "Chimney Repair" },
  { slug: "foundation-repair", label: "Foundation Repair" },
  { slug: "tuckpointing", label: "Tuckpointing" },
  { slug: "brick-repair", label: "Brick Repair" },
  { slug: "stone-masonry", label: "Stone Masonry" },
  { slug: "historic-restoration", label: "Historic Restoration" },
];

const LEARNING_CENTER_LINKS = [
  { href: "/learn", label: "All Guides" },
  { href: "/learn/signs-chimney-needs-repair", label: "Signs Chimney Needs Repair" },
  { href: "/learn/foundation-waterproofing", label: "Foundation Waterproofing" },
  { href: "/learn/historic-brick-restoration", label: "Historic Brick Restoration" },
  { href: "/learn/masonry-restoration-costs", label: "Masonry Restoration Costs" },
];

const LEARNING_CATEGORIES = [
  { href: "/learn?category=chimney", label: "Chimney" },
  { href: "/learn?category=waterproofing", label: "Waterproofing" },
  { href: "/learn?category=costs", label: "Cost Guides" },
  { href: "/learn?category=restoration", label: "Historic Restoration" },
  { href: "/learn?category=maintenance", label: "Maintenance" },
  { href: "/learn?category=hiring", label: "Hiring" },
];

export async function SiteFooter() {
  const authStatus = await getAuthStatus();
  const authCta = getAuthCta(authStatus);

  return (
    <footer className="border-t bg-zinc-50 dark:bg-zinc-950">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-6 rounded-md bg-zinc-900 dark:bg-zinc-50 flex items-center justify-center text-white dark:text-black font-bold text-xs">
                K
              </div>
              <span className="text-lg font-bold">KnearMe</span>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground mb-4">
              The easiest way for masons and contractors to build a professional
              portfolio and rank on Google.
            </p>
            <p className="text-xs text-muted-foreground">
              Find masonry contractors in{" "}
              <Link href="/denver-co/masonry" className="hover:text-foreground">
                Denver
              </Link>
              ,{" "}
              <Link href="/lakewood-co/masonry" className="hover:text-foreground">
                Lakewood
              </Link>
              ,{" "}
              <Link href="/aurora-co/masonry" className="hover:text-foreground">
                Aurora
              </Link>
              , and more cities.
            </p>
          </div>

          {/* Services Column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Services</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {TOP_SERVICES.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={`/services/${service.slug}`}
                    className="hover:text-foreground"
                  >
                    {service.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/services"
                  className="text-primary hover:underline font-medium"
                >
                  All Services
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Resources</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/learn" className="hover:text-foreground">
                  Learning Center
                </Link>
              </li>
              <li>
                <Link href="/denver-co/masonry" className="hover:text-foreground">
                  Browse Projects
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-foreground">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/examples" className="hover:text-foreground">
                  Portfolio Examples
                </Link>
              </li>
            </ul>
          </div>

          {/* Learning Center Column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Learning Center</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {LEARNING_CENTER_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-4">
              <p className="text-xs font-semibold text-foreground mb-2">
                Article Categories
              </p>
              <div className="flex flex-wrap gap-2">
                {LEARNING_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    className="text-xs rounded-full border border-muted-foreground/20 px-3 py-1 hover:border-foreground hover:text-foreground transition-colors"
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Tools Column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Tools</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/tools" className="hover:text-foreground">
                  Tools Hub
                </Link>
              </li>
              {LIVE_TOOLS.map((tool) => (
                <li key={tool.slug}>
                  <Link href={`/tools/${tool.slug}`} className="hover:text-foreground">
                    {tool.footerLabel ?? tool.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Company</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground">
                  Contact
                </Link>
              </li>
              <li>
                <Link href={authCta?.href ?? "/signup"} className="hover:text-foreground">
                  {authCta?.label ?? "Get Started"}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-foreground">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} KnearMe. All rights reserved.</p>
          <p className="text-xs">
            Professional portfolios for masonry contractors.
          </p>
        </div>
      </div>
    </footer>
  );
}
