# Launch Checklist & Plan

> **Version:** 1.1
> **Last Updated:** January 1, 2026
> **Target Launch:** MVP Soft Launch (Denver, 20 contractors)

---

## Launch Strategy

### Soft Launch Approach

We're doing a **controlled soft launch** rather than a public launch:

1. **Launch City:** Your local metro area (easier onboarding, in-person support)
2. **Initial Contractors:** 10-20 hand-selected contractors
3. **Onboarding:** Personal outreach, walk through first project together
4. **Timeline:** 2-week soft launch before any marketing

**Why soft launch?**
- Catch bugs with real users before scale
- Iterate on UX friction points
- Build case studies for marketing
- Establish baseline metrics

---

## Pre-Launch Checklist

### 1. Infrastructure (Must Complete)

| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| Supabase project created | ⬜ | Dev | Production project |
| Database schema deployed | ⬜ | Dev | Run migrations |
| RLS policies active | ⬜ | Dev | Test with different users |
| Supabase Storage bucket created | ⬜ | Dev | `project-images` bucket |
| Gemini API key configured | ⬜ | Dev | Production key with billing |
| OpenAI Whisper key configured | ⬜ | Dev | Production key with billing |
| Vercel project deployed | ⬜ | Dev | Connected to GitHub |
| Custom domain configured | ⬜ | Dev | knearme.com (or similar) |
| SSL/TLS active | ⬜ | Auto | Via Vercel |
| Environment variables set | ⬜ | Dev | All production values |

### 2. Application (Must Complete)

| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| Auth flow working (signup/login) | ⬜ | QA | Test on mobile |
| Email verification working | ⬜ | QA | Check spam folder |
| Photo upload working | ⬜ | QA | Camera + gallery |
| Voice recording working | ⬜ | QA | iOS + Android |
| AI analysis returning results | ⬜ | QA | <10s response |
| AI generation producing content | ⬜ | QA | Quality check |
| Project publish working | ⬜ | QA | Verify public page |
| Portfolio page rendering | ⬜ | QA | Check SEO tags |
| Mobile responsive | ⬜ | QA | 375px - 428px widths |
| PWA installable | ⬜ | QA | Add to home screen |

### 3. SEO (Must Complete)

| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| sitemap.xml generating | ⬜ | Dev | Auto-updated |
| robots.txt configured | ⬜ | Dev | Allow indexing |
| Meta tags on all pages | ⬜ | QA | Title, description, OG |
| Schema.org markup | ⬜ | QA | Test with Google validator |
| Google Search Console setup | ⬜ | Dev | Submit sitemap |
| Page speed > 80 (mobile) | ⬜ | QA | Lighthouse audit |

### 4. Security (Must Complete)

| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| Rate limiting active | ⬜ | Dev | Test with load |
| Security headers configured | ⬜ | Dev | Check with securityheaders.com |
| No API keys in client code | ⬜ | Dev | Audit bundle |
| Error messages are generic | ⬜ | QA | No stack traces |
| File upload validation | ⬜ | QA | Test invalid files |

### 5. Monitoring (Should Complete)

| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| Error tracking (Sentry) | ⬜ | Dev | Optional for soft launch |
| Analytics (Vercel/Plausible) | ⬜ | Dev | Basic page views |
| Uptime monitoring | ⬜ | Dev | Simple ping |
| Database backup enabled | ⬜ | Dev | Supabase automatic |

### 6. Content & Legal (Must Complete)

| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| Privacy Policy page | ⬜ | Legal | Required for auth |
| Terms of Service page | ⬜ | Legal | Basic protection |
| Cookie notice | ⬜ | Dev | If using analytics |
| Contact email configured | ⬜ | Admin | support@knearme.com |

---

## Launch Week Timeline

### Day -7: Final Testing

- [ ] Complete E2E test suite passes
- [ ] Mobile device testing on 4+ devices
- [ ] Security audit complete
- [ ] Performance audit complete (Lighthouse)
- [ ] All critical bugs fixed

### Day -3: Staging Freeze

- [ ] Code freeze (bug fixes only)
- [ ] Deploy to staging
- [ ] Full QA pass on staging
- [ ] Prepare contractor outreach list (20 names)

### Day -1: Production Deploy

- [ ] Deploy to production
- [ ] Verify all functionality
- [ ] Test signup flow end-to-end
- [ ] DNS propagation confirmed

### Day 0: Soft Launch

- [ ] Begin personal outreach to contractors
- [ ] Goal: 3-5 contractors onboarded Day 1
- [ ] Available for real-time support
- [ ] Monitor error logs closely

