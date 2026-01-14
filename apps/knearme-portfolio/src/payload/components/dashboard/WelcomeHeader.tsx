/**
 * WelcomeHeader Component for Payload Admin Dashboard
 *
 * Server component that displays a welcome message and key metrics
 * at the top of the admin dashboard. Fetches real-time data from
 * Payload collections.
 *
 * Registered as a beforeDashboard component in payload.config.ts
 *
 * @see https://payloadcms.com/docs/custom-components/root-components
 */
import React from 'react'
import type { AdminViewServerProps } from 'payload'
import { StatCard } from './StatCard.tsx'

/**
 * Icons as inline SVG components for consistency
 * Using simple, professional icons that match Payload's aesthetic
 */
const FileTextIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
)

const ImageIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
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

const InboxIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
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

const ActivityIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
  </svg>
)

/**
 * Styles for the welcome header section
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    marginBottom: '2rem',
  },
  header: {
    marginBottom: '1.5rem',
  },
  greeting: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: 'var(--theme-elevation-1000)',
    margin: '0 0 0.25rem 0',
  },
  subheading: {
    fontSize: '0.9375rem',
    color: 'var(--theme-elevation-600)',
    margin: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
}

/**
 * Get time-based greeting
 */
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/**
 * WelcomeHeader - Server Component
 *
 * Displays welcome message and key metrics from Payload collections.
 * This component receives the Payload instance via props and can
 * perform server-side data fetching.
 *
 * Note: Type assertions are used because Payload's generated types don't always
 * include all collections. This is a known issue with Payload's type generation.
 */
export const WelcomeHeader: React.FC<AdminViewServerProps> = async ({ payload, user }) => {
  // Fetch counts from various collections
  let articlesCount = 0
  let publishedCount = 0
  let mediaCount = 0
  let submissionsCount = 0

  try {
    // Get articles count with published breakdown
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const articles = await (payload as any).count({
      collection: 'articles',
    })
    articlesCount = articles.totalDocs

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const published = await (payload as any).count({
      collection: 'articles',
      where: {
        status: { equals: 'published' },
      },
    })
    publishedCount = published.totalDocs

    // Get media count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const media = await (payload as any).count({
      collection: 'media',
    })
    mediaCount = media.totalDocs

    // Get form submissions count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const submissions = await (payload as any).count({
      collection: 'form-submissions',
    })
    submissionsCount = submissions.totalDocs
  } catch (error) {
    // Silently handle errors - stats will show 0
    console.error('[WelcomeHeader] Error fetching stats:', error)
  }

  const userName = user?.name || user?.email?.split('@')[0] || 'there'
  const draftCount = articlesCount - publishedCount

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.greeting}>
          {getGreeting()}, {userName}
        </h1>
        <p style={styles.subheading}>
          Here&apos;s what&apos;s happening with your content today.
        </p>
      </div>

      <div style={styles.statsGrid}>
        <StatCard
          label="Total Articles"
          value={articlesCount}
          icon={<FileTextIcon />}
          subtitle={`${publishedCount} published, ${draftCount} drafts`}
          href="/admin/collections/articles"
          variant="info"
        />
        <StatCard
          label="Media Files"
          value={mediaCount}
          icon={<ImageIcon />}
          subtitle="Images and uploads"
          href="/admin/collections/media"
        />
        <StatCard
          label="Form Submissions"
          value={submissionsCount}
          icon={<InboxIcon />}
          subtitle="Contact form responses"
          href="/admin/collections/form-submissions"
          variant={submissionsCount > 0 ? 'success' : 'default'}
        />
        <StatCard
          label="Draft Articles"
          value={draftCount}
          icon={<ActivityIcon />}
          subtitle="Ready to publish"
          href="/admin/collections/articles?where[status][equals]=draft"
          variant={draftCount > 0 ? 'warning' : 'default'}
        />
      </div>
    </div>
  )
}

export default WelcomeHeader
