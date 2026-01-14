'use client'

/**
 * Blog Search Component
 *
 * Client-side search input for the blog listing page.
 * Uses URL-based state for SEO and shareability.
 * Debounces input to avoid excessive navigation.
 *
 * @see PAY-054 in PRD for acceptance criteria
 */
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { Search, X } from 'lucide-react'

interface BlogSearchProps {
  /** Placeholder text for the search input */
  placeholder?: string
}

/**
 * BlogSearch - Debounced search input that updates URL query params
 *
 * Features:
 * - 500ms debounce to avoid excessive navigation
 * - URL-based state for SEO and shareability
 * - Clear button when search is active
 * - Loading state during navigation
 * - Preserves other query params (tag filter)
 */
export function BlogSearch({ placeholder = 'Search articles...' }: BlogSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Get initial search value from URL
  const initialSearch = searchParams.get('search') || ''
  const [searchValue, setSearchValue] = useState(initialSearch)

  // Debounce search and update URL
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only update if value has changed from URL
      if (searchValue !== initialSearch) {
        startTransition(() => {
          const params = new URLSearchParams(searchParams.toString())

          if (searchValue) {
            params.set('search', searchValue)
            // Reset to page 1 when searching
            params.delete('page')
          } else {
            params.delete('search')
          }

          const queryString = params.toString()
          router.push(queryString ? `/blog?${queryString}` : '/blog')
        })
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timer)
  }, [searchValue, initialSearch, searchParams, router])

  // Handle clear button click
  const handleClear = useCallback(() => {
    setSearchValue('')
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('search')
      params.delete('page')
      const queryString = params.toString()
      router.push(queryString ? `/blog?${queryString}` : '/blog')
    })
  }, [searchParams, router])

  return (
    <div className="relative w-full max-w-md">
      {/* Search Icon */}
      <Search
        className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${
          isPending ? 'text-blue-500 animate-pulse' : 'text-gray-400'
        }`}
        aria-hidden="true"
      />

      {/* Search Input */}
      <input
        type="search"
        name="search"
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                   placeholder:text-gray-400 transition-shadow"
        aria-label="Search articles"
      />

      {/* Clear Button */}
      {searchValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full
                     text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
