/**
 * Puck Visual Editor Page
 *
 * Renders the Puck drag-and-drop editor for visual page building.
 * Authentication is handled server-side before rendering the client component.
 *
 * Route: /admin/puck/[slug]
 * - /admin/puck/about → Edit page with slug "about"
 * - /admin/puck/pricing → Edit page with slug "pricing"
 *
 * @see PUCK-005 in PRD for acceptance criteria
 * @see https://puckeditor.com/docs for Puck documentation
 */
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'

import { PuckEditorClient } from './client'

type PageProps = {
  params: Promise<{
    path: string[]
  }>
}

/**
 * Server component that checks authentication and renders the Puck editor.
 * Extracts the page slug from URL params and passes it to the client component.
 */
export default async function PuckEditorPage({ params }: PageProps) {
  // Check Payload authentication
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/admin/login')
  }

  // Extract slug from path params (e.g., ['about'] → 'about')
  const { path } = await params
  const slug = path?.join('/') || 'home'

  return <PuckEditorClient slug={slug} />
}

/**
 * Generate metadata for the editor page
 */
export async function generateMetadata({ params }: PageProps) {
  const { path } = await params
  const slug = path?.join('/') || 'home'

  return {
    title: `Edit: ${slug} - Puck Editor`,
    description: `Visual editor for ${slug} page`,
  }
}
