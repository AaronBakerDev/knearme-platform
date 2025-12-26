'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Sticky bottom CTA for mobile dashboard.
 * Keeps "Create New Project" always visible on mobile devices.
 * Hidden on desktop (md+) where the Quick Actions cards are visible.
 *
 * @see dashboard/page.tsx - Main dashboard that uses this component
 */
export function StickyMobileCTA() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur-sm border-t shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="p-4">
        <Button asChild className="w-full" size="lg">
          <Link href="/projects/new">
            <Plus className="w-4 h-4 mr-2" />
            Create New Project
          </Link>
        </Button>
      </div>
    </div>
  );
}
