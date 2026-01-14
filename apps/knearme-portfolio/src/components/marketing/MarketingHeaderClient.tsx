'use client'

/**
 * Marketing Header Client Component
 *
 * Renders the marketing header with CMS-driven navigation.
 * Supports both desktop (NavigationMenu) and mobile (Sheet) views.
 *
 * @see /src/components/marketing/MarketingHeader.tsx for server wrapper
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Button,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui'
import { Menu, Hammer, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logging'
import type { MarketingNavigation, NavLink } from '@/lib/payload/client'

/**
 * Service types for navigation dropdown.
 * These are hardcoded since they're specific business logic,
 * not general navigation links.
 */
const SERVICES = [
  { slug: 'chimney-repair', label: 'Chimney Repair', description: 'Repair, rebuild, and restore chimneys' },
  { slug: 'foundation-repair', label: 'Foundation Repair', description: 'Structural repairs and waterproofing' },
  { slug: 'tuckpointing', label: 'Tuckpointing', description: 'Mortar joint repair and restoration' },
  { slug: 'brick-repair', label: 'Brick Repair', description: 'Replace and restore damaged bricks' },
  { slug: 'stone-masonry', label: 'Stone Masonry', description: 'Natural stone and veneer work' },
  { slug: 'historic-restoration', label: 'Historic Restoration', description: 'Period-appropriate preservation' },
  { slug: 'masonry-waterproofing', label: 'Waterproofing', description: 'Sealers and moisture protection' },
  { slug: 'efflorescence-removal', label: 'Efflorescence Removal', description: 'Remove white salt deposits' },
]

/**
 * Icons mapped to nav link labels for mobile menu.
 * Falls back to ExternalLink for unknown labels.
 */
const NAV_ICONS: Record<string, React.ElementType> = {
  Services: Hammer,
}

type MarketingHeaderClientProps = {
  navigation: MarketingNavigation
  isAuthenticated: boolean
  hasCompleteProfile: boolean
}

/**
 * Navigation link item component for dropdown.
 */
function NavItem({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-1 text-xs leading-snug text-muted-foreground">{description}</p>
        </Link>
      </NavigationMenuLink>
    </li>
  )
}

export function MarketingHeaderClient({
  navigation,
  isAuthenticated,
  hasCompleteProfile,
}: MarketingHeaderClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Base auth state from server
  const baseAuthState = useMemo(
    () => ({ isAuthenticated, hasCompleteProfile }),
    [isAuthenticated, hasCompleteProfile]
  )

  // Session auth state (updated on client)
  const [sessionAuthState, setSessionAuthState] = useState<{
    isAuthenticated: boolean
    hasCompleteProfile: boolean
  } | null>(null)

  // Listen for auth state changes
  useEffect(() => {
    const supabase = createClient()
    let isMounted = true

    const resolveProfileCompletion = async (userId: string) => {
      const { data: business, error } = await supabase
        .from('businesses')
        .select('name, city, state, services, address, phone')
        .eq('auth_user_id', userId)
        .maybeSingle()

      if (error) {
        logger.error('[MarketingHeader] Failed to load business profile', { error })
        return false
      }

      const profile = business as {
        name?: string
        city?: string
        state?: string
        services?: string[]
        address?: string
        phone?: string
      } | null

      return Boolean(
        profile?.name &&
          profile?.city &&
          profile?.state &&
          profile?.services?.length &&
          profile?.address &&
          profile?.phone
      )
    }

    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!isMounted) return

      if (!session) {
        setSessionAuthState({ isAuthenticated: false, hasCompleteProfile: false })
        return
      }

      const hasComplete = await resolveProfileCompletion(session.user.id)
      if (!isMounted) return

      setSessionAuthState({ isAuthenticated: true, hasCompleteProfile: hasComplete })
    }

    syncSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return

      if (!session) {
        setSessionAuthState({ isAuthenticated: false, hasCompleteProfile: false })
        return
      }

      const hasComplete = await resolveProfileCompletion(session.user.id)
      if (!isMounted) return

      setSessionAuthState({ isAuthenticated: true, hasCompleteProfile: hasComplete })
    })

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const authState = sessionAuthState ?? baseAuthState

  // Determine primary CTA based on auth state
  const primaryCta = authState.isAuthenticated
    ? authState.hasCompleteProfile
      ? { href: '/dashboard', label: 'Go to Dashboard' }
      : { href: '/profile/setup', label: 'Finish Profile' }
    : null

  // CMS header CTA (for non-authenticated users)
  const headerCta = navigation.headerCta

  // Check if a link is the Services link (gets special dropdown treatment)
  const isServicesLink = (link: NavLink) =>
    link.label.toLowerCase() === 'services' || link.href === '/services'

  // Filter out Services from regular links (it gets a dropdown)
  const regularLinks = navigation.headerLinks.filter((link) => !isServicesLink(link))
  const hasServicesDropdown = navigation.headerLinks.some(isServicesLink)

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
            {/* Services Dropdown (if Services link exists) */}
            {hasServicesDropdown && (
              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-10">Services</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[500px] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold">Masonry Services</h3>
                      <Link href="/services" className="text-xs text-primary hover:underline">
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
            )}

            {/* Regular nav links from CMS */}
            {regularLinks.map((link) => (
              <NavigationMenuItem key={link.href}>
                <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), 'h-10')}>
                  <Link href={link.href} target={link.newTab ? '_blank' : undefined}>
                    {link.label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
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
              <Link href={headerCta.href || '/signup'}>
                <Button
                  size="sm"
                  variant={headerCta.variant || 'default'}
                  className="rounded-full px-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  {headerCta.label || 'Get Started'}
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
              {/* Services Accordion (if present) */}
              {hasServicesDropdown && (
                <Accordion type="single" collapsible className="w-full border-none">
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
              )}

              {/* Regular nav links */}
              {regularLinks.map((link) => {
                const Icon = NAV_ICONS[link.label] || ExternalLink
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    target={link.newTab ? '_blank' : undefined}
                    className="flex items-center gap-3 text-base font-medium py-3 px-2 text-foreground hover:text-primary hover:bg-accent/30 rounded-lg transition-colors min-h-[48px]"
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    {link.label}
                  </Link>
                )
              })}

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
                      <Button type="submit" variant="outline" className="w-full rounded-full">
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
                    <Link href={headerCta.href || '/signup'} onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full rounded-full">
                        {headerCta.label || 'Get Started'}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
