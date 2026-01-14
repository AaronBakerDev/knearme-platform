'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu,
  Home,
  Users,
  Star,
  FileText,
  GitBranch,
  Download,
  BarChart3,
  DollarSign,
  Search,
  ScrollText,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/components/ui/dialog'

/**
 * Navigation items for the dashboard sidebar.
 * Grouped into main navigation and observability sections.
 */
const mainNavItems: Array<{
  path: string
  label: string
  Icon: LucideIcon
}> = [
  { path: '/', label: 'Dashboard', Icon: Home },
  { path: '/contractors', label: 'Contractors', Icon: Users },
  { path: '/reviews', label: 'Reviews', Icon: Star },
  { path: '/articles', label: 'Articles', Icon: FileText },
  { path: '/pipeline', label: 'Pipeline', Icon: GitBranch },
  { path: '/exports', label: 'Exports', Icon: Download },
]

/**
 * Observability navigation items for cost tracking, logs, and search history.
 */
const observabilityNavItems: Array<{
  path: string
  label: string
  Icon: LucideIcon
}> = [
  { path: '/costs', label: 'Costs', Icon: DollarSign },
  { path: '/searches', label: 'Searches', Icon: Search },
  { path: '/logs', label: 'Logs', Icon: ScrollText },
]

/**
 * Sidebar component with navigation links.
 * Mission Control dark theme with emerald accents.
 */
export function Sidebar() {
  const pathname = usePathname()

  const getLinkClasses = (isActive: boolean) =>
    isActive
      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent'

  return (
    <>
      {/* Mobile Header */}
      <Dialog>
        <div className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-zinc-800/50 bg-zinc-950/95 px-4 backdrop-blur lg:hidden">
          <DialogTrigger asChild>
            <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700/50 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation</span>
            </button>
          </DialogTrigger>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <BarChart3 className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-sm font-semibold text-zinc-100">
              Review Agent
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-zinc-800/50 border border-zinc-700/50 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Ready
          </div>
        </div>

        <DialogContent className="left-0 top-0 h-full w-[80vw] max-w-xs translate-x-0 translate-y-0 rounded-none border-r border-zinc-800/50 bg-zinc-950 p-0">
          <div className="flex h-16 items-center border-b border-zinc-800/50 px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <BarChart3 className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="text-lg font-semibold text-zinc-100">
                Review Agent
              </span>
            </div>
          </div>

          <nav className="flex flex-col gap-1 p-4">
            {mainNavItems.map((item) => {
              const isActive = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)
              const Icon = item.Icon
              const link = (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${getLinkClasses(isActive)}`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
              return (
                <DialogClose asChild key={item.path}>
                  {link}
                </DialogClose>
              )
            })}

            <div className="my-3 border-t border-zinc-800/50" />
            <span className="mb-1 px-3 text-xs font-mono uppercase tracking-wider text-zinc-600">
              Observability
            </span>

            {observabilityNavItems.map((item) => {
              const isActive = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)
              const Icon = item.Icon
              const link = (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${getLinkClasses(isActive)}`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
              return (
                <DialogClose asChild key={item.path}>
                  {link}
                </DialogClose>
              )
            })}
          </nav>
        </DialogContent>
      </Dialog>

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-zinc-800/50 bg-zinc-950 lg:block">
        <div className="flex h-16 items-center border-b border-zinc-800/50 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <BarChart3 className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-lg font-semibold text-zinc-100">
              Review Agent
            </span>
          </div>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          {mainNavItems.map((item) => {
            const isActive = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)
            const Icon = item.Icon
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${getLinkClasses(isActive)}`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}

          <div className="my-3 border-t border-zinc-800/50" />
          <span className="mb-1 px-3 text-xs font-mono uppercase tracking-wider text-zinc-600">
            Observability
          </span>

          {observabilityNavItems.map((item) => {
            const isActive = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)
            const Icon = item.Icon
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${getLinkClasses(isActive)}`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-800/50 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50 px-3 py-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-zinc-500">Pipeline Ready</span>
          </div>
        </div>
      </aside>
    </>
  )
}
