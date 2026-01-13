/**
 * Payload CMS REST API Route Handler
 *
 * This catch-all route handles all Payload REST API endpoints:
 * - GET    /api/faqs       → List FAQs
 * - GET    /api/faqs/:id   → Get FAQ by ID
 * - POST   /api/faqs       → Create FAQ
 * - PATCH  /api/faqs/:id   → Update FAQ
 * - DELETE /api/faqs/:id   → Delete FAQ
 *
 * Same pattern for /api/pricing-tiers and /api/users
 *
 * @see PAY-002 in PRD for acceptance criteria
 * @see https://payloadcms.com/docs/rest-api/overview
 */
import config from '@payload-config'
import {
  REST_DELETE,
  REST_GET,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes'

/**
 * GET /api/{collection} - List documents
 * GET /api/{collection}/{id} - Get single document
 * GET /api/globals/{global} - Get global data
 */
export const GET = REST_GET(config)

/**
 * POST /api/{collection} - Create document
 * POST /api/users/login - Login
 * POST /api/users/logout - Logout
 */
export const POST = REST_POST(config)

/**
 * PATCH /api/{collection}/{id} - Update document
 */
export const PATCH = REST_PATCH(config)

/**
 * PUT /api/{collection}/{id} - Replace document
 */
export const PUT = REST_PUT(config)

/**
 * DELETE /api/{collection}/{id} - Delete document
 */
export const DELETE = REST_DELETE(config)
