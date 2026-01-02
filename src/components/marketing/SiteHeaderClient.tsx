"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Menu, Hammer, BookOpen, Building2, Calculator, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

/**
 * Service types for navigation dropdown.
 * Ordered by search volume / popularity.
 */
const SERVICES = [
  { slug: "chimney-repair", label: "Chimney Repair", description: "Repair, rebuild, and restore chimneys" },
  { slug: "foundation-repair", label: "Foundation Repair", description: "Structural repairs and waterproofing" },
  { slug: "tuckpointing", label: "Tuckpointing", description: "Mortar joint repair and restoration" },
  { slug: "brick-repair", label: "Brick Repair", description: "Replace and restore damaged bricks" },
  { slug: "stone-masonry", label: "Stone Masonry", description: "Natural stone and veneer work" },
  { slug: "historic-restoration", label: "Historic Restoration", description: "Period-appropriate preservation" },
  { slug: "masonry-waterproofing", label: "Waterproofing", description: "Sealers and moisture protection" },
  { slug: "efflorescence-removal", label: "Efflorescence Removal", description: "Remove white salt deposits" },
];

type SiteHeaderClientProps = {
  isAuthenticated: boolean;
  hasCompleteProfile: boolean;
};

/**
 * Navigation link item component for dropdown.
 */
