/**
 * Standardized API error handling utilities.
 * Provides consistent error responses across all API routes.
 *
 * @see /docs/04-apis/api-design.md
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logging';

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'RLS_VIOLATION'
  | 'TIMEOUT'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR'
  | 'AI_SERVICE_ERROR'
  | 'STORAGE_ERROR'
  | 'PARSE_ERROR';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
  /** Optional request correlation ID for debugging */
  requestId?: string;
}

/**
 * HTTP status codes mapped to error codes.
 */
const STATUS_CODES: Record<ApiErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  RLS_VIOLATION: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  TIMEOUT: 504,
  SERVICE_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500,
  AI_SERVICE_ERROR: 503,
  STORAGE_ERROR: 502,
  PARSE_ERROR: 400,
};

export interface ErrorLogContext {
  requestId?: string;
  userId?: string;
  route: string;
  method: string;
  duration?: number;
  details?: Record<string, unknown>;
}

const SENSITIVE_KEYS = [
  'password',
  'token',
  'api_key',
  'apikey',
  'secret',
  'authorization',
  'credentials',
  'auth_key',
  'p256dh',
];

function sanitizeLogDetails(details?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!details) return undefined;

  const sanitized = { ...details };
  for (const key of Object.keys(sanitized)) {
    if (SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Structured error logger - can be swapped for external service later.
 */
/**
 * Extract error message from various error formats.
 * Handles Error instances, Supabase errors, and generic objects.
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null) {
    // Handle Supabase/PostgreSQL error format
    const errObj = error as Record<string, unknown>;
    if (typeof errObj.message === 'string') {
      return errObj.message;
    }
    // Fallback to JSON stringify for unknown object formats
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error (could not serialize)';
    }
  }
  return String(error);
}

export function logApiError(error: unknown, context: ErrorLogContext): void {
  const errorMessage = extractErrorMessage(error);
  const payload = {
    level: 'error' as const,
    requestId: context.requestId,
    route: context.route,
    method: context.method,
    duration: context.duration,
    userId: context.userId,
    details: sanitizeLogDetails(context.details),
    error: {
      message: errorMessage,
      ...(error instanceof Error && process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  };

  logger.error('API error', payload);
}

/**
 * Create a standardized error response.
 *
 * @example
 * return apiError('NOT_FOUND', 'Project not found');
 */
export function apiError(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>,
  requestId?: string
): NextResponse<{ error: ApiError }> {
  const status = STATUS_CODES[code];
  const error: ApiError = { code, message };

  if (details) {
    error.details = details;
  }

  if (requestId) {
    error.requestId = requestId;
  }

  return NextResponse.json({ error }, { status });
}

/**
 * Create a standardized success response.
 *
 * @example
 * return apiSuccess({ project });
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Create a 201 Created response with the new resource.
 */
export function apiCreated<T>(data: T): NextResponse<T> {
  return NextResponse.json(data, { status: 201 });
}

/**
 * Handle unknown errors and convert to standardized format.
 * Logs the actual error but returns a safe message to clients.
 */
export function handleApiError(
  error: unknown,
  context?: Partial<ErrorLogContext>
): NextResponse<{ error: ApiError }> {
  const requestId =
    context?.requestId ??
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  const logContext: ErrorLogContext = {
    route: context?.route ?? 'unknown',
    method: context?.method ?? 'UNKNOWN',
    duration: context?.duration,
    userId: context?.userId,
    requestId,
    details: sanitizeLogDetails(context?.details),
  };

  logApiError(error, logContext);

  // Extract error message from various formats
  const errorMessage = extractErrorMessage(error);

  // Check for known error patterns in the extracted message
  // Known Supabase/auth errors
  if (errorMessage.includes('JWT')) {
    return apiError('UNAUTHORIZED', 'Session expired. Please log in again.', undefined, requestId);
  }
  if (errorMessage.includes('duplicate key')) {
    return apiError('CONFLICT', 'This resource already exists.', undefined, requestId);
  }
  if (errorMessage.includes('violates foreign key')) {
    return apiError('VALIDATION_ERROR', 'Referenced resource not found.', undefined, requestId);
  }

  // Schema errors (like missing column)
  if (errorMessage.includes('Could not find') && errorMessage.includes('column')) {
    return apiError(
      'INTERNAL_ERROR',
      'Database schema error. Please contact support.',
      undefined,
      requestId
    );
  }

  // RLS violations
  if (
    errorMessage.includes('row-level security') ||
    errorMessage.includes('RLS') ||
    errorMessage.includes('permission denied')
  ) {
    return apiError(
      'RLS_VIOLATION',
      'You do not have access to this resource.',
      undefined,
      requestId
    );
  }

  // Timeouts
  if (
    errorMessage.toLowerCase().includes('timeout') ||
    errorMessage.includes('ETIMEDOUT') ||
    errorMessage.includes('AbortError')
  ) {
    return apiError(
      'TIMEOUT',
      'Request timed out. Please try again.',
      undefined,
      requestId
    );
  }

  // External service down
  if (
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('ENOTFOUND') ||
    errorMessage.includes('503')
  ) {
    return apiError(
      'SERVICE_UNAVAILABLE',
      'A required service is unavailable. Please try again shortly.',
      undefined,
      requestId
    );
  }

  return apiError('INTERNAL_ERROR', 'An unexpected error occurred. Please try again.', undefined, requestId);
}
