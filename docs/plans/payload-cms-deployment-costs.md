# Payload CMS Deployment Cost Analysis

**Last Updated:** January 2026
**Use Case:** Marketing site with ~50 pages of content and ~500MB media files

---

## Executive Summary

For a Next.js + Supabase stack adding Payload CMS for marketing content, the **cheapest viable production option is Vercel + existing Supabase at ~$0-35/month** depending on traffic. However, this comes with serverless cold-start trade-offs. For consistent performance, **Railway at ~$10-15/month** offers the best value with persistent containers.

---

## Option 1: Vercel + Existing Supabase (Colocated)

**Architecture:** Payload runs as part of your Next.js app on Vercel, using your existing Supabase PostgreSQL for data and Supabase Storage for media.

### Costs Breakdown

| Component | Free Tier | Pro ($20/mo) | Notes |
|-----------|-----------|--------------|-------|
| **Vercel Hosting** | $0 | $20/user | Hobby = non-commercial only |
| **Serverless Functions** | 1M invocations | 1M invocations | $0.60/additional 1M |
| **Bandwidth** | 100 GB | 1 TB | Regional pricing for overages |
| **Edge Requests** | 1M | 10M | $2/additional 1M |
| **Supabase DB** | 500 MB | 8 GB ($25/mo) | $0.125/GB overage |
| **Supabase Storage** | 1 GB | 100 GB ($25/mo) | $0.021/GB overage |
| **Supabase Egress** | 5 GB | 250 GB ($25/mo) | $0.09/GB overage |

### Realistic Monthly Estimate

| Scenario | Cost |
|----------|------|
| **Hobby (non-commercial)** | $0 (if under limits) |
| **Pro (low traffic)** | $20-25/mo |
| **Pro (moderate traffic)** | $35-50/mo |

### Pros
- Zero infrastructure to manage
- Leverages existing Supabase investment
- One-click deployment via Vercel template
- Payload is fully open-source (MIT license)

### Cons
- **Cold starts**: Payload has heavy initialization; cold starts can be 2-3+ seconds
- **Database connections**: Serverless spawns many connections; can hit pool limits
- **Admin panel performance**: Relationship-heavy schemas cause dozens of parallel requests
- **Hobby tier = non-commercial**: Production sites must use Pro ($20/mo minimum)

### Hidden Costs & Gotchas
1. **Vercel Blob vs Supabase Storage**: Vercel Blob is $0.023/GB-month + $0.05/GB transfer. Supabase Storage is cheaper but requires S3 adapter configuration.
2. **Function timeouts**: Hobby = 10s, Pro = 60s. Complex Payload operations may timeout.
3. **No persistent jobs**: Payload's job queue doesn't work on Vercel without cron workarounds.

### Configuration Notes
Payload + Supabase requires:
- `@payloadcms/db-postgres` adapter
- `@payloadcms/storage-s3` for media (Supabase is S3-compatible)
- Connection pooler (Transaction mode) for serverless

---

## Option 2: Railway (Recommended for Performance)

**Architecture:** Payload runs as a persistent container on Railway, using Railway PostgreSQL or external Supabase.

### Costs Breakdown

| Component | Hobby ($5/mo) | Pro ($20/mo) | Notes |
|-----------|---------------|--------------|-------|
| **Base Plan** | $5 | $20 | Includes usage credits |
| **Memory** | ~$3-5/mo | ~$3-5/mo | 512MB-1GB typical |
| **CPU** | ~$2-4/mo | ~$2-4/mo | Light workloads |
| **PostgreSQL Volume** | ~$1-2/mo | ~$1-2/mo | 1-5GB typical |
| **Egress** | $0.05/GB | $0.05/GB | First few GB free |

**Pricing Model:**
- Memory: $0.00000386/GB-second (~$10/GB-month)
- CPU: $0.00000772/vCPU-second (~$20/vCPU-month)
- Volumes: $0.00000006/GB-second (~$0.16/GB-month)
- Object Storage: $0.015/GB-month

### Realistic Monthly Estimate

