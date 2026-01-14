/**
 * Mobile navigation for authenticated dashboard.
 *
 * Client Component that provides a hamburger menu for mobile users
 * accessing the authenticated business dashboard.
 *
 * Features:
 * - Sheet (slide-in drawer) from the right
 * - User info display (business name, email)
 * - Main navigation links (Dashboard, New Project)
 * - Settings and profile links
 * - Logout functionality
 *
 * Renamed from ContractorMobileNav in Phase 11 (business terminology migration).
 *
 * @see /src/app/(dashboard)/layout.tsx - Server Component parent
 * @see /src/components/marketing/SiteHeader.tsx - Similar mobile menu pattern
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, Home, Plus, User, Settings, LogOut } from 'lucide-react'
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Avatar,
  AvatarFallback,
} from '@/components/ui'

export interface DashboardMobileNavProps {
  businessName: string | null
  email: string
  initials: string
}

/**
 * @deprecated Use DashboardMobileNavProps instead
 */
export type ContractorMobileNavProps = DashboardMobileNavProps

export function DashboardMobileNav({ businessName, email, initials }: DashboardMobileNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild className="md:hidden">
        <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Mobile menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[300px] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle className="text-left">Menu</SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-4">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <p className="text-sm font-medium truncate">{businessName ?? 'Your Business'}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Link>

            <Link
              href="/projects/new"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Project
            </Link>

            <Link
              href="/profile/edit"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              <User className="h-4 w-4" />
              Edit Profile
            </Link>

            <Link
              href="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </nav>

          {/* Logout */}
          <div className="border-t pt-4 mt-2">
            <form action="/auth/signout" method="post" className="w-full">
              <button
                type="submit"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/**
 * @deprecated Use DashboardMobileNav instead
 */
export const ContractorMobileNav = DashboardMobileNav
