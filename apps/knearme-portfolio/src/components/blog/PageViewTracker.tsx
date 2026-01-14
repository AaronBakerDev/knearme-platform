'use client'

/**
 * PageViewTracker - Privacy-Friendly Article View Tracking
 *
 * Client component that tracks article page views while respecting
 * user privacy preferences (DNT header).
 *
 * Privacy principles:
 * - Checks navigator.doNotTrack before sending any data
 * - Only sends: articleId, timestamp, referrer, anonymous session
 * - No PII, no cookies, no fingerprinting
 * - Uses sessionStorage for session deduplication (not tracking)
 *
 * @see PAY-064 in PRD for acceptance criteria
 */

import { useEffect, useRef } from 'react'

interface PageViewTrackerProps {
  /** Article slug or ID to track */
  articleId: string
}

/**
 * Generate anonymous session ID for deduplication
 * This is NOT tracking - it just prevents counting refreshes as new views
 * Rotates daily and is not tied to any user identifier
 */
function getAnonymousSessionId(): string {
  const key = 'pv_session'
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  try {
    const stored = sessionStorage.getItem(key)
    if (stored) {
      const { date, id } = JSON.parse(stored)
      if (date === today) {
        return id
      }
    }

    // Generate new session ID for today
    const newId = crypto.randomUUID()
    sessionStorage.setItem(key, JSON.stringify({ date: today, id: newId }))
    return newId
  } catch {
    // sessionStorage not available (e.g., incognito)
    return crypto.randomUUID()
  }
}

/**
 * Check if Do Not Track is enabled
 * Returns true if user has requested not to be tracked
 */
function isDoNotTrackEnabled(): boolean {
  if (typeof navigator === 'undefined') return true

  // Check navigator.doNotTrack (standard)
  if (navigator.doNotTrack === '1') return true

  // Check window.doNotTrack (legacy)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).doNotTrack === '1') return true

  // Check navigator.msDoNotTrack (IE)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((navigator as any).msDoNotTrack === '1') return true

  return false
}

/**
 * PageViewTracker Component
 *
 * Renders nothing - purely for side effects (tracking).
 * Tracks a view once per session per article.
 */
export function PageViewTracker({ articleId }: PageViewTrackerProps) {
  // Track if we've already sent a view for this article this session
  const tracked = useRef(false)

  useEffect(() => {
    // Don't track if already tracked this session
    if (tracked.current) return

    // Respect Do Not Track preference
    if (isDoNotTrackEnabled()) {
      console.debug('[PageViewTracker] DNT enabled, skipping tracking')
      return
    }

    // Prevent duplicate tracking
    tracked.current = true

    // Get session ID for deduplication
    const sessionId = getAnonymousSessionId()

    // Check if we've already tracked this article this session
    const viewedKey = `pv_viewed_${articleId}`
    try {
      if (sessionStorage.getItem(viewedKey)) {
        console.debug('[PageViewTracker] Already tracked this article this session')
        return
      }
      sessionStorage.setItem(viewedKey, '1')
    } catch {
      // sessionStorage not available, track anyway (but may double-count)
    }

    // Send tracking beacon
    // Using fetch with keepalive for reliability on page navigation
    fetch('/api/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        articleId,
        timestamp: new Date().toISOString(),
        source: document.referrer || null,
        sessionId,
      }),
      // keepalive ensures request completes even if user navigates away
      keepalive: true,
    }).catch((error) => {
      // Silently fail - tracking should never break the user experience
      console.debug('[PageViewTracker] Failed to track view:', error)
    })
  }, [articleId])

  // This component renders nothing
  return null
}

export default PageViewTracker
