/**
 * CORS Utilities for Meta Graph Worker
 *
 * Environment-based CORS configuration:
 * - Development: Allow all origins (*)
 * - Production: Restrict to admin.fixmybrick.ca
 *
 * @module utils/cors
 * @see https://developers.cloudflare.com/workers/examples/cors-header-proxy
 */

import type { Env } from '../types';

/**
 * Allowed origins for production
 * Add additional domains as needed
 */
const PRODUCTION_ORIGINS = [
  'https://admin.fixmybrick.ca',
  'https://www.admin.fixmybrick.ca',
  'https://fixmybrick.ca',
];

/**
 * Get CORS headers based on environment
 *
 * @param env - Environment configuration
 * @param origin - Request origin header (optional)
 * @returns CORS headers object
 */
export function getCorsHeaders(
  env: Env,
  origin?: string | null
): Record<string, string> {
  // Development mode: allow all origins
  if (env.NODE_ENV === 'development') {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    };
  }

  // Production mode: validate origin
  const allowedOrigin =
    origin && PRODUCTION_ORIGINS.includes(origin)
      ? origin
      : PRODUCTION_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Create CORS preflight response
 *
 * @param env - Environment configuration
 * @param origin - Request origin header
 * @returns Response object for OPTIONS request
 */
export function createCorsPreflightResponse(
  env: Env,
  origin?: string | null
): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(env, origin),
  });
}

/**
 * Check if origin is allowed
 *
 * @param origin - Origin to check
 * @param env - Environment configuration
 * @returns True if origin is allowed
 */
export function isOriginAllowed(origin: string | null, env: Env): boolean {
  if (env.NODE_ENV === 'development') {
    return true;
  }
  return origin !== null && PRODUCTION_ORIGINS.includes(origin);
}
