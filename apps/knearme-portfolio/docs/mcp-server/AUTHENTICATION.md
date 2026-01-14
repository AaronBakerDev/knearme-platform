# MCP Authentication

This document describes the authentication system for the KnearMe MCP server.

## Overview

The MCP server uses JWT (JSON Web Token) authentication via Supabase. Every `tools/call` request must include a valid Bearer token in the Authorization header.

```
Authorization: Bearer <supabase-jwt>
```

## Token Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    ChatGPT      │     │   MCP Server    │     │    Supabase     │
│                 │     │   (/api/mcp)    │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │ 1. tools/call         │                       │
         │ + Bearer token        │                       │
         │──────────────────────►│                       │
         │                       │                       │
         │                       │ 2. Validate JWT       │
         │                       │ (verify signature)    │
         │                       │                       │
         │                       │ 3. Extract            │
         │                       │ contractor_id         │
         │                       │                       │
         │                       │ 4. Query with RLS     │
         │                       │──────────────────────►│
         │                       │                       │
         │                       │◄──────────────────────│
         │                       │ 5. Return data        │
         │◄──────────────────────│                       │
         │ 6. Tool result        │                       │
         │                       │                       │
```

## Token Validation

The server validates tokens using the `src/lib/mcp/token-validator.ts` module.

### Validation Steps

1. **Extract token** from `Authorization: Bearer <token>` header
2. **Verify JWT signature** using Supabase JWT secret
3. **Check expiration** - tokens must not be expired
4. **Extract claims** - get `sub` (user_id) and custom claims

### Required Claims

| Claim | Description |
|-------|-------------|
| `sub` | Supabase user ID (auth.users.id) |
| `contractor_id` | Contractor UUID from contractors table |
| `exp` | Expiration timestamp |

### Token Payload Example

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "contractor_id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "contractor@example.com",
  "role": "authenticated",
  "exp": 1704067200
}
```

## Implementation

### Token Validator

```typescript
// src/lib/mcp/token-validator.ts

import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

export async function validateToken(token: string): Promise<{
  success: true;
  payload: { contractor_id: string; user_id: string };
} | {
  success: false;
  error: string;
}> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const contractorId = payload.contractor_id as string;
    const userId = payload.sub as string;

    if (!contractorId) {
      return { success: false, error: 'Missing contractor_id claim' };
    }

    return {
      success: true,
      payload: { contractor_id: contractorId, user_id: userId }
    };
  } catch (error) {
    return { success: false, error: 'Invalid or expired token' };
  }
}
```

### Auth Context

Once validated, the token creates an `AuthContext` passed to tool handlers:

```typescript
interface AuthContext {
  contractorId: string;
  accessToken: string;
}
```

Tools use `contractorId` to scope all database queries.

## Row Level Security (RLS)

The database uses Supabase RLS policies to enforce data access:

```sql
-- Contractors can only see their own projects
CREATE POLICY "contractors_own_projects" ON projects
  FOR ALL
  USING (contractor_id = auth.uid()::uuid);

-- Contractors can only manage their own images
CREATE POLICY "contractors_own_images" ON project_images
  FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE contractor_id = auth.uid()::uuid
    )
  );
```

## Error Responses

Authentication errors return JSON-RPC error responses:

### Missing Token

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32000,
    "message": "Authorization header required",
    "data": { "requiresAuth": true }
  }
}
```

### Invalid Token

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32000,
    "message": "Invalid or expired token",
    "data": { "requiresAuth": true }
  }
}
```

### Missing Contractor ID

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32000,
    "message": "Missing contractor_id claim",
    "data": { "requiresAuth": true }
  }
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_JWT_SECRET` | Secret for verifying JWT signatures |

**Important:** Never expose this secret in client-side code.

## Development

For local development, you can generate test tokens:

```typescript
// scripts/generate-test-token.ts
import { SignJWT } from 'jose';

const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);

const token = await new SignJWT({
  sub: 'test-user-id',
  contractor_id: 'test-contractor-id',
  role: 'authenticated'
})
  .setProtectedHeader({ alg: 'HS256' })
  .setExpirationTime('1h')
  .sign(secret);

console.log(token);
```

## Security Best Practices

1. **Never log tokens** - Tokens contain sensitive claims
2. **Use short expiration** - Supabase tokens expire in 1 hour by default
3. **Refresh tokens** - Use Supabase SDK to refresh tokens before expiry
4. **Validate on every request** - Don't cache auth state server-side
5. **Use HTTPS** - Always transmit tokens over encrypted connections
6. **Scope queries** - Always filter by `contractor_id` in database queries
