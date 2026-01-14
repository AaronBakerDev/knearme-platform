# Security Threat Model

> **Version:** 1.0
> **Last Updated:** December 26, 2025
> **Methodology:** STRIDE Analysis

---

## System Overview

KnearMe is a web application handling:
- **User authentication** (email/password)
- **Personal/business data** (contractor profiles)
- **User-generated content** (photos, descriptions)
- **AI processing** (external API calls)

### Trust Boundaries

```
┌──────────────────────────────────────────────────────────────────┐
│                     UNTRUSTED (Internet)                          │
│                                                                  │
│    ┌──────────────────┐                                         │
│    │  User's Browser  │ ◄── Potential attacker entry point      │
│    └────────┬─────────┘                                         │
│             │                                                    │
├─────────────┼────────────────────────────────────────────────────┤
│             │        TRUST BOUNDARY 1                            │
│             ▼                                                    │
│    ┌──────────────────────────────────────────────────┐        │
│    │              Vercel Edge (CDN/WAF)               │        │
│    └──────────────────────────────────────────────────┘        │
│             │                                                    │
├─────────────┼────────────────────────────────────────────────────┤
│             │        TRUST BOUNDARY 2                            │
│             ▼                                                    │
│    ┌──────────────────────────────────────────────────┐        │
│    │           Application (Next.js API Routes)       │        │
│    └──────────────────────────────────────────────────┘        │
│             │                                                    │
├─────────────┼────────────────────────────────────────────────────┤
│             │        TRUST BOUNDARY 3                            │
│             ▼                                                    │
│    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│    │   Supabase   │  │   Supabase   │  │ AI Providers│        │
│    │   Database   │  │   Storage    │  │ Gemini+Whisper│       │
│    └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## STRIDE Analysis

### S - Spoofing (Identity)

| Threat | Description | Likelihood | Impact | Mitigation |
|--------|-------------|------------|--------|------------|
| **S1** | Attacker creates fake contractor account | Medium | Medium | Email verification required |
| **S2** | Session hijacking via stolen JWT | Low | High | Short token expiry (1hr), refresh tokens, HTTPS only |
| **S3** | Account takeover via weak password | Medium | High | Password strength requirements, rate limiting |
| **S4** | Impersonating another contractor | Low | Medium | RLS ensures users only access own data |

### T - Tampering

| Threat | Description | Likelihood | Impact | Mitigation |
|--------|-------------|------------|--------|------------|
| **T1** | Modify another contractor's project | Low | High | RLS policies enforce ownership |
| **T2** | Tamper with uploaded images | Low | Medium | Signed upload URLs, server-side validation |
| **T3** | Manipulate AI-generated content | Low | Low | Content stored after approval, audit trail |
| **T4** | SQL injection | Low | Critical | Parameterized queries via Drizzle ORM |

### R - Repudiation

| Threat | Description | Likelihood | Impact | Mitigation |
|--------|-------------|------------|--------|------------|
| **R1** | Contractor denies publishing content | Low | Low | Timestamps, audit trail in database |
| **R2** | Dispute over content changes | Low | Low | `updated_at` timestamps on all records |

### I - Information Disclosure

| Threat | Description | Likelihood | Impact | Mitigation |
|--------|-------------|------------|--------|------------|
| **I1** | Leak contractor email addresses | Medium | Medium | Email not exposed in public API responses |
| **I2** | Expose draft projects | Low | Low | RLS only allows owner to see drafts |
| **I3** | API key exposure | Medium | Critical | Server-side only, environment variables |
| **I4** | Verbose error messages | Medium | Low | Generic error messages in production |

### D - Denial of Service

| Threat | Description | Likelihood | Impact | Mitigation |
|--------|-------------|------------|--------|------------|
| **D1** | Flood AI endpoints | Medium | High | Rate limiting (10 req/min), queue system |
| **D2** | Large file uploads | Medium | Medium | File size limits (10MB), type validation |
| **D3** | Database exhaustion | Low | High | Connection pooling, query optimization |
| **D4** | Spam account creation | Medium | Medium | Rate limiting, email verification |

### E - Elevation of Privilege

| Threat | Description | Likelihood | Impact | Mitigation |
|--------|-------------|------------|--------|------------|
| **E1** | User accesses admin functions | Low | High | No admin UI in MVP; future: role-based access |
| **E2** | Access other contractors' data | Low | High | RLS policies on all tables |
| **E3** | Bypass rate limits | Low | Medium | Server-side enforcement, IP tracking |

---

## Security Controls

### Authentication

| Control | Implementation | Status |
|---------|----------------|--------|
| Password hashing | Supabase Auth (bcrypt) | ✅ Built-in |
| Password requirements | Min 8 chars, complexity | ⬜ Configure |
| Email verification | Supabase Auth email confirm | ✅ Built-in |
| Session management | JWT + refresh tokens | ✅ Built-in |
| Token expiry | Access: 1hr, Refresh: 7 days | ⬜ Configure |
| Rate limiting (auth) | 10 attempts/minute | ⬜ Implement |

### Authorization

| Control | Implementation | Status |
|---------|----------------|--------|
| Row Level Security | Supabase RLS policies | ⬜ Define |
| Ownership validation | RLS + application checks | ⬜ Implement |
| Public vs private data | RLS SELECT policies | ⬜ Define |

### Input Validation

| Control | Implementation | Status |
|---------|----------------|--------|
| Request validation | Zod schemas | ⬜ Implement |
| File type validation | MIME type + magic bytes | ⬜ Implement |
| File size limits | 10MB per image | ⬜ Configure |
| Sanitize user input | DOMPurify for HTML | ⬜ Implement |

### Data Protection

| Control | Implementation | Status |
|---------|----------------|--------|
| HTTPS everywhere | Vercel automatic SSL | ✅ Built-in |
| Encryption at rest | Supabase (AES-256) | ✅ Built-in |
| API key security | Environment variables | ⬜ Configure |
| Secure headers | Next.js security headers | ⬜ Configure |

### Monitoring & Logging

| Control | Implementation | Status |
|---------|----------------|--------|
| Error tracking | Sentry (optional) | ⬜ Configure |
| Auth event logging | Supabase audit logs | ✅ Built-in |
| Rate limit logging | Custom middleware | ⬜ Implement |
| Security alerts | Email on suspicious activity | ⬜ Implement |

---

## Security Headers Configuration

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(self), microphone=(self), geolocation=()'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## Rate Limiting Strategy

```typescript
// middleware/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
});

