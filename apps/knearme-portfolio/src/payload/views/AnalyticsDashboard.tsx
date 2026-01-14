/**
 * Analytics Dashboard View for Payload Admin
 *
 * Custom admin view that displays content analytics including:
 * - Total page views and unique sessions
 * - Views over time chart
 * - Top performing articles
 * - Device and country breakdown
 * - Date range filtering
 *
 * @see PAY-063 in PRD for acceptance criteria
 * @see https://payloadcms.com/docs/custom-components/custom-views
 */
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Gutter } from '@payloadcms/ui'

/**
 * Stats response type from API
 */
interface AnalyticsStats {
  totalViews: number
  uniqueSessions: number
  byDevice: Record<string, number>
  byCountry: Record<string, number>
  topArticles: Array<{ articleId: string; views: number; title?: string }>
  viewsByDay?: Array<{ date: string; views: number }>
}

/**
 * Date range options for filtering
 */
type DateRange = '7d' | '30d' | '90d' | 'all'

/**
 * Get date string for N days ago
 */
function getDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

/**
 * Format number with locale
 */
function formatNumber(num: number): string {
  return num.toLocaleString()
}

/**
 * Stat card component for displaying key metrics
 */
function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
}) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>{icon}</div>
      <div>
        <div style={styles.statValue}>{typeof value === 'number' ? formatNumber(value) : value}</div>
        <div style={styles.statLabel}>{label}</div>
      </div>
    </div>
  )
}

/**
 * Simple bar chart for views over time
 */
