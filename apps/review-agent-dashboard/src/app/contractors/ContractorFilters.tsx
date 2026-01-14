'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition, useMemo } from 'react';
import { Search, Star, Lightbulb, MapPin, MessageSquare, FileText, Briefcase, type LucideIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from '@/components/ui/select';
import { useDebounce } from 'use-debounce';

// Max options to display in dropdown (performance optimization)
const MAX_OPTIONS_DISPLAY = 50;

interface ContractorFiltersProps {
    locations: Array<{ value: string; label: string }>;
    categories: string[];
    searchTerms: string[];
}

/**
 * Contractor filters with Mission Control styling.
 * Uses zinc backgrounds and colored accents.
 */
export function ContractorFilters({ locations, categories, searchTerms }: ContractorFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    // Local state for immediate UI updates
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [debouncedSearch] = useDebounce(search, 300);

    // Dropdown search states
    const [locationSearch, setLocationSearch] = useState('');
    const [categorySearch, setCategorySearch] = useState('');
    const [termSearch, setTermSearch] = useState('');

    // Sync search with URL when URL changes explicitly (e.g. back button)
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSearch(searchParams.get('search') || '');
    }, [searchParams]);

    const locationLabelMap = useMemo(
        () => new Map(locations.map((location) => [location.value, location.label])),
        [locations]
    );

    const filteredLocations = useMemo(() => {
        if (!locationSearch.trim()) {
            return locations.slice(0, MAX_OPTIONS_DISPLAY);
        }
        const searchLower = locationSearch.toLowerCase();
        return locations
            .filter((location) => location.label.toLowerCase().includes(searchLower))
            .slice(0, MAX_OPTIONS_DISPLAY);
    }, [locations, locationSearch]);

    const hasMoreLocations = useMemo(() => {
        if (!locationSearch.trim()) {
            return locations.length > MAX_OPTIONS_DISPLAY;
        }
        const searchLower = locationSearch.toLowerCase();
        return locations.filter((location) => location.label.toLowerCase().includes(searchLower)).length > MAX_OPTIONS_DISPLAY;
    }, [locations, locationSearch]);

    const filteredCategories = useMemo(() => {
        if (!categorySearch.trim()) {
            return categories.slice(0, MAX_OPTIONS_DISPLAY);
        }
        const searchLower = categorySearch.toLowerCase();
        return categories
            .filter((category) => category.toLowerCase().includes(searchLower))
            .slice(0, MAX_OPTIONS_DISPLAY);
    }, [categories, categorySearch]);

    const hasMoreCategories = useMemo(() => {
        if (!categorySearch.trim()) {
            return categories.length > MAX_OPTIONS_DISPLAY;
        }
        const searchLower = categorySearch.toLowerCase();
        return categories.filter((category) => category.toLowerCase().includes(searchLower)).length > MAX_OPTIONS_DISPLAY;
    }, [categories, categorySearch]);

    const filteredSearchTerms = useMemo(() => {
        if (!termSearch.trim()) {
            return searchTerms.slice(0, MAX_OPTIONS_DISPLAY);
        }
        const searchLower = termSearch.toLowerCase();
        return searchTerms
            .filter((term) => term.toLowerCase().includes(searchLower))
            .slice(0, MAX_OPTIONS_DISPLAY);
    }, [searchTerms, termSearch]);

    const hasMoreSearchTerms = useMemo(() => {
        if (!termSearch.trim()) {
            return searchTerms.length > MAX_OPTIONS_DISPLAY;
        }
        const searchLower = termSearch.toLowerCase();
        return searchTerms.filter((term) => term.toLowerCase().includes(searchLower)).length > MAX_OPTIONS_DISPLAY;
    }, [searchTerms, termSearch]);

    // Handle URL updates
    const updateFilters = useCallback(
        (key: string, value: string | null) => {
            const params = new URLSearchParams(searchParams.toString());

            // Reset page when filtering
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

    // Effect for debounced search
    useEffect(() => {
        const currentSearch = searchParams.get('search') || '';
        if (debouncedSearch !== currentSearch) {
            updateFilters('search', debouncedSearch || null);
        }
    }, [debouncedSearch, updateFilters, searchParams]);

    const currentMinRating = searchParams.get('minRating');
    const selectedLocation = searchParams.get('location') || 'all';
    const selectedCategory = searchParams.get('category') || 'all';
    const selectedSearchTerm = searchParams.get('searchTerm') || 'all';

    // Pipeline status helper
    const toggleStatus = (key: string) => {
        const current = searchParams.get(key) === 'true';
        updateFilters(key, !current ? 'true' : null);
    };

    const hasFilters =
        search ||
        currentMinRating ||
        searchParams.get('location') ||
        searchParams.get('category') ||
        searchParams.get('searchTerm') ||
        searchParams.get('hasReviews') ||
        searchParams.get('hasAnalysis') ||
        searchParams.get('hasArticle');

    return (
        <div className="w-full relative">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search contractors..."
                        className="border-zinc-700/50 bg-zinc-800/50 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus-visible:border-cyan-500/50 focus-visible:bg-zinc-800 h-9 rounded-lg"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                    {/* Location Filter (with search for large lists) */}
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
                        <SelectTrigger className="h-9 w-[180px] px-3 rounded-lg border-zinc-700/50 bg-zinc-800/50 text-sm text-zinc-300 hover:bg-zinc-700/50 transition-colors">
                            <div className="flex items-center gap-2 truncate">
                                <MapPin className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                                <span className="truncate font-mono text-xs">
                                    {selectedLocation === 'all'
                                        ? 'All Locations'
                                        : (locationLabelMap.get(selectedLocation) || selectedLocation)}
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
                                            className="w-full h-8 pl-7 pr-2 rounded border border-zinc-700/50 bg-zinc-800/50 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/50"
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

                    {/* Category Filter */}
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
                        <SelectTrigger className="h-9 w-[170px] px-3 rounded-lg border-zinc-700/50 bg-zinc-800/50 text-sm text-zinc-300 hover:bg-zinc-700/50 transition-colors">
                            <div className="flex items-center gap-2 truncate">
                                <Briefcase className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                                <span className="truncate font-mono text-xs">{selectedCategory === 'all' ? 'All Categories' : selectedCategory}</span>
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
                                            className="w-full h-8 pl-7 pr-2 rounded border border-zinc-700/50 bg-zinc-800/50 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/50"
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

                    {/* Search Term Filter */}
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
                        <SelectTrigger className="h-9 w-[180px] px-3 rounded-lg border-zinc-700/50 bg-zinc-800/50 text-sm text-zinc-300 hover:bg-zinc-700/50 transition-colors">
                            <div className="flex items-center gap-2 truncate">
                                <Search className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                                <span className="truncate font-mono text-xs">{selectedSearchTerm === 'all' ? 'All Searches' : selectedSearchTerm}</span>
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
                                            className="w-full h-8 pl-7 pr-2 rounded border border-zinc-700/50 bg-zinc-800/50 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/50"
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

                    {/* Rating Filter */}
                    <Select
                        value={currentMinRating || 'all'}
                        onValueChange={(val) => updateFilters('minRating', val === 'all' ? null : val)}
                    >
                        <SelectTrigger className="h-9 w-[120px] px-3 rounded-lg border-zinc-700/50 bg-zinc-800/50 text-sm text-zinc-300 hover:bg-zinc-700/50 transition-colors">
                            <div className="flex items-center gap-2">
                                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
                                <span className="font-mono text-xs">{currentMinRating ? `${currentMinRating}+` : 'Rating'}</span>
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700/50">
                            <SelectItem value="all">Any Rating</SelectItem>
                            <SelectItem value="4.5">4.5+ Stars</SelectItem>
                            <SelectItem value="4.0">4.0+ Stars</SelectItem>
                            <SelectItem value="3.5">3.5+ Stars</SelectItem>
                            <SelectItem value="3.0">3.0+ Stars</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Separator */}
                    <div className="h-5 w-px bg-zinc-700/50 hidden lg:block" />

                    {/* Pipeline Status Toggles */}
                    <div className="flex h-9 items-center gap-1 rounded-lg bg-zinc-800/50 p-1 border border-zinc-700/50">
                        <StatusToggle
                            active={searchParams.get('hasReviews') === 'true'}
                            onClick={() => toggleStatus('hasReviews')}
                            icon={MessageSquare}
                            label="Data"
                        />
                        <StatusToggle
                            active={searchParams.get('hasAnalysis') === 'true'}
                            onClick={() => toggleStatus('hasAnalysis')}
                            icon={Lightbulb}
                            label="AI"
                        />
                        <StatusToggle
                            active={searchParams.get('hasArticle') === 'true'}
                            onClick={() => toggleStatus('hasArticle')}
                            icon={FileText}
                            label="Pub"
                        />
                    </div>

                    {/* Clear Filters */}
                    {hasFilters && (
                        <button
                            onClick={() => router.replace(pathname)}
                            className="h-9 px-3 text-xs font-mono text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-lg border border-zinc-700/50 transition-colors flex items-center gap-1.5"
                        >
                            <X className="h-3 w-3" />
                            <span className="hidden sm:inline">Clear</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Loading indicator */}
            {isPending && (
                <div className="absolute top-0 right-0 p-2">
                    <div className="h-1.5 w-1.5 animate-ping rounded-full bg-cyan-400" />
                </div>
            )}
        </div>
    );
}

function StatusToggle({
    active,
    onClick,
    icon: Icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: LucideIcon;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex h-full items-center gap-1.5 rounded-md px-2.5 text-xs font-mono transition-all ${
                active
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-zinc-500 hover:bg-zinc-700/50 hover:text-zinc-300 border border-transparent'
            }`}
            title={`Filter by ${label}`}
        >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}
