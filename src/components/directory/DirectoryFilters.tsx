/**
 * DirectoryFilters Component
 *
 * Client-side filter controls for category listing pages.
 * Filters work via URL searchParams to maintain SEO-friendly URLs.
 *
 * Features:
 * - Rating filter (4+ stars, 3+ stars, All)
 * - Has website checkbox
 * - Has phone checkbox
 * - Preserves pagination when filtering
 * - Updates URL using Next.js router
 *
 * Used on: /find/[state]/[city]/[category] pages
 *
 * @see /src/app/(public)/find/[state]/[city]/[category]/page.tsx
 * @see /src/lib/data/directory.ts for getCategoryListings with filters
 */

'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState } from 'react';
import { Filter, Star, Globe, Phone, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function DirectoryFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  // Get current filter values from URL
  const currentMinRating = searchParams.get('minRating');
  const currentHasWebsite = searchParams.get('hasWebsite') === 'true';
  const currentHasPhone = searchParams.get('hasPhone') === 'true';

  /**
   * Update URL with new filter parameters.
   * Preserves existing params except page (reset to 1 on filter change).
   */
  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    // Apply updates
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Reset to page 1 when filters change
    params.delete('page');

    // Navigate to new URL
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl, { scroll: false });
  };

  /**
   * Handle rating filter change.
   */
  const handleRatingChange = (rating: string) => {
    updateFilters({ minRating: rating === 'all' ? null : rating });
  };

  /**
   * Handle checkbox filter change.
   */
  const handleCheckboxChange = (filterName: 'hasWebsite' | 'hasPhone', checked: boolean) => {
    updateFilters({ [filterName]: checked ? 'true' : null });
  };

  /**
   * Clear all filters.
   */
  const handleClearFilters = () => {
    router.push(pathname, { scroll: false });
  };

  const hasActiveFilters = currentMinRating || currentHasWebsite || currentHasPhone;

  // Filter content JSX (reused in both desktop and mobile views)
  const filterContent = (
    <div className="space-y-6">
      {/* Rating Filter */}
      <div>
        <Label className="text-sm font-medium mb-3 flex items-center gap-2">
          <Star className="h-4 w-4" />
          Minimum Rating
        </Label>
        <div className="flex gap-2">
          <Button
            variant={!currentMinRating ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleRatingChange('all')}
            className="flex-1 min-h-[44px] sm:min-h-0"
          >
            All
          </Button>
          <Button
            variant={currentMinRating === '3' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleRatingChange('3')}
            className="flex-1 min-h-[44px] sm:min-h-0"
          >
            3+ ★
          </Button>
          <Button
            variant={currentMinRating === '4' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleRatingChange('4')}
            className="flex-1 min-h-[44px] sm:min-h-0"
          >
            4+ ★
          </Button>
        </div>
      </div>

      {/* Contact Info Filters */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Contact Information</Label>

        {/* Has Website */}
        <div className="flex items-center space-x-2 min-h-[44px] sm:min-h-0">
          <Checkbox
            id="hasWebsite"
            checked={currentHasWebsite}
            onCheckedChange={(checked) =>
              handleCheckboxChange('hasWebsite', checked as boolean)
            }
            className="h-5 w-5"
          />
          <Label
            htmlFor="hasWebsite"
            className="text-sm font-normal cursor-pointer flex items-center gap-2"
          >
            <Globe className="h-4 w-4 text-muted-foreground" />
            Has website
          </Label>
        </div>

        {/* Has Phone */}
        <div className="flex items-center space-x-2 min-h-[44px] sm:min-h-0">
          <Checkbox
            id="hasPhone"
            checked={currentHasPhone}
            onCheckedChange={(checked) =>
              handleCheckboxChange('hasPhone', checked as boolean)
            }
            className="h-5 w-5"
          />
          <Label
            htmlFor="hasPhone"
            className="text-sm font-normal cursor-pointer flex items-center gap-2"
          >
            <Phone className="h-4 w-4 text-muted-foreground" />
            Has phone number
          </Label>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile: Sheet/Drawer */}
      <div className="md:hidden mb-6">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="w-full min-h-[48px] justify-between"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    {[currentMinRating, currentHasWebsite, currentHasPhone].filter(Boolean).length}
                  </span>
                )}
              </div>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh]">
            <SheetHeader>
              <div className="flex items-center justify-between">
                <SheetTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </SheetTitle>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleClearFilters();
                      setIsOpen(false);
                    }}
                    className="text-xs"
                  >
                    Clear All
                  </Button>
                )}
              </div>
              <SheetDescription>
                Filter businesses by rating and contact information
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 pb-6">
              {filterContent}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Card */}
      <Card className="hidden md:block mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Filters</CardTitle>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs"
              >
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filterContent}
        </CardContent>
      </Card>
    </>
  );
}