function ViewsChart({ data }: { data: Array<{ date: string; views: number }> }) {
  if (data.length === 0) {
    return <div style={styles.emptyChart}>No view data available</div>
  }

  const maxViews = Math.max(...data.map((d) => d.views), 1)

  return (
    <div style={styles.chart}>
      <div style={styles.chartBars}>
        {data.map((item, index) => (
          <div key={index} style={styles.chartBarContainer}>
            <div
              style={{
                ...styles.chartBar,
                height: `${(item.views / maxViews) * 100}%`,
              }}
              title={`${item.date}: ${item.views} views`}
            />
            <div style={styles.chartLabel}>
              {new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Top articles table
 */
function TopArticlesTable({
  articles,
}: {
  articles: Array<{ articleId: string; views: number; title?: string }>
}) {
  if (articles.length === 0) {
    return <div style={styles.emptyState}>No articles viewed yet</div>
  }

  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.tableHeader}>Article</th>
          <th style={{ ...styles.tableHeader, textAlign: 'right' }}>Views</th>
        </tr>
      </thead>
      <tbody>
        {articles.map((article, index) => (
          <tr key={article.articleId}>
            <td style={styles.tableCell}>
              <span style={styles.articleRank}>{index + 1}</span>
              <a
                href={`/blog/${article.articleId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.articleLink}
              >
                {article.title || article.articleId}
              </a>
            </td>
            <td style={{ ...styles.tableCell, textAlign: 'right' }}>
              {formatNumber(article.views)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/**
 * Device breakdown pie chart approximation (as bar chart)
 */
function DeviceBreakdown({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a)
  const total = entries.reduce((sum, [, count]) => sum + count, 0) || 1

  if (entries.length === 0) {
    return <div style={styles.emptyState}>No device data</div>
  }

  const deviceIcons: Record<string, string> = {
    desktop: '🖥️',
    mobile: '📱',
    tablet: '📲',
    unknown: '❓',
  }

  return (
    <div>
      {entries.map(([device, count]) => (
        <div key={device} style={styles.breakdownRow}>
          <span style={styles.breakdownIcon}>{deviceIcons[device] || '📊'}</span>
          <span style={styles.breakdownLabel}>{device}</span>
          <div style={styles.breakdownBarContainer}>
            <div
              style={{
                ...styles.breakdownBar,
                width: `${(count / total) * 100}%`,
              }}
            />
          </div>
          <span style={styles.breakdownValue}>
            {formatNumber(count)} ({Math.round((count / total) * 100)}%)
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * Country breakdown display
 */
function CountryBreakdown({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a).slice(0, 10)
  const total = entries.reduce((sum, [, count]) => sum + count, 0) || 1

  if (entries.length === 0) {
    return <div style={styles.emptyState}>No country data</div>
  }

  return (
    <div>
      {entries.map(([country, count]) => (
        <div key={country} style={styles.breakdownRow}>
          <span style={styles.breakdownLabel}>{country || 'Unknown'}</span>
          <div style={styles.breakdownBarContainer}>
            <div
              style={{
                ...styles.breakdownBar,
                width: `${(count / total) * 100}%`,
              }}
            />
          </div>
          <span style={styles.breakdownValue}>
            {formatNumber(count)} ({Math.round((count / total) * 100)}%)
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * Analytics Dashboard Component
 *
 * Main dashboard view that fetches and displays analytics data.
 * Uses internal API endpoint for server-side aggregation.
 */
export const AnalyticsDashboard: React.FC = () => {
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>('30d')

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Build query params based on date range
      const params = new URLSearchParams()
      if (dateRange !== 'all') {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
        params.set('startDate', getDaysAgo(days))
      }

      const response = await fetch(`/api/analytics/stats?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`)
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error('Analytics fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return (
    <Gutter>
      <div style={styles.header}>
        <h1 style={styles.title}>Content Analytics</h1>
        <div style={styles.controls}>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            style={styles.select}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <button onClick={fetchStats} disabled={loading} style={styles.refreshButton}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && !stats && (
        <div style={styles.loading}>Loading analytics data...</div>
      )}

      {stats && (
        <>
          {/* Key Metrics */}
          <div style={styles.statsGrid}>
            <StatCard
              label="Total Views"
              value={stats.totalViews}
              icon={<span style={{ fontSize: '1.5rem' }}>👁️</span>}
            />
            <StatCard
              label="Unique Sessions"
              value={stats.uniqueSessions}
              icon={<span style={{ fontSize: '1.5rem' }}>👤</span>}
            />
            <StatCard
              label="Top Articles"
              value={stats.topArticles.length}
              icon={<span style={{ fontSize: '1.5rem' }}>📄</span>}
            />
            <StatCard
              label="Countries"
              value={Object.keys(stats.byCountry).length}
              icon={<span style={{ fontSize: '1.5rem' }}>🌍</span>}
            />
          </div>

          {/* Views Over Time Chart */}
          {stats.viewsByDay && stats.viewsByDay.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Views Over Time</h2>
              <ViewsChart data={stats.viewsByDay} />
            </div>
          )}

          {/* Two-column layout for tables */}
          <div style={styles.twoColumn}>
            {/* Top Articles */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Top Articles</h2>
              <TopArticlesTable articles={stats.topArticles} />
            </div>

            {/* Breakdowns */}
            <div>
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>By Device</h2>
                <DeviceBreakdown data={stats.byDevice} />
              </div>

              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>By Country</h2>
                <CountryBreakdown data={stats.byCountry} />
              </div>
            </div>
          </div>
        </>
      )}
    </Gutter>
  )
}

/**
 * Inline styles for the dashboard
 * Using inline styles to avoid CSS module/Tailwind conflicts in Payload admin
 */
const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 600,
    margin: 0,
    color: '#1F2937',
  },
  controls: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  select: {
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    border: '1px solid #D1D5DB',
    backgroundColor: '#FFFFFF',
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
  refreshButton: {
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    border: 'none',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    fontSize: '0.875rem',
    cursor: 'pointer',
    fontWeight: 500,
  },
  error: {
    backgroundColor: '#FEE2E2',
    border: '1px solid #FECACA',
    borderRadius: '0.375rem',
    padding: '1rem',
    marginBottom: '1rem',
    color: '#991B1B',
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    color: '#6B7280',
    fontSize: '1rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '0.5rem',
    padding: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  statIcon: {
    width: '3rem',
    height: '3rem',
    borderRadius: '0.375rem',
    backgroundColor: '#F3F4F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1F2937',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#6B7280',
    marginTop: '0.25rem',
  },
  section: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '0.5rem',
    padding: '1.25rem',
    marginBottom: '1rem',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1F2937',
    margin: '0 0 1rem 0',
  },
  twoColumn: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    textAlign: 'left' as const,
    padding: '0.75rem 0.5rem',
    borderBottom: '2px solid #E5E7EB',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#6B7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  tableCell: {
    padding: '0.75rem 0.5rem',
    borderBottom: '1px solid #F3F4F6',
    fontSize: '0.875rem',
    color: '#1F2937',
  },
  articleRank: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.5rem',
    height: '1.5rem',
    borderRadius: '50%',
    backgroundColor: '#F3F4F6',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#6B7280',
    marginRight: '0.5rem',
  },
  articleLink: {
    color: '#3B82F6',
    textDecoration: 'none',
  },
  emptyState: {
    color: '#9CA3AF',
    textAlign: 'center' as const,
    padding: '1rem',
    fontSize: '0.875rem',
  },
  emptyChart: {
    color: '#9CA3AF',
    textAlign: 'center' as const,
    padding: '2rem',
    fontSize: '0.875rem',
    backgroundColor: '#F9FAFB',
    borderRadius: '0.375rem',
  },
  chart: {
    height: '200px',
    padding: '1rem 0',
  },
  chartBars: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '150px',
    gap: '4px',
  },
  chartBarContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    height: '100%',
  },
  chartBar: {
    width: '100%',
    maxWidth: '40px',
    backgroundColor: '#3B82F6',
    borderRadius: '4px 4px 0 0',
    minHeight: '4px',
    transition: 'height 0.3s ease',
  },
  chartLabel: {
    fontSize: '0.625rem',
    color: '#9CA3AF',
    marginTop: '0.5rem',
    textAlign: 'center' as const,
    whiteSpace: 'nowrap' as const,
  },
  breakdownRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0',
  },
  breakdownIcon: {
    fontSize: '1rem',
    width: '1.5rem',
    textAlign: 'center' as const,
  },
  breakdownLabel: {
    fontSize: '0.875rem',
    color: '#1F2937',
    width: '80px',
    textTransform: 'capitalize' as const,
  },
  breakdownBarContainer: {
    flex: 1,
    height: '0.5rem',
    backgroundColor: '#F3F4F6',
    borderRadius: '0.25rem',
    overflow: 'hidden',
  },
  breakdownBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: '0.25rem',
    transition: 'width 0.3s ease',
  },
  breakdownValue: {
    fontSize: '0.75rem',
    color: '#6B7280',
    width: '100px',
    textAlign: 'right' as const,
  },
}

export default AnalyticsDashboard
