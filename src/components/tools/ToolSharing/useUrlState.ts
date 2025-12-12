'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useState, useCallback, useEffect, useRef } from 'react'

type SerializableValue = string | number | boolean | null
type ToolState = Record<string, SerializableValue>

interface UseUrlStateOptions {
  debounceMs?: number
}

/**
 * Hook that syncs tool form state with URL query parameters for shareable links.
 *
 * @param defaultState - Initial state with type information (used for parsing URL params)
 * @param options - Configuration options (debounce, etc.)
 * @returns State management object with shareable URL getter
 *
 * @example
 * ```tsx
 * const { state, setState, getShareableUrl, hasUrlParams } = useUrlState({
 *   length: 10,
 *   width: 5,
 *   height: 8,
 *   includeWaste: true
 * }, { debounceMs: 500 })
 *
 * // Update state (syncs to URL)
 * setState({ length: 12 })
 *
 * // Get full shareable URL
 * const url = getShareableUrl()
 * ```
 */
export function useUrlState<T extends ToolState>(
  defaultState: T,
  options?: UseUrlStateOptions
): {
  state: T
  setState: (newState: Partial<T> | ((prev: T) => T)) => void
  getShareableUrl: () => string
  hasUrlParams: boolean
} {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { debounceMs = 300 } = options || {}

  // Initialize state from URL params if present, otherwise use defaults
  const initializeState = useCallback((): T => {
    const state = { ...defaultState }
    let hasParams = false

    for (const key in defaultState) {
      const urlValue = searchParams.get(key)
      if (urlValue !== null) {
        hasParams = true
        const defaultValue = defaultState[key]

        // Parse based on default value type
        if (typeof defaultValue === 'number') {
          const parsed = Number(urlValue)
          if (!isNaN(parsed)) {
            state[key] = parsed as T[Extract<keyof T, string>]
          }
        } else if (typeof defaultValue === 'boolean') {
          state[key] = (urlValue === 'true') as T[Extract<keyof T, string>]
        } else {
          state[key] = urlValue as T[Extract<keyof T, string>]
        }
      }
    }

    return state
  }, [defaultState, searchParams])

  const [state, setStateInternal] = useState<T>(initializeState)
  const [hasUrlParams] = useState(() => {
    return Array.from(searchParams.keys()).some(key => key in defaultState)
  })

  // Debounce timer ref
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Update URL when state changes
  const updateUrl = useCallback((newState: T) => {
    const params = new URLSearchParams()

    // Only include values that differ from defaults (shorter URLs)
    for (const key in newState) {
      const value = newState[key]
      const defaultValue = defaultState[key]

      if (value !== defaultValue && value !== null && value !== undefined) {
        params.set(key, String(value))
      }
    }

    const queryString = params.toString()
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname

    router.replace(newUrl, { scroll: false })
  }, [defaultState, pathname, router])

  // Debounced state setter
  const setState = useCallback((newState: Partial<T> | ((prev: T) => T)) => {
    setStateInternal(prev => {
      const updated = typeof newState === 'function' ? newState(prev) : { ...prev, ...newState }

      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Debounce URL update
      debounceTimerRef.current = setTimeout(() => {
        updateUrl(updated)
      }, debounceMs)

      return updated
    })
  }, [debounceMs, updateUrl])

  // Get full shareable URL with all current state
  const getShareableUrl = useCallback((): string => {
    const params = new URLSearchParams()

    // Include all non-null values in shareable URL
    for (const key in state) {
      const value = state[key]
      if (value !== null && value !== undefined) {
        params.set(key, String(value))
      }
    }

    const queryString = params.toString()
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const fullPath = queryString ? `${pathname}?${queryString}` : pathname

    return `${baseUrl}${fullPath}`
  }, [state, pathname])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    state,
    setState,
    getShareableUrl,
    hasUrlParams
  }
}