| Scenario | Cost |
|----------|------|
| **Hobby (512MB, 0.5 vCPU)** | $5-10/mo |
| **Pro (1GB, 1 vCPU)** | $10-15/mo |
| **Pro (2GB, 2 vCPU)** | $15-25/mo |

### Pros
- **No cold starts**: Persistent containers = instant responses
- **One-click PostgreSQL**: Built-in managed database
- **Usage-based**: Pay for actual utilization, not provisioned capacity
- **Simple deployment**: GitHub integration, automatic CI/CD
- **Better for admin panel**: Consistent connection pool, no timeouts

### Cons
- No permanent free tier (30-day trial only)
- Limited PostgreSQL extensions (no PostGIS, pgvector by default)
- Media storage requires external solution (Supabase Storage, Cloudflare R2)

### Hidden Costs & Gotchas
1. **Egress**: $0.05/GB can add up with high traffic
2. **Volume storage**: Cheap but not designed for media files
3. **No built-in CDN**: Need Cloudflare or similar for static assets

---

## Option 3: DigitalOcean App Platform

**Architecture:** Payload on App Platform with managed PostgreSQL and Spaces for media.

### Costs Breakdown

| Component | Cost | Notes |
|-----------|------|-------|
| **Basic Web Service** | $5-12/mo | 512MB-1GB RAM |
| **PostgreSQL (Dev)** | $7/mo | 512MB, limited connections |
| **PostgreSQL (Basic)** | $15/mo | 1GB, more connections |
| **Spaces (Object Storage)** | $5/mo | 250GB + 1TB transfer |
| **Additional Bandwidth** | $0.02/GB | After included allowance |

### Realistic Monthly Estimate

| Scenario | Cost |
|----------|------|
| **Minimal (Dev DB)** | $12-17/mo |
| **Standard (Basic DB)** | $20-27/mo |
| **With Spaces** | $25-35/mo |

### Pros
- Predictable pricing
- Integrated PostgreSQL and Spaces
- Good documentation for Next.js
- App Platform handles SSL, scaling

### Cons
- More expensive than Railway for similar specs
- Dev database has severe connection limits
- No free tier for web services (static sites only)

---

## Option 4: Render

**Architecture:** Payload on Render Web Service with Render PostgreSQL or external DB.

### Costs Breakdown

| Component | Free Tier | Paid | Notes |
|-----------|-----------|------|-------|
| **Web Service** | $0 (0.1 CPU) | $7/mo (Starter) | Free tier spins down after inactivity |
| **PostgreSQL** | 30-day free | $6/mo (256MB) | Free tier expires |
| **PostgreSQL Basic** | - | $19/mo (1GB) | Recommended for production |
| **Static Sites** | $0 | $0 | Fully free with CDN |

### Realistic Monthly Estimate

| Scenario | Cost |
|----------|------|
| **Starter + Basic DB** | $13-26/mo |
| **Standard + Basic DB** | $32-44/mo |

### Pros
- True free tier for testing (with limitations)
- Persistent containers (no cold starts)
- Free static site hosting
- Automatic deploys from GitHub

### Cons
- Free tier spins down (cold start on first request after idle)
- More expensive at scale than Railway
- PostgreSQL free tier is only 30 days
- Media storage not included (need external)

---

## Option 5: Payload Cloud (Managed)

**Architecture:** Fully managed Payload hosting with built-in database and storage.

### Costs Breakdown

| Plan | Cost | Includes |
|------|------|----------|
| **Standard** | $35/mo | Database, storage, backups |
| **Pro** | $199/mo | More resources, priority support |
| **Enterprise** | Custom | SLA, compliance features |

**Overage Pricing:**
- Database storage: $0.50/GB
- Bandwidth: $0.20/GB
- File storage: $0.02/GB

### Realistic Monthly Estimate

| Scenario | Cost |
|----------|------|
| **Standard (within limits)** | $35/mo |
| **Standard (with overages)** | $40-60/mo |

### Pros
- Zero configuration
- Automatic backups
- Official support
- Optimized for Payload