function NavItem({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-1 text-xs leading-snug text-muted-foreground">
            {description}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

export function SiteHeaderClient({ isAuthenticated, hasCompleteProfile }: SiteHeaderClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authState, setAuthState] = useState({
    isAuthenticated,
    hasCompleteProfile,
  });

  useEffect(() => {
    setAuthState({ isAuthenticated, hasCompleteProfile });
  }, [isAuthenticated, hasCompleteProfile]);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    const resolveProfileCompletion = async (userId: string) => {
      // Type assertion needed due to RLS type inference issues
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: contractor, error } = await (supabase as any)
        .from("contractors")
        .select("business_name, city, services")
        .eq("auth_user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("[SiteHeader] Failed to load contractor profile:", error);
        return false;
      }

      const profile = contractor as { business_name?: string; city?: string; services?: string[] } | null;
      return Boolean(
        profile?.business_name && profile?.city && profile?.services?.length
      );
    };

    const syncSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (!session) {
        setAuthState({ isAuthenticated: false, hasCompleteProfile: false });
        return;
      }

      const hasCompleteProfile = await resolveProfileCompletion(session.user.id);

      if (!isMounted) return;

      setAuthState({ isAuthenticated: true, hasCompleteProfile });
    };

    syncSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return;

        if (!session) {
          setAuthState({ isAuthenticated: false, hasCompleteProfile: false });
          return;
        }

        const hasCompleteProfile = await resolveProfileCompletion(session.user.id);

        if (!isMounted) return;

        setAuthState({ isAuthenticated: true, hasCompleteProfile });
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const primaryCta = authState.isAuthenticated
    ? authState.hasCompleteProfile
      ? { href: "/dashboard", label: "Go to Dashboard" }
      : { href: "/profile/setup", label: "Finish Profile" }
    : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm group-hover:shadow-md transition-shadow">
            K
          </div>
          <span className="text-xl font-bold tracking-tight">KnearMe</span>
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {/* Services Dropdown */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="h-10">
                Services
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-[500px] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Masonry Services</h3>
                    <Link
                      href="/services"
                      className="text-xs text-primary hover:underline"
                    >
                      View All Services
                    </Link>
                  </div>
                  <ul className="grid grid-cols-2 gap-2">
                    {SERVICES.map((service) => (
                      <NavItem
                        key={service.slug}
                        href={`/services/${service.slug}`}
                        title={service.label}
                        description={service.description}
                      />
                    ))}
                  </ul>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Browse Projects */}
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={cn(navigationMenuTriggerStyle(), "h-10")}
              >
                <Link href="/denver-co/masonry">
                  Browse Projects
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Tools */}
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={cn(navigationMenuTriggerStyle(), "h-10")}
              >
                <Link href="/tools">
                  Tools
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Learning Center */}
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={cn(navigationMenuTriggerStyle(), "h-10")}
              >
                <Link href="/learn">
                  Learn
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* About */}
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={cn(navigationMenuTriggerStyle(), "h-10")}
              >
                <Link href="/about">
                  About
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Desktop Auth Actions */}
        <nav className="hidden md:flex items-center gap-4">
          {authState.isAuthenticated && primaryCta ? (
            <>
              <Link
                href={primaryCta.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary px-3 py-2 rounded-lg hover:bg-muted"
              >
                {primaryCta.label}
              </Link>
              <form action="/auth/signout" method="post">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full px-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  Sign Out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary px-3 py-2 rounded-lg hover:bg-muted"
              >
                Sign In
              </Link>
              <Link href="/signup">
                <Button size="sm" className="rounded-full px-5 shadow-sm hover:shadow-md transition-shadow">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="hover:bg-accent/50">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[350px] border-l border-border/40">
            <SheetHeader>
              <SheetTitle className="text-left flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                  K
                </div>
                <span>KnearMe</span>
              </SheetTitle>
            </SheetHeader>

            <nav className="mt-8 px-2 flex flex-col">
              <Accordion type="single" collapsible className="w-full border-none">
                {/* Services Accordion */}
                <AccordionItem value="services" className="border-none">
                  <AccordionTrigger className="text-base font-medium py-3 px-2 hover:no-underline hover:text-primary hover:bg-accent/30 rounded-lg min-h-[48px]">
                    <span className="flex items-center gap-3">
                      <Hammer className="h-5 w-5 text-muted-foreground" />
                      Services
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-2">
                    <div className="flex flex-col gap-0.5 ml-7 rounded-lg bg-muted/30 py-2">
                      {SERVICES.map((service) => (
                        <Link
                          key={service.slug}
                          href={`/services/${service.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="text-sm text-muted-foreground hover:text-foreground py-3 px-4 rounded-md hover:bg-accent/50 transition-colors min-h-[44px] flex items-center"
                        >
                          {service.label}
                        </Link>
                      ))}
                      <Link
                        href="/services"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-sm font-medium text-primary hover:text-primary/80 py-3 px-4 mt-1 bg-primary/5 rounded-md min-h-[44px] flex items-center"
                      >
                        View All →
                      </Link>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Direct Links */}
              <Link
                href="/denver-co/masonry"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 text-base font-medium py-3 px-2 text-foreground hover:text-primary hover:bg-accent/30 rounded-lg transition-colors min-h-[48px]"
              >
                <Building2 className="h-5 w-5 text-muted-foreground" />
                Browse Projects
              </Link>

              <Link
                href="/learn"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 text-base font-medium py-3 px-2 text-foreground hover:text-primary hover:bg-accent/30 rounded-lg transition-colors min-h-[48px]"
              >
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                Learning Center
              </Link>

              <Link
                href="/tools"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 text-base font-medium py-3 px-2 text-foreground hover:text-primary hover:bg-accent/30 rounded-lg transition-colors min-h-[48px]"
              >
                <Calculator className="h-5 w-5 text-muted-foreground" />
                Tools
              </Link>

              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 text-base font-medium py-3 px-2 text-foreground hover:text-primary hover:bg-accent/30 rounded-lg transition-colors min-h-[48px]"
              >
                <Info className="h-5 w-5 text-muted-foreground" />
                About
              </Link>

              {/* Auth Actions */}
              <div className="border-t border-border/40 pt-6 mt-6 flex flex-col gap-3">
                {authState.isAuthenticated && primaryCta ? (
                  <>
                    <Link
                      href={primaryCta.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-base text-muted-foreground hover:text-foreground transition-colors py-2"
                    >
                      {primaryCta.label}
                    </Link>
                    <form action="/auth/signout" method="post">
                      <Button
                        type="submit"
                        variant="outline"
                        className="w-full rounded-full"
                      >
                        Sign Out
                      </Button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-base text-muted-foreground hover:text-foreground transition-colors py-2"
                    >
                      Sign In
                    </Link>
                    <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full rounded-full">Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
