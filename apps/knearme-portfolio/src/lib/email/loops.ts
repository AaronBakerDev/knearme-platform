/**
 * Loops.so Email Marketing Integration
 *
 * Provides a typed client for the Loops API to manage contacts and subscriptions.
 * API Documentation: https://loops.so/docs/api-reference
 *
 * @example
 * ```ts
 * import { createContact, updateContact } from '@/lib/email/loops'
 *
 * // Create a new contact
 * await createContact({
 *   email: 'user@example.com',
 *   firstName: 'John',
 *   source: 'PDF Download'
 * })
 * ```
 */

const LOOPS_API_URL = 'https://app.loops.so/api/v1'

/**
 * Properties that can be set on a Loops contact
 */
export interface LoopsContactProperties {
  /** Contact's email address (required for create) */
  email: string
  /** Contact's first name */
  firstName?: string
  /** Contact's last name */
  lastName?: string
  /** Custom source identifier (replaces default "API") */
  source?: string
  /** Whether contact receives campaign emails (default: true) */
  subscribed?: boolean
  /** Segment group for the contact */
  userGroup?: string
  /** External user ID for integration */
  userId?: string
  /** Mailing list subscriptions: { listId: boolean } */
  mailingLists?: Record<string, boolean>
  /** Any additional custom properties */
  [key: string]: unknown
}

/**
 * Response from Loops API when creating a contact
 */
export interface LoopsCreateResponse {
  success: boolean
  id?: string
  message?: string
}

/**
 * Response from Loops API when updating a contact
 */
export interface LoopsUpdateResponse {
  success: boolean
  id?: string
  message?: string
}

/**
 * Error thrown when Loops API request fails
 */
export class LoopsApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: unknown
  ) {
    super(message)
    this.name = 'LoopsApiError'
  }
}

/**
 * Get the Loops API key from environment
 * @throws Error if LOOPS_API_KEY is not set
 */
function getApiKey(): string {
  const apiKey = process.env.LOOPS_API_KEY
  if (!apiKey) {
    throw new Error('LOOPS_API_KEY environment variable is not set')
  }
  return apiKey
}

/**
 * Make an authenticated request to the Loops API
 */
async function loopsRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = getApiKey()

  const response = await fetch(`${LOOPS_API_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new LoopsApiError(
      data.message || `Loops API error: ${response.status}`,
      response.status,
      data
    )
  }

  return data as T
}

/**
 * Create a new contact in Loops
 *
 * If a contact with the same email already exists, this will return a 409 error.
 * Use `upsertContact` for "create or update" behavior.
 *
 * @param properties - Contact properties including email (required)
 * @returns The created contact's ID
 * @throws LoopsApiError if contact already exists (409) or other API error
 *
 * @example
 * ```ts
 * const result = await createContact({
 *   email: 'user@example.com',
 *   firstName: 'John',
 *   source: 'Website Signup',
 *   userGroup: 'Free Trial'
 * })
 * console.log('Created contact:', result.id)
 * ```
 */
export async function createContact(
  properties: LoopsContactProperties
): Promise<LoopsCreateResponse> {
  return loopsRequest<LoopsCreateResponse>('/contacts/create', {
    method: 'POST',
    body: JSON.stringify(properties),
  })
}

/**
 * Update an existing contact in Loops
 *
 * Updates a contact identified by email or userId. If the contact doesn't exist,
 * it will be created (upsert behavior).
 *
 * @param properties - Contact properties. Must include email or userId to identify contact.
 * @returns Success response with contact ID
 *
 * @example
 * ```ts
 * await updateContact({
 *   email: 'user@example.com',
 *   firstName: 'Jane', // Update first name
 *   userGroup: 'Premium' // Change segment
 * })
 * ```
 */
export async function updateContact(
  properties: LoopsContactProperties
): Promise<LoopsUpdateResponse> {
  return loopsRequest<LoopsUpdateResponse>('/contacts/update', {
    method: 'PUT',
    body: JSON.stringify(properties),
  })
}

/**
 * Create or update a contact (upsert)
 *
 * Convenience wrapper that uses updateContact for upsert behavior.
 * This is the recommended method for most use cases.
 *
 * @param properties - Contact properties including email
 * @returns Success response with contact ID
 *
 * @example
 * ```ts
 * // Will create if new, update if exists
 * await upsertContact({
 *   email: 'user@example.com',
 *   firstName: 'John',
 *   source: 'PDF Download'
 * })
 * ```
 */
export async function upsertContact(
  properties: LoopsContactProperties
): Promise<LoopsUpdateResponse> {
  return updateContact(properties)
}

/**
 * Subscribe an email to the newsletter/mailing list
 *
 * Simplified helper for common email capture use case.
 * Creates or updates the contact with the specified source.
 *
 * @param email - Email address to subscribe
 * @param source - Source identifier (e.g., "PDF Download", "Newsletter Signup")
 * @param additionalProperties - Any additional contact properties
 * @returns Success response
 *
 * @example
 * ```ts
 * await subscribeEmail('user@example.com', 'Tool PDF Download', {
 *   firstName: 'John',
 *   toolName: 'SEO Analyzer'
 * })
 * ```
 */
export async function subscribeEmail(
  email: string,
  source: string,
  additionalProperties?: Omit<LoopsContactProperties, 'email' | 'source'>
): Promise<LoopsUpdateResponse> {
  return upsertContact({
    email,
    source,
    subscribed: true,
    ...additionalProperties,
  })
}
