'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { Search, Star, MapPin, Briefcase, MessageSquare, X, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from 'use-debounce';

const MAX_OPTIONS_DISPLAY = 50;

/** Service option with count */
export interface ServiceOption {
  service: string;
  count: number;
}

interface ReviewsFiltersProps {
  locations: Array<{ value: string; label: string }>;
  categories: string[];
  searchTerms: string[];
  /** Detected services from AI analysis (for filtering) */
  services?: ServiceOption[];
}

export function ReviewsFilters({ locations, categories, searchTerms, services = [] }: ReviewsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch] = useDebounce(search, 300);

  const [locationSearch, setLocationSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [termSearch, setTermSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  const locationLabelMap = useMemo(
    () => new Map(locations.map((location) => [location.value, location.label])),
    [locations]
  );

  const filteredLocations = useMemo(() => {
    if (!locationSearch.trim()) return locations.slice(0, MAX_OPTIONS_DISPLAY);
    const searchLower = locationSearch.toLowerCase();
    return locations
      .filter((location) => location.label.toLowerCase().includes(searchLower))
      .slice(0, MAX_OPTIONS_DISPLAY);
  }, [locations, locationSearch]);

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories.slice(0, MAX_OPTIONS_DISPLAY);
    const searchLower = categorySearch.toLowerCase();
    return categories
      .filter((category) => category.toLowerCase().includes(searchLower))
      .slice(0, MAX_OPTIONS_DISPLAY);
  }, [categories, categorySearch]);

  const filteredSearchTerms = useMemo(() => {
    if (!termSearch.trim()) return searchTerms.slice(0, MAX_OPTIONS_DISPLAY);
    const searchLower = termSearch.toLowerCase();
    return searchTerms
      .filter((term) => term.toLowerCase().includes(searchLower))
      .slice(0, MAX_OPTIONS_DISPLAY);
  }, [searchTerms, termSearch]);

  const hasMoreLocations = useMemo(() => {
    if (!locationSearch.trim()) return locations.length > MAX_OPTIONS_DISPLAY;
    const searchLower = locationSearch.toLowerCase();
    return (
      locations.filter((location) => location.label.toLowerCase().includes(searchLower)).length >
      MAX_OPTIONS_DISPLAY
    );
  }, [locations, locationSearch]);

  const hasMoreCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories.length > MAX_OPTIONS_DISPLAY;
    const searchLower = categorySearch.toLowerCase();
    return categories.filter((category) => category.toLowerCase().includes(searchLower)).length > MAX_OPTIONS_DISPLAY;
  }, [categories, categorySearch]);

  const hasMoreSearchTerms = useMemo(() => {
    if (!termSearch.trim()) return searchTerms.length > MAX_OPTIONS_DISPLAY;
    const searchLower = termSearch.toLowerCase();
    return searchTerms.filter((term) => term.toLowerCase().includes(searchLower)).length > MAX_OPTIONS_DISPLAY;
  }, [searchTerms, termSearch]);

  const filteredServices = useMemo(() => {
    if (!serviceSearch.trim()) return services.slice(0, MAX_OPTIONS_DISPLAY);
    const searchLower = serviceSearch.toLowerCase();
    return services
      .filter((s) => s.service.toLowerCase().includes(searchLower))
      .slice(0, MAX_OPTIONS_DISPLAY);
  }, [services, serviceSearch]);

  const hasMoreServices = useMemo(() => {
    if (!serviceSearch.trim()) return services.length > MAX_OPTIONS_DISPLAY;
    const searchLower = serviceSearch.toLowerCase();
    return services.filter((s) => s.service.toLowerCase().includes(searchLower)).length > MAX_OPTIONS_DISPLAY;
  }, [services, serviceSearch]);

  const updateFilters = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page');

      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [searchParams, pathname, router]
  );

  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    if (debouncedSearch !== currentSearch) {
      updateFilters('search', debouncedSearch || null);
    }
  }, [debouncedSearch, updateFilters, searchParams]);

  const selectedLocation = searchParams.get('location') || 'all';
  const selectedCategory = searchParams.get('category') || 'all';
  const selectedSearchTerm = searchParams.get('searchTerm') || 'all';
  const selectedRating = searchParams.get('rating') || 'all';
  const selectedResponse = searchParams.get('hasResponse') || 'all';
  const selectedService = searchParams.get('service') || 'all';

  const hasFilters =
    search ||
    searchParams.get('location') ||
    searchParams.get('category') ||
    searchParams.get('searchTerm') ||
    searchParams.get('rating') ||
    searchParams.get('hasResponse') ||
    searchParams.get('service');

  return (
    <div className="w-full relative">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviews..."
            className="border-zinc-700/50 bg-zinc-800/50 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus-visible:border-amber-500/50 focus-visible:bg-zinc-800 h-9 rounded-lg"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
          <Select
            value={selectedLocation}
            onValueChange={(val) => {
              updateFilters('location', val === 'all' ? null : val);
              setLocationSearch('');
            }}
            onOpenChange={(open) => {
              if (!open) setLocationSearch('');
            }}
          >
            <SelectTrigger className="h-9 w-[190px] px-3 rounded-lg border-zinc-700/50 bg-zinc-800/50 text-sm text-zinc-300 hover:bg-zinc-700/50 transition-colors">
              <div className="flex items-center gap-2 truncate">
                <MapPin className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <span className="truncate font-mono text-xs">
                  {selectedLocation === 'all'
                    ? 'All Locations'
                    : locationLabelMap.get(selectedLocation) || selectedLocation}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700/50 max-h-[300px]">
              {locations.length > 10 && (
                <div className="px-2 pb-2 sticky top-0 bg-zinc-900 z-10">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      placeholder="Search locations..."
                      className="w-full h-8 pl-7 pr-2 rounded border border-zinc-700/50 bg-zinc-800/50 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              )}
              <SelectItem value="all">All Locations</SelectItem>
              {filteredLocations.map((location) => (
                <SelectItem key={location.value} value={location.value} className="font-mono text-xs">
                  {location.label}
                </SelectItem>
              ))}
              {hasMoreLocations && (
                <div className="px-2 py-1.5 text-[10px] text-zinc-500 font-mono border-t border-zinc-800/50 mt-1">
                  +{locations.length - MAX_OPTIONS_DISPLAY} more{locationSearch ? ' (refine search)' : '...'}
                </div>
              )}
              {filteredLocations.length === 0 && locationSearch && (
                <div className="px-2 py-3 text-xs text-zinc-500 text-center">
                  No locations match &quot;{locationSearch}&quot;
                </div>
              )}
            </SelectContent>
          </Select>

          <Select
            value={selectedCategory}
            onValueChange={(val) => {
              updateFilters('category', val === 'all' ? null : val);
              setCategorySearch('');
            }}
            onOpenChange={(open) => {
              if (!open) setCategorySearch('');
            }}
          >
            <SelectTrigger className="h-9 w-[180px] px-3 rounded-lg border-zinc-700/50 bg-zinc-800/50 text-sm text-zinc-300 hover:bg-zinc-700/50 transition-colors">
              <div className="flex items-center gap-2 truncate">
                <Briefcase className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <span className="truncate font-mono text-xs">
                  {selectedCategory === 'all' ? 'All Categories' : selectedCategory}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700/50 max-h-[300px]">
              {categories.length > 10 && (
                <div className="px-2 pb-2 sticky top-0 bg-zinc-900 z-10">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      placeholder="Search categories..."
                      className="w-full h-8 pl-7 pr-2 rounded border border-zinc-700/50 bg-zinc-800/50 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              )}
              <SelectItem value="all">All Categories</SelectItem>
              {filteredCategories.map((category) => (
                <SelectItem key={category} value={category} className="font-mono text-xs">
                  {category}
                </SelectItem>
              ))}
              {hasMoreCategories && (
                <div className="px-2 py-1.5 text-[10px] text-zinc-500 font-mono border-t border-zinc-800/50 mt-1">
                  +{categories.length - MAX_OPTIONS_DISPLAY} more{categorySearch ? ' (refine search)' : '...'}
                </div>
              )}
              {filteredCategories.length === 0 && categorySearch && (
                <div className="px-2 py-3 text-xs text-zinc-500 text-center">
                  No categories match &quot;{categorySearch}&quot;
                </div>
              )}
            </SelectContent>
          </Select>

          <Select
            value={selectedSearchTerm}
            onValueChange={(val) => {
              updateFilters('searchTerm', val === 'all' ? null : val);
              setTermSearch('');
            }}
            onOpenChange={(open) => {
              if (!open) setTermSearch('');
            }}
          >
            <SelectTrigger className="h-9 w-[190px] px-3 rounded-lg border-zinc-700/50 bg-zinc-800/50 text-sm text-zinc-300 hover:bg-zinc-700/50 transition-colors">
              <div className="flex items-center gap-2 truncate">
                <Search className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <span className="truncate font-mono text-xs">
                  {selectedSearchTerm === 'all' ? 'All Searches' : selectedSearchTerm}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700/50 max-h-[300px]">
              {searchTerms.length > 10 && (
                <div className="px-2 pb-2 sticky top-0 bg-zinc-900 z-10">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={termSearch}
                      onChange={(e) => setTermSearch(e.target.value)}
                      placeholder="Search terms..."
                      className="w-full h-8 pl-7 pr-2 rounded border border-zinc-700/50 bg-zinc-800/50 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              )}
              <SelectItem value="all">All Searches</SelectItem>
              {filteredSearchTerms.map((term) => (
                <SelectItem key={term} value={term} className="font-mono text-xs">
                  {term}
                </SelectItem>
              ))}
              {hasMoreSearchTerms && (
                <div className="px-2 py-1.5 text-[10px] text-zinc-500 font-mono border-t border-zinc-800/50 mt-1">
                  +{searchTerms.length - MAX_OPTIONS_DISPLAY} more{termSearch ? ' (refine search)' : '...'}
                </div>
              )}
              {filteredSearchTerms.length === 0 && termSearch && (
                <div className="px-2 py-3 text-xs text-zinc-500 text-center">
                  No search terms match &quot;{termSearch}&quot;
                </div>
              )}
            </SelectContent>
          </Select>

          {/* Service Filter (from AI analysis) */}
          {services.length > 0 && (
            <Select
              value={selectedService}
              onValueChange={(val) => {
                updateFilters('service', val === 'all' ? null : val);
                setServiceSearch('');
              }}
              onOpenChange={(open) => {
                if (!open) setServiceSearch('');
              }}
            >
              <SelectTrigger className="h-9 w-[180px] px-3 rounded-lg border-zinc-700/50 bg-zinc-800/50 text-sm text-zinc-300 hover:bg-zinc-700/50 transition-colors">
                <div className="flex items-center gap-2 truncate">
                  <Tag className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate font-mono text-xs">
                    {selectedService === 'all' ? 'All Services' : selectedService}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700/50 max-h-[300px]">
                {services.length > 10 && (
                  <div className="px-2 pb-2 sticky top-0 bg-zinc-900 z-10">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        placeholder="Search services..."
                        className="w-full h-8 pl-7 pr-2 rounded border border-zinc-700/50 bg-zinc-800/50 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/50"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                )}
                <SelectItem value="all">All Services</SelectItem>
                {filteredServices.map((s) => (
                  <SelectItem key={s.service} value={s.service} className="font-mono text-xs">
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="truncate">{s.service}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-zinc-800/50">
                        {s.count}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
                {hasMoreServices && (
                  <div className="px-2 py-1.5 text-[10px] text-zinc-500 font-mono border-t border-zinc-800/50 mt-1">
                    +{services.length - MAX_OPTIONS_DISPLAY} more{serviceSearch ? ' (refine search)' : '...'}
                  </div>
                )}
                {filteredServices.length === 0 && serviceSearch && (
                  <div className="px-2 py-3 text-xs text-zinc-500 text-center">
                    No services match &quot;{serviceSearch}&quot;
                  </div>
                )}
              </SelectContent>
            </Select>
          )}

          <Select
            value={selectedRating}
            onValueChange={(val) => updateFilters('rating', val === 'all' ? null : val)}
          >
            <SelectTrigger className="h-9 w-[130px] px-3 rounded-lg border-zinc-700/50 bg-zinc-800/50 text-sm text-zinc-300 hover:bg-zinc-700/50 transition-colors">
              <div className="flex items-center gap-2">
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
                <span className="font-mono text-xs">{selectedRating === 'all' ? 'All Ratings' : `${selectedRating}★`}</span>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700/50">
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={selectedResponse}
            onValueChange={(val) => updateFilters('hasResponse', val === 'all' ? null : val)}
          >
            <SelectTrigger className="h-9 w-[150px] px-3 rounded-lg border-zinc-700/50 bg-zinc-800/50 text-sm text-zinc-300 hover:bg-zinc-700/50 transition-colors">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <span className="font-mono text-xs">
                  {selectedResponse === 'all'
                    ? 'All Responses'
                    : selectedResponse === 'true'
                      ? 'Has Response'
                      : 'No Response'}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700/50">
              <SelectItem value="all">All Responses</SelectItem>
              <SelectItem value="true">Has Response</SelectItem>
              <SelectItem value="false">No Response</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <button
              onClick={() => router.replace(pathname)}
              className="h-9 px-3 text-xs font-mono text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-lg border border-zinc-700/50 transition-colors flex items-center gap-1.5"
              type="button"
            >
              <X className="h-3 w-3" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {isPending && (
        <div className="absolute top-0 right-0 p-2">
          <div className="h-1.5 w-1.5 animate-ping rounded-full bg-amber-400" />
        </div>
      )}
    </div>
  );
}
