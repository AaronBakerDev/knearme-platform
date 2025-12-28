/**
 * Directory Layout - Shared layout for all directory pages.
 *
 * Provides:
 * - Breadcrumb navigation
 * - Container wrapper with max-width
 * - Default metadata for directory section
 *
 * @see /src/app/(public)/find/page.tsx - Landing page
 * @see /src/app/(public)/find/[state]/page.tsx - State hub pages
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | KnearMe',
    default: 'Find Contractors Near You | KnearMe',
  },
  description: 'Find trusted contractors in your area. Browse portfolios, read reviews, and connect with local professionals.',
};

export default function DirectoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
