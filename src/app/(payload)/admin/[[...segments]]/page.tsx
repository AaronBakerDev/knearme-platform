/**
 * Payload CMS Admin Panel Page
 *
 * This catch-all route renders the Payload admin interface.
 * Uses [[...segments]] to match all admin sub-routes:
 * - /admin           → Dashboard
 * - /admin/faqs      → FAQs collection
 * - /admin/faqs/123  → Edit FAQ 123
 *
 * @see PAY-003 in PRD for acceptance criteria
 * @see https://payloadcms.com/docs/admin/overview
 */
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import type { Metadata } from 'next'
import type { ImportMap } from 'payload'

import config from '@payload-config'

// Import map is generated at build time by Payload
// For MVP, we use an empty map - full integration happens during build
const importMap: ImportMap = {}

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

/**
 * Generate metadata for admin pages
 */
export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

/**
 * Admin panel page component
 */
const Page = ({ params, searchParams }: Args) =>
  RootPage({ config, importMap, params, searchParams })

export default Page