export async function rateLimitMiddleware(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
  const { success, limit, remaining, reset } = await ratelimit.limit(ip);

  if (!success) {
    return new Response('Rate limit exceeded', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      },
    });
  }
}
```

---

## Content Security Policy

```typescript
// For AI-generated content display
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://*.supabase.co;
  font-src 'self';
  connect-src 'self' https://*.supabase.co https://api.openai.com;
  media-src 'self' blob:;
  frame-ancestors 'none';
`;
```

---

## Sensitive Data Inventory

| Data Type | Storage | Access | Retention |
|-----------|---------|--------|-----------|
| Email addresses | PostgreSQL | Owner + System | Account lifetime |
| Passwords | Supabase Auth | System only | Hashed, not retrievable |
| Project photos | Supabase Storage | Public (published) | Until deleted |
| Voice recordings | Supabase Storage | Owner only | Deleted after transcription |
| AI API keys | Environment vars | System only | Rotated quarterly |
| Session tokens | Cookie (httpOnly) | Client (secure) | 7 days |

---

## Incident Response Plan

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| **P1** | Data breach, service down | < 1 hour |
| **P2** | Security vulnerability found | < 4 hours |
| **P3** | Suspicious activity detected | < 24 hours |
| **P4** | Minor security improvement | Next sprint |

### Response Steps

1. **Identify** - Confirm the incident
2. **Contain** - Limit impact (disable affected accounts/features)
3. **Eradicate** - Fix the vulnerability
4. **Recover** - Restore normal service
5. **Document** - Post-mortem and lessons learned

---

## Security Checklist (Pre-Launch)

- [ ] All RLS policies tested with different user contexts
- [ ] API rate limiting active on all endpoints
- [ ] File upload validation (type, size) working
- [ ] Security headers returning correctly
- [ ] No API keys in client-side code
- [ ] Error messages don't leak internal details
- [ ] HTTPS enforced everywhere
- [ ] Password requirements configured
- [ ] Email verification enabled
- [ ] Session expiry working correctly
- [ ] Audit logging enabled for auth events

---

## References

- [OWASP STRIDE](https://owasp.org/www-community/Threat_Modeling)
- [Supabase Security](https://supabase.com/docs/guides/security)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
