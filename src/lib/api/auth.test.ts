/**
 * Unit tests for authentication utilities.
 *
 * Tests session auth (requireAuth, requireAuthBusiness), bearer token auth
 * (requireAuthUnified, requireAuthUnifiedBusiness), and helper functions.
 *
 * @see src/lib/api/auth.ts
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  requireAuth,
  requireAuthBusiness,
  requireAuthUnified,
  requireAuthUnifiedBusiness,
  isAuthError,
  isBusinessAuthError,
  getAuthClient,
  getAuthClientBusiness,
  type AuthResult,
  type BusinessAuthResult,
  type AuthError,
} from './auth';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createMockDb, createMockSupabase } from '@/lib/testing/supabase-mock';
import type { Contractor, Business } from '@/types/database';

// Mock jose for JWT operations
vi.mock('jose', () => ({
  importSPKI: vi.fn(),
  jwtVerify: vi.fn(),
  errors: {
    JWTExpired: class JWTExpired extends Error {
      name = 'JWTExpired';
    },
    JWTInvalid: class JWTInvalid extends Error {
      name = 'JWTInvalid';
    },
    JWSSignatureVerificationFailed: class JWSSignatureVerificationFailed extends Error {
      name = 'JWSSignatureVerificationFailed';
    },
  },
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));


vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}));

// =============================================================================
// Tests
// =============================================================================

describe('auth utilities', () => {
  let db: ReturnType<typeof createMockDb>;
  const defaultUser = { id: 'user-1', email: 'test@example.com' };

  beforeEach(() => {
    db = createMockDb();
    vi.clearAllMocks();
  });

  const mockSessionClient = (user: { id: string; email: string } | null) => {
    const client = createMockSupabase(db, user);
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);
    return client;
  };

  // ---------------------------------------------------------------------------
  // isAuthError / isBusinessAuthError
  // ---------------------------------------------------------------------------

  describe('isAuthError', () => {
    it('returns true for AuthError objects', () => {
      const error: AuthError = { type: 'UNAUTHORIZED', message: 'Not logged in' };
      expect(isAuthError(error)).toBe(true);
    });

    it('returns false for AuthResult objects', () => {
      const result: AuthResult = {
        user: { id: 'user-1', email: 'test@example.com' },
        contractor: { id: 'c-1' } as Contractor,
        authMethod: 'session',
      };
      expect(isAuthError(result)).toBe(false);
    });
  });

  describe('isBusinessAuthError', () => {
    it('returns true for AuthError objects', () => {
      const error: AuthError = { type: 'PROFILE_INCOMPLETE', message: 'Setup required' };
      expect(isBusinessAuthError(error)).toBe(true);
    });

    it('returns false for BusinessAuthResult objects', () => {
      const result: BusinessAuthResult = {
        user: { id: 'user-1', email: 'test@example.com' },
        business: { id: 'b-1' } as Business,
        authMethod: 'session',
      };
      expect(isBusinessAuthError(result)).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // requireAuth
  // ---------------------------------------------------------------------------

  describe('requireAuth', () => {
    it('returns UNAUTHORIZED when user is not logged in', async () => {
      mockSessionClient(null);

      const result = await requireAuth();

      expect(isAuthError(result)).toBe(true);
      expect((result as AuthError).type).toBe('UNAUTHORIZED');
      expect((result as AuthError).message).toBe('Authentication required. Please log in.');
    });

    it('returns UNAUTHORIZED when contractor profile not found', async () => {
      mockSessionClient(defaultUser);
      // db.contractors is empty

      const result = await requireAuth();

      expect(isAuthError(result)).toBe(true);
      expect((result as AuthError).type).toBe('UNAUTHORIZED');
      expect((result as AuthError).message).toBe('Contractor profile not found.');
    });

    it('returns PROFILE_INCOMPLETE when business_name is missing', async () => {
      db.contractors.push({
        id: 'c-1',
        auth_user_id: 'user-1',
        business_name: null,
        city: 'Denver',
      });
      mockSessionClient(defaultUser);

      const result = await requireAuth();

      expect(isAuthError(result)).toBe(true);
      expect((result as AuthError).type).toBe('PROFILE_INCOMPLETE');
    });

    it('returns PROFILE_INCOMPLETE when city is missing', async () => {
      db.contractors.push({
        id: 'c-1',
        auth_user_id: 'user-1',
        business_name: 'Acme Masonry',
        city: null,
      });
      mockSessionClient(defaultUser);

      const result = await requireAuth();

      expect(isAuthError(result)).toBe(true);
      expect((result as AuthError).type).toBe('PROFILE_INCOMPLETE');
    });

    it('returns AuthResult with contractor when profile is complete', async () => {
      const contractor = {
        id: 'c-1',
        auth_user_id: 'user-1',
        business_name: 'Acme Masonry',
        city: 'Denver',
        email: 'test@example.com',
      };
      db.contractors.push(contractor);
      mockSessionClient(defaultUser);

      const result = await requireAuth();

      expect(isAuthError(result)).toBe(false);
      const authResult = result as AuthResult;
      expect(authResult.user.id).toBe('user-1');
      expect(authResult.user.email).toBe('test@example.com');
      expect(authResult.contractor.id).toBe('c-1');
      expect(authResult.authMethod).toBe('session');
    });

    it('handles missing email gracefully', async () => {
      db.contractors.push({
        id: 'c-1',
        auth_user_id: 'user-1',
        business_name: 'Acme Masonry',
        city: 'Denver',
      });
      mockSessionClient({ id: 'user-1', email: undefined as unknown as string });

      const result = await requireAuth();

      expect(isAuthError(result)).toBe(false);
      expect((result as AuthResult).user.email).toBe('');
    });

    // -------------------------------------------------------------------------
    // Empty string edge cases (Critical #3)
    // -------------------------------------------------------------------------

    it('returns PROFILE_INCOMPLETE when business_name is empty string', async () => {
      db.contractors.push({
        id: 'c-1',
        auth_user_id: 'user-1',
        business_name: '',
        city: 'Denver',
      });
      mockSessionClient(defaultUser);

      const result = await requireAuth();

      expect(isAuthError(result)).toBe(true);
      expect((result as AuthError).type).toBe('PROFILE_INCOMPLETE');
    });

    it('returns PROFILE_INCOMPLETE when city is empty string', async () => {
      db.contractors.push({
        id: 'c-1',
        auth_user_id: 'user-1',
        business_name: 'Acme Masonry',
        city: '',
      });
      mockSessionClient(defaultUser);

      const result = await requireAuth();

      expect(isAuthError(result)).toBe(true);
      expect((result as AuthError).type).toBe('PROFILE_INCOMPLETE');
    });

    // -------------------------------------------------------------------------
    // Exception handling tests (Important #9)
    // -------------------------------------------------------------------------

    it('returns UNAUTHORIZED when getUser() returns an error', async () => {
      const client = createMockSupabase(db, null);
      client.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Network error', status: 500 },
      });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

      const result = await requireAuth();

      expect(isAuthError(result)).toBe(true);
      expect((result as AuthError).type).toBe('UNAUTHORIZED');
    });

    it('returns UNAUTHORIZED when contractor query returns an error', async () => {
      // Create a client with custom from() that returns an error
      const client = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-1', email: 'test@example.com' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'INTERNAL_ERROR', message: 'Database error' },
            }),
          }),
        }),
      };
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

      const result = await requireAuth();

      expect(isAuthError(result)).toBe(true);
      expect((result as AuthError).type).toBe('UNAUTHORIZED');
      expect((result as AuthError).message).toBe('Contractor profile not found.');
    });
  });

  // ---------------------------------------------------------------------------
  // requireAuthBusiness
  // ---------------------------------------------------------------------------

  describe('requireAuthBusiness', () => {
    it('returns UNAUTHORIZED when user is not logged in', async () => {
      mockSessionClient(null);

      const result = await requireAuthBusiness();

      expect(isBusinessAuthError(result)).toBe(true);
      expect((result as AuthError).type).toBe('UNAUTHORIZED');
    });

    it('returns UNAUTHORIZED when business profile not found', async () => {
      mockSessionClient(defaultUser);
      // db.businesses is empty

      const result = await requireAuthBusiness();

      expect(isBusinessAuthError(result)).toBe(true);
      expect((result as AuthError).type).toBe('UNAUTHORIZED');
      expect((result as AuthError).message).toBe('Business profile not found.');
    });

    it('returns PROFILE_INCOMPLETE when name is missing', async () => {
      db.businesses.push({
        id: 'b-1',
        auth_user_id: 'user-1',
        name: null,
      });
      mockSessionClient(defaultUser);

      const result = await requireAuthBusiness();

      expect(isBusinessAuthError(result)).toBe(true);
      expect((result as AuthError).type).toBe('PROFILE_INCOMPLETE');
    });

    it('returns BusinessAuthResult when profile is complete', async () => {
      const business = {
        id: 'b-1',
        auth_user_id: 'user-1',
        name: 'Acme Business',
        email: 'test@example.com',
      };
      db.businesses.push(business);
      mockSessionClient(defaultUser);

      const result = await requireAuthBusiness();

      expect(isBusinessAuthError(result)).toBe(false);
      const authResult = result as BusinessAuthResult;
      expect(authResult.user.id).toBe('user-1');
      expect(authResult.user.email).toBe('test@example.com');
      expect(authResult.business.id).toBe('b-1');
      expect(authResult.authMethod).toBe('session');
    });

    // -------------------------------------------------------------------------
    // Empty string edge cases (Critical #3)
    // -------------------------------------------------------------------------

    it('returns PROFILE_INCOMPLETE when name is empty string', async () => {
      db.businesses.push({
        id: 'b-1',
        auth_user_id: 'user-1',
        name: '',
      });
      mockSessionClient(defaultUser);

      const result = await requireAuthBusiness();

      expect(isBusinessAuthError(result)).toBe(true);
      expect((result as AuthError).type).toBe('PROFILE_INCOMPLETE');
    });
  });

  // ---------------------------------------------------------------------------
  // getAuthClient / getAuthClientBusiness
  // ---------------------------------------------------------------------------

  describe('getAuthClient', () => {
    it('returns regular client for session auth', async () => {
      const mockClient = { type: 'regular' };
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockClient);

      const authResult: AuthResult = {
        user: { id: 'user-1', email: 'test@example.com' },
        contractor: { id: 'c-1' } as Contractor,
        authMethod: 'session',
      };

      const client = await getAuthClient(authResult);

      expect(client).toBe(mockClient);
      expect(createClient).toHaveBeenCalled();
      expect(createAdminClient).not.toHaveBeenCalled();
    });

    it('returns admin client for bearer auth', async () => {
      const mockAdminClient = { type: 'admin' };
      (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockAdminClient);

      const authResult: AuthResult = {
        user: { id: 'user-1', email: 'test@example.com' },
        contractor: { id: 'c-1' } as Contractor,
        authMethod: 'bearer',
      };

      const client = await getAuthClient(authResult);

      expect(client).toBe(mockAdminClient);
      expect(createAdminClient).toHaveBeenCalled();
    });
  });

  describe('getAuthClientBusiness', () => {
    it('returns regular client for session auth', async () => {
      const mockClient = { type: 'regular' };
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockClient);

      const authResult: BusinessAuthResult = {
        user: { id: 'user-1', email: 'test@example.com' },
        business: { id: 'b-1' } as Business,
        authMethod: 'session',
      };

      const client = await getAuthClientBusiness(authResult);

      expect(client).toBe(mockClient);
      expect(createClient).toHaveBeenCalled();
    });

    it('returns admin client for bearer auth', async () => {
      const mockAdminClient = { type: 'admin' };
      (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockAdminClient);

      const authResult: BusinessAuthResult = {
        user: { id: 'user-1', email: 'test@example.com' },
        business: { id: 'b-1' } as Business,
        authMethod: 'bearer',
      };

      const client = await getAuthClientBusiness(authResult);

      expect(client).toBe(mockAdminClient);
      expect(createAdminClient).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // requireAuthUnified (Bearer + Session fallback for contractors)
  // ---------------------------------------------------------------------------

  describe('requireAuthUnified', () => {
    let headersModule: typeof import('next/headers');

    beforeEach(async () => {
      headersModule = await import('next/headers');
    });

    it('falls back to session auth when no Authorization header', async () => {
      const mockHeaders = new Map<string, string>();
      (headersModule.headers as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: (key: string) => mockHeaders.get(key),
      });

      const contractor = {
        id: 'c-1',
        auth_user_id: 'user-1',
        business_name: 'Acme Masonry',
        city: 'Denver',
      };
      db.contractors.push(contractor);
      mockSessionClient(defaultUser);

      const result = await requireAuthUnified();

      expect(isAuthError(result)).toBe(false);
      expect((result as AuthResult).authMethod).toBe('session');
    });

    it('falls back to session auth when Authorization header is not Bearer format', async () => {
      const mockHeaders = new Map([['authorization', 'Basic dXNlcjpwYXNz']]);
      (headersModule.headers as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: (key: string) => mockHeaders.get(key),
      });

      const contractor = {
        id: 'c-1',
        auth_user_id: 'user-1',
        business_name: 'Acme Masonry',
        city: 'Denver',
      };
      db.contractors.push(contractor);
      mockSessionClient(defaultUser);

      const result = await requireAuthUnified();

      // Falls back to session auth (not an error if session is valid)
      expect(isAuthError(result)).toBe(false);
      expect((result as AuthResult).authMethod).toBe('session');
    });
  });

  // ---------------------------------------------------------------------------
  // requireAuthUnifiedBusiness (Bearer + Session fallback for businesses)
  // ---------------------------------------------------------------------------

  describe('requireAuthUnifiedBusiness', () => {
    let headersModule: typeof import('next/headers');

    beforeEach(async () => {
      headersModule = await import('next/headers');
    });

    it('falls back to session auth when no Authorization header', async () => {
      const mockHeaders = new Map<string, string>();
      (headersModule.headers as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: (key: string) => mockHeaders.get(key),
      });

      const business = {
        id: 'b-1',
        auth_user_id: 'user-1',
        name: 'Acme Business',
      };
      db.businesses.push(business);
      mockSessionClient(defaultUser);

      const result = await requireAuthUnifiedBusiness();

      expect(isBusinessAuthError(result)).toBe(false);
      expect((result as BusinessAuthResult).authMethod).toBe('session');
    });
  });
});

// =============================================================================
// Bearer Token Tests (separate describe block with env setup)
// =============================================================================
// These tests require JWT_PUBLIC_KEY to be set. Since the auth module reads
// this at import time, we use a separate describe block that can be configured
// in a test setup file, or we test the behavior when the key is NOT configured.

describe('bearer token auth (JWT_PUBLIC_KEY not configured)', () => {
  let headersModule: typeof import('next/headers');

  beforeEach(async () => {
    vi.clearAllMocks();
    headersModule = await import('next/headers');
  });

  it('requireAuthUnified returns UNAUTHORIZED when Bearer token present but no public key', async () => {
    const mockHeaders = new Map([['authorization', 'Bearer some.jwt.token']]);
    (headersModule.headers as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: (key: string) => mockHeaders.get(key),
    });

    const result = await requireAuthUnified();

    expect(isAuthError(result)).toBe(true);
    expect((result as AuthError).type).toBe('UNAUTHORIZED');
    expect((result as AuthError).message).toBe('Server configuration error.');
  });

  it('requireAuthUnifiedBusiness returns UNAUTHORIZED when Bearer token present but no public key', async () => {
    const mockHeaders = new Map([['authorization', 'Bearer some.jwt.token']]);
    (headersModule.headers as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: (key: string) => mockHeaders.get(key),
    });

    const result = await requireAuthUnifiedBusiness();

    expect(isBusinessAuthError(result)).toBe(true);
    expect((result as AuthError).type).toBe('UNAUTHORIZED');
    expect((result as AuthError).message).toBe('Server configuration error.');
  });
});
