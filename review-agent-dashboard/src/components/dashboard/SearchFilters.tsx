'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { MapPin, Building2, X, Search } from 'lucide-react'

/**
 * SearchFilters - Client component for filtering search history
 *
 * Uses URL params for state management (SSR-friendly).
 * Provides state dropdown and city search input with debounce.
 */
interface SearchFiltersProps {
  states: string[]
  cities: string[]
  currentState?: string
  currentCity?: string
}

export function SearchFilters({
  states,
  cities,
  currentState,
  currentCity,
}: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [citySearch, setCitySearch] = useState(currentCity || '')

  // Build URL with new filter params
  const buildUrl = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString())

      // Reset page when filters change
      params.delete('page')

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === 'all') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })

      const queryString = params.toString()
      return queryString ? `/searches?${queryString}` : '/searches'
    },
    [searchParams]
  )

  const handleStateChange = (value: string) => {
    router.push(buildUrl({ state: value === 'all' ? undefined : value }))
  }

  const handleCityChange = (value: string) => {
    setCitySearch(value)
    if (value === 'all' || value === '') {
      router.push(buildUrl({ city: undefined }))
    } else {
      router.push(buildUrl({ city: value }))
    }
  }

  const handleClearFilters = () => {
    setCitySearch('')
    router.push('/searches')
  }

  const hasFilters = currentState || currentCity

  // Filter cities based on search input
  const filteredCities = cities.filter((city) =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  )

  return (
    <div className="flex flex-wrap items-end gap-4">
      {/* State Filter */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-emerald-400/80 uppercase tracking-wider">
          <Building2 className="h-3 w-3" />
          State
        </label>
        <Select value={currentState || 'all'} onValueChange={handleStateChange}>
          <SelectTrigger className="w-[180px] bg-zinc-900/50 border-zinc-700/50 text-zinc-100 font-mono text-sm">
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="all" className="font-mono text-sm">
              All States
            </SelectItem>
            {states.map((state) => (
              <SelectItem
                key={state}
                value={state}
                className="font-mono text-sm"
              >
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City Filter */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-emerald-400/80 uppercase tracking-wider">
          <MapPin className="h-3 w-3" />
          City
        </label>
        <Select value={currentCity || 'all'} onValueChange={handleCityChange}>
          <SelectTrigger className="w-[200px] bg-zinc-900/50 border-zinc-700/50 text-zinc-100 font-mono text-sm">
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700 max-h-[300px]">
            <div className="px-2 py-1.5 sticky top-0 bg-zinc-900 border-b border-zinc-700/50">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                <Input
                  placeholder="Search cities..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="h-7 pl-7 bg-zinc-800/50 border-zinc-600 text-xs font-mono"
                />
              </div>
            </div>
            <SelectItem value="all" className="font-mono text-sm">
              All Cities
            </SelectItem>
            {filteredCities.slice(0, 50).map((city) => (
              <SelectItem key={city} value={city} className="font-mono text-sm">
                {city}
              </SelectItem>
            ))}
            {filteredCities.length > 50 && (
              <div className="px-2 py-1.5 text-xs text-zinc-500 font-mono">
                +{filteredCities.length - 50} more...
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {hasFilters && (
        <button
          onClick={handleClearFilters}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 rounded-md transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      )}
    </div>
  )
}