### Day 1-7: Onboarding Sprint

- [ ] Daily check-ins with early contractors
- [ ] Collect feedback on friction points
- [ ] Quick iterations on critical issues
- [ ] Target: 10 contractors, 20 projects by end of week

### Day 8-14: Stabilization

- [ ] Address top 3 feedback items
- [ ] Continue onboarding
- [ ] Target: 20 contractors, 50 projects
- [ ] Begin documenting success stories

---

## Contractor Onboarding Script

### Initial Outreach (Phone/Text)

> "Hey [Name], this is [Your Name]. I'm launching a new tool that lets masonry contractors build a professional portfolio in under 5 minutes per project—just talk about the job, upload your photos, and you're done. You already do great work; this lets you show it off. I'd love to get your feedback as one of the first users. Can I walk you through it sometime this week? It's free to use."

### Onboarding Call (15 min)

1. **Explain the value prop** (1 min)
   - "Build a portfolio in under 5 minutes per project"
   - "You already did the work—now show it off"
   - "AI writes the description, you just approve"

2. **Walk through signup** (2 min)
   - Help them create account
   - Set up profile (business name, city, services)

3. **First project together** (10 min)
   - Have them take/upload photos
   - Guide through voice interview
   - Show them the generated content
   - Help them publish

4. **Collect feedback** (2 min)
   - "What was confusing?"
   - "Would you use this after every job?"
   - "What would make this more useful?"

---

## Success Criteria (Soft Launch)

### Week 1 Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Contractors onboarded | 10 | Database count |
| Projects published | 20 | Database count |
| Average time to publish | <5 min | Manual timing |
| First-try approval rate | >70% | Track regenerations |
| Critical bugs | 0 open | Issue tracker |

### Week 2 Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Contractors onboarded | 20 | Database count |
| Projects published | 50 | Database count |
| Repeat usage | 50% post 2nd project | Database |
| NPS score | >7 | Survey |
| Referral requests | 2+ | Verbal/survey |

---

## Rollback Plan

### If Critical Bug Found

1. **Assess severity** - Does it block core flow?
2. **Quick fix possible?** (<2 hours) → Fix and redeploy
3. **Complex fix needed?** → Rollback to last stable version
4. **Data corruption?** → Restore from Supabase backup

### Rollback Procedure

```bash
# Vercel instant rollback
vercel rollback [deployment-url]

# Or via dashboard:
# 1. Go to Vercel → Deployments
# 2. Click on last stable deployment
# 3. Click "Promote to Production"
```

### Communication

If rollback needed:
- Text early contractors: "We found an issue and are fixing it. Back online within [X hours]."
- No public announcement needed during soft launch

---

## Post-Launch Priorities

### Week 3-4: Polish

Based on soft launch feedback, prioritize:
1. **Fix friction points** in interview flow
2. **Improve AI prompt** for better content
3. **Mobile UX refinements**
4. **Performance optimizations**

### Month 2: Growth Prep

1. **Document case studies** (3-5 contractor success stories)
2. **SEO optimization** (target keywords showing traction)
3. **Prepare marketing materials** (if ready for wider launch)
4. **Consider Jobber integration** (if demand validated)

---

## Risk Mitigation

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| AI costs exceed budget | Medium | Set Gemini/OpenAI usage limits, monitor daily |
| Contractors don't return | High | Personal follow-up, push notifications |
| Voice recording issues on iOS | Medium | Test extensively, text fallback prominent |
| SEO doesn't gain traction | Medium | Focus on long-tail keywords, local |
| Negative feedback on AI content | Medium | Easy regeneration, editing, prompt tuning |

---

## Launch Day Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| Dev Lead | [Your contact] | On-call 8am-10pm |
| Supabase Support | support@supabase.com | Via dashboard |
| Vercel Support | support@vercel.com | Via dashboard |
| Google AI Support | ai.google.dev | Docs + support |
| OpenAI Support | help.openai.com | Ticket system (Whisper) |

---

## Post-Launch Review (Day 14)

### Questions to Answer

1. Did contractors find value? (Would they pay?)
2. What's the biggest friction point?
3. Is AI content quality acceptable?
4. Are we on track for 100 projects by Month 2?
5. What's the #1 feature request?

### Decision Points

- **Continue as planned** if targets met
- **Pivot UX** if completion rate <50%
- **Pivot AI approach** if regeneration rate >30%
- **Pause and fix** if critical bugs remain

---

*Soft launch is about learning, not perfection. Ship, learn, iterate.*
