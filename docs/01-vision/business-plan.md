# Business Plan (Draft)

> Status: Draft  
> Date: January 2, 2026  
> Owner: Product

This document captures the business plan structure for KnearMe. It is a working
outline meant to be expanded with validated data and decisions.

---

## 1) One-line Summary
KnearMe turns finished projects into shareable proof that wins more jobs.

## 2) Problem
Portfolio-based businesses do great work but their proof is invisible online.
Updating a portfolio takes time they do not have, so most work never gets shown.

## 3) Solution
Make every completed job a professional project page in minutes, straight from
the job site. The owner talks, the portfolio updates, and the page is ready
to share.

## 4) Target Customer
- Primary: Established portfolio businesses who hate typing and want more trust.
- Secondary: Growth‑stage businesses who need credibility fast.

See: `docs/01-vision/personas.md`

## 5) Value Proposition
- The business’s work is the hero.
- Each job becomes visible proof.
- Trust and better jobs come from that proof, not promises.

## 6) Pricing & Packaging (Draft)
Free
- Publish up to 5 projects total
- Keep them live forever
- Voice -> Text (fair use: 30 minutes/month)

Pro ($29/month or $290/year)
- Unlimited projects
- Voice included (fair use: 200 minutes/month)
- Priority support

Fair-use caps are enforced with auto‑switch to text so work never blocks.

See: `docs/10-launch/pricing-plan-research.md`

## 7) Unit Economics (Conservative Assumptions)

Assumptions (per Pro business per month):
- 6 projects published
- 10 minutes of voice per project (Voice -> Voice average, combined input/output)
- 60 total voice minutes/month
- Payment processing cost: 5% of revenue (conservative)
- Infrastructure + storage: $1.00/user/month (conservative)

Live voice cost model:
- Audio tokens: 1,920/minute (32 tokens/sec)
- Cost per audio minute (input + output): ~$0.0288
- 60 minutes -> ~$1.73

Other AI usage:
- Image analysis + content generation + summaries: $1.50/month (conservative)

Estimated Pro COGS (conservative):
- Voice: $1.73
- Other AI: $1.50
- Infra + storage: $1.00
- Payment fees (5% of $29): $1.45
- Total COGS: ~$5.68
- Gross margin: ~$23.32 (80%)

Stress case (max fair-use: 200 voice minutes):
- Voice: ~$5.76
- Other AI + infra + fees: ~$4.0
- Total COGS: ~$9.75
- Gross margin: ~$19.25 (66%)

Takeaway:
- $29/mo remains viable with fair-use caps.
- Most users will run below the cap; abuse is the real cost risk.

## 8) LTV / CAC Placeholder (Conservative)

Assumptions:
- ARPA: $29/month
- Gross margin: 70% (conservative buffer)
- Monthly churn: 10% (conservative early‑stage)

LTV (conservative):
- LTV = (ARPA * Gross Margin) / Churn
- LTV = (29 * 0.70) / 0.10 = ~$203

Sensitivity range:
- If churn improves to 8%: LTV ~ $254
- If churn worsens to 12%: LTV ~ $169

CAC placeholders:
- Founder‑led onboarding: $0–30
- Local outreach + events: $40–80
- Paid acquisition (later): $80–150
- Blended early CAC target: <$75

Targets:
- LTV:CAC > 3.0x
- Payback period < 3 months

## 9) Go-to-Market
- Soft launch in a single metro area
- 10–20 businesses onboarded by hand
- Capture before/after proof and short testimonials

See: `docs/10-launch/launch-checklist.md`

GTM add-ons (in motion):
- Programmatic SEO for service + city pages and city hub roundups
- Review-analysis hubs for “best {service} in {city}” markets
- Content review agent to improve quality and consistency
- Network outreach for initial business cohort

## 10) SEO-First Wedge (Deeper Plan)

Thesis: indexing every project and business page creates a compounding
inventory of long‑tail pages that bring in client demand without paid ads.

Primary page types (all indexable when quality thresholds are met):
- Project detail pages: core proof asset
- Business profiles: conversion target for clients
- City hubs (roundups): content hubs built from business-generated pages
- Service + city pages: “{service} in {city}” intent
- Review-analysis hubs: “best {service} in {city}” market review analysis

Indexing policy (guardrails to avoid thin pages):
- Only index city hub roundups and service+city pages with at least N published projects.
- Keep project pages indexable by default (unique proof).
- Noindex empty or thin pages until enough proof exists.
- Use canonical tags to avoid duplicate service pages.
- Review-analysis hubs use separate thresholds (review volume/coverage), not project counts.

Internal linking rules:
- Project -> service+city -> city hub roundup -> business profile
- Review-analysis hub -> city hub roundup + top proof projects (include methodology)
- Footer or sidebar links to related cities and services

Quality rules:
- Project pages must show real photos, location, scope, and outcomes.
- Titles and descriptions should be job‑specific (avoid templated intros).
- Review-analysis hubs must include methodology, sources, and a disclaimer.
- Add JSON‑LD for LocalBusiness, Service, and Project/Article.

SEO KPIs:
- Index coverage % (Search Console)
- Impressions and clicks for top 20 service+city terms
- Project page clicks to business profiles
- Conversion events (contact or lead form in Phase 2)

## 10) Competition & Differentiation
- Not a lead marketplace
- Not a general website builder
- Built for portfolio businesses: voice-first, fast, and proof-driven

## 11) Core Offering and Expansion Path

Core offering:
- A voice-first Interviewer that turns each job into proof.
- Portfolio pages that are immediately shareable and credible.
- The business’s work is the hero; the agent does the marketing work.

Expansion path (marketing ops layer):
- Update Google Business Profile (posts, photos, business info).
- Draft review replies in the business’s voice.
- Generate social posts from published projects.
- Draft Google Business Profile posts for each new project.
- Cross-post to the business’s own website or social if connected.

This is enabled by the agent + tool architecture already in place.

## 12) Metrics
- Projects published per business per month
- Interview completion rate
- Time to first publish
- Monthly active businesses

See: `docs/01-vision/vision.md`

## 13) Risks & Mitigations
- Low adoption: reduce time-to-publish, emphasize voice, onboarding help
- Cost exposure: enforce caps, idle timeouts, silent-stream guardrails
- Quality drift: rapid regenerate + edit tools, content review agent
- SEO traction slower than expected: focus on high-intent city/service pages
- Abuse / automation: rate limiting and anomaly detection

Risk mitigation matrix (short):
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AI cost overruns | Medium | High | Fair-use caps, idle timeouts, auto-fallback to text |
| Low business adoption | Medium | High | Hand onboarding, instant proof link, 3‑minute flow |
| Content quality inconsistent | Medium | Medium | Review agent, edit UI, regeneration prompts |
| SEO traction slow | Medium | Medium | Review-analysis hubs + internal linking |
| Abuse / long idle sessions | Low | High | Push‑to‑talk default, silence cutoff, session caps |

## 14) Roadmap (High Level)
- MVP: Voice interview + publish
- Phase 2: Homeowner discovery, lead routing
- Phase 3: Integrations (Jobber, ServiceTitan)
- Phase 4: Marketing ops tools (GBP posts, review replies, social drafts)

Staged wedge -> marketing ops expansion:
1) Project page -> one-click social/GBP post draft
2) Review reply drafts using project proof and business voice
3) Google Business Profile updates (hours, services, photos) with approval
4) Cross-post to website and social channels when connected
