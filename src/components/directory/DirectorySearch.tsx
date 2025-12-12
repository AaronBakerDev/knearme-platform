/**
 * DirectorySearch Component
 *
 * Client-side search component with debounced input and dropdown results.
 * Searches across business names and city names in real-time.
 *
 * Features:
 * - Debounced search (300ms) to reduce API calls
 * - Dropdown results grouped by Cities and Businesses
 * - Keyboard navigation support via Command component
 * - "View all results" option when pressing Enter
 * - Auto-closes on selection
 *
 * @see /src/app/api/directory/search/route.ts for API endpoint
 * @see /src/lib/data/directory.ts for data layer
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Building2, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import type { CityStats, DirectoryPlace } from '@/types/directory';

interface SearchResults {
  cities: CityStats[];
  businesses: DirectoryPlace[];
}

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export function DirectorySearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < MIN_QUERY_LENGTH) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/directory/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResults = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change with debouncing
  const handleInputChange = (value: string) => {
    setQuery(value);
    setShowResults(true);

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    if (value.length >= MIN_QUERY_LENGTH) {
      debounceTimer.current = setTimeout(() => {
        performSearch(value);
      }, DEBOUNCE_MS);
    } else {
      setResults(null);
      setIsLoading(false);
    }
  };

  // Handle city selection
  const handleCitySelect = (city: CityStats) => {
    router.push(`/find/${city.state_slug}/${city.city_slug}`);
    setShowResults(false);
    setQuery('');
  };

  // Handle business selection
  const handleBusinessSelect = (business: DirectoryPlace) => {
    router.push(`/find/${business.state_slug}/${business.city_slug}/${business.category_slug}`);
    setShowResults(false);
    setQuery('');
  };

  // Handle "View all results" or Enter key
  const handleViewAll = () => {
    if (query.length >= MIN_QUERY_LENGTH) {
      router.push(`/find?q=${encodeURIComponent(query)}`);
      setShowResults(false);
      setQuery('');
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleViewAll();
    } else if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const hasResults = results && (results.cities.length > 0 || results.businesses.length > 0);
  const showDropdown = showResults && query.length >= MIN_QUERY_LENGTH;

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Search Input - Full width on mobile with larger touch target */}
      <div className="relative">
        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search cities or businesses..."
          className="pl-10 sm:pl-12 h-12 sm:h-14 text-base sm:text-lg w-full"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowResults(true)}
        />
      </div>

      {/* Results Dropdown - Full width on mobile */}
      {showDropdown && (
        <div className="absolute top-full mt-2 w-full left-0 right-0 bg-background border rounded-lg shadow-lg z-50 max-h-[70vh] sm:max-h-[400px] overflow-hidden">
          <Command>
            <CommandList className="max-h-[65vh] sm:max-h-[370px]">
              {isLoading && (
                <div className="p-6 sm:p-4 text-sm text-muted-foreground text-center">
                  Searching...
                </div>
              )}

              {!isLoading && !hasResults && (
                <CommandEmpty className="py-6">No results found for &quot;{query}&quot;</CommandEmpty>
              )}

              {!isLoading && hasResults && (
                <>
                  {/* Cities Group */}
                  {results.cities.length > 0 && (
                    <CommandGroup heading="Cities">
                      {results.cities.map((city) => (
                        <CommandItem
                          key={`${city.state_slug}-${city.city_slug}`}
                          onSelect={() => handleCitySelect(city)}
                          className="cursor-pointer min-h-[52px] sm:min-h-0 py-3 sm:py-2"
                        >
                          <MapPin className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {city.city_name}, {city.state_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {city.business_count} {city.business_count === 1 ? 'business' : 'businesses'}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {/* Businesses Group */}
                  {results.businesses.length > 0 && (
                    <CommandGroup heading="Businesses">
                      {results.businesses.map((business) => (
                        <CommandItem
                          key={business.id}
                          onSelect={() => handleBusinessSelect(business)}
                          className="cursor-pointer min-h-[52px] sm:min-h-0 py-3 sm:py-2"
                        >
                          <Building2 className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{business.title}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {business.category} • {Array.isArray(business.city) ? business.city[0] : business.city}
                            </div>
                          </div>
                          {business.rating && (
                            <div className="text-xs text-muted-foreground ml-2 shrink-0">
                              ★ {business.rating.toFixed(1)}
                            </div>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {/* View All Results */}
                  <div className="border-t p-2">
                    <button
                      onClick={handleViewAll}
                      className="w-full flex items-center justify-center gap-2 py-3 sm:py-2 px-4 text-sm text-primary hover:bg-accent rounded-md transition-colors min-h-[48px] sm:min-h-0"
                    >
                      <span>Press Enter to see all results</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
