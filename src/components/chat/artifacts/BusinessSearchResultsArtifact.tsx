'use client';

/**
 * Business search results artifact for onboarding.
 *
 * Renders the "Is this you?" cards inside the unified chat UI.
 */

import { useCallback, type KeyboardEvent } from 'react';
import { Star, MapPin, Phone, Building2, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DiscoveredBusiness } from '@/lib/tools/business-discovery';
import type { BusinessSearchResultsData } from '@/types/artifacts';

interface BusinessSearchResultsArtifactProps {
  data: BusinessSearchResultsData;
  onAction?: (action: { type: string; payload?: unknown }) => void;
  className?: string;
}

function BusinessCard({
  business,
  onSelect,
  index,
}: {
  business: DiscoveredBusiness;
  onSelect: () => void;
  index: number;
}) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect();
      }
    },
    [onSelect]
  );

  return (
    <Card
      className={cn(
        'group',
        'cursor-pointer transition-all duration-200 ease-out',
        'hover:border-primary/50 hover:bg-muted/30 hover:scale-[1.01] hover:shadow-md',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'animate-fade-in'
      )}
      style={{ animationDelay: `${index * 0.1}s` }}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Select ${business.name}${business.address ? ` at ${business.address}` : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{business.name}</h4>

            {business.address && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{business.address}</span>
              </p>
            )}

            {business.phone && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Phone className="h-3 w-3 flex-shrink-0" />
                <span>{business.phone}</span>
              </p>
            )}

            {business.rating && (
              <div className="flex items-center gap-1 mt-1.5">
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                <span className="text-xs font-medium">{business.rating.toFixed(1)}</span>
                {business.reviewCount && (
                  <span className="text-xs text-muted-foreground">
                    ({business.reviewCount} reviews)
                  </span>
                )}
              </div>
            )}

            {business.category && (
              <span className="inline-block text-xs bg-muted px-2 py-0.5 rounded-full mt-1.5">
                {business.category}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-primary text-xs font-medium bg-primary/10 px-2.5 py-1 rounded-full transition-colors group-hover:bg-primary/20">
            <Check className="h-3 w-3" />
            <span>That&apos;s us</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function BusinessSearchResultsArtifact({
  data,
  onAction,
  className,
}: BusinessSearchResultsArtifactProps) {
  if (!data?.results?.length) return null;

  return (
    <div className={cn('space-y-3 animate-fade-in', className)}>
      <p className="text-sm text-muted-foreground text-center">
        {data.prompt ?? 'Which one is yours?'}
      </p>

      {data.results.map((business, idx) => (
        <BusinessCard
          key={business.googlePlaceId || `${business.name}-${idx}`}
          business={business}
          index={idx}
          onSelect={() => onAction?.({ type: 'selectBusiness', payload: business })}
        />
      ))}

      <Button
        variant="ghost"
        className="w-full text-muted-foreground hover:text-foreground"
        onClick={() => onAction?.({ type: 'noneOfThese' })}
      >
        None of these are my business
      </Button>
    </div>
  );
}