### Cons
- Most expensive option
- Less flexibility
- Vendor lock-in
- Duplicates Supabase functionality

---

## Cost Comparison Table

| Option | Monthly Cost | Pros | Cons | Best For |
|--------|--------------|------|------|----------|
| **Vercel + Supabase** | $0-35 | Zero ops, existing stack | Cold starts, connection limits | Low-traffic marketing sites |
| **Railway** | $10-15 | No cold starts, simple | No free tier, external storage | Performance-critical sites |
| **DigitalOcean** | $20-35 | Predictable, integrated | More expensive | DO-invested teams |
| **Render** | $13-26 | Free tier for testing | Spins down, DB expires | Budget-conscious startups |
| **Payload Cloud** | $35+ | Fully managed | Expensive, less flexible | Teams wanting zero ops |

---

## Recommendation

### For Your Use Case (50 pages, 500MB media, existing Supabase)

**Primary Recommendation: Railway ($10-15/mo)**
- Best performance/price ratio
- No cold start issues
- Simple to set up with existing Supabase for storage
- Usage-based means you pay for what you use

**Alternative: Vercel + Supabase ($20-25/mo on Pro)**
- If you're already heavily invested in Vercel
- Accept cold start trade-offs for admin panel
- Use Supabase Storage via S3 adapter

**Budget Option: Render ($13-26/mo)**
- Good for testing and low-traffic sites
- Be aware of 30-day PostgreSQL trial limit

---

## Free Tier Limits Summary

| Provider | What's Free | Production Viable? |
|----------|-------------|-------------------|
| **Vercel** | Hobby tier | No (non-commercial only) |
| **Supabase** | 500MB DB, 1GB storage | Maybe (pauses after 7 days inactive) |
| **Railway** | 30-day trial, $5 credits | No (trial expires) |
| **Render** | Web service (spins down), 30-day DB | No (DB expires, spin-down delays) |
| **DigitalOcean** | Static sites only | No |
| **Payload Cloud** | None | No |

**Bottom Line:** There is no truly free production option for Payload CMS. Plan for $10-35/month minimum for a viable deployment.

---

## Configuration Checklist

### For Vercel + Supabase Deployment

1. Install dependencies:
   ```bash
   npm install @payloadcms/db-postgres @payloadcms/storage-s3
   ```

2. Configure Payload with Postgres adapter:
   ```typescript
   import { postgresAdapter } from '@payloadcms/db-postgres'

   export default buildConfig({
     db: postgresAdapter({
       pool: { connectionString: process.env.DATABASE_URL }
     }),
   })
   ```

3. Configure S3 storage for Supabase:
   ```typescript
   import { s3Storage } from '@payloadcms/storage-s3'

   plugins: [
     s3Storage({
       bucket: process.env.S3_BUCKET,
       config: {
         endpoint: process.env.SUPABASE_STORAGE_ENDPOINT,
         credentials: {
           accessKeyId: process.env.S3_ACCESS_KEY_ID,
           secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
         },
         forcePathStyle: true,
       },
     }),
   ]
   ```

4. Use Supabase connection pooler in Transaction mode for serverless.

5. Enable Vercel Fluid compute for better cold start handling.

---

## Sources

- [Vercel Pricing](https://vercel.com/pricing)
- [Vercel Blob Pricing](https://vercel.com/docs/vercel-blob/usage-and-pricing)
- [Supabase Pricing](https://supabase.com/pricing)
- [Railway Pricing](https://railway.com/pricing)
- [Render Pricing](https://render.com/pricing)
- [DigitalOcean App Platform Pricing](https://docs.digitalocean.com/products/app-platform/details/pricing/)
- [Payload CMS Deployment Docs](https://payloadcms.com/docs/production/deployment)
- [Payload CMS Storage Adapters](https://payloadcms.com/docs/upload/storage-adapters)
- [Payload + Supabase Guide](https://payloadcms.com/posts/guides/setting-up-payload-with-supabase-for-your-nextjs-app-a-step-by-step-guide)
- [Supabase S3 Compatibility](https://supabase.com/docs/guides/storage/s3/compatibility)
