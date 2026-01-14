/**
 * RecentActivity Component for Payload Admin Dashboard
 *
 * Server component that displays a feed of recently updated content
 * across multiple collections. Shows recent articles, media, and
 * form submissions.
 *
 * Registered as an afterDashboard component in payload.config.ts
 *
 * @see https://payloadcms.com/docs/custom-components/root-components
 */
import React from 'react'
import type { AdminViewServerProps } from 'payload'

/**
 * Clock icon for timestamps
 */
const ClockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </svg>
)

/**
 * File icon for articles
 */
const FileIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14,2 14,8 20,8" />
  </svg>
)

/**
 * Image icon for media
 */
const ImageIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21,15 16,10 5,21" />
  </svg>
)

/**
 * Inbox icon for submissions
 */
const InboxIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22,12 16,12 14,15 10,15 8,12 2,12" />
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
)

/**
 * Styles for the recent activity section
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    marginTop: '2rem',
    backgroundColor: 'var(--theme-elevation-50)',
    borderRadius: 'var(--style-radius-m)',
    border: '1px solid var(--theme-elevation-150)',
    overflow: 'hidden',
  },
  header: {
    padding: '1rem 1.25rem',
    borderBottom: '1px solid var(--theme-elevation-150)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: '0.9375rem',
    fontWeight: 600,
    color: 'var(--theme-elevation-900)',
    margin: 0,
  },
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.875rem 1.25rem',
    borderBottom: '1px solid var(--theme-elevation-100)',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'background-color 0.15s ease',
  },
  itemLast: {
    borderBottom: 'none',
  },
  iconWrapper: {
    width: '2rem',
    height: '2rem',
    borderRadius: 'var(--style-radius-s)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--theme-elevation-150)',
    color: 'var(--theme-elevation-700)',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--theme-elevation-900)',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.25rem',
  },
  collection: {
    fontSize: '0.75rem',
    color: 'var(--theme-elevation-500)',
    textTransform: 'capitalize',
  },
  timestamp: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.75rem',
    color: 'var(--theme-elevation-500)',
  },
  emptyState: {
    padding: '2rem 1.25rem',
    textAlign: 'center',
    color: 'var(--theme-elevation-500)',
    fontSize: '0.875rem',
  },
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Activity item type
 */
interface ActivityItem {
  id: string
  title: string
  collection: string
  href: string
  updatedAt: string
  icon: React.ReactNode
}

/**
 * RecentActivity - Server Component
 *
 * Fetches and displays recently updated content from Payload.
 *
 * Note: Type assertions are used because Payload's generated types don't always
 * include all collections. This is a known issue with Payload's type generation.
 */
export const RecentActivity: React.FC<AdminViewServerProps> = async ({ payload }) => {
  const activities: ActivityItem[] = []

  try {
    // Fetch recent articles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const articles = await (payload as any).find({
      collection: 'articles',
      limit: 3,
      sort: '-updatedAt',
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    articles.docs.forEach((doc: any) => {
      activities.push({
        id: `article-${doc.id}`,
        title: doc.title || 'Untitled Article',
        collection: 'Article',
        href: `/admin/collections/articles/${doc.id}`,
        updatedAt: doc.updatedAt,
        icon: <FileIcon />,
      })
    })

    // Fetch recent media
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const media = await (payload as any).find({
      collection: 'media',
      limit: 2,
      sort: '-updatedAt',
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    media.docs.forEach((doc: any) => {
      activities.push({
        id: `media-${doc.id}`,
        title: doc.alt || doc.filename || 'Untitled Media',
        collection: 'Media',
        href: `/admin/collections/media/${doc.id}`,
        updatedAt: doc.updatedAt,
        icon: <ImageIcon />,
      })
    })

    // Fetch recent form submissions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const submissions = await (payload as any).find({
      collection: 'form-submissions',
      limit: 2,
      sort: '-createdAt',
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    submissions.docs.forEach((doc: any) => {
      const submissionData = doc.submissionData as Record<string, unknown>
      const name = submissionData?.name || submissionData?.email || 'New Submission'
      activities.push({
        id: `submission-${doc.id}`,
        title: String(name),
        collection: 'Form Submission',
        href: `/admin/collections/form-submissions/${doc.id}`,
        updatedAt: doc.createdAt,
        icon: <InboxIcon />,
      })
    })
  } catch (error) {
    console.error('[RecentActivity] Error fetching activity:', error)
  }

  // Sort by updatedAt and take top 5
  const sortedActivities = activities
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Recent Activity</h2>
      </div>

      {sortedActivities.length === 0 ? (
        <div style={styles.emptyState}>No recent activity to display</div>
      ) : (
        <ul style={styles.list}>
          {sortedActivities.map((activity, index) => (
            <li key={activity.id}>
              <a
                href={activity.href}
                style={{
                  ...styles.item,
                  ...(index === sortedActivities.length - 1 ? styles.itemLast : {}),
                }}
              >
                <div style={styles.iconWrapper}>{activity.icon}</div>
                <div style={styles.content}>
                  <p style={styles.itemTitle}>{activity.title}</p>
                  <div style={styles.meta}>
                    <span style={styles.collection}>{activity.collection}</span>
                    <span style={styles.timestamp}>
                      <ClockIcon />
                      {formatRelativeTime(activity.updatedAt)}
                    </span>
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default RecentActivity
